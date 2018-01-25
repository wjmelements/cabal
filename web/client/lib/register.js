function refresh() {
    Accounts.current(function(currentAccount) {
        console.log(currentAccount);
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
});
function awaitRegistered(account) {
    Accounts.current(function(currentAccount) {
        if (currentAccount != account) {
            refresh();
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
        var account = Template.instance().account.get();
        if (Template.instance().registered.get()) {
            Accounts.deregister(function(txhash) {
                console.log(txhash);
            });
        } else {
            Accounts.register(function(txhash) {
                console.log(txhash);
                this.registering.set(true);
                awaitRegistered.bind(this)(account);
            }.bind(Template.instance()));
        }
    },
    "hover .submit"(event) {
        //Tutorial.set('Registered accounts can claim FinneyVotes')
    }
});
