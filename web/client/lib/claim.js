function onClaimed() {
    localStorage.setItem('claim'+web3.eth.coinbase, '');
    this.claiming.set(false);
    this.available.set(0);
}
function onPendingClaim(txhash) {
    this.txhash.set(txhash);
    this.claiming.set(true);
    var estimate = this.available.get();
    Transactions.awaitPendingTransaction(txhash, estimate, onClaimed.bind(this));
}
function onRegistrationChange() {
    this.available.set(0);
}
Template.claim.onCreated(function() {
    this.available = new ReactiveVar();
    Accounts.availableFaucet(function(amount) {
        this.available.set(amount / 10);
        if (amount) {
            Accounts.current(function(address) {
                var txhash = localStorage.getItem('claim'+address);
                if (txhash) {
                    onPendingClaim.bind(this)(txhash);
                }
            }.bind(this));
        }
    }.bind(this));
    this.claiming = new ReactiveVar(false);
    this.cost = new ReactiveVar();
    this.showCost = new ReactiveVar(false);
    this.txhash = new ReactiveVar();
    this.onRegistrationChange = onRegistrationChange.bind(this);
    Accounts.registrationSubscribe(this.onRegistrationChange);
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
        var balance = Balance.get();
        return parseInt(balance + available) > parseInt(balance); 
    },
    registered() {
        return Accounts.registered.get();
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
    registering() {
        return Accounts.registering.get();
    },
});
Template.claim.events({
    "click .btn"(event) {
        if (!Accounts.registered.get()) {
            return;
        }
        if (Template.instance().claiming.get()) {
            return;
        }
        Accounts.claim(function(txhash) {
            console.log(txhash);
            localStorage.setItem('claim'+web3.eth.coinbase, txhash);
            onPendingClaim.bind(this)(txhash);
        }.bind(Template.instance()));
    },
    "mouseover .btn"(event) {
        if (!Accounts.registered.get()) {
            return;
        }
        if (Template.instance().claiming.get()) {
            return;
        }
        accountRegistry.faucet.estimateGas(function(error, gas) {
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
