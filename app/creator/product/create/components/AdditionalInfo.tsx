'use client'

import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ChevronDown, X, Plus } from 'lucide-react'
import React from "react"
import { useState } from 'react'

interface AdditionalInfoField {
  name: string
  value: string
}

interface AdditionalInfoProps {
  data: Record<string, string | number>
  onChange: (data: Record<string, string | number>) => void
}

const FIXED_FIELDS = [
  { key: 'color', label: 'Color', type: 'text', placeholder: 'e.g., Black, Blue' },
  { key: 'size', label: 'Size', type: 'number', placeholder: 'e.g., 42' },
  { key: 'length', label: 'Length', type: 'number', placeholder: 'e.g., 100' },
  { key: 'width', label: 'Width', type: 'number', placeholder: 'e.g., 50' },
  { key: 'height', label: 'Height', type: 'number', placeholder: 'e.g., 200' },
  { key: 'batteryHealth', label: 'Battery Health (%)', type: 'number', placeholder: 'e.g., 85', max: 100 },
  { key: 'repairs', label: 'Repairs (count)', type: 'number', placeholder: 'e.g., 2', min: 0 },
  { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Unisex'] },
]

export function AdditionalInfo({ data, onChange }: AdditionalInfoProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [fields, setFields] = useState<AdditionalInfoField[]>([])
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')

  const handleFieldChange = (key: string, value: string | number) => {
    const updatedData = {
      ...data,
      [key]: value === '' ? '' : value,
    }
    onChange(updatedData)
  }

  const handleRemoveField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index)
    setFields(updatedFields)
    updateData(updatedFields)
  }

  const updateData = (updatedFields: AdditionalInfoField[]) => {
    const dataObj = updatedFields.reduce(
      (acc, field) => {
        acc[field.name] = field.value
        return acc
      },
      {} as Record<string, string>
    )
    onChange(dataObj)
  }

  const handleAddField = () => {
    if (newFieldName && newFieldValue) {
      setFields([...fields, { name: newFieldName, value: newFieldValue }])
      setNewFieldName('')
      setNewFieldValue('')
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium text-foreground">Additional Information</span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <Card className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Information may be used to filter products by users.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIXED_FIELDS.map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="text-sm font-medium">{field.label}</label>
                {field.type === 'select' ? (
                  <div className="relative">
                    <select
                      value={data[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select {field.label.toLowerCase()}</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                ) : (
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={data[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    min={field.min}
                    max={field.max}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
