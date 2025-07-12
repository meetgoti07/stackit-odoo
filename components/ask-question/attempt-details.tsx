"use client"

import { Label } from "@/components/ui/label"
import { RichTextEditor } from "../rich-text-editor/rich-text-editor"

interface AttemptDetailsProps {
  value: string
  onChange: (value: string) => void
}

// the atteemp details checked
export function AttemptDetails({ value, onChange }: AttemptDetailsProps) {
  return (
    <div className="space-y-2">
      <Label className="text-base font-semibold">What did you try and what were you expecting?</Label>
      <p className="text-sm text-gray-600">
        Describe what you tried, what you expected to happen, and what actually resulted. Minimum 20 characters.
      </p>
      <RichTextEditor value={value} onChange={onChange} placeholder="it is not working properly" minHeight="200px" />
    </div>
  )
}
