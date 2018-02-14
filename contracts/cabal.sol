pragma solidity ^0.4.18;
interface CabalInterface {
    function memberCount() public view returns (uint256);
    function canonCount() public view returns (uint256);
    function proposalCount() public view returns (uint256);
}
interface AllProposals {
    function isProposal(address _proposal) public view returns (bool);
}
library ProposalLib {
    enum Position {
        SKIP,
        APPROVE,
        AMEND,
        LOL,
        REJECT
    }
}
interface ProposalInterface {
    function getPosition(address _user) public view returns (ProposalLib.Position);
    function votes(address _user) public view returns (uint256);
    function argumentCount() public view returns (uint256);
    function vote(uint256 _argumentId) external;
    function resolution() public view returns (bytes);
    function voteCount() public view returns (uint256);
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
    function argumentCounts(ProposalInterface _proposal)
    public view
    returns (uint256[]) {
        return argumentCounts(_proposal, Membership.MEMBER);
    }
    function argumentCounts(ProposalInterface _proposal, Membership _level)
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
    event NewProposal(ProposalInterface proposal);
    event NewCanon(ProposalInterface proposal);

    function propose(ProposalInterface _proposal)
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
