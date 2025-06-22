import type React from "react"
import { Suspense } from "react"
import { Logo } from "@/components/logo" // This should resolve to Final UI/components/logo.tsx
import { OnboardingStepperWrapper } from "@/components/onboarding-stepper-wrapper" // This will point to the new wrapper

// Loading fallback for onboarding pages
function OnboardingFallback() {
  return (
    <div className="min-h-screen bg-brand-bg-light-gray py-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg-light-gray">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Logo />
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add the Stepper Wrapper here */}
        <OnboardingStepperWrapper />
        <div className="mt-12">
          <Suspense fallback={<OnboardingFallback />}>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  )
}
