function onPendingVote(txhash, choice) {
    this.txhash.set(txhash);
    this.showCost.set(false);
    this.voting.set(true);
    Transactions.awaitPendingTransaction(txhash, -1, function() {
        localStorage.setItem('pvote'+this.address.get(), '');
        this.voting.set(false);
        this.voted.set(choice);
        this.onVote();
    }.bind(this));
}
Template.cases.onCreated(function() {
    this.warnings = new ReactiveVar();
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
    this.showInsufficient = new ReactiveVar(false);
    this.txhash = new ReactiveVar();
    this.cost = new ReactiveVar();
    var priorVoting = localStorage.getItem('pvote'+this.address.get());
    if (priorVoting) {
        priorVoting = JSON.parse(priorVoting);
        this.choice.set(priorVoting.b);
        web3.eth.getTransaction(priorVoting.a, function(error, result) {
            if (error) {
                console.error(error);
                return;
            }
            if (result.blockNumber) {
                this.voted.set(priorVoting.b);
                this.onVote();
            } else {
                onPendingVote.bind(this)(priorVoting.a, priorVoting.b);
            }
        }.bind(this));
    }
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
            return 'Reject';
        case 3:
            return 'Amend';
        case 4:
            return 'LOL';
    }
}
Template.cases.helpers({
    warnings() {
        return Template.instance().warnings.get();
    },
    cases() {
        return Template.instance().cases.get();
    },
    filter() {
        return Template.instance().filter.get();
    },
    firefox() {
        return Browser.isFirefox();
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
    proposal() {
        return Template.instance().data.proposal.get();
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
    showInsufficient() {
        return Template.instance().showInsufficient.get();
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
        Case.setWarnings(this.warnings, target.value);
    }
}
function updateCases() {
    var cases;
    var address = this.address.get();
    if (this.filter.get()) {
        cases = Proposals.argumentsSupporting(address, this.pos.get());
    } else {
        cases = Proposals.argumentsOpposing(address, 0);
    }
    var choice = this.choice.get();
    if (choice) {
        cases = cases.filter(function (a) {
            return a.index != choice.index;
        });
    }
    this.cases.set(cases);
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
            instance.cases.set(Proposals.argumentsSupporting(instance.address.get(), pos));
        }
        var choice = parseInt(event.target.id.substr(3));
        if (isNaN(choice)) {
            return;
        }
        localStorage.setItem('choice'+instance.address.get(), choice);
        if (!choice) {
            return;
        }
        Proposals.getArgument(instance.address.get(), choice, function(choice) {
            instance.choice.set(choice);
            updateCases.bind(instance)()
        });
    },
    "click .filter"(event) {
        var instance = Template.instance();
        var filter = !instance.filter.get();
        instance.filter.set(filter);
        updateCases.bind(instance)();
    },
    "mouseover .vote"(event) {
        var inst = Template.instance();
        if (inst.cannotVote.get()) {
            inst.showInsufficient.set(true);
            return;
        }
        if (inst.voting.get()) {
            return;
        }
        inst.showCost.set(true);
        Proposals[inst.address.get()].vote.estimateGas(
            inst.choice.get().index,
            function (error, gas) {
                if (error) {
                    console.error(error);
                    return;
                }
                this.cost.set(GasRender.toString(gas));
        }.bind(inst));
    },
    "mouseout .vote"(event) {
        Template.instance().showCost.set(false);
        Template.instance().showInsufficient.set(false);
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
        Proposals.vote(address, choiceIndex, function (error, txhash) {
            if (error) {
                console.error(error);
                return;
            }
            localStorage.setItem('pvote'+address, JSON.stringify({a:txhash,b:choice}));
            onPendingVote.bind(this)(txhash, choice);
        }.bind(instance));
    },
    "mouseover #custom-arg a.btn"(event) {
        var instance = Template.instance();
        if (instance.cannotArgue.get()) {
            instance.showInsufficient.set(true);
            return;
        }
        var cases = instance.cases.get();
        var content = instance.find('#custom-arg textarea').value;
        var hasCases = cases && cases.length > 0 || 0;
        // TODO instance.cost.set(GasRender.toString(Proposals.estimateArgGas(content.length, hasCases)));
        Proposals[instance.address.get()].argue.estimateGas(instance.pos.get(), content, function (error, gas) {
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
        Template.instance().showInsufficient.set(false);
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
            Accounts.current(function (account) {
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
                            source:account,
                            position:position,
                            index:argumentCount,
                            text:customCase
                        };
                        localStorage.setItem('pvote'+address, JSON.stringify({a:txhash,b:argument}));
                        this.choice.set(argument);
                        onPendingVote.bind(this)(txhash, argument);
                    }.bind(this)
                );
            }.bind(this));
        }.bind(Template.instance()));
    },
    "click .reset"(event) {
        var instance = Template.instance();
        instance.position.set();
        instance.choice.set();
        localStorage.setItem('choice'+Template.instance().address.get(), "");
        instance.skip.set(false);
        instance.data.refresh(true);
    }
});
