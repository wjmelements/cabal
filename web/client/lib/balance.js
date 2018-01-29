Template.balance.onCreated(function() {
    Token.balance(function(balance) {
        Balance.set(balance.c[0] / 10);
        Balance.onChange();
    }.bind(this));
});
Template.balance.helpers({
    balance() {
        return Balance.get();
    },
});
