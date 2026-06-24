"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, LabelList } from "recharts";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Calendar,
  BookOpen,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search,
  Filter,
  X,
} from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    color: "#3B82F6",
  },
  returns: {
    label: "Physical Returns",
    color: "#10B981",
  },
} satisfies ChartConfig;

const ITEMS_PER_PAGE = 20;
const MAX_VISIBLE_MONTHS = 12;
const CHART_MAX_DATA_POINTS = 90;

const CustomLabel = (props: any) => {
  const { x, y, width, value, dataKey, activeChart } = props;

  if (dataKey !== activeChart) return null;
  if (value === 0) return null;

  return (
    <text
      x={x + width / 2}
      y={y - 12}
      fill={
        dataKey === "physical"
          ? chartConfig.physical.color
          : chartConfig.returns.color
      }
      textAnchor="middle"
      fontSize={13}
      fontWeight="bold"
      className="drop-shadow-sm"
    >
      {value}
    </text>
  );
};

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");
  const [rawChartData, setRawChartData] = React.useState<ChartItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeChart, setActiveChart] = React.useState<"physical" | "returns">(
    "physical",
  );
  const [expandedMonths, setExpandedMonths] = React.useState<
    Record<string, boolean>
  >({});

  const [expandedMonthPages, setExpandedMonthPages] = React.useState<
    Record<string, number>
  >({});

  // Search and filter states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterActivity, setFilterActivity] = React.useState<
    "all" | "borrows" | "returns"
  >("all");

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

  // Get time-filtered base data
  const timeFilteredData = React.useMemo(() => {
    if (rawChartData.length === 0) return [];

    const referenceDate = dayjs();
    let daysToSubtract = 90;
    if (timeRange === "30d") daysToSubtract = 30;
    if (timeRange === "7d") daysToSubtract = 7;

    const cutOffDate = referenceDate
      .subtract(daysToSubtract, "day")
      .startOf("day");

    return rawChartData
      .filter((item) => {
        const itemDate = dayjs(item.date);
        return (
          itemDate.isAfter(cutOffDate) || itemDate.isSame(cutOffDate, "day")
        );
      })
      .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  }, [timeRange, rawChartData]);

  // Apply search and activity filter to the data
  const filteredDataForDisplay = React.useMemo(() => {
    let data = [...timeFilteredData];

    // Apply activity filter
    if (filterActivity === "borrows") {
      data = data.filter((item) => item.physical > 0);
    } else if (filterActivity === "returns") {
      data = data.filter((item) => item.returns > 0);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter((item) => {
        const dateStr = dayjs(item.date).format("MMMM D, YYYY").toLowerCase();
        const dayStr = dayjs(item.date).format("D").toLowerCase();
        const monthStr = dayjs(item.date).format("MMMM").toLowerCase();
        const yearStr = dayjs(item.date).format("YYYY").toLowerCase();

        return (
          dateStr.includes(query) ||
          dayStr === query ||
          monthStr.includes(query) ||
          yearStr.includes(query) ||
          (query.includes("borrow") && item.physical > 0) ||
          (query.includes("return") && item.returns > 0)
        );
      });
    }

    return data;
  }, [timeFilteredData, searchQuery, filterActivity]);

  // Chart data with sampling for performance
  const chartData = React.useMemo(() => {
    let data = [...filteredDataForDisplay];

    if (data.length > CHART_MAX_DATA_POINTS) {
      const step = Math.ceil(data.length / CHART_MAX_DATA_POINTS);
      data = data.filter((_, index) => index % step === 0);
    }

    return data;
  }, [filteredDataForDisplay]);

  // Group data by month with daily details
  const monthlyData = React.useMemo(() => {
    const grouped = filteredDataForDisplay.reduce(
      (acc, item) => {
        const monthKey = dayjs(item.date).format("YYYY-MM");
        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            physical: 0,
            returns: 0,
            days: [],
          };
        }
        acc[monthKey].physical += item.physical;
        acc[monthKey].returns += item.returns;
        acc[monthKey].days.push({
          date: item.date,
          physical: item.physical,
          returns: item.returns,
          total: item.physical + item.returns,
        });
        return acc;
      },
      {} as Record<
        string,
        {
          month: string;
          physical: number;
          returns: number;
          days: Array<{
            date: string;
            physical: number;
            returns: number;
            total: number;
          }>;
        }
      >,
    );

    return Object.values(grouped)
      .map((month) => ({
        ...month,
        days: month.days.sort(
          (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf(),
        ),
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, MAX_VISIBLE_MONTHS);
  }, [filteredDataForDisplay]);

  const totals = React.useMemo(() => {
    return filteredDataForDisplay.reduce(
      (acc, curr) => ({
        physical: acc.physical + curr.physical,
        returns: acc.returns + curr.returns,
      }),
      { physical: 0, returns: 0 },
    );
  }, [filteredDataForDisplay]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => {
      const newState = { ...prev, [monthKey]: !prev[monthKey] };
      // Reset pagination when opening
      if (newState[monthKey]) {
        setExpandedMonthPages((prevPages) => ({
          ...prevPages,
          [monthKey]: 1,
        }));
      }
      return newState;
    });
  };

  const loadMoreDays = (monthKey: string) => {
    setExpandedMonthPages((prev) => ({
      ...prev,
      [monthKey]: (prev[monthKey] || 1) + 1,
    }));
  };

  const getPaginatedDays = (days: any[], monthKey: string) => {
    const page = expandedMonthPages[monthKey] || 1;
    const endIndex = page * ITEMS_PER_PAGE;

    return {
      visibleDays: days.slice(0, endIndex),
      hasMore: endIndex < days.length,
      totalCount: days.length,
    };
  };

  const mostActiveDay = React.useMemo(() => {
    if (filteredDataForDisplay.length === 0) return null;
    return filteredDataForDisplay.reduce((max, curr) =>
      curr.physical + curr.returns > max.physical + max.returns ? curr : max,
    );
  }, [filteredDataForDisplay]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery.trim() !== "" || filterActivity !== "all";

  if (loading) {
    return (
      <Card className="@container/card animate-pulse">
        <CardHeader>
          <div className="space-y-2">
            <div className="h-5 w-52 rounded-md bg-slate-300 dark:bg-slate-700" />
            <div className="h-4 w-80 rounded-md bg-slate-200 dark:bg-slate-800" />
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex h-[250px] w-full flex-col justify-between pt-2">
            <div className="space-y-7 w-full">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-[1px] w-full bg-slate-100 dark:bg-slate-800/60"
                />
              ))}
            </div>
            <div className="flex justify-between px-4 pt-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-3 w-10 rounded-sm bg-slate-200 dark:bg-slate-800"
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRecords = rawChartData.length;
  const hasManyRecords = totalRecords > 100;
  const filteredCount = filteredDataForDisplay.length;

  return (
    <Card className="@container/card border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-slate-200/60 dark:border-slate-800/60 p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Circulation Analytics
              </CardTitle>
              <CardDescription className="text-sm">
                {hasManyRecords
                  ? `${totalRecords.toLocaleString()} total records • ${filteredCount} filtered`
                  : hasActiveFilters
                    ? `${filteredCount} results found`
                    : "Daily breakdown of borrows & returns"}
              </CardDescription>
            </div>
          </div>
        </div>

        {/* Interactive Header Tabs */}
        <div className="flex border-t border-slate-200/60 dark:border-slate-800/60 sm:border-t-0 sm:border-l">
          {(["physical", "returns"] as const).map((key) => {
            const isActive = activeChart === key;
            const Icon = key === "physical" ? TrendingUp : RotateCcw;
            return (
              <button
                key={key}
                data-active={isActive}
                onClick={() => setActiveChart(key)}
                className={`relative z-30 flex flex-1 flex-col justify-center gap-1 border-r last:border-r-0 border-slate-200/60 dark:border-slate-800/60 px-4 py-3 sm:px-6 sm:py-5 text-left transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full shadow-sm"
                    style={{
                      backgroundColor: chartConfig[key].color,
                      opacity: isActive ? 1 : 0.5,
                    }}
                  />
                  <Icon className="w-3 h-3" />
                  {chartConfig[key].label}
                </span>
                <span
                  className={`text-2xl font-bold leading-none transition-colors ${
                    isActive
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {totals[key].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>

      <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search date, month, year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 w-56 h-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <Select
            value={filterActivity}
            onValueChange={(value: "all" | "borrows" | "returns") =>
              setFilterActivity(value)
            }
          >
            <SelectTrigger className="w-36 h-9 text-sm">
              <Filter className="w-3 h-3 mr-1.5" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activity</SelectItem>
              <SelectItem value="borrows">Borrows Only</SelectItem>
              <SelectItem value="returns">Returns Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Active filter badge */}
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs gap-1">
              {filteredCount} result{filteredCount !== 1 ? "s" : ""}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterActivity("all");
                }}
              >
                <X className="w-3 h-3 ml-1" />
              </button>
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {mostActiveDay && !hasActiveFilters && (
            <Badge
              variant="secondary"
              className="hidden sm:flex items-center gap-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
            >
              <Sparkles className="w-3 h-3" />
              Peak: {dayjs(mostActiveDay.date).format("MMM D")} (
              {mostActiveDay.physical + mostActiveDay.returns} ops)
            </Badge>
          )}
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(val) => val && setTimeRange(val)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d" className="text-xs">
              3 Months
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="text-xs">
              30 Days
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="text-xs">
              7 Days
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-36 @[767px]/card:hidden"
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
        </div>
      </div>

      <CardContent className="px-2 pt-0 sm:px-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <BarChart data={chartData} barGap={4} barCategoryGap="25%">
            <defs>
              <linearGradient id="barPhysical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="barReturns" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              opacity={0.15}
              stroke="#94a3b8"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={40}
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickFormatter={(value) => dayjs(value).format("MMM DD")}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(59, 130, 246, 0.05)" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    dayjs(value).format("dddd, MMMM DD, YYYY")
                  }
                  indicator="dot"
                />
              }
            />
            <Bar
              dataKey="returns"
              fill="url(#barReturns)"
              radius={[6, 6, 0, 0]}
              maxBarSize={45}
              opacity={activeChart === "returns" ? 1 : 0.25}
            >
              <LabelList
                dataKey="returns"
                content={(props) => (
                  <CustomLabel {...props} activeChart={activeChart} />
                )}
              />
            </Bar>
            <Bar
              dataKey="physical"
              fill="url(#barPhysical)"
              radius={[6, 6, 0, 0]}
              maxBarSize={45}
              opacity={activeChart === "physical" ? 1 : 0.25}
            >
              <LabelList
                dataKey="physical"
                content={(props) => (
                  <CustomLabel {...props} activeChart={activeChart} />
                )}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>

      {/* Enhanced Monthly & Daily Summary */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Detailed Activity Log
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {filteredCount} result{filteredCount !== 1 ? "s" : ""}
                </Badge>
              )}
              {hasManyRecords && !hasActiveFilters && (
                <Badge variant="outline" className="text-xs font-normal">
                  Showing {MAX_VISIBLE_MONTHS} recent months
                </Badge>
              )}
            </h4>
          </div>

          <div className="space-y-3">
            {monthlyData.map((month) => {
              const isExpanded = expandedMonths[month.month];
              const hasActivity = month.physical > 0 || month.returns > 0;
              const activeDays = month.days.filter((d) => d.total > 0);
              const { visibleDays, hasMore, totalCount } = getPaginatedDays(
                activeDays,
                month.month,
              );

              return (
                <motion.div
                  key={month.month}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl border transition-all duration-300 ${
                    isExpanded
                      ? "border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 shadow-md"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <button
                    onClick={() => hasActivity && toggleMonth(month.month)}
                    className="w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[50px]">
                        <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                          {dayjs(month.month).format("MMM")}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {dayjs(month.month).format("YYYY")}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                            {month.physical.toLocaleString()} borrow
                            {month.physical !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                            {month.returns.toLocaleString()} return
                            {month.returns !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {hasActivity && (
                        <Badge variant="outline" className="text-xs">
                          {activeDays.length} active day
                          {activeDays.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                      {hasActivity && (
                        <div className="text-slate-400">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && hasActivity && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-2">
                          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex items-center justify-between">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Daily Breakdown{" "}
                              {totalCount > 0 &&
                                `(${totalCount} day${totalCount !== 1 ? "s" : ""})`}
                            </p>
                            {totalCount > ITEMS_PER_PAGE && (
                              <Badge variant="secondary" className="text-xs">
                                Showing{" "}
                                {Math.min(visibleDays.length, totalCount)} of{" "}
                                {totalCount}
                              </Badge>
                            )}
                          </div>

                          {visibleDays.map((day, index) => (
                            <motion.div
                              key={day.date}
                              initial={{ x: -10, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{
                                delay: Math.min(index * 0.01, 0.3),
                              }}
                              className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-center min-w-[45px]">
                                  <div className="text-lg font-bold text-slate-700 dark:text-slate-200">
                                    {dayjs(day.date).format("D")}
                                  </div>
                                  <div className="text-[10px] text-slate-500 uppercase">
                                    {dayjs(day.date).format("ddd")}
                                  </div>
                                </div>
                                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                                <div className="text-xs text-slate-500">
                                  {dayjs(day.date).format("MMM YYYY")}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {day.physical > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <TrendingUp className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                      {day.physical.toLocaleString()} borrow
                                      {day.physical !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                )}
                                {day.returns > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <RotateCcw className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                      {day.returns.toLocaleString()} return
                                      {day.returns !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}

                          {hasMore && (
                            <div className="pt-2 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadMoreDays(month.month)}
                                className="text-xs"
                              >
                                Load More Days (
                                {(
                                  totalCount - visibleDays.length
                                ).toLocaleString()}{" "}
                                remaining)
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {monthlyData.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
                No matching records found
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                Try adjusting your search or filters
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterActivity("all");
                  }}
                  className="mt-3"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
