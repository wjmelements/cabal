nId = "4"; // TODO support main net
window.addEventListener('load', function() {
    if (typeof web3 === 'undefined') {
        console.log("Using infura");
        web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/x6jRpmEj17uLQR1TuV1E"));
    } else if (typeof web3.eth === 'undefined') {
        web3 = new Web3(web3.currentProvider);
    }
    onWeb3();
});
var web3Delayed = [];
function onWeb3() {
    while (web3Delayed.length) {
        web3Delayed.pop()();
    }
}
Web3Loader = {
    onWeb3(web3Fn) {
        web3Delayed.push(web3Fn);
    },
}
