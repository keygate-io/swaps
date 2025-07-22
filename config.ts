import { http, createConfig, injected} from "wagmi";
import { metaMask } from "wagmi/connectors";
import { mainnet, sepolia } from "wagmi/chains";

export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: [
    injected(),
    metaMask(),
  ],
});