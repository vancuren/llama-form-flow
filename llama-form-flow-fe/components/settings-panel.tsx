"use client"

import { X, User, Briefcase, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AssistantTone } from "@/components/form-flow-app"

interface SettingsPanelProps {
  assistantTone: AssistantTone
  onToneChange: (tone: AssistantTone) => void
  onClose: () => void
}

export function SettingsPanel({ assistantTone, onToneChange, onClose }: SettingsPanelProps) {
  return (
    <div className="absolute top-0 right-0 bottom-0 w-full md:w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto z-10">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h3 className="text-lg font-medium text-white">Settings</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        <h4 className="text-sm font-medium text-white mb-2">Assistant Tone</h4>
        <p className="text-xs text-gray-400 mb-4">Choose how you'd like the AI assistant to communicate with you</p>

        <div className="space-y-3">
          <div
            className={`p-3 rounded-lg border ${
              assistantTone === "friendly" ? "border-green-500 bg-gray-800" : "border-gray-700 hover:border-gray-600"
            } cursor-pointer`}
            onClick={() => onToneChange("friendly")}
          >
            <div className="flex items-center mb-2">
              <User className="h-5 w-5 text-green-500 mr-2" />
              <h5 className="font-medium text-white">Friendly</h5>
            </div>
            <p className="text-xs text-gray-400">Casual and approachable conversation</p>
            <p className="text-xs text-gray-300 mt-2 italic">
              "Hi there! Let's make this easy - what's your full name?"
            </p>
          </div>

          <div
            className={`p-3 rounded-lg border ${
              assistantTone === "formal" ? "border-blue-500 bg-gray-800" : "border-gray-700 hover:border-gray-600"
            } cursor-pointer`}
            onClick={() => onToneChange("formal")}
          >
            <div className="flex items-center mb-2">
              <Briefcase className="h-5 w-5 text-blue-500 mr-2" />
              <h5 className="font-medium text-white">Formal</h5>
            </div>
            <p className="text-xs text-gray-400">Professional and structured approach</p>
            <p className="text-xs text-gray-300 mt-2 italic">
              "Good day. Please provide your full legal name for the form."
            </p>
          </div>

          <div
            className={`p-3 rounded-lg border ${
              assistantTone === "expert" ? "border-purple-500 bg-gray-800" : "border-gray-700 hover:border-gray-600"
            } cursor-pointer`}
            onClick={() => onToneChange("expert")}
          >
            <div className="flex items-center mb-2">
              <GraduationCap className="h-5 w-5 text-purple-500 mr-2" />
              <h5 className="font-medium text-white">Expert</h5>
            </div>
            <p className="text-xs text-gray-400">Detailed explanations with helpful tips</p>
            <p className="text-xs text-gray-300 mt-2 italic">
              "For optimal form completion, I need your full name as it appears on your Social Security card."
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-800">
        <h4 className="text-sm font-medium text-white mb-2">Other Preferences</h4>

        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-300">Auto-save responses</span>
          <div className="w-10 h-5 bg-gray-700 rounded-full relative">
            <div className="absolute left-1 top-1 w-3 h-3 bg-gray-400 rounded-full"></div>
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-300">Enable keyboard shortcuts</span>
          <div className="w-10 h-5 bg-green-900 rounded-full relative">
            <div className="absolute right-1 top-1 w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
