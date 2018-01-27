function onChange(target) {
   if (target) {
        var submitBtn = $(this.find('.btn'));
        if (target.value) {
            submitBtn.removeClass('disabled');
        } else {
            submitBtn.addClass('disabled');
        }
    }
 
}
function awaitProposal(txhash) {
    web3.eth.getTransaction(txhash, function (error, result) {
        if (error) {
            console.error(error);
            return;
        }
        if (result.blockNumber) {
            var pendingproposals = this.pendingProposals.get();
            pendingProposals.filter((proposal)=>{
                return proposal.txhash != txhash;
            });
            Accounts.resize();
            return;
        }
        setTimeout(function(){awaitProposal.bind(this)(txhash);}.bind(this),3000);
    }.bind(this));
}
Template.propose.onCreated(function() {
    this.gasCost = new ReactiveVar();
    this.showGas = new ReactiveVar(false);
    this.pendingProposals = new ReactiveVar([]);
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
            var pendingProposals = this.pendingProposals.get();
            pendingProposals.push({
                txhash:txhash,
                title:proposal,
            });
            awaitProposal.bind(this)(txhash);
            this.pendingProposals.set(pendingProposals);
        }.bind(Template.instance()));
    },
    "mouseover .submit"(event) {
        var instance = Template.instance();
        var proposal = Template.instance().find('#propose').value;
        instance.showGas.set(true);
        if (instance.lastValue != proposal || GasRender.method.get() != instance.lastMethod) {
            instance.lastValue = proposal;
            Web3Loader.onWeb3(function() {
                accountRegistry.propose.estimateGas(this.lastValue, function(error, estimatedGas) {
                    if (error) {
                        console.error(error);
                        return;
                    }
                    this.gasCost.set(GasRender.toString(estimatedGas));
                    this.lastMethod = GasRender.method.get();
                }.bind(this));
            }.bind(instance));
        }
    },
    "mouseout .submit"(event) {
        Template.instance().showGas.set(false);
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
    showGas() {
        return Template.instance().showGas.get();
    },
    pendingProposals() {
        return Template.instance().pendingProposals.get();
    },
});
