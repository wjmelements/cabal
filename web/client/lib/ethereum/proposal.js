// hardcoded utf8
function bytesToStr(bytes) {
    var str = "";
    for (var i = 2; i < bytes.length; i+=2) {
        var codePoint = parseInt(bytes.substring(i, i+2), 16);
        if (codePoint >= 128) {
            i+=2;
            codePoint -= 192;
            codePoint <<= 6;
            codePoint |= parseInt(bytes.substring(i, i+2), 16)-128;
            if (codePoint >= 2048) {
                i+=2;
                codePoint -= 2048;
                codePoint <<= 6;
                codePoint |= parseInt(bytes.substring(i, i+2), 16)-128;
                if (codePoint >= 65536) {
                    i+=2;
                    codePoint -= 65536
                    codePoint <<= 6;
                    codePoint |= parseInt(bytes.substring(i, i+2), 16)-128;
                }
            }
        }
        try {
            str += String.fromCodePoint(codePoint);
        } catch(e){console.error(e);}
    }
    return str;
}
Web3Loader.onWeb3(function() {
    var proposalABI = [{"constant":false,"inputs":[{"name":"_argumentId","type":"uint256"}],"name":"vote","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"arguments","outputs":[{"name":"source","type":"address"},{"name":"position","type":"uint8"},{"name":"count","type":"uint256"},{"name":"text","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_user","type":"address"}],"name":"getPosition","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_index","type":"uint256"}],"name":"argumentPosition","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_index","type":"uint256"}],"name":"argumentVoteCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"argumentCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_position","type":"uint8"},{"name":"_text","type":"bytes"}],"name":"argue","outputs":[{"name":"","type":"uint256"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"source","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"resolution","outputs":[{"name":"","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_index","type":"uint256"}],"name":"argumentSource","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"voteCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"votes","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_resolution","type":"bytes"},{"name":"_source","type":"address"},{"name":"_voteToken","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"}];
    // TODO see if web3.eth.contract(proposalABI) localvar is better
    Proposals.init = function(address) {
        Proposals[address] = web3.eth.contract(proposalABI).at(address);
    };
});

Proposals = {
    argumentCount(address, resultFn) {
        if (!Proposals[address]) {
            Proposals.init(address);
        }
        if (Proposals[address].argCount) {
            return resultFn(Proposals[address].argCount);
        }
        Proposals[address].argumentCount(function(err, result) {
            if (err) {
                console.error(err);
                return;
            }
            var argCount = result.c[0];
            Proposals[address].argCount = argCount;
            resultFn(argCount);
        });
    },
    getArgument(address, index, resultFn) {
        if (!Proposals[address]) {
            Proposals.init(address);
        }
        var proposal = Proposals[address];
        if (proposal[index]) {
            resultFn(proposal[index]);
            return;
        }
        proposal.arguments(index, function(err, result) {
            if (err) {
                console.error(err);
                return;
            }
            if (!proposal[index]) {
                var pos = result[1].c[0];
                var voteCount = result[2].c[0];
                // FIXME support uint256 for voteCount
                var argument = {
                    index:index,
                    source:result[0],
                    position:pos,
                    voteCount:voteCount,
                    text:bytesToStr(result[3])
                };
                proposal[index] = argument;
                var casesKey = 'pos'+pos;
                var voteKey = 'votes'+pos;
                if (proposal[casesKey]) {
                    proposal[casesKey].push(argument);
                } else {
                    proposal[casesKey] = [argument];
                }
                if (typeof proposal[voteKey] == "undefined") {
                    proposal[voteKey] = voteCount;
                } else {
                    proposal[voteKey] += voteCount;
                }
            }
            resultFn(Proposals[address][index]);
        });
    },
    prefetchArguments(address, onComplete) {
        Proposals.argumentCount(address, function(argumentCount){
            var counter = new ReactiveVar(argumentCount - 1);
            function checkDone(counter) {
                console.log(address);
                console.log(counter.get());
                counter.set(counter.get() - 1);
                if (counter.get() == 0) {
                    onComplete();
                }
            }
            for (var i = 1; i < argumentCount; i++) {
                Proposals.getArgument(address, i, function(){checkDone(counter);});
            }
        });
    },
    argumentsSupporting(address, position) {
        // FIXME these aren't always prefetched
        var arr = Proposals[address]['pos'+position];
        return arr && arr.sort(function(a,b) {
            return b.voteCount - a.voteCount;
        });
    },
    argumentsOpposing(address, position) {
        var inverse = [];
        var proposal = Proposals[address];
        for (var pos = 1; pos < 5; pos++) {
            if (pos == position) {
                continue;
            }
            if (proposal['pos'+pos]) {
                inverse = inverse.concat(proposal['pos'+pos]);
            }
        }
        inverse.sort(function (a,b) {
            return b.voteCount - a.voteCount;
        });
        return inverse;
    },
    vote(address, argumentIndex, resultFn) {
        Proposals[address].vote(argumentIndex, resultFn);
    },
    argue(address, position, content, resultFn) {
        Proposals[address].argue(position, content, resultFn);
    },
    getMyVote(address, resultFn) {
        Accounts.current(function(account) {
            Proposals[address].votes(account, function(error, result) {
                if (error) {
                    console.error(error);
                    return;
                }
                resultFn(result.c[0]);
            });
        });
    },
    voteCount(address, resultFn) {
        Proposals[address].voteCount(function(error, result) {
            if (error) {
                console.error(error);
                return;
            }
            resultFn(result.c[0]);
        });
    },
    getArgumentCount(address, resultFn) {
        Proposals[address].argumentCount(function(error, result) {
            if (error) {
                console.error(error);
                return;
            }
            resultFn(result);
        });
    },
};
