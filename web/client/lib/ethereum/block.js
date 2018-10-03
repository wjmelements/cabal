var blockCallbacks = []
var currentBlock = undefined

function updateBlockNumber() {
    web3.eth.getBlockNumber((err, result) => {
        if (err) {
            console.error(err);
            return
        }
        if (currentBlock == result) {
            return
        }
        currentBlock = result
        for (var index in blockCallbacks) {
            blockCallbacks[index](currentBlock)
        }
    })
}

Web3Loader.onWeb3(() => {
    setInterval(updateBlockNumber, 5000)
    updateBlockNumber()
})

Block = {
    // fn(block)
    on(fn) {
        blockCallbacks.push(fn)
        if (currentBlock) {
            fn(currentBlock)
        }
    },
    current() {
        return currentBlock
    },
}
