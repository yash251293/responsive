"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  WandIcon, 
  SparklesIcon,
  BrainIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AIAssistantModal } from "./ai-assistant-modal"

interface AIMagicPenProps {
  fieldType: 'text' | 'textarea' | 'list' | 'experience' | 'education'
  fieldName: string
  placeholder: string
  value: string | string[]
  onChange: (value: string | string[]) => void
  context?: {
    userType?: 'individual' | 'company'
    role?: string
    industry?: string
    experience?: string
    skills?: string[]
    existingContent?: string
  }
  className?: string
  disabled?: boolean
}

export function AIMagicPen({ 
  fieldType, 
  fieldName,
  placeholder, 
  value, 
  onChange, 
  context = {},
  className = "",
  disabled = false
}: AIMagicPenProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className={cn("relative", className)}>
      {/* AI Magic Button */}
      <Button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        style={{
          backgroundColor: 'transparent',
          border: '1px solid #1e3a8a',
          color: '#1e3a8a'
        }}
        className={cn(
          "rounded-xl font-subheading hover:bg-primary-navy hover:text-white",
          "h-9 px-4 text-sm font-medium",
          "transition-all duration-200",
          "flex items-center gap-2"
        )}
      >
        <BrainIcon className="w-4 h-4" />
        <WandIcon className="w-4 h-4" />
        <span>AI Assistant</span>
      </Button>

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fieldType={fieldType}
        fieldName={fieldName}
        currentValue={value}
        onApply={onChange}
        context={context}
      />
    </div>
  )
}

 