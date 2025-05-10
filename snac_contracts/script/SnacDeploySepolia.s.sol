// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Snac} from "../src/Snac.sol";
import {SnacTokenInVerifier} from "../src/SnacTokenInVerifier.sol";
import {SnacTokenOutVerifier} from "../src/SnacTokenOutVerifier.sol";

contract Deploy is Script {
    function setUp() public {}

    function run() public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);
        address snacTokenOutVerifier = address(new SnacTokenOutVerifier());
        address snacTokenInVerifier = address(new SnacTokenInVerifier());
        new Snac(snacTokenInVerifier, snacTokenOutVerifier, snacTokenInVerifier);
        vm.stopBroadcast();
    }
}
