Template.proposal.onCreated(function() {
    this.positionChoice = new ReactiveVar();
    this.title = new ReactiveVar("Loading...");
    this.voted = new ReactiveVar();
    this.index = this.data.index;
    this.address = new ReactiveVar();
    this.argumentChoice = new ReactiveVar();
    this.voteCount = new ReactiveVar();
    this.argumentCount = new ReactiveVar();
    this.gradient = document.createElement('style');
    document.head.appendChild(this.gradient);
    Accounts.getProposal(this.index, function(address) {
        this.address.set(address);
        Proposals.getArgument(address, 0, function(proposal) {
            this.title.set(proposal.text);
            // FIXME negative this should be the vote count
            console.log(proposal.voteCount);
            //this.voteCount.set(proposal.voteCount);
        }.bind(this));
        Proposals.voteCount(address, function(voteCount) {
            this.voteCount.set(voteCount);
        }.bind(this));
        Proposals.prefetchArguments(address, function() {
            var proposal = Proposals[address];
            var total = 0;
            for (var i = 1; i < 5; i++) {
                var contribution = proposal['votes'+i];
                total += contribution  ? contribution : 0;
            }
            var positionPcts = []
            var runningTotal = total;
            total /= 100;
            for (var i = 4; i > 0; i--) {
                var contribution = proposal['votes'+i];
                runningTotal -= contribution ? contribution : 0;
                positionPcts.push(parseInt(100 - runningTotal / total));
            }
            this.gradient.innerHTML = 'div#'+address.substring(1)+' {background: linear-gradient(to bottom, #FFDBDB '+ (positionPcts[0])+"%, #FCFF8B "+ (positionPcts[0]+1) + "%, #FCFF8B "+(positionPcts[1])+"%, #BEFFF8 "+(positionPcts[1]+1)+"%, #BEFFF8 "+(positionPcts[2])+"%, #33FF33 "+(positionPcts[2]+1)+'%, #33FF33 '+(positionPcts[3])+'%);}';
            console.log(this.gradient);
        }.bind(this));
        Proposals.getMyVote(address, function(myVote) {
            if (!myVote) {
                return;
            }
            Proposals.getArgument(address, myVote, function(argument) {
                this.argumentChoice.set(argument);
                this.voted.set(argument);
                this.positionChoice.set('pos'+argument.position);
            }.bind(this));
        }.bind(this));
        Proposals.getArgumentCount(address, function(argumentCount) {
            this.argumentCount.set(argumentCount - 1);
        }.bind(this));
    }.bind(this));
});
Template.proposal.onDestroyed(function() {
    document.head.removeChild(this.gradient);
});
Template.proposal.helpers({
    proposal() {
        return Template.instance().title.get();
    },
    page() {
        var instance = Template.instance();
        return instance.positionChoice.get()
            ? instance.voted.get() && (instance.argumentChoice.get() && instance.argumentChoice.get().index) == (instance.voted.get() && instance.voted.get().index)
                ? "voted"
                : "cases"
            : "positions";
    },
    choice() {
        return Template.instance().positionChoice.get();
    },
    voteCount() {
        return Template.instance().voteCount.get();
    },
    data() {
        return {
            address:Template.instance().address,
            position:Template.instance().positionChoice,
            choice:Template.instance().argumentChoice,
            voted:Template.instance().voted,
        };
    },
    addressId() {
        var address = Template.instance().address.get();
        return address && address.substring(1);
    },
    argumentCount() {
        return Template.instance().argumentCount.get();
    }
});
Template.proposal.events({
    "click ul.pos li"(event) {
        Template.instance().positionChoice.set(event.target.className);
    }
});

