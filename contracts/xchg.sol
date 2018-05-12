pragma solidity^0.4.21;

import "./erc20.sol";

// feeless FV exchange
contract FVExchange {
    ERC20 constant token = ERC20(0x000000002647e16d9BaB9e46604D75591D289277);
    struct Account {
        uint256 eth;
    }
    mapping (address => Account) accounts;
    mapping (address => mapping (bytes32 => uint256)) orders;

    function () external payable {
        accounts[msg.sender].eth += msg.value;
    }

    function deposit() external payable {
        accounts[msg.sender].eth += msg.value;
    }

    function withdrawAll() external {
        uint256 amount = accounts[msg.sender].eth;
        accounts[msg.sender].eth = 0;
        msg.sender.transfer(amount);
    }

    function withdraw(uint256 _eth) external {
        require(accounts[msg.sender].eth >= _eth);
        accounts[msg.sender].eth -= _eth;
        msg.sender.transfer(_eth);
    }

    // orderId = keccak256(maker, fv, price, nonce)
    // odd nonce => sell order
    // even nonce => buy order
    // clients should use UNIX timestamps for nonce
    event Order(address maker, uint256 fv, uint256 price, uint256 nonce);
    event Canceled(bytes32 orderId);
    event Filled(bytes32 orderId, uint256 amount);

    function order(uint256 _fv, uint256 _price, uint256 _nonce)
    external {
        bytes32 orderId = keccak256(msg.sender, _fv, _price, _nonce);
        emit Order(msg.sender, _fv, _price, _nonce);
        orders[msg.sender][orderId] = _fv;
    }

    function cancel(bytes32 _orderId)
    external {
        orders[msg.sender][_orderId] = 0;
        emit Canceled(_orderId);
    }

    function buy(address _seller, uint256 _fv, uint256 _price, uint256 _nonce, uint256 _fvAmt)
    payable external {
        require(_nonce & 1 == 1);
        bytes32 orderId = keccak256(_seller, _fv, _price, _nonce);
        require(orders[_seller][orderId] >= _fvAmt);
        require(_fvAmt * _price == msg.value);

        orders[_seller][orderId] -= _fvAmt;
        require(token.transferFrom(_seller, msg.sender, _fvAmt));
        accounts[_seller].eth += msg.value; // instead of _seller.transfer(msg.value);
        emit Filled(orderId, _fvAmt);
    }

    function sell(address _buyer, uint256 _fv, uint256 _price, uint256 _nonce, uint256 _fvAmt)
    external {
        require(_nonce & 1 == 0);
        bytes32 orderId = keccak256(_buyer, _fv, _price, _nonce);
        require(orders[_buyer][orderId] >= _fvAmt);
        uint256 payment = _fvAmt * _price;
        require(payment <= accounts[_buyer].eth);

        orders[_buyer][orderId] -= _fvAmt;
        require(token.transferFrom(msg.sender, _buyer, _fvAmt));
        msg.sender.transfer(payment); // instead of accounts[msg.sender].eth += payment;
        emit Filled(orderId, _fvAmt);
    }
}
