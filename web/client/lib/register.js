Template.register.onCreated(function() {
    this.registered = new ReactiveVar();
    Accounts.current(function(currentAccount) {
        Accounts.isRegistered(currentAccount, function(isRegistered) {
            console.log('isRegistered'+isRegistered);
            this.registered.set(isRegistered);
        }.bind(this));
    }.bind(this));
    this.registering = new ReactiveVar(false);
});
Template.register.helpers({
    registered() {
        return Template.instance().registered.get();
    },
    registering() {
        return Template.instance().registering.get();
    },
});
Template.register.events({
    "click .submit"(event) {
        if (Template.instance().registered.get()) {
            Accounts.deregister(function(txhash) {
                console.log(txhash);
            });
        } else {
            Accounts.register(function(txhash) {
                console.log(txhash);
                this.registering.set(true);
            }.bind(Template.instance()));
        }
    },
});
