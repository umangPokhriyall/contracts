// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./Crowdfunding.sol";
import "./CloneFactory.sol";

contract CrowdfundingFactory is CloneFactory {
    address public implementation;

    address[] public campaigns;
    mapping(address => address[]) public campaignsByFundraiser;

    event CampaignCreated(
        address indexed fundraiser,
        address indexed campaignAddress,
        string name,
        string description,
        uint256 target,
        uint256 deadline,
        string[] milestoneDescriptions
    );

    constructor(address _implementation) {
        implementation = _implementation;
    }

    function createCampaign(
        string memory _name,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        uint256 _withdrawalLimit,
        string[] memory milestoneDescriptions
    ) external {
        require(_target > 0, "Target must be greater than zero");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        Crowdfunding newCampaign = Crowdfunding(createClone(implementation));
        newCampaign.initialize(
            _name,
            _description,
            _target,
            _deadline,
            _withdrawalLimit,
            milestoneDescriptions,
            msg.sender
        );

        campaigns.push(address(newCampaign));
        campaignsByFundraiser[msg.sender].push(address(newCampaign));

        emit CampaignCreated(
            msg.sender,
            address(newCampaign),
            _name,
            _description,
            _target,
            _deadline,
            milestoneDescriptions
        );
    }

    function getAllCampaigns() external view returns (address[] memory) {
        return campaigns;
    }

    function getCampaignsByFundraiser(
        address _fundraiser
    ) external view returns (address[] memory) {
        return campaignsByFundraiser[_fundraiser];
    }
}
