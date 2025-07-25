import Link from "next/link";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col p-8">
      <h1 className="text-3xl font-bold mb-2">Examples</h1>
      <p className="mb-8 text-gray-700 dark:text-gray-300 max-w-2xl">
        Choose how you want to pay or bridge. We make it easy to buy or move
        assets between chains. Select an option below to get started!
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl">
        <Link
          href="/usdc-to-icp"
          className="block p-6 border border-gray-200 bg-white dark:bg-neutral-900 transition group"
        >
          <div className="flex items-center gap-4 mb-3">
            <ArrowPathIcon className="w-10 h-10 text-blue-500" />
            <h2 className="text-xl font-semibold">
              USDC (Optimism) → Native ICP (Internet Computer)
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Buy native ICP on the Internet Computer using USDC from Optimism.
            Fast, secure, and no manual bridging needed.
          </p>
        </Link>
        <Link
          href="/usdc-to-ckusdc"
          className="block p-6 border border-gray-200 bg-white dark:bg-neutral-900 transition group"
        >
          <div className="flex items-center gap-4 mb-3">
            <ArrowPathIcon className="w-10 h-10 text-blue-500" />
            <h2 className="text-xl font-semibold">
              USDC (Optimism) → ckUSDC (Internet Computer)
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Bridge USDC from Optimism to ckUSDC on the Internet Computer.
            Simple, seamless, and coming soon!
          </p>
        </Link>
      </div>
    </div>
  );
}
