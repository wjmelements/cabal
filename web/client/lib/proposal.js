Template.proposal.onCreated(function() {
    console.log("proposal.onCreated");
    this.choice = new ReactiveVar();
    this.title = new ReactiveVar("Loading...");
    this.index = this.data.index;
    this.address = new ReactiveVar();
    Accounts.getProposal(this.index, function(address) {
        this.address.set(address);
        Proposals.getArgument(address, 0, function(proposal) {
            this.title.set(proposal.text);
        }.bind(this));
        Proposals.prefetchArguments(address);
    }.bind(this));
});
Template.proposal.helpers({
    proposal() {
        return Template.instance().title.get();
    },
    page() {
        return Template.instance().choice.get() ? "cases" : "positions";
    },
    choice() {
        return Template.instance().choice.get();
    },
    data() {
        return {
            address:Template.instance().address,
            position:Template.instance().choice,
        };
    }
});
Template.proposal.events({
    "click ul.pos li"(event) {
        Template.instance().choice.set(event.target.className);
    }
});

