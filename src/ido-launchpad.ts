import {
  TokensPurchased as TokensPurchasedEvent,
  TokensClaimed as TokensClaimedEvent,
  FeesWithdrawn as FeesWithdrawnEvent,
} from "../generated/IDOLaunchpad/IDOLaunchpad"
import {
  TokensPurchased,
  TokensClaimed,
  FeesWithdrawn
} from "../generated/schema"

export function handleTokensPurchased(event: TokensPurchasedEvent): void {
  let entity = new TokensPurchased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.buyer = event.params.buyer
  entity.amount = event.params.amount
  entity.cost = event.params.cost

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTokensClaimed(
  event: TokensClaimedEvent
): void {
  let entity = new TokensClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.buyer = event.params.buyer
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFeesWithdrawn(event: FeesWithdrawnEvent): void {
  let entity = new FeesWithdrawn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.beneficiary = event.params.beneficiary
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}