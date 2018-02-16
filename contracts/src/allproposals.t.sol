pragma solidity^0.4.18;

import "ds-test/test.sol";
import "ds-warp/warp.sol";

import "src/allproposals.sol";

contract TokenTest is DSTest {
    Vote token;
    AccountRegistry accountRegistry;
    DSWarp warp;
    function setUp() public {
        token = new Vote();
        accountRegistry = new AccountRegistry();
        token.migrateAccountRegistry(accountRegistry);
        warp = new DSWarp();
    }
    function test_transfer() public {
        accountRegistry.register.value(1 finney)(warp);
        assertEq(token.balanceOf(this), 0);
        assertEq(token.availableFaucet(this, warp), 0);
        warp.warp(1 days);
        assertEq(token.availableFaucet(this, warp), 20);
        warp.warp(1 days);
        assertEq(token.availableFaucet(this, warp), 40);
        token.faucet(warp);
        assertEq(token.balanceOf(this), 40);
        token.transfer(token, 15);
        assertEq(token.balanceOf(this), 25);
        assertEq(token.balanceOf(token), 15);
        token.rescueToken(token);
        assertEq(token.balanceOf(this), 40);
        accountRegistry.propose(token,"Ayy");
        Proposal proposal = Proposal(accountRegistry.allProposals(0));
        assertEq(uint(proposal.argumentPosition(0)), uint(ProposalLib.Position.SKIP));
        //assertEq(proposal.argumentCount(), 0);
        assertEq(proposal.argumentSource(0), this);
        assertEq(1,proposal.argue(ProposalLib.Position.APPROVE, "LOL"));
        //assertEq(proposal.argumentCount(), 1);
        assertEq(uint(proposal.argumentPosition(1)), uint(ProposalLib.Position.APPROVE));
    }
}
