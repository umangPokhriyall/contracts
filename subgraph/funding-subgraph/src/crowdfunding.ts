import {
    CampaignEnded as CampaignEndedEvent,
    ContributionMade as ContributionMadeEvent,
    FundsReleased as FundsReleasedEvent,
    FundsRequested as FundsRequestedEvent,
    Initialized as InitializedEvent,
    RefundIssued as RefundIssuedEvent,
    VoteCasted as VoteCastedEvent
} from "../generated/templates/Crowdfunding/Crowdfunding"

import {
    Campaign,
    Milestone,
    CampaignEnded,
    ContributionMade,
    FundsReleased,
    FundsRequested,
    Initialized,
    RefundIssued,
    VoteCasted
} from "../generated/schema"
import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

// Handle CampaignEnded event
export function handleCampaignEnded(event: CampaignEndedEvent): void {
    let campaign = Campaign.load(event.address);
    if (!campaign) return;

    let entity = new CampaignEnded(event.transaction.hash.concatI32(event.logIndex.toI32()));
    entity.campaign = campaign.id; // Relate to Campaign
    entity.successful = event.params.successful;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;

    entity.save();
}

// Handle ContributionMade event
export function handleContributionMade(event: ContributionMadeEvent): void {
    let campaign = Campaign.load(event.address);
    if (!campaign) return;

    let entity = new ContributionMade(event.transaction.hash.concatI32(event.logIndex.toI32()));
    entity.campaign = campaign.id; // Relate to Campaign
    entity.contributor = event.params.contributor;
    entity.amount = event.params.amount;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;
    entity.save();

    let contributors = campaign.contributors || [];
    if (!contributors.includes(event.params.contributor)) {
        contributors.push(event.params.contributor);
        campaign.contributorsCount = (campaign.contributorsCount || BigInt.fromI32(0)).plus(BigInt.fromI32(1));
    }

    campaign.amountRaised = (campaign.amountRaised || BigInt.fromI32(0)).plus(event.params.amount);
    let bigDecimalHundred = BigDecimal.fromString("100");
    if (campaign.target != BigInt.fromI32(0)) {
        // Perform progress calculation
        campaign.progress = campaign.amountRaised
            .toBigDecimal()
            .times(bigDecimalHundred)
            .div(campaign.target.toBigDecimal());
    } else {
        // Set progress to 0 if target is 0
        campaign.progress = BigDecimal.fromString("0");
    }
    campaign.save();
}

// Handle FundsReleased event
export function handleFundsReleased(event: FundsReleasedEvent): void {
    let campaign = Campaign.load(event.address);
    if (!campaign) return;

    let entity = new FundsReleased(event.transaction.hash.concatI32(event.logIndex.toI32()));
    entity.campaign = campaign.id; // Relate to Campaign
    entity.milestoneIndex = event.params.milestoneIndex;
    entity.amount = event.params.amount;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;

    entity.save();
}

// Handle FundsRequested event
export function handleFundsRequested(event: FundsRequestedEvent): void {
    let campaign = Campaign.load(event.address);
    if (!campaign) return;

    let entity = new FundsRequested(event.transaction.hash.concatI32(event.logIndex.toI32()));
    entity.campaign = campaign.id; // Relate to Campaign
    entity.milestoneIndex = event.params.milestoneIndex;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;

    entity.save();

    let milestoneId = event.address.concatI32(event.params.milestoneIndex.toI32()); // Unique milestone ID
    let milestone = Milestone.load(milestoneId);

    if (!milestone) {
        // If the milestone doesn't exist, we can create it (optional, depending on your needs)
        milestone = new Milestone(milestoneId);
        milestone.campaign = campaign.id;
        milestone.description = "Milestone " + event.params.milestoneIndex.toString();
        milestone.votes = BigInt.fromI32(0); // Initialize votes to zero
        milestone.completed = false; // Initialize completed to false
        milestone.withdrawalRequested = true; // Withdrawal is requested when funds are requested
    } else {
        // Update the milestone's completed status when funds are requested
        milestone.completed = true; // Mark as completed when funds are requested
        milestone.withdrawalRequested = true; // Indicate that funds have been requested for this milestone
    }
    milestone.save();
}

// Handle Initialized event
export function handleInitialized(event: InitializedEvent): void {
    let campaign = Campaign.load(event.address);
    if (!campaign) return;

    let entity = new Initialized(event.transaction.hash.concatI32(event.logIndex.toI32()));
    entity.campaign = campaign.id; // Relate to Campaign
    entity.version = event.params.version;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;

    entity.save();
}

// Handle RefundIssued event
export function handleRefundIssued(event: RefundIssuedEvent): void {
    let campaign = Campaign.load(event.address);
    if (!campaign) return;

    let entity = new RefundIssued(event.transaction.hash.concatI32(event.logIndex.toI32()));
    entity.campaign = campaign.id; // Relate to Campaign
    entity.contributor = event.params.contributor;
    entity.amount = event.params.amount;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;

    entity.save();
}

// Handle VoteCasted event
export function handleVoteCasted(event: VoteCastedEvent): void {
    let campaign = Campaign.load(event.address);
    if (!campaign) return;

    let entity = new VoteCasted(event.transaction.hash.concatI32(event.logIndex.toI32()));
    entity.campaign = campaign.id; // Relate to Campaign
    entity.voter = event.params.voter;
    entity.milestoneIndex = event.params.milestoneIndex;
    entity.votes = event.params.votes;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;

    entity.save();

    let milestoneId = event.address.concatI32(event.params.milestoneIndex.toI32()); // Unique milestone ID
    let milestone = Milestone.load(milestoneId);

    if (!milestone) {
        // Create a new milestone if it doesn't exist
        milestone = new Milestone(milestoneId);
        milestone.campaign = campaign.id;
        milestone.description = "Milestone " + event.params.milestoneIndex.toString();
        milestone.votes = BigInt.fromI32(0);
        milestone.completed = false;
        milestone.withdrawalRequested = false;
    }

    // Increment votes for the milestone
    milestone.votes = milestone.votes.plus(event.params.votes);
    milestone.save();

}
