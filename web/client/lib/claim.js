Template.claim.onCreated(function() {
    this.available = new ReactiveVar();
    Token.availableFaucet(function(amount) {
        this.available.set(amount / 10);
    }.bind(this));
    this.claiming = new ReactiveVar(false);
    this.balance = new ReactiveVar(0);
    this.cannotClaim = new ReactiveVar(false);
    Token.balance(function(balance) {
        this.balance.set(balance / 10);
    }.bind(this));
    Accounts.current(function(account) {
        Accounts.isRegistered(account, function(isRegistered) {
            this.cannotClaim.set(!isRegistered);
        }.bind(this));
    }.bind(this));
});
Template.claim.helpers({
    available() {
        // TODO maybe only show if it would get you to the next FinneyVote
        return Template.instance().available.get();
    },
    shouldClaim() {
        var available =  Template.instance().available.get();
        var balance = Template.instance().balance.get();
        return parseInt(balance + available) > parseInt(balance); 
    },
    cannotClaim() {
        return Template.instance().cannotClaim.get();
    },
});
Template.claim.events({
    "click .submit"(event) {
        if (Template.instance().cannotClaim.get()) {
            return;
        }
        Token.claim(function(txhash) {
            console.log(txhash);
            this.claiming.set(true);
        }.bind(Template.instance()));
    },
});
