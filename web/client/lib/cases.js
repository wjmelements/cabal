Template.cases.onCreated(function() {
    this.position = this.data.position;
    this.address = this.data.address;
    this.pos = new ReactiveVar(parseInt(this.position.get().substr(3)));
    this.cases = new ReactiveVar();
    this.inv = new ReactiveVar(false);
    this.choice = new ReactiveVar();
    this.voting = new ReactiveVar(false);
    onChoice();
});
Template.cases.onRendered(function() {
    $('textarea.case').addClass(this.position.get());
    onChange.bind(this)(this.find('textarea'));
});
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
        console.log(Template.instance().voting.get());
        return Template.instance().voting.get();
    },
    skip() {
        return Template.instance().pos.get() == 0;
    }
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
    "click .case p"(event) {
        var choice = parseInt(event.target.id.substr(3));
        Template.instance().pos.set(parseInt(event.target.className.substr(3)));
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
                // TODO show error
            } else {
                console.log(result);
            }
        });
    },
    "click #custom-arg input.btn"(event) {
        var customCase = Template.instance().find('#custom-arg textarea');
        Proposals.argue(
            Template.instance().address.get(),
            Template.instance().pos.get(),
            customCase.value,
            function(error, txhash) {
                if (error) {
                    console.error(error);
                    return;
                }
                console.log(txhash);
                this.voting.set(true);
            }.bind(Template.instance())
        );

    },
});
