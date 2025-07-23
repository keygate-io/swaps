"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KeygateProvider } from "../components/provider/KeygateProvider";

export function App({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <KeygateProvider>{children}</KeygateProvider>
    </QueryClientProvider>
  );
} 