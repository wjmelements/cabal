var refresh = function () {
    Accounts.current(function(account) {
        Accounts.isRegistered(account, function(isRegistered) {
            this.cannotClaim.set(!isRegistered);
            this.onRegistrationChange = refresh.bind(this);
            Accounts.registrationSubscribe(this.onRegistrationChange);
        }.bind(this));
    }.bind(this));
};
function awaitClaimed() {
    Token.availableFaucet(function (amount) {
        var prior = this.available.get();
        this.available.set(amount / 10);
        if (amount == 0) {
            Balance.set(Balance.get() + prior);
            this.claiming.set(false);
            return;
        }
        window.setTimeout(awaitClaimed.bind(this), 4000);
    }.bind(this));
}
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
    refresh.bind(this)();
});
Template.claim.onDestroyed(function() {
    Accounts.registrationUnsubscribe(this.onRegistrationChange);
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
    claiming() {
        return Template.instance().claiming.get();
    },
});
Template.claim.events({
    "click .btn"(event) {
        if (Template.instance().cannotClaim.get()) {
            return;
        }
        Token.claim(function(txhash) {
            console.log(txhash);
            this.claiming.set(true);
            awaitClaimed.bind(this)();
        }.bind(Template.instance()));
    },
});
