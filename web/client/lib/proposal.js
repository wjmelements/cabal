Template.proposal.onCreated(function() {
    this.choice = new ReactiveVar();
});
Template.proposal.helpers({
    proposal() {
        return "The world is flat";
    },
    page() {
        return Template.instance().choice.get() ? "cases" : "positions";
    },
    choice() {
        return Template.instance().choice.get();
    }
});
Template.proposal.events({
    "click ul.pos li"(event) {
        console.log(event.target);
        Template.instance().choice.set(event.target.className);
    }
});

