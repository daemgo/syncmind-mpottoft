import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getDictOptions } from "@/lib/dict"

// --- Public types ---

export interface FormField {
  key: string
  label: string
  type: "text" | "textarea" | "number" | "select" | "date"
  /** For select type: dict ID to load options */
  dictId?: string
  required?: boolean
  placeholder?: string
}

interface FormDialogProps<T> {
  /** Entity display name (e.g. "客户", "商机") */
  entityName: string
  fields: FormField[]
  /** undefined = create mode, object = edit mode (pre-fill) */
  data?: T
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (formData: Record<string, string>) => void
}

// --- Component ---

export function FormDialog<T extends Record<string, unknown>>({
  entityName,
  fields,
  data,
  open,
  onOpenChange,
  onSubmit,
}: FormDialogProps<T>) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const isEdit = !!data

  // Sync form state when dialog opens
  useEffect(() => {
    if (open) {
      if (data) {
        const initial: Record<string, string> = {}
        fields.forEach((f) => {
          initial[f.key] = String(data[f.key] ?? "")
        })
        setFormData(initial)
      } else {
        setFormData({})
      }
    }
  }, [open, data, fields])

  function updateField(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit() {
    onSubmit?.(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑" : "新建"}{entityName}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {fields.map((field) => (
            <div key={field.key} className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-sm">
                {field.required && <span className="mr-0.5 text-destructive">*</span>}
                {field.label}
              </Label>
              <div className="col-span-3">
                {field.type === "text" && (
                  <Input
                    value={formData[field.key] ?? ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder ?? `请输入${field.label}`}
                  />
                )}
                {field.type === "textarea" && (
                  <Textarea
                    value={formData[field.key] ?? ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder ?? `请输入${field.label}`}
                    rows={3}
                  />
                )}
                {field.type === "number" && (
                  <Input
                    type="number"
                    value={formData[field.key] ?? ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder ?? `请输入${field.label}`}
                  />
                )}
                {field.type === "select" && (
                  <Select
                    value={formData[field.key] ?? ""}
                    onValueChange={(v) => updateField(field.key, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder ?? `请选择${field.label}`} />
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
                    value={formData[field.key] ?? ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
