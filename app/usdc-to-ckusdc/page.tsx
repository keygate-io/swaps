"use client";

import { PayWithKeygate } from "@/components/PayWithKeygate";
import { useState } from "react";
import Link from "next/link";

export default function UsdcToCkUsdcPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const usdcAmount = 1;

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Link href="/" className="mb-4 text-blue-500 hover:underline">
          ← Back to use cases
        </Link>
        <div className="flex flex-row gap-14">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl">Token</h2>
            <img src="/pepe.jpg" alt="Token" className="w-64 h-64" />
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl">Buy NFT</h2>
            <p className="text-4xl font-semibold">{usdcAmount} USDC</p>

            <PayWithKeygate
              value={usdcAmount}
              fromCurrency="ETH"
              toCurrency="USDC"
              onProcessingChange={setIsProcessing}
              disableToggle={isProcessing}
              destinationAddress="wtzxg-u3qsq-7drpw-3iytd-x4mv2-e53xw-e5xyy-g7577-dc6ky-266ly-qqe"
            />
            <p className="text-sm text-gray-500">
              We accept crypto from 40+ blockchains, no manual bridging needed.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 