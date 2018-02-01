Template.nux.onCreated(function() {
    this.registered = new ReactiveVar(false);
    Accounts.current(function(account) {
        Accounts.isRegistered(account, function(isRegistered) {
            this.registered.set(isRegistered); 
        }.bind(this));
    }.bind(this));
});
Template.nux.helpers({
    registered() {
        return Template.instance().registered.get();
    },
});
