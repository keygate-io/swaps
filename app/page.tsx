"use client";

import { DebugWagmi } from "@/components/DebugWagmi";
import { PurchaseButton } from "@/components/PurchaseButton";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="flex flex-row gap-14">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl">Token</h2>
            <img src="/pepe.jpg" alt="Token" className="w-64 h-64" />
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl">Buy NFT</h2>
            <p className="text-4xl font-semibold">1 ICP</p>

            <PurchaseButton />
            <p className="text-sm text-gray-500">
              We accept crypto from 40+ blockchains, no manual bridging needed.
            </p>
          </div>
        </div>
        <DebugWagmi />
      </main>
    </div>
  );
}
