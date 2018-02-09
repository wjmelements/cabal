var onToken = [];
token = null;
Token = {
    getAddress() {
        switch(Net.id.get()) {
            default:
                console.log("Unsupported network: "+Net.id.get());
            case "4":
                return "0x89e9844b11bb1d680963f0e4787f69be3d7ec77d";
        }
    },
    claim(resultFn) {
        if (!token) {
            onToken.push(function(){Token.faucet(resultFn)});
            return;
        }
        token.faucet({gasPrice:GasRender.gasPriceInWei()}, function (error, result) {
            if (error) {
                console.error(error);
                return;
            }
            resultFn(result);
        });
    },
    availableFaucet(resultFn) {
        if (!token) {
            onToken.push(function(){Token.availableFaucet(resultFn)});
            return;
        }
        Accounts.current(function(currentAccount) {
            token.availableFaucet(currentAccount, function(error, available) {
                if (error) {
                    console.error(error);
                    return;
                }
                resultFn(available.c[0]);
            });
        });
    },
    balance(resultFn) {
        Accounts.current(function (currentAccount) {
            Token.balanceOf(currentAccount, resultFn);
        });
    },
    balanceOf(account, resultFn) {
        if (!token) {
            onToken.push(function(){Token.balanceOf(account, resultFn)});
            return;
        }
        token.balanceOf(account, function(error, result) {
            if (error) {
                console.error(error);
                return;
            }
            resultFn(result);
        });
    },
};
Web3Loader.onWeb3(function() {
    var tokenABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_voter","type":"address"},{"name":"_votee","type":"address"}],"name":"vote","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_account","type":"address"}],"name":"availableFaucet","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"developerFund","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_newDeveloperFund","type":"address"}],"name":"transferDeveloperFund","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"accountRegistry","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"faucet","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_newAccountRegistry","type":"address"}],"name":"migrateAccountRegistry","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_developerFund","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}];
    token = web3.eth.contract(tokenABI).at(Token.getAddress());
    while(onToken.length) {
        onToken.pop()();
    }
});
Balance = new ReactiveVar(0);
Balance.listeners = [];
Balance.onChange = function() {
    for (var i = 0; i < Balance.listeners.length; i++) {
        Balance.listeners[i]();
    }
}
Balance.removeListener = function(listener) {
    Balance.listeners = Balance.listeners.filter(function (a) {
        return a != listener;
    });
}
