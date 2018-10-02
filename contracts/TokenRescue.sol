pragma solidity ^0.4.20;

import "./erc20.sol";

contract TokenRescue {
    // use this method to rescue your tokens if you sent them by mistake but be quick or someone else will get them
    function rescueToken(ERC20 _token)
    external
    {
        _token.transfer(msg.sender, _token.balanceOf(this));
    }
    // require data for transactions
    function() external payable {
        revert();
    }
}
