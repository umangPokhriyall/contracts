// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import "../src/CrowdfundingFactory.sol";
import "../src/Crowdfunding.sol";

contract CrowdfundingFactoryTest is Test {
    CrowdfundingFactory factory;

    function setUp() public {
        // Deploy the factory contract
        factory = new CrowdfundingFactory();
    }

    function testCreateCampaign() public {
        // Define campaign parameters
        string memory name = "Test Campaign";
        string memory description = "This is a test campaign";
        uint256 target = 1 ether;
        uint256 deadline = block.timestamp + 7 days;
        uint256 withdrawalLimit = 0.1 ether;
        string[] memory milestones = new string[](2);
        milestones[0] = "Milestone 1";
        milestones[1] = "Milestone 2";

        // Create a campaign
        vm.prank(address(1)); // Simulate a different user
        factory.createCampaign(
            name,
            description,
            target,
            deadline,
            withdrawalLimit,
            milestones
        );

        // Assert event emitted
        // NOTE: Use `forge test` with `-vvvv` to see emitted events during testing.
    }
}
