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
  CurrencyDollarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import {
  encodeDepositERC20CallData,
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
  fromCurrency: string;
  toCurrency: string;
  onProcessingChange?: (processing: boolean) => void;
  disableToggle?: boolean;
  destinationAddress: string;
}

export function PurchaseButton({
  value,
  fromCurrency,
  toCurrency,
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
          fromCurrency={fromCurrency}
          toCurrency={toCurrency}
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
  fromCurrency: string;
  toCurrency: string;
  destinationAddress: string;
  onProcessingChange?: (processing: boolean) => void;
  disableToggle?: boolean;
};

// Mapping from token symbol to CoinGecko ID
const COINGECKO_IDS: Record<string, string> = {
  ICP: "internet-computer",
  ETH: "ethereum",
  USDC: "usd-coin",
};

function DisplayQuote({
  value,
  fromCurrency,
  toCurrency,
  destinationAddress,
  onProcessingChange,
  disableToggle,
}: DisplayQuoteProps) {
  const { address } = useAccount();
  const [quote, setQuote] = useState<any>(null);
  const [steps, setSteps] = useState<LifiSteps | null>(null);
  const [timers, setTimers] = useState<{ [stepId: string]: number }>({});
  const [fromTokenPrice, setFromTokenPrice] = useState<number | null>(null);
  const [toTokenPrice, setToTokenPrice] = useState<number | null>(null);
  const [usdcNeeded, setUsdcNeeded] = useState<string>("1"); // default to 1 USDC for fallback
  const [activeRoutes, setActiveRoutes] = useState<any[]>([]);

  // Use refs to avoid unnecessary rerenders
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch both from and to token prices from CoinGecko
  useEffect(() => {
    const fetchPrices = async () => {
      const fromId = COINGECKO_IDS[fromCurrency];
      const toId = COINGECKO_IDS[toCurrency];
      try {
        const ids = [fromId, toId].join(",");
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
        );
        const data = await res.json();
        setFromTokenPrice(data[fromId]?.usd || null);
        setToTokenPrice(data[toId]?.usd || null);
      } catch (e) {
        setFromTokenPrice(null);
        setToTokenPrice(null);
      }
    };
    fetchPrices();
  }, [fromCurrency, toCurrency]);

  // Memoize the calculation to avoid recalculating on every render
  const calculatedUsdcNeeded = useMemo(() => {
    if (fromTokenPrice && toTokenPrice) {
      // value is in toCurrency, convert to fromCurrency equivalent
      // amount_in_from = value * (toTokenPrice / fromTokenPrice)
      const total = Number(value) * (toTokenPrice / fromTokenPrice);
      return Math.round(total * 1_000_000).toString();
    }
    return "1";
  }, [fromTokenPrice, toTokenPrice, value]);

  // Update usdcNeeded when calculation changes
  useEffect(() => {
    setUsdcNeeded(calculatedUsdcNeeded);
  }, [calculatedUsdcNeeded]);

  // Fetch active routes only once when quote is available
  useEffect(() => {
    if (quote) {
      const routes = getActiveRoutes();
      setActiveRoutes(routes);
      console.log("quote", quote);
      console.log("Active routes", routes);
    }
  }, [quote]);

  // Memoize quote request parameters to prevent unnecessary API calls
  const quoteParams = useMemo(() => {
    if (!address) return null;
    const depositERC20CallData = encodeDepositERC20CallData(
      USDC_TOKEN_ADDRESS,
      usdcNeeded,
      destinationAddress
    );

    return {
      fromChain: "OPT" as const,
      toChain: "ETH" as const,
      fromToken: "ETH" as const,
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
  }, [address, usdcNeeded, destinationAddress]);

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

  // Compute total gas cost in USD
  const totalGasCostUSD = useMemo(() => {
    if (!steps) return null;
    let total = 0;
    for (const step of steps) {
      if (step.estimate?.gasCosts) {
        for (const gas of step.estimate.gasCosts) {
          if (gas.amountUSD) {
            total += Number(gas.amountUSD);
          }
        }
      }
    }
    return total;
  }, [steps]);

  // Compute total fee cost in USD
  const totalFeeCostUSD = useMemo(() => {
    if (!steps) return null;
    let total = 0;
    for (const step of steps) {
      if (step.estimate?.feeCosts) {
        for (const fee of step.estimate.feeCosts) {
          if (fee.amountUSD) {
            total += Number(fee.amountUSD);
          }
        }
      }
    }
    return total;
  }, [steps]);

  // Compute total estimated execution time (in seconds)
  const totalExecutionTime = useMemo(() => {
    if (!steps) return null;
    let total = 0;
    for (const step of steps) {
      if (typeof step.estimate?.executionDuration === "number") {
        total += step.estimate.executionDuration;
      }
    }
    return total;
  }, [steps]);

  // --- Simplified countdown timer for total execution time ---
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  useEffect(() => {
    if (typeof totalExecutionTime === "number" && totalExecutionTime > 0) {
      setRemainingTime(totalExecutionTime);
      const interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev === null) return null;
          if (
            steps?.some((step) => step.execution?.status === "ACTION_REQUIRED")
          ) {
            return prev;
          }
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setRemainingTime(null);
    }
  }, [totalExecutionTime]);

  // Memoize status display function to prevent recreation on every render
  const statusToDisplay = useCallback((step: LiFiStepExtended) => {
    const status = step.execution?.status;

    switch (status) {
      case "PENDING":
        return (
          <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-200">
            <ArrowPathIcon className="animate-spin text-blue-500 w-4 h-4 align-bottom" />{" "}
            Processing transaction...
          </span>
        );
      case "ACTION_REQUIRED":
        return (
          <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-200">
            <ExclamationTriangleIcon className="text-blue-500 w-4 h-4" />{" "}
            Waiting for approval...
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
            <XCircleIcon className="text-red-500 w-4 h-4" /> {displayMessage}
          </span>
        );
      case "DONE":
        return (
          <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-200">
            <CheckCircleIcon className="text-green-500 w-4 h-4" /> Transaction
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

  // Memoize price display
  const priceDisplay = useMemo(() => {
    if (!fromTokenPrice || !toTokenPrice) return null;
    return (Number(value) * (toTokenPrice / fromTokenPrice)).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 6,
      }
    );
  }, [fromTokenPrice, toTokenPrice, value]);

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
        <div>Press confirm to pay using {fromCurrency} on Optimism.</div>
      </div>
      <div className="flex flex-row gap-2">
        {quote ? (
          <div className="flex flex-row items-center gap-2">
            <div>
              <CurrencyDollarIcon className="w-5 h-5" />
            </div>
            <div>
              {priceDisplay} {fromCurrency}
            </div>
            <div>
              <ArrowRightIcon className="w-5 h-5 align-bottom" />
            </div>
            <div>
              {value} {toCurrency}
            </div>
          </div>
        ) : (
          <div>Fetching quote...</div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {/* Estimates Section */}
        {(typeof totalGasCostUSD === "number" && totalGasCostUSD > 0) ||
        (typeof totalFeeCostUSD === "number" && totalFeeCostUSD > 0) ||
        (typeof totalExecutionTime === "number" && totalExecutionTime > 0) ? (
          <div className="rounded bg-neutral-100 dark:bg-neutral-800 p-3 mb-2 text-xs text-gray-700 dark:text-gray-200 flex flex-col gap-1">
            <span className="font-semibold text-sm mb-1">Estimate</span>
            {typeof totalGasCostUSD === "number" && totalGasCostUSD > 0 && (
              <div>
                Total gas cost:{" "}
                <span className="font-mono">${totalGasCostUSD.toFixed(4)}</span>
              </div>
            )}
            {typeof totalFeeCostUSD === "number" && totalFeeCostUSD > 0 && (
              <div>
                Total fee cost:{" "}
                <span className="font-mono">${totalFeeCostUSD.toFixed(4)}</span>
              </div>
            )}
            {typeof totalExecutionTime === "number" &&
              totalExecutionTime > 0 && (
                <div>
                  Total time:{" "}
                  <span className="font-mono">
                    {formatTime(remainingTime ?? totalExecutionTime)}
                  </span>
                </div>
              )}
          </div>
        ) : null}
        {steps?.map((step) => (
          <div key={step.id} className="flex flex-col gap-1">
            <div>{statusToDisplay(step)}</div>
          </div>
        ))}
      </div>
      <button
        className={
          `bg-black text-white px-4 py-2 rounded-md transition ` +
          (isProcessing
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-800 hover:cursor-pointer")
        }
        onClick={confirm}
        disabled={isProcessing}
      >
        Confirm
      </button>
    </>
  );
}
