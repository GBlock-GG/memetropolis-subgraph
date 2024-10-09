import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import {
  CreatedMemeToken,
  BoughtMemeToken,
  SoldMemeToken, BoughtCrosschainMemeToken, SoldCrosschainMemeToken,
} from "../generated/TokenFactory/TokenFactory";
import { PurchaseHistory, Token } from "../generated/schema";
import { BIGINT_ZERO, DEFAULT_DECIMALS } from "./common/constants";
import {
StandardToken,
} from "../generated/templates";
  
export function handleCreatedMemeToken(event: CreatedMemeToken): void {
  // Persist token data if it didn't exist
  let token = Token.load(Bytes.fromHexString(event.params.tokenAddress.toHex()));
  if (token == null) {
    token = new Token(Bytes.fromHexString(event.params.tokenAddress.toHex()));
    token.name = event.params.name;
    token.symbol = event.params.symbol;
    token.decimals = DEFAULT_DECIMALS;

    token.currentHolderCount = BIGINT_ZERO;
    token.cumulativeHolderCount = BIGINT_ZERO;
    token.transferCount = BIGINT_ZERO;
    token.mintCount = BIGINT_ZERO;
    token.burnCount = BIGINT_ZERO;
    token.totalSupply = BIGINT_ZERO;
    token.totalBurned = BIGINT_ZERO;
    token.totalMinted = BIGINT_ZERO;
    token.timestamp = event.block.timestamp;

    log.debug("Adding token to registry, symbol: {}, address: {}", [
      token.symbol,
      token.id.toHexString(),
    ]);

    token.save();

    // Start indexing token events
    StandardToken.create(event.params.tokenAddress);
  } else {
    log.warning("Token {} already in registry", [event.params.tokenAddress.toHex()]);
  }
}

export function handleBoughtMemeToken(event: BoughtMemeToken): void {
    let token = Token.load(Bytes.fromHexString(event.params.memeTokenAddress.toHex()));
    if (token != null) {
      const purchaseHistory = new PurchaseHistory(
        Bytes.fromHexString(event.transaction.hash.toHex()).concatI32(event.logIndex.toI32())
      )

      purchaseHistory.token = token.id
      purchaseHistory.account = event.params.user
      purchaseHistory.amount = event.params.tokenQty
      purchaseHistory.type = "buy"
      purchaseHistory.eid = BigInt.fromI32(0)
      purchaseHistory.hash = event.transaction.hash.toHex()
      purchaseHistory.blockNumber = event.block.number
      purchaseHistory.timestamp = event.block.timestamp
      purchaseHistory.save()
    }
}

export function handleSoldMemeToken(event: SoldMemeToken): void {
  let token = Token.load(Bytes.fromHexString(event.params.memeTokenAddress.toHex()));
  if (token != null) {
    const purchaseHistory = new PurchaseHistory(
      Bytes.fromHexString(event.transaction.hash.toHex()).concatI32(event.logIndex.toI32())
    )

    purchaseHistory.token = token.id
    purchaseHistory.account = event.params.user
    purchaseHistory.amount = event.params.tokenQty
    purchaseHistory.type = "sell"
    purchaseHistory.eid = BigInt.fromI32(0)
    purchaseHistory.hash = event.transaction.hash.toHex()
    purchaseHistory.blockNumber = event.block.number
    purchaseHistory.timestamp = event.block.timestamp
    purchaseHistory.save()
  }
}

export function handleBoughtCrosschainMemeToken(event: BoughtCrosschainMemeToken): void {
  let token = Token.load(Bytes.fromHexString(event.params.memeTokenAddress.toHex()));
  if (token != null) {
    const purchaseHistory = new PurchaseHistory(
      Bytes.fromHexString(event.transaction.hash.toHex()).concatI32(event.logIndex.toI32())
    )

    purchaseHistory.token = token.id
    purchaseHistory.account = event.params.user
    purchaseHistory.amount = event.params.tokenQty
    purchaseHistory.type = "buy"
    purchaseHistory.eid = event.params.srcEid
    purchaseHistory.hash = event.transaction.hash.toHex()
    purchaseHistory.blockNumber = event.block.number
    purchaseHistory.timestamp = event.block.timestamp
    purchaseHistory.save()
  }
}

export function handleSoldCrosschainMemeToken(event: SoldCrosschainMemeToken): void {
  let token = Token.load(Bytes.fromHexString(event.params.memeTokenAddress.toHex()));
  if (token != null) {
    const purchaseHistory = new PurchaseHistory(
      Bytes.fromHexString(event.transaction.hash.toHex()).concatI32(event.logIndex.toI32())
    )

    purchaseHistory.token = token.id
    purchaseHistory.account = event.params.user
    purchaseHistory.amount = event.params.tokenQty
    purchaseHistory.type = "sell"
    purchaseHistory.eid = event.params.srcEid
    purchaseHistory.hash = event.transaction.hash.toHex()
    purchaseHistory.blockNumber = event.block.number
    purchaseHistory.timestamp = event.block.timestamp
    purchaseHistory.save()
  }
}
