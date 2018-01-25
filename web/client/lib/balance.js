Template.balance.onCreated(function() {
    Token.balance(function(balance) {
        Balance.set(balance.c[0] / 10);
    }.bind(this));
    this.finney = new ReactiveVar();
    Accounts.current(function(account) {
        web3.eth.getBalance(account, function (error, balance) {
            var finney = balance.c[0] / 10 + balance.c[1] / 10e14;
            finney = Math.floor(finney * 1000) / 1000;
            this.finney.set(finney);
        }.bind(this));
    }.bind(this));
});
Template.balance.helpers({
    balance() {
        return Balance.get();
    },
    finney() {
        return Template.instance().finney.get();
    },
});
