var onAccountRegistry = [];
accountRegistry=null; 
Web3Loader.onWeb3(function() {
    var accountRegistryABI = [{"constant":false,"inputs":[{"name":"_proposal","type":"address"}],"name":"propose","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"voteToken","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"register","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"outsideProposalRejectionBurn","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"registrationDeposit","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_resolution","type":"bytes"}],"name":"propose","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_board","type":"address"}],"name":"appoint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_cabal","type":"address"}],"name":"confirmCabal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_account","type":"address"}],"name":"isCabal","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"outsideProposalVerificationFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_proposal","type":"address"}],"name":"isProposal","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_account","type":"address"}],"name":"isFraud","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_proposal","type":"address"},{"name":"_reason","type":"string"}],"name":"banProposal","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"_voter","type":"address"}],"name":"canDeregsiter","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_proposal","type":"address"}],"name":"confirmProposal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"allProposals","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"cabalCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_proposal","type":"address"}],"name":"isPendingProposal","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_voter","type":"address"}],"name":"canVote","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"deregister","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_cabal","type":"address"}],"name":"registerCabal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_proposal","type":"address"}],"name":"rejectProposal","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"proposalCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"outsideProposalRejectionBounty","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"allCabals","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"voter","type":"address"}],"name":"NewVoter","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"voter","type":"address"}],"name":"Deregistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"board","type":"address"}],"name":"NewBoard","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"proposal","type":"address"}],"name":"NewProposal","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"cabal","type":"address"}],"name":"NewCabal","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"proposal","type":"address"},{"indexed":false,"name":"reason","type":"string"}],"name":"BannedProposal","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"shutdownTime","type":"uint256"}],"name":"PlannedShutdown","type":"event"}];
    Accounts.getAddress(function(address) {
        accountRegistry = web3.eth.contract(accountRegistryABI).at(address);
        while (onAccountRegistry.length) {
            onAccountRegistry.pop()();
        }
    });
});
Accounts = {
    getAddress(resultFn) {
        switch (nId) {
        default:
            console.error("No known AccountRegistry on this network:" + nId);
        case "4":
            console.log("Using Rinkeby");
            return resultFn("0x6722c370c3762768c0fc40afff397b7b9a10a032");
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
    proposalCount(resultFn) {
        if (accountRegistry) {
            return accountRegistry.proposalCount(function(err, result) {
                if (err) {
                    console.error(err);
                    return;
                }
                resultFn(result);
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
    }
}
