function refresh() {
    Accounts.current(function(currentAccount) {
        this.account.set(currentAccount);
        Accounts.isRegistered(currentAccount, function(isRegistered) {
            this.registered.set(isRegistered);
            if (isRegistered) {
                Accounts.canDeregister(function (canDeregister) {
                    this.canDeregister.set(canDeregister);
                }.bind(this));
            }
        }.bind(this));
    }.bind(this));
}
Template.register.onCreated(function() {
    this.registered = new ReactiveVar();
    this.account = new ReactiveVar();
    this.registering = new ReactiveVar(false);
    this.canDeregister = new ReactiveVar(true);
    this.cost = new ReactiveVar();
    this.showCost = new ReactiveVar(false);
    this.txhash = new ReactiveVar();
    refresh.bind(this)();
});
Template.register.helpers({
    registered() {
        return Template.instance().registered.get();
    },
    registering() {
        return Template.instance().registering.get();
    },
    canDeregister() {
        return Template.instance().canDeregister.get();
    },
    showCost() {
        return Template.instance().showCost.get();
    },
    cost() {
        return Template.instance().cost.get();
    },
    prefix() {
        return Net.prefix.get();
    },
    txhash() {
        return Template.instance().txhash.get();
    }
});
// TODO compare to checking tx status
function awaitRegistered(account) {
    Accounts.current(function(currentAccount) {
        if (currentAccount != account) {
            refresh.bind(this)();
            return;
        }
        Accounts.isRegistered(currentAccount, function(isRegistered) {
            if (isRegistered) {
                this.registered.set(true);
                this.registering.set(false);
                this.canDeregister.set(false);
                Accounts.reportRegistrationChange();
            } else {
                window.setTimeout(function(){awaitRegistered.bind(this)(account)}.bind(this), 5000);
            }
        }.bind(this));
    }.bind(this));
}
Template.register.events({
    "click .submit"(event) {
        if (!Template.instance().canDeregister.get()) {
            return;
        }
        if (Template.instance().registering.get()) {
            return;
        }
        var account = Template.instance().account.get();
        if (Template.instance().registered.get()) {
            Accounts.deregister(function(txhash) {
                console.log(txhash);
            });
        } else {
            Accounts.register(function(txhash) {
                console.log(txhash);
                this.registering.set(true);
                this.txhash.set(txhash);
                awaitRegistered.bind(this)(account);
            }.bind(Template.instance()));
        }
    },
    "mouseover .submit"(event) {
        Template.instance().showCost.set(true);
        var resultFn = function(error, gas) {
            if (error) {
                console.error(error);
                return;
            }
            this.cost.set(GasRender.toString(gas));
        }.bind(Template.instance());
        if (Template.instance().registered.get()) {
            if (Template.instance().canDeregister.get()) {
                accountRegistry.deregister.estimateGas(resultFn);
            }
        } else {
            accountRegistry.register.estimateGas({value: 1E15}, resultFn);
        }
    },
    "mouseout .submit"(event) {
        Template.instance().showCost.set(false);
    },
});
