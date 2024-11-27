// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract Crowdfunding is Initializable {
    struct Milestone {
        string description;
        uint256 votes;
        bool completed;
        bool withdrawalRequested;
    }

    string public name;
    string public description;
    uint256 public target;
    uint256 public deadline;
    uint256 public withdrawalLimit;
    uint256 public amountRaised;
    uint256 public totalContributions;

    Milestone[] public milestones;
    mapping(address => uint256) public contributions;
    address[] private contributorList;
    address public fundraiser;
    bool public campaignEnded;
    uint256 public majority;

    modifier onlyFundraiser() {
        require(
            msg.sender == fundraiser,
            "Only fundraiser can perform this action"
        );
        _;
    }

    modifier campaignActive() {
        require(block.timestamp < deadline, "Campaign has ended");
        require(!campaignEnded, "Campaign has been closed");
        _;
    }

    modifier milestoneExists(uint256 index) {
        require(index < milestones.length, "Milestone does not exist");
        _;
    }

    event ContributionMade(address indexed contributor, uint256 amount);
    event VoteCasted(
        address indexed voter,
        uint256 milestoneIndex,
        uint256 votes
    );
    event FundsReleased(uint256 milestoneIndex, uint256 amount);
    event CampaignEnded(bool successful);
    event RefundIssued(address indexed contributor, uint256 amount);
    event FundsRequested(uint256 milestoneIndex);

    function initialize(
        string memory _name,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        uint256 _withdrawalLimit,
        string[] memory milestoneDescriptions,
        address _fundraiser
    ) external initializer {
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_target > 0, "Target amount must be greater than zero");
        require(
            _withdrawalLimit > 0,
            "Withdrawal limit must be greater than zero"
        );

        name = _name;
        description = _description;
        target = _target;
        deadline = _deadline;
        withdrawalLimit = _withdrawalLimit;
        fundraiser = _fundraiser;

        for (uint256 i = 0; i < milestoneDescriptions.length; i++) {
            milestones.push(
                Milestone(milestoneDescriptions[i], 0, false, false)
            );
        }
    }

    function contribute() external payable campaignActive {
        require(msg.value > 0, "Contribution must be greater than zero");

        if (contributions[msg.sender] == 0) {
            contributorList.push(msg.sender);
        }

        contributions[msg.sender] += msg.value;
        totalContributions++;
        amountRaised += msg.value;
        majority = (amountRaised * 51) / 100;

        emit ContributionMade(msg.sender, msg.value);
    }

    function requestWithdrawalForMilestone(
        uint256 index
    ) external onlyFundraiser milestoneExists(index) {
        require(!milestones[index].completed, "Milestone already completed");
        milestones[index].withdrawalRequested = true;
        emit FundsRequested(index);
    }

    function voteOnMilestone(uint256 index) external milestoneExists(index) {
        require(contributions[msg.sender] > 0, "Only contributors can vote");
        require(!milestones[index].completed, "Milestone already completed");
        require(
            milestones[index].withdrawalRequested,
            "Withdrawal not requested"
        );

        milestones[index].votes += contributions[msg.sender];
        emit VoteCasted(msg.sender, index, contributions[msg.sender]);
    }

    function releaseFunds(
        uint256 index
    ) external onlyFundraiser milestoneExists(index) {
        require(!milestones[index].completed, "Milestone already completed");
        require(
            milestones[index].votes >= majority,
            "Majority approval not reached"
        );
        require(
            address(this).balance >= withdrawalLimit,
            "Not enough funds available"
        );

        milestones[index].completed = true;
        payable(fundraiser).transfer(withdrawalLimit);

        emit FundsReleased(index, withdrawalLimit);
    }

    function endCampaign() external onlyFundraiser {
        require(
            block.timestamp >= deadline || amountRaised >= target,
            "Cannot end campaign yet"
        );
        campaignEnded = true;
        emit CampaignEnded(amountRaised >= target);
    }

    function requestRefund() external {
        require(campaignEnded, "Campaign must be ended to request refund");
        require(
            amountRaised < target,
            "Refunds not available for successful campaigns"
        );

        uint256 contributedAmount = contributions[msg.sender];
        require(contributedAmount > 0, "No contributions to refund");

        contributions[msg.sender] = 0;
        payable(msg.sender).transfer(contributedAmount);

        emit RefundIssued(msg.sender, contributedAmount);
    }

    function getMilestones() external view returns (Milestone[] memory) {
        return milestones;
    }

    function getContributors() external view returns (address[] memory) {
        return contributorList;
    }
}
