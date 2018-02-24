var lastSize = 1; // TODO store size
function onResize(count) {
    if (this.lastIndex.get() == count) {
        return;
    }
    if (count == 0) {
        this.lastIndex.set(0);
    } else {
        this.lastIndex.set(count - 1);
    }
    // this hack resizes the feed
    this.noRender.set(true);
    window.setTimeout(function() {this.noRender.set(false)}.bind(this), Browser.isFirefox() ? 35 : 1);
}
Template.feed.onCreated(function() {
    this.lastIndex = new ReactiveVar(lastSize);
    this.noRender = new ReactiveVar(false)
    this.onResize = onResize.bind(this);
    Accounts.resizeSubscribe(this.onResize);
    Accounts.proposalCount(this.onResize);
});
Template.feed.onDestroyed(function() {
    Accounts.resizeUnsubscribe(this.onResize);
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
