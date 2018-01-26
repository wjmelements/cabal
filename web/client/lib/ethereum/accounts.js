var onAccountRegistry = [];
accountRegistry=null; 
Web3Loader.onWeb3(function() {
    var accountRegistryABI = [{"constant":true,"inputs":[],"name":"voteToken","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"register","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"outsideProposalRejectionBurn","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"registrationDeposit","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_resolution","type":"bytes"}],"name":"propose","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_board","type":"address"}],"name":"appoint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_cabal","type":"address"}],"name":"confirmCabal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_account","type":"address"}],"name":"isCabal","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_voter","type":"address"}],"name":"canDeregister","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"outsideProposalVerificationFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_proposal","type":"address"}],"name":"isProposal","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_account","type":"address"}],"name":"isFraud","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_proposal","type":"address"},{"name":"_reason","type":"string"}],"name":"banProposal","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_proposal","type":"address"}],"name":"confirmProposal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"allProposals","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"cabalCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_proposal","type":"address"}],"name":"isPendingProposal","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_voter","type":"address"}],"name":"canVote","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"deregister","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_proposal","type":"address"}],"name":"proposeExternal","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_cabal","type":"address"}],"name":"registerCabal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_proposal","type":"address"}],"name":"rejectProposal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"proposalCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"outsideProposalRejectionBounty","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"allCabals","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"voter","type":"address"}],"name":"NewVoter","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"voter","type":"address"}],"name":"Deregistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"board","type":"address"}],"name":"NewBoard","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"proposal","type":"address"}],"name":"NewProposal","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"cabal","type":"address"}],"name":"NewCabal","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"proposal","type":"address"},{"indexed":false,"name":"reason","type":"string"}],"name":"BannedProposal","type":"event"}];
    Accounts.getAddress(function(address) {
        accountRegistry = web3.eth.contract(accountRegistryABI).at(address);
        while (onAccountRegistry.length) {
            onAccountRegistry.pop()();
        }
    });
});
var onCurrentAccount = [];
function checkAccount(refreshId) {
    var hasWeb3 = (typeof web3 !== 'undefined') && (typeof web3.currentProvider.host === 'undefined');
    var hasAccount = hasWeb3 && web3 && web3.eth && web3.eth.accounts && (web3.eth.accounts.length > 0); 
    console.log("hasWeb3:"+hasWeb3+",hasAccount:"+hasAccount);
    var noweb3 = document.getElementById("withoutweb3");
    if (noweb3) {
        noweb3.hidden = hasWeb3;
    }
    var withoutaccount = document.getElementById("withoutaccount");
    if (withoutaccount) {
        withoutaccount.hidden = !hasWeb3 || hasAccount;
    }
    if (hasAccount) {
        while (onCurrentAccount.length) {
            onCurrentAccount.pop()();
        }
        clearInterval(refreshId);
    } else if (!refreshId) {
        var refreshIndirect = []; 
        refreshIndirect.push(setInterval(function () {
            checkAccount(refreshIndirect[0]);
        }, 500));
    }
}
checkAccount();

Accounts = {
    current(resultFn) {
        Web3Loader.onWeb3(function() {
            if (!web3.eth.accounts[0]) {
                onCurrentAccount.push(function() {
                    Accounts.current(resultFn);
                });

                return;
            }
            // FIXME compare to web3.eth.coinbase
            resultFn(web3.eth.accounts[0]);
        });
    },
    getAddress(resultFn) {
        switch (nId) {
        default:
            console.error("No known AccountRegistry on this network:" + nId);
        case "4":
            console.log("Using Rinkeby");
            return resultFn("0xbACD997eBbE8A539f7709ffe2709c0Ae8085FB82");
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
            return accountRegistry.register({ value: 1E15 }, function(err, result) {
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
            return accountRegistry.deregister({ value: 0 }, function(err, result) {
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
            return accountRegistry.proposalCount(function(err, result) {
                if (err) {
                    console.error(err);
                    return;
                }
                resultFn(result.c[0]);
            });
        }
        onAccountRegistry.push(function() {
            Accounts.proposalCount(resultFn);
        });
    },
    getProposal(index, resultFn) {
        if (accountRegistry) {
            return accountRegistry.allProposals(index, function(err, result) {
                if (err) {
                    console.error(err);
                    return;
                }
                resultFn(result);
            });
        }
        onAccountRegistry.push(function() {
            Accounts.getProposal(index, resultFn);
        });
    },
    propose(proposal, resultFn) {
        console.log(proposal);
        accountRegistry.propose(proposal, resultFn);
    },
    canDeregister(resultFn) {
        Accounts.current(function (account) {
            accountRegistry.canDeregister(account, function(error, result) {
                if (error) {
                    console.error(error);
                    return;
                }
                resultFn(result);
            });
        });
    },
    registrationSubscribe(changeFn) {
        if (!Accounts.onRegistrationChange) {
            Accounts.onRegistrationChange = [];
        }
        Accounts.onRegistrationChange.push(changeFn);
    },
    registrationUnsubscribe(changeFn) {
        Accounts.onRegistrationChange.filter(function(a){ return a != changeFn;});
    },
    reportRegistrationChange() {
        while(Accounts.onRegistrationChange.length) {
            Accounts.onRegistrationChange.pop()();
        }
    }
}
