var proposals = [
    {
        arguments:[
            [
                {
                    text:"ayy",
                    voteCount:4,
                    position:0
                },
                {
                    text:"lmao",
                    voteCount:3,
                    position:0
                }
            ],
            [
                {
                    text:"wording",
                    voteCount:2,
                    position:1
                }
            ],
            [
                {
                    text:"boo",
                    voteCount:5,
                    position:2
                }
            ],
            [
                {
                    text:"lol",
                    voteCount:1,
                    position:3
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
            return a.voteCount - b.voteCount;
        });
        return inverse;
    }
}
