"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";
import { z } from "zod";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GripVerticalIcon,
  CircleCheckIcon,
  LoaderIcon,
  EllipsisVerticalIcon,
  Columns3Icon,
  ChevronDownIcon,
  PlusIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  BookmarkIcon,
} from "lucide-react";

export const schema = z.object({
  id: z.string(),
  bookTitle: z.string(),
  borrower: z.string(),
  role: z.string(),
  status: z.string(),
  date: z.string(),
  dueDate: z.string(),
});

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id });
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent"
    >
      <GripVerticalIcon className="size-3 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "bookTitle",
    header: "Book Title",
    cell: ({ row }) => <TableCellViewer item={row.original} />,
    enableHiding: false,
  },
  {
    accessorKey: "borrower",
    header: "Borrower",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.borrower}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <div className="w-24">
        <Badge
          variant={row.original.role === "Faculty" ? "secondary" : "outline"}
          className="px-1.5"
        >
          {row.original.role}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      if (status === "Overdue") {
        return (
          <Badge variant="destructive" className="gap-1 px-1.5">
            <AlertTriangleIcon className="size-3" />
            Overdue
          </Badge>
        );
      }
      if (status === "Returned") {
        return (
          <Badge
            variant="outline"
            className="gap-1 px-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
          >
            <CircleCheckIcon className="size-3 fill-emerald-500 text-background dark:fill-emerald-400" />
            Returned
          </Badge>
        );
      }
      return (
        <Badge
          variant="outline"
          className="gap-1 px-1.5 text-blue-500 border-blue-500/30 bg-blue-500/5"
        >
          <LoaderIcon className="size-3 animate-spin text-blue-500" />
          Borrowed
        </Badge>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Issue Date",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.date}</span>
    ),
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => (
      <span
        className={`tabular-nums font-medium ${row.original.status === "Overdue" ? "text-destructive" : ""}`}
      >
        {row.original.dueDate}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
            size="icon"
          >
            <EllipsisVerticalIcon />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() =>
              toast.success(`Marked ${row.original.id} as Returned!`)
            }
          >
            Mark as Returned
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              toast.info(
                `Reminder alert dispatched to ${row.original.borrower}`,
              )
            }
          >
            Issue Warning Alert
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            Renew Loan Period
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable({
  data: initialData,
}: {
  data: z.infer<typeof schema>[];
}) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Keep track of the active tab view state
  const [currentTab, setCurrentTab] = React.useState("all-loans");

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Handle syncing Tab switches directly into TanStack Table's column filters
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    if (value === "all-loans") {
      table.getColumn("status")?.setFilterValue(undefined);
    } else if (value === "overdue") {
      table.getColumn("status")?.setFilterValue("Overdue");
    } else if (value === "pending-returns") {
      table.getColumn("status")?.setFilterValue("Borrowed");
    }
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  // Calculate badges counts dynamically from source records
  const overdueCount = React.useMemo(
    () => data.filter((item) => item.status === "Overdue").length,
    [data],
  );

  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select value={currentTab} onValueChange={handleTabChange}>
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select context ledger" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all-loans">All Transactions</SelectItem>
              <SelectItem value="overdue">Overdue Books</SelectItem>
              <SelectItem value="pending-returns">Pending Returns</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all-loans">Active Circulation Ledger</TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue List{" "}
            {overdueCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 text-[10px] h-4 px-1 bg-destructive text-destructive-foreground animate-pulse"
              >
                {overdueCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending-returns">Staff Verifications</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3Icon data-icon="inline-start" />
                Columns
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide(),
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id.replace(/([A-Z])/g, " $1")}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info("Direct scan or barcode handler execution goes here.")
            }
          >
            <PlusIcon />
            <span className="hidden lg:inline">Issue New Book</span>
          </Button>
        </div>
      </div>

      {/* Lifted content grid to reside in a single container updated by filters */}
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6 mt-4">
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No operations matches found for this view.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} logs selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Logs per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Tabs>
  );
}

const chartData = [
  { month: "Jan", checkouts: 94 },
  { month: "Feb", checkouts: 142 },
  { month: "Mar", checkouts: 204 },
  { month: "Apr", checkouts: 110 },
  { month: "May", checkouts: 165 },
  { month: "Jun", checkouts: 232 },
];

const chartConfig = {
  checkouts: {
    label: "Checkouts",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button
          variant="link"
          className="w-fit px-0 text-left text-foreground hover:text-primary font-medium line-clamp-1 justify-start"
        >
          <BookmarkIcon className="mr-1.5 size-3.5 shrink-0 text-muted-foreground" />
          {item.bookTitle}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle className="line-clamp-2">{item.bookTitle}</DrawerTitle>
          <DrawerDescription>
            Loan transaction profile tracking log: {item.id}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig} className="h-32 w-full">
                <AreaChart
                  data={chartData}
                  margin={{ left: 10, right: 10, top: 10 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    dataKey="checkouts"
                    type="monotone"
                    fill="var(--chart-1)"
                    fillOpacity={0.2}
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-1">
                <div className="flex gap-2 items-center font-medium text-xs text-muted-foreground uppercase tracking-wider">
                  <TrendingUpIcon className="size-3.5 text-emerald-500" />
                  Circulation Popularity Trends
                </div>
                <div className="text-muted-foreground text-xs leading-relaxed mt-1">
                  This volume demonstrates high circulation indexes inside
                  engineering structures this semester. Ensure strict buffer
                  return policies before examination segments start.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="bookTitle">Book Title</Label>
              <Input id="bookTitle" defaultValue={item.bookTitle} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="borrower">Borrower Name</Label>
              <Input id="borrower" defaultValue={item.borrower} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="role">User Role</Label>
                <Select defaultValue={item.role}>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Faculty">Faculty</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Loan Status</Label>
                <Select defaultValue={item.status}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Borrowed">Borrowed</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                      <SelectItem value="Returned">Returned</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="date">Issue Date</Label>
                <Input id="date" type="date" defaultValue={item.date} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" defaultValue={item.dueDate} />
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button
            onClick={() => {
              toast.success(
                "Transaction structural amendments updated successfully.",
              );
            }}
          >
            Save Log Changes
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Close View</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}