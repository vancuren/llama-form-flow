"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { PDFUpload } from "@/components/pdf-upload"
import { PDFViewer } from "@/components/pdf-viewer"
import { ChatBox } from "@/components/chat-box"
import { Header } from "@/components/header"
import { ProgressBar } from "@/components/progress-bar"
import { FieldSummary } from "@/components/field-summary"
import { SettingsPanel } from "@/components/settings-panel"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export type Message = {
  role: "assistant" | "user"
  content: string
}

export type FieldBoundingBox = {
  inputfield: string
  label: string
  normalized_label: string
  bounding_box: [number, number, number, number]
  context: string
  page: number
  document_name: string
  inputfield_type: string
  inputfield_confidence: number
}

export type FormField = {
  name: string
  label: string
  filled: boolean
  value?: string
  page: number
  bounding_box: [number, number, number, number]
}

export type AssistantTone = "friendly" | "formal" | "expert"

const API_BASE = "https://api.getformflow.app"

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 seconds timeout
  headers: {
    Accept: "application/json",
  },
})

export function FormFlowApp() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [fieldCount, setFieldCount] = useState<number>(0)
  const [renderUrl, setRenderUrl] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [lastAssistantMessage, setLastAssistantMessage] = useState<string>("")
  const [currentField, setCurrentField] = useState<FieldBoundingBox | null>(null)
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [totalSteps, setTotalSteps] = useState<number>(0)
  const [currentStepName, setCurrentStepName] = useState<string>("")
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [completedFields, setCompletedFields] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [showFieldSummary, setShowFieldSummary] = useState<boolean>(false)
  const [assistantTone, setAssistantTone] = useState<AssistantTone>("friendly")
  const [formName, setFormName] = useState<string>("")
  const { toast } = useToast()

  // check if the request has query params
  const searchParams = useSearchParams()
  const sessionIdParam = searchParams.get("session_id")

  useEffect(() => {
    if (sessionIdParam) {
      const restore = async () => {
          const response = await api.get(`/form/restore`, {
            params: { session_id: sessionIdParam },
          })
          console.log("Restor response:", response.status, response.statusText)

          const data = response.data
          setSessionId(data.session_id)
          setFieldCount(data.field_count)
          setTotalSteps(data.field_count)

          // Initialize form fields
          if (data.fields) {
          console.log(data.fields[0].document_name)
            setFormName(data.fields[0].document_name);
            const initialFields = data.fields.map((field: any) => ({
              name: field.label,
              label:field.normalized_label ||field.label || field.inputfield,
              filled: false,
              page: field.page || 1,
              bounding_box: field.bounding_box,
            }))
            setFormFields(initialFields)
            setTotalPages(Math.max(...initialFields.map((f: FormField) => f.page), 1))
          }
          setRenderUrl(`${API_BASE}/form/render?session_id=${sessionIdParam}`)
          await getFirstQuestion()
          await getNextQuestion(sessionIdParam, "")
          setIsLoading(false)
      }

      restore()
    }
  }, [sessionIdParam])

    


  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    try {
      console.log("Starting file upload...", file.name, file.type, file.size)

      const formData = new FormData()
      formData.append("file", file)

      console.log("Making request to:", `${API_BASE}/form/start`)

      const response = await api.post("/form/start", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      console.log("Response received:", response.status, response.statusText)

      const data = response.data
      console.log("Response data:", data)

      setSessionId(data.session_id)
      setFieldCount(data.field_count)
      setTotalSteps(data.field_count)

      // Initialize form fields
      if (data.fields) {
        setFormName(data.fields[0].document_name);
        const initialFields = data.fields.map((field: any) => ({
          name: field.label,
          label: field.normalized_label || field.label || field.inputfield,
          filled: false,
          page: field.page || 1,
          bounding_box: field.bounding_box,
        }))
        setFormFields(initialFields)
        setTotalPages(Math.max(...initialFields.map((f: FormField) => f.page), 1))
      }

      // Get the rendered form image
      setRenderUrl(`${API_BASE}/form/render?session_id=${data.session_id}`)

      // Start the chat flow
      await getFirstQuestion()
      await getNextQuestion(data.session_id, "")
    } catch (error) {
      console.error("Upload error details:", error)

      if (axios.isAxiosError(error)) {
        const errorMessage = error.response ? `Error ${error.response.status}: ${error.response.data}` : error.message

        toast({
          title: "Upload Error",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Upload Error",
          description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getFirstQuestion = async () => {
        const assistantMessage = { 
                role: "assistant" as const, 
                content: `Hi there! I'm here to help you with your form. It looks like you're filling out the 
                ${formName}. I'll help you fill it out step by step. Feel free to switch langugages or ask me questions
                about specific fields or the form as a whole.
                ` 
        }
        setMessages((prev) => [...prev, assistantMessage])
        // setLastAssistantMessage(data.prompt)
  }

  const getNextQuestion = async (currentSessionId: string, lastResponse: string) => {
    try {
      console.log("Getting next question for session:", currentSessionId)
      console.log("Last assistant message:", lastResponse)

      const response = await api.get(`/form/next`, {
        params: { 
          session_id: currentSessionId, last_response: lastResponse
        },
      })

      console.log("Next question response:", response.status, response.statusText)

      const data = response.data
      console.log("Next question data:", data)

      if (data.prompt) {
        const assistantMessage = { role: "assistant" as const, content: data.prompt }
        setMessages((prev) => [...prev, assistantMessage])
        setLastAssistantMessage(data.prompt)
      }

      // Check if field data is available and set it for highlighting
      if (data.field) {
        setCurrentField(data.field)
        setCurrentStep((prev) => prev + 1)
        setCurrentStepName(data.field.label || data.field.inputfield)

        // Update current page if needed
        if (data.field.page) {
          setCurrentPage(data.field.page)
        }
      } else {
        setCurrentField(null)
      }

    } catch (error) {
      console.error("Error getting next question:", error)

      if (axios.isAxiosError(error)) {
        const errorMessage = error.response ? `Error ${error.response.status}: ${error.response.data}` : error.message

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to get next question",
          variant: "destructive",
        })
      }
    }
  }

  const handleSendMessage = async (text: string) => {
    if (!sessionId || isProcessing) return

    // Add user message immediately
    const userMessage = { role: "user" as const, content: text }
    setMessages((prev) => [...prev, userMessage])
    setIsProcessing(true)

    try {
      console.log("Sending message:", text, "for session:", sessionId)

      const response = await api.post("/form/respond", {
        session_id: sessionId,
        user_input: text,
        last_response: lastAssistantMessage,
        tone: assistantTone, // Send the selected tone to the API
      })

      console.log("Response received:", response.status, response.statusText)

      const data = response.data
      console.log("Response data:", data)

      // Handle validation errors
      if (data.error) {
        const errorMessage = { role: "assistant" as const, content: data.error }
        setMessages((prev) => [...prev, errorMessage])
        setLastAssistantMessage(data.error)
        setCurrentField(null) // Clear highlight on error
        return
      }

      // Update field status if a field was filled
      if (data.next && currentField) {
        console.log("Updating field status for:", currentField.label, "with value:", text)
        setFormFields((prev) =>
          prev.map((field) =>
            field.name === currentField.label ? { ...field, filled: true, value: text } : field,
          ),
        )
        setCompletedFields((prev) => prev + 1)
      }

      // Handle follow-up messages
      if (data.followup) {
        const followupMessage = { role: "assistant" as const, content: data.followup }
        setMessages((prev) => [...prev, followupMessage])
        setLastAssistantMessage(data.followup)
      }

      // Check if we're done
      if (data.done) {
        const doneMessage = { role: "assistant" as const, content: "You're all done! 🎉" }
        setMessages((prev) => [...prev, doneMessage])
        setIsDone(true)
        setCurrentField(null) // Clear highlight when done
        return
      }

      // Get next question if available
      if (data.next) {
        await getNextQuestion(sessionId, text)
      }
    } catch (error) {
      console.error("Error sending message:", error)

      if (axios.isAxiosError(error)) {
        const errorMessage = error.response ? `Error ${error.response.status}: ${error.response.data}` : error.message

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGoBack = () => {
    // Remove the last user message and assistant response
    if (messages.length >= 2) {
      const newMessages = [...messages]
      newMessages.pop() // Remove assistant response
      newMessages.pop() // Remove user message
      setMessages(newMessages)

      // Set the last assistant message
      const lastMessage = newMessages[newMessages.length - 1]
      if (lastMessage && lastMessage.role === "assistant") {
        setLastAssistantMessage(lastMessage.content)
      }

      // Decrement step if possible
      if (currentStep > 1) {
        setCurrentStep((prev) => prev - 1)
      }

      // Update completed fields count if needed
      if (completedFields > 0) {
        setCompletedFields((prev) => prev - 1)
      }
    }
  }

  const handleFieldClick = (fieldName: string) => {
    // Find the field in the form fields
    const field = formFields.find((f) => f.name === fieldName)
    if (field && field.page) {
      setCurrentPage(field.page)
    }

    // TODO: Navigate to this field in the form flow
    toast({
      title: "Field Navigation",
      description: `Navigating to field: ${fieldName}`,
    })
  }

  const handleRestart = () => {
    setSessionId(null)
    setFieldCount(0)
    setRenderUrl(null)
    setMessages([])
    setIsLoading(false)
    setIsProcessing(false)
    setIsDone(false)
    setLastAssistantMessage("")
    setCurrentField(null)
    setCurrentStep(0)
    setTotalSteps(0)
    setCurrentStepName("")
    setFormFields([])
    setCompletedFields(0)
    setCurrentPage(1)
    setTotalPages(1)
  }

  const handleDownload = async () => {
    if (!sessionId) return

    try {
      // In a real implementation, you'd call an API to get the filled PDF
      toast({
        title: "Download",
        description: "Download functionality would be implemented here",
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download Error",
        description: "Failed to download filled form",
        variant: "destructive",
      })
    }
  }

  const toggleSettings = () => {
    setShowSettings(!showSettings)
    if (showFieldSummary) setShowFieldSummary(false)
  }

  const toggleFieldSummary = () => {
    setShowFieldSummary(!showFieldSummary)
    if (showSettings) setShowSettings(false)
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      <Header onDownload={handleDownload} onSettings={toggleSettings} onFieldSummary={toggleFieldSummary} />

      {sessionId && (
        <div className="px-4 py-2 border-b border-gray-800 bg-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-white">
                Step {currentStep} of {totalSteps}: {currentStepName}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {messages.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  ← Go Back
                </Button>
              )}
            </div>
          </div>
          <ProgressBar current={currentStep} total={totalSteps} />
        </div>
      )}

      {!sessionId ? (
        <div className="flex-1 flex items-center justify-center">
          <PDFUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-1/2 h-full flex flex-col min-h-0">
            <ChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
              isDone={isDone}
              assistantTone={assistantTone}
            />
          </div>
          <div className="w-full md:w-1/2 h-full relative">
            <PDFViewer
              renderUrl={renderUrl}
              fieldCount={fieldCount}
              currentField={currentField}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              fields={formFields}
            />

            {showSettings && (
              <SettingsPanel
                assistantTone={assistantTone}
                onToneChange={setAssistantTone}
                onClose={() => setShowSettings(false)}
              />
            )}

            {showFieldSummary && (
              <FieldSummary
                fields={formFields}
                completedCount={completedFields}
                totalCount={totalSteps}
                onFieldClick={handleFieldClick}
                onClose={() => setShowFieldSummary(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
