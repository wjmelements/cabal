pragma solidity ^0.4.18;

/**
 * Manually audited cabal registrar
 */
contract AllCabals {
    // the application fee serves to incentivize the board to review applications quickly
    uint256 constant public registrationBounty = 10 finney;
    // rejected application fees are 90% shredded
    uint256 constant public invalidationBounty = 1 finney;

    enum Membership {
        UNCONTACTED, // default
        REJECTED, // rejected applicant
        APPLIED, // application
        ACCEPTED, // accepted applicant
        BOARD, // allowed to approve cabals
        SOURCE // AllCabals creator
    }

    mapping (address => Membership) public membership;
    mapping (address => string) public abis;
    address[] public cabals;

    function AllCabals()
    public {
        membership[msg.sender] = Membership.SOURCE;
    }

    event CabalRegistered(address location);

    event CabalAccepted(address location);

    event CabalRejected(address location, string reason);

    function cabalCount()
    public view
    returns (uint256) {
        return cabals.length;
    }


    function register(address _cabalish, string _abi)
    external payable {
        assert(msg.value == registrationBounty);
        assert(membership[_cabalish] <= Membership.REJECTED);
        membership[_cabalish] = Membership.APPLIED;
        abis[_cabalish] = _abi;
        CabalRegistered(_cabalish);
    }

    function accept(address _cabalish)
    external {
        assert(membership[msg.sender] >= Membership.BOARD);
        assert(membership[_cabalish] == Membership.APPLIED);
        membership[_cabalish] = Membership.ACCEPTED;
        msg.sender.transfer(registrationBounty);
        cabals.push(_cabalish);
        CabalAccepted(_cabalish);
    }

    function reject(address _cabalish, string _reason)
    external {
        assert(membership[msg.sender] >= Membership.BOARD);
        assert(membership[_cabalish] == Membership.APPLIED);
        membership[_cabalish] = Membership.REJECTED;
        msg.sender.transfer(invalidationBounty);
        CabalRejected(_cabalish, _reason);
    }

    event NewBoardMember(address _boardMember);

    function appoint(address _delegate)
    external {
        assert(membership[msg.sender] >= Membership.BOARD);
        assert(membership[_delegate] == Membership.UNCONTACTED);
        membership[_delegate] = Membership.BOARD;
        NewBoardMember(_delegate);
    }
}
