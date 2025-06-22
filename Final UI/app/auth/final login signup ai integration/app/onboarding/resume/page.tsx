"use client"

import { Button } from "@/components/ui/button"
import { UploadCloudIcon } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { OnboardingStepperWrapper } from "@/components/onboarding-stepper-wrapper"

export default function ResumePage() {
  const searchParams = useSearchParams()
  const userType = searchParams.get('type') || 'individual'

  return (
    <div className="min-h-screen bg-brand-bg-light-gray py-8">
      <OnboardingStepperWrapper />
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md text-center relative">
        <Button
          className="absolute top-4 right-4 border-2 border-primary-navy bg-transparent text-primary-navy hover:bg-primary-navy hover:text-white focus:bg-primary-navy focus:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-navy rounded-xl font-subheading"
          asChild
        >
          <Link href={`/onboarding/done?type=${userType}`}>Skip</Link>
        </Button>

        <h1 className="text-2xl font-bold text-brand-text-dark mb-2">Upload your resume, CV, or portfolio</h1>
        <p className="text-brand-text-medium mb-8">
          Showcase your work by uploading a resume, CV, or portfolio to complete your profile.
        </p>

        <div className="border-2 border-dashed border-brand-border rounded-lg p-10 sm:p-16 mb-6">
          <UploadCloudIcon className="mx-auto h-12 w-12 text-brand-text-light mb-4" />
          <p className="text-sm text-brand-text-medium mb-4">
            Upload your resume, CV, or portfolio as a .pdf, .doc, .docx, .rtf, .wp or .txt file
          </p>
          <Button className="bg-black hover:bg-gray-900 text-white font-medium">Upload File</Button>
        </div>

        <Button
          className="w-full bg-black hover:bg-gray-900 text-white font-medium"
          asChild
        >
          <Link href={`/onboarding/done?type=${userType}`}>Continue</Link>
        </Button>
      </div>
    </div>
  )
}
