Template.gas.onRendered(function() {
    this.find('select#method').value = GasRender.method.get();
    this.find('select#policy').value = GasRender.policy.get();
});
Template.gas.events({
    "change select#method"(event) {
        var val = event.target.value;
        GasRender.method.set(val);
        GasRender.update();
        localStorage.setItem('gasmethod', val);
    },
    "change select#policy"(event) {
        var val = event.target.value;
        GasRender.policy.set(val);
        GasRender.update();
        localStorage.setItem('gaspolicy', val);
    },
});
Template.gas.helpers({
    loaded() {
        return GasRender.safeLow.get();
    },
    safeLow() {
        return GasRender.safeLow.get();
    },
    standard() {
        return GasRender.standard.get();
    },
    fast() {
        return GasRender.fast.get();
    },
    fastest() {
        return GasRender.fastest.get();
    },
});
