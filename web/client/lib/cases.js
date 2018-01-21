Template.cases.onCreated(function() {
    this.position = this.data;
    this.pos = parseInt(this.position.substr(3));
    this.cases = new ReactiveVar();
    onChoice();
});
Template.cases.onRendered(function() {
    console.log(this.data);
    $('textarea.case').addClass(this.position);
    onChange.bind(this)(this.find('textarea'));
});
Template.cases.helpers({
    cases() {
        return Template.instance().cases.get();
    },
});
function onChange(target) {
    this.find('.btn').disabled = !target.value;
}
function onChoice() {
    Template.instance().cases.set(Cabal.arguments(0, Template.instance().pos, Template.instance().inv));
}
Template.cases.events({
    "keyup textarea.case"(event) {
        onChange.bind(Template.instance())(event.target);
    },
    "change textarea.case"(event) {
        onChange.bind(Template.instance())(event.target);
    },
    "click .case p"(event) {
        Template.instance().inv = true;
        onChoice();
    }
});
