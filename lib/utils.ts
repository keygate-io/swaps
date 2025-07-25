import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { encodePrincipalToEthAddress } from "@dfinity/cketh";
import { Principal } from "@dfinity/principal";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a principal into a fixed 32-byte representation suitable for calling Ethereum smart contracts.
 * @param {string} text The textual representation of a principal.
 * @return {string} A 32-byte hex-encoded byte string (0x...)
 */
export function principalToBytes32(text: string): string {
  return encodePrincipalToEthAddress(Principal.fromText(text));
}