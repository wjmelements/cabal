pragma solidity ^0.4.20;

import "./Proposal.sol";

contract AccountRegistry is AccountRegistryInterface, TokenRescue {
    
    uint256 constant public registrationDeposit = 1 finney;
    uint256 constant public appCensorshipFee = 50 finney;

    // this is the first deterministic contract address for 0x24AE90765668938351075fB450892800d9A52E39
    address constant public burn = 0x000000003Ffc15cd9eA076d7ec40B8f516367Ca1;

    FinneyVote public constant token = FinneyVote(0x000000002647e16d9BaB9e46604D75591D289277);

    /* uint8 membership bitmap:
     * 0 - installer
     * 1 - registered to vote
     * 2 - already suggested
     * 3 - app
     * 4 - board member
     * 5 - reserved
     * 6 - reserved
     * 7 - board
     */
    uint8 constant UNCONTACTED = 0;
    uint8 constant INSTALLER = 1;
    uint8 constant VOTER = 2;
    uint8 constant SUGGESTED = 3;
    uint8 constant APP = 8;
    uint8 constant BOARD = 64;
    struct Account {
        uint256 lastAccess;
        uint8 membership;
        address appointer; //nominated this account for BOARD
        address denouncer; //denounced this BOARD account
        address voucher; //nominated this account for INSTALLER
        address devoucher; //denounced this account for INSTALLER
        address installer; //nominated this app
        address censor; //nominated app for shutdown
    }
    mapping (address => Account) accounts;

    constructor()
    public
    {
        accounts[0x4a6f6B9fF1fc974096f9063a45Fd12bD5B928AD1].membership = BOARD;
        emit Board(0x4a6f6B9fF1fc974096f9063a45Fd12bD5B928AD1);
        accounts[0x90Fa310397149A7a9058Ae2d56e66e707B12D3A7].membership = BOARD;
        emit Board(0x90Fa310397149A7a9058Ae2d56e66e707B12D3A7);
        accounts[0x424a6e871E8cea93791253B47291193637D6966a].membership = BOARD;
        emit Board(0x424a6e871E8cea93791253B47291193637D6966a);
        accounts[0xA4caDe6ecbed8f75F6fD50B8be92feb144400CC4].membership = BOARD;
        emit Board(0xA4caDe6ecbed8f75F6fD50B8be92feb144400CC4);
    }

    event Voter(address indexed voter);
    event Deregistered(address indexed voter);

    event Nominated(address indexed board, string endorsement);
    event Board(address indexed board);

    event Denounced(address indexed board, string reason);
    event Revoked(address indexed board);

    event App(ProposalInterface indexed app);
    event BannedApp(ProposalInterface indexed app);
    event Censor(ProposalInterface, string reason);
    event Installing(ProposalInterface indexed app);

    event Vouch(address indexed installer, string vouch);
    event Installer(address indexed installer);

    event Devouch(address indexed installer, string vouch);
    event Shutdown(address indexed installer);

    function register()
    external payable
    {
        require(msg.value == registrationDeposit);
        Account storage account = accounts[msg.sender];
        require(account.membership & VOTER == 0);
        account.lastAccess = now;
        account.membership |= VOTER;
        token.grant(msg.sender, 40);
        emit Voter(msg.sender);
    }

    // smart contracts must implement the fallback function in order to deregister
    function deregister()
    external
    {
        Account storage account = accounts[msg.sender];
        require(account.membership & VOTER != 0);
        require(account.lastAccess + 7 days <= now);
        account.membership ^= VOTER;
        account.lastAccess = 0;
        // the MANDATORY transfer keeps population() meaningful
        msg.sender.transfer(registrationDeposit);
        emit Deregistered(msg.sender);
    }

    function population()
    external view
    returns (uint256)
    {
        return address(this).balance / 1 finney;
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

    function canVoteOnProposal(address _voter, address _app)
    external view
    returns (bool)
    {
        return accounts[_voter].membership & VOTER != 0
            && accounts[_app].membership & APP != 0;
    }

    function canVote(address _voter)
    external view
    returns (bool)
    {
        return accounts[_voter].membership & VOTER != 0;
    }

    function isApp(address _app)
    external view
    returns (bool)
    {
        return accounts[_app].membership & APP != 0;
    }

    // under no condition should you let anyone control two BOARD accounts
    function appoint(address _board, string _vouch)
    external {
        require(accounts[msg.sender].membership & BOARD != 0);
        Account storage candidate = accounts[_board];
        if (candidate.membership & BOARD != 0) {
            return;
        }
        address appt = candidate.appointer;
        if (accounts[appt].membership & BOARD == 0) {
            candidate.appointer = msg.sender;
            emit Nominated(_board, _vouch);
            return;
        }
        if (appt == msg.sender) {
            return;
        }
        emit Nominated(_board, _vouch);
        candidate.membership |= BOARD;
        emit Board(_board);
    }

    function denounce(address _board, string _reason)
    external {
        require(accounts[msg.sender].membership & BOARD != 0);
        Account storage board = accounts[_board];
        if (board.membership & BOARD == 0) {
            return;
        }
        address dncr = board.denouncer;
        if (accounts[dncr].membership & BOARD == 0) {
            board.denouncer = msg.sender;
            emit Denounced(_board, _reason);
            return;
        }
        if (dncr == msg.sender) {
            return;
        }
        emit Denounced(_board, _reason);
        board.membership ^= BOARD;
        emit Revoked(_board);
    }

    function vouchInstaller(address _installer, string _vouch)
    external {
        require(accounts[msg.sender].membership & BOARD != 0);
        Account storage candidate = accounts[_installer];
        if (candidate.membership & INSTALLER != 0) {
            return;
        }
        address appt = candidate.voucher;
        if (accounts[appt].membership & BOARD == 0) {
            candidate.voucher = msg.sender;
            emit Vouch(_installer, _vouch);
            return;
        }
        if (appt == msg.sender) {
            return;
        }
        emit Vouch(_installer, _vouch);
        candidate.membership |= INSTALLER;
        emit Installer(_installer);
    }

    function devouchInstaller(address _installer, string _devouch)
    external {
        require(accounts[msg.sender].membership & BOARD != 0);
        Account storage candidate = accounts[_installer];
        if (candidate.membership & INSTALLER == 0) {
            return;
        }
        address appt = candidate.devoucher;
        if (accounts[appt].membership & BOARD == 0) {
            candidate.devoucher = msg.sender;
            emit Devouch(_installer, _devouch);
            return;
        }
        if (appt == msg.sender) {
            return;
        }
        emit Devouch(_installer, _devouch);
        candidate.membership &= ~INSTALLER;
        emit Shutdown(_installer);
    }

    function banApp(ProposalInterface _app, string _reason)
    external
    {
        require(accounts[msg.sender].membership & BOARD != 0);
        Account storage app = accounts[_app];
        require(app.membership & APP != 0);
        address censor = app.censor;
        if (accounts[censor].membership & BOARD == 0) {
            app.censor = msg.sender;
            emit Censor(_app, _reason);
            return;
        }
        if (censor == msg.sender) {
            return;
        }
        emit Censor(_app, _reason);
        app.membership &= ~APP;
        emit BannedApp(_app);
    }

    function installApp(ProposalInterface _app)
    external
    {
        require(accounts[msg.sender].membership & BOARD != 0);
        Account storage app = accounts[_app];
        require(app.membership & APP == 0);
        address installer = app.installer;
        if (accounts[installer].membership & BOARD == 0) {
            app.installer = msg.sender;
            emit Installing(_app);
            return;
        }
        if (installer == msg.sender) {
            return;
        }
        emit Installing(_app);
        app.membership |= APP;
        emit App(_app);
    }

    function installProper(bytes _resolution)
    external
    returns (ProposalInterface)
    {
        ProperProposal app = new ProperProposal();
        app.init(msg.sender, _resolution);
        accounts[app].membership |= APP;
        emit App(app);
        return app;
    }

    function installProxy(bytes _resolution)
    external
    returns (ProposalInterface)
    {
        ProperProposal app;
        // ProperProposal v2: 0x00000000ef04214697e0de5567019a7908e16ba4
        bytes memory clone = hex"363d3d373d3d3d363d6fef04214697e0de5567019a7908e16ba45af43d82803e903d91602b57fd5bf3";
        assembly {
            let data := add(clone, 0x20)
            app := create(0, data, 58)
        }
        app.init(msg.sender, _resolution);
        accounts[app].membership |= APP;
        emit App(app);
        return app;
    }

    function sudoInstall(ProposalInterface _app)
    external {
        require(accounts[msg.sender].membership & INSTALLER != 0);
        uint8 membership = accounts[_app].membership;
        require(membership == 0);
        accounts[_app].membership = APP;
        emit App(_app);
    }

    event Suggestion(ProposalInterface _app);
    // For us to approve your app, you must:
    // - ensure it conforms to ProposalInterface
    // - ensure it properly transfers the VOTE token, calling Vote.voteX
    // - open-source it using Etherscan or equivalent
    function suggest(ProposalInterface _app)
    external
    {
        require(accounts[_app].membership & SUGGESTED == 0);
        accounts[_app].membership |= SUGGESTED;
        emit Suggestion(_app);
    }

    // this code lives here instead of in the token so that it can be upgraded with account registry migration
    function faucet()
    external {
        Account storage account = accounts[msg.sender];
        require(account.membership & VOTER != 0);
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
