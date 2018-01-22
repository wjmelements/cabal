// TODO fetch
var proposals = [
    {
        cases:[
            {
                text:"The world is flat",
                voteCount:13,
                position:0,
                index:0
            },
            {
                text:"ayy",
                voteCount:4,
                position:1,
                index:1
            },
            {
                text:"lmao",
                voteCount:3,
                position:1,
                index:2
            },
            {
                text:"wording",
                voteCount:2,
                position:2,
                index:3
            },
            {
                text:"boo",
                voteCount:5,
                position:3,
                index:4
            },
            {
                text:"lol",
                voteCount:1,
                position:4,
                index:5
            }
        ],
    },
];
proposals[0].casesByPosition = [
    [
    ],
    [
        proposals[0].cases[1],
        proposals[0].cases[2]
    ],
    [
        proposals[0].cases[3]
    ],
    [
        proposals[0].cases[4]
    ],
    [
        proposals[0].cases[5]
    ]
];
Cabal = {
    arguments(proposalId, position, inverted) {
        var proposal = proposals[proposalId];
        if (!inverted) {
            return proposal.casesByPosition[position];
        }
        var inverse = [];
        for (var pos = 0; pos < 4; pos++) {
            if (pos == position) {
                continue;
            }
            inverse = inverse.concat(proposal.casesByPosition[pos]);
        }
        inverse.sort(function (a,b) {
            return b.voteCount - a.voteCount;
        });
        return inverse;
    },
    argument(proposalId, argumentId) {
        return proposals[proposalId].cases[argumentId];
    },
}
