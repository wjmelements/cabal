Template.gas.onCreated(function() {
    var priorMethod = localStorage.getItem('gasmethod');
    GasRender.method.set(priorMethod || 'usd');
    GasRender.update();
});
Template.gas.onRendered(function() {
    this.find('select').value = GasRender.method.get();
});
Template.gas.events({
    "change select"(event) {
        var val = event.target.value;
        GasRender.method.set(val);
        GasRender.update();
        localStorage.setItem('gasmethod', val);
    }
});

