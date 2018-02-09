var timerTimer;
function timeFormat(secondsRemaining) {
    secondsRemaining = parseInt(secondsRemaining);
    var daysRemaining = parseInt(secondsRemaining / 86400);
    secondsRemaining -= daysRemaining * 86400;
    var hoursRemaining = parseInt(secondsRemaining / 3600);
    secondsRemaining -= hoursRemaining * 3600;
    var minutesRemaining = parseInt(secondsRemaining / 60);
    secondsRemaining -= minutesRemaining * 60;
    if (secondsRemaining < 10) {
        secondsRemaining = '0'+secondsRemaining;
    }
    if (minutesRemaining < 10 && (daysRemaining || hoursRemaining)) {
        minutesRemaining = '0'+minutesRemaining;
    }
    if (hoursRemaining < 10 && daysRemaining) {
        hoursRemaining = '0'+hoursRemaining;
    }
    return (daysRemaining ? daysRemaining + ':' : '') + (daysRemaining || hoursRemaining ? hoursRemaining + ':' : '') + minutesRemaining + ':' + secondsRemaining;
}
function refresh() {
    Accounts.current(function(currentAccount) {
        this.account.set(currentAccount);
        Accounts.isRegistered(currentAccount, function(isRegistered) {
            Accounts.registered.set(isRegistered);
            if (isRegistered) {
                Accounts.canDeregister(function (canDeregister) {
                    this.canDeregister.set(canDeregister);
                    if (!canDeregister) {
                        Accounts.deregistrationDate(function (date) {
                            // TODO timer once smart contract upgraded
                            console.log(date);
                            var secs = date - Date.now()/1000;
                            var time = [secs];
                            time = [86420];//XXX
                            this.timer.set(timeFormat(time[0]));
                            if (timerTimer) {
                                clearInterval(timerTimer);
                            }
                            timerTimer = setInterval(function () {
                                time[0]--;
                                this.timer.set(timeFormat(time[0]));
                            }.bind(this), 1000);
                        }.bind(this));
                    }
                }.bind(this));
            }
        }.bind(this));
    }.bind(this));
}
Template.register.onCreated(function() {
    this.account = new ReactiveVar();
    this.showTimer = new ReactiveVar(false);
    this.canDeregister = new ReactiveVar(true);
    this.cost = new ReactiveVar();
    this.showCost = new ReactiveVar(false);
    this.txhash = new ReactiveVar();
    this.price = GasRender.finney;
    this.timer = new ReactiveVar();
    refresh.bind(this)();
});
Template.register.helpers({
    registered() {
        return Accounts.registered.get();
    },
    registering() {
        return Accounts.registering.get();
    },
    canDeregister() {
        return Template.instance().canDeregister.get();
    },
    showCost() {
        return Template.instance().showCost.get();
    },
    cost() {
        return Template.instance().cost.get();
    },
    prefix() {
        return Net.prefix.get();
    },
    txhash() {
        return Template.instance().txhash.get();
    },
    price() {
        return Template.instance().price.get();
    },
    showTimer() {
        return Template.instance().showTimer.get();
    },
    timer() {
        return Template.instance().timer.get();
    },
});
function awaitRegistered() {
    web3.eth.getTransaction(this.txhash.get(), function (error, result) {
        if (error) {
            console.error(error);
            return;
        }
        console.log(result.blockNumber);
        if (result.blockNumber) {
            var registered = !Accounts.registered.get();
            Accounts.registered.set(registered);
            Accounts.registering.set(false);
            this.canDeregister.set(!registered);
            Accounts.reportRegistrationChange();
        } else {
            window.setTimeout(awaitRegistered.bind(this), 5000);
        }
    }.bind(this));
}
Template.register.events({
    "click .submit"(event) {
        // if we are not registered, canDeregister is still true
        // because it has been more than 7 days since we last registered
        if (!Template.instance().canDeregister.get()) {
            return;
        }
        if (Accounts.registering.get()) {
            return;
        }
        var account = Template.instance().account.get();
        if (Accounts.registered.get()) {
            Accounts.deregister(function(txhash) {
                console.log(txhash);
                this.txhash.set(txhash);
                Accounts.registering.set(true);
                awaitRegistered.bind(this)();
            }.bind(Template.instance()));
        } else {
            Accounts.register(function(txhash) {
                console.log(txhash);
                Accounts.registering.set(true);
                this.txhash.set(txhash);
                awaitRegistered.bind(this)();
            }.bind(Template.instance()));
        }
    },
    "mouseover .submit"(event) {
        if (!accountRegistry) {
            return;
        }
        if (Accounts.registering.get()) {
            return;
        }
        if (!Template.instance().canDeregister.get()) {
            Template.instance().showTimer.set(true);
            return;
        }
        Template.instance().showCost.set(true);
        var resultFn = function(error, gas) {
            if (error) {
                console.error(error);
                return;
            }
            this.cost.set(GasRender.toString(gas));
        }.bind(Template.instance());
        if (Accounts.registered.get()) {
            if (Template.instance().canDeregister.get()) {
                accountRegistry.deregister.estimateGas(resultFn);
            }
        } else {
            accountRegistry.register.estimateGas({value: 1E15}, resultFn);
        }
    },
    "mouseout .submit"(event) {
        Template.instance().showCost.set(false);
        Template.instance().showTimer.set(false);
    },
});
