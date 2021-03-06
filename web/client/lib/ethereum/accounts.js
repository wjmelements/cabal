var onAccountRegistry = [];
accountRegistry=null; 
function onProposal(result) {
    var proposalAddress = '0x'+result.topics[1].substring(26);
    if (Proposals[proposalAddress]) {
        return;
    }
    // assumption: we get these in order
    Accounts.proposals.push(proposalAddress);
    Proposals.init(proposalAddress, result.blockNumber);
    Accounts.resize();
    if (Proposals[result.transactionHash]) {
        while (Proposals[result.transactionHash].length) {
            Proposals[result.transactionHash].pop()();
        }
    }
}
var lastCheckedBlock = "0x6253d6"
function fetchProposals(endBlock, startBlock) {
    Accounts.getAddress(function (address) {
        if (!startBlock) {
            startBlock = lastCheckedBlock
        }
        if (typeof endBlock == 'number') {
            endBlock = web3.toHex(endBlock)
        }
        console.log('fetching proposals ' + startBlock + '->' + endBlock)
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange= function() {
            if (xmlHttp.readyState == 4) { // DONE
                try {
                    response = JSON.parse(xmlHttp.responseText);
                    response.result.forEach(onProposal);
                    if (web3.toDecimal(lastCheckedBlock) < web3.toDecimal(endBlock)) {
                        lastCheckedBlock = endBlock
                    }
                } catch (e) {
                    console.error(e)
                    console.error(xmlHttp.responseText)
                }
            }
        };
        xmlHttp.open('POST', 'https://' + Net.infuraPrefix.get() + 'infura.io/x6jRpmEj17uLQR1TuV1E', true/*async*/);
        xmlHttp.setRequestHeader("Content-type", "application/json");
        xmlHttp.send('{"jsonrpc": "2.0", "id": 1, "method": "eth_getLogs", "params": [{"address":"' + address +
            '","fromBlock":"' + startBlock +
            '","toBlock":"' + endBlock +
            '","topics":["0xd721fc4b71111225bba131141f013ef3e3956654b0eade3c9e9f611f0d93b551"]}]}');
    })
}

window.addEventListener('load', function() {
    Web3Loader.onWeb3(function() {
        var accountRegistryABI = [{"constant":true,"inputs":[{"name":"_account","type":"address"}],"name":"isPendingCabal","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"register","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"proposalCensorshipFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"deregistrationDate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"registrationDeposit","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_board","type":"address"},{"name":"_vouch","type":"string"}],"name":"appoint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_cabal","type":"address"}],"name":"confirmCabal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_token","type":"address"}],"name":"rescueToken","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"burn","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_account","type":"address"}],"name":"isCabal","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_voter","type":"address"}],"name":"canDeregister","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_proposal","type":"address"}],"name":"isProposal","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_account","type":"address"}],"name":"availableFaucet","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_account","type":"address"}],"name":"isFraud","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_proposal","type":"address"},{"name":"_reason","type":"string"}],"name":"banProposal","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_resolution","type":"bytes"}],"name":"proposeProxy","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_proposal","type":"address"}],"name":"sudoPropose","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"population","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_proposal","type":"address"}],"name":"confirmProposal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_voter","type":"address"},{"name":"_proposal","type":"address"}],"name":"canVoteOnProposal","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_proposal","type":"address"}],"name":"isPendingProposal","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_voter","type":"address"}],"name":"canVote","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"deregister","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_proposal","type":"address"}],"name":"proposeExternal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_cabal","type":"address"}],"name":"registerCabal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_proposal","type":"address"}],"name":"rejectProposal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_resolution","type":"bytes"}],"name":"proposeProper","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"faucet","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_board","type":"address"},{"name":"_reason","type":"string"}],"name":"denounce","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"token","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"}],"name":"Voter","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"}],"name":"Deregistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"board","type":"address"},{"indexed":false,"name":"endorsement","type":"string"}],"name":"Nominated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"board","type":"address"},{"indexed":false,"name":"endorsement","type":"string"}],"name":"Board","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"board","type":"address"},{"indexed":false,"name":"reason","type":"string"}],"name":"Denounced","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"board","type":"address"},{"indexed":false,"name":"reason","type":"string"}],"name":"Revoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"proposal","type":"address"}],"name":"Proposal","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"cabal","type":"address"}],"name":"Cabal","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"proposal","type":"address"},{"indexed":false,"name":"reason","type":"string"}],"name":"BannedProposal","type":"event"}];
        Accounts.getAddress(function(address) {
            accountRegistry = web3.eth.contract(accountRegistryABI).at(address);
            if (Net.id.get() == '1') {
                fetchProposals('0x620563', '0x620563')
                fetchProposals('0x5086bc', '0x4ee93f')
                fetchProposals('0x55116f', '0x55116f')
                fetchProposals('0x560e7b', '0x560e7b')
            } else {
                lastCheckedBlock = web3.toHex(Net.firstProposalBlock.get())
            }
            Block.on(fetchProposals)
            while (onAccountRegistry.length) {
                onAccountRegistry.pop()();
            }
        });
    });
});
var onCurrentAccount = [];
function checkAccount(refreshId) {
    var hasWeb3 = (typeof web3 !== 'undefined') && (typeof web3.currentProvider.host === 'undefined');
    Accounts.hasWeb3.set(hasWeb3);
    var hasAccount = false;//&& web3.eth.accounts && (web3.eth.accounts.length > 0); 
    if (hasWeb3 && web3 && web3.eth) {
        web3.eth.getAccounts(function(error, accounts) {
            hasAccount = !error && !!accounts[0];
            Accounts.hasAccount.set(hasAccount);
            console.log("hasWeb3:"+hasWeb3+",hasAccount:"+hasAccount);
            if (hasAccount) {
                while (onCurrentAccount.length) {
                    onCurrentAccount.pop()();
                }
                clearInterval(refreshId);
            } else if (!refreshId) {
                Accounts.registered.set(false);
                var refreshIndirect = []; 
                refreshIndirect.push(setInterval(function () {
                    checkAccount(refreshIndirect[0]);
                }, 500));
            }
        });
    } else {
        Accounts.hasAccount.set(false);
        Accounts.registered.set(false);
        var refreshIndirect = []; 
        if (!refreshId) {
            refreshIndirect.push(setInterval(function () {
                checkAccount(refreshIndirect[0]);
            }, 500));
        }
    }
}

Accounts = {
    check: checkAccount,
    current(resultFn) {
        Web3Loader.onWeb3(function() {
            web3.eth.getAccounts(function(error, accounts) {
                if (!accounts[0]) {
                    onCurrentAccount.push(function() {
                        Accounts.current(resultFn);
                    });

                    return;
                }
                resultFn(accounts[0]);
            });
        });
    },
    getAddress(resultFn) {
        switch (Net.id.get() || "4") {
        default:
            console.error("No known AccountRegistry on this network:" + Net.id.get());
        case "1":
        case "4":
            return resultFn("0x000000002bb43c83eCe652d161ad0fa862129A2C");
        }
    },
    isRegistered(address, resultFn) {
        if (accountRegistry) {
            return accountRegistry.canVote(address, function(err, result) {
                if (err) {
                    console.error(err);
                    return;
                }
                resultFn(result);
            });
        }
        onAccountRegistry.push(function() {
            Accounts.isRegistered(address, resultFn);
        });
    },
    register(resultFn) {
        if (accountRegistry) {
            return accountRegistry.register({ value: 1E15, gasPrice:GasRender.gasPriceInWei() }, function(err, result) {
                if (err) {
                    console.error(err);
                    return;
                }
                resultFn(result);
            });
        }
        onAccountRegistry.push(function() {
            Accounts.register(resultFn);
        });
    },
    deregister(resultFn) {
        if (accountRegistry) {
            return accountRegistry.deregister({ value: 0, gasPrice:GasRender.gasPriceInWei() }, function(err, result) {
                if (err) {
                    console.error(err);
                    return;
                }
                resultFn(result);
            });
        }
        onAccountRegistry.push(function() {
            Accounts.deregister(resultFn);
        });
    },
    proposalCount(resultFn) {
        if (accountRegistry) {
            /*
            return accountRegistry.proposalCount(function(err, result) {
                if (err) {
                    console.error(err);
                    return;
                }
                resultFn(result.c[0]);
            });
            */
            return resultFn(Accounts.proposals.length);
        }
        onAccountRegistry.push(function() {
            Accounts.proposalCount(resultFn);
        });
    },
    resizeSubscribe(resizeFn) {
        Accounts.onResize.push(resizeFn);
    },
    resizeUnsubscribe(resizeFn) {
        Accounts.onResize = Accounts.onResize.filter((fn)=>{return fn != resizeFn});
    },
    resize() {
        Accounts.proposalCount((count)=>{
            for (var i = Accounts.onResize.length; i --> 0; ) {
                Accounts.onResize[i](count);
            }
        });
    },
    getProposal(index, resultFn) {
        if (accountRegistry) {
            if (index < Accounts.proposals.length) {
                return resultFn(Accounts.proposals[index]);
            } else {
                Accounts.onResize.push(()=> {
                    Accounts.getProposal(index, resultFn);
                });
            }
            return;
        }
        onAccountRegistry.push(function() {
            Accounts.getProposal(index, resultFn);
        });
    },
    propose(proposal, resultFn) {
        if (typeof proposal == "string") {
            proposal = web3.fromUtf8(proposal);
        }
        accountRegistry.proposeProxy(proposal, {gasPrice:GasRender.gasPriceInWei()},resultFn);
    },
    fetchCanDeregister(resultFn) {
        Accounts.current(function (account) {
            if (!accountRegistry) {
                onAccountRegistry.push(()=>{Accounts.fetchCanDeregister(resultFn);});
                return;
            }
            accountRegistry.canDeregister(account, function(error, result) {
                if (error) {
                    console.error(error);
                    return;
                }
                resultFn(result);
            });
        });
    },
    claim(resultFn) {
        if (!accountRegistry) {
            onAccountRegistry.push(function(){Accounts.claim(resultFn)});
            return;
        }
        accountRegistry.faucet({gasPrice:GasRender.gasPriceInWei()}, function (error, result) {
            if (error) {
                console.error(error);
                return;
            }
            resultFn(result);
        });
    },
    availableFaucet(resultFn) {
        if (!accountRegistry) {
            onAccountRegistry.push(function(){Accounts.availableFaucet(resultFn)});
            return;
        }
        Accounts.current(function(currentAccount) {
            accountRegistry.availableFaucet(currentAccount, function(error, available) {
                if (error) {
                    console.error(error);
                    return;
                }
                resultFn(available.c[0]);
            });
        });
    },
    deregistrationDate(resultFn) {
        if (!accountRegistry) {
            onAccountRegistry.push(function() {
                Accounts.deregistrationDate(resultFn);
            });
            return;
        }
        accountRegistry.deregistrationDate(function (error, date) {
            if (error) {
                console.error(error);
                return;
            }
            resultFn(date.c[0]);
        });
    },
    registrationSubscribe(changeFn) {
        if (!Accounts.onRegistrationChange) {
            Accounts.onRegistrationChange = [];
        }
        Accounts.onRegistrationChange.push(changeFn);
    },
    registrationUnsubscribe(changeFn) {
        if (!Accounts.onRegistrationChange) {
            return;
        }
        Accounts.onRegistrationChange.filter(function(a){ return a != changeFn;});
    },
    reportRegistrationChange() {
        if (!Accounts.onRegistrationChange) {
            return;
        }
        for (var i = 0; i < Accounts.onRegistrationChange.length; i++) {
            Accounts.onRegistrationChange[i]();
        }
    },
    
};
Accounts.proposals = []
Accounts.onResize = [];
Accounts.hasWeb3 = new ReactiveVar(true);
Accounts.hasAccount = new ReactiveVar(true);
Accounts.registered = new ReactiveVar(true);
Accounts.registering = new ReactiveVar(false);
Accounts.canDeregister = new ReactiveVar(true);
checkAccount();
Accounts.current(function(address) {
    Accounts.isRegistered(address, function(isRegistered) {
        Accounts.registered.set(isRegistered);
    });
    Accounts.fetchCanDeregister(function(canDeregister) {
        Accounts.canDeregister.set(canDeregister);
    });
});
Accounts.fetchProposals = fetchProposals
