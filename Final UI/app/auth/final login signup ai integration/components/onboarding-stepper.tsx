"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { CheckIcon, UserIcon, HeartIcon, SettingsIcon, FileTextIcon, SparklesIcon, BuildingIcon } from "lucide-react"
import { useState } from "react"

const getIndividualSteps = (userType: string) => [
  { 
    name: "Verify Email", 
    href: `/onboarding/verify-email?type=${userType}`, 
    shortName: "Email",
    icon: SparklesIcon,
    description: "Confirm your account"
  },
  { 
    name: "Profile", 
    href: `/onboarding/profile?type=${userType}`, 
    shortName: "Profile",
    icon: UserIcon,
    description: "Basic information"
  },
  { 
    name: "Preferences", 
    href: `/onboarding/preferences?type=${userType}`, 
    shortName: "Preferences",
    icon: SettingsIcon,
    description: "Job preferences"
  },
  { 
    name: "Culture", 
    href: `/onboarding/culture?type=${userType}`, 
    shortName: "Culture",
    icon: HeartIcon,
    description: "Work culture fit"
  },
  { 
    name: "Resume/CV", 
    href: `/onboarding/resume?type=${userType}`, 
    shortName: "Resume",
    icon: FileTextIcon,
    description: "Upload documents"
  },
  { 
    name: "Complete", 
    href: `/onboarding/done?type=${userType}`, 
    shortName: "Done",
    icon: CheckIcon,
    description: "All set!"
  },
]

const getCompanySteps = (userType: string) => [
  { 
    name: "Verify Email", 
    href: `/onboarding/verify-email?type=${userType}`, 
    shortName: "Email",
    icon: SparklesIcon,
    description: "Confirm your account"
  },
  { 
    name: "Company Profile", 
    href: `/onboarding/profile?type=${userType}`, 
    shortName: "Profile",
    icon: BuildingIcon,
    description: "Company information"
  },
  { 
    name: "Preferences", 
    href: `/onboarding/preferences?type=${userType}`, 
    shortName: "Preferences",
    icon: SettingsIcon,
    description: "Hiring preferences"
  },
  { 
    name: "Complete", 
    href: `/onboarding/done?type=${userType}`, 
    shortName: "Done",
    icon: CheckIcon,
    description: "All set!"
  },
]

export function OnboardingStepper() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Get userType from URL params, default to 'company' if not specified
  const userType = (searchParams.get('type') as 'company' | 'individual') || 'company'
  const stepsData = userType === 'company' ? getCompanySteps(userType) : getIndividualSteps(userType)
  const currentStepIndex = stepsData.findIndex((step) => {
    // Extract just the pathname part from the step href (remove query parameters)
    const stepPath = step.href.split('?')[0]
    return pathname.startsWith(stepPath)
  })

  // For this example, let's assume email is verified if we are past the verify-email step or on it.
  // In a real app, this would come from user state.
  const emailVerified = currentStepIndex >= 0

  // Calculate progress percentage
  const completedSteps = currentStepIndex >= 0 ? currentStepIndex + 1 : 0
  const progressPercentage = (completedSteps / stepsData.length) * 100

  return (
    <div className="w-full max-w-3xl mx-auto px-4 mb-12">
      {/* Minimal Progress Bar with Dots */}
      <div className="relative flex items-center justify-between mb-2">
        {/* Progress Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 z-0" />
        {stepsData.map((step, idx) => {
          let status = "upcoming"
          if (currentStepIndex > idx) {
            status = "complete"
          } else if (currentStepIndex === idx) {
            status = "current"
          }
          return (
            <div key={step.name} className="flex-1 flex flex-col items-center">
              <Link
                href={step.href}
                className={cn(
                  "relative z-10 flex flex-col items-center group",
                  "focus:outline-none"
                )}
                aria-current={status === "current" ? "step" : undefined}
              >
                <div className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all duration-200",
                  status === "complete"
                    ? "bg-black border-black text-white"
                    : status === "current"
                      ? "bg-white border-black text-black"
                      : "bg-white border-gray-300 text-gray-400"
                )}>
                  <span className={cn(
                    "font-bold text-base",
                    status === "current" ? "text-black" : status === "complete" ? "text-white" : "text-gray-400"
                  )}>{idx + 1}</span>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
      {/* Step Names */}
      <div className="flex mt-1">
        {stepsData.map((step, idx) => (
          <div key={step.name} className="flex-1 flex flex-col items-center">
            <span
              className={cn(
                "text-xs font-medium text-center",
                idx === currentStepIndex ? "text-black" : "text-gray-400"
              )}
            >
              {step.shortName}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
