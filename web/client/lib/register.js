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
function init() {
    Accounts.current(function(account) {
        Accounts.deregistrationDate(function (date) {
            var secs = date - Date.now()/1000;
            var time = [secs];
            this.timer.set(timeFormat(time[0]));
            if (timerTimer) {
                clearInterval(timerTimer);
            }
            timerTimer = setInterval(function () {
                time[0]--;
                this.timer.set(timeFormat(time[0]));
            }.bind(this), 1000);
        }.bind(this));
    }.bind(this));
}
Template.register.onCreated(function() {
    this.showTimer = new ReactiveVar(false);
    this.cost = new ReactiveVar();
    this.showCost = new ReactiveVar(false);
    this.txhash = new ReactiveVar();
    this.price = GasRender.finney;
    this.timer = new ReactiveVar();
    init.bind(this)();
});
Template.register.helpers({
    registered() {
        return Accounts.registered.get();
    },
    registering() {
        return Accounts.registering.get();
    },
    canDeregister() {
        return Accounts.canDeregister.get();
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
function onRegistered() {
    Accounts.registering.set(false);
    if (Accounts.registered.get()) {
        Accounts.canDeregister.set(false);
    }
}
Template.register.events({
    "click .submit"(event) {
        // if we are not registered, canDeregister is still true
        // because it has been more than 7 days since we last registered
        if (!Accounts.canDeregister.get()) {
            return;
        }
        if (Accounts.registering.get()) {
            return;
        }
        var onPendingTx = function(txhash) {
            console.log(txhash);
            Accounts.registering.set(true);
            this.txhash.set(txhash);
            var registered = !Accounts.registered.get();
            Accounts.registered.set(registered);
            Accounts.canDeregister.set(!registered);
            Accounts.reportRegistrationChange();
            Transactions.awaitPendingTransaction(txhash, 0, onRegistered.bind(this));
        }.bind(Template.instance());
        if (Accounts.registered.get()) {
            Accounts.deregister(onPendingTx);
        } else {
            Accounts.register(onPendingTx);
        }
    },
    "mouseover .submit"(event) {
        if (!accountRegistry) {
            return;
        }
        if (Accounts.registering.get()) {
            return;
        }
        var inst = Template.instance();
        if (!Accounts.canDeregister.get()) {
            inst.showTimer.set(true);
            return;
        }
        inst.showCost.set(true);
        var resultFn = function(error, gas) {
            if (error) {
                console.error(error);
                return;
            }
            this.cost.set(GasRender.toString(gas));
        }.bind(inst);
        if (Accounts.registered.get()) {
            if (Accounts.canDeregister.get()) {
                accountRegistry.deregister.estimateGas(resultFn);
            }
        } else {
            inst.cost.set(GasRender.toString(63205));
            accountRegistry.register.estimateGas({value: 1E15}, resultFn);
        }
    },
    "mouseout .submit"(event) {
        Template.instance().showCost.set(false);
        Template.instance().showTimer.set(false);
    },
});
