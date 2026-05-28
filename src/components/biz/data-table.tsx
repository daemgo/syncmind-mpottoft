import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { getDictLabel, getDictColor, getBadgeClassName } from "@/lib/dict"
import { cn } from "@/lib/utils"

// --- Public types ---

export interface ColumnConfig<T> {
  key: keyof T & string
  label: string
  /** Determines cell rendering: badge (colored), money (¥ formatted), date, mono (monospace) */
  type?: "text" | "badge" | "money" | "date" | "mono"
  /** For badge columns: dict ID to look up label + color */
  dictId?: string
  align?: "left" | "center" | "right"
  /** Escape hatch: custom cell renderer overrides type-based rendering */
  render?: (value: T[keyof T & string], row: T) => React.ReactNode
}

interface DataTableProps<T extends { id: string }> {
  columns: ColumnConfig<T>[]
  data: T[]
  onView?: (item: T) => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  /** Empty state message */
  emptyText?: string
}

// --- Helpers ---

function formatMoney(value: number): string {
  return `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function renderCellContent<T extends { id: string }>(row: T, col: ColumnConfig<T>) {
  const value = row[col.key]

  // Custom renderer takes priority
  if (col.render) return col.render(value, row)

  switch (col.type) {
    case "badge": {
      const strVal = String(value ?? "")
      const label = col.dictId ? getDictLabel(col.dictId, strVal) : strVal
      const color = col.dictId ? getDictColor(col.dictId, strVal) : undefined
      return (
        <Badge variant="outline" className={cn("border font-medium", getBadgeClassName(color))}>
          {label}
        </Badge>
      )
    }
    case "money":
      return (
        <span className="tabular-nums">
          {formatMoney(Number(value ?? 0))}
        </span>
      )
    case "date":
      return <span className="text-muted-foreground">{String(value ?? "")}</span>
    case "mono":
      return <span className="font-mono text-xs">{String(value ?? "")}</span>
    default:
      return String(value ?? "")
  }
}

// --- Component ---

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onView,
  onEdit,
  onDelete,
  emptyText = "暂无数据",
}: DataTableProps<T>) {
  const hasActions = !!(onView || onEdit || onDelete)

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={cn(col.align === "right" && "text-right")}>
                {col.label}
              </TableHead>
            ))}
            {hasActions && <TableHead className="w-12" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (hasActions ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn(col.align === "right" && "text-right")}>
                    {renderCellContent(row, col)}
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && <DropdownMenuItem onClick={() => onView(row)}>查看</DropdownMenuItem>}
                        {onEdit && <DropdownMenuItem onClick={() => onEdit(row)}>编辑</DropdownMenuItem>}
                        {onDelete && (
                          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(row)}>
                            删除
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
