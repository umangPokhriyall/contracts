import { CampaignCreated as CampaignCreatedEvent } from "../generated/CrowdfundingFactory/CrowdfundingFactory";
import { Campaign, Milestone } from "../generated/schema";
import { Crowdfunding } from "../generated/templates";
import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";

export function handleCampaignCreated(event: CampaignCreatedEvent): void {
  // Create the Campaign entity
  let campaign = new Campaign(event.params.campaignAddress);
  campaign.fundraiser = event.params.fundraiser;
  campaign.name = event.params.name;
  campaign.description = event.params.description;
  campaign.target = event.params.target;
  campaign.deadline = event.params.deadline;
  campaign.createdAtBlockNumber = event.block.number;
  campaign.createdAtTimestamp = event.block.timestamp;
  campaign.createdAtTransactionHash = event.transaction.hash;
  campaign.amountRaised = BigInt.fromI32(0);
  campaign.progress = BigDecimal.fromString("0");
  campaign.contributors = [];
  campaign.contributorsCount = BigInt.fromI32(0);

  // Save the campaign before milestones to get the campaign id
  campaign.save();

  // Store milestones from event params
  for (let i = 0; i < event.params.milestoneDescriptions.length; i++) {
    let milestoneId = event.params.campaignAddress.concatI32(i);

    let milestone = new Milestone(milestoneId)
    milestone.campaign = campaign.id
    milestone.description = event.params.milestoneDescriptions[i]
    milestone.votes = BigInt.fromI32(0)
    milestone.completed = false
    milestone.withdrawalRequested = false

    milestone.save()
  }
  Crowdfunding.create(event.params.campaignAddress);
}