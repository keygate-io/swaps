"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Config, CreateConnectorFn, WagmiProvider, createConfig as createWagmiConfig, http, injected } from "wagmi";
import { useSyncWagmiConfig } from "@lifi/wallet-management";
import { mainnet } from "wagmi/chains";
import { ChainType, config, createConfig as createLifiConfig, EVM, getChains } from "@lifi/sdk";
import { getWalletClient, switchChain } from "wagmi/actions";
import { createClient } from "viem";
import React from "react";

const connectors: CreateConnectorFn[] = [injected()];

const wagmiConfig: Config = createWagmiConfig({
  chains: [mainnet],
  client({ chain }) {
    return createClient({ chain, transport: http() })
  }
});

createLifiConfig({
  integrator: "Keygate",
  providers: [
    EVM({
      getWalletClient: () => getWalletClient(wagmiConfig),
      switchChain: async (chainId) => {
        const chain = await switchChain(wagmiConfig, { chainId });
        return getWalletClient(wagmiConfig, { chainId: chain.id });
      },
    }),
  ],
  preloadChains: false,
});

export function KeygateProvider({ children }: { children: React.ReactNode }) {
  const { data: chains } = useQuery({
    queryKey: ["chains"] as const,
    queryFn: async () => {
      const chains = await getChains({
        chainTypes: [ChainType.EVM],
      });
      config.setChains(chains);
      return chains;
    },
  });

  useSyncWagmiConfig(wagmiConfig, connectors, chains);

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      {children}
    </WagmiProvider>
  );
}
