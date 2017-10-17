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
    UserService cabal;
    address source;
    string public text;
    State public state;
    Argument[] public arguments;
    // Position => count
    mapping (uint => uint64) public voteCounts;
    mapping (address => Argument) votes;

    uint256 constant voteBounty = 1 szabo;
    uint256 constant argumentBounty = 1 finney;

    struct Argument {
        address source;
        uint256 id; // one less than the index into 
        Position position;
        string text;
    }

    function Proposal(
        UserService _cabal,
        address _source,
        string _text
    ) public {
        cabal = _cabal;
        source = _source;
        text = _text;
    }

    function rmVote() internal {
        assert(cabal.contains(msg.sender));
        Argument storage prior = votes[msg.sender];
        if (prior.position == Position.SKIP) {
            return;
        }
        voteCounts[(uint8)(prior.position)]--;
    }

    function addVote(Argument storage _argument) internal {
        voteCounts[(uint8)(_argument.position)]++;
        votes[msg.sender] = _argument;
    }

    function() payable public {}

    function argue(Position _position, string _text) payable external returns (uint256) {
        assert(_position != Position.SKIP);
        assert(msg.value >= argumentBounty);
        source.transfer(argumentBounty); // consider send
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
