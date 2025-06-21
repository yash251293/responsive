"use client";

import { Button } from "@/components/ui/button";
import { UploadCloudIcon, FileTextIcon, XIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { OnboardingStepper } from "@/components/onboarding-stepper";
import { useState, useRef, ChangeEvent, Suspense } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { uploadUserResume } from "@/lib/api";

function ResumePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token, refetchUser, isLoading: isAuthLoading } = useAuth();

  const pageUserType = user?.user_type || searchParams.get('type') as 'individual' | 'company' || 'individual';

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/rtf", "text/plain"];
      if (!allowedTypes.includes(file.type)) {
        setFileError("Invalid file type. Please upload PDF, DOC, DOCX, RTF, or TXT.");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setFileError("File is too large. Maximum size is 5MB.");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("No file selected.");
      return;
    }
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }
    if (pageUserType !== 'individual') {
        toast.error("Resume upload is for individual users only.");
        return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("resume", selectedFile);

    try {
      await uploadUserResume(formData, token);
      toast.success("Resume uploaded successfully!");
      await refetchUser();
      router.push(`/auth/ai integration/onboarding/done?type=${pageUserType}`);
    } catch (error: any) {
      toast.error("Resume upload failed: " + (error.data?.message || error.message || "Unknown error."));
    } finally {
      setIsUploading(false);
    }
  };

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Loading resume page...</div>;
  }

  if (!user) {
    toast.error("User not found. Redirecting to login.");
    if (typeof window !== 'undefined') router.push('/auth/ai integration/login');
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
  }

  if (pageUserType === 'company') {
    toast.info("Resume upload is for individual users. Redirecting...");
    if (typeof window !== 'undefined') router.push(`/auth/ai integration/onboarding/done?type=company`);
    return <div className="min-h-screen flex items-center justify-center">This page is for individual users. Redirecting...</div>;
  }


  return (
    <div className="min-h-screen bg-brand-bg-light-gray py-8">
      <OnboardingStepper />
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md text-center relative">
        <Button
          variant="outline"
          className="absolute top-4 right-4 border-gray-300 text-gray-600 hover:bg-gray-100 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5"
          asChild
        >
          <Link href={`/auth/ai integration/onboarding/done?type=${pageUserType}`}>Skip</Link>
        </Button>

        <h1 className="text-xl sm:text-2xl font-bold text-brand-text-dark mb-2">Upload your Resume or CV</h1>
        <p className="text-sm sm:text-base text-brand-text-medium mb-6 sm:mb-8">
          Showcase your experience by uploading your resume. Supported formats: PDF, DOC, DOCX, RTF, TXT. Max 5MB.
        </p>

        <div className="border-2 border-dashed border-brand-border rounded-lg p-6 sm:p-10 mb-6">
          <UploadCloudIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-brand-text-light mb-3 sm:mb-4" />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.rtf,.txt"
            style={{ display: 'none' }}
            id="resumeUpload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-black hover:bg-gray-900 text-white font-medium text-sm sm:text-base"
            type="button"
            disabled={isUploading}
          >
            Choose File
          </Button>

          {selectedFile && !fileError && (
            <div className="mt-4 text-sm text-green-600 flex items-center justify-center">
              <FileTextIcon className="w-4 h-4 mr-2" />
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              <button onClick={() => {setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = "";}} className="ml-2 text-red-500 hover:text-red-700"><XIcon className="w-4 h-4"/></button>
            </div>
          )}
          {fileError && <p className="text-sm text-red-600 mt-3">{fileError}</p>}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
                onClick={handleUpload}
                disabled={!selectedFile || !!fileError || isUploading}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-medium"
            >
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? "Uploading..." : "Upload & Continue"}
            </Button>
            <Button
                variant="outline"
                className="w-full sm:w-auto border-brand-border text-brand-text-medium hover:bg-brand-bg-light-gray font-medium"
                asChild
            >
                <Link href={`/auth/ai integration/onboarding/done?type=${pageUserType}`}>Finish Later</Link>
            </Button>
        </div>
      </div>
    </div>
  );
}

export default function ResumePage() {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Loading...</div>}>
        <ResumePageContent />
      </Suspense>
    );
}
