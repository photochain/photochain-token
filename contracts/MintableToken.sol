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

    event Mint(address indexed to, uint256 amount);
    event MintFinished();

    modifier onlyMinting() {
        require(!mintingFinished);
        _;
    }

    /**
     * @dev Create tokens for given address
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     * @return A boolean that indicates if the operation was successful.
     */
    function mint(address to, uint256 amount)
        onlyOwner
        onlyMinting
        public
        returns (bool)
    {
        totalSupply = totalSupply.add(amount);
        balanceOf[to] = balanceOf[to].add(amount);

        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);

        return true;
    }

    /**
     * @dev Function to stop minting new tokens.
     * @return True if the operation was successful.
     */
    function finishMinting()
        onlyOwner
        onlyMinting
        public
        returns (bool)
    {
        mintingFinished = true;

        emit MintFinished();

        return true;
    }
}
