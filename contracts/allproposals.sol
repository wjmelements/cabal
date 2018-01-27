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
contract Vote is ERC20 {
    uint256 supply = 0;
    AccountRegistry public accountRegistry;
    address public developerFund;

    uint8 public constant decimals = 1;
    string public symbol = "REV";
    string public name = "Registered Ether Vote";

    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) approved;
    mapping (address => uint256) faucetDate;

    function Vote(address _developerFund) public {
        accountRegistry = AccountRegistry(msg.sender);
        developerFund = _developerFund;
    }
    function totalSupply() public constant returns (uint) {
        return supply;
    }
    function balanceOf(address _owner) public constant returns (uint) {
        return balances[_owner];
    }
    function approve(address _spender, uint _value) public returns (bool) {
        approved[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
    }
    function allowance(address _owner, address _spender) public constant returns (uint) {
        return approved[_owner][_spender];
    }
    function transfer(address _to, uint _value) public returns (bool) {
        require(balances[msg.sender] <= _value);
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        Transfer(msg.sender, _to, _value);
    }
    function transferFrom(address _from, address _to, uint _value) public returns (bool) {
        require(balances[_from] >= _value);
        require(approved[_from][msg.sender] >= _value);
        approved[_from][msg.sender] -= _value;
        balances[_from] -= _value;
        balances[_to] += _value;
        Transfer(_from, _to, _value);
    }
    function faucet() external {
        require(accountRegistry.canVote(msg.sender));
        uint256 lastAccess = faucetDate[msg.sender];
        uint256 grant = (now - lastAccess) / 72 minutes;
        if (grant > 40) {
            grant = 40;
        }
        balances[msg.sender] += grant;
        supply += grant;
        faucetDate[msg.sender] = now;
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

    function vote(address _voter, address _votee) public {
        require(accountRegistry.isProposal(msg.sender));
        require(accountRegistry.canVote(_voter));
        require(balances[_voter] >= 10);
        balances[_voter] -= 10;
        balances[developerFund] += 5;
        balances[_votee] += 5;
    }
    function transferDeveloperFund(address _newDeveloperFund) external {
        require(msg.sender == developerFund);
        balances[_newDeveloperFund] += balances[developerFund];
        balances[developerFund] = 0;
        developerFund = _newDeveloperFund;
    }
    function migrateAccountRegistry(AccountRegistry _newAccountRegistry) external {
        require(msg.sender == developerFund);
        accountRegistry = _newAccountRegistry;
    }
}
interface ProposalInterface {
    function getPosition(address _user) public view returns (ProposalLib.Position);
    function argumentCount() public view returns (uint256);
    function vote(uint256 _argumentId) external;
    function resolution() public view returns (bytes);
    function voteCount() public view returns (uint256);
}
library ProposalLib {
    Vote constant voteToken = Vote(0xdead);//FIXME
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

    modifier setVote(Storage storage self, uint256 _argumentId) {
        _;
        self.arguments[self.votes[msg.sender]].count--;
        self.arguments[
            self.votes[msg.sender] = _argumentId
        ].count++;
    }
    modifier pays(Storage storage self, uint256 _argumentId) {
        _;
        address destination = self.arguments[_argumentId].source;
        voteToken.vote(msg.sender, destination);
    }
    function vote(Storage storage self, uint256 _argumentId)
    internal
    setVote(self, _argumentId)
    pays(self, _argumentId) {
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
    internal
    returns (bytes storage) {
        return self.arguments[_index].text;
    }

    function resolution(Storage storage self)
    internal
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

    function argue(Storage storage self, Position _position, bytes _text)
    internal
    pays(self, 0)
    setVote(self, self.arguments.length)
    returns (uint256) {
        uint256 argumentId = self.arguments.length;
        self.arguments.push(Argument(msg.sender, _position, 0, _text));
        return argumentId;
    }

    function init(Storage storage self, address _source, bytes _resolution)
    internal {
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

    function resolution()
    public view
    returns (bytes) {
        return proposal.resolution();
    }

    function voteCount()
    public view
    returns (uint256) {
        return proposal.voteCount();
    }

    function source()
    public view
    returns (address) {
        return proposal.source();
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
contract Cabal is CabalInterface {
    uint256 constant public membershipFee = 1 finney;
    uint256 constant public rejectionBounty = 100 szabo;
    uint256 constant public rejectionBurn = 900 szabo;
    uint256 constant public admissionBounty = 1 finney;

    address constant burn = 0xdead;

    string public name;
    address[] members;
    ProposalInterface[] public proposals;
    ProposalInterface[] public canon;
    AllProposals public allProposals;

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

    modifier followsCanon() {
        for (uint256 i = 0; i < canon.length; i++) {
            ProposalInterface proposal = canon[i];
            require(proposal.getPosition(msg.sender) == ProposalLib.Position.APPROVE);
        }
        _;
    }

    enum Membership {
        // default
        UNCONTACTED,
        // listed in members array
        REJECTED,
        // can not apply to join
        BANNED,
        // requires board attention
        PENDING,
        // can be banned
        PROPOSAL,
        // can rejoin
        HERETIC,
        // can add proposals; votes are counted
        MEMBER,
        // can ban
        MODERATOR,
        // can confirm members
        BOARD,
        // immutable
        CANON,
        // created the cabal
        SOURCE
    }
    mapping (address => Membership) public membership;
    modifier mustBe(Membership role) {
        require(membership[msg.sender] >= role);
        _;
    }

    function Cabal(string _name, AllProposals _allCabals)
    public {
        name = _name;
        membership[msg.sender] = Membership.SOURCE;
        members.push(msg.sender);
        allProposals = _allCabals;
    }

    // useful RPC call but please avoid depending on this function
    function memberCount()
    public view
    returns (uint256) { return memberCount(Membership.MEMBER); }
    function memberCount(Membership _threshold)
    public view
    returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            if (membership[member] < _threshold) {
                continue;
            }
            count++;
        }
        return count;
    }
    
    // useful RPC call but please avoid dependending on this function in contracts
    function voteCounts(ProposalInterface _proposal)
    public view
    returns (uint256[5]) {
        return voteCounts(_proposal, Membership.MEMBER);
    }
    function voteCounts(ProposalInterface _proposal, Membership _level)
    public view
    returns (uint256[5]) {
        uint256[5] memory counts;
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            if (membership[member] < _level) {
                continue;
            }
            ProposalLib.Position position = _proposal.getPosition(member);
            counts[uint8(position)]++;
        }
        return counts;
    }

    // useful RPC call but please avoid dependending on this function in contracts
    function argumentCounts(Proposal _proposal)
    public view
    returns (uint256[]) {
        return argumentCounts(_proposal, Membership.MEMBER);
    }
    function argumentCounts(Proposal _proposal, Membership _level)
    public view
    returns (uint256[]) {
        uint256[] memory counts = new uint256[](_proposal.argumentCount());
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            if (membership[member] < _level) {
                continue;
            }
            counts[_proposal.votes(member)]++;
        }

        return counts;
    }

    // membership events
    event NewMember(address member);
    event Rejected(address member, string reason);
    event Admitted(address member);
    event Appointed(address member, Membership role);
    event NewHeretic(address member);
    event Reconciled(address member);
    event Migrated(address allProposals);

    function join()
    external payable
    followsCanon {
        require(msg.value >= membershipFee);
        require(membership[msg.sender] <= Membership.REJECTED);
        if (membership[msg.sender] == Membership.UNCONTACTED) {
            members.push(msg.sender);
        }
        membership[msg.sender] = Membership.PENDING;
        NewMember(msg.sender);
    }

    function reject(address _applicant, string _reason)
    external
    mustBe(Membership.BOARD) {
        require(membership[_applicant] == Membership.PENDING);
        membership[_applicant] = Membership.REJECTED;
        msg.sender.transfer(rejectionBounty);
        burn.transfer(rejectionBurn);
        Rejected(_applicant, _reason);
    }

    function admit(address _applicant)
    external
    mustBe(Membership.BOARD) {
        require(membership[_applicant] == Membership.PENDING);
        membership[_applicant] = Membership.MEMBER;
        msg.sender.transfer(admissionBounty);
        Admitted(_applicant);
    }

    function ban(address _member)
    external
    mustBe(Membership.MODERATOR) {
        require(membership[_member] > Membership.PENDING);
        require(membership[_member] <= membership[msg.sender]);
        membership[_member] = Membership.BANNED;
    }

    function appoint(address _member, Membership _role)
    external
    mustBe(Membership.BOARD) {
        require(membership[_member] >= Membership.MEMBER);
        require(_role == Membership.MODERATOR || _role == Membership.BOARD);
        membership[_member] = _role;
        Appointed(_member, _role);
    }

    function rejoin()
    external
    followsCanon {
        require(membership[msg.sender] == Membership.HERETIC);
        for (uint256 i = 0; i < canon.length; i++) {
            require(canon[i].getPosition(msg.sender) == ProposalLib.Position.APPROVE);
        }
        membership[msg.sender] = Membership.MEMBER;
        Reconciled(msg.sender);
    }

    function denounceHeretics(ProposalInterface _proposal)
    external
    mustBe(Membership.MODERATOR) {
        require(membership[_proposal] == Membership.CANON);
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            if (membership[member] < Membership.MEMBER) {
                continue;
            }
            if (_proposal.getPosition(member) != ProposalLib.Position.APPROVE) {
                membership[member] = Membership.HERETIC;
                NewHeretic(member);
            }
        }
    }

    // proposal events
    event NewProposal(Proposal proposal);
    event NewCanon(ProposalInterface proposal);

    function propose(Proposal _proposal)
    external
    mustBe(Membership.MEMBER) {
        require(membership[_proposal] == Membership.UNCONTACTED);
        require(allProposals.isProposal(_proposal));
        membership[_proposal] = Membership.PROPOSAL;
        proposals.push(_proposal);
        NewProposal(_proposal);
    }

    function canonize(uint256 _proposalId)
    external
    mustBe(Membership.BOARD) {
        require(membership[proposal] == Membership.PROPOSAL);
        // proposal must already be linked here
        ProposalInterface proposal = proposals[_proposalId];
        // verify vote counts:
        uint256[5] memory counts = voteCounts(proposal);
        // prevent rogue board instacanon attacks
        require(counts[uint8(ProposalLib.Position.APPROVE)] > 19);
        // require 95% APPROVE to REJECT ratio
        require(counts[uint8(ProposalLib.Position.APPROVE)] > 19 * counts[uint8(ProposalLib.Position.REJECT)]);
        // require APPROVE > AMEND
        require(counts[uint8(ProposalLib.Position.APPROVE)] > counts[uint8(ProposalLib.Position.AMEND)]);
        // require APPROVE > LOL
        require(counts[uint8(ProposalLib.Position.APPROVE)] > counts[uint8(ProposalLib.Position.LOL)]);

        canon.push(proposal);
        membership[proposal] = Membership.CANON;
        NewCanon(proposal);

        this.denounceHeretics(proposal);
        // TODO consider voting on this proposal
    }

    function migrate(AllProposals _upgradedAccountRegistry)
    external
    mustBe(Membership.BOARD) {
        allProposals = _upgradedAccountRegistry;
    }
}
contract AccountRegistry is AllProposals {
    
    uint256 constant public registrationDeposit = 1 finney;
    uint256 constant public outsideProposalVerificationFee = 50 finney;
    uint256 constant public outsideProposalRejectionBurn = 25 finney;
    uint256 constant public outsideProposalRejectionBounty = 25 finney;

    address burn = 0xdead;

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
    struct Info {
        uint256 deregistrationDate;
        uint8 membership;
    }
    mapping (address => Info) infoMap;

    Cabal[] public allCabals;
    ProposalInterface[] public allProposals;
    Vote public voteToken;

    function AccountRegistry()
    public
    {
        infoMap[msg.sender].membership ^= BOARD;
        voteToken = new Vote(msg.sender);
    }

    event NewVoter(address voter);
    event Deregistered(address voter);
    event NewBoard(address board);
    event NewProposal(ProposalInterface proposal);
    event NewCabal(Cabal cabal);
    event BannedProposal(ProposalInterface proposal, string reason);

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
    function registerCabal(Cabal _cabal)
    external {
        Info storage info = infoMap[_cabal];
        require((info.membership & ~(PENDING_CABAL | CABAL)) == info.membership);
        info.membership |= PENDING_CABAL;
        NewCabal(_cabal);
    }

    function confirmCabal(Cabal _cabal)
    external {
        require(infoMap[msg.sender].membership & BOARD == BOARD);
        Info storage info = infoMap[_cabal];
        require(info.membership & PENDING_CABAL == PENDING_CABAL);
        info.membership ^= (CABAL | PENDING_CABAL);
        allCabals.push(_cabal);
    }

    function register()
    external payable
    {
        require(msg.value == registrationDeposit);
        Info storage info = infoMap[msg.sender];
        require(info.membership & ~VOTER == info.membership);
        info.deregistrationDate = now + 7 days;
        info.membership |= VOTER;
        NewVoter(msg.sender);
    }

    function deregister()
    external
    {
        Info storage info = infoMap[msg.sender];
        require(info.membership & VOTER == VOTER);
        require(info.deregistrationDate < now);
        info.membership &= ~VOTER;
        msg.sender.transfer(registrationDeposit);
        Deregistered(msg.sender);
    }

    function canDeregister(address _voter)
    public view
    returns (bool)
    {
        return infoMap[_voter].deregistrationDate < now;
    }

    function canVote(address _voter)
    public view
    returns (bool)
    {
        return infoMap[_voter].membership & VOTER == VOTER;
    }

    function isProposal(address _proposal)
    public view
    returns (bool)
    {
        return infoMap[_proposal].membership & PROPOSAL == PROPOSAL;
    }

    function isPendingProposal(address _proposal)
    public view
    returns (bool)
    {
        return infoMap[_proposal].membership & PENDING_PROPOSAL == PENDING_PROPOSAL;
    }

    function isFraud(address _account)
    public view
    returns (bool)
    {
        return infoMap[_account].membership & FRAUD == FRAUD;
    }

    function isCabal(address _account)
    public view
    returns (bool)
    {
        return infoMap[_account].membership & CABAL == CABAL;
    }

    function appoint(address _board)
    external
    {
        require(infoMap[msg.sender].membership & BOARD == BOARD);
        infoMap[_board].membership |= BOARD;
        NewBoard(_board);
    }

    function propose(bytes _resolution)
    external
    returns (Proposal)
    {
        Proposal proposal = new Proposal(msg.sender, _resolution);
        infoMap[proposal].membership |= PROPOSAL;
        allProposals.push(proposal);
        NewProposal(proposal);
        return proposal;
    }

    // To submit an outside proposal contract, you must:
    // - ensure it conforms to ProposalInterface
    // - ensure it properly transfers the VOTE token, calling Vote.vote inside Proposal.vote
    // - open-source it using Etherscan or equivalent
    // - pay a manual verification fee
    function proposeExternal(ProposalInterface _proposal)
    external payable
    {
        require(msg.value == outsideProposalVerificationFee);
        Info storage info = infoMap[_proposal];
        require(info.membership & ~(PENDING_PROPOSAL | PROPOSAL) == info.membership);
        info.membership |= PENDING_PROPOSAL;
    }

    function confirmProposal(ProposalInterface _proposal)
    external
    {
        require(infoMap[msg.sender].membership & BOARD == BOARD);
        Info storage info = infoMap[_proposal];
        require(info.membership & PENDING_PROPOSAL == PENDING_PROPOSAL);
        info.membership ^= (PROPOSAL | PENDING_PROPOSAL);
        msg.sender.transfer(outsideProposalVerificationFee);
        allProposals.push(_proposal);
        NewProposal(_proposal);
    }

    // bans prevent accounts from voting through this proposal
    // this should only be used to stop a proposal that is abusing the VOTE token
    // the burn is to penalize bans, so that they cannot suppress ideas
    function banProposal(ProposalInterface _proposal, string _reason)
    external payable
    {
        require(msg.value == outsideProposalVerificationFee);
        require(infoMap[msg.sender].membership & BOARD == BOARD);
        Info storage info = infoMap[_proposal];
        require(info.membership & PROPOSAL == PROPOSAL);
        info.membership ^= (FRAUD | PROPOSAL);
        burn.transfer(msg.value);
        BannedProposal(_proposal, _reason);
    }

    // board members reserve the right to reject outside proposals for any reason
    function rejectProposal(ProposalInterface _proposal)
    external
    {
        require(infoMap[msg.sender].membership & BOARD == BOARD);
        Info storage info = infoMap[_proposal];
        require(info.membership & PENDING_PROPOSAL == PENDING_PROPOSAL);
        info.membership ^= (FRAUD | PENDING_PROPOSAL);
        msg.sender.transfer(outsideProposalRejectionBounty);
        burn.transfer(outsideProposalRejectionBurn); 
    }

}
