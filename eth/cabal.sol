pragma solidity ^0.4.18;

contract Proposal {
    enum Position {
        SKIP,
        APPROVE,
        AMEND,
        REJECT,
        LOL
    }
    enum State {
        INVALID,
        PROPOSED,
        FAILED,
        ENACTED
    }
    struct Argument {
        address source;
        Position position;
        /**
         * arbitrary encoding
         */
        string text;
    }

    Cabal public cabal;
    State public state;
    /**
     * The first argument is the proposal.
     */
    Argument[] public arguments;
    /**
     * The count on SKIP is the unsigned negative of the total,
     * so sum(voteCounts) == 0
     */
    uint40[5] public voteCounts;
    /**
     * Nonvoters are in the SKIP state.
     */
    mapping (address => uint40) public votes;

    uint256 constant voteBounty = 100 szabo;
    uint256 constant argumentBounty = 1 finney;

    function Proposal(
        Cabal _cabal,
        address _source,
        string _text
    ) public {
        assert(_cabal.contains(_source));

        arguments.push(Argument(
            _source,
            Position.SKIP,
            _text
        ));
        cabal = _cabal;
    }

    function changeVote(uint40 _argumentId) internal {
        uint40 choice = votes[msg.sender];
        Argument storage prior = arguments[choice];
        Argument storage argument = arguments[_argumentId];
        voteCounts[(uint8)(prior.position)]--;
        voteCounts[(uint8)(argument.position)]++;
        votes[msg.sender] = _argumentId;
    }

    function() payable public {}

    function argue(Position _position, string _text) payable external returns (uint40) {
        assert(_position != Position.SKIP);
        assert(msg.value >= argumentBounty);
        assert(cabal.contains(msg.sender));

        arguments[0].source.send(argumentBounty);
        msg.sender.send(this.balance * 2 / 25);
        uint40 argumentId = (uint40)(arguments.length);
        arguments.push(Argument(
            msg.sender,
            _position,
            _text
        ));
        changeVote(argumentId);
        return argumentId;
    }

    function side(uint40 _argumentId) payable external {
        assert(cabal.contains(msg.sender));

        changeVote(_argumentId);
        arguments[_argumentId].source.send(voteBounty);
    }
}
contract Cabal {
    Proposal[] public proposals;
    Proposal[] public canon;

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

    function canonize(uint _index) external {
        User storage me = users[msg.sender];
        assert(me.membership >= Membership.BOARD);
        Proposal proposal = proposals[_index];
        uint40 approvals = proposal.voteCounts(1);
        assert(approvals > proposal.voteCounts(2));
        assert(approvals > 19 * proposal.voteCounts(3));
        assert(approvals > 4 * proposal.voteCounts(4));
        canon.push(proposals[_index]);
    }

    function join(string _turingTest) external payable {
        assert(msg.value >= membershipBounty);
        User storage user = users[msg.sender];
        assert(user.membership == Membership.UNCONTACTED);

        user.membership = Membership.APPLIED;
        user.turingTest = _turingTest;
    }

    uint256 public memberCount;

    function admit(address _user) external {
        User storage me = users[msg.sender];
        assert(me.membership >= Membership.BOARD);
        User storage user = users[_user];
        assert(user.membership == Membership.APPLIED);

        user.membership = Membership.MEMBER;
        msg.sender.transfer(membershipBounty);
        memberCount++;
    }

    function ban(address _toBan) external {
        User storage me = users[msg.sender];
        assert(me.membership >= Membership.MODERATOR);
        User storage toBan = users[_toBan];
        assert(me.membership > toBan.membership);

        toBan.membership = Membership.BANNED;
        memberCount--;
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

    function contains(address _user) public view returns (bool) {
        if (users[_user].membership < Membership.MEMBER) {
            return false;
        }
        uint canonSize = canon.length;
        for (uint i = 0; i < canonSize; i++) {
            Proposal doctrine = canon[i];
            Proposal.Position position;
            (,position,) = doctrine.arguments(doctrine.votes(_user));
            if (position != Proposal.Position.APPROVE) {
                return false;
            }
        }
        return true;
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

    function proposalCount()
    public view
    returns (uint256) {
        return proposals.length;
    }

    function canonCount()
    public view
    returns (uint256) {
        return canon.length;
    }
}
