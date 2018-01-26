// TODO load gas preference
Template.gas.onCreated(function() {
    GasRender.method.set("gas");
    
});
Template.gas.events({
    "change select"(event) {
        GasRender.method.set(event.target.value);
    }
});

