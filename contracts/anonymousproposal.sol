pragma solidity^0.4.20;
import "./allproposals.sol";

// no on-chain vote counts
// no on-chain voter position
// voting is super cheap but super pointless
contract AnonymousProposal {
    Vote constant token = Vote(0xDead);

    address[] sources;
    
    // the zeroth comment is the proposal
    event Comment(bytes32 content);
    event Case(uint8 position, bytes32 content);
    event Upvote(uint256 argumentId);
    function comment(address _source, bytes32 _proposal) external {
        sources.push(_source);
        Comment(_proposal);
    }
    function argue(uint8 _position, bytes32 _content) external {
        sources.push(msg.sender);
        token.vote9(msg.sender, sources[0]);
        Case(_position, _content);
    }
    function vote(uint256 _argumentId) external {
        token.vote9(msg.sender, sources[_argumentId]);
        Upvote(_argumentId);
    }
}
