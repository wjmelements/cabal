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
        console.log(position);
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
});
function onChange(target) {
    if (target) {
        this.find('.btn').disabled = !target.value;
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
Template.cases.events({
    "keyup textarea.case"(event) {
        onChange.bind(Template.instance())(event.target);
    },
    "change textarea.case"(event) {
        onChange.bind(Template.instance())(event.target);
    },
    "click .case p,.case li,.pos li"(event) {
        var pos = parseInt(event.target.className.substr(3));
        console.log(pos);
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
    "click .submit"(event) {
        var choice = Template.instance().choice.get();
        var address = Template.instance().address.get();
        Proposals.vote(address, choice.index, function (error, result) {
            if (error) {
                console.error(error);
                return;
            }
            console.log(this.voting);
            this.voting.set(true);
            console.log(result);
        });
    },
    "click #custom-arg input.btn"(event) {
        var customCase = Template.instance().find('#custom-arg textarea').value;
        Proposals.argue(
            Template.instance().address.get(),
            Template.instance().pos.get(),
            customCase,
            function(error, txhash) {
                if (error) {
                    console.error(error);
                    return;
                }
                console.log(txhash);
                // TODO show pending argument
            }.bind(Template.instance())
        );

    },
    "click .reset"(event) {
        console.log('reset');
        Template.instance().position.set(undefined);
    }
});
