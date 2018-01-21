var proposals = [
    {
        arguments:[
            [
            ],
            [
                {
                    text:"ayy",
                    voteCount:4,
                    position:1
                },
                {
                    text:"lmao",
                    voteCount:3,
                    position:1
                }
            ],
            [
                {
                    text:"wording",
                    voteCount:2,
                    position:2
                }
            ],
            [
                {
                    text:"boo",
                    voteCount:5,
                    position:3
                }
            ],
            [
                {
                    text:"lol",
                    voteCount:1,
                    position:4
                }
            ]
        ]
    },
];// TODO fetch
Cabal = {
    arguments(proposalId, position, inverted) {
        var proposal = proposals[proposalId];
        if (!inverted) {
            return proposal.arguments[position];
        }
        var inverse = [];
        for (var pos = 0; pos < 4; pos++) {
            if (pos == position) {
                continue;
            }
            inverse = inverse.concat(proposal.arguments[pos]);
        }
        inverse.sort(function (a,b) {
            return b.voteCount - a.voteCount;
        });
        return inverse;
    }
}
