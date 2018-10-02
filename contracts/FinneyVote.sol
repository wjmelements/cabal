pragma solidity ^0.4.20;

import "./erc20.sol";
import "./TokenRescue.sol";

interface AccountRegistryInterface {
    function canVoteOnProposal(address _voter, address _proposal) external view returns (bool);
}
contract FinneyVote is ERC20, TokenRescue {
    uint256 supply = 0;
    AccountRegistryInterface public accountRegistry = AccountRegistryInterface(0x000000002bb43c83eCe652d161ad0fa862129A2C);
    address public owner = 0x4a6f6B9fF1fc974096f9063a45Fd12bD5B928AD1;

    uint8 public constant decimals = 1;
    string public symbol = "FV";
    string public name = "FinneyVote";

    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) approved;

    function totalSupply() external constant returns (uint256) {
        return supply;
    }
    function balanceOf(address _owner) external constant returns (uint256) {
        return balances[_owner];
    }
    function approve(address _spender, uint256 _value) external returns (bool) {
        approved[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    function allowance(address _owner, address _spender) external constant returns (uint256) {
        return approved[_owner][_spender];
    }
    function transfer(address _to, uint256 _value) external returns (bool) {
        if (balances[msg.sender] < _value) {
            return false;
        }
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool) {
        if (balances[_from] < _value
         || approved[_from][msg.sender] < _value
         || _value == 0) {
            return false;
        }
        approved[_from][msg.sender] -= _value;
        balances[_from] -= _value;
        balances[_to] += _value;
        emit Transfer(_from, _to, _value);
        return true;
    }
    function grant(address _to, uint256 _grant) external {
        require(msg.sender == address(accountRegistry));
        balances[_to] += _grant;
        supply += _grant;
        emit Transfer(address(0), _to, _grant);
    }
    // vote5 and vote1 are available for future use
    function vote5(address _voter, address _votee) external {
        require(balances[_voter] >= 10);
        require(accountRegistry.canVoteOnProposal(_voter, msg.sender));
        balances[_voter] -= 10;
        balances[owner] += 5;
        balances[_votee] += 5;
        emit Transfer(_voter, owner, 5);
        emit Transfer(_voter, _votee, 5);
    }
    function vote1(address _voter, address _votee) external {
        require(balances[_voter] >= 10);
        require(accountRegistry.canVoteOnProposal(_voter, msg.sender));
        balances[_voter] -= 10;
        balances[owner] += 9;
        balances[_votee] += 1;
        emit Transfer(_voter, owner, 9);
        emit Transfer(_voter, _votee, 1);
    }
    function vote9(address _voter, address _votee) external {
        require(balances[_voter] >= 10);
        require(accountRegistry.canVoteOnProposal(_voter, msg.sender));
        balances[_voter] -= 10;
        balances[owner] += 1;
        balances[_votee] += 9;
        emit Transfer(_voter, owner, 1);
        emit Transfer(_voter, _votee, 9);
    }
    modifier onlyOwner () {
        require(msg.sender == owner);
        _;
    }
    event Owner(address indexed owner);
    event Registry(address indexed registry);
    function transferOwnership(address _newOwner)
    external onlyOwner {
        uint256 balance = balances[owner];
        balances[_newOwner] += balance;
        balances[owner] = 0;
        emit Transfer(owner, _newOwner, balance);
        owner = _newOwner;
        emit Owner(_newOwner);
    }
    function migrateAccountRegistry(AccountRegistryInterface _newAccountRegistry)
    external onlyOwner {
        accountRegistry = _newAccountRegistry;
        emit Registry(_newAccountRegistry);
    }
}
