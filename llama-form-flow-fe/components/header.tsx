"use client"

import { Download, Settings, List, Maximize, Minimize } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onDownload?: () => void
  onSettings?: () => void
  onFieldSummary?: () => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

export function Header({ onDownload, onSettings, onFieldSummary, isFullscreen, onToggleFullscreen }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 bg-black border-b border-gray-800">
      <div className="flex items-center">
        <h1 className="text-white text-xl font-semibold">Llama 4 Form Flow</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {onFieldSummary && (
            <Button variant="ghost" size="icon" onClick={onFieldSummary} className="p-2 rounded-md hover:bg-gray-800">
              <List className="h-5 w-5 text-white" />
            </Button>
          )}
          {onSettings && (
            <Button variant="ghost" size="icon" onClick={onSettings} className="p-2 rounded-md hover:bg-gray-800">
              <Settings className="h-5 w-5 text-white" />
            </Button>
          )}
          {onToggleFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFullscreen}
              className="p-2 rounded-md hover:bg-gray-800"
            >
              {isFullscreen ? <Minimize className="h-5 w-5 text-white" /> : <Maximize className="h-5 w-5 text-white" />}
            </Button>
          )}
          {onDownload && (
            <Button variant="ghost" size="icon" onClick={onDownload} className="p-2 rounded-md hover:bg-gray-800">
              <Download className="h-5 w-5 text-white" />
            </Button>
          )}
          <div className="h-8 w-8 rounded-full bg-green-500"></div>
        </div>
      </div>
    </header>
  )
}
