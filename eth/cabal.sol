pragma solidity ^0.4.17;

import "proposal.sol";

contract Cabal is UserService {
    Proposal[] public proposals;

    address source;
    string public name;
    mapping (address => User) users;

    uint256 constant proposalBounty = 10 finney;
    uint256 constant membershipBounty = 1 finney;

    enum Membership {
        UNCONTACTED,
        BANNED,
        APPLIED,
        MEMBER,
        MODERATOR,
        BOARD,
        SOURCE
    }

    struct User {
        Membership membership;
        string turingTest;
    }

    function Cabal(
        string _name,
        string _description
    ) public {
        source = msg.sender;
        name = _name;
        users[msg.sender].membership = Membership.SOURCE;
        users[msg.sender].turingTest = _description;
    }

    function join(string _turingTest) external payable {
        assert(msg.value >= membershipBounty);
        User storage user = users[msg.sender];
        assert(user.membership == Membership.UNCONTACTED);

        user.membership = Membership.APPLIED;
        user.turingTest = _turingTest;
    }

    function admit(address _user) external {
        User storage me = users[msg.sender];
        assert(me.membership >= Membership.BOARD);
        User storage user = users[_user];
        assert(user.membership == Membership.APPLIED);

        user.membership = Membership.MEMBER;
        msg.sender.transfer(membershipBounty);
    }

    function ban(address _toBan) external {
        User storage me = users[msg.sender];
        assert(me.membership >= Membership.MODERATOR);
        User storage toBan = users[_toBan];
        assert(me.membership > toBan.membership);

        toBan.membership = Membership.BANNED;
    }

    function promote(address _user, Membership _membership) external {
        User storage me = users[msg.sender];
        assert(me.membership >= Membership.BOARD);
        assert(me.membership >= _membership);
        User storage user = users[_user];
        assert(user.membership >= Membership.BANNED);
        assert(user.membership < _membership);

        user.membership = _membership;
    }

    function contains(address _user) public returns (bool) {
        return users[_user].membership >= Membership.MEMBER;
    }

    function propose(string _text) external payable returns (uint) {
        assert(msg.value >= proposalBounty);
        assert(contains(msg.sender));

        Proposal proposal = new Proposal(
            this,
            msg.sender,
            _text
        );
        proposal.transfer(msg.value);
        uint index = proposals.length;
        proposals.push(proposal);
        return index;
    }
}
