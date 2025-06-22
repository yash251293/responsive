"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils" // Should resolve to Final UI/lib/utils.ts
import { CheckIcon, UserIcon, HeartIcon, SettingsIcon, FileTextIcon, SparklesIcon, BuildingIcon } from "lucide-react"
// No useState needed in this component based on the provided code.
// import { useState } from "react"

const getIndividualSteps = (userType: string) => [
  {
    name: "Verify Email",
    href: `/auth/onboarding/verify-email?type=${userType}`, // Prepended /auth
    shortName: "Email",
    icon: SparklesIcon,
    description: "Confirm your account"
  },
  {
    name: "Profile",
    href: `/auth/onboarding/profile?type=${userType}`, // Prepended /auth
    shortName: "Profile",
    icon: UserIcon,
    description: "Basic information"
  },
  {
    name: "Preferences",
    href: `/auth/onboarding/preferences?type=${userType}`, // Prepended /auth
    shortName: "Preferences",
    icon: SettingsIcon,
    description: "Job preferences"
  },
  {
    name: "Culture",
    href: `/auth/onboarding/culture?type=${userType}`, // Prepended /auth
    shortName: "Culture",
    icon: HeartIcon,
    description: "Work culture fit"
  },
  {
    name: "Resume/CV",
    href: `/auth/onboarding/resume?type=${userType}`, // Prepended /auth
    shortName: "Resume",
    icon: FileTextIcon,
    description: "Upload documents"
  },
  {
    name: "Complete",
    href: `/auth/onboarding/done?type=${userType}`, // Prepended /auth
    shortName: "Done",
    icon: CheckIcon,
    description: "All set!"
  },
]

const getCompanySteps = (userType: string) => [
  {
    name: "Verify Email",
    href: `/auth/onboarding/verify-email?type=${userType}`, // Prepended /auth
    shortName: "Email",
    icon: SparklesIcon,
    description: "Confirm your account"
  },
  {
    name: "Company Profile",
    href: `/auth/onboarding/profile?type=${userType}`, // Prepended /auth
    shortName: "Profile",
    icon: BuildingIcon,
    description: "Company information"
  },
  {
    name: "Preferences",
    href: `/auth/onboarding/preferences?type=${userType}`, // Prepended /auth
    shortName: "Preferences",
    icon: SettingsIcon,
    description: "Hiring preferences"
  },
  {
    name: "Complete",
    href: `/auth/onboarding/done?type=${userType}`, // Prepended /auth
    shortName: "Done",
    icon: CheckIcon,
    description: "All set!"
  },
]

export function OnboardingStepper() {
  const pathname = usePathname() // e.g., /auth/onboarding/profile
  const searchParams = useSearchParams()
  const userTypeQueryParam = searchParams.get('type') as 'company' | 'individual' | null;

  // Fallback to 'individual' if type is not present or invalid.
  // Consider if a more robust handling is needed (e.g., redirect if type is missing/invalid).
  const userType = (userTypeQueryParam && ['company', 'individual'].includes(userTypeQueryParam))
                   ? userTypeQueryParam
                   : 'individual';

  const stepsData = userType === 'company' ? getCompanySteps(userType) : getIndividualSteps(userType)

  const currentStepIndex = stepsData.findIndex((step) => {
    // The step.href already includes /auth, so direct comparison is fine.
    const stepPath = step.href.split('?')[0] // e.g., /auth/onboarding/profile
    return pathname === stepPath || pathname.startsWith(stepPath + "/"); // Handle potential sub-routes if any
  })

  return (
    <div className="w-full max-w-3xl mx-auto px-4 mb-12">
      <div className="relative flex items-center justify-between mb-2">
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
                href={step.href} // These hrefs now correctly point to /auth/onboarding/...
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
