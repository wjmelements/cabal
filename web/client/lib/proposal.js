// hardcoded utf8
function bytesToStr(bytes) {
    var str = "";
    for (var i = 2; i < bytes.length; i+=2) {
        var codePoint = parseInt(bytes.substring(i, i+2), 16);
        if (codePoint >= 128) {
            i+=2;
            codePoint -= 192;
            codePoint <<= 6;
            codePoint |= parseInt(bytes.substring(i, i+2), 16)-128;
            if (codePoint >= 2048) {
                i+=2;
                codePoint -= 2048;
                codePoint <<= 6;
                codePoint |= parseInt(bytes.substring(i, i+2), 16)-128;
                if (codePoint >= 65536) {
                    i+=2;
                    codePoint -= 65536
                    codePoint <<= 6;
                    codePoint |= parseInt(bytes.substring(i, i+2), 16)-128;
                }
            }
        }
        try {
            str += String.fromCodePoint(codePoint);
        } catch(e){console.error(e);}
    }
    return str;
}
Template.proposal.onCreated(function() {
    console.log("proposal.onCreated");
    this.choice = new ReactiveVar();
    this.title = new ReactiveVar("Loading...");
    this.index = this.data.index;
    this.address = new ReactiveVar();
    Accounts.getProposal(this.index, function(address) {
        this.address.set(address);
        Proposals.getArgument(address, 0, function(proposal) {
            this.title.set(bytesToStr(proposal.text));
        }.bind(this));
    }.bind(this));
});
Template.proposal.helpers({
    proposal() {
        return Template.instance().title.get();
    },
    page() {
        return Template.instance().choice.get() ? "cases" : "positions";
    },
    choice() {
        return Template.instance().choice.get();
    }
});
Template.proposal.events({
    "click ul.pos li"(event) {
        Template.instance().choice.set(event.target.className);
    }
});

