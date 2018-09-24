pragma solidity ^0.4.24;

import { MintableToken } from "./MintableToken.sol";


contract PhotochainTestToken is MintableToken {
    string public name = "PhotochainTestToken";
    string public symbol = "PHTT";
    uint256 public decimals = 18;
    uint256 public maximumSupply = 10**6 * 10**6 * 10**decimals;

    constructor()
        public
        MintableToken(maximumSupply)
    {
    }
}
