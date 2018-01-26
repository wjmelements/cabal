function onChange(target) {
   if (target) {
        var submitBtn = $(this.find('.btn'));
        if (target.value) {
            if (this.lastValue != target.value) {
                this.lastValue = target.value;
                Web3Loader.onWeb3(function() {
                    accountRegistry.propose.estimateGas(this.lastValue, function(error, estimatedGas) {
                        if (error) {
                            console.error(error);
                            return;
                        }
                        this.gasCost.set(GasRender.toString(estimatedGas));
                    }.bind(this));
                }.bind(this));
            }
            submitBtn.removeClass('disabled');
        } else {
            submitBtn.addClass('disabled');
        }
    }
 
}
Template.propose.onCreated(function() {
    this.gasCost = new ReactiveVar();
    this.lastValue = undefined;
});
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
            // TODO awaitProposal()
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
Template.propose.helpers({
    gasCost() {
        return Template.instance().gasCost.get();
    },
});
