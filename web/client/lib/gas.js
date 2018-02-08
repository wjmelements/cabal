Template.gas.onCreated(function() {
    var priorMethod = localStorage.getItem('gasmethod');
    GasRender.method.set(priorMethod || 'usd');
    var priorPolicy = localStorage.getItem('gaspolicy');
    GasRender.policy.set(priorPolicy || 'safeLow');
    GasRender.update();
});
Template.gas.onRendered(function() {
    this.find('select').value = GasRender.method.get();
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
