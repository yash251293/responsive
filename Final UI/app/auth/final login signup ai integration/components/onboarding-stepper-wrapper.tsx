"use client"

import { Suspense } from "react"
import { OnboardingStepper } from "./onboarding-stepper"

// Fallback component for loading state
function StepperSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 mb-12">
      <div className="relative flex items-center justify-between mb-2">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 z-0" />
        {[1, 2, 3, 4].map((idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center">
            <div className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full border-2 bg-white border-gray-300">
              <span className="font-bold text-base text-gray-400">{idx}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex mt-1">
        {['Step 1', 'Step 2', 'Step 3', 'Step 4'].map((step, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center">
            <span className="text-xs font-medium text-center text-gray-400">
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function OnboardingStepperWrapper() {
  return (
    <Suspense fallback={<StepperSkeleton />}>
      <OnboardingStepper />
    </Suspense>
  )
} 