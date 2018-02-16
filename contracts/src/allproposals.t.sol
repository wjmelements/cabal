pragma solidity^0.4.18;

import "ds-test/test.sol";

import "allproposals.sol";

contract TokenTest is DSTest {
    Vote token;
    AccountRegistry accountRegistry;
    function setUp() public {
        token = new Vote();
        accountRegistry = new AccountRegistry();
        token.migrateAccountRegistry(accountRegistry);
    }
    function test_transfer() public {
        accountRegistry.register.value(1 finney)();
        assertEq(token.balanceOf(this), 0);
        assertEq(token.availableFaucet(this), 40);
        token.faucet();
        assertEq(token.balanceOf(this), 40);
        token.transfer(token, 15);
        assertEq(token.balanceOf(this), 25);
        assertEq(token.balanceOf(token), 15);
        token.rescueToken(token);
        assertEq(token.balanceOf(this), 40);
    }
}
