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
            Balance.onChange();
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
    this.cost = new ReactiveVar();
    this.showCost = new ReactiveVar(false);
    this.txhash = new ReactiveVar();
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
    showCost() {
        return Template.instance().showCost.get();
    },
    cost() {
        return Template.instance().cost.get();
    },
    txhash() {
        return Template.instance().txhash.get();
    },
    prefix() {
        return Net.prefix.get();
    },
});
Template.claim.events({
    "click .btn"(event) {
        if (Template.instance().cannotClaim.get()) {
            return;
        }
        if (Template.instance().claiming.get()) {
            return;
        }
        Token.claim(function(txhash) {
            console.log(txhash);
            this.txhash.set(txhash);
            this.claiming.set(true);
            awaitClaimed.bind(this)();
        }.bind(Template.instance()));
    },
    "mouseover .btn"(event) {
        if (Template.instance().cannotClaim.get()) {
            return;
        }
        if (Template.instance().claiming.get()) {
            return;
        }
        token.faucet.estimateGas(function(error, gas) {
            if (error) {
                console.error(error);
                return;
            }
            this.cost.set(GasRender.toString(gas));
        }.bind(Template.instance()));
        Template.instance().showCost.set(true);
    },
    "mouseout .btn"(event) {
        Template.instance().showCost.set(false);
    },
});
