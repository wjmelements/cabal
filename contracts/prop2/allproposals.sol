pragma solidity ^0.4.18;
// v2 goal: shared proposal pool
// I can merge AllProposals and AllCabals and AllMembers because they have the same address space

// TODO Dai
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
contract Proposal {
    uint256 constant argumentBounty = 1 finney;
    uint256 constant voteBounty = 100 szabo;
    mapping (address => uint256) public votes;

    function getPosition(address user)
    public view
    returns (Position) {
        return arguments[votes[user]].position;
    }

    modifier setVote(uint256 argumentId) {
        _;
        arguments[votes[msg.sender]].count--;
        arguments[votes[msg.sender] = argumentId].count++;
    }

    event FailedMicropayment(address destination);
    modifier pays(uint256 argumentId, uint256 amount) {
        _;
        require(msg.value >= amount);
        address destination = arguments[argumentId].source;
        if (!destination.send(msg.value)) {
            FailedMicropayment(destination);
        }
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

    function Proposal(bytes _resolution)
    public {
        arguments.push(Argument(msg.sender, Position.SKIP, 0, _resolution));
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
    pays(0, argumentBounty)
    returns (uint256) {
        uint256 argumentId = arguments.length;
        arguments.push(Argument(msg.sender, position, 0, text));
        return argumentId;
    }

    function vote(uint256 argumentId)
    external payable
    setVote(argumentId)
    pays(argumentId, voteBounty) {
    }
}
contract Cabal {
    uint256 constant public membershipFee = 1 finney;
    uint256 constant public rejectionBounty = 100 szabo;
    uint256 constant public rejectionBurn = 900 szabo;
    uint256 constant public admissionBounty = 1 finney;

    address constant public burn = 0xdead;

    string public name;
    address[] members;
    Proposal[] proposals;
    Proposal[] public canon;

    function canonCount()
    public view
    returns (uint256) {
        return canon.length;
    }

    modifier followsCanon() {
        for (uint256 i = 0; i < canon.length; i++) {
            Proposal proposal = canon[i];
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

    function Cabal(string _name)
    public {
        name = _name;
        membership[msg.sender] = Membership.SOURCE;
        members.push(msg.sender);
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
    function voteCounts(Proposal proposal)
    public view
    returns (uint256[5]) {
        return voteCounts(proposal, Membership.MEMBER);
    }
    function voteCounts(Proposal proposal, Membership level)
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

    function denounceHeretics(Proposal proposal)
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
    event NewCanon(Proposal proposal);

    function propose(Proposal proposal)
    external
    mustBe(Membership.MEMBER) {
        require(membership[proposal] == Membership.UNCONTACTED);
        require(proposal.getPosition(msg.sender) == Proposal.Position.APPROVE); // FIXME use some other way to verify it is a proposal? 
        membership[proposal] = Membership.PROPOSAL;
        proposals.push(proposal);
        NewProposal(proposal);
    }

    function canonize(uint256 proposalId)
    external
    mustBe(Membership.BOARD) {
        require(membership[proposal] == Membership.PROPOSAL);
        // proposal must already be linked here
        Proposal proposal = proposals[proposalId];
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
    enum Membership {
        // default
        UNCONTACTED,
        //
        PENDING,
        //
        CABAL
    }
    struct CabalInfo {
        Membership membership;
        bytes data;
    }
    mapping (address => CabalInfo) info;

    Cabal[] public allCabals;
    Proposal[] public allProposals;

    function count()
    public view
    returns (uint256) {
        return allCabals.length;
    }

    function registerCabal(Cabal _cabal, bytes _data)
    external {
        require(info[_cabal].membership == Membership.UNCONTACTED);
        CabalInfo storage cInfo = info[_cabal];
        cInfo.membership = Membership.PENDING;
        cInfo.data = _data;
    }
}
