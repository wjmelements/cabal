Template.propose.events({
    "click .submit"(event) {
        var proposal = Template.instance().find('#propose').value;
        Accounts.propose(proposal, function(error, txhash) {
            if (error) {
                console.error(error);
                return;
            }
            console.log(txhash);
        });
    },
});
