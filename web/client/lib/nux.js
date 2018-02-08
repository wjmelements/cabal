Template.nux.onCreated(function() {
    this.registered = new ReactiveVar(false);
    Accounts.current(function(account) {
        Accounts.isRegistered(account, function(isRegistered) {
            Accounts.registered.set(isRegistered); 
        }.bind(this));
    }.bind(this));
});
Template.nux.helpers({
    registered() {
        return Accounts.registered.get();
    },
});
