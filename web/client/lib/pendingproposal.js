Template.pendingproposal.onCreated(function() {
    var data = this.data;
    console.log(data);
    this.title = new ReactiveVar(data.data.title);
    this.txhash = new ReactiveVar(data.data.txhash);
});
Template.pendingproposal.helpers({
    txhash() {
        return Template.instance().txhash.get();
    },
    title() {
        return Template.instance().title.get();
    },
    prefix() {
        return Net.prefix.get();
    },
});
