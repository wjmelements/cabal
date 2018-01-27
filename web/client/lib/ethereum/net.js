Net = {};
Net.prefix = new ReactiveVar('rinkeby.');
Net.id = new ReactiveVar('4');
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
                break;
            case '3':
                Net.prefix.set('ropsten.');
                break;
            case '4':
                Net.prefix.set('rinkeby.');
                break;
        }
    });
};
Web3Loader.onWeb3(Net.refresh);
