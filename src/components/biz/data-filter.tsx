import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { getDictOptions } from "@/lib/dict"

// --- Public types ---

export interface FilterField {
  key: string
  label: string
  type: "text" | "select" | "date"
  /** For select type: dict ID to load options */
  dictId?: string
  placeholder?: string
}

interface DataFilterProps {
  fields: FilterField[]
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
}

// --- Component ---

export function DataFilter({ fields, values, onChange }: DataFilterProps) {
  const hasValues = Object.values(values).some((v) => v !== "")

  function updateField(key: string, value: string) {
    onChange({ ...values, [key]: value })
  }

  function reset() {
    onChange({})
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      {fields.map((field) => (
        <div key={field.key} className="flex min-w-[160px] flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
          {field.type === "text" && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={values[field.key] ?? ""}
                onChange={(e) => updateField(field.key, e.target.value)}
                placeholder={field.placeholder ?? `搜索${field.label}`}
                className="h-9 pl-8"
              />
            </div>
          )}
          {field.type === "select" && (
            <Select value={values[field.key] ?? ""} onValueChange={(v) => updateField(field.key, v)}>
              <SelectTrigger size="sm" className="h-9">
                <SelectValue placeholder={field.placeholder ?? `选择${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.dictId &&
                  getDictOptions(field.dictId).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
          {field.type === "date" && (
            <Input
              type="date"
              value={values[field.key] ?? ""}
              onChange={(e) => updateField(field.key, e.target.value)}
              className="h-9"
            />
          )}
        </div>
      ))}
      {hasValues && (
        <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={reset}>
          <X className="mr-1 h-3.5 w-3.5" />
          重置
        </Button>
      )}
    </div>
  )
}
