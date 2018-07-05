pragma solidity ^0.4.24;

import { MintableToken } from "./MintableToken.sol";


contract PhotonToken is MintableToken {
    string public name = "PhotonToken";
    string public symbol = "PHT";
    uint256 public decimals = 18;
    uint256 public maximumSupply = 230 * 10**6 * 10**decimals;

    constructor()
        public
        MintableToken(maximumSupply)
    {
    }
}
