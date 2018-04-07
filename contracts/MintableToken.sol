pragma solidity ^0.4.21;

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
        require(!mintingFinished);
        _;
    }

    modifier onlyNotExceedingMaximumSupply(uint256 amount) {
        require(_totalSupply.add(amount) <= maximumSupply);
        _;
    }

    function MintableToken(uint256 _maximumSupply) public {
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
        onlyNotExceedingMaximumSupply(amount)
        returns (bool)
    {
        _totalSupply = _totalSupply.add(amount);
        _balanceOf[to] = _balanceOf[to].add(amount);

        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);

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
}
