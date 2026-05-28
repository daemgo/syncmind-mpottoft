import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useMobile } from "@/hooks"
import { cn } from "@/lib/utils"
import { Sidebar, type MenuItem } from "./sidebar"

interface AppShellProps {
  title: string
  items: MenuItem[]
  children: React.ReactNode
}

export function AppShell({ title, items, children }: AppShellProps) {
  const isMobile = useMobile()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar
          title={title}
          items={items}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      )}

      {/* Mobile sidebar (Sheet overlay) */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-60 p-0" showCloseButton={false}>
            <Sidebar
              title={title}
              items={items}
              collapsed={false}
              onItemClick={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Mobile top bar */}
      {isMobile && (
        <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-card px-4">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-2 truncate font-semibold">{title}</span>
        </header>
      )}

      {/* Main content */}
      <main
        className={cn(
          "min-h-screen transition-[margin] duration-300",
          !isMobile && (collapsed ? "ml-16" : "ml-60"),
        )}
      >
        {children}
      </main>
    </div>
  )
}
