# swaps

Accept crypto from any blockchain. Simply:

1. Install the sdk via npm
`npm i @keygate/sdk`

2. Add the provider into your `app.tsx`
```typescript
import { KeygateProvider } from "../components/provider/KeygateProvider";

export function App({ children }: { children: React.ReactNode }) {
  return (
      <KeygateProvider>{children}</KeygateProvider>
  );
} 
```

3. Add the PurchaseButton to accept payments.
```typescript
    <PurchaseButton
        value={usdcAmount}
        fromCurrency="ETH"
        toCurrency="USDC"
        onProcessingChange={setIsProcessing}
        disableToggle={isProcessing}
        destinationAddress="wtzxg-u3qsq-7drpw-3iytd-x4mv2-e53xw-e5xyy-g7577-dc6ky-266ly-qqe"
    />
```

- value: The amount of tokens to purchase in the destination currency (e.g. if toCurrency is "USDC", this would be the amount of USDC to receive)
- fromCurrency: The currency that the user will pay with (e.g. "ETH", "USDC", etc)
- toCurrency: The currency that the user will receive (e.g. "USDC", "ICP", etc) 
- onProcessingChange: Callback function that receives a boolean indicating if a transaction is currently being processed
- disableToggle: Boolean to disable the button during processing
- destinationAddress: The wallet address where the purchased tokens will be sent