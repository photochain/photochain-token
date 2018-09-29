pragma solidity 0.4.24;

import { MintableToken } from "./MintableToken.sol";


contract PhotochainToken is MintableToken {
    string public name = "PhotochainToken";
    string public symbol = "PHT";
    uint256 public decimals = 18;
    uint256 public cap = 120 * 10**6 * 10**decimals;

    // solhint-disable-next-line no-empty-blocks
    constructor() public MintableToken(cap) {}
}
