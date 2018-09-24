pragma solidity 0.4.24;

import { MintableToken } from "./MintableToken.sol";


contract PhotochainTestToken is MintableToken {
    string public name = "PhotochainTestToken";
    string public symbol = "PHTT";
    uint256 public decimals = 18;
    uint256 public maximumSupply = 10**6 * 10**6 * 10**decimals;

    // solhint-disable-next-line no-empty-blocks
    constructor() public MintableToken(maximumSupply) {}
}
