Template.withoutweb3.onRendered(function() {
    Accounts.check();
});
Template.withoutweb3.helpers({
    unsupportedNetwork() {
        return Net.unsupportedNetwork.get();
    },
    hasWeb3() {
        return Accounts.hasWeb3.get();
    },
    hasAccount() {
        return Accounts.hasAccount.get();
    },
});
