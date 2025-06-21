"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useState, useEffect, Suspense } from "react";
import { CheckCircle, HeartIcon, UsersIcon, BrainCircuitIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { OnboardingStepper } from "@/components/onboarding-stepper";
import { useSearchParams, useRouter } from "next/navigation";
import { AIFormField } from "@/components/ai-form-field"; // Assuming this component exists
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { updateUserCulture } from "@/lib/api";

// --- Zod Schema Definition ---
const culturePreferencesSchema = z.object({
  culture_preferences: z.array(z.string()).optional().default([]), // Array of selected string labels from ToggleChip
  remote_policy_importance: z.string().optional(), // e.g., 'Very important', 'Important', 'Not important'
  quiet_office_importance: z.string().optional(),  // e.g., 'Very important', 'Important', 'Not important'
  ideal_next_job_description: z.string().max(300, "Description cannot exceed 300 characters.").min(1, "Description is required."), // Required
});

type CultureFormValues = z.infer<typeof culturePreferencesSchema>;

// --- ToggleChip Component ---
// (Re-using from preferences page, ideally this would be a shared component)
interface ToggleChipProps {
  id: string;
  label: string;
  isSelected: boolean;
  onToggle: (id: string) => void;
}
const ToggleChip: React.FC<ToggleChipProps> = ({ id, label, isSelected, onToggle }) => (
  <button type="button" onClick={() => onToggle(id)}
    className={cn( "px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border rounded-full transition-all duration-200 flex items-center font-medium", isSelected ? "bg-black text-white border-black shadow-md scale-105" : "bg-white text-brand-text-medium border-brand-border hover:border-black hover:text-black hover:shadow-sm" )}>
    {isSelected && <CheckCircle className="w-4 h-4 mr-1.5 sm:mr-2" />} {label}
  </button>
);

// --- ImportanceButtonGroup Component ---
// (Re-using from preferences page, ideally this would be a shared component)
interface ImportanceButtonGroupProps {
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
}
const ImportanceButtonGroup: React.FC<ImportanceButtonGroupProps> = ({ selectedValue, onSelect }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
    {[ { value: "Very important", color: "green", label: "Very Important" }, { value: "Important", color: "yellow", label: "Somewhat Important" }, { value: "Not important", color: "gray", label: "Not Important" } ].map((option) => (
      <button key={option.value} type="button" onClick={() => onSelect(option.value)}
        className={cn( "px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium border rounded-lg transition-all duration-200 text-center", selectedValue === option.value ? (option.color === "green" ? "bg-green-100 text-green-700 border-green-300 shadow-md" : option.color === "yellow" ? "bg-yellow-100 text-yellow-700 border-yellow-300 shadow-md" : "bg-gray-100 text-gray-700 border-gray-300 shadow-md") : "bg-white text-brand-text-medium border-brand-border hover:border-gray-400 hover:shadow-sm" )}>
        {option.label}
      </button>
    ))}
  </div>
);


function CulturePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token, refetchUser, isLoading: isAuthLoading } = useAuth();

  const pageUserType = user?.user_type || searchParams.get('type') as 'individual' | 'company' || 'individual';

  const { control, register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<CultureFormValues>({
    resolver: zodResolver(culturePreferencesSchema),
    defaultValues: {
      culture_preferences: [],
      remote_policy_importance: "Not important",
      quiet_office_importance: "Not important",
      ideal_next_job_description: "",
    },
  });

  // Available culture preferences options
  const culturePrefsOptions = [
    { id: "autonomy", label: "Autonomy in work" }, { id: "learning", label: "Continuous learning" },
    { id: " mentorship", label: "Mentorship" }, { id: "impact", label: "Making an impact" },
    { id: "collaboration", label: "Team collaboration" }, { id: "innovation", label: "Innovation" },
    { id: "work-life-balance", label: "Work-life balance" }, { id: "recognition", label: "Recognition" },
    // Add more as needed
  ];

  // Populate form with user data from context's profile
  useEffect(() => {
    if (user?.profile && pageUserType === 'individual') {
      const profile = user.profile;
      reset({
        culture_preferences: profile.culture_preferences || [],
        remote_policy_importance: profile.remote_policy_importance || "Not important",
        quiet_office_importance: profile.quiet_office_importance || "Not important",
        ideal_next_job_description: profile.ideal_next_job_description || "",
      });
    }
  }, [user, pageUserType, reset]);

  const onSubmit: SubmitHandler<CultureFormValues> = async (data) => {
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }
    if (pageUserType !== 'individual') {
      toast.error("This page is for individual users only.");
      return;
    }

    try {
      await updateUserCulture(data, token);
      toast.success("Culture preferences saved successfully!");
      await refetchUser();
      router.push(`/auth/ai integration/onboarding/resume?type=${pageUserType}`);
    } catch (error: any) {
      const errorMessage = error.data?.message || error.message || "Server error while updating culture preferences.";
      toast.error(`Failed to save preferences: ${errorMessage}`);
    }
  };

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Loading culture preferences...</div>;
  }

  if (!user) { // Should be caught by AuthGuard or similar higher up, but good check.
    toast.error("User not found. Redirecting to login.");
    if (typeof window !== 'undefined') router.push('/auth/ai integration/login');
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
  }
  
  if (pageUserType === 'company') {
    // This page is not for companies, redirect them or show a message
    toast.info("Culture preferences are for individual users. Redirecting...");
     if (typeof window !== 'undefined') router.push(`/auth/ai integration/onboarding/done?type=company`);
    return <div className="min-h-screen flex items-center justify-center">This page is for individual users. Redirecting...</div>;
  }

  const idealJobDescriptionValue = watch("ideal_next_job_description") || "";


  return (
    <div className="min-h-screen bg-brand-bg-light-gray py-8">
      <OnboardingStepper />
      
      <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 relative">
        <Button
          variant="outline"
          className="absolute top-4 right-4 border-gray-300 text-gray-600 hover:bg-gray-100 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5"
          asChild
        >
          <Link href={`/auth/ai integration/onboarding/resume?type=${pageUserType}`}>Skip</Link>
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-text-dark mb-3">What motivates you at work?</h1>
          <p className="text-sm sm:text-base text-brand-text-medium leading-relaxed">
            Tell us about your ideal work environment and preferences to find opportunities that align with your values.
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 sm:space-y-10">
          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-center space-x-2 mb-2 sm:mb-4"> <HeartIcon className="h-5 w-5 text-black" /> <Label className="text-base font-semibold text-brand-text-dark"> What are you looking for in your next opportunity? </Label> </div>
            <p className="text-xs sm:text-sm text-brand-text-medium mb-3 sm:mb-4"> Select all the factors that are important to you. </p>
            <Controller name="culture_preferences" control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {culturePrefsOptions.map((pref) => (
                    <ToggleChip key={pref.id} id={pref.id} label={pref.label}
                      isSelected={(field.value || []).includes(pref.id)}
                      onToggle={(id) => {
                        const currentSelection = field.value || [];
                        const newSelection = currentSelection.includes(id)
                          ? currentSelection.filter(item => item !== id)
                          : [...currentSelection, id];
                        field.onChange(newSelection);
                      }}
                    />
                  ))}
                </div>
              )}
            />
            {errors.culture_preferences && <p className="text-red-500 text-xs mt-1">{(errors.culture_preferences as any).message}</p>}
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-2 mb-1 sm:mb-2"> <UsersIcon className="h-5 w-5 text-black" /> <Label className="text-base font-semibold text-brand-text-dark"> How important is remote work flexibility? </Label> </div>
            <Controller name="remote_policy_importance" control={control}
              render={({ field }) => <ImportanceButtonGroup selectedValue={field.value} onSelect={field.onChange} />}
            />
            {errors.remote_policy_importance && <p className="text-red-500 text-xs mt-1">{errors.remote_policy_importance.message}</p>}
          </div>

          <div className="space-y-3 sm:space-y-4">
            <Label className="block text-base font-semibold text-brand-text-dark"> How important is a quiet, focused work environment? </Label>
            <Controller name="quiet_office_importance" control={control}
              render={({ field }) => <ImportanceButtonGroup selectedValue={field.value} onSelect={field.onChange} />}
            />
             {errors.quiet_office_importance && <p className="text-red-500 text-xs mt-1">{errors.quiet_office_importance.message}</p>}
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-2 mb-1 sm:mb-2"> <BrainCircuitIcon className="h-5 w-5 text-black" /> <Label htmlFor="ideal_next_job_description" className="text-base font-semibold text-brand-text-dark"> Describe your ideal next opportunity <span className="text-brand-red">*</span> </Label> </div>
            <AIFormField aiProps={{ fieldType: 'textarea', fieldName: 'Ideal Next Opportunity', placeholder: 'I\'m looking for...', context: { userType: pageUserType, existingContent: watch("ideal_next_job_description") } }}>
              <Textarea id="ideal_next_job_description" {...register("ideal_next_job_description")} placeholder="I'm looking for opportunities where I can..." maxLength={300} className="bg-brand-bg-input border-brand-border min-h-[100px] sm:min-h-[120px] focus:border-black focus:ring-2 focus:ring-black/20"/>
            </AIFormField>
            <div className="flex justify-between items-center text-xs">
              <p className="text-brand-text-medium"> Be authentic and specific! </p>
              <p className={cn( "font-medium", idealJobDescriptionValue.length > 280 ? "text-red-500" : idealJobDescriptionValue.length > 200 ? "text-amber-600" : "text-brand-text-light" )}> {idealJobDescriptionValue.length} / 300 </p>
            </div>
             {errors.ideal_next_job_description && <p className="text-red-500 text-xs mt-1">{errors.ideal_next_job_description.message}</p>}
          </div>

          <div className="flex items-center p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg text-xs sm:text-sm text-green-700">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-green-600 flex-shrink-0" />
            <span> <strong>Almost there!</strong> Your responses help us find the best matches for you. </span>
          </div>

          <div className="pt-6">
            <Button type="submit" disabled={isSubmitting} className="w-full bg-black hover:bg-gray-900 text-white py-3 font-medium text-base rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Continue to Resume Upload →"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CulturePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Loading...</div>}>
      <CulturePageContent />
    </Suspense>
  );
}
