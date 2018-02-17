pragma solidity^0.4.18;

import "ds-test/test.sol";
import "ds-warp/warp.sol";

import "src/allproposals.sol";

contract Voter {
    function register(DSWarp _warp, AccountRegistry _registry) public {
        _registry.register.value(1 finney)(_warp);
    }
    function faucet(DSWarp _warp, Vote _token) public {
        _token.faucet(_warp);
    }
    function vote(Proposal _proposal, uint256 _id) public {
        _proposal.vote(_id);
    }
    function () public payable {}
}

contract TokenTest is DSTest {
    Vote token;
    AccountRegistry accountRegistry;
    DSWarp warp;
    address owner = 0x4a6f6B9fF1fc974096f9063a45Fd12bD5B928AD1;
    function setUp() public {
        token = new Vote();
        accountRegistry = new AccountRegistry();
        token.migrateAccountRegistry(accountRegistry);
        token.transferOwnership(owner);
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
        assertEq(proposal.votes(this), 1);
        assertEq(proposal.argumentSource(1), this);
        assertEq(token.balanceOf(this), 39);
        assertEq(token.balanceOf(owner), 1);
        assertEq(proposal.argumentVoteCount(1), 1);
        assertEq(proposal.argumentVoteCount(0), uint(-1));

        proposal.vote(1);
        assertEq(proposal.argumentVoteCount(1), 1);
        assertEq(token.balanceOf(this), 38);
        assertEq(token.balanceOf(owner), 2);
        assertEq(proposal.argumentVoteCount(0), uint(-1));

        Voter v1 = new Voter();
        v1.transfer(1 finney);
        v1.register(warp, accountRegistry);
        v1.faucet(warp, token);
        assertEq(token.balanceOf(v1), 40);
        v1.vote(proposal, 1);
        assertEq(proposal.votes(v1), 1);
        assertEq(token.balanceOf(v1), 30);
        assertEq(proposal.argumentVoteCount(0), uint(-2));
        assertEq(proposal.argumentVoteCount(1), 2);
        //assertEq(token.balanceOf(this), 48);
    }
}
