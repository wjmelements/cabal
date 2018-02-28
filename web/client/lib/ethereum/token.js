var onToken = [];
token = null;
Token = {
    getAddress() {
        switch(Net.id.get()) {
            default:
                console.log("Unsupported network: "+Net.id.get());
            case "1":
            case "4":
                return "0x000000002647e16d9BaB9e46604D75591D289277";
        }
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
    var tokenABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_token","type":"address"}],"name":"rescueToken","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_grant","type":"uint256"}],"name":"grant","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_voter","type":"address"},{"name":"_votee","type":"address"}],"name":"vote1","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_voter","type":"address"},{"name":"_votee","type":"address"}],"name":"vote9","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"accountRegistry","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_voter","type":"address"},{"name":"_votee","type":"address"}],"name":"vote5","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newAccountRegistry","type":"address"}],"name":"migrateAccountRegistry","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"}],"name":"Owner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"registry","type":"address"}],"name":"Registry","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}];
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
Token.balance(function(balance) {
    Balance.set(balance.c[0] / 10);
    Balance.onChange();
}.bind(this));
