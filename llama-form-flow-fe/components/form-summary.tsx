"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FormSummaryProps {
  formFields: Record<string, string>
  onEditField: (fieldName: string) => void
  onGeneratePDF: () => void
  onRestart: () => void
}

export function FormSummary({ formFields, onEditField, onGeneratePDF, onRestart }: FormSummaryProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Form Summary</h2>
          <Button variant="ghost" size="icon" onClick={onRestart}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {Object.entries(formFields).length > 0 ? (
            Object.entries(formFields).map(([field, value]) => (
              <div key={field} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">{field}</p>
                  <p className="text-sm text-white">{value}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => onEditField(field)}>
                  Edit
                </Button>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center">No fields completed yet</p>
          )}
        </div>

        <div className="mt-6 space-y-2">
          <Button className="w-full bg-green-600 hover:bg-green-700" onClick={onGeneratePDF}>
            Generate PDF
          </Button>
          <Button variant="outline" className="w-full" onClick={onRestart}>
            Start Over
          </Button>
        </div>
      </div>
    </div>
  )
}
