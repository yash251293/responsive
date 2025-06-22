"use client"

import { ReactNode } from "react"
import { AIMagicPen } from "./ai-magic-pen"
import { cn } from "@/lib/utils"

interface AIFormFieldProps {
  children: ReactNode
  aiProps?: {
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
    disabled?: boolean
  }
  className?: string
  enableAI?: boolean
}

export function AIFormField({ 
  children, 
  aiProps, 
  className = "",
  enableAI = true 
}: AIFormFieldProps) {
  if (!enableAI || !aiProps) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-end">
        <AIMagicPen
          fieldType={aiProps.fieldType}
          fieldName={aiProps.fieldName}
          placeholder={aiProps.placeholder}
          value={aiProps.value}
          onChange={aiProps.onChange}
          context={aiProps.context}
          disabled={aiProps.disabled}
        />
      </div>
      {children}
    </div>
  )
} 