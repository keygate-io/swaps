import { useEffect, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { WalletOptions } from "./WalletOptions";
import { convertQuoteToRoute, executeRoute, getQuote, updateRouteExecution } from "@lifi/sdk";
import { CircleDollarSign } from "lucide-react";

function ConnectWallet() {
  return (
    <>
      <p>Connect your wallet to purchase this item.</p>
      <WalletOptions />
    </>
  );
}

function DisplayQuote() {
  const { address } = useAccount();
  const [quote, setQuote] = useState<any>(null);
  const { writeContract } = useWriteContract();
  
  useEffect(() => {
    // TODO: make sure toAmount is equivalent to 1 ICP (price equivalency needed - value received by the seller should be equal to 1 ICP)

    if (address) {
      getQuote({
        fromChain: 'OPT',
        toChain: 'POL',
        fromToken: 'USDC',
        toToken: 'USDC',
        fromAmount: '7',
        fromAddress: address
      })
        .then(setQuote)
        .catch(console.error);
    }
  }, [address]);

  useEffect(() => {
    console.log(quote);
  }, [quote]);

  async function confirm() {
    if (quote) {
        const route = convertQuoteToRoute(quote);
        const executedRoute = await executeRoute(route, {
            updateRouteHook: (route) => {
                console.log(route);
            }
        });
        
        console.log(executedRoute);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div>Press confirm to pay using USDC on Optimism.</div>
      </div>
      <div className="flex flex-row gap-2">
        <CircleDollarSign />
        { quote ? <div>{quote.estimate.fromAmount} USDC</div> : <div>Fetching quote...</div>}
      </div>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 hover:cursor-pointer"
        onClick={confirm}
      >
        Confirm
      </button>
    </>
  );
}

export function PurchaseButton() {
  const { isConnected } = useAccount();
  const [step, setStep] = useState<"start" | "connect" | "purchase">("start");

  useEffect(() => {
    if (isConnected) {
      setStep("purchase");
    }
  }, [isConnected]);

  switch (step) {
    case "start":
      return (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 hover:cursor-pointer"
          onClick={() => setStep("connect")}
        >
          Purchase
        </button>
      );
    case "connect":
      return <ConnectWallet />;
    case "purchase":
      return <DisplayQuote />;
  }

  return;
}
