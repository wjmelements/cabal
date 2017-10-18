pragma solidity ^0.4.17;

interface UserService {
    function contains(address _user) public returns (bool);
}

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
        uint256 id;
        Position position;
        string text;
    }

    UserService public cabal;
    State public state;
    /**
     * The first argument is the proposal.
     */
    Argument[] public arguments;
    /**
     * The count on SKIP is the unsigned negative of the total,
     * so sum(voteCounts) == 0
     */
    uint64[5] public voteCounts;
    /**
     * Nonvoters are in the SKIP state.
     */
    mapping (address => uint256) votes;

    uint256 constant voteBounty = 1 szabo;
    uint256 constant argumentBounty = 1 finney;

    function Proposal(
        UserService _cabal,
        address _source,
        string _text
    ) public {
        assert(_cabal.contains(_source));
        arguments.push(Argument(
            _source,
            0,
            Position.SKIP,
            _text
        ));
        cabal = _cabal;
    }

    function rmVote() internal {
        assert(cabal.contains(msg.sender));
        uint256 choice = votes[msg.sender];
        Argument storage prior = arguments[choice];
        voteCounts[(uint8)(prior.position)]--;
    }

    function addVote(Argument storage _argument) internal {
        voteCounts[(uint8)(_argument.position)]++;
        votes[msg.sender] = _argument.id;
    }

    function() payable public {}

    function argue(Position _position, string _text) payable external returns (uint256) {
        assert(_position != Position.SKIP);
        assert(msg.value >= argumentBounty);
        arguments[0].source.transfer(argumentBounty); // consider send
        msg.sender.transfer(this.balance * 2 / 25); // consider send
        uint256 argumentId = arguments.length;
        rmVote();
        arguments.push(Argument(
            msg.sender,
            argumentId,
            _position,
            _text
        ));
        Argument storage argument = arguments[argumentId];
        addVote(argument);
        return argumentId;
    }

    function side(uint32 _argumentId) payable external {
        rmVote();
        Argument storage argument = arguments[_argumentId];
        addVote(argument);
        argument.source.transfer(voteBounty); // consider send
    }
}
