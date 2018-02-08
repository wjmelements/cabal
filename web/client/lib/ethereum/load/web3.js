var loaded = false;
var web3Delayed = [];
function onWeb3() {
    while (web3Delayed.length) {
        web3Delayed.pop()();
    }
}
Web3Loader = {
    onWeb3(web3Fn) {
        if (loaded) {
            web3Fn();
            return;
        }
        web3Delayed.push(web3Fn);
    },
}
if (typeof web3 === 'undefined') {
    console.log("Using infura");
    web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/x6jRpmEj17uLQR1TuV1E"));
} else if (typeof web3.eth === 'undefined') {
    web3 = new Web3(web3.currentProvider);
}
Net = {};
Net.prefix = new ReactiveVar('rinkeby.');
Net.id = new ReactiveVar('4');
Net.unsupportedNetwork = new ReactiveVar(false);
Net.refresh = () => {
    web3.version.getNetwork((error, netId) => {
        if (error) {
            console.error(error);
            return;
        }
        if (!netId) {
            console.log('retrying for netId');
            setTimeout(Net.refresh, 10);
            return;
        }
        Net.id.set(netId);
        switch (netId) {
            case '1':
                Net.prefix.set('');
                Net.unsupportedNetwork.set(true);
                break;
            case '3':
                Net.prefix.set('ropsten.');
                Net.unsupportedNetwork.set(true);
                break;
            case '4':
                Net.prefix.set('rinkeby.');
                Net.unsupportedNetwork.set(false);
                break;
            default:
                Net.unsupportedNetwork.set(false);
        }
        loaded = true;
        onWeb3();
    });
};
Net.refresh();
