function onChange(target) {
   if (target) {
        var submitBtn = this.find('.btn');
        console.log(submitBtn);
        console.log(target.value);
        console.log(!target.value);
        if (!target.value) {
            $(submitBtn).addClass('disabled');
        } else {
            $(submitBtn).removeClass('disabled');
        }
    }
 
}
Template.propose.events({
    "click .submit"(event) {
        var proposal = Template.instance().find('#propose').value;
        if (!proposal) {
            return;
        }
        Accounts.propose(proposal, function(error, txhash) {
            if (error) {
                console.error(error);
                return;
            }
            console.log(txhash);
        });
    },
    "change textarea.case"(event) {
        onChange.bind(Template.instance())(event.target);
    },
    "keyup textarea"(event) {
        onChange.bind(Template.instance())(event.target);
    },
});
Template.propose.onRendered(function() {
    onChange.bind(this)(this.find('textarea'));
});
