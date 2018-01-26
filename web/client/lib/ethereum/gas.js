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
Web3Loader.onWeb3(function() {
    web3.eth.getGasPrice(function (error, gasPrice) {
        if (error) {
            console.error(error);
            return;
        }
        console.log(gasPrice.c[0]);
        GasRender.gasPrice.set(gasPrice.c[0] / 1E12);
    });
});
