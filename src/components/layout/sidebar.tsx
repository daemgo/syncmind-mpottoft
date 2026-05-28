import { Link, useLocation } from "@tanstack/react-router"
import { ChevronLeft, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MenuItem {
  label: string
  href: string
  icon: LucideIcon
  /** Optional group label shown above this item (only renders when sidebar is expanded) */
  group?: string
}

interface SidebarProps {
  title: string
  items: MenuItem[]
  collapsed: boolean
  onToggleCollapse?: () => void
  onItemClick?: () => void
}

export function Sidebar({ title, items, collapsed, onToggleCollapse, onItemClick }: SidebarProps) {
  const { pathname } = useLocation()

  // Group items: insert group dividers when group label changes
  let lastGroup: string | undefined

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center border-b px-4">
        {!collapsed && <span className="truncate text-lg font-semibold">{title}</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {items.map((item) => {
          const Icon = item.icon
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          const showGroup = !collapsed && item.group && item.group !== lastGroup
          lastGroup = item.group

          return (
            <div key={item.href}>
              {showGroup && (
                <div className="mb-1 mt-4 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground first:mt-2">
                  {item.group}
                </div>
              )}
              <Link
                to={item.href}
                onClick={onItemClick}
                className={cn(
                  "mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      {onToggleCollapse && (
        <div className="shrink-0 border-t p-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
          </button>
        </div>
      )}
    </aside>
  )
}
