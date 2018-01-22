Template.cases.onCreated(function() {
    this.position = this.data;
    this.pos = new ReactiveVar(parseInt(this.position.substr(3)));
    this.cases = new ReactiveVar();
    this.inv = new ReactiveVar(false);
    this.choice = new ReactiveVar();
    onChoice();
});
Template.cases.onRendered(function() {
    $('textarea.case').addClass(this.position);
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
        return Cabal.argument(0, Template.instance().choice.get());
    },
});
function onChange(target) {
    this.find('.btn').disabled = !target.value;
}
function onChoice() {
    Template.instance().cases.set(Cabal.arguments(0, Template.instance().pos.get(), Template.instance().inv.get()));
}
Template.cases.events({
    "keyup textarea.case"(event) {
        onChange.bind(Template.instance())(event.target);
    },
    "change textarea.case"(event) {
        onChange.bind(Template.instance())(event.target);
    },
    "click .case p"(event) {
        Template.instance().choice.set(parseInt(event.target.id.substr(3)));
        Template.instance().pos.set(parseInt(event.target.className.substr(3)));
        Template.instance().inv.set(true);
        //Template.instance().find("#custom-arg").hidden = true;
        onChoice();
    }
});
