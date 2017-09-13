#ifndef user_t
#define user_t user_t

#include "userid_t.h"

typedef struct user {
    uint32_t version;
    uint32_t reserved32;
    userid_t id;
    uint64_t reserved64;
} user_t;
#endif
