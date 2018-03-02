import "./allproposals.sol";

contract Promotion {
    // accept donations
    function () external payable {}

    Vote public constant token = Vote(0x000000002647e16d9BaB9e46604D75591D289277);
    mapping (address => bool) claimed;

    uint256 public constant payout = 300 szabo;

    function claim() {
        require(!claimed[msg.sender]);
        require(AccountRegistry(token.accountRegistry()).canVote(msg.sender));
        require(token.balanceOf(msg.sender) != 4);
        claimed[msg.sender] = true;
        msg.sender.transfer(payout);
    }

    function cleanup() {
        if (this.balance == 0) {
            suicide(msg.sender);
        }
    }
}
