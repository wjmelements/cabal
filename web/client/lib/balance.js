Template.balance.onCreated(function() {
    this.balance = new ReactiveVar(0);
    Token.balance(function(balance) {
        this.balance.set(balance.c[0] / 10);
    }.bind(this));
});
Template.balance.helpers({
    balance() {
        return Template.instance().balance.get();
    },
});
