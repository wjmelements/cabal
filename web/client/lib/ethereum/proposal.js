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
// currently accurate, but must be updated with each deployment of the contract
function estimateArgumentGas(len, hasCases) {
    var gas = 130560 + len * 72 + hasCases * -15238 + Math.ceil(len/32) * 140;
    console.log('Estimating('+len+')> '+ gas);
    // TODO determine the pattern
    //  5-> 6
    // 12->13  +7  2
    // 20->21  +8
    // 28->29  +8
    // 35->36  +7  5
    // 43->44  +8
    // 51->52  +8
    // 59->60  +8
    // 66->67  +7  9
    // 74->75  +8
    // 82->83  +8
    // 90->91  +8
    // 97->98  +7 13
    //105->106 +8
    //113->114 +8
    //120->121 +7 16
    //128->129 +8
    //135->136 +7 18
    //143->144 +8   
    //151->152 +8
    return gas;
}
window.addEventListener('load', function() {
    Web3Loader.onWeb3(function() {
        var proposalABI = [{"constant":false,"inputs":[{"name":"_argumentId","type":"uint256"}],"name":"vote","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"arguments","outputs":[{"name":"source","type":"address"},{"name":"position","type":"uint8"},{"name":"count","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"voteToken","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_user","type":"address"}],"name":"getPosition","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_index","type":"uint256"}],"name":"argumentPosition","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_index","type":"uint256"}],"name":"argumentVoteCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_token","type":"address"}],"name":"rescueToken","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"argumentCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_position","type":"uint8"},{"name":"_text","type":"bytes"}],"name":"argue","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"source","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_source","type":"address"},{"name":"_resolution","type":"bytes"}],"name":"init","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_index","type":"uint256"}],"name":"argumentSource","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"voteCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"votes","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"content","type":"bytes"}],"name":"Case","type":"event"}];
        // TODO see if web3.eth.contract(proposalABI) localvar is better
        Proposals.init = function(address, blockNumber) {
            if (!address || Proposals[address]) {
                return;
            }
            var proposal = web3.eth.contract(proposalABI).at(address);
            Proposals[address] = proposal;
            proposal.cases = [];
            var filter = web3.eth.filter({
                fromBlock:blockNumber || 0,
                to:'latest',
                address:address,
                topics:[web3.sha3('Case(bytes)')]
            });
            filter.watch((error, result) => {
                if (error) {
                    console.error(error);
                    return;
                }
                var bytes = '0x'+result.data.substr(130);
                var text = bytesToStr(bytes);
                console.log(result);
                var index = proposal.cases.length;
                var ontextindex = 'ontext'+index;
                if (proposal[ontextindex]) {
                    proposal[ontextindex](text);
                }
                proposal.cases.push(text);
            });
        };
    });
});

Proposals = {
    getArgumentCount(address, resultFn) {
        if (!Proposals[address]) {
            console.error('I hope this is dead code');
            Proposals.init(address);
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
    getArgument(address, index, resultFn, refresh) {
        if (!Proposals[address]) {
            console.error('I hope this is dead code');
            Proposals.init(address);
        }
        var proposal = Proposals[address];
        if (proposal[index] && (!refresh || proposal[index].pending.length)) {
            if (proposal[index].pending.length) {
                proposal[index].pending.push(resultFn);
            } else {
                resultFn(proposal[index]);
            }
            return;
        }
        var argument = {index:index,pending:[resultFn]};
        var priorVoteCount = proposal[index] && proposal[index].voteCount || 0;
        proposal[index] = argument;
        var done = function() {
            if (!argument.source || !argument.position || typeof(argument.voteCount) == 'undefined' || !argument.text) {
                // incomplete
                return;
            }
            var casesKey = 'pos'+argument.position;
            var voteKey = 'votes'+argument.position;
            if (!proposal[casesKey]
             || !proposal[casesKey].find(function(arg){return index == arg;})
              ) {
                if (proposal[casesKey]) {
                    proposal[casesKey].push(index);
                } else {
                    proposal[casesKey] = [index];
                }
            }
            if (typeof proposal[voteKey] == "undefined") {
                proposal[voteKey] = argument.voteCount;
            } else {
                if (proposal[index]) {
                    proposal[voteKey] -= priorVoteCount;
                }
                proposal[voteKey] += argument.voteCount;
            }
            while (argument.pending.length) {
                argument.pending.pop()(argument);
            }
        };
        if (index < proposal.cases.length) {
            argument.text = proposal.cases[index];
        } else {
            var idx = 'ontext'+index;
            proposal[idx] = function(text) {
                argument.text = text;
                argument[idx] = undefined;
                done();
            };
        }
        proposal.argumentPosition(index, function(err, result) {
            if (err) {
                console.error(err);
                return;
            }
            argument.position = result;
            done();
        });
        proposal.argumentVoteCount(index, function(err, result) {
            if (err) {
                console.error(err);
                return;
            }
            var voteCount = result.c[0];
            if (result.c[5]) {
                // FIXME support uint256
                voteCount = 7913129639936 - result.c[5];
            }
            argument.voteCount = voteCount;
            done();
        });
        proposal.argumentSource(index, function(err, result) {
            if (err) {
                console.error(err);
                return;
            }
            argument.source = result;
            done();
        });
    },
    refresh(address, onComplete) {
        Proposals.getArgumentCount(address, function(argumentCount){
            var counter = new ReactiveVar(argumentCount);
            function checkDone(counter) {
                counter.set(counter.get() - 1);
                if (counter.get() == 0) {
                    onComplete();
                }
            }
            for (var i = 0; i < argumentCount; i++) {
                Proposals.getArgument(address, i, function(){checkDone(counter);}, true);
            }
        });
    },
    argumentsSupporting(address, position) {
        // FIXME these aren't always prefetched
        var arr = Proposals[address]['pos'+position];
        return arr && arr.map(function(index) {
            return Proposals[address][index];
        }).sort(function(a,b) {
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
        return inverse.map(function(index) {
            return proposal[index];
        }).sort(function (a,b) {
            return b.voteCount - a.voteCount;
        });
    },
    vote(address, argumentIndex, resultFn) {
        Proposals[address].vote(argumentIndex, {gasPrice:GasRender.gasPriceInWei()}, resultFn);
    },
    argue(address, position, content, resultFn) {
        //var gas = estimateArgumentGas(content.length, Proposals[address].argCount > 1 || 0);
        Proposals[address].argue(position, content, {gasPrice:GasRender.gasPriceInWei()}, resultFn);
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
    estimateArgGas(len, hasCases) {
        return estimateArgumentGas(len, hasCases);
    },
};
