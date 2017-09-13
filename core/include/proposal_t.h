#include "userid_t.h"
typedef uint64_t proposalid_t;
typedef struct proposal {
    uint32_t version;
    uint32_t reserved32;
    proposalid_t id;
    userid_t creator;
    uint64_t positionCounts[5];
    uint64_t reserved64[8];
    unsigned char text[384];
} proposal_t;
