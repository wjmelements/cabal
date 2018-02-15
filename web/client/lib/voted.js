Template.voted.onCreated(function() {
    this.vote = this.data.voted;
    this.position = this.data.position;
    this.choice = this.data.choice;
    this.refresh = this.data.refresh;
    this.address = this.data.address;
});
Template.voted.helpers({
    vote() {
        return Template.instance().vote.get();
    },
    proposal() {
        return Template.instance().data.proposal.get();
    },
});
Template.voted.events({
    "click .reset"(event) {
        Template.instance().position.set();
        Template.instance().choice.set();
        localStorage.setItem('choice'+Template.instance().address.get(), "");
        Template.instance().refresh(true);
    },
});
