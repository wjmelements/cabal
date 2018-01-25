var lastSize = 0; // TODO store size
function onResize() {
    // this hack resizes the feed
    this.noRender.set(true);
    window.setTimeout(function() {this.noRender.set(false)}.bind(this), 1);
}
Template.feed.onCreated(function() {
    this.lastIndex = new ReactiveVar(lastSize);
    this.noRender = new ReactiveVar(false)
    Accounts.proposalCount(function(count) {
        this.lastIndex.set(count - 1);
        onResize.bind(this)();
    }.bind(this));
});
Template.feed.onDestroyed(function() {
});
Template.feed.helpers({
    lastIndex() {
        return Template.instance().lastIndex.get();
    },
    noRender() {
        return Template.instance().noRender.get();
    },
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
