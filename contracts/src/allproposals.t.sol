pragma solidity^0.4.18;

import "ds-test/test.sol";

import "src/allproposals.sol";

contract Voter {
    function register(AccountRegistry _registry) public {
        _registry.register.value(1 finney)();
    }
    function faucet(AccountRegistry _registry) public {
        _registry.faucet();
    }
    function vote(Proposal _proposal, uint256 _id) public {
        _proposal.vote(_id);
    }
    function transferFrom(Vote token, address from, address to, uint value) public returns (bool) {
        return token.transferFrom(from, to, value);
    }
    function argue(Proposal proposal, ProposalLib.Position position, bytes value) public returns (uint) {
        return proposal.argue(position, value);
    }
    function () public payable {}
}
contract Board {
    function denounce(AccountRegistry accountRegistry, address target) public {
        accountRegistry.denounce(target, "wow sux");
    }
    function appoint(AccountRegistry accountRegistry, address target) public {
        accountRegistry.appoint(target, "so gud");
    }
}

contract AccountRegistryMock is AccountRegistry {
    function AccountRegistryMock(Vote _vote) AccountRegistry(_vote) public {
    }
    uint256 _era;
    function warp(uint256 _warp) public {
        _era += _warp;
    }
    function era() internal view returns (uint256) {
        return _era;
    }
}

contract TokenTest is DSTest {
    Vote token;
    AccountRegistryMock accountRegistry;
    address owner = 0x4a6f6B9fF1fc974096f9063a45Fd12bD5B928AD1;
    function setUp() public {
        token = new Vote();
        accountRegistry = new AccountRegistryMock(token);
        token.migrateAccountRegistry(accountRegistry);
        token.transferOwnership(owner);
    }
    function test_transfer() public {
        assertEq(accountRegistry.population(), 0);
        accountRegistry.register.value(1 finney)();
        assertEq(accountRegistry.population(), 1);
        assertEq(token.balanceOf(this), 40);
        assertEq(accountRegistry.availableFaucet(this), 0);
        assertEq(accountRegistry.cabalCount(), 0);

        token.transfer(token, 15);
        assertEq(token.balanceOf(this), 25);
        assertEq(token.balanceOf(token), 15);

        token.rescueToken(token);
        assertEq(token.balanceOf(this), 40);
        assertEq(accountRegistry.proposalCount(), 0);

        accountRegistry.propose(token,"Ayy");
        Proposal proposal = Proposal(accountRegistry.allProposals(0));
        assertEq(uint(proposal.argumentPosition(0)), uint(ProposalLib.Position.SKIP));
        assertEq(accountRegistry.proposalCount(), 1);
        assert(accountRegistry.isProposal(proposal));
        assertEq(proposal.argumentCount(), 1);
        assertEq(proposal.argumentSource(0), this);

        assertEq(1,proposal.argue(ProposalLib.Position.APPROVE, "LOL"));
        assertEq(proposal.argumentCount(), 2);
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
        v1.register(accountRegistry);
        assertEq(accountRegistry.population(), 2);
        assertEq(token.balanceOf(v1), 40);
        v1.vote(proposal, 1);
        assertEq(proposal.votes(v1), 1);
        assertEq(token.balanceOf(v1), 30);
        assertEq(proposal.argumentVoteCount(0), uint(-2));
        assertEq(proposal.argumentVoteCount(1), 2);
        assertEq(token.balanceOf(this), 47);
        assertEq(token.balanceOf(owner), 3);

        Voter v2 = new Voter();
        v2.transfer(1 finney);
        assertEq(accountRegistry.population(), 2);
        v2.register(accountRegistry);
        assertEq(accountRegistry.population(), 3);
        assert(token.approve(v2, 10));
        assert(v2.transferFrom(token, this, v2, 10));
        assertEq(token.balanceOf(v2), 50);
        assertEq(token.balanceOf(this), 37);

        assertEq(v2.argue(proposal, ProposalLib.Position.REJECT, "NOTHX"), 2);
        assertEq(proposal.argumentCount(), 3);
        assertEq(uint(proposal.argumentPosition(2)), uint(ProposalLib.Position.REJECT));
        assertEq(proposal.argumentVoteCount(0), uint(-3));
        assertEq(proposal.argumentVoteCount(2), 1);
        assertEq(token.balanceOf(v2), 40);

        tryFaucets(v1, v2);

        assertEq(token.totalSupply(), token.balanceOf(owner)
            + token.balanceOf(this)
            + token.balanceOf(v1)
            + token.balanceOf(v2)
        );
    }

    function tryFaucets(Voter v1, Voter v2) {
        accountRegistry.warp(1 days);
        assertEq(accountRegistry.availableFaucet(v2), 20);
        assertEq(accountRegistry.availableFaucet(v1), 20);
        assertEq(accountRegistry.availableFaucet(this), 20);

        uint prior = token.balanceOf(v1);
        v1.faucet(accountRegistry);
        assertEq(token.balanceOf(v1), prior + 20);
        assertEq(accountRegistry.availableFaucet(v1), 0);

        accountRegistry.warp(11 hours);
        assertEq(accountRegistry.availableFaucet(v2), 29);
        assertEq(accountRegistry.availableFaucet(v1), 9);
        assertEq(accountRegistry.availableFaucet(this), 29);

        prior = token.balanceOf(v2);
        v2.faucet(accountRegistry);
        assertEq(token.balanceOf(v2), prior + 29);
        assertEq(accountRegistry.availableFaucet(v2), 0);

        accountRegistry.warp(37 hours);
        assertEq(accountRegistry.availableFaucet(v2), 31);
        assertEq(accountRegistry.availableFaucet(v1), 40);
        assertEq(accountRegistry.availableFaucet(this), 40);

        prior = token.balanceOf(this);
        accountRegistry.faucet();
        assertEq(token.balanceOf(this), prior + 40);
        assertEq(accountRegistry.availableFaucet(this), 0);
    }

    function testFail_claimNoRegister() public {
        accountRegistry.faucet();
    }

    function testFail_migrate() public {
        token.migrateAccountRegistry(AccountRegistry(this));
    }

    function testFail_transferOwnership() public {
        token.transferOwnership(this);
    }

    function testFail_vote() public {
        accountRegistry.propose(token, "KK");
        Proposal proposal = Proposal(accountRegistry.allProposals(0));
        proposal.vote(1);
    }

    function testFail_argue() public {
        accountRegistry.propose(token, "KK");
        Proposal proposal = Proposal(accountRegistry.allProposals(0));
        proposal.argue(ProposalLib.Position.APPROVE, "K");
    }

    function testFail_appoint() public {
        accountRegistry.appoint(this, "ayy");
    }
}
