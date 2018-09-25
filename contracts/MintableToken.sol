pragma solidity 0.4.24;

import "./StandardToken.sol";
import "./Ownable.sol";


/**
 * @title Mintable token
 * @dev Standard token with minting
 * @dev Based on https://github.com/OpenZeppelin/zeppelin-solidity
 */
contract MintableToken is StandardToken, Ownable {
    bool public mintingFinished;
    uint256 public maximumSupply;

    event Mint(address indexed to, uint256 amount);
    event MintFinished();

    modifier onlyMinting() {
        require(!mintingFinished, "Minting is already finished");
        _;
    }

    modifier onlyNotExceedingMaximumSupply(uint256 amount) {
        require(_totalSupply.add(amount) <= maximumSupply, "Total supply must not exceed maximum supply");
        _;
    }

    constructor(uint256 _maximumSupply) public {
        maximumSupply = _maximumSupply;
    }

    /**
     * @dev Creates new tokens for the given address
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     * @return A boolean that indicates if the operation was successful.
     */
    function mint(address to, uint256 amount)
        public
        onlyOwner
        onlyMinting
        onlyValidAddress(to)
        onlyNotExceedingMaximumSupply(amount)
        returns (bool)
    {
        mintImpl(to, amount);

        return true;
    }

    /**
     * @dev Creates new tokens for the given addresses
     * @param addresses The array of addresses that will receive the minted tokens.
     * @param amounts The array of amounts of tokens to mint.
     * @return A boolean that indicates if the operation was successful.
     */
    function mintMany(address[] addresses, uint256[] amounts)
        public
        onlyOwner
        onlyMinting
        onlyNotExceedingMaximumSupply(sum(amounts))
        returns (bool)
    {
        require(
            addresses.length == amounts.length,
            "Addresses array must be the same size as amounts array"
        );

        for (uint256 i = 0; i < addresses.length; i++) {
            require(addresses[i] != address(0), "Address cannot be zero");
            mintImpl(addresses[i], amounts[i]);
        }

        return true;
    }

    /**
     * @dev Stops minting new tokens.
     * @return True if the operation was successful.
     */
    function finishMinting()
        public
        onlyOwner
        onlyMinting
        returns (bool)
    {
        mintingFinished = true;

        emit MintFinished();

        return true;
    }

    function mintImpl(address to, uint256 amount) private {
        _totalSupply = _totalSupply.add(amount);
        _balanceOf[to] = _balanceOf[to].add(amount);

        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);
    }

    function sum(uint256[] arr) private returns (uint256) {
        uint256 aggr = 0;
        for (uint256 i = 0; i < arr.length; i++) {
            aggr = aggr.add(arr[i]);
        }
        return aggr;
    }
}
