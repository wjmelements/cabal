var onAccountRegistry = [];
accountRegistry=null; 
window.addEventListener('load', function() {
    Web3Loader.onWeb3(function() {
        var accountRegistryABI = [{"constant":true,"inputs":[],"name":"population","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"register","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"outsideProposalRejectionBurn","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"deregistrationDate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"registrationDeposit","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_resolution","type":"bytes"}],"name":"propose","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_board","type":"address"}],"name":"appoint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_cabal","type":"address"}],"name":"confirmCabal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_account","type":"address"}],"name":"isCabal","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_voter","type":"address"}],"name":"canDeregister","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"outsideProposalVerificationFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_proposal","type":"address"}],"name":"isProposal","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_account","type":"address"}],"name":"isFraud","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_proposal","type":"address"},{"name":"_reason","type":"string"}],"name":"banProposal","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_proposal","type":"address"}],"name":"confirmProposal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"allProposals","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"cabalCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_proposal","type":"address"}],"name":"isPendingProposal","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_voter","type":"address"}],"name":"canVote","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"deregister","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_proposal","type":"address"}],"name":"proposeExternal","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_cabal","type":"address"}],"name":"registerCabal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_proposal","type":"address"}],"name":"rejectProposal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"proposalCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"outsideProposalRejectionBounty","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"allCabals","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"voter","type":"address"}],"name":"NewVoter","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"voter","type":"address"}],"name":"Deregistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"board","type":"address"}],"name":"NewBoard","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"proposal","type":"address"}],"name":"NewProposal","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"cabal","type":"address"}],"name":"NewCabal","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"proposal","type":"address"},{"indexed":false,"name":"reason","type":"string"}],"name":"BannedProposal","type":"event"}];
        Accounts.getAddress(function(address) {
            accountRegistry = web3.eth.contract(accountRegistryABI).at(address);
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
    var hasAccount = hasWeb3 && web3 && web3.eth && web3.eth.accounts && (web3.eth.accounts.length > 0); 
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
}

Accounts = {
    check: checkAccount,
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
        switch (Net.id.get() || "4") {
        default:
            console.error("No known AccountRegistry on this network:" + Net.id.get());
        case "4":
            console.log("Using Rinkeby");
            return resultFn("0x6DE8e2cCC7c1EC8537164A53C7aa5e74E42331f3");
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
        accountRegistry.propose(proposal, {gasPrice:GasRender.gasPriceInWei()},resultFn);
    },
    fetchCanDeregister(resultFn) {
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
    deregistrationDate(resultFn) {
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
            return;;
        }
        Accounts.onRegistrationChange.filter(function(a){ return a != changeFn;});
    },
    reportRegistrationChange() {
        if (!Accounts.onRegistrationChange) {
            return;
        }
        while(Accounts.onRegistrationChange.length) {
            Accounts.onRegistrationChange.pop()();
        }
    },
};
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
        console.log(canDeregister);
        Accounts.canDeregister.set(canDeregister);
    });
});
