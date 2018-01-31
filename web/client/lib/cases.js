Template.cases.onCreated(function() {
    this.position = this.data.position;
    this.address = this.data.address;
    this.choice = this.data.choice;
    this.voted = this.data.voted;
    this.onVote = this.data.refresh;
    this.cases = this.data.cases;
    var pos = this.position.get() ? parseInt(this.position.get().substr(3)) : undefined;
    this.pos = new ReactiveVar(pos);
    this.filter = new ReactiveVar(false);
    this.skip = new ReactiveVar(pos == 0);
    this.voting = new ReactiveVar(false);
    this.cannotVote = new ReactiveVar(true);
    this.cannotArgue = new ReactiveVar(true);
    this.showCost = new ReactiveVar(false);
    this.txhash = new ReactiveVar();
    this.cost = new ReactiveVar();
});
Template.cases.onRendered(function() {
    this.balanceListener = function () {
        onChange.bind(this)(this.find('textarea'));
    }.bind(this);
    Balance.listeners.push(this.balanceListener);
    this.balanceListener();
});
Template.cases.onDestroyed(function() {
    Balance.removeListener(this.balanceListener);
});
function positionToName(position) {
    switch(position) {
        case 0:
            return 'Skip';
        case 1:
            return 'Approve';
        case 2:
            return 'Amend';
        case 3:
            return 'LOL';
        case 4:
            return 'Reject';
    }
}
Template.cases.helpers({
    cases() {
        return Template.instance().cases.get();
    },
    filter() {
        return Template.instance().filter.get();
    },
    hasChoice() {
        return Template.instance().choice.get();
    },
    hasOptions() {
        var cases = Template.instance().cases.get();
        return cases && cases.length;
    },
    choice() {
        return Template.instance().choice.get();
    },
    position() {
        return Template.instance().position.get();
    },
    voting() {
        return Template.instance().voting.get();
    },
    skip() {
        return Template.instance().skip.get();
    },
    cost() {
        return Template.instance().cost.get();
    },
    showCost() {
        return Template.instance().showCost.get();
    },
    positionName() {
        return positionToName(Template.instance().pos.get());
    },
    otherPositions() {
        var position = Template.instance().pos.get();
        var others = [];
        for (var i = 0; i < 5; i++) {
            if (position == i) {
                continue;
            }
            others.push({
                className:'pos'+i,
                name:positionToName(i),
            });
        }
        console.log(others);
        return others;
    },
    cannotVote() {
        return Template.instance().cannotVote.get();
    },
    cannotArgue() {
        return Template.instance().cannotArgue.get();
    },
    prefix() {
        return Net.prefix.get();
    },
    txhash() {
        return Template.instance().txhash.get();
    },
});
function onChange(target) {
    this.cannotVote.set(Balance.get() < 1);
    if (target) {
        this.cannotArgue.set(!target.value || Balance.get() < 1);
    }
}
function checkArgument(address, i, argumentCount, customCase) {
    Proposals.getArgument(address, i, function(argument) {
        if (argument.text == customCase.text) {
            this.voting.set(false);
            this.voted.set(argument);
            this.choice.set(argument);
            this.onVote();
        } else if (i < argumentCount) {
            checkArgument.bind(this)(address, i + 1, argumentCount, customCase);
        } else {
            awaitArgument.bind(this)(address, argumentCount, customCase);
        }
    }.bind(this));
}
function awaitArgument(address, lastArgumentCount, argument) {
    Proposals.getArgumentCount(address, function(argumentCount) {
        if (argumentCount > lastArgumentCount) {
            checkArgument.bind(this)(address, lastArgumentCount, argumentCount, argument);
            return;
        }
        window.setTimeout(function() {
            awaitArgument.bind(this)(address, lastArgumentCount, argument);
        }.bind(this), 4000);
    }.bind(this));
}
function awaitVoted(address, choiceIndex, argument) {
    Proposals.getMyVote(address, function(myVote) {
        if (this.address.get() != address) {
            return;
        }
        if (myVote == choiceIndex) {
            this.voting.set(false);
            this.voted.set(argument);
            this.onVote();
            return;
        }
        window.setTimeout(function () {
            awaitVoted.bind(this)(address, choiceIndex, argument);
        }.bind(this), 5000);
    }.bind(this));
}
Template.cases.events({
    "keyup textarea.case"(event) {
        onChange.bind(Template.instance())(event.target);
    },
    "change textarea.case"(event) {
        onChange.bind(Template.instance())(event.target);
    },
    "click .case pre,.case li,.pos li"(event) {
        var pos = parseInt(event.target.className.substr(3));
        var instance = Template.instance();
        instance.pos.set(pos);
        instance.position.set('pos'+pos);
        instance.skip.set(pos == 0);
        if (instance.filter.get()) {
            console.log('but');
            instance.cases.set(Proposals.argumentsSupporting(instance.address.get(), pos));
        }
        var choice = parseInt(event.target.id.substr(3));
        localStorage.setItem('choice'+instance.address.get(), choice);
        if (!choice) {
            return;
        }
        Proposals.getArgument(instance.address.get(), choice, function(choice) {
            instance.choice.set(choice);
        });
    },
    "click .filter"(event) {
        var instance = Template.instance();
        var filter = !instance.filter.get();
        var address = instance.address.get();
        var pos = instance.pos.get();
        var cases;
        if (filter) {
            cases = Proposals.argumentsSupporting(address, instance.pos.get());
        } else {
            cases = Proposals.argumentsOpposing(address, 0);
        }
        instance.cases.set(cases);
        instance.filter.set(filter);
    },
    "mouseover .vote"(event) {
        if (Template.instance().cannotVote.get()) {
            return;
        }
        if (Template.instance().voting.get()) {
            return;
        }
        Template.instance().showCost.set(true);
        Proposals[Template.instance().address.get()].vote.estimateGas(
            Template.instance().choice.get().index,
            function (error, gas) {
                if (error) {
                    console.error(error);
                    return;
                }
                this.cost.set(GasRender.toString(gas));
        }.bind(Template.instance()));
    },
    "mouseout .vote"(event) {
        Template.instance().showCost.set(false);
    },
    "click .vote"(event) {
        var instance = Template.instance();
        if (instance.cannotVote.get()) {
            return;
        }
        if (instance.voting.get()) {
            return;
        }
        var choice = instance.choice.get();
        var address = instance.address.get();
        var choiceIndex = choice.index;
        Proposals.vote(address, choiceIndex, function (error, result) {
            if (error) {
                console.error(error);
                return;
            }
            this.txhash.set(result);
            this.voting.set(true);
            Balance.set(Balance.get() - 1);
            Balance.onChange();
            awaitVoted.bind(this)(address, choiceIndex, choice);
        }.bind(instance));
    },
    "mouseover #custom-arg a.btn"(event) {
        var instance = Template.instance();
        if (instance.cannotArgue.get()) {
            return;
        }
        Proposals[instance.address.get()].argue.estimateGas(instance.pos.get(), instance.find('#custom-arg textarea').value, function (error, gas) {
            if (error) {
                console.error(error);
                return;
            }
            this.cost.set(GasRender.toString(gas));
        }.bind(instance));
        instance.showCost.set(true);
    },
    "mouseout #custom-arg a.btn"(event) {
        Template.instance().showCost.set(false);
    },
    "click #custom-arg a.btn"(event) {
        var customCase = Template.instance().find('#custom-arg textarea').value;
        if (!customCase) {
            return;
        }
        if (Template.instance().cannotVote.get()) {
            return;
        }
        var address = Template.instance().address.get();
        var position = Template.instance().pos.get();
        Proposals.getArgumentCount(address, function(argumentCount) {
            Proposals.argue(
                address,
                position,
                customCase,
                function(error, txhash) {
                    if (error) {
                        console.error(error);
                        return;
                    }
                    console.log(txhash);
                    var argument = {
                        source:web3.eth.coinbase,
                        position:position,
                        index:argumentCount,
                        text:customCase
                    };
                    this.choice.set(argument);
                    this.txhash.set(txhash);
                    this.voting.set(true);
                    Balance.set(Balance.get() - 1);
                    awaitArgument.bind(this)(address, argumentCount, argument);
                }.bind(this)
            );
        }.bind(Template.instance()));
    },
    "click .reset"(event) {
        Template.instance().position.set(undefined);
        Template.instance().choice.set(undefined);
        Template.instance().skip.set(false);
    }
});
