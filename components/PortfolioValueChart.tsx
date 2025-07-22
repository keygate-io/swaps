"use client";


import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "A simple area chart";

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
];

const chartConfig = {
  desktop: {
    label: "Net worth",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

export function PortfolioValueChart() {
  return (
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
          >
            <CartesianGrid vertical={true} />
            <XAxis
              dataKey="month"
              tickLine={true}
              axisLine={true}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              name="Net worth"
              label="Net worth"
              dataKey="desktop"
              type="linear"
              fill="var(--color-primary)"
              fillOpacity={0.4}
              stroke="var(--color-primary)"
            />
          </AreaChart>
        </ChartContainer>

  );
}
