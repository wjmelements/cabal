pragma solidity ^0.4.18;

interface ERC20 {
    function totalSupply() public constant returns (uint supply);
    function balanceOf(address _owner) public constant returns (uint balance);
    function transfer(address _to, uint _value) public returns (bool success);
    function transferFrom(address _from, address _to, uint _value) public returns (bool success);
    function approve(address _spender, uint _value) public returns (bool success);
    function allowance(address _owner, address _spender) public constant returns (uint remaining);
    event Transfer(address indexed _from, address indexed _to, uint _value);
    event Approval(address indexed _owner, address indexed _spender, uint _value);
}
contract TokenRescue {
    // this contract holds no tokens
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
contract Vote is ERC20,TokenRescue {
    uint256 supply = 0;
    AccountRegistry public accountRegistry = AccountRegistry(0x0000003B26D088fC73341DEf4FF38d5B8d6a7874);
    address public owner = 0x4a6f6B9fF1fc974096f9063a45Fd12bD5B928AD1;

    uint8 public constant decimals = 1;
    string public symbol = "FV";
    string public name = "FinneyVote";

    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) approved;
    mapping (address => uint256) faucetDate;

    function totalSupply() public constant returns (uint256) {
        return supply;
    }
    function balanceOf(address _owner) public constant returns (uint256) {
        return balances[_owner];
    }
    function approve(address _spender, uint256 _value) public returns (bool) {
        approved[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }
    function allowance(address _owner, address _spender) public constant returns (uint256) {
        return approved[_owner][_spender];
    }
    function transfer(address _to, uint256 _value) public returns (bool) {
        if (balances[msg.sender] < _value) {
            return false;
        }
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        Transfer(msg.sender, _to, _value);
        return true;
    }
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
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
    function faucet() external {
        require(accountRegistry.canVote(msg.sender));
        uint256 lastAccess = faucetDate[msg.sender];
        uint256 grant = (now - lastAccess) / 72 minutes;
        if (grant > 40) {
            grant = 40;
            faucetDate[msg.sender] = now;
        } else {
            faucetDate[msg.sender] = lastAccess + grant * 72 minutes;
        }
        balances[msg.sender] += grant;
        supply += grant;
        Transfer(address(0), msg.sender, grant);
    }

    function availableFaucet(address _account)
    public view
    returns (uint256) {
        uint256 grant = (now - faucetDate[_account]) / 72 minutes;
        if (grant > 40) {
            grant = 40;
        }
        return grant;
    }

    // vote5 and vote1 are available for future use
    function vote5(address _voter, address _votee) public {
        require(balances[_voter] >= 10);
        require(accountRegistry.canVoteAndIsProposal(_voter, msg.sender));
        balances[_voter] -= 10;
        balances[owner] += 5;
        balances[_votee] += 5;
        Transfer(_voter, owner, 5);
        Transfer(_voter, _votee, 5);
    }
    function vote1(address _voter, address _votee) public {
        require(balances[_voter] >= 10);
        require(accountRegistry.canVoteAndIsProposal(_voter, msg.sender));
        balances[_voter] -= 10;
        balances[owner] += 9;
        balances[_votee] += 1;
        Transfer(_voter, owner, 9);
        Transfer(_voter, _votee, 1);
    }
    function vote9(address _voter, address _votee) public {
        require(balances[_voter] >= 10);
        require(accountRegistry.canVoteAndIsProposal(_voter, msg.sender));
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
    event NewOwner(address indexed owner);
    event NewRegistry(address indexed registry);
    function transferOwnership(address _newOwner)
    external onlyOwner {
        uint256 balance = balances[owner];
        balances[_newOwner] += balance;
        balances[owner] = 0;
        Transfer(owner, _newOwner, balance);
        owner = _newOwner;
        NewOwner(owner);
    }
    function migrateAccountRegistry(AccountRegistry _newAccountRegistry)
    external onlyOwner {
        accountRegistry = _newAccountRegistry;
        NewRegistry(accountRegistry);
    }
}
interface ProposalInterface {
    function getPosition(address _user) public view returns (ProposalLib.Position);
    function argumentCount() public view returns (uint256);
    function vote(uint256 _argumentId) external;
}
library ProposalLib {
    Vote constant voteToken = Vote(0x0000001bf0CDA9c6f6c4644cB97174C427723894);
    enum Position {
        SKIP,
        APPROVE,
        AMEND,
        LOL,
        REJECT
    }
    struct Argument {
        address source;
        Position position;
        uint256 count;
        bytes text;
    }
    struct Storage {
        mapping (address => uint256) votes;
        Argument[] arguments;
    }
    function getPosition(Storage storage self, address _user)
    public view
    returns (Position) {
        return self.arguments[self.votes[_user]].position;
    }

    function argumentCount(Storage storage self) public view returns (uint256) {
        return self.arguments.length;
    }
    function argumentSource(Storage storage self, uint256 _index)
    public view
    returns (address) {
        return self.arguments[_index].source;
    }

    function argumentPosition(Storage storage self, uint256 _index)
    public view
    returns (Position) {
        return self.arguments[_index].position;
    }

    function argumentVoteCount(Storage storage self, uint256 _index)
    public view
    returns (uint256) {
        return self.arguments[_index].count;
    }

    function argumentText(Storage storage self, uint256 _index)
    internal view
    returns (bytes storage) {
        return self.arguments[_index].text;
    }

    function resolution(Storage storage self)
    internal view
    returns (bytes storage) {
        return self.arguments[0].text;
    }

    function voteCount(Storage storage self)
    public view
    returns (uint256) {
        return -self.arguments[0].count;
    }
    function source(Storage storage self)
    public view
    returns (address) {
        return self.arguments[0].source;
    }

    function vote(Storage storage self, uint256 _argumentId)
    public {
        address destination = self.arguments[_argumentId].source;
        voteToken.vote9(msg.sender, destination);
        self.arguments[self.votes[msg.sender]].count--;
        self.arguments[
            self.votes[msg.sender] = _argumentId
        ].count++;
    }

    function argue(Storage storage self, Position _position, bytes _text)
    public
    returns (uint256) {
        address destination = self.arguments[0].source;
        voteToken.vote9(msg.sender, destination);
        uint256 argumentId = self.arguments.length;
        self.arguments.push(Argument(msg.sender, _position, 1, _text));
        self.arguments[self.votes[msg.sender]].count--;
        self.votes[msg.sender] = argumentId;
        return argumentId;
    }

    function init(Storage storage self, address _source, bytes _resolution)
    public {
        self.arguments.push(ProposalLib.Argument(_source, Position.SKIP, 0, _resolution));
    }

}
contract Proposal is ProposalInterface {
    using ProposalLib for ProposalLib.Storage;
    ProposalLib.Storage proposal;

    function getPosition(address _user)
    public view
    returns (ProposalLib.Position) {
        return proposal.getPosition(_user);
    }

    function votes(address _user)
    public view
    returns (uint256) {
        return proposal.votes[_user];
    }

    function argumentCount()
    public view
    returns (uint256) {
        return proposal.argumentCount();
    }
    
    function argumentSource(uint256 _index)
    public view
    returns (address) {
        return proposal.argumentSource(_index);
    }

    function argumentPosition(uint256 _index)
    public view
    returns (ProposalLib.Position) {
        return proposal.argumentPosition(_index);
    }

    function argumentVoteCount(uint256 _index)
    public view
    returns (uint256) {
        return proposal.argumentVoteCount(_index);
    }

    function argumentText(uint256 _index)
    public view
    returns (bytes) {
        return proposal.argumentText(_index);
    }

    function Proposal(address _source, bytes _resolution)
    public {
        proposal.init(_source, _resolution);
    }

    function argue(ProposalLib.Position _position, bytes _text)
    external
    returns (uint256) {
        return proposal.argue(_position, _text);
    }

    function vote(uint256 _argumentId)
    external {
        proposal.vote(_argumentId);
    }
}
interface CabalInterface {
    function memberCount() public view returns (uint256);
    function canonCount() public view returns (uint256);
    function proposalCount() public view returns (uint256);
}
interface AllProposals {
    function isProposal(address _proposal) public view returns (bool);
}

contract AccountRegistry is AllProposals,TokenRescue {
    
    uint256 constant public registrationDeposit = 1 finney;
    uint256 constant public proposalCensorshipFee = 50 finney;

    // this is the first deterministic contract address for 0x315017F58EAaFC696bcF286928E08cbf15C00fDc
    address burn = 0x000000569972310C6de3A8a6cB8241aFfC853D0d;

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
        uint256 deregistrationDate;
        uint8 membership;
        address appointer;
        address denouncer;
    }
    mapping (address => Account) accounts;

    CabalInterface[] public allCabals;
    ProposalInterface[] public allProposals;

    function AccountRegistry()
    public
    {
        accounts[0x4a6f6B9fF1fc974096f9063a45Fd12bD5B928AD1].membership = BOARD;
        accounts[0x90Fa310397149A7a9058Ae2d56e66e707B12D3A7].membership = BOARD;
        accounts[0x424a6e871E8cea93791253B47291193637D6966a].membership = BOARD;
    }

    event NewVoter(address voter);
    event Deregistered(address voter);
    event Nominated(address indexed board, string endorsement);
    event Board(address indexed board, string endorsement);
    event Denounced(address indexed board, string reason);
    event Revoked(address indexed board, string reason);
    event NewProposal(ProposalInterface indexed proposal);
    event NewCabal(CabalInterface indexed cabal);
    event BannedProposal(ProposalInterface indexed proposal, string reason);

    function cabalCount()
    public view
    returns (uint256) {
        return allCabals.length;
    }

    function proposalCount()
    public view
    returns (uint256) {
        return allProposals.length;
    }

    // To register a Cabal, you must
    // - implement CabalInterface
    // - open-source your Cabal on Etherscan or equivalent
    function registerCabal(CabalInterface _cabal)
    external {
        Account storage account = accounts[_cabal];
        require(account.membership & (PENDING_CABAL | CABAL) == 0);
        account.membership |= PENDING_CABAL;
        NewCabal(_cabal);
    }

    function confirmCabal(CabalInterface _cabal)
    external {
        require(accounts[msg.sender].membership & BOARD == BOARD);
        Account storage account = accounts[_cabal];
        require(account.membership & PENDING_CABAL == PENDING_CABAL);
        account.membership ^= (CABAL | PENDING_CABAL);
        allCabals.push(_cabal);
    }

    function register()
    external payable
    {
        require(msg.value == registrationDeposit);
        Account storage account = accounts[msg.sender];
        require(account.membership & VOTER == 0);
        account.deregistrationDate = now + 7 days;
        account.membership |= VOTER;
        NewVoter(msg.sender);
    }

    function deregister()
    external
    {
        Account storage account = accounts[msg.sender];
        require(account.membership & VOTER == VOTER);
        require(account.deregistrationDate < now);
        account.membership &= ~VOTER;
        msg.sender.transfer(registrationDeposit);
        Deregistered(msg.sender);
    }

    function population()
    public view
    returns (uint256)
    {
        return this.balance / 1 finney;
    }

    function deregistrationDate()
    public view
    returns (uint256)
    {
        return accounts[msg.sender].deregistrationDate;
    }

    function canDeregister(address _voter)
    public view
    returns (bool)
    {
        return accounts[_voter].deregistrationDate < now;
    }

    function canVoteAndIsProposal(address _voter, address _proposal)
    public view
    returns (bool)
    {
        return accounts[_voter].membership & VOTER == VOTER
            && accounts[_proposal].membership & PROPOSAL == PROPOSAL;
    }

    function canVote(address _voter)
    public view
    returns (bool)
    {
        return accounts[_voter].membership & VOTER == VOTER;
    }

    function isProposal(address _proposal)
    public view
    returns (bool)
    {
        return accounts[_proposal].membership & PROPOSAL == PROPOSAL;
    }

    function isPendingProposal(address _proposal)
    public view
    returns (bool)
    {
        return accounts[_proposal].membership & PENDING_PROPOSAL == PENDING_PROPOSAL;
    }

    function isFraud(address _account)
    public view
    returns (bool)
    {
        return accounts[_account].membership & FRAUD == FRAUD;
    }

    function isPendingCabal(address _account)
    public view
    returns (bool)
    {
        return accounts[_account].membership & PENDING_CABAL == PENDING_CABAL;
    }

    function isCabal(address _account)
    public view
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
        board.membership &= ~BOARD;
        Revoked(_board, _reason);
    }

    function propose(bytes _resolution)
    external
    returns (Proposal)
    {
        Proposal proposal = new Proposal(msg.sender, _resolution);
        accounts[proposal].membership |= PROPOSAL;
        allProposals.push(proposal);
        NewProposal(proposal);
        return proposal;
    }

    function sudoPropose(ProposalInterface _proposal)
    external {
        require(accounts[msg.sender].membership & BOARD == BOARD);
        uint8 membership = accounts[_proposal].membership;
        require(membership & PROPOSAL == 0);
        accounts[_proposal].membership |= PROPOSAL;
        allProposals.push(_proposal);
    }

    // To submit an outside proposal contract, you must:
    // - ensure it conforms to ProposalInterface
    // - ensure it properly transfers the VOTE token, calling Vote.vote inside Proposal.vote
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
        allProposals.push(_proposal);
        NewProposal(_proposal);
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
}
