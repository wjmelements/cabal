function refresh(ignoreVote) {
    var address = this.address.get();
    Proposals.getArgumentCount(address, function(argumentCount) {
        this.argumentCount.set(argumentCount - 1);
    }.bind(this));
    Proposals.refresh(address, function() {
        var proposal = Proposals[address];
        var total = 0;
        [1,3,4,2].forEach((i)=> {
            var contribution = proposal['votes'+i];
            total += contribution || 0;
        });
        var positionPcts = []
        var runningTotal = total;
        total /= 100;
        this.voteCount.set(proposal['votes0']);
        [2,4,3,1].forEach((i)=> {
            var contribution = proposal['votes'+i];
            runningTotal -= contribution || 0;
            positionPcts.push(parseInt(100 - runningTotal / total));
        });
        this.gradient.innerHTML = 'div#'+address.substring(1)+' {background: linear-gradient(to bottom, #FFDBDB '+ (positionPcts[0])+"%, #FCFF8B "+ (positionPcts[0]) + "%, #FCFF8B "+(positionPcts[1])+"%, #BEFFF8 "+(positionPcts[1])+"%, #BEFFF8 "+(positionPcts[2])+"%, #33FF33 "+(positionPcts[2])+'%, #33FF33 '+(positionPcts[3])+'%);}';
        var cases = Proposals.argumentsOpposing(this.address.get(), 0);
        this.cases.set(cases);
        if (ignoreVote) {
            return;
        }
        var priorVoting = localStorage.getItem('pvote'+address);
        if (priorVoting) {
            priorVoting = JSON.parse(priorVoting);
            web3.eth.getTransaction(priorVoting.a, function (error, result) {
                if (result.blockNumber) {
                    localStorage.setItem('pvote'+address, '');
                } else {
                    this.voted.set();
                }
            }.bind(this));
        }
        Proposals.getMyVote(address, function(myVote) {
            if (!myVote) {
                var choice = this.argumentChoice.get();
                if (choice) {
                    this.cases.set(cases.filter(function(a) { return a.index != choice.index;}));
                }
                return;
            }
            Proposals.getArgument(address, myVote, function(argument) {
                this.argumentChoice.set(argument);
                this.voted.set(argument);
                this.positionChoice.set('pos'+argument.position);
            }.bind(this));
        }.bind(this));
    }.bind(this));
}
Template.proposal.onCreated(function() {
    this.positionChoice = new ReactiveVar();
    this.title = new ReactiveVar("Loading...");
    this.voted = new ReactiveVar();
    this.cases = new ReactiveVar();
    this.index = this.data.index;
    this.address = new ReactiveVar();
    this.argumentChoice = new ReactiveVar();
    this.voteCount = new ReactiveVar();
    this.argumentCount = new ReactiveVar();
    this.gradient = document.createElement('style');
    document.head.appendChild(this.gradient);
    Accounts.getProposal(this.index, function(address) {
        this.address.set(address);
        var storedChoice = localStorage.getItem('choice'+this.address.get());
        var storedChoiceInt = parseInt(storedChoice);
        if (storedChoiceInt) {
            Proposals.getArgument(address, parseInt(storedChoice), function(argument) {
                this.argumentChoice.set(argument);
                this.positionChoice.set('pos'+argument.position);
            }.bind(this));
        } else if (storedChoiceInt == 0) {
            var pos = 0;
            this.positionChoice.set('pos'+pos);
        }
        Proposals.getArgument(address, 0, function(proposal) {
            this.title.set(proposal.text);
            this.voteCount.set(proposal.voteCount);
        }.bind(this));
        this.refresh = refresh.bind(this);
        this.refresh();
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
        if (!instance.address.get()) {
            return "loading";
        }
        return instance.voted.get() && (instance.argumentChoice.get() && instance.argumentChoice.get().index) == (instance.voted.get() && instance.voted.get().index)
                ? "voted"
                : "cases";
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
            refresh:Template.instance().refresh,
            cases:Template.instance().cases,
            proposal:Template.instance().title,
        };
    },
    addressId() {
        var address = Template.instance().address.get();
        return address && address.substring(1);
    },
    argumentCount() {
        return Template.instance().argumentCount.get();
    },
});
Template.proposal.events({
    "click ul.pos li"(event) {
        Template.instance().positionChoice.set(event.target.className);
        if (event.target.className.startsWith("pos0")) {
        }
    }
});
