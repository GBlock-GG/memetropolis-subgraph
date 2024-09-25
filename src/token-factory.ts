import { Bytes, log } from "@graphprotocol/graph-ts";
import {
  CreatedMemeToken,
  BoughtMemeToken,
  SoldMemeToken,
  WithdrawnETH,
  WithdrawnToken,
} from "../generated/TokenFactory/TokenFactory";
import { Token } from "../generated/schema";
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

    }
}

export function handleSoldMemeToken(event: SoldMemeToken): void {
}

export function handleWithdrawnETH(event: WithdrawnETH): void {
}

export function handleWithdrawnToken(event: WithdrawnToken): void {
}
