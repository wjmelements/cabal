pragma solidity ^0.4.20;// blaze it

import "./FinneyVote.sol";

interface ProposalInterface {
    /* uint8:
        enum Position {
            SKIP, // default
            APPROVE,
            REJECT,
            AMEND, // == (APPROVE | REJECT)
            LOL
            // more to be determined by community
        }
    */
    function getPosition(address _user) external view returns (uint8);
    function argumentCount() external view returns (uint256);
    function vote(uint256 _argumentId) external;
    // bytes could be:
    // utf8 string
    // swarm hash
    // ipfs hash
    // and others tbd
    event Case(bytes content);
}
contract ProperProposal is ProposalInterface, TokenRescue {
    struct Argument {
        address source;
        uint8 position;
        uint256 count;
    }
    Argument[] public arguments;
    mapping (address => uint256) public votes;
    FinneyVote public constant voteToken = FinneyVote(0x000000002647e16d9BaB9e46604D75591D289277);

    function getPosition(address _user)
    external view
    returns (uint8) {
        return arguments[votes[_user]].position;
    }

    function argumentCount() external view returns (uint256) {
        return arguments.length;
    }
    function argumentSource(uint256 _index)
    external view
    returns (address) {
        return arguments[_index].source;
    }

    function argumentPosition(uint256 _index)
    external view
    returns (uint8) {
        return arguments[_index].position;
    }

    function argumentVoteCount(uint256 _index)
    external view
    returns (uint256) {
        return arguments[_index].count;
    }

    function source()
    external view
    returns (address) {
        return arguments[0].source;
    }

    function voteCount()
    external view
    returns (uint256) {
        return -arguments[0].count;
    }

    function vote(uint256 _argumentId)
    external {
        address destination = arguments[_argumentId].source;
        voteToken.vote9(msg.sender, destination);
        arguments[votes[msg.sender]].count--;
        arguments[
            votes[msg.sender] = _argumentId
        ].count++;
    }

    event Case(bytes content);

    function argue(uint8 _position, bytes _text)
    external
    returns (uint256) {
        address destination = arguments[0].source;
        voteToken.vote9(msg.sender, destination);
        uint256 argumentId = arguments.length;
        arguments.push(Argument(msg.sender, _position, 1));
        emit Case(_text);
        arguments[votes[msg.sender]].count--;
        votes[msg.sender] = argumentId;
        return argumentId;
    }

    function init(address _source, bytes _resolution)
    external {
        assert(msg.sender == 0x000000002bb43c83eCe652d161ad0fa862129A2C);
        arguments.push(Argument(_source, 0/*SKIP*/, 0));
        emit Case(_resolution);
    }
}
