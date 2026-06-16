"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import dayjs from "dayjs";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getInteractiveChartStats } from "@/app/actions/chart-stats";

type ChartItem = {
  date: string;
  physical: number;
  returns: number;
};

const chartConfig = {
  circulation: {
    label: "Total Inventory Operations",
  },
  physical: {
    label: "Physical Borrows",
    color: "hsl(var(--primary))",
  },
  returns: {
    label: "Physical Returns",
    color: "hsl(var(--chart-2, 142 70% 45%))",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");
  const [rawChartData, setRawChartData] = React.useState<ChartItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      const response = await getInteractiveChartStats();
      if (response.success && response.data) {
        setRawChartData(response.data as ChartItem[]);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredData = React.useMemo(() => {
    if (rawChartData.length === 0) return [];

    const referenceDate = dayjs();
    let daysToSubtract = 90;
    if (timeRange === "30d") daysToSubtract = 30;
    if (timeRange === "7d") daysToSubtract = 7;

    const cutOffDate = referenceDate
      .subtract(daysToSubtract, "day")
      .startOf("day");

    return rawChartData.filter((item) => {
      const itemDate = dayjs(item.date);
      return itemDate.isAfter(cutOffDate) || itemDate.isSame(cutOffDate, "day");
    });
  }, [timeRange, rawChartData]);

  // Enhanced Analytics Skeleton Loading State
  if (loading) {
    return (
      <Card className="@container/card animate-pulse">
        <CardHeader>
          <div className="space-y-2">
            <div className="h-5 w-52 rounded-md bg-slate-300 dark:bg-slate-700" />
            <div className="h-4 w-80 rounded-md bg-slate-200 dark:bg-slate-800" />
          </div>
          <CardAction>
            <div className="h-9 w-40 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex h-[250px] w-full flex-col justify-between pt-2">
            <div className="space-y-7 w-full">
              <div className="h-[1px] w-full bg-slate-100 dark:bg-slate-800/60" />
              <div className="h-[1px] w-full bg-slate-100 dark:bg-slate-800/60" />
              <div className="h-[1px] w-full bg-slate-100 dark:bg-slate-800/60" />
              <div className="h-[1px] w-full bg-slate-100 dark:bg-slate-800/60" />
              <div className="h-[1px] w-full bg-slate-100 dark:bg-slate-800/60" />
            </div>
            <div className="flex justify-between px-4 pt-2">
              <div className="h-3 w-10 rounded-sm bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-10 rounded-sm bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-10 rounded-sm bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-10 rounded-sm bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Physical Circulation Activity</CardTitle>
        <CardDescription>
          Live correlation of physical book borrows vs library return
          completions
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(val) => val && setTimeRange(val)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select view window range"
            >
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillPhysical" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-physical)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-physical)"
                  stopOpacity={0.01}
                />
              </linearGradient>
              <linearGradient id="fillReturns" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-returns)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-returns)"
                  stopOpacity={0.01}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                return dayjs(value).format("MMM DD");
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return dayjs(value).format("MMMM DD, YYYY");
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="returns"
              type="monotone"
              fill="url(#fillReturns)"
              stroke="var(--color-returns)"
              strokeWidth={2}
            />
            <Area
              dataKey="physical"
              type="monotone"
              fill="url(#fillPhysical)"
              stroke="var(--color-physical)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
