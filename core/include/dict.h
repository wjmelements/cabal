#ifndef scion_map_h
#define scion_map_h

#include <atomic>
using std::atomic;
#include <functional>
using std::hash;
using std::pair;
#include <stack>
using std::stack;
#include <stdint.h>
#include <stdlib.h>
#include <strings.h>
#include <unistd.h>

#include "optional.h"

/*
 * Assumptions:
 ** std::hash<K>
 ** K(K&)
 ** ==(K&,K&)
 ** V fits in register
 */
template <typename K, typename V, size_t N = 4, size_t C = 2> class dict {

    struct node : pair<K,atomic<V> > {
        atomic<uint64_t> generation;
        unsigned long hash;
        optional<V> get() {
            optional<V> ret;
            const uint64_t curr_gen = this->generation.load(std::memory_order_acquire);
            if ((curr_gen & 1)) {
                ret.valid = false;
                return ret;
            }
            ret.value = this->second.load(std::memory_order_acquire);  
            const uint64_t next_gen = this->generation.load(std::memory_order_acquire);
            ret.valid = next_gen == curr_gen;
            return ret;
        }
        void put(V value) {
            uint64_t curr_gen = this->generation.load(std::memory_order_acquire);
            this->second.store(value, std::memory_order_release);
            if (curr_gen & 1) {
                this->generation.compare_exchange_strong(curr_gen, curr_gen + 1, std::memory_order_release, std::memory_order_relaxed);
            }
        }
        void remove() {
            this->generation.fetch_or(1, std::memory_order_release);
        }
    };

    struct table_t {
        atomic<node*> entries[N*C];
        inline atomic<node*>* get_entries(size_t rowIndex) {
            return &entries[rowIndex*C];
        }
        inline const atomic<node*>* get_entries(size_t rowIndex) const {
            return &entries[rowIndex*C];
        }
        atomic<table_t*> nexts[N];
        table_t() {
            bzero(this, sizeof(*this));
        }
        // construct a table from a row
        table_t(const atomic<node*>* old_entries, unsigned long divisor) {
            bzero(this, sizeof(*this));
            // TODO do not allocate full table when not rehashing
            if (divisor && N != 1) {
                // rehash
                for (size_t i = 0; i < C; i++) {
                    node* to_place = old_entries[i].load(std::memory_order_relaxed);
                    const unsigned long hash = to_place->hash;
                    const unsigned long row = (hash / divisor) % N;
                    unsigned long col = 0;
                    atomic<node*>* entries = get_entries(row);
                    while (entries[col].load(std::memory_order_relaxed)) {
                        col++;
                    }
                    entries[col].store(to_place, std::memory_order_relaxed);
                }
            }
        }
            
        ~table_t() {
        }

        void purge(size_t denom) {
            for (size_t i = 0; i < N; i++) {
                table_t* next_table = nexts[i].load(std::memory_order_relaxed);
                if (next_table) {
                    next_table->purge(denom * N);
                    delete next_table;
                } 
                if (!next_table || !denom || N == 1) {
                    atomic<node*>* curr_entries = get_entries(i);
                    for (size_t j = 0; j < C; j++) {
                        node* curr_node = curr_entries[j].load(std::memory_order_relaxed);
                        if (!curr_node) {
                            break;
                        }
                        free(curr_node);
                    }
                }
            }
        }
    };
    protected:
        static hash<K> hash_fn;
        table_t table;
public:
        dict();
        ~dict();
        // unconditional put; return previous value
        void put(K key, V value);
        // read current
        optional<V> get(K key) const;
        // remove
        void remove(K key);
        // TODO CAS
        optional<bool> compare_exchange_strong(K key, V& expected, V desired);
        // optimized key editing
        node* find(K key) const;
        // TODO iteration
};
template <typename K, typename V, size_t N, size_t C> dict<K,V,N,C>::dict() {
}
template <typename K, typename V, size_t N, size_t C> dict<K,V,N,C>::~dict() {
    table.purge(N);
}
template <typename K, typename V, size_t N, size_t C> void dict<K,V,N,C>::put(K key, V value) {
    struct optional<V> ret;
    const size_t hash = hash_fn(key);
    size_t remainingHash = hash;
    size_t divisor = 1;
    table_t* curr_table = &table;
    node* put = NULL;
    while (1) {
        size_t rowIndex;
        do {
            rowIndex = remainingHash % N;
            // shortcut table traversal
            table_t* next = curr_table->nexts[rowIndex].load(std::memory_order_relaxed);
            if (!next || !divisor || N == 1) {
                break;
            }
            curr_table = next;
            divisor *= N;
            remainingHash = remainingHash / N;
        } while(1);
        atomic<node*>* entries = curr_table->get_entries(rowIndex);
        for (size_t i = 0; i < C; i++) {
            node* curr = entries[i].load(std::memory_order_relaxed);
            if (!curr) {
                // try to put
                if (!put) {
                    // lazily create node for insertion
                    put = (node*) malloc(sizeof(node));
                    put->first = key;
                    put->second.store(value, std::memory_order_relaxed);
                    put->generation.store(0, std::memory_order_relaxed);
                    put->hash = hash;
                }
                if (entries[i].compare_exchange_strong(curr, put, std::memory_order_release, std::memory_order_relaxed)) {
                    // successfully inserted a new node
                    return;
                }
            }
            if (curr->first == key) {
                // found existing node; update value
                curr->put(value);
                // cleanup possibly created but ultimately unnecessary node
                if (put) {
                    free(put);
                }
                return;
            }
        }
        table_t* next = curr_table->nexts[rowIndex].load(std::memory_order_relaxed);
        divisor *= N;
        // on to next table
        if (!next) {
            table_t* created = new table_t(entries, divisor);
            if (curr_table->nexts[rowIndex].compare_exchange_strong(next, created, std::memory_order_release, std::memory_order_relaxed)) {
                // successfully established the migrated table
                next = created;
            } else {
                // another thread established the table first
                // next has already been assigned to the new table by compare_exchange_strong
                delete created;
            }
        }
        remainingHash = remainingHash / N; // each level of the table
        curr_table = next;
    }
}

template <typename K, typename V, size_t N, size_t C> typename dict<K,V,N,C>::node* dict<K,V,N,C>::find(K key) const {
    const size_t hash = hash_fn(key);
    size_t remainingHash = hash;
    const table_t* curr_table = &table;
    size_t rowIndex;
    size_t divisor = 1; // to see if end of rehashing is reached
    do {
        // fast table traversal
        rowIndex = remainingHash % N;
        table_t* next_table = curr_table->nexts[rowIndex].load(std::memory_order_relaxed);
        divisor *= N;
        if (!next_table || !divisor || N == 1) {
            break;
        }
        curr_table = next_table;
        remainingHash = remainingHash / N;
    } while (1);

    do {
        const atomic<node*>* entries = curr_table->get_entries(rowIndex);
        for (size_t i = 0; i < C; i++) {
            node* curr = entries[i].load(std::memory_order_relaxed);
            if (!curr) {
                // did not find
                return NULL;
            }
            if (curr->first == key) {
                // found
                return curr;
            }
        }
        // any table creation that occurs after table traversal linearizes
        // after this find operation
        if (divisor && N != 1) {
            // did not find
            return NULL;
        }
        // tables with one row act as shitty linked-array-sets
        // a divisor of zero indicates a hash collision chain longer than C,
        // which works like a table with one row except with FIXME wasted space
        curr_table = curr_table->nexts[0].load(std::memory_order_relaxed);
    } while (curr_table);
    return NULL;
}
template <typename K, typename V, size_t N, size_t C> optional<V> dict<K,V,N,C>::get(K key) const {
    node* found = find(key);
    if (found) {
        return found->get();
    }
    optional<V> ret;
    ret.valid = false;
    return ret;
}
template <typename K, typename V, size_t N, size_t C> void dict<K,V,N,C>::remove(K key) {
    node* found = find(key);
    if (found) {
        found->remove();
    }
}
#endif
