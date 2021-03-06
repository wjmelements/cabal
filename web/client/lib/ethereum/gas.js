GasRender = {
    toString(gas) {
        var method = GasRender.method.get();
        if (method == "gas") {
            return gas;
        }
        var cost = gas * GasRender.gasPrice.get()
        if (method == "szabo") {
            return cost.toPrecision(5);
        }
        cost /= 1000;
        if (method == "finney") {
            return cost.toPrecision(5);
        }
        cost /= 1000;
        if (method == "ether") {
            return cost.toPrecision(5);
        }
        if (method == "eur") {
            cost *= GasRender.etherPriceEUR.get();
            return '€'+cost.toFixed(2);
        }
        if (method != "usd") {
            throw new Error("Unsupported:"+method);
        }
        cost *= GasRender.etherPriceUSD.get();
        return '$'+cost.toFixed(2);
    },
    gasPriceInWei() {
        return parseInt(GasRender.gasPrice.get()*1e12);
    },
    showFinney() {
        var method = GasRender.method.get();
        if (method == "finney") {
            return 1;
        }
        if (method == "szabo") {
            return 1000;
        }
        if (method == "gas" || method == "ether") {
            return .001;
        }
        if (method == "eur") {
            return '€'+(GasRender.etherPriceEUR.get()/1000).toFixed(2);
        }
        if (method != "usd") {
            throw new Error("Unsupported:"+method);
        }
        return '$'+(GasRender.etherPriceUSD.get()/1000).toFixed(2);
    },
    update() {
        GasRender.gasPrice.set(parseFloat((GasRender[GasRender.policy.get()].get()||{cost:1}).cost) / 1000);
        GasRender.finney.set(GasRender.showFinney());
    },
}
GasRender.method = new ReactiveVar('ether');
GasRender.gasPolicy = new ReactiveVar();
GasRender.gasPrice = new ReactiveVar(.001);
GasRender.etherPriceUSD = new ReactiveVar(1000);
GasRender.etherPriceEUR = new ReactiveVar(900);
GasRender.fastest = new ReactiveVar();
GasRender.fast = new ReactiveVar();
GasRender.standard = new ReactiveVar();
GasRender.safeLow = new ReactiveVar();
GasRender.policy = new ReactiveVar('safeLow');
var priorMethod = localStorage.getItem('gasmethod');
GasRender.method.set(priorMethod || 'ether');
var priorPolicy = localStorage.getItem('gaspolicy');
if (priorPolicy) {
    GasRender.policy.set(priorPolicy);
}
GasRender.finney = new ReactiveVar(GasRender.showFinney());

function fetchGasPrice() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open('GET', 'https://ethgasstation.info/json/ethgasAPI.json', true /*asynchronous*/);
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.responseText) {
            var response = JSON.parse(xmlHttp.responseText);
            console.log(response);
            xmlHttp.onreadystatechange = null;
            function gwei(a) {return a/10+' Gwei'};
            function minutes(a) {return a + ' min'};
            GasRender.safeLow.set({
                cost:gwei(response.safeLow),
                time:minutes(response.safeLowWait)
            });
            GasRender.standard.set({
                cost:gwei(response.average),
                time:minutes(response.avgWait)
            });
            GasRender.fast.set({
                cost:gwei(response.fast),
                time:minutes(response.fastWait)
            });
            GasRender.fastest.set({
                cost:gwei(response.fastest),
                time:minutes(response.fastestWait)
            });
            GasRender.update();
        }
    };
    xmlHttp.send(null);
}
/*
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
*/
function fetchETHPrice() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open('GET', 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD,EUR', true /*asynchronous*/);
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.responseText) {
            var response = JSON.parse(xmlHttp.responseText);
            console.log(response);
            GasRender.etherPriceUSD.set(response.USD);
            GasRender.etherPriceEUR.set(response.EUR);
            xmlHttp.onreadystatechange = null;
            GasRender.update();
        }
    }
    xmlHttp.send(null);
}
window.addEventListener('load', fetchETHPrice);
window.addEventListener('load', fetchGasPrice);
