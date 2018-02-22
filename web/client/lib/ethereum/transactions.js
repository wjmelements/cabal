Transactions = {
    awaitPendingTransaction(txhash, expectedChange, onDone) {
        var pendingTxs = Transactions.pending.get().slice(0);
        pendingTxs.push({
            txhash:txhash,
            change:expectedChange,
        });
        Transactions.pending.set(pendingTxs);
        Balance.set(Balance.get() + expectedChange);
        Balance.onChange();
        Transactions.await(txhash, onDone);
    },
    await(txhash, onDone) {
        web3.eth.getTransaction(txhash, function(error, result) {
            if (error) {
                console.error(error);
                return;
            }
            if (result.blockNumber) {
                onDone();
            } else {
                window.setTimeout(()=>{Transactions.await(txhash, onDone);}, 3000);
            }
        });
    },
};
Transactions.pending = new ReactiveVar([]);