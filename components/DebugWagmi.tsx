import { useAccount, useDisconnect } from "wagmi";
import { WalletOptions } from "./WalletOptions";
import { disconnect } from "wagmi/actions";

function ConnectWallet() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  if (isConnected)
    return (
      <button
        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 hover:cursor-pointer"
        onClick={() => disconnect()}
      >
        Disconnect</button>
    );
  return <WalletOptions />;
}

export function DebugWagmi() {
  const { address, isConnected } = useAccount();
  return (
    <div>
      <div>Address: {address}</div>
      <div>Is connected: {isConnected ? "Yes" : "No"}</div>
      <ConnectWallet />
    </div>
  );
}
