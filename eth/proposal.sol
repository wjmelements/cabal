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
        Position position;
        /**
         * arbitrary encoding
         */
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
    uint40[5] public voteCounts;
    /**
     * Nonvoters are in the SKIP state.
     */
    mapping (address => uint40) votes;

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
        arguments[0].source.transfer(argumentBounty); // consider send
        msg.sender.transfer(this.balance * 2 / 25); // consider send
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
        arguments[_argumentId].source.transfer(voteBounty); // consider send
    }
}
