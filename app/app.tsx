"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KeygateWagmiProvider } from "../components/provider/WagmiProvider";


export function App({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <KeygateWagmiProvider>
        {children}
      </KeygateWagmiProvider>
    </QueryClientProvider>
  );
} 