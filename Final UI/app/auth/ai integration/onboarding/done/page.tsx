"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, SparklesIcon, BuildingIcon, BriefcaseIcon, UsersIcon, StarIcon, Loader2, AlertTriangleIcon, InfoIcon } from "lucide-react";
import { OnboardingStepper } from "@/components/onboarding-stepper";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, Suspense } from "react";

// Re-import or define completion checker functions (ideally from a shared util if they become complex)
// These should be consistent with the logic in OnboardingStepper.tsx
const AI_INTEGRATION_BASE_PATH_DONE = "/auth/ai integration/onboarding";

const isEmailVerifiedDone = (user: any): boolean => {
  if (!user) return false;
  return !!user.is_email_verified || !!user.is_phone_verified;
};
const isProfileCompleteDone = (user: any, userType: string | undefined): boolean => {
  if (!user || !userType || !user.profile) return false;
  const profile = user.profile;
  if (userType === 'individual') return !!(user.full_name && (profile.location || profile.professional_title || profile.bio));
  if (userType === 'company') return !!(user.company_name && (profile.location || profile.company_type || profile.bio));
  return false;
};
const isPreferencesCompleteDone = (user: any, userType: string | undefined): boolean => {
  if (!user?.profile || !userType) return false;
  const profile = user.profile;
  if (userType === 'individual') return !!(profile.job_status || (profile.desired_roles?.length > 0) || profile.work_arrangement || profile.experience_level_preference);
  if (userType === 'company') return !!(profile.hiring_status || (profile.offered_employment_types?.length > 0) || (profile.hiring_roles?.length > 0));
  return false;
};
const isCultureCompleteDone = (user: any, userType: string | undefined): boolean => {
  if (userType !== 'individual' || !user?.profile) return false;
  const profile = user.profile;
  return !!(profile.ideal_next_job_description || (profile.culture_preferences?.length > 0));
};
const isResumeCompleteDone = (user: any, userType: string | undefined): boolean => {
  if (userType !== 'individual' || !user?.profile) return false;
  return !!profile.resume_file_path;
};

const stepCheckersDone: Record<string, (user: any, userType: string | undefined) => boolean> = {
  [`${AI_INTEGRATION_BASE_PATH_DONE}/verify-email`]: isEmailVerifiedDone,
  [`${AI_INTEGRATION_BASE_PATH_DONE}/profile`]: isProfileCompleteDone,
  [`${AI_INTEGRATION_BASE_PATH_DONE}/preferences`]: isPreferencesCompleteDone,
  [`${AI_INTEGRATION_BASE_PATH_DONE}/culture`]: isCultureCompleteDone,
  [`${AI_INTEGRATION_BASE_PATH_DONE}/resume`]: isResumeCompleteDone,
};


function OnboardingDonePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const pageUserType = user?.user_type || searchParams.get('type') as 'individual' | 'company' || 'individual';

  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [completedStepsList, setCompletedStepsList] = useState<Array<{name: string, shortName: string, isComplete: boolean}>>([]);

  const individualStepsConfig = [
    { name: "Verify Email", href: `${AI_INTEGRATION_BASE_PATH_DONE}/verify-email`, shortName: "Email" },
    { name: "Profile", href: `${AI_INTEGRATION_BASE_PATH_DONE}/profile`, shortName: "Profile" },
    { name: "Preferences", href: `${AI_INTEGRATION_BASE_PATH_DONE}/preferences`, shortName: "Preferences" },
    { name: "Culture", href: `${AI_INTEGRATION_BASE_PATH_DONE}/culture`, shortName: "Work Culture" },
    { name: "Resume/CV", href: `${AI_INTEGRATION_BASE_PATH_DONE}/resume`, shortName: "Resume" },
  ];

  const companyStepsConfig = [
    { name: "Verify Email", href: `${AI_INTEGRATION_BASE_PATH_DONE}/verify-email`, shortName: "Email" },
    { name: "Company Profile", href: `${AI_INTEGRATION_BASE_PATH_DONE}/profile`, shortName: "Company Info" },
    { name: "Preferences", href: `${AI_INTEGRATION_BASE_PATH_DONE}/preferences`, shortName: "Hiring Preferences" },
  ];

  const currentStepsConfig = pageUserType === 'company' ? companyStepsConfig : individualStepsConfig;

  useEffect(() => {
    if (user) {
      let completedCount = 0;
      const currentStepCompletionStatus = currentStepsConfig.map(step => {
        const checker = stepCheckersDone[step.href];
        const isComplete = checker ? checker(user, pageUserType) : false;
        if (isComplete) completedCount++;
        return { name: step.name, shortName: step.shortName, isComplete };
      });

      setCompletedStepsList(currentStepCompletionStatus);
      setCompletionPercentage(currentStepsConfig.length > 0 ? Math.round((completedCount / currentStepsConfig.length) * 100) : 0);
    }
  }, [user, pageUserType, currentStepsConfig]);


  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Loading completion status...</div>;
  }
  if (!user) {
    toast.error("User not found. Redirecting to login.");
    if (typeof window !== 'undefined') router.push('/auth/ai integration/login');
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
  }

  const allStepsComplete = completionPercentage === 100;


  return (
    <div className="min-h-screen bg-brand-bg-light-gray py-8">
      <OnboardingStepper />
      
      <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-lg mb-4 sm:mb-6 ${allStepsComplete ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
            {allStepsComplete ? <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" /> : <InfoIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" /> }
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-text-dark mb-3 sm:mb-4">
            {allStepsComplete ? "🎉 Onboarding Complete!" : "Onboarding Progress"}
          </h1>
          <p className="text-sm sm:text-base text-brand-text-medium mb-6 sm:mb-8">
            {allStepsComplete
              ? "Welcome to the platform! Your profile is set up and you can now start exploring."
              : "You're making great progress! Complete the remaining steps to unlock the full potential of your profile."
            }
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 sm:p-6 rounded-xl border border-blue-200 mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-md sm:text-lg font-semibold text-brand-text-dark">Profile Completion Status</h2>
            <span className="text-xl sm:text-2xl font-bold text-black">{completionPercentage}%</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm">
            {completedStepsList.map(step => (
              <div className="flex items-center space-x-2" key={step.name}>
                {step.isComplete ? (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-300 rounded-full flex-shrink-0 border border-gray-400" />
                )}
                <span className={`font-medium ${step.isComplete ? 'text-brand-text-dark' : 'text-gray-500'}`}>
                  {step.shortName}
                </span>
              </div>
            ))}
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${completionPercentage === 100 ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {!allStepsComplete && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-800">
                <div className="flex items-center">
                    <AlertTriangleIcon className="h-5 w-5 mr-3 flex-shrink-0"/>
                    <p className="text-sm font-medium">
                        Completing your profile helps us match you with the best opportunities.
                        <Link href={`/auth/ai integration/onboarding/profile?type=${pageUserType}`} className="font-semibold underline hover:text-yellow-900 ml-1">
                            Continue setup
                        </Link>.
                    </p>
                </div>
            </div>
        )}

        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-brand-text-dark mb-4 sm:mb-6 flex items-center">
            <SparklesIcon className="w-5 h-5 text-black mr-2" />
            Next Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
             <Link href="/feed" className="block p-4 border border-gray-200 rounded-lg bg-gray-50 hover:shadow-md transition-shadow">
                <h3 className="font-medium text-brand-text-dark mb-1">Explore Your Feed</h3>
                <p className="text-xs sm:text-sm text-brand-text-medium">Discover relevant content and connections.</p>
            </Link>
            <Link href={pageUserType === 'individual' ? `/auth/ai integration/profile?type=${pageUserType}` : `/auth/ai integration/profile?type=${pageUserType}`} className="block p-4 border border-gray-200 rounded-lg bg-gray-50 hover:shadow-md transition-shadow">
                <h3 className="font-medium text-brand-text-dark mb-1">View/Edit Your Profile</h3>
                <p className="text-xs sm:text-sm text-brand-text-medium">Keep your information up-to-date.</p>
            </Link>
            {pageUserType === 'company' && (
                <Link href="/company-jobs" className="block p-4 border border-gray-200 rounded-lg bg-gray-50 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-brand-text-dark mb-1">Post a Job</h3>
                    <p className="text-xs sm:text-sm text-brand-text-medium">Start finding talent for your company.</p>
                </Link>
            )}
             {pageUserType === 'individual' && (
                <Link href="/jobs" className="block p-4 border border-gray-200 rounded-lg bg-gray-50 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-brand-text-dark mb-1">Browse Jobs</h3>
                    <p className="text-xs sm:text-sm text-brand-text-medium">Find your next opportunity.</p>
                </Link>
            )}
          </div>
        </div>

        <div className="text-center mt-8 sm:mt-10">
          <Button
            className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white py-3 px-6 text-sm sm:text-base"
            asChild
          >
            <Link href="/feed">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}


export default function OnboardingDonePage() {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Loading...</div>}>
        <OnboardingDonePageContent />
      </Suspense>
    );
}
