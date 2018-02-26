function onChange(target) {
    if (target) {
        var str = target.value;
        this.cannotPropose.set(!str);
        Case.setWarnings(this.warnings, str);
        Case.setHeight(target, this.find('.btn'));
    }
}
function awaitProposal(txhash) {
    Proposals.await(txhash, function() {
        var pendingProposals = this.pendingProposals.get().slice(0);
        pendingProposals = pendingProposals.filter((proposal)=>{
            return proposal.txhash != txhash;
        });
        this.pendingProposals.set(pendingProposals);
        var priorProposals = localStorage.getItem('pendingProposals');
        if (priorProposals) {
            var pendingProposals = JSON.parse(priorProposals);
            if (pendingProposals) {
                pendingProposals = pendingProposals.filter(function(a){return a.txhash != txhash;});
                localStorage.setItem('pendingProposals', pendingProposals);
            }
        }
    }.bind(this));
}
Template.propose.onCreated(function() {
    this.warnings = new ReactiveVar();
    this.gasCost = new ReactiveVar();
    this.showGas = new ReactiveVar(false);
    this.pendingProposals = new ReactiveVar([]);
    var pendingProposals = localStorage.getItem('pendingProposals');
    if (pendingProposals) {
        pendingProposals = JSON.parse(pendingProposals);
        for (index in pendingProposals) {
            var pendingProposal = pendingProposals[index];
            console.log(pendingProposal);
            web3.eth.getTransaction(pendingProposal.txhash, function(error, result) {
                if (error) {
                    console.error(error);
                    return;
                }
                if (result.blockNumber) {
                    var priorProposals = localStorage.getItem('pendingProposals');
                    if (priorProposals) {
                        var pendingProposals = JSON.parse(priorProposals);
                        if (pendingProposals) {
                            pendingProposals = pendingProposals.filter(function(a){return a.txhash != pendingProposal.txhash;});
                            localStorage.setItem('pendingProposals', pendingProposals);
                        }
                    }
                } else {
                    var pendingProposals = this.pendingProposals.get().slice(0);
                    pendingProposals.push({
                        txhash:pendingProposal.txhash,
                        title:pendingProposal.title,
                    });
                    this.pendingProposals.set(pendingProposals);
                    awaitProposal.bind(this)(pendingProposal.txhash);
                }
            }.bind(this));
        }
    }
    this.cannotPropose = new ReactiveVar(true);
    this.lastValue = undefined;
});
Template.propose.events({
    "click .btn"(event) {
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
            console.log(proposal);
            var pendingProposals = this.pendingProposals.get().slice(0);
            pendingProposals.push({
                txhash:txhash,
                title:proposal,
            });
            awaitProposal.bind(this)(txhash);
            this.pendingProposals.set(pendingProposals);
            localStorage.setItem('pendingProposals', JSON.stringify(pendingProposals))
        }.bind(Template.instance()));
    },
    "mouseover .btn"(event) {
        var instance = Template.instance();
        var proposal = Template.instance().find('#propose').value;
        instance.showGas.set(true);
        if (instance.lastValue != proposal) {
            instance.lastValue = proposal;
            Web3Loader.onWeb3(function() {
                accountRegistry.proposeProxy.estimateGas(this.lastValue, function(error, estimatedGas) {
                    if (error) {
                        console.error(error);
                        return;
                    }
                    this.lastGas = estimatedGas;
                    this.gasCost.set(GasRender.toString(estimatedGas));
                    this.lastMethod = GasRender.method.get();
                    this.lastPolicy = GasRender.policy.get();
                }.bind(this));
            }.bind(instance));
        } else if (instance.lastMethod != GasRender.method.get() || instance.lastPolicy != GasRender.policy.get()) {
            instance.gasCost.set(GasRender.toString(instance.lastGas));
            instance.lastMethod = GasRender.method.get();
            instance.lastPolicy = GasRender.policy.get();
        }
    },
    "mouseout .btn"(event) {
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
    warnings() {
        return Template.instance().warnings.get();
    },
    gasCost() {
        return Template.instance().gasCost.get();
    },
    firefox() {
        return Browser.isFirefox();
    },
    showGas() {
        return Template.instance().showGas.get();
    },
    pendingProposals() {
        return Template.instance().pendingProposals.get();
    },
    cannotPropose() {
        return Template.instance().cannotPropose.get();
    },
});
