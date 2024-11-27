// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/CrowdfundingFactory.sol";
import "../src/Crowdfunding.sol";

contract DeployFactory is Script {
    function run() external returns (Crowdfunding, CrowdfundingFactory) {
        // Retrieve private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcast with the private key
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Crowdfunding Implementation Contract
        Crowdfunding crowdfundingImplementation = new Crowdfunding();

        // Deploy CrowdfundingFactory with Implementation Address
        CrowdfundingFactory factory = new CrowdfundingFactory(
            address(crowdfundingImplementation)
        );

        // Stop broadcasting
        vm.stopBroadcast();

        return (crowdfundingImplementation, factory);
    }
}
