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
function fetchGasPrice() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open('GET', 'https://ethgasstation.info/json/ethgasAPI.json', true /*asynchronous*/);
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.responseText) {
            var response = JSON.parse(xmlHttp.responseText);
            xmlHttp.onreadystatechange = null;
            GasRender.gasPrice.set(response.safeLow / 10000);
            console.log(GasRender.gasPrice.get());
        }
    };
    xmlHttp.send(null);
}
Web3Loader.onWeb3(function() {
    web3.eth.getGasPrice(function (error, gasPrice) {
        if (error) {
            console.error(error);
            fetchGasPrice();
            return;
        }
        GasRender.gasPrice.set(gasPrice.c[0] / 1E12);
        console.log(GasRender.gasPrice.get());
        fetchGasPrice();
    });
});
function fetchETHPrice() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open('GET', 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD', true /*asynchronous*/);
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.responseText) {
            var response = JSON.parse(xmlHttp.responseText);
            console.log(response);
            var etherPriceUSD = response.USD;
            GasRender.etherPriceUSD.set(etherPriceUSD);
            xmlHttp.onreadystatechange = null;
        }
    }
    xmlHttp.send(null);
}
window.addEventListener('load', fetchETHPrice);
