"use client";

import { ethers, BrowserProvider } from "ethers";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState } from "react";
import { Principal } from "@dfinity/principal";
import { CKUSDC_HELPER_CONTRACT_ADDRESS, USDC_TOKEN_ADDRESS, ERC20_APPROVE_ABI, CKUSDC_HELPER_ABI } from "../../lib/constants";
import { principalToBytes32 } from "../../lib/utils";

export function TransactionTester() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [approveAmount, setApproveAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [principal, setPrincipal] = useState("");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [decodeInput, setDecodeInput] = useState("");
  const [decodedPrincipal, setDecodedPrincipal] = useState("");
  const [decodeError, setDecodeError] = useState("");

  async function handleApprove() {
    setError("");
    try {
      if (!window.ethereum) throw new Error("No wallet");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(USDC_TOKEN_ADDRESS, ERC20_APPROVE_ABI, signer);
      const tx = await contract.approve(CKUSDC_HELPER_CONTRACT_ADDRESS, approveAmount);
      setTxHash(tx.hash);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleDeposit() {
    setError("");
    try {
      if (!window.ethereum) throw new Error("No wallet");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CKUSDC_HELPER_CONTRACT_ADDRESS, CKUSDC_HELPER_ABI, signer); // always use helper contract
      const principalBytes32 = principalToBytes32(principal);
      const subaccountBytes32 = "0x" + "00".repeat(32);
      const tx = await contract.depositErc20(USDC_TOKEN_ADDRESS, depositAmount, principalBytes32, subaccountBytes32);
      setTxHash(tx.hash);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleDecodeBytestring() {
    setDecodeError("");
    setDecodedPrincipal("");
    try {
      let hex = decodeInput.trim();
      if (hex.startsWith("0x")) hex = hex.slice(2);
      if (hex.length !== 64) throw new Error("Input must be 32 bytes (64 hex chars)");
      // Remove leading zeros for Principal decoding
      let bytes = Buffer.from(hex, "hex");
      // Remove leading zeros (Principal is variable length)
      let firstNonZero = bytes.findIndex(b => b !== 0);
      if (firstNonZero === -1) throw new Error("No nonzero bytes found");
      let principalBytes = bytes.slice(firstNonZero);
      const principal = Principal.fromUint8Array(principalBytes);
      setDecodedPrincipal(principal.toText());
    } catch (e) {
      setDecodeError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="p-4 border rounded flex flex-col gap-4">
      <h2 className="text-lg font-bold">Transaction Tester</h2>
      {!isConnected ? (
        <div>
          <div>Connect your wallet:</div>
          {connectors.map((connector) => (
            <button key={connector.id} onClick={() => connect({ connector })} className="bg-blue-500 text-white px-4 py-2 rounded m-2">
              {connector.name}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div>Connected as: {address}</div>
          <button onClick={() => disconnect()} className="bg-red-500 text-white px-2 py-1 rounded">Disconnect</button>
          <div className="mt-4">
            <h3 className="font-semibold">Approve ERC20</h3>
            <div className="border p-1 m-1 bg-gray-100 text-gray-700 rounded">
              Token address: {USDC_TOKEN_ADDRESS}
            </div>
            <div className="border p-1 m-1 bg-gray-100 text-gray-700 rounded">
              Spender address: {CKUSDC_HELPER_CONTRACT_ADDRESS}
            </div>
            <input placeholder="Amount" value={approveAmount} onChange={e => setApproveAmount(e.target.value)} className="border p-1 m-1" />
            <button onClick={handleApprove} className="bg-green-500 text-white px-2 py-1 rounded m-1">Approve</button>
          </div>
          <div className="mt-4">
            <h3 className="font-semibold">Deposit ERC20</h3>
            <div className="border p-1 m-1 bg-gray-100 text-gray-700 rounded">
              Helper contract address: {CKUSDC_HELPER_CONTRACT_ADDRESS}
            </div>
            <div className="border p-1 m-1 bg-gray-100 text-gray-700 rounded">
              Token address: {USDC_TOKEN_ADDRESS}
            </div>
            <input placeholder="Amount" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="border p-1 m-1" />
            <input placeholder="Principal (bytes32)" value={principal} onChange={e => setPrincipal(e.target.value)} className="border p-1 m-1" />
            <button onClick={handleDeposit} className="bg-green-500 text-white px-2 py-1 rounded m-1">Deposit</button>
          </div>
          {txHash && <div className="text-green-700">Tx sent: {txHash}</div>}
          {error && <div className="text-red-700">Error: {error}</div>}

          {/* Decode Bytestring Section */}
          <div className="mt-8">
            <h3 className="font-semibold">Decode Bytestring</h3>
            <input
              placeholder="Bytes32 hex (e.g. 000000...e2102)"
              value={decodeInput}
              onChange={e => setDecodeInput(e.target.value)}
              className="border p-1 m-1 w-full"
            />
            <button
              onClick={handleDecodeBytestring}
              className="bg-blue-500 text-white px-2 py-1 rounded m-1"
            >
              Decode
            </button>
            {decodedPrincipal && (
              <div className="text-green-700 break-all">Principal: {decodedPrincipal}</div>
            )}
            {decodeError && (
              <div className="text-red-700">Error: {decodeError}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}