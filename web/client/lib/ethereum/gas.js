GasRender = {
    toString(gas) {
        var method = GasRender.method.get();
        if (method == "gas") {
            return gas;
        }
        var cost = gas * GasRender.gasPrice.get()
        if (method == "szabo") {
            return cost;
        }
        cost /= 1000;
        if (method == "finney") {
            return cost;
        }
        cost /= 1000;
        if (method == "ether") {
            return cost;
        }
        if (method != "usd") {
            throw new Error("Unsupported:"+method);
        }
        cost *= GasRender.etherPriceUSD.get();
        cost = Math.round(cost * 100) / 100;
        return cost;
    },
}
GasRender.method = new ReactiveVar();
GasRender.gasPolicy = new ReactiveVar();
GasRender.gasPrice = new ReactiveVar(.001);
GasRender.etherPriceUSD = new ReactiveVar(1000);
