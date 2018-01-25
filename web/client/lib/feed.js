Template.feed.onCreated(function() {
    this.count = new ReactiveVar(1);
    Accounts.proposalCount(function(count) {
        this.count.set(count);
    }.bind(this));
});
Template.feed.onDestroyed(function() {
});
Template.feed.helpers({
    lastIndex() {
        return Template.instance().count.get() - 1;
    }
});

Template.feeditem.onCreated(function() {
    this.index = new ReactiveVar(this.data.index);
    this.next = new ReactiveVar(this.data.index - 1);
});
Template.feeditem.helpers({
    hasNext() {
        return Template.instance().next.get() >= 0;
    },
    index() {
        return Template.instance().index.get();
    },
    next() {
        return Template.instance().next.get();
    },
});
