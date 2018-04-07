pragma solidity ^0.4.21;

import { MintableToken } from "./MintableToken.sol";


contract PhotonToken is MintableToken {
    string public name = "Photon";
    string public symbol = "PHT";
    uint256 public decimals = 18;
}
