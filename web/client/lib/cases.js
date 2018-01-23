Template.cases.onCreated(function() {
    this.position = this.data.position;
    this.address = this.data.address;
    this.pos = new ReactiveVar(parseInt(this.position.get().substr(3)));
    this.cases = new ReactiveVar();
    this.inv = new ReactiveVar(false);
    this.choice = new ReactiveVar();
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
    choice() {
        return Template.instance().choice.get();
    },
});
function onChange(target) {
    this.find('.btn').disabled = !target.value;
}
function onChoice() {
    var cases;
    if (Template.instance().inv.get()) {
        cases = Proposals.argumentsOpposing(Template.instance().address.get(), Template.instance().pos.get());
    } else {
        cases = Proposals.argumentsSupporting(Template.instance().address.get(), Template.instance().pos.get());
    }
    console.log(cases.length);
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
    }
});
