import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAccount } from "wagmi";
import { WalletOptions } from "./WalletOptions";
import {
  convertQuoteToRoute,
  executeRoute,
  getQuote,
  getActiveRoutes,
  LiFiStepExtended,
  getContractCallsQuote,
} from "@lifi/sdk";
import {
  CircleDollarSign,
  Loader,
  AlertCircle,
  XCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import {
  encodeDepositERC20CallData,
  encodeApproveCallData,
} from "../lib/encodeCallData";
import {
  USDC_TOKEN_ADDRESS,
  CKUSDC_HELPER_CONTRACT_ADDRESS,
} from "../lib/constants";

function ConnectWallet() {
  return (
    <>
      <p>Connect your wallet to purchase this item.</p>
      <WalletOptions />
    </>
  );
}

interface ActiveRoute {
  routeId: string;
  startedAt: number;
  status: string;
}

type LifiSteps = LiFiStepExtended[];

interface PurchaseButtonProps {
  value: string | number;
  currency?: string;
  onProcessingChange?: (processing: boolean) => void;
  disableToggle?: boolean;
  destinationAddress: string;
}

export function PurchaseButton({
  value,
  currency = "ICP",
  destinationAddress,
  onProcessingChange,
  disableToggle,
}: PurchaseButtonProps) {
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
      return (
        <DisplayQuote
          value={value}
          currency={currency}
          onProcessingChange={onProcessingChange}
          disableToggle={disableToggle}
          destinationAddress={destinationAddress}
        />
      );
  }

  return;
}

type DisplayQuoteProps = {
  value: string | number;
  currency: string;
  destinationAddress: string;
  onProcessingChange?: (processing: boolean) => void;
  disableToggle?: boolean;
};

function DisplayQuote({
  value,
  currency,
  destinationAddress,
  onProcessingChange,
  disableToggle,
}: DisplayQuoteProps) {
  const { address } = useAccount();
  const [quote, setQuote] = useState<any>(null);
  const [steps, setSteps] = useState<LifiSteps | null>(null);
  const [timers, setTimers] = useState<{ [stepId: string]: number }>({});
  const [desiredTokenPrice, setDesiredTokenPrice] = useState<number | null>(
    null
  );
  const [usdcNeeded, setUsdcNeeded] = useState<string>("1"); // default to 1 USDC for fallback
  const [activeRoutes, setActiveRoutes] = useState<any[]>([]);

  // Use refs to avoid unnecessary rerenders
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize the USDC calculation to avoid recalculating on every render
  const calculatedUsdcNeeded = useMemo(() => {
    if (currency === "ICP" && desiredTokenPrice) {
      const total = Number(value) * desiredTokenPrice;
      return Math.round(total * 1_000_000).toString();
    }
    return "1";
  }, [currency, desiredTokenPrice, value]);

  // Update usdcNeeded when calculation changes
  useEffect(() => {
    setUsdcNeeded(calculatedUsdcNeeded);
  }, [calculatedUsdcNeeded]);

  // Fetch active routes only once when quote is available
  useEffect(() => {
    if (quote) {
      const routes = getActiveRoutes();
      setActiveRoutes(routes);
      console.log("Active routes", routes);
    }
  }, [quote]);

  // Fetch ICP price in USD and multiply by value
  useEffect(() => {
    if (currency === "ICP") {
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd"
      )
        .then((res) => res.json())
        .then((data) => {
          const price = data["internet-computer"]?.usd;
          if (price) {
            setDesiredTokenPrice(price);
          }
        })
        .catch(console.error);
    } else if (currency === "USDC") {
      setDesiredTokenPrice(1); // 1:1 rate for USDC
    }
  }, [currency]);

  // Memoize quote request parameters to prevent unnecessary API calls
  const quoteParams = useMemo(() => {
    if (!address) return null;

    const approveERC20CallData = encodeApproveCallData(
      USDC_TOKEN_ADDRESS,
      usdcNeeded
    );

    // No need to handle principal bytes here; encodeDepositEthCallData does it
    const depositERC20CallData = encodeDepositERC20CallData(
      USDC_TOKEN_ADDRESS,
      usdcNeeded,
      destinationAddress
    );

    return {
      fromChain: "OPT" as const,
      toChain: "ETH" as const,
      fromToken: "USDC" as const,
      toToken: "USDC" as const,
      fromAddress: address,
      toAmount: usdcNeeded,
      contractCalls: [
        {
          fromAmount: usdcNeeded,
          fromTokenAddress: USDC_TOKEN_ADDRESS,
          toContractAddress: CKUSDC_HELPER_CONTRACT_ADDRESS,
          toContractCallData: depositERC20CallData,
          toContractGasLimit: "80000",
          toFallbackAddress: "0x1c9f0d9905Daceb6A1E0dFb7f3fB37288AB1515B",
          toApprovalAddress: CKUSDC_HELPER_CONTRACT_ADDRESS,
        },
      ],
    };
  }, [address, usdcNeeded]);

  useEffect(() => {
    if (address && usdcNeeded && usdcNeeded !== "1" && quoteParams) {
      getContractCallsQuote(quoteParams).then(setQuote).catch(console.error);
    }
  }, [address, usdcNeeded, quoteParams]);

  // Optimized timer initialization - only run when steps change
  useEffect(() => {
    if (!steps) return;

    const newTimers: { [stepId: string]: number } = {};
    steps.forEach((step) => {
      const duration = step.estimate.executionDuration;
      if (typeof duration === "number" && duration > 0) {
        newTimers[step.id] = duration;
      }
    });

    // Only update if there are actual changes
    setTimers((prev) => {
      const hasChanges = Object.keys(newTimers).some(
        (key) => prev[key] !== newTimers[key]
      );
      return hasChanges ? { ...prev, ...newTimers } : prev;
    });
  }, [steps]);

  // Optimized countdown timer - only update when necessary
  useEffect(() => {
    if (!steps || steps.length === 0) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Check if any steps need countdown
    const hasPendingSteps = steps.some(
      (step) => step.execution?.status === "PENDING"
    );

    if (!hasPendingSteps) return;

    intervalRef.current = setInterval(() => {
      setTimers((prev) => {
        const updated: { [stepId: string]: number } = {};
        let hasChanges = false;

        steps.forEach((step) => {
          if (step.execution?.status === "PENDING" && prev[step.id] > 0) {
            updated[step.id] = prev[step.id] - 1;
            hasChanges = true;
          } else {
            updated[step.id] = prev[step.id];
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [steps]);

  // Memoize status display function to prevent recreation on every render
  const statusToDisplay = useCallback((step: LiFiStepExtended) => {
    const status = step.execution?.status;

    switch (status) {
      case "PENDING":
        return (
          <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-200">
            <Loader className="animate-spin text-blue-500" size={16} />{" "}
            Processing transaction...
          </span>
        );
      case "ACTION_REQUIRED":
        return (
          <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-200">
            <AlertCircle className="text-blue-500" size={16} /> Waiting for
            approval...
          </span>
        );
      case "FAILED":
        // Look for specific error message in the execution process
        const errorMessage = step.execution?.process?.find((p) => p.error)
          ?.error?.message;
        let displayMessage = errorMessage || "Transaction failed";
        if (errorMessage && /user (rejected|denied)/i.test(errorMessage)) {
          displayMessage = "You rejected the transaction.";
        }

        return (
          <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-200">
            <XCircle className="text-red-500" size={16} /> {displayMessage}
          </span>
        );
      case "DONE":
        return (
          <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-200">
            <CheckCircle className="text-green-500" size={16} /> Transaction
            completed
          </span>
        );
      default:
        return null;
    }
  }, []);

  // Memoize confirm function to prevent recreation
  const confirm = useCallback(async () => {
    if (quote) {
      const route = convertQuoteToRoute(quote);
      const executedRoute = await executeRoute(route, {
        updateRouteHook: (route) => {
          console.log("Found updated route", route);
          setSteps([...route.steps]);
        },
      });

      console.log(executedRoute);
    }
  }, [quote]);

  // Memoize time formatting function
  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  // Memoize formatted USDC amount to prevent recalculation
  const formattedUsdcAmount = useMemo(() => {
    if (!quote) return null;
    return (Number(quote.estimate.fromAmount) / 1_000_000).toLocaleString(
      undefined,
      { maximumFractionDigits: 6 }
    );
  }, [quote]);

  // Memoize ICP price display
  const desiredTokenPriceDisplay = useMemo(() => {
    if (!desiredTokenPrice) return null;
    return (Number(value) * desiredTokenPrice).toLocaleString(undefined, {
      maximumFractionDigits: 6,
    });
  }, [desiredTokenPrice, value]);

  // Compute if processing (any step is PENDING or ACTION_REQUIRED)
  const isProcessing = useMemo(() => {
    if (!steps) return false;
    return steps.some(
      (step) =>
        step.execution?.status === "PENDING" ||
        step.execution?.status === "ACTION_REQUIRED"
    );
  }, [steps]);

  // Notify parent if processing state changes
  useEffect(() => {
    if (onProcessingChange) {
      onProcessingChange(isProcessing);
    }
  }, [isProcessing, onProcessingChange]);

  return (
    <>
      <div className="flex items-center gap-2">
        <div>Press confirm to pay using USDC on Optimism.</div>
      </div>
      <div className="flex flex-row gap-2">
        <CircleDollarSign />
        {quote ? (
          <div className="flex flex-row gap-2">
            <div>{formattedUsdcAmount} USDC</div>
            <div>
              <ArrowRight />
            </div>
            <div>
              {value} {currency}
            </div>
          </div>
        ) : (
          <div>Fetching quote...</div>
        )}
      </div>
      {desiredTokenPrice && (
        <div className="text-xs text-gray-500">
          {value} {currency} ≈ {desiredTokenPriceDisplay} USDC
        </div>
      )}
      <div className="flex flex-col gap-2">
        {steps?.map((step) => (
          <div key={step.id} className="flex flex-col gap-1">
            <div>{statusToDisplay(step)}</div>
            {step.execution?.status !== "DONE" && (
              <div>
                Estimated time:{" "}
                {formatTime(timers[step.id] ?? step.estimate.executionDuration)}
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        className={
          `bg-blue-500 text-white px-4 py-2 rounded-md transition ` +
          (isProcessing
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-blue-600 hover:cursor-pointer")
        }
        onClick={confirm}
        disabled={isProcessing}
      >
        Confirm
      </button>
    </>
  );
}
