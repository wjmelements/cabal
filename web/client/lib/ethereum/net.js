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
    });
};
Web3Loader.onWeb3(Net.refresh);
