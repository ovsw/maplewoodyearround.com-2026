"use client";

// The toolbar, sortable headers, filters, column toggle and paging of the
// Camp HQ tables, adapted from shadcnblocks data-table12 (TanStack Table v8).
import type { Column, Table as TableType } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  PlusCircle,
  Search,
  Settings2,
} from "lucide-react";

import { Button } from "@/components/hq-ui/button";
import { Input } from "@/components/hq-ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/hq-ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** What the column definitions carry for these parts. */
export type ColumnMeta = { label: string; className?: string };

export function labelOf<TData, TValue>(column: Column<TData, TValue>) {
  return (column.columnDef.meta as ColumnMeta | undefined)?.label ?? column.id;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: {
  column: Column<TData, TValue>;
  title: string;
}) {
  const sorted = column.getIsSorted();
  if (!column.getCanSort()) {
    return <span className="flex h-8 items-center text-sm font-medium text-foreground">{title}</span>;
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 flex h-8 items-center gap-1.5 px-2 text-sm font-medium text-foreground"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      <span>{title}</span>
      {sorted === "desc" ? (
        <ArrowDown className="size-3.5" />
      ) : sorted === "asc" ? (
        <ArrowUp className="size-3.5" />
      ) : (
        <ChevronsUpDown className="size-3.5 opacity-50" />
      )}
    </Button>
  );
}

export type FacetOption = { value: string; label: string; count: number };

/** A filter by the values of one column, with how many rows have each. */
export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: {
  column: Column<TData, TValue>;
  title: string;
  options: FacetOption[];
}) {
  const selected = new Set((column.getFilterValue() as string[] | undefined) ?? []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle />
          {title}
          {selected.size > 0 ? (
            <>
              <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selected.size}
              </Badge>
              <div className="hidden gap-1 lg:flex">
                {selected.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selected.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selected.has(option.value))
                    .map((option) => (
                      <Badge variant="secondary" key={option.value} className="rounded-sm px-1 font-normal">
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => {
                      const next = new Set(selected);
                      if (isSelected) next.delete(option.value);
                      else next.add(option.value);
                      column.setFilterValue(next.size ? Array.from(next) : undefined);
                    }}
                  >
                    <div
                      className={cn(
                        "flex size-4 items-center justify-center rounded-[4px] border",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input [&_svg]:invisible",
                      )}
                    >
                      <Check className="size-3.5 text-primary-foreground" />
                    </div>
                    <span>{option.label}</span>
                    {option.count ? (
                      <span className="ml-auto font-mono text-xs text-muted-foreground">
                        {option.count}
                      </span>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selected.size > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column.setFilterValue(undefined)}
                    className="justify-center text-center"
                  >
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Shows and hides columns. */
export function DataTableViewOptions<TData>({ table }: { table: TableType<TData> }) {
  const columns = table.getAllColumns().filter((column) => column.getCanHide());
  const hiddenCount = columns.filter((column) => !column.getIsVisible()).length;
  if (columns.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Settings2 />
          <span className="hidden sm:inline">Columns</span>
          {hiddenCount > 0 ? (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1 text-xs">
              {hiddenCount}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Show columns</span>
          {hiddenCount > 0 ? (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => table.resetColumnVisibility()}
              className="h-auto p-1 text-xs"
            >
              Reset
            </Button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
            onSelect={(event) => event.preventDefault()}
          >
            {labelOf(column)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The quick search across every column. */
export function DataTableSearch<TData>({
  table,
  placeholder,
}: {
  table: TableType<TData>;
  placeholder: string;
}) {
  return (
    <div className="relative w-full lg:w-64">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={(table.getState().globalFilter as string | undefined) ?? ""}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        className="h-8 pl-8"
      />
    </div>
  );
}

export function DataTableToolbar<TData>({
  table,
  children,
}: {
  table: TableType<TData>;
  children: React.ReactNode;
}) {
  const filtered =
    table.getState().columnFilters.length > 0 || Boolean(table.getState().globalFilter);
  return (
    <div className="flex flex-row items-center justify-between gap-2 pb-3">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {children}
        {filtered ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter("");
            }}
          >
            Reset
          </Button>
        ) : null}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [25, 50, 100],
}: {
  table: TableType<TData>;
  pageSizeOptions?: number[];
}) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageCount = Math.max(table.getPageCount(), 1);
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        {totalRows === 0
          ? "No rows"
          : `Showing ${startRow} to ${endRow} of ${totalRows} ${totalRows === 1 ? "row" : "rows"}`}
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium whitespace-nowrap">Rows per page</p>
          <Select value={`${pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
            <SelectTrigger size="sm" className="w-[72px]" aria-label="Rows per page">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm font-medium whitespace-nowrap">
          Page {pageIndex + 1} of {pageCount}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to first page"
          >
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to previous page"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Go to next page"
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden lg:flex"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Go to last page"
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
