"use client";

import { ethers } from "ethers";
import { Principal } from "@dfinity/principal";
import { pad } from "viem";

// ABI fragment for the depositEth function
const helperAbi = [
  "function depositEth(bytes32 principal, bytes32 subaccount) payable",
  "function depositERC20(address token, uint256 amount, bytes32 principal, bytes32 subaccount) payable"
];

const erc20Abi = [
    "function approve(address spender, uint256 amount) returns (bool)"
]

const helperIface = new ethers.Interface(helperAbi);
const erc20Iface = new ethers.Interface(erc20Abi);

/**
 * Encodes the call data for depositEth(principal, subaccount)
 * @param principalText Principal as string (e.g., from Principal.toText())
 * @returns ABI-encoded call data string
 */
export function encodeDepositEthCallData(principalText: string): string {
  // Convert principal string to bytes
  const principal = Principal.fromText(principalText);
  const principalBytes = principal.toUint8Array();
  const principalBytes32 = pad(principalBytes);
  const subaccount = new Uint8Array(32);
  return helperIface.encodeFunctionData("depositEth", [principalBytes32, subaccount]);
}

export function encodeDepositERC20CallData(tokenAddress: string, amount: string, principalText: string): string {
  const principal = Principal.fromText(principalText);
  const principalBytes = principal.toUint8Array();
  const principalBytes32 = pad(principalBytes);
  const subaccount = new Uint8Array(32);
  return helperIface.encodeFunctionData("depositERC20", [tokenAddress, amount, principalBytes32, subaccount]);
}

export function encodeApproveCallData(spender: string, amount: string): string {
  return erc20Iface.encodeFunctionData("approve", [spender, amount]);
}