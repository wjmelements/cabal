pragma solidity ^0.4.18;


interface Vote {
    function totalSupply() public constant returns (uint supply);
    function balanceOf(address _owner) public constant returns (uint balance);
    function transfer(address _to, uint _value) public returns (bool success);
    function transferFrom(address _from, address _to, uint _value) public returns (bool success);
    function approve(address _spender, uint _value) public returns (bool success);
    function allowance(address _owner, address _spender) public constant returns (uint remaining);
    event Transfer(address indexed _from, address indexed _to, uint _value);
    event Approval(address indexed _owner, address indexed _spender, uint _value);
    function faucet() external;
}
interface ProposalInterface {
    function vote(uint256 _argumentId) external;
}
interface AccountRegistry {
    function register() external payable;
    function deregister() external;
}

contract FinneyVoteDoppel {
   Vote constant revToken = 0xe48ba8c36c2a73437ae0a67f4f10a3f23b799327;
    AccountRegistry constant accountRegistry = 0x6722C370C3762768c0FC40aFFf397b7B9A10A032;
    address owner;

    function FinneyVoteDoppel()
    public
    payable {
        owner = msg.sender;
        accountRegistry.register.value(1 finney)();
    }
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    // if you let anyone push the faucet, they can deny you votes by pushing it
    function faucet()
    external
    onlyOwner {
        revToken.faucet();
    }
    function vote(ProposalInterface proposal, uint256 argumentId)
    external
    onlyOwner {
        proposal.vote(argumentId);
    }
    function refund()
    external
    onlyOwner {
        accountRegistry.deregister();
        selfdestruct(msg.sender);
    }
}

// the least efficient bank ever
contract REVBank is FinneyVoteDoppel {
    
    FinneyVoteDoppel[] doppels;

    function balance()
    public view
    returns (uint256) {
        return doppels.length;
    }
    function REVBank()
    public {
        owner = msg.sender;
    }
    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
    function deposit()
    external
    onlyOwner {
        while (msg.value >= 1 finney) {
            doppels.push((new FinneyVoteDoppel).value(1 finney)());
        }
    }
    function withdraw(uint256 _amount)
    external
    onlyOwner {
        uint256 unroll = _amount / 1 finney;
        if (unroll > doppels.length) {
            unroll = doppels.length;
        }
        while (unroll --> 0) {
            doppels.pop().refund();
        }
        msg.sender.transfer(this.balance);
    }
    function refund()
    external
    onlyOwner {
        while (doppels.length > 0) {
            doppels.pop().refund();
        }
        super.refund();
    }
    function vote(ProposalInterface _proposal, uint256 _argumentId)
    external
    onlyOwner {
        for (uint256 i = 0; i < doppels.length; i++) {
            doppels[i].vote(_proposal, _argumentId);
        }
    }
}

