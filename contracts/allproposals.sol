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
    uint256 supply;
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) approved;
    mapping (address => uint256) faucetDate;

    AllCabals allCabals;
    address public developerFund;

    function Vote(address _developerFund, uint256 _fundSize) public {
        allCabals = AllCabals(msg.sender);
        developerFund = _developerFund;
        supply = _fundSize;
        balances[_developerFund] = _fundSize;
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
        assert(balances[msg.sender] <= _value);
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        Transfer(msg.sender, _to, _value);
    }
    function transferFrom(address _from, address _to, uint _value) public returns (bool) {
        assert(balances[_from] >= _value);
        assert(approved[_from][msg.sender] >= _value);
        approved[_from][msg.sender] -= _value;
        balances[_from] -= _value;
        balances[_to] += _value;
        Transfer(_from, _to, _value);
    }
    function faucet() external {
        assert(allCabals.canVote(msg.sender));
        uint256 lastAccess = faucetDate[msg.sender];
        assert(lastAccess + 8 hours <= now);
        uint256 grant = (now - lastAccess) / 8 hours;
        if (grant > 3) {
            grant = 3;
        }
        grant *= 2;
        balances[msg.sender] += grant;
        supply += grant;
        faucetDate[msg.sender] = now;
    }
    function vote(address _voter, address _votee) public {
        assert(allCabals.isProposal(msg.sender));
        assert(allCabals.canVote(_voter));
        assert(balances[_voter] > 0);
        balances[_voter] -= 2;
        balances[developerFund]++;
        balances[_votee]++;
    }
}
interface ProposalInterface {
    function getPosition(address user) public view returns (Proposal.Position);
    function argumentCount() public view returns (uint256);
    function vote(uint256 argumentId) external payable;
    function resolution() public view returns (bytes);
    function voteCount() public view returns (uint256);
}
contract Proposal is ProposalInterface {
    mapping (address => uint256) public votes;

    Vote voteToken;

    function getPosition(address _user)
    public view
    returns (Position) {
        return arguments[votes[_user]].position;
    }

    modifier setVote(uint256 _argumentId) {
        _;
        arguments[votes[msg.sender]].count--;
        arguments[votes[msg.sender] = _argumentId].count++;
    }

    event FailedMicropayment(address destination);
    modifier pays(uint256 argumentId) {
        _;
        address destination = arguments[argumentId].source;
        voteToken.vote(msg.sender, destination);
    }
    
    enum Position {
        SKIP,
        APPROVE,
        AMEND,
        REJECT,
        LOL
    }
    struct Argument {
        address source;
        Position position;
        uint256 count;
        bytes text;
    }

    Argument[] public arguments;

    function argumentCount()
    public view
    returns (uint256) {
        return arguments.length;
    }

    function Proposal(bytes _resolution, address _source, Vote _voteToken)
    public {
        arguments.push(Argument(_source, Position.SKIP, 0, _resolution));
        voteToken = _voteToken;
    }

    function resolution()
    public view
    returns (bytes) {
        return arguments[0].text;
    }

    function voteCount()
    public view
    returns (uint256) {
        return -arguments[0].count;
    }

    function source()
    public view
    returns (address) {
        return arguments[0].source;
    }

    function argue(Position position, bytes text)
    external payable
    setVote(arguments.length)
    pays(0)
    returns (uint256) {
        uint256 argumentId = arguments.length;
        arguments.push(Argument(msg.sender, position, 0, text));
        return argumentId;
    }

    function vote(uint256 argumentId)
    external payable
    setVote(argumentId)
    pays(argumentId) {
    }
}
interface CabalInterface {
    function memberCount() public view returns (uint256);
    function canonCount() public view returns (uint256);
    function proposalCount() public view returns (uint256);
}
contract Cabal is CabalInterface {
    uint256 constant public membershipFee = 1 finney;
    uint256 constant public rejectionBounty = 100 szabo;
    uint256 constant public rejectionBurn = 900 szabo;
    uint256 constant public admissionBounty = 1 finney;

    address constant public burn = 0xdead;

    string public name;
    address[] members;
    ProposalInterface[] public proposals;
    ProposalInterface[] public canon;
    AllCabals public allCabals;

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
            require(proposal.getPosition(msg.sender) == Proposal.Position.APPROVE);
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

    function Cabal(string _name, AllCabals _allCabals)
    public {
        name = _name;
        membership[msg.sender] = Membership.SOURCE;
        members.push(msg.sender);
        allCabals = _allCabals;
    }

    // useful RPC call but please avoid depending on this function
    function memberCount()
    public view
    returns (uint256) { return memberCount(Membership.MEMBER); }
    function memberCount(Membership threshold)
    public view
    returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            if (membership[member] < threshold) {
                continue;
            }
            count++;
        }
        return count;
    }
    
    // useful RPC call but please avoid dependending on this function in contracts
    function voteCounts(ProposalInterface proposal)
    public view
    returns (uint256[5]) {
        return voteCounts(proposal, Membership.MEMBER);
    }
    function voteCounts(ProposalInterface proposal, Membership level)
    public view
    returns (uint256[5]) {
        uint256[5] memory counts;
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            if (membership[member] < level) {
                continue;
            }
            Proposal.Position position = proposal.getPosition(member);
            counts[uint8(position)]++;
        }
        return counts;
    }

    // useful RPC call but please avoid dependending on this function in contracts
    function argumentCounts(Proposal proposal)
    public view
    returns (uint256[]) {
        return argumentCounts(proposal, Membership.MEMBER);
    }
    function argumentCounts(Proposal proposal, Membership level)
    public view
    returns (uint256[]) {
        uint256[] memory counts = new uint256[](proposal.argumentCount());
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            if (membership[member] < level) {
                continue;
            }
            counts[proposal.votes(member)]++;
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

    function reject(address applicant, string reason)
    external
    mustBe(Membership.BOARD) {
        require(membership[applicant] == Membership.PENDING);
        membership[applicant] = Membership.REJECTED;
        msg.sender.transfer(rejectionBounty);
        burn.transfer(rejectionBurn);
        Rejected(applicant, reason);
    }

    function admit(address applicant)
    external
    mustBe(Membership.BOARD) {
        require(membership[applicant] == Membership.PENDING);
        membership[applicant] = Membership.MEMBER;
        msg.sender.transfer(admissionBounty);
        Admitted(applicant);
    }

    function ban(address member)
    external
    mustBe(Membership.MODERATOR) {
        require(membership[member] > Membership.PENDING);
        require(membership[member] <= membership[msg.sender]);
        membership[member] = Membership.BANNED;
    }

    function appoint(address member, Membership role)
    external
    mustBe(Membership.BOARD) {
        require(membership[member] >= Membership.MEMBER);
        require(role == Membership.MODERATOR || role == Membership.BOARD);
        membership[member] = role;
        Appointed(member, role);
    }

    function rejoin()
    external
    followsCanon {
        require(membership[msg.sender] == Membership.HERETIC);
        for (uint256 i = 0; i < canon.length; i++) {
            require(canon[i].getPosition(msg.sender) == Proposal.Position.APPROVE);
        }
        membership[msg.sender] = Membership.MEMBER;
        Reconciled(msg.sender);
    }

    function denounceHeretics(ProposalInterface proposal)
    external
    mustBe(Membership.MODERATOR) {
        require(membership[proposal] == Membership.CANON);
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            if (membership[member] < Membership.MEMBER) {
                continue;
            }
            if (proposal.getPosition(member) != Proposal.Position.APPROVE) {
                membership[member] = Membership.HERETIC;
                NewHeretic(member);
            }
        }
    }

    // proposal events
    event NewProposal(Proposal proposal);
    event NewCanon(ProposalInterface proposal);

    function propose(Proposal proposal)
    external
    mustBe(Membership.MEMBER) {
        require(membership[proposal] == Membership.UNCONTACTED);
        require(allCabals.isProposal(proposal));
        membership[proposal] = Membership.PROPOSAL;
        proposals.push(proposal);
        NewProposal(proposal);
    }

    function canonize(uint256 proposalId)
    external
    mustBe(Membership.BOARD) {
        require(membership[proposal] == Membership.PROPOSAL);
        // proposal must already be linked here
        ProposalInterface proposal = proposals[proposalId];
        // verify vote counts:
        uint256[5] memory counts = voteCounts(proposal);
        // prevent rogue board instacanon attacks
        require(counts[uint8(Proposal.Position.APPROVE)] > 19);
        // require 95% APPROVE to REJECT ratio
        require(counts[uint8(Proposal.Position.APPROVE)] > 19 * counts[uint8(Proposal.Position.REJECT)]);
        // require APPROVE > AMEND
        require(counts[uint8(Proposal.Position.APPROVE)] > counts[uint8(Proposal.Position.AMEND)]);
        // require APPROVE > LOL
        require(counts[uint8(Proposal.Position.APPROVE)] > counts[uint8(Proposal.Position.LOL)]);

        canon.push(proposal);
        membership[proposal] = Membership.CANON;
        NewCanon(proposal);

        this.denounceHeretics(proposal);
    }
}
contract AllCabals {
    
    uint256 constant public registrationBounty = 1 finney;
    uint256 constant public outsideProposalVerificationFee = 50 finney;
    uint256 constant public outsideProposalRejectionBurn = 25 finney;
    uint256 constant public outsideProposalRejectionBounty = 25 finney;

    enum Membership {
        // default
        UNCONTACTED,
        VOTER,
        PENDING_PROPOSAL,
        PROPOSAL,
        PENDING_CABAL,
        CABAL,
        BOARD
        // TODO determine if proposals and cabals can be board members
        // TODO if proposals can be board members, we have to update the vote token code
    }
    struct Info {
        Membership membership;
        uint256 registrationDate;
    }
    mapping (address => Info) infoMap;

    Cabal[] public allCabals;
    ProposalInterface[] public allProposals;
    Vote public voteToken;

    function AllCabals()
    public
    {
        infoMap[msg.sender].membership = Membership.BOARD;
        voteToken = new Vote(msg.sender, 0);
    }

    event NewVoter(address voter);
    event Deregistered(address voter);
    event NewBoard(address board);
    event NewProposal(ProposalInterface proposal);
    event NewCabal(Cabal cabal);

    function cabalCount()
    public view
    returns (uint256) {
        return allCabals.length;
    }

    // To register a Cabal, you must
    // - implement CabalInterface
    // - open-source your Cabal
    function registerCabal(Cabal _cabal)
    external {
        Info storage info = infoMap[_cabal];
        require(info.membership == Membership.UNCONTACTED);
        info.membership = Membership.PENDING_CABAL;
        NewCabal(_cabal);
    }

    function confirmCabal(Cabal _cabal)
    external {
        require(infoMap[msg.sender].membership == Membership.BOARD);
        Info storage info = infoMap[_cabal];
        require(info.membership == Membership.PENDING_CABAL);
        info.membership = Membership.CABAL;
        allCabals.push(_cabal);
    }

    function register()
    external payable
    {
        assert(msg.value == registrationBounty);
        Info storage info = infoMap[msg.sender];
        require(info.membership == Membership.UNCONTACTED);
        info.membership = Membership.VOTER;
        info.registrationDate = now;
        NewVoter(msg.sender);
    }

    function deregister()
    external
    {
        Info storage info = infoMap[msg.sender];
        assert(info.membership == Membership.VOTER);
        assert(info.registrationDate > now - 7 days);
        info.membership = Membership.UNCONTACTED;
        msg.sender.transfer(registrationBounty);
        Deregistered(msg.sender);
    }

    function canVote(address _voter) public view
    returns (bool)
    {
        Info storage info = infoMap[_voter];
        return info.membership == Membership.VOTER
            || info.membership == Membership.BOARD;
    }

    function isProposal(address _proposal) public view
    returns (bool)
    {
        return infoMap[_proposal].membership == Membership.PROPOSAL;
    }

    // board members gain superpowers but cannot claim their deposit
    function appoint(address _board)
    external
    {
        assert(infoMap[msg.sender].membership == Membership.BOARD);
        assert(infoMap[_board].membership == Membership.VOTER || infoMap[_board].membership == Membership.UNCONTACTED);
        infoMap[_board].membership = Membership.BOARD;
        NewBoard(_board);
    }

    function propose(bytes _resolution)
    external
    returns (Proposal)
    {
        Proposal proposal = new Proposal(_resolution, msg.sender, voteToken);
        infoMap[proposal].membership = Membership.PROPOSAL;
        allProposals.push(proposal);
        NewProposal(proposal);
        return proposal;
    }

    // To submit an outside proposal contract, you must:
    // - ensure it conforms to ProposalInterface
    // - ensure it properly transfers the VOTE token
    // - open-source it using Etherscan or equivalent
    // - pay a manual verification fee
    function propose(ProposalInterface _proposal)
    external payable
    {
        assert(msg.value == outsideProposalVerificationFee);
        Info storage info = infoMap[_proposal];
        assert(info.membership == Membership.UNCONTACTED);
        info.membership = Membership.PENDING_PROPOSAL;
    }

    function confirmProposal(ProposalInterface _proposal)
    external
    {
        assert(infoMap[msg.sender].membership == Membership.BOARD);
        Info storage info = infoMap[_proposal];
        assert(info.membership == Membership.PENDING_PROPOSAL);
        info.membership = Membership.PROPOSAL;
        msg.sender.transfer(outsideProposalVerificationFee);
        allProposals.push(_proposal);
        NewProposal(_proposal);
    }
}
