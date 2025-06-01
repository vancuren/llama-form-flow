"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PDFUploadProps {
  onFileUpload: (file: File) => void
  isLoading?: boolean
}

export function PDFUpload({ onFileUpload, isLoading = false }: PDFUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const acceptedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"]

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (acceptedTypes.includes(file.type)) {
        handleFile(file)
      } else {
        alert("Please upload a PDF, PNG, or JPG file.")
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    onFileUpload(file)
  }

  const getFileIcon = () => {
    if (isLoading) {
      return <div className="h-12 w-12 rounded-full border-2 border-t-green-500 animate-spin" />
    }
    return <FileText className="h-12 w-12 text-green-500" />
  }

  return (
    <div
      className={`w-full max-w-md p-8 rounded-lg border-2 border-dashed transition-colors ${
        isDragging ? "border-green-500 bg-gray-900" : "border-gray-700 bg-gray-900"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-4 rounded-full bg-gray-800">{getFileIcon()}</div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-white">
            {isLoading ? "Processing your form..." : "Upload your form"}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {isLoading
              ? "Please wait while we process your file"
              : "Drag and drop your PDF, PNG, or JPG file here, or click to browse"}
          </p>
        </div>
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileInput}
        />
        <Button
          variant="outline"
          onClick={() => document.getElementById("file-upload")?.click()}
          className="flex items-center space-x-2"
          disabled={isLoading}
        >
          <Upload className="h-4 w-4" />
          <span>{isLoading ? "Processing..." : "Select File"}</span>
        </Button>
        <div className="text-xs text-gray-500 text-center">Supported formats: PDF, PNG, JPG</div>
      </div>
    </div>
  )
}
