"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { CheckIcon, UserIcon, HeartIcon, SettingsIcon, FileTextIcon, SparklesIcon, BuildingIcon } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext";

const AI_INTEGRATION_BASE_PATH = "/auth/ai integration/onboarding";

const individualSteps = [
  {
    name: "Verify Email",
    href: `${AI_INTEGRATION_BASE_PATH}/verify-email`,
    shortName: "Email",
    icon: SparklesIcon,
    description: "Confirm your account"
  },
  {
    name: "Profile",
    href: `${AI_INTEGRATION_BASE_PATH}/profile`,
    shortName: "Profile",
    icon: UserIcon,
    description: "Basic information"
  },
  {
    name: "Preferences",
    href: `${AI_INTEGRATION_BASE_PATH}/preferences`,
    shortName: "Preferences",
    icon: SettingsIcon,
    description: "Job preferences"
  },
  {
    name: "Culture",
    href: `${AI_INTEGRATION_BASE_PATH}/culture`,
    shortName: "Culture",
    icon: HeartIcon,
    description: "Work culture fit"
  },
  {
    name: "Resume/CV",
    href: `${AI_INTEGRATION_BASE_PATH}/resume`,
    shortName: "Resume",
    icon: FileTextIcon,
    description: "Upload documents"
  },
  {
    name: "Complete",
    href: `${AI_INTEGRATION_BASE_PATH}/done`,
    shortName: "Done",
    icon: CheckIcon,
    description: "All set!"
  },
]

const companySteps = [
  {
    name: "Verify Email",
    href: `${AI_INTEGRATION_BASE_PATH}/verify-email`,
    shortName: "Email",
    icon: SparklesIcon,
    description: "Confirm your account"
  },
  {
    name: "Company Profile",
    href: `${AI_INTEGRATION_BASE_PATH}/profile`,
    shortName: "Profile",
    icon: BuildingIcon,
    description: "Company information"
  },
  {
    name: "Preferences",
    href: `${AI_INTEGRATION_BASE_PATH}/preferences`,
    shortName: "Preferences",
    icon: SettingsIcon,
    description: "Hiring preferences"
  },
  {
    name: "Complete",
    href: `${AI_INTEGRATION_BASE_PATH}/done`,
    shortName: "Done",
    icon: CheckIcon,
    description: "All set!"
  },
]

// Helper functions to check step completion based on user data from AuthContext
// These functions now expect `user.is_email_verified` and `user.is_phone_verified`
// and specific profile fields.

const isEmailVerified = (user: any): boolean => {
  if (!user) return false;
  // Primary check for email verification, fallback to phone if that's part of the "contact verified" step.
  return !!user.is_email_verified || !!user.is_phone_verified;
};

const isProfileComplete = (user: any, userType: string | undefined): boolean => {
  if (!user || !userType) return false;
  const profile = user.profile; // Profile data is nested under user.profile
  if (!profile) return false; // If no profile object, it's not complete.

  if (userType === 'individual') {
    // Check for existence of key fields that are typically filled in the profile step.
    return !!(user.full_name && (profile.location || profile.professional_title || profile.bio));
  }
  if (userType === 'company') {
    return !!(user.company_name && (profile.location || profile.company_type || profile.bio));
  }
  return false;
};

const isPreferencesComplete = (user: any, userType: string | undefined): boolean => {
  if (!user?.profile || !userType) return false; // Check user.profile exists
  const profile = user.profile;
  if (userType === 'individual') {
    // Check for at least one preference field being set
    return !!(profile.job_status ||
              (profile.desired_roles && profile.desired_roles.length > 0) ||
              profile.work_arrangement ||
              profile.experience_level_preference ||
              profile.salary_expectation_min || // Check if any salary info is there
              (profile.career_goals && profile.career_goals.length > 0) ||
              (profile.preferred_locations && profile.preferred_locations.length > 0)
            );
  }
  if (userType === 'company') {
    return !!(profile.hiring_status ||
              (profile.offered_employment_types && profile.offered_employment_types.length > 0) || // Check new DB field
              (profile.hiring_roles && profile.hiring_roles.length > 0) ||
              (profile.hiring_locations && profile.hiring_locations.length > 0) ||
              profile.hiring_salary_min
            );
  }
  return false;
};

const isCultureComplete = (user: any, userType: string | undefined): boolean => {
  if (userType !== 'individual' || !user?.profile) return false;
  const profile = user.profile;
  return !!(profile.ideal_next_job_description ||
              (profile.culture_preferences && profile.culture_preferences.length > 0) ||
              profile.remote_policy_importance || // Added checks for other culture fields
              profile.quiet_office_importance
            );
};

const isResumeComplete = (user: any, userType: string | undefined): boolean => {
  if (userType !== 'individual' || !user?.profile) return false;
  return !!user.profile.resume_file_path; // Corrected: user.profile.resume_file_path
};

// Map step hrefs to completion functions
const stepCompletionCheckers: Record<string, (user: any, userType: string | undefined) => boolean> = {
  [`${AI_INTEGRATION_BASE_PATH}/verify-email`]: isEmailVerified,
  [`${AI_INTEGRATION_BASE_PATH}/profile`]: isProfileComplete,
  [`${AI_INTEGRATION_BASE_PATH}/preferences`]: isPreferencesComplete,
  [`${AI_INTEGRATION_BASE_PATH}/culture`]: isCultureComplete,
  [`${AI_INTEGRATION_BASE_PATH}/resume`]: isResumeComplete,
};

export function OnboardingStepper() {
  const pathname = usePathname();
  const { user, isLoading: isAuthLoading } = useAuth();
  // console.log("OnboardingStepper user from useAuth:", JSON.stringify(user, null, 2)); // Keep for debugging if needed
  const userType = user?.user_type;

  if (isAuthLoading) {
    return <div className="text-center text-sm text-gray-500 py-4">Loading steps...</div>; // Or a skeleton loader
  }

  if (!userType || !user) { // Added !user check
    // console.warn("OnboardingStepper: userType or user is undefined. User may not be properly loaded or authenticated.");
    // Avoid rendering stepper if user context isn't ready or userType is missing.
    // Could redirect or show a more specific message if appropriate for the flow.
    return <div className="text-center text-sm text-red-500 py-4">Could not determine user type. Please log in.</div>;
  }

  const stepsData = userType === 'company' ? companySteps : individualSteps;
  const totalDataSteps = stepsData.length - 1; // Exclude the "Complete" step (last step) from counting data steps

  let completedDataStepCount = 0;
  const stepCompletionStates: boolean[] = []; // To store completion status of each data step

  stepsData.forEach((step, idx) => {
    if (idx < totalDataSteps) { // Iterate only through actual data steps, not the "Done" step
      const checker = stepCompletionCheckers[step.href];
      let isComplete = false;
      if (checker) {
        isComplete = checker(user, userType); // Pass user and userType
      }
      stepCompletionStates.push(isComplete);
      if (isComplete) {
        completedDataStepCount++;
      }
    }
  });

  const currentStepIndex = stepsData.findIndex(step => pathname.startsWith(step.href));

  const stepStatuses = stepsData.map((step, idx) => {
    if (idx < totalDataSteps) { // For actual data steps
      if (stepCompletionStates[idx]) return "complete";
      // A step is current if its path matches AND all previous data steps are complete
      // (or it's the first data step and its path matches)
      const previousStepsComplete = idx === 0 || stepCompletionStates.slice(0, idx).every(s => s);
      if (idx === currentStepIndex && previousStepsComplete) return "current";
      return "upcoming";
    } else { // For the "Complete" or "Done" step (idx === totalDataSteps)
      const allDataStepsComplete = completedDataStepCount === totalDataSteps;
      if (allDataStepsComplete) {
        // The "Done" step is current if its path matches AND all data steps are done.
        // It's complete if its path matches AND all data steps are done (effectively same as current for display).
         return pathname.startsWith(step.href) ? "current" : "complete"; // Or just "complete" if all data done
      }
      return "upcoming";
    }
  });

  const progressPercentage = totalDataSteps > 0 ? (completedDataStepCount / totalDataSteps) * 100 : 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 mb-12">
      <div className="relative flex items-center justify-between mb-2">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-black z-0 transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
        {stepsData.map((step, idx) => {
          const status = stepStatuses[idx];
          const isClickable = status === "complete" || status === "current" || (idx > 0 && stepStatuses[idx-1] === "complete");

          return (
            <div key={step.name} className="flex-1 flex flex-col items-center">
              <Link
                href={isClickable ? `${step.href}?type=${userType}` : "#"} // Add userType to link
                className={cn(
                  "relative z-10 flex flex-col items-center group",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black rounded-full",
                   !isClickable ? "pointer-events-none opacity-50" : "cursor-pointer"
                )}
                aria-current={status === "current" ? "step" : undefined}
                onClick={(e) => !isClickable && e.preventDefault()} // Prevent navigation if not clickable
              >
                <div className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all duration-200 group-hover:scale-110",
                  status === "complete" ? "bg-black border-black text-white"
                    : status === "current" ? "bg-white border-black text-black scale-110 ring-2 ring-black ring-offset-1"
                      : "bg-white border-gray-300 text-gray-400"
                )}>
                  {status === "complete" ? <CheckIcon className="w-4 h-4" /> : <span className={cn("font-bold text-xs", status === "current" ? "text-black" : "text-gray-400")}>{idx + 1}</span>}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
      <div className="flex mt-1">
        {stepsData.map((step, idx) => (
          <div key={step.name} className="flex-1 flex flex-col items-center">
            <span
              className={cn(
                "text-xs font-medium text-center",
                stepStatuses[idx] === "complete" || stepStatuses[idx] === "current" ? "text-black" : "text-gray-400"
              )}
            >
              {step.shortName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
