const Web3 = require('web3')
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
    console.log('Using web3.currentProvider');
    web3 = new Web3(web3.currentProvider);
} else {
    console.log('Using injected web3');
}
Net = {};
Net.prefix = new ReactiveVar('rinkeby.');
Net.id = new ReactiveVar('4');
Net.unsupportedNetwork = new ReactiveVar(false);
Net.firstProposalBlock = new ReactiveVar(517519);
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
                Net.unsupportedNetwork.set(false);
                Net.firstProposalBlock.set(5171519);
                break;
            case '3':
                Net.prefix.set('ropsten.');
                Net.unsupportedNetwork.set(true);
                break;
            case '4':
                Net.prefix.set('rinkeby.');
                Net.unsupportedNetwork.set(false);
                Net.firstProposalBlock.set(0);
                break;
            default:
                Net.unsupportedNetwork.set(false);
        }
        loaded = true;
        onWeb3();
    });
};
Net.refresh();
