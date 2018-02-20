pragma solidity ^0.4.19;

interface ERC20 {
    function totalSupply() external constant returns (uint supply);
    function balanceOf(address _owner) external constant returns (uint balance);
    function transfer(address _to, uint _value) external returns (bool success);
    function transferFrom(address _from, address _to, uint _value) external returns (bool success);
    function approve(address _spender, uint _value) external returns (bool success);
    function allowance(address _owner, address _spender) external constant returns (uint remaining);
    event Transfer(address indexed _from, address indexed _to, uint _value);
    event Approval(address indexed _owner, address indexed _spender, uint _value);
}
contract TokenRescue {
    // gas paid, and now i am immortal
    // i shall not end until heat death
    // i shall gain no ether, hold no tokens, pity no fool

    // use this method to rescue your tokens if you sent them by mistake but be quick or someone else will get them
    function rescueToken(ERC20 _token)
    external
    {
        _token.transfer(msg.sender, _token.balanceOf(this));
    }
    // require data for transactions
    function() external payable {
        revert();
    }
}
interface AccountRegistryInterface {
    function canVoteOnProposal(address _voter, address _proposal) external view returns (bool);
}
contract Vote is ERC20,TokenRescue {
    uint256 supply = 0;
    AccountRegistryInterface public accountRegistry = AccountRegistryInterface(0x0000003B26D088fC73341DEf4FF38d5B8d6a7874);
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
        Approval(msg.sender, _spender, _value);
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
        Transfer(msg.sender, _to, _value);
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
        Transfer(_from, _to, _value);
        return true;
    }
    function grant(address _to, uint256 _grant) external {
        require(msg.sender == address(accountRegistry));
        balances[_to] += _grant;
        supply += _grant;
        Transfer(address(0), _to, _grant);
    }
    // vote5 and vote1 are available for future use
    function vote5(address _voter, address _votee) external {
        require(balances[_voter] >= 10);
        require(accountRegistry.canVoteOnProposal(_voter, msg.sender));
        balances[_voter] -= 10;
        balances[owner] += 5;
        balances[_votee] += 5;
        Transfer(_voter, owner, 5);
        Transfer(_voter, _votee, 5);
    }
    function vote1(address _voter, address _votee) external {
        require(balances[_voter] >= 10);
        require(accountRegistry.canVoteOnProposal(_voter, msg.sender));
        balances[_voter] -= 10;
        balances[owner] += 9;
        balances[_votee] += 1;
        Transfer(_voter, owner, 9);
        Transfer(_voter, _votee, 1);
    }
    function vote9(address _voter, address _votee) external {
        require(balances[_voter] >= 10);
        require(accountRegistry.canVoteOnProposal(_voter, msg.sender));
        balances[_voter] -= 10;
        balances[owner] += 1;
        balances[_votee] += 9;
        Transfer(_voter, owner, 1);
        Transfer(_voter, _votee, 9);
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
        Transfer(owner, _newOwner, balance);
        owner = _newOwner;
        Owner(owner);
    }
    function migrateAccountRegistry(AccountRegistryInterface _newAccountRegistry)
    external onlyOwner {
        accountRegistry = _newAccountRegistry;
        Registry(accountRegistry);
    }
}
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
    Vote public constant voteToken = Vote(0x0000001bf0CDA9c6f6c4644cB97174C427723894);

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
        Case(_text);
        arguments[votes[msg.sender]].count--;
        votes[msg.sender] = argumentId;
        return argumentId;
    }

    function init(address _source, bytes _resolution)
    external {
        assert(msg.sender == 0x0000003B26D088fC73341DEf4FF38d5B8d6a7874);
        arguments.push(Argument(_source, 0/*SKIP*/, 0));
        Case(_resolution);
    }
}
contract ProxyProposal {
    function () external {
        // return lib.delegatecall(msg.data);
        assembly {
            calldatacopy(0, 0, calldatasize)
            let _retVal := delegatecall(sub(gas,740), 0x0000005E1CBE78009143B44D717423cb01a002B7, 0, calldatasize, 0, 32)
            switch _retVal case 0 { revert(0, returndatasize) } default { return(0, returndatasize) }
        }
    }
}
interface CabalInterface {
    function memberCount() external view returns (uint256);
    function canonCount() external view returns (uint256);
    function proposalCount() external view returns (uint256);
}
contract AccountRegistry is AccountRegistryInterface,TokenRescue {
    
    uint256 constant public registrationDeposit = 1 finney;
    uint256 constant public proposalCensorshipFee = 50 finney;

    // this is the first deterministic contract address for 0x315017F58EAaFC696bcF286928E08cbf15C00fDc
    address constant public burn = 0x000000569972310C6de3A8a6cB8241aFfC853D0d;

    Vote public constant token = Vote(0x0000001bf0CDA9c6f6c4644cB97174C427723894);

    /* uint8 membership bitmap:
     * 0 - fraud
     * 1 - registered to vote
     * 2 - pending proposal
     * 3 - proposal
     * 4 - board member
     * 5 - pending cabal
     * 6 - cabal
     * 7 - board
     */
    uint8 constant UNCONTACTED = 0;
    uint8 constant FRAUD = 1;
    uint8 constant VOTER = 2;
    uint8 constant PENDING_PROPOSAL = 4;
    uint8 constant PROPOSAL = 8;
    uint8 constant PENDING_CABAL = 16;
    uint8 constant CABAL = 32;
    uint8 constant BOARD = 64;
    struct Account {
        uint256 lastAccess;
        uint8 membership;
        address appointer;
        address denouncer;
    }
    mapping (address => Account) accounts;


    function AccountRegistry()
    public
    {
        accounts[0x4a6f6B9fF1fc974096f9063a45Fd12bD5B928AD1].membership = BOARD;
        accounts[0x90Fa310397149A7a9058Ae2d56e66e707B12D3A7].membership = BOARD;
        accounts[0x424a6e871E8cea93791253B47291193637D6966a].membership = BOARD;
    }

    event Voter(address indexed voter);
    event Deregistered(address indexed voter);
    event Nominated(address indexed board, string endorsement);
    event Board(address indexed board, string endorsement);
    event Denounced(address indexed board, string reason);
    event Revoked(address indexed board, string reason);
    event Proposal(ProposalInterface indexed proposal);
    event Cabal(CabalInterface indexed cabal);
    event BannedProposal(ProposalInterface indexed proposal, string reason);

    // To register a Cabal, you must
    // - implement CabalInterface
    // - open-source your Cabal on Etherscan or equivalent
    function registerCabal(CabalInterface _cabal)
    external {
        Account storage account = accounts[_cabal];
        require(account.membership & (PENDING_CABAL | CABAL) == 0);
        account.membership |= PENDING_CABAL;
    }

    function confirmCabal(CabalInterface _cabal)
    external {
        require(accounts[msg.sender].membership & BOARD == BOARD);
        Account storage account = accounts[_cabal];
        require(account.membership & PENDING_CABAL == PENDING_CABAL);
        account.membership ^= (CABAL | PENDING_CABAL);
        Cabal(_cabal);
    }

    function register()
    external payable
    {
        require(msg.value == registrationDeposit);
        Account storage account = accounts[msg.sender];
        require(account.membership & VOTER == 0);
        account.lastAccess = now;
        account.membership |= VOTER;
        token.grant(msg.sender, 40);
        Voter(msg.sender);
    }

    // smart contracts must implement the fallback function in order to deregister
    function deregister()
    external
    {
        Account storage account = accounts[msg.sender];
        require(account.membership & VOTER == VOTER);
        require(account.lastAccess + 7 days <= now);
        account.membership ^= VOTER;
        account.lastAccess = 0;
        // the MANDATORY transfer keeps population() meaningful
        msg.sender.transfer(registrationDeposit);
        Deregistered(msg.sender);
    }

    function population()
    external view
    returns (uint256)
    {
        return this.balance / 1 finney;
    }

    function deregistrationDate()
    external view
    returns (uint256)
    {
        return accounts[msg.sender].lastAccess + 7 days;
    }

    // always true for deregistered accounts
    function canDeregister(address _voter)
    external view
    returns (bool)
    {
        return accounts[_voter].lastAccess + 7 days <= now;
    }

    function canVoteOnProposal(address _voter, address _proposal)
    external view
    returns (bool)
    {
        return accounts[_voter].membership & VOTER == VOTER
            && accounts[_proposal].membership & PROPOSAL == PROPOSAL;
    }

    function canVote(address _voter)
    external view
    returns (bool)
    {
        return accounts[_voter].membership & VOTER == VOTER;
    }

    function isProposal(address _proposal)
    external view
    returns (bool)
    {
        return accounts[_proposal].membership & PROPOSAL == PROPOSAL;
    }

    function isPendingProposal(address _proposal)
    external view
    returns (bool)
    {
        return accounts[_proposal].membership & PENDING_PROPOSAL == PENDING_PROPOSAL;
    }

    function isFraud(address _account)
    external view
    returns (bool)
    {
        return accounts[_account].membership & FRAUD == FRAUD;
    }

    function isPendingCabal(address _account)
    external view
    returns (bool)
    {
        return accounts[_account].membership & PENDING_CABAL == PENDING_CABAL;
    }

    function isCabal(address _account)
    external view
    returns (bool)
    {
        return accounts[_account].membership & CABAL == CABAL;
    }

    // under no condition should you let anyone control two BOARD accounts
    function appoint(address _board, string _vouch)
    external {
        require(accounts[msg.sender].membership & BOARD == BOARD);
        Account storage candidate = accounts[_board];
        if (candidate.membership & BOARD == BOARD) {
            return;
        }
        address appt = candidate.appointer;
        if (appt == 0 || accounts[appt].membership & BOARD == 0) {
            candidate.appointer = msg.sender;
            Nominated(_board, _vouch);
            return;
        }
        if (appt == msg.sender) {
            return;
        }
        candidate.membership |= BOARD;
        Board(_board, _vouch);
    }

    function denounce(address _board, string _reason)
    external {
        require(accounts[msg.sender].membership & BOARD == BOARD);
        Account storage board = accounts[_board];
        if (board.membership & BOARD == 0) {
            return;
        }
        address dncr = board.denouncer;
        if (dncr == 0 || accounts[dncr].membership & BOARD == 0) {
            board.denouncer = msg.sender;
            Denounced(_board, _reason);
            return;
        }
        if (dncr == msg.sender) {
            return;
        }
        board.membership ^= BOARD;
        Revoked(_board, _reason);
    }

    function proposeProper(bytes _resolution)
    external
    returns (ProposalInterface)
    {
        ProperProposal proposal = new ProperProposal();
        proposal.init(msg.sender, _resolution);
        accounts[proposal].membership |= PROPOSAL;
        Proposal(proposal);
        return proposal;
    }

    function proposeProxy(bytes _resolution)
    external
    returns (ProposalInterface)
    {
        ProperProposal proposal = ProperProposal(new ProxyProposal());
        proposal.init(msg.sender, _resolution);
        accounts[proposal].membership |= PROPOSAL;
        Proposal(proposal);
        return proposal;
    }

    function sudoPropose(ProposalInterface _proposal)
    external {
        require(accounts[msg.sender].membership & BOARD == BOARD);
        uint8 membership = accounts[_proposal].membership;
        require(membership & PROPOSAL == 0);
        Proposal(_proposal);
        accounts[_proposal].membership |= PROPOSAL;
    }

    // To submit an outside proposal contract, you must:
    // - ensure it conforms to ProposalInterface
    // - ensure it properly transfers the VOTE token, calling Vote.voteX
    // - open-source it using Etherscan or equivalent
    function proposeExternal(ProposalInterface _proposal)
    external
    {
        Account storage account = accounts[_proposal];
        require(account.membership & (PENDING_PROPOSAL | PROPOSAL) == 0);
        account.membership |= PENDING_PROPOSAL;
    }

    function confirmProposal(ProposalInterface _proposal)
    external
    {
        require(accounts[msg.sender].membership & BOARD == BOARD);
        Account storage account = accounts[_proposal];
        require(account.membership & PENDING_PROPOSAL == PENDING_PROPOSAL);
        account.membership ^= (PROPOSAL | PENDING_PROPOSAL);
        Proposal(_proposal);
    }

    // bans prevent accounts from voting through this proposal
    // this should only be used to stop a proposal that is abusing the VOTE token
    // the burn is to penalize bans, so that they cannot suppress ideas
    function banProposal(ProposalInterface _proposal, string _reason)
    external payable
    {
        require(msg.value == proposalCensorshipFee);
        require(accounts[msg.sender].membership & BOARD == BOARD);
        Account storage account = accounts[_proposal];
        require(account.membership & PROPOSAL == PROPOSAL);
        account.membership ^= (FRAUD | PROPOSAL);
        burn.transfer(msg.value);
        BannedProposal(_proposal, _reason);
    }

    // board members reserve the right to reject outside proposals for any reason
    function rejectProposal(ProposalInterface _proposal)
    external
    {
        require(accounts[msg.sender].membership & BOARD == BOARD);
        Account storage account = accounts[_proposal];
        require(account.membership & PENDING_PROPOSAL == PENDING_PROPOSAL);
        account.membership ^= (FRAUD | PENDING_PROPOSAL);
    }

    // this code lives here instead of in the token so that it can be upgraded with account registry migration
    function faucet()
    external {
        Account storage account = accounts[msg.sender];
        require(account.membership & VOTER == VOTER);
        uint256 lastAccess = account.lastAccess;
        uint256 grant = (now - lastAccess) / 72 minutes;
        if (grant > 40) {
            grant = 40;
            account.lastAccess = now;
        } else {
            account.lastAccess = lastAccess + grant * 72 minutes;
        }
        token.grant(msg.sender, grant);
    }

    function availableFaucet(address _account)
    external view
    returns (uint256) {
        uint256 grant = (now - accounts[_account].lastAccess) / 72 minutes;
        if (grant > 40) {
            grant = 40;
        }
        return grant;
    }
}
