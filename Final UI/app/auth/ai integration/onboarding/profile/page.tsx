"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SearchIcon, XIcon, MapPinIcon, BuildingIcon, LinkIcon, BriefcaseIcon, UsersIcon, UserIcon, GraduationCapIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { OnboardingStepper } from "@/components/onboarding-stepper";
import { useSearchParams, useRouter } from "next/navigation";
import { AIFormField } from "@/components/ai-form-field"; // Assuming this component exists
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/api";

// --- Zod Schema Definitions ---
const baseProfileSchema = z.object({
  location: z.string().min(1, "Location is required.").optional(), // Made optional to allow skip, but required if user interacts
  website_url: z.string().url("Invalid URL format.").optional().or(z.literal("")),
  linkedin_url: z.string().url("Invalid URL format.").optional().or(z.literal("")),
  bio: z.string().max(500, "Bio cannot exceed 500 characters.").optional(),
});

const individualSpecificSchema = z.object({
  full_name: z.string().min(1, "Full name is required."), // From users table
  professional_title: z.string().min(1, "Professional title is required.").optional(),
  years_of_experience: z.string().optional(),
  job_function: z.string().optional(),
  key_skills: z.string().optional(), // Will be comma-separated string, convert to array if needed
  education_level: z.string().optional(),
  field_of_study: z.string().optional(),
  institution: z.string().optional(),
});

const companySpecificSchema = z.object({
  company_name: z.string().min(1, "Company name is required."), // From users table
  industry: z.string().min(1, "Industry is required.").optional(), // From users table
  company_size: z.string().optional(), // From users table
  company_type: z.string().optional(),
  tech_stack: z.string().optional(),
  // bio: z.string().max(500, "Company description cannot exceed 500 characters.").optional(), // Re-defined from base for specific message
});

// Combined Schemas
const individualProfileSchema = baseProfileSchema.merge(individualSpecificSchema);
const companyProfileSchema = baseProfileSchema.merge(companySpecificSchema).extend({
  bio: z.string().max(500, "Company description cannot exceed 500 characters.").optional(), // Override bio for company
});


type IndividualProfileFormValues = z.infer<typeof individualProfileSchema>;
type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;
// Use a conditional type or a more general one if needed for SubmitHandler if structure varies too much
type ProfileFormValues = IndividualProfileFormValues | CompanyProfileFormValues;


function ProfilePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token, refetchUser, isLoading: isAuthLoading } = useAuth();

  // Determine userType from AuthContext first, then fallback to query param
  const pageUserType = user?.user_type || searchParams.get('type') as 'individual' | 'company' || 'individual';

  const currentSchema = pageUserType === 'company' ? companyProfileSchema : individualProfileSchema;

  const { control, register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<ProfileFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {}, // Default values will be set by useEffect
  });
  
  // Local state for fields not directly part of react-hook-form but interactive (like location search)
  // const [searchLocationInput, setSearchLocationInput] = useState(""); // For the input field itself
  // const locationValue = watch("location"); // Watch location from RHF to display it

  // Populate form with user data from context
  useEffect(() => {
    if (user) {
      const defaultVals: Partial<ProfileFormValues> = {
        full_name: pageUserType === 'individual' ? user.full_name || "" : undefined,
        company_name: pageUserType === 'company' ? user.company_name || "" : undefined,
        industry: pageUserType === 'company' ? user.industry || "" : undefined,
        company_size: pageUserType === 'company' ? user.company_size || "" : undefined,
        location: user.profile?.location || "",
        professional_title: pageUserType === 'individual' ? user.profile?.professional_title || "" : undefined,
        years_of_experience: pageUserType === 'individual' ? user.profile?.years_of_experience || "" : undefined,
        job_function: pageUserType === 'individual' ? user.profile?.job_function || "" : undefined,
        key_skills: pageUserType === 'individual' ? user.profile?.key_skills || "" : undefined,
        education_level: pageUserType === 'individual' ? user.profile?.education_level || "" : undefined,
        field_of_study: pageUserType === 'individual' ? user.profile?.field_of_study || "" : undefined,
        institution: pageUserType === 'individual' ? user.profile?.institution || "" : undefined,
        linkedin_url: user.profile?.linkedin_url || "",
        website_url: user.profile?.website_url || "",
        bio: user.profile?.bio || "",
        company_type: pageUserType === 'company' ? user.profile?.company_type || "" : undefined,
        tech_stack: pageUserType === 'company' ? user.profile?.tech_stack || "" : undefined,
      };
      reset(defaultVals);
    }
  }, [user, pageUserType, reset]);


  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }

    // Prepare payload: separate fields for 'users' table and 'user_profiles'
    const usersTableUpdate: Partial<ProfileFormValues> = {};
    const profileTableUpdate: Partial<ProfileFormValues> = { ...data }; // Start with all data

    if (pageUserType === 'individual') {
      if ('full_name' in data) usersTableUpdate.full_name = data.full_name;
      delete profileTableUpdate.full_name; // Remove from profile payload
    } else if (pageUserType === 'company') {
      if ('company_name' in data) usersTableUpdate.company_name = data.company_name;
      if ('industry' in data) usersTableUpdate.industry = data.industry;
      if ('company_size' in data) usersTableUpdate.company_size = data.company_size;
      delete profileTableUpdate.company_name;
      delete profileTableUpdate.industry;
      delete profileTableUpdate.company_size;
    }

    // Consolidate payload for the existing /api/users/profile endpoint
    // The backend endpoint already handles splitting data between users and user_profiles table.
    const finalPayload = { ...data };


    try {
      await updateUserProfile(finalPayload, token);
      toast.success("Profile updated successfully!");
      await refetchUser(); // Refresh user context data
      router.push(`/auth/ai integration/onboarding/preferences?type=${pageUserType}`);
    } catch (error: any) {
      const errorMessage = error.data?.message || error.message || "Server error while updating profile.";
      toast.error(`Failed to update profile: ${errorMessage}`);
    }
  };

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Loading profile...</div>;
  }

  if (!user) {
    toast.error("User not found. Redirecting to login.");
    if (typeof window !== 'undefined') router.push('/auth/ai integration/login');
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
  }

  // For AIFormField context, ensure userType is correctly passed
  const aiFormFieldContextUserType = user?.user_type || pageUserType;


  return (
    <div className="min-h-screen bg-brand-bg-light-gray py-8">
      <OnboardingStepper /> {/* This will use AuthContext to determine userType */}
      <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 relative">
        <Button
          variant="outline"
          className="absolute top-4 right-4 border-gray-300 text-gray-600 hover:bg-gray-100 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5"
          asChild
        >
          <Link href={`/auth/ai integration/onboarding/preferences?type=${pageUserType}`}>Skip</Link>
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-black to-gray-800 rounded-2xl shadow-lg mb-4">
            {pageUserType === 'company' ? (
              <BuildingIcon className="w-8 h-8 text-white" />
            ) : (
              <UserIcon className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-text-dark mb-3">
            {pageUserType === 'company'
              ? 'Tell us about your company' 
              : 'Tell us about yourself'
            }
          </h1>
          <p className="text-sm sm:text-base text-brand-text-medium leading-relaxed">
            {pageUserType === 'company'
              ? 'Share your company details to help us connect you with the right talent and opportunities.'
              : 'Share your details to help us connect you with the right opportunities and people.'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {/* Location Section - Using Controller for custom component or direct register */}
          <div className="space-y-5">
            <div className="flex items-center space-x-2 mb-3">
              <MapPinIcon className="h-5 w-5 text-black" />
              <Label htmlFor="location" className="text-base font-semibold text-brand-text-dark">
                {pageUserType === 'company'
                  ? 'Where is your company headquartered?' 
                  : 'Where are you located?'
                } <span className="text-brand-red">*</span>
              </Label>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
              <p className="text-xs sm:text-sm text-gray-700">
                <strong>💡 Location Benefits:</strong> {pageUserType === 'company'
                  ? 'Your company location helps us match you with local talent and understand your regional market presence.'
                  : 'Your location helps us find relevant job opportunities and connect you with companies in your area.'
                }
              </p>
            </div>
            
            {/* Example if you want to display selected location - this needs to be tied to RHF state */}
            {/* {watch("location") && ( ...display logic... )} */}
            
            <div className="relative">
              <Input
                id="location"
                type="text"
                placeholder="Search for a city, state, or country"
                {...register("location")}
                className="bg-brand-bg-input border-brand-border placeholder-brand-text-light focus:border-black focus:ring-2 focus:ring-black/20 pl-10 h-11 sm:h-12"
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-light" />
            </div>
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
          </div>

          {pageUserType === 'company' ? (
            <>
              <div className="border-t border-brand-border pt-8 space-y-6">
                <div className="flex items-center space-x-2 mb-6"> <BuildingIcon className="h-5 w-5 text-black" /> <h2 className="text-lg sm:text-xl font-semibold text-brand-text-dark">Company Information</h2> </div>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="company_name" className="block text-sm sm:text-base font-semibold text-brand-text-dark mb-3">Company Name <span className="text-brand-red">*</span></Label>
                    <Input id="company_name" {...register("company_name" as keyof CompanyProfileFormValues)} placeholder="Your Company Inc." className="h-11 sm:h-12"/>
                    {errors.company_name && <p className="text-red-500 text-xs mt-1">{(errors.company_name as any).message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="company_type" className="block text-sm sm:text-base font-semibold text-brand-text-dark mb-3">Company Type <span className="text-brand-red">*</span></Label>
                    <Controller name={"company_type" as keyof CompanyProfileFormValues} control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger className="h-11 sm:h-12"><SelectValue placeholder="Select company type" /></SelectTrigger>
                        <SelectContent><SelectItem value="startup">🚀 Startup</SelectItem><SelectItem value="enterprise">🏢 Enterprise</SelectItem></SelectContent>
                      </Select>
                    )}/>
                    {errors.company_type && <p className="text-red-500 text-xs mt-1">{(errors.company_type as any).message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="company_size" className="block text-sm sm:text-base font-semibold text-brand-text-dark mb-3">Company Size <span className="text-brand-red">*</span></Label>
                     <Controller name={"company_size" as keyof CompanyProfileFormValues} control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger className="h-11 sm:h-12"><SelectValue placeholder="Select company size" /></SelectTrigger>
                        <SelectContent><SelectItem value="1-10">👥 1-10</SelectItem><SelectItem value="11-50">👥 11-50</SelectItem></SelectContent>
                      </Select>
                    )}/>
                    {errors.company_size && <p className="text-red-500 text-xs mt-1">{(errors.company_size as any).message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="bio" className="block text-sm sm:text-base font-semibold text-brand-text-dark mb-3">Company Description <span className="text-brand-red">*</span></Label>
                    <AIFormField aiProps={{ fieldType: 'textarea', fieldName: 'Company Description', placeholder: 'Describe your company...', context: { userType: aiFormFieldContextUserType } }}>
                      <Textarea id="bio" {...register("bio" as keyof CompanyProfileFormValues)} placeholder="Describe your company..." className="min-h-[100px] sm:min-h-[120px]"/>
                    </AIFormField>
                    {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
                  </div>
                </div>
              </div>
              <div className="border-t border-brand-border pt-8 space-y-6">
                <div className="flex items-center space-x-2 mb-6"> <BriefcaseIcon className="h-5 w-5 text-black" /> <h2 className="text-lg sm:text-xl font-semibold text-brand-text-dark">Industry & Focus</h2> </div>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="industry" className="block text-sm sm:text-base font-semibold text-brand-text-dark mb-3">Primary Industry <span className="text-brand-red">*</span></Label>
                     <Controller name={"industry" as keyof CompanyProfileFormValues} control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger className="h-11 sm:h-12"><SelectValue placeholder="Select industry" /></SelectTrigger>
                        <SelectContent><SelectItem value="tech">💻 Tech</SelectItem><SelectItem value="finance">💰 Finance</SelectItem></SelectContent>
                      </Select>
                    )}/>
                    {errors.industry && <p className="text-red-500 text-xs mt-1">{(errors.industry as any).message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="tech_stack" className="block text-sm sm:text-base font-semibold text-brand-text-dark mb-3">Tech Stack</Label>
                    <AIFormField aiProps={{ fieldType: 'text', fieldName: 'Tech Stack', placeholder: 'e.g., React, Node.js', context: { userType: aiFormFieldContextUserType } }}>
                      <Input id="tech_stack" {...register("tech_stack" as keyof CompanyProfileFormValues)} placeholder="e.g., React, Node.js, Python, AWS" className="h-11 sm:h-12"/>
                    </AIFormField>
                    {errors.tech_stack && <p className="text-red-500 text-xs mt-1">{(errors.tech_stack as any).message}</p>}
                  </div>
                </div>
              </div>
            </>
          ) : ( // Individual Profile Sections
            <>
              <div className="border-t border-brand-border pt-8 space-y-6">
                <div className="flex items-center space-x-2 mb-6"> <UserIcon className="h-5 w-5 text-black" /> <h2 className="text-lg sm:text-xl font-semibold text-brand-text-dark">Personal Information</h2> </div>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="full_name" className="block text-sm sm:text-base font-semibold text-brand-text-dark mb-3">Full Name <span className="text-brand-red">*</span></Label>
                    <Input id="full_name" {...register("full_name" as keyof IndividualProfileFormValues)} placeholder="e.g. John Doe" className="h-11 sm:h-12"/>
                    {errors.full_name && <p className="text-red-500 text-xs mt-1">{(errors.full_name as any).message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="professional_title" className="block text-sm sm:text-base font-semibold text-brand-text-dark mb-3">What do you do? <span className="text-brand-red">*</span></Label>
                    <AIFormField aiProps={{ fieldType: 'text', fieldName: 'Professional Title', placeholder: 'e.g. Software Developer', context: { userType: aiFormFieldContextUserType } }}>
                      <Input id="professional_title" {...register("professional_title" as keyof IndividualProfileFormValues)} placeholder="e.g. Software Developer" className="h-11 sm:h-12"/>
                    </AIFormField>
                    {errors.professional_title && <p className="text-red-500 text-xs mt-1">{(errors.professional_title as any).message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="years_of_experience" className="block text-sm sm:text-base font-semibold text-brand-text-dark mb-3">Experience Level <span className="text-brand-red">*</span></Label>
                    <Controller name={"years_of_experience" as keyof IndividualProfileFormValues} control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <SelectTrigger className="h-11 sm:h-12"><SelectValue placeholder="Select experience" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0-2">🌱 Beginner (0-2 years)</SelectItem>
                                <SelectItem value="3-5">📈 Intermediate (3-5 years)</SelectItem>
                            </SelectContent>
                        </Select>
                    )}/>
                    {errors.years_of_experience && <p className="text-red-500 text-xs mt-1">{(errors.years_of_experience as any).message}</p>}
                  </div>
                </div>
              </div>
              <div className="border-t border-brand-border pt-8 space-y-6">
                 <div className="flex items-center space-x-2 mb-6"> <BriefcaseIcon className="h-5 w-5 text-black" /> <h2 className="text-lg sm:text-xl font-semibold text-brand-text-dark">Professional Background</h2> </div>
                 <div className="space-y-6">
                    <div>
                        <Label htmlFor="job_function" className="block text-sm sm:text-base font-semibold text-brand-text-dark mb-3">Primary Field <span className="text-brand-red">*</span></Label>
                        <Controller name={"job_function" as keyof IndividualProfileFormValues} control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <SelectTrigger className="h-11 sm:h-12"><SelectValue placeholder="Select primary field" /></SelectTrigger>
                                <SelectContent><SelectItem value="tech">💻 Tech</SelectItem><SelectItem value="design">🎨 Design</SelectItem></SelectContent>
                            </Select>
                        )}/>
                        {errors.job_function && <p className="text-red-500 text-xs mt-1">{(errors.job_function as any).message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="key_skills" className="block text-sm sm:text-base font-semibold text-brand-text-dark mb-3">Key Skills & Tools</Label>
                        <AIFormField aiProps={{ fieldType: 'text', fieldName: 'Key Skills', placeholder: 'e.g., JavaScript, Photoshop', context: { userType: aiFormFieldContextUserType, role: watch("professional_title" as keyof IndividualProfileFormValues) } }}>
                          <Input id="key_skills" {...register("key_skills" as keyof IndividualProfileFormValues)} placeholder="e.g., JavaScript, Photoshop" className="h-11 sm:h-12"/>
                        </AIFormField>
                        {errors.key_skills && <p className="text-red-500 text-xs mt-1">{(errors.key_skills as any).message}</p>}
                    </div>
                 </div>
              </div>
              <div className="border-t border-brand-border pt-8 space-y-6">
                <div className="flex items-center space-x-2 mb-6"> <GraduationCapIcon className="h-5 w-5 text-black" /> <h2 className="text-lg sm:text-xl font-semibold text-brand-text-dark">Education</h2> </div>
                <div className="space-y-6">
                    <div>
                        <Label htmlFor="education_level" className="block text-sm sm:text-base font-semibold text-brand-text-dark mb-3">Educational Background <span className="text-brand-red">*</span></Label>
                        <Controller name={"education_level" as keyof IndividualProfileFormValues} control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <SelectTrigger className="h-11 sm:h-12"><SelectValue placeholder="Select education level" /></SelectTrigger>
                                <SelectContent><SelectItem value="bachelors">🎓 Bachelor's</SelectItem><SelectItem value="masters">🎖️ Master's</SelectItem></SelectContent>
                            </Select>
                        )}/>
                        {errors.education_level && <p className="text-red-500 text-xs mt-1">{(errors.education_level as any).message}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label htmlFor="field_of_study" className="block text-sm sm:text-base font-semibold text-brand-text-dark mb-3">Field of Study</Label><Input id="field_of_study" {...register("field_of_study" as keyof IndividualProfileFormValues)} placeholder="e.g. Computer Science" className="h-11 sm:h-12"/></div>
                        <div><Label htmlFor="institution" className="block text-sm sm:text-base font-semibold text-brand-text-dark mb-3">Institution</Label><Input id="institution" {...register("institution" as keyof IndividualProfileFormValues)} placeholder="e.g. Stanford University" className="h-11 sm:h-12"/></div>
                    </div>
                </div>
              </div>
            </>
          )}
          {/* Common Fields: Links and Bio */}
           <div className="border-t border-brand-border pt-8 space-y-6">
                <div className="flex items-center space-x-2 mb-6"> <LinkIcon className="h-5 w-5 text-black" /> <h2 className="text-lg sm:text-xl font-semibold text-brand-text-dark">Online Presence</h2> </div>
                <div className="space-y-6">
                    <div><Label htmlFor="website_url" className="block text-sm sm:text-base font-semibold text-brand-text-dark mb-2">Website</Label><Input id="website_url" {...register("website_url")} placeholder="https://yourpersonalwebsite.com" className="h-11 sm:h-12"/>{errors.website_url && <p className="text-red-500 text-xs mt-1">{errors.website_url.message}</p>}</div>
                    <div><Label htmlFor="linkedin_url" className="block text-sm sm:text-base font-semibold text-brand-text-dark mb-2">LinkedIn Profile</Label><Input id="linkedin_url" {...register("linkedin_url")} placeholder="https://linkedin.com/in/yourprofile" className="h-11 sm:h-12"/>{errors.linkedin_url && <p className="text-red-500 text-xs mt-1">{errors.linkedin_url.message}</p>}</div>
                </div>
           </div>
            <div className="border-t border-brand-border pt-8 space-y-4">
                <Label htmlFor="bio" className="block text-base font-semibold text-brand-text-dark mb-3">
                    {pageUserType === 'company' ? 'Company Overview / Mission' : 'Your Professional Bio'}
                    <span className="text-brand-red">*</span>
                </Label>
                 <AIFormField aiProps={{ fieldType: 'textarea', fieldName: pageUserType === 'company' ? 'Company Overview' : 'Professional Bio', placeholder: 'Tell us more...', context: { userType: aiFormFieldContextUserType } }}>
                    <Textarea id="bio" {...register("bio")} placeholder="Share a brief summary..." className="min-h-[100px] sm:min-h-[120px]"/>
                 </AIFormField>
                {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
            </div>


          <div className="pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black hover:bg-gray-900 text-white py-3 font-medium text-base rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Continue to Preferences →"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Loading...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
