import { PortfolioValueChart } from "./PortfolioValueChart";

export function PortfolioValueDisplay() {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold">Portfolio</h2>
      <PortfolioValueChart />
    </div>
  );
}