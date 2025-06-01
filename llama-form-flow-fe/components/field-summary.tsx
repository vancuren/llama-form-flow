"use client"

import { X, Check, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FormField } from "@/components/form-flow-app"

interface FieldSummaryProps {
  fields: FormField[]
  completedCount: number
  totalCount: number
  onFieldClick: (fieldName: string) => void
  onClose: () => void
}

export function FieldSummary({ fields, completedCount, totalCount, onFieldClick, onClose }: FieldSummaryProps) {
  return (
    <div className="absolute top-0 right-0 bottom-0 w-full md:w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto z-10">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h3 className="text-lg font-medium text-white">Form Progress</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">
            {completedCount} of {totalCount} fields completed
          </p>
          <div className="w-full h-2 bg-gray-800 rounded-full">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Remaining ({totalCount - completedCount})</h4>
          {fields
            .filter((field) => !field.filled)
            .map((field) => (
              <div
                key={field.name}
                className="flex items-center p-2 hover:bg-gray-800 rounded-md cursor-pointer mb-1"
                onClick={() => onFieldClick(field.name)}
              >
                <Circle className="h-4 w-4 text-gray-500 mr-2" />
                <div>
                  <p className="text-sm text-white">{field.label}</p>
                  <p className="text-xs text-gray-500">Not filled</p>
                </div>
              </div>
            ))}
        </div>

        {completedCount > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Completed ({completedCount})</h4>
            {fields
              .filter((field) => field.filled)
              .map((field) => (
                <div
                  key={field.name}
                  className="flex items-center p-2 hover:bg-gray-800 rounded-md cursor-pointer mb-1"
                  onClick={() => onFieldClick(field.name)}
                >
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <div>
                    <p className="text-sm text-white">{field.label}</p>
                    <p className="text-xs text-gray-500">{field.value || "Filled"}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
