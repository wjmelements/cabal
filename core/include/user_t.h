#ifndef user_t
#define user_t user_t

#include <stdint.h>

typedef struct user {
    uint32_t version;
    uint32_t reserved32;
    uint64_t activityHash;
} user_t;
#endif
