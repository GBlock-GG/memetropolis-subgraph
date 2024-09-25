import { Bytes, BigInt, ethereum, log } from "@graphprotocol/graph-ts";

import {
  GENESIS_ADDRESS,
  BIGINT_ZERO,
  BIGINT_ONE,
  DEFAULT_DECIMALS,
} from "./common/constants";

import { ERC20, Transfer } from "../generated/templates/StandardToken/ERC20";
import { Token, TransferEvent } from "../generated/schema";
import { decreaseAccountBalance, getOrCreateAccount, getOrCreateAccountBalance, increaseAccountBalance, isNewAccount } from "./account";

export function handleTransfer(event: Transfer): void {
  let token = Token.load(Bytes.fromHexString(event.address.toHex()));

  if (token != null) {
    if (token.name == "") {
      let erc20 = ERC20.bind(event.address);
      let tokenName = erc20.try_name();
      let tokenSymbol = erc20.try_symbol();
      let tokenDecimals = erc20.try_decimals();

      token.name = tokenName.reverted ? "" : tokenName.value;
      token.symbol = tokenSymbol.reverted ? "" : tokenSymbol.value;
      token.decimals = tokenDecimals.reverted
        ? DEFAULT_DECIMALS
        : tokenDecimals.value;
      token.totalSupply = BIGINT_ZERO;
    }

    if (event.params.value == BIGINT_ZERO) {
      return;
    }
    let amount = event.params.value;

    let isBurn = event.params.to.toHex() == GENESIS_ADDRESS;
    let isMint = event.params.from.toHex() == GENESIS_ADDRESS;
    let isTransfer = !isBurn && !isMint;
    let isEventProcessed = false;

    if (isBurn) {
      isEventProcessed = handleBurnEvent(
        token,
        amount,
        event.params.from,
        event
      );
    } else if (isMint) {
      isEventProcessed = handleMintEvent(token, amount, event.params.to, event);
    } else {
      // In this case, it will be a normal transfer event.
      handleTransferEvent(
        token,
        amount,
        event.params.from,
        event.params.to,
        event
      );
    }

    // Updates balances of accounts
    if (isEventProcessed) {
      return;
    }
    if (isTransfer || isBurn) {
      let sourceAccount = getOrCreateAccount(event.params.from);

      let accountBalance = decreaseAccountBalance(
        sourceAccount,
        token as Token,
        amount
      );
      accountBalance.blockNumber = event.block.number;
      accountBalance.timestamp = event.block.timestamp;

      sourceAccount.save();
      accountBalance.save();

      // To provide information about evolution of account balances
      // updateAccountBalanceDailySnapshot(accountBalance, event);
    }

    if (isTransfer || isMint) {
      let destinationAccount = getOrCreateAccount(event.params.to);

      let accountBalance = increaseAccountBalance(
        destinationAccount,
        token as Token,
        amount
      );
      accountBalance.blockNumber = event.block.number;
      accountBalance.timestamp = event.block.timestamp;

      destinationAccount.save();
      accountBalance.save();

      // To provide information about evolution of account balances
      // updateAccountBalanceDailySnapshot(accountBalance, event);
    }
  }
}

function handleBurnEvent(
  token: Token | null,
  amount: BigInt,
  burner: Bytes,
  event: ethereum.Event
): boolean {
  // Track total supply/burned
  if (token != null) {
    let totalSupply = ERC20.bind(event.address).try_totalSupply();
    let currentTotalSupply = totalSupply.reverted
      ? token.totalSupply
      : totalSupply.value;
    //If the totalSupply from contract call equals with the totalSupply stored in token entity, it means the burn event was process before.
    //It happens when the transfer function which transfers to GENESIS_ADDRESS emits both transfer event and burn event.
    if (currentTotalSupply == token.totalSupply) {
      return true;
    }
    token.totalSupply = token.totalSupply.minus(amount);
    token.burnCount = token.burnCount.plus(BIGINT_ONE);
    token.totalBurned = token.totalBurned.plus(amount);

    token.save();
  }
  return false;
}

function handleMintEvent(
  token: Token | null,
  amount: BigInt,
  destination: Bytes,
  event: ethereum.Event
): boolean {
  // Track total token supply/minted
  if (token != null) {
    let totalSupply = ERC20.bind(event.address).try_totalSupply();
    let currentTotalSupply = totalSupply.reverted
      ? token.totalSupply
      : totalSupply.value;
    //If the totalSupply from contract call equals with the totalSupply stored in token entity, it means the mint event was process before.
    //It happens when the transfer function which transfers from GENESIS_ADDRESS emits both transfer event and mint event.
    if (currentTotalSupply == token.totalSupply) {
      return true;
    }
    token.totalSupply = token.totalSupply.plus(amount);

    token.mintCount = token.mintCount.plus(BIGINT_ONE);
    token.totalMinted = token.totalMinted.plus(amount);

    token.save();
  }
  return false;
}

function handleTransferEvent(
  token: Token | null,
  amount: BigInt,
  source: Bytes,
  destination: Bytes,
  event: ethereum.Event
): void {
  let transferEvent = new TransferEvent(
    Bytes.fromHexString(event.address.toHex()).concat(Bytes.fromUTF8("-")).concat(Bytes.fromHexString(event.transaction.hash.toHex())).concatI32(event.logIndex.toI32())
  );
  transferEvent.hash = event.transaction.hash.toHex();
  transferEvent.logIndex = event.logIndex.toI32();
  transferEvent.token = Bytes.fromHexString(event.address.toHex());
  transferEvent.nonce = event.transaction.nonce.toI32();
  transferEvent.amount = amount;
  transferEvent.to = destination;
  transferEvent.from = source;
  transferEvent.blockNumber = event.block.number;
  transferEvent.timestamp = event.block.timestamp;

  transferEvent.save();

  // Track total token transferred
  if (token != null) {
    let FromBalanceToZeroNum = BIGINT_ZERO;
    let balance = getOrCreateAccountBalance(getOrCreateAccount(source), token);
    if (balance.amount == amount) {
      // It means the sender's token balance will be 0 after transferal.
      FromBalanceToZeroNum = BIGINT_ONE;
    }

    let toAddressIsNewHolderNum = BIGINT_ZERO;
    let toBalanceIsZeroNum = BIGINT_ZERO;
    if (isNewAccount(destination)) {
      // It means the receiver is a new holder
      toAddressIsNewHolderNum = BIGINT_ONE;
    } else {
      balance = getOrCreateAccountBalance(
        getOrCreateAccount(destination),
        token
      );
      if (balance.amount == BIGINT_ONE) {
        // It means the receiver's token balance is 0 before transferal.
        toBalanceIsZeroNum = BIGINT_ONE;
      }
    }

    token.currentHolderCount = token.currentHolderCount
      .minus(FromBalanceToZeroNum)
      .plus(toAddressIsNewHolderNum)
      .plus(toBalanceIsZeroNum);
    token.cumulativeHolderCount = token.cumulativeHolderCount.plus(
      toAddressIsNewHolderNum
    );
    token.transferCount = token.transferCount.plus(BIGINT_ONE);

    token.save();
  }

  // return transferEvent;
}
