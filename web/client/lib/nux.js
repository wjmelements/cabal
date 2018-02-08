Template.nux.onCreated(function() {
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
