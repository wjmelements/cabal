Template.cases.onCreated(function() {
    this.position = this.data.position;
    this.address = this.data.address;
    this.choice = this.data.choice;
    this.voted = this.data.voted;
    var pos = parseInt(this.position.get().substr(3));
    this.pos = new ReactiveVar(pos);
    this.skip = new ReactiveVar(pos == 0);
    this.cases = new ReactiveVar();
    this.inv = new ReactiveVar(false);
    this.voting = new ReactiveVar(false);
    this.cannotVote = new ReactiveVar(true);
    this.cannotArgue = new ReactiveVar(true);
    onChoice();
});
Template.cases.onRendered(function() {
    onChange.bind(this)(this.find('textarea'));
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
            return 'Reject';
        case 4:
            return 'LOL';
    }
}
Template.cases.helpers({
    cases() {
        return Template.instance().cases.get();
    },
    inverse() {
        return Template.instance().inv.get();
    },
    hasChoice() {
        return Template.instance().inv.get();
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
});
function onChange(target) {
    if (target) {
        Template.instance().cannotVote.set(Balance.get() < 1);
        Template.instance().cannotArgue.set(!target.value || Balance.get() < 1);
    }
}
function onChoice() {
    var cases;
    if (Template.instance().inv.get()) {
        cases = Proposals.argumentsOpposing(Template.instance().address.get(), Template.instance().pos.get());
    } else {
        cases = Proposals.argumentsSupporting(Template.instance().address.get(), Template.instance().pos.get());
    }
    Template.instance().cases.set(cases);
}
function checkArgument(address, i, argumentCount, customCase) {
    Proposals.getArgument(address, i, function(argument) {
        if (argument.text == customCase) {
            this.voting.set(false);
        } else if (i < argumentCount) {
            checkArgument.bind(this)(address, i + 1, argumentCount, customCase);
        } else {
            awaitArgument.bind(this)(address, argumentCount, customCase);
        }
    }.bind(this));
}
function awaitArgument(address, lastArgumentCount, customCase) {
    Proposals.getArgumentCount(address, function(argumentCount) {
        if (argumentCount > lastArgumentCount) {
            checkArgument.bind(this)(address, lastArgumentCount, argumentCount, customCase);
            return;
        }
        window.setTimeout(function() {
            awaitArgument.bind(this)(address, lastArgumentCount, customCase);
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
        Template.instance().pos.set(pos);
        Template.instance().position.set('pos'+pos);
        Template.instance().skip.set(pos == 0);
        var choice = parseInt(event.target.id.substr(3));
        if (!choice) {
            onChoice();
            return;
        }
        Template.instance().inv.set(true);
        Proposals.getArgument(Template.instance().address.get(), choice, function(choice) {
            Template.instance().choice.set(choice);
            onChoice();
        });
    },
    "click .vote"(event) {
        if (Template.instance().cannotVote.get()) {
            return;
        }
        var choice = Template.instance().choice.get();
        var address = Template.instance().address.get();
        var choiceIndex = choice.index;
        Proposals.vote(address, choiceIndex, function (error, result) {
            if (error) {
                console.error(error);
                return;
            }
            this.voting.set(true);
            awaitVoted.bind(this)(address, choiceIndex, choice);
        }.bind(Template.instance()));
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
                    this.choice.set({
                        position:position,
                        index:argumentCount,
                        text:customCase
                    });
                    this.voting.set(true);
                    this.inv.set(true);
                    Balance.set(Balance.get() - 1);
                    awaitArgument.bind(this)(address, argumentCount, customCase);
                }.bind(this)
            );
        }.bind(Template.instance()));
    },
    "click .reset"(event) {
        Template.instance().position.set(undefined);
    }
});
