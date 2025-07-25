"use client";

import { ethers } from "ethers";
import { Principal } from "@dfinity/principal";
import { pad } from "viem";
import { principalToBytes32 } from "./utils";
import { CKUSDC_HELPER_ABI, ERC20_APPROVE_ABI } from "./constants";

const helperIface = new ethers.Interface(CKUSDC_HELPER_ABI);
const erc20Iface = new ethers.Interface(ERC20_APPROVE_ABI);

/**
 * Encodes the call data for depositEth(principal, subaccount)
 * @param principalText Principal as string (e.g., from Principal.toText())
 * @returns ABI-encoded call data string
 */
export function encodeDepositEthCallData(principalText: string): string {
  // Use the new principalToBytes32 encoding
  const principalBytes32 = principalToBytes32(principalText);
  const subaccount = "0x" + "00".repeat(32);
  return helperIface.encodeFunctionData("depositEth", [
    principalBytes32,
    subaccount,
  ]);
}

export function encodeDepositERC20CallData(
  tokenAddress: string,
  amount: string,
  principalText: string
): string {
  const principalBytes32 = principalToBytes32(principalText);
  const subaccount = "0x" + "00".repeat(32);
  return helperIface.encodeFunctionData("depositErc20", [
    tokenAddress,
    amount,
    principalBytes32,
    subaccount,
  ]);
}

export function encodeApproveCallData(spender: string, amount: string): string {
  return erc20Iface.encodeFunctionData("approve", [spender, amount]);
}