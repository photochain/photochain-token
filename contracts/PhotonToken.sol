pragma solidity ^0.4.21;

import { Ownable } from "./Ownable.sol";
import { StandardToken } from "./StandardToken.sol";


contract PhotonToken is Ownable, StandardToken {
    string public name = "Photon";
    string public symbol = "PHT";
    uint256 public decimals = 18;
}
