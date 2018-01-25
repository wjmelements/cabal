Template.voted.onCreated(function() {
    this.vote = this.data.voted;
});
Template.voted.helpers({
    vote() {
        return Template.instance().vote.get();
    },
});
