pragma solidity ^0.4.21;

import { Ownable } from "./Ownable.sol";


contract Migrations is Ownable {
    /* solhint-disable var-name-mixedcase */
    /* solhint-disable func-param-name-mixedcase */

    uint public last_completed_migration;

    function setCompleted(uint completed) public onlyOwner {
        last_completed_migration = completed;
    }

    function upgrade(address new_address) public onlyOwner {
        Migrations upgraded = Migrations(new_address);
        upgraded.setCompleted(last_completed_migration);
    }
}
