"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState, useEffect, Suspense } from "react";
import { XIcon, CheckIcon, DollarSignIcon, BriefcaseIcon, MapPinIcon, BuildingIcon, UsersIcon, UserIcon, TargetIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { OnboardingStepper } from "@/components/onboarding-stepper";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { updateUserPreferences } from "@/lib/api";

// --- Zod Schema Definitions ---
const individualPreferencesSchema = z.object({
  job_status: z.string().optional(),
  desired_roles: z.array(z.string()).optional().default([]),
  work_arrangement: z.string().optional(),
  experience_level_preference: z.string().optional(), // Matches DB: experience_level_preference
  salary_expectation_min: z.preprocess(val => val ? parseInt(String(val), 10) : undefined, z.number().positive().optional()),
  salary_expectation_max: z.preprocess(val => val ? parseInt(String(val), 10) : undefined, z.number().positive().optional()),
  salary_expectation_currency: z.string().optional().default("usd"),
  career_goals: z.array(z.string()).optional().default([]),
  preferred_locations: z.array(z.string()).optional().default([]), // Matches DB: preferred_locations
});

const companyPreferencesSchema = z.object({
  hiring_status: z.string().optional(),
  // employmentType from UI, maps to offered_employment_types (array) in DB
  // For now, let's assume UI sends a single string for employmentType.
  // Backend /api/users/preferences already handles converting single employmentType to array [employmentType]
  employmentType: z.string().optional(), // This will be mapped to offered_employment_types in backend
  hiring_roles: z.array(z.string()).optional().default([]), // Matches DB: hiring_roles
  hiring_locations: z.array(z.string()).optional().default([]), // Matches DB: hiring_locations
  hiring_salary_min: z.preprocess(val => val ? parseInt(String(val), 10) : undefined, z.number().positive().optional()),
  hiring_salary_max: z.preprocess(val => val ? parseInt(String(val), 10) : undefined, z.number().positive().optional()),
  hiring_salary_currency: z.string().optional().default("usd"),
});

// Union type for form values
type IndividualPreferencesFormValues = z.infer<typeof individualPreferencesSchema>;
type CompanyPreferencesFormValues = z.infer<typeof companyPreferencesSchema>;
type PreferencesFormValues = IndividualPreferencesFormValues | CompanyPreferencesFormValues;


interface ToggleButtonProps {
  value: string;
  selectedValue: string | undefined; // Can be undefined if not selected
  onSelect: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ value, selectedValue, onSelect, children, className }) => (
  <button
    type="button"
    onClick={() => onSelect(value)}
    className={cn(
      "px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium rounded-lg border transition-all duration-200",
      selectedValue === value
        ? "bg-black text-white border-black shadow-md"
        : "bg-white text-brand-text-dark border-brand-border hover:border-gray-400 hover:shadow-sm",
      className
    )}
  >
    {children}
  </button>
);

// Component for multi-select with chips (e.g., for roles, locations, career goals)
interface MultiSelectChipProps {
  availableOptions: { value: string; label: string }[];
  selectedOptions: string[];
  onChange: (newSelectedOptions: string[]) => void;
  placeholder: string;
  label: string;
  Icon?: React.ElementType;
}

const MultiSelectChip: React.FC<MultiSelectChipProps> = ({ availableOptions, selectedOptions, onChange, placeholder, label, Icon }) => {
  const handleSelect = (value: string) => {
    const newSelection = selectedOptions.includes(value)
      ? selectedOptions.filter(item => item !== value)
      : [...selectedOptions, value];
    onChange(newSelection);
  };

  return (
    <div className="space-y-3">
      {Icon && <div className="flex items-center space-x-2 mb-1"> <Icon className="h-5 w-5 text-black" /> <Label className="text-base font-semibold text-brand-text-dark">{label}</Label> </div>}
      {!Icon && <Label className="block text-base font-semibold text-brand-text-dark">{label}</Label>}

      <div className="flex flex-wrap gap-2 mb-2 min-h-[2.5rem]"> {/* Ensure some min height for chips */}
        {selectedOptions.map((optionValue) => {
          const optionLabel = availableOptions.find(opt => opt.value === optionValue)?.label || optionValue;
          return (
            <span
              key={optionValue}
              className="inline-flex items-center bg-black text-white text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full"
            >
              {optionLabel}
              <button
                type="button"
                onClick={() => handleSelect(optionValue)}
                className="ml-1.5 text-white hover:bg-gray-700 rounded-full p-0.5 transition-colors"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          );
        })}
      </div>
      <Select
        onValueChange={(value) => {
          if (value && !selectedOptions.includes(value)) { // Check if value is not empty and not already selected
            handleSelect(value);
          }
        }}
        // value="" // Important: Reset select after an item is chosen to allow re-selection if needed or prevent it looking like an item is "stuck" selected
      >
        <SelectTrigger className="w-full bg-brand-bg-input border-brand-border focus:border-black focus:ring-2 focus:ring-black/20 h-11 sm:h-12">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {availableOptions.map(option => (
            <SelectItem key={option.value} value={option.value} disabled={selectedOptions.includes(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};


function PreferencesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token, refetchUser, isLoading: isAuthLoading } = useAuth();

  // Prioritize user.user_type from AuthContext if user is loaded, otherwise fallback to searchParam, then to 'individual'
  const queryParamType = searchParams.get('type') as 'individual' | 'company' | null;
  const resolvedUserTypeFromContext = user ? user.user_type : null;
  const pageUserType = resolvedUserTypeFromContext || queryParamType || 'individual';

  console.log("[PreferencesPage] Initial User from AuthContext:", user);
  console.log("[PreferencesPage] Query Param 'type':", queryParamType);
  console.log("[PreferencesPage] Resolved pageUserType for UI/Schema:", pageUserType);

  const currentSchema = pageUserType === 'company' ? companyPreferencesSchema : individualPreferencesSchema;

  const { control, register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<PreferencesFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: pageUserType === 'individual'
    ? {
        job_status: "actively-looking",
        desired_roles: [],
        work_arrangement: "hybrid",
        experience_level_preference: "mid-level",
        salary_expectation_currency: "usd",
        career_goals: [],
        preferred_locations: []
      }
    : {
        hiring_status: "actively-hiring",
        employmentType: "full-time",
        hiring_roles: [],
        hiring_locations: [],
        hiring_salary_currency: "usd"
      },
  });

  // Populate form with user data from context's profile
  useEffect(() => {
    if (user?.profile) {
      const profile = user.profile;
      let defaultsToSet: Partial<PreferencesFormValues> = {};

      if (pageUserType === 'individual') {
        defaultsToSet = {
          job_status: profile.job_status || "actively-looking",
          desired_roles: profile.desired_roles || [],
          work_arrangement: profile.work_arrangement || "hybrid",
          experience_level_preference: profile.experience_level_preference || "mid-level",
          salary_expectation_min: profile.salary_expectation_min || undefined,
          salary_expectation_max: profile.salary_expectation_max || undefined,
          salary_expectation_currency: profile.salary_expectation_currency || "usd",
          career_goals: profile.career_goals || [],
          preferred_locations: profile.preferred_locations || [],
        };
      } else if (pageUserType === 'company') {
        defaultsToSet = {
          hiring_status: profile.hiring_status || "actively-hiring",
          // Backend stores offered_employment_types as array. UI uses 'employmentType' as single string.
          // The PUT /api/users/preferences endpoint expects 'employmentType' (single string) from client for company.
          employmentType: (profile.offered_employment_types && profile.offered_employment_types.length > 0) ? profile.offered_employment_types[0] : "full-time",
          hiring_roles: profile.hiring_roles || [],
          hiring_locations: profile.hiring_locations || [],
          hiring_salary_min: profile.hiring_salary_min || undefined,
          hiring_salary_max: profile.hiring_salary_max || undefined,
          hiring_salary_currency: profile.hiring_salary_currency || "usd",
        };
      }
      reset(defaultsToSet);
    }
  }, [user, pageUserType, reset]);


  const onSubmit: SubmitHandler<PreferencesFormValues> = async (data) => {
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }

    // The backend /api/users/preferences expects fields named like jobStatus, desiredRoles, etc.
    // And for company, it expects employmentType (single string), roles, companyLocations etc.
    // The Zod schemas are already aligned with these frontend expectations.
    // The backend then maps these to DB columns (e.g. job_status, hiring_roles).

    let payload: any = { ...data };

    // Ensure numeric fields are numbers or undefined, not empty strings
    const numericFieldsIndividual: (keyof IndividualPreferencesFormValues)[] = ['salary_expectation_min', 'salary_expectation_max'];
    const numericFieldsCompany: (keyof CompanyPreferencesFormValues)[] = ['hiring_salary_min', 'hiring_salary_max'];

    if (pageUserType === 'individual') {
        numericFieldsIndividual.forEach(field => {
            if (payload[field] === '' || payload[field] === null) payload[field] = undefined;
            else if (payload[field] !== undefined) payload[field] = Number(payload[field]);
        });
    } else {
        numericFieldsCompany.forEach(field => {
            if (payload[field] === '' || payload[field] === null) payload[field] = undefined;
            else if (payload[field] !== undefined) payload[field] = Number(payload[field]);
        });
    }

    try {
      await updateUserPreferences(payload, token);
      toast.success("Preferences saved successfully!");
      await refetchUser();

      // It's crucial to use the most up-to-date user information for navigation decision,
      // ideally from the 'user' object in context after it has been refetched and component re-rendered.
      // The 'pageUserType' defined at the top of the component will be based on the state of 'user' during that render.
      // After 'refetchUser()' and subsequent re-render, this 'pageUserType' should be correct.

      const userTypeForNav = user ? user.user_type : pageUserType; // Prefer fresh user.user_type if available after refetch logic settles

      console.log("[PreferencesPage] onSubmit - User from AuthContext (after refetch attempt):", user);
      console.log("[PreferencesPage] onSubmit - pageUserType (from component scope):", pageUserType);
      console.log("[PreferencesPage] onSubmit - userTypeForNav (for navigation decision):", userTypeForNav);

      const nextStep = userTypeForNav === 'individual' ? 'culture' : 'done';
      const navigationPath = `/auth/ai integration/onboarding/${nextStep}?type=${userTypeForNav}`;

      console.log("[PreferencesPage] onSubmit - Calculated nextStep:", nextStep);
      console.log("[PreferencesPage] onSubmit - Navigating to:", navigationPath);

      router.push(navigationPath);
    } catch (error: any) {
      console.error("[PreferencesPage] onSubmit error:", error);
      const errorMessage = error.data?.message || error.message || "Server error while updating preferences.";
      toast.error(`Failed to save preferences: ${errorMessage}`);
    }
  };
  

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Loading preferences...</div>;
  }
  if (!user) {
    toast.error("User not found. Redirecting to login.");
    if (typeof window !== 'undefined') {
        console.log("[PreferencesPage] No user context, redirecting to login.");
        router.push('/auth/ai integration/login');
    }
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
  }

  // Options for Selects (can be moved to constants file)
  const roleOptions = [
    { value: "Software Engineering", label: "Software Engineering" }, { value: "Product Management", label: "Product Management" },
    { value: "Design & UX", label: "Design & UX" }, { value: "Data Science", label: "Data Science & Analytics" },
    // Add more as needed
  ];
  const locationOptions = [
    { value: "Remote", label: "🌍 Remote (Anywhere)" }, { value: "San Francisco, CA", label: "San Francisco, CA" },
    { value: "New York, NY", label: "New York, NY" }, { value: "Noida, India", label: "Noida, India" },
    // Add more
  ];
   const careerGoalOptions = [
    { value: "Career Growth", label: "Career Growth"}, { value: "Work-Life Balance", label: "Work-Life Balance"},
    { value: "High Compensation", label: "High Compensation"}, { value: "Learning New Technologies", label: "Learning New Technologies"},
    // Add more
  ];


  return (
    <div className="min-h-screen bg-brand-bg-light-gray py-8">
      <OnboardingStepper />
      
      <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 relative">
        <Button
          variant="outline"
          className="absolute top-4 right-4 border-gray-300 text-gray-600 hover:bg-gray-100 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5"
          asChild
        >
          <Link href={`/auth/ai integration/onboarding/${pageUserType === 'individual' ? 'culture' : 'done'}?type=${pageUserType}`}>Skip</Link>
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-text-dark mb-3">
            {pageUserType === 'company'
              ? 'What are you looking to hire?' 
              : 'What are your work preferences?'
            }
          </h1>
          <p className="text-sm sm:text-base text-brand-text-medium leading-relaxed">
            {pageUserType === 'company'
              ? 'Help us understand your hiring needs to match you with the perfect candidates.'
              : 'Tell us about your work preferences to find the perfect opportunities.'
            }
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {pageUserType === 'company' ? (
            <>
              {/* Hiring Status */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-2 sm:mb-4"> <BuildingIcon className="h-5 w-5 text-black" /> <Label className="text-base font-semibold text-brand-text-dark"> Current hiring status? <span className="text-brand-red">*</span> </Label> </div>
                <Controller name={"hiring_status" as keyof CompanyPreferencesFormValues} control={control} render={({ field }) => (
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {[ { value: "actively-hiring", label: "Actively Hiring", desc: "Open positions, interviewing." }, { value: "planning-to-hire", label: "Planning to Hire", desc: "Hiring soon, building pipeline." }, { value: "not-hiring", label: "Not Hiring", desc: "Profile active, not hiring now." } ].map((item) => (
                        <button key={item.value} type="button" onClick={() => field.onChange(item.value)} className={cn( "p-4 sm:p-5 border rounded-xl text-left transition-all duration-200", field.value === item.value ? "border-black ring-2 ring-black/20 bg-gray-50 shadow-md" : "border-brand-border hover:border-gray-400 bg-white hover:shadow-sm" )}>
                          <div className="flex items-start justify-between"> <div className="flex-1"> <span className="font-semibold text-brand-text-dark block mb-1 text-sm sm:text-base">{item.label}</span> <p className="text-xs sm:text-sm text-brand-text-medium leading-relaxed">{item.desc}</p> </div> {field.value === item.value && ( <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-black flex-shrink-0 mt-0.5" /> )} </div>
                        </button>
                      ))}
                    </div>
                )}/>
                {errors.hiring_status && <p className="text-red-500 text-xs mt-1">{(errors.hiring_status as any).message}</p>}
              </div>

              {/* Employment Type */}
              <div className="space-y-3 sm:space-y-4">
                <Label className="block text-base font-semibold text-brand-text-dark"> Employment type offered? <span className="text-brand-red">*</span> </Label>
                <Controller name={"employmentType" as keyof CompanyPreferencesFormValues} control={control} render={({ field }) => (
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {[ { id: "full-time", label: "Full-time" }, { id: "part-time", label: "Part-time" }, { id: "contract", label: "Contract" }, { id: "intern", label: "Internship" } ].map((type) => ( <ToggleButton key={type.id} value={type.id} selectedValue={field.value} onSelect={field.onChange}> {type.label} </ToggleButton> ))}
                    </div>
                )}/>
                 {errors.employmentType && <p className="text-red-500 text-xs mt-1">{(errors.employmentType as any).message}</p>}
              </div>

              {/* Salary Range (Company) */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-2 mb-1 sm:mb-2"> <DollarSignIcon className="h-5 w-5 text-black" /> <Label className="text-base font-semibold text-brand-text-dark"> Salary range for positions? </Label> </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div> <Input type="number" placeholder="Min salary" {...register("hiring_salary_min" as keyof CompanyPreferencesFormValues)} className="h-11 sm:h-12"/> {errors.hiring_salary_min && <p className="text-red-500 text-xs mt-1">{(errors.hiring_salary_min as any).message}</p>}</div>
                  <div> <Input type="number" placeholder="Max salary" {...register("hiring_salary_max" as keyof CompanyPreferencesFormValues)} className="h-11 sm:h-12"/> {errors.hiring_salary_max && <p className="text-red-500 text-xs mt-1">{(errors.hiring_salary_max as any).message}</p>}</div>
                </div>
                <Controller name={"hiring_salary_currency" as keyof CompanyPreferencesFormValues} control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || "usd"}>
                    <SelectTrigger className="h-11 sm:h-12"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="usd">USD ($)</SelectItem><SelectItem value="inr">INR (₹)</SelectItem></SelectContent>
                  </Select>
                )}/>
              </div>

              {/* Roles Hiring For */}
              <Controller name={"hiring_roles" as keyof CompanyPreferencesFormValues} control={control} render={({ field }) => (
                <MultiSelectChip Icon={BriefcaseIcon} label="Which roles are you hiring for?" availableOptions={roleOptions} selectedOptions={field.value || []} onChange={field.onChange} placeholder="Add a role" />
              )}/>
              {errors.hiring_roles && <p className="text-red-500 text-xs mt-1">{(errors.hiring_roles as any).message}</p>}

              {/* Work Locations (Company) */}
              <Controller name={"hiring_locations" as keyof CompanyPreferencesFormValues} control={control} render={({ field }) => (
                <MultiSelectChip Icon={MapPinIcon} label="Where are these positions located?" availableOptions={locationOptions} selectedOptions={field.value || []} onChange={field.onChange} placeholder="Add location" />
              )}/>
              {errors.hiring_locations && <p className="text-red-500 text-xs mt-1">{(errors.hiring_locations as any).message}</p>}
            </>
          ) : ( // Individual Preferences
            <>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-2 sm:mb-4"> <UserIcon className="h-5 w-5 text-black" /> <Label className="text-base font-semibold text-brand-text-dark"> Current availability status? <span className="text-brand-red">*</span> </Label> </div>
                <Controller name={"job_status" as keyof IndividualPreferencesFormValues} control={control} render={({ field }) => (
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {[ { value: "actively-looking", label: "Actively Available", desc: "Seeking new opportunities." }, { value: "open-to-opportunities", label: "Open to Opportunities", desc: "Not actively searching but open." }, { value: "exploring", label: "Just Exploring", desc: "Researching the market." } ].map((item) => (
                        <button key={item.value} type="button" onClick={() => field.onChange(item.value)} className={cn( "p-4 sm:p-5 border rounded-xl text-left transition-all duration-200", field.value === item.value ? "border-black ring-2 ring-black/20 bg-gray-50 shadow-md" : "border-brand-border hover:border-gray-400 bg-white hover:shadow-sm" )}>
                           <div className="flex items-start justify-between"> <div className="flex-1"> <span className="font-semibold text-brand-text-dark block mb-1 text-sm sm:text-base">{item.label}</span> <p className="text-xs sm:text-sm text-brand-text-medium leading-relaxed">{item.desc}</p> </div> {field.value === item.value && ( <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-black flex-shrink-0 mt-0.5" /> )} </div>
                        </button>
                      ))}
                    </div>
                )}/>
                {errors.job_status && <p className="text-red-500 text-xs mt-1">{(errors.job_status as any).message}</p>}
              </div>

              <Controller name={"desired_roles" as keyof IndividualPreferencesFormValues} control={control} render={({ field }) => (
                <MultiSelectChip Icon={BriefcaseIcon} label="What type of work are you interested in?" availableOptions={roleOptions} selectedOptions={field.value || []} onChange={field.onChange} placeholder="Add work type" />
              )}/>
              {errors.desired_roles && <p className="text-red-500 text-xs mt-1">{(errors.desired_roles as any).message}</p>}

              <div className="space-y-3 sm:space-y-4">
                <Label className="block text-base font-semibold text-brand-text-dark"> Preferred work arrangement? <span className="text-brand-red">*</span> </Label>
                <Controller name={"work_arrangement" as keyof IndividualPreferencesFormValues} control={control} render={({ field }) => (
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {[ { id: "remote", label: "Remote" }, { id: "hybrid", label: "Hybrid" }, { id: "in-office", label: "In-Office" } ].map((item) => ( <ToggleButton key={item.id} value={item.id} selectedValue={field.value} onSelect={field.onChange}> {item.label} </ToggleButton> ))}
                    </div>
                )}/>
                {errors.work_arrangement && <p className="text-red-500 text-xs mt-1">{(errors.work_arrangement as any).message}</p>}
              </div>

              <div className="space-y-3 sm:space-y-4">
                <Label className="block text-base font-semibold text-brand-text-dark"> Target opportunity level? <span className="text-brand-red">*</span> </Label>
                <Controller name={"experience_level_preference" as keyof IndividualPreferencesFormValues} control={control} render={({ field }) => (
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {[ { id: "entry-level", label: "Entry (0-2 yrs)" }, { id: "mid-level", label: "Mid (3-5 yrs)" }, { id: "senior-level", label: "Senior (6-8 yrs)" }, {id: "lead-level", label: "Lead (9+ yrs)"} ].map((item) => ( <ToggleButton key={item.id} value={item.id} selectedValue={field.value} onSelect={field.onChange}> {item.label} </ToggleButton> ))}
                    </div>
                )}/>
                {errors.experience_level_preference && <p className="text-red-500 text-xs mt-1">{(errors.experience_level_preference as any).message}</p>}
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-2 mb-1 sm:mb-2"> <DollarSignIcon className="h-5 w-5 text-black" /> <Label className="text-base font-semibold text-brand-text-dark"> Rate/compensation expectations? </Label> </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div> <Input type="number" placeholder="Min rate/salary" {...register("salary_expectation_min" as keyof IndividualPreferencesFormValues)} className="h-11 sm:h-12"/> {errors.salary_expectation_min && <p className="text-red-500 text-xs mt-1">{(errors.salary_expectation_min as any).message}</p>}</div>
                  <div> <Input type="number" placeholder="Max rate/salary" {...register("salary_expectation_max" as keyof IndividualPreferencesFormValues)} className="h-11 sm:h-12"/> {errors.salary_expectation_max && <p className="text-red-500 text-xs mt-1">{(errors.salary_expectation_max as any).message}</p>}</div>
                </div>
                 <Controller name={"salary_expectation_currency" as keyof IndividualPreferencesFormValues} control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || "usd"}>
                    <SelectTrigger className="h-11 sm:h-12"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="usd">USD ($)</SelectItem><SelectItem value="inr">INR (₹)</SelectItem></SelectContent>
                  </Select>
                )}/>
              </div>

              <Controller name={"career_goals" as keyof IndividualPreferencesFormValues} control={control} render={({ field }) => (
                <MultiSelectChip Icon={TargetIcon} label="What are your career goals?" availableOptions={careerGoalOptions} selectedOptions={field.value || []} onChange={field.onChange} placeholder="Add career goal" />
              )}/>
              {errors.career_goals && <p className="text-red-500 text-xs mt-1">{(errors.career_goals as any).message}</p>}

              <Controller name={"preferred_locations" as keyof IndividualPreferencesFormValues} control={control} render={({ field }) => (
                <MultiSelectChip Icon={MapPinIcon} label="Where are you open to working?" availableOptions={locationOptions} selectedOptions={field.value || []} onChange={field.onChange} placeholder="Add preferred location" />
              )}/>
              {errors.preferred_locations && <p className="text-red-500 text-xs mt-1">{(errors.preferred_locations as any).message}</p>}
            </>
          )}

          <div className="pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black hover:bg-gray-900 text-white py-3 font-medium text-base rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : (pageUserType === 'individual' ? 'Continue to Culture Fit →' : 'Complete Setup →')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Loading...</div>}>
      <PreferencesPageContent />
    </Suspense>
  );
}
