Template.claim.onCreated(function() {
    this.available = new ReactiveVar();
    Token.availableFaucet(function(amount) {
        this.available.set(amount / 10);
    }.bind(this));
    this.claiming = new ReactiveVar(false);
});
Template.claim.helpers({
    available() {
        return Template.instance().available.get();
    },
});
Template.claim.events({
    "click .submit"(event) {
        Token.claim(function(txhash) {
            console.log(txhash);
            this.claiming.set(true);
        }.bind(Template.instance()));
    },
});
