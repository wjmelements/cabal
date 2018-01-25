Template.proposal.onCreated(function() {
    console.log("proposal.onCreated");
    this.positionChoice = new ReactiveVar();
    this.title = new ReactiveVar("Loading...");
    this.voted = new ReactiveVar();
    this.index = this.data.index;
    this.address = new ReactiveVar();
    this.argumentChoice = new ReactiveVar();
    Accounts.getProposal(this.index, function(address) {
        this.address.set(address);
        Proposals.getArgument(address, 0, function(proposal) {
            this.title.set(proposal.text);
        }.bind(this));
        Proposals.prefetchArguments(address);
        Proposals.getMyVote(address, function(myVote) {
            console.log(myVote);
            if (!myVote) {
                return;
            }
            Proposals.getArgument(address, myVote, function(argument) {
                this.argumentChoice.set(argument);
                this.voted.set(argument);
                this.positionChoice.set('pos'+argument.position);
            }.bind(this));
        }.bind(this));
    }.bind(this));
});
Template.proposal.helpers({
    proposal() {
        return Template.instance().title.get();
    },
    page() {
        console.log(Template.instance().positionChoice.get());
        console.log(Template.instance().voted.get());
        return Template.instance().voted.get()
            ? "voted"
            : Template.instance().positionChoice.get() ? "cases" : "positions";
    },
    choice() {
        return Template.instance().positionChoice.get();
    },
    data() {
        return {
            address:Template.instance().address,
            position:Template.instance().positionChoice,
            choice:Template.instance().argumentChoice,
            voted:Template.instance().voted,
        };
    }
});
Template.proposal.events({
    "click ul.pos li"(event) {
        Template.instance().positionChoice.set(event.target.className);
    }
});

