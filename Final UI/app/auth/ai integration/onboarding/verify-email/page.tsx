"use client";

import { OnboardingStepper } from "@/components/onboarding-stepper";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MailCheck, Smartphone, RefreshCwIcon, AlertTriangle } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { auth as firebaseAuth } from "@/lib/firebase";
import { sendEmailVerification as firebaseSendEmailVerification, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { markUserEmailAsVerified, markUserAsVerified as markUserPhoneAsVerified } from "@/lib/api";

// Extend window type for recaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authContextUser, token, refetchUser, isLoading: isAuthLoading } = useAuth();

  const queryUserType = searchParams.get('type') || 'individual';
  const queryEmail = searchParams.get('email'); // Email passed from signup

  const [method, setMethod] = useState<'email' | 'phone'>('email');

  // Email state
  const [emailForDisplay, setEmailForDisplay] = useState(queryEmail || authContextUser?.email || '');
  const [isEmailActionLoading, setIsEmailActionLoading] = useState(false);
  const [emailVerifiedStatus, setEmailVerifiedStatus] = useState(authContextUser?.profile?.is_email_verified || false); // Assuming profile has this, adjust if needed

  // Phone state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(authContextUser?.profile?.is_phone_verified ||false); // Assuming profile has this
  const [confirmationResultState, setConfirmationResultState] = useState<ConfirmationResult | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const finalUserType = authContextUser?.user_type || queryUserType;

  // Initialize reCAPTCHA for phone verification
  useEffect(() => {
    if (method === 'phone' && typeof window !== 'undefined' && !window.recaptchaVerifier && document.getElementById('recaptcha-container-verify')) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container-verify', {
          'size': 'invisible',
          'callback': (response: any) => console.log("Recaptcha verified (invisible)", response),
          'expired-callback': () => {
            toast.error("Recaptcha expired. Please try sending OTP again.");
            window.recaptchaVerifier?.clear();
          }
        });
        window.recaptchaVerifier.render().catch(err => {
          console.error("Recaptcha render error:", err);
          toast.error("Could not render reCAPTCHA. Ensure you're online and refresh.");
        });
      } catch (e) {
        console.error("Error initializing recaptcha:", e);
        toast.error("Failed to initialize phone verification system.");
      }
    }
    return () => {
      // Consider if cleanup is truly needed or if Firebase handles it.
      // window.recaptchaVerifier?.clear(); // Can cause issues if component re-renders often.
    };
  }, [method]);

  useEffect(() => {
    if (authContextUser) {
      setEmailForDisplay(authContextUser.email || queryEmail || '');
      // Check if these fields exist on the user object directly or nested in profile
      // Assuming is_email_verified and is_phone_verified are top-level on the user object from AuthContext
      setEmailVerifiedStatus(authContextUser.is_email_verified || false);
      setPhoneVerified(authContextUser.is_phone_verified || false);
    }
  }, [authContextUser, queryEmail]);


  const handleResendVerificationEmail = async () => {
    setIsEmailActionLoading(true);
    const firebaseUser = firebaseAuth.currentUser;
    if (firebaseUser) {
      try {
        await firebaseSendEmailVerification(firebaseUser);
        toast.success("Verification email resent. Please check your inbox.", { duration: 5000 });
      } catch (error: any) {
        console.error("Error resending verification email:", error);
        toast.error(`Failed to resend email: ${error.message}`);
      }
    } else {
      toast.error("Not logged in with Firebase. Please sign up again if this issue persists.");
    }
    setIsEmailActionLoading(false);
  };

  const handleCheckEmailVerification = async () => {
    setIsEmailActionLoading(true);
    const firebaseUser = firebaseAuth.currentUser;
    if (firebaseUser) {
      await firebaseUser.reload(); // Important: reload user data from Firebase
      if (firebaseUser.emailVerified) {
        if (token) {
          try {
            await markUserEmailAsVerified(token); // Update our backend
            await refetchUser(); // Refresh AuthContext user
            setEmailVerifiedStatus(true);
            toast.success("Email successfully verified!");
            router.push(`/auth/ai integration/onboarding/profile?type=${finalUserType}`);
          } catch (apiError: any) {
            toast.error(`Failed to update verification status: ${apiError.message}`);
          }
        } else {
          toast.error("Authentication token not found. Please log in.");
        }
      } else {
        toast.info("Email not yet verified. Please check your inbox or resend the email.", { duration: 7000 });
      }
    } else {
      toast.error("Not logged in with Firebase. Please try logging in again.");
    }
    setIsEmailActionLoading(false);
  };

  const handleSendPhoneOtp = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!phone) {
      toast.error("Please enter your phone number.");
      return;
    }
    if (!window.recaptchaVerifier) {
      toast.error("Recaptcha not initialized. Please wait or refresh the page.");
      return;
    }
    setIsSendingOtp(true);
    try {
      const formattedPhoneNumber = phone.startsWith('+') ? phone : `+${phone}`;
      const confirmation = await signInWithPhoneNumber(firebaseAuth, formattedPhoneNumber, window.recaptchaVerifier);
      setConfirmationResultState(confirmation);
      setOtpSent(true);
      toast.success("OTP sent successfully to your phone!");
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast.error(`Failed to send OTP: ${error.message}`);
      window.recaptchaVerifier?.render().catch(err => console.error("Recaptcha re-render error:", err));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }
    if (!confirmationResultState) {
      toast.error("OTP not sent or confirmation result missing.");
      return;
    }
    if (!token) {
      toast.error("Authentication token not found. Please log in.");
      return;
    }
    setIsVerifyingOtp(true);
    try {
      await confirmationResultState.confirm(otp);
      await markUserPhoneAsVerified(token); // Update backend for phone verification
      setPhoneVerified(true);
      await refetchUser(); // Refresh AuthContext
      toast.success("Phone number verified successfully!");
      router.push(`/auth/ai integration/onboarding/profile?type=${finalUserType}`);
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast.error(`Failed to verify OTP: ${error.message}`);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!authContextUser && !queryEmail) { // If not logged in via context and no email from signup (direct access)
    toast.error("User session not found. Redirecting to login.");
    if (typeof window !== 'undefined') router.push('/auth/ai integration/login');
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
  }


  return (
    <div className="min-h-screen bg-brand-bg-light-gray py-8">
      <OnboardingStepper />
      <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md text-center relative">
        <Button
          variant="outline"
          className="absolute top-4 right-4 border-gray-300 text-gray-600 hover:bg-gray-100"
          asChild
        >
          <Link href={`/auth/ai integration/onboarding/profile?type=${finalUserType}`}>Skip</Link>
        </Button>
        
        <div className="flex justify-center mb-6">
          <button
            className={`flex items-center px-4 py-2 rounded-l-lg border font-medium text-base ${method === 'email' ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200'}`}
            onClick={() => setMethod('email')}
          >
            <MailCheck className="w-5 h-5 mr-2" /> Email
          </button>
          <button
            className={`flex items-center px-4 py-2 rounded-r-lg border-t border-b border-r font-medium text-base ${method === 'phone' ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200'}`}
            onClick={() => setMethod('phone')}
          >
            <Smartphone className="w-5 h-5 mr-2" /> Phone
          </button>
        </div>

        <h1 className="text-2xl font-bold text-brand-text-dark mb-4">Verify Your {method === 'email' ? 'Email' : 'Phone Number'}</h1>

        {method === 'email' && (
          <div className="space-y-6">
            {emailVerifiedStatus ? (
              <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
                <MailCheck className="w-6 h-6 inline mr-2" /> Your email ({emailForDisplay}) is verified!
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md border border-yellow-200">
                 <AlertTriangle className="w-6 h-6 inline mr-2" /> Your email ({emailForDisplay}) is not yet verified.
              </div>
            )}
            <p className="text-brand-text-medium">
              A verification link was sent to <strong>{emailForDisplay || 'your email address'}</strong> during signup.
              Please click the link in that email to verify your account.
            </p>
            <Button
              onClick={handleCheckEmailVerification}
              disabled={isEmailActionLoading || emailVerifiedStatus}
              className="w-full bg-black hover:bg-gray-900 text-white font-medium"
            >
              <RefreshCwIcon className={`w-4 h-4 mr-2 ${isEmailActionLoading ? 'animate-spin' : ''}`} />
              {isEmailActionLoading ? 'Checking...' : (emailVerifiedStatus ? 'Email Verified' : 'I have verified / Check Status')}
            </Button>
            {!emailVerifiedStatus && (
              <Button
                variant="outline"
                onClick={handleResendVerificationEmail}
                disabled={isEmailActionLoading}
                className="w-full"
              >
                {isEmailActionLoading ? 'Sending...' : 'Resend Verification Email'}
              </Button>
            )}
            {emailVerifiedStatus && (
                 <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white font-medium">
                    <Link href={`/auth/ai integration/onboarding/profile?type=${finalUserType}`}>Continue</Link>
                 </Button>
            )}
          </div>
        )}

        {method === 'phone' && (
          <>
            {phoneVerified ? (
                 <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200 mb-4">
                    <Smartphone className="w-6 h-6 inline mr-2" /> Your phone number is verified!
                 </div>
            ) : (
                <p className="text-brand-text-medium mb-6">
                Enter your phone number to receive a one-time password (OTP).
                </p>
            )}

            {!otpSent && !phoneVerified && (
              <form className="space-y-6" onSubmit={handleSendPhoneOtp}>
                <Input
                  type="tel"
                  placeholder="Enter your phone number (e.g. +1...)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="mb-2"
                  required
                  disabled={isSendingOtp || otpSent}
                />
                <div id="recaptcha-container-verify" className="my-2 flex justify-center"></div>
                <Button type="submit" className="w-full bg-black hover:bg-gray-900 text-white font-medium" disabled={isSendingOtp}>
                  {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </form>
            )}

            {otpSent && !phoneVerified && (
              <div className="mt-8">
                <p className="mb-4 text-brand-text-medium">Enter the 6-digit OTP sent to your phone.</p>
                <InputOTP maxLength={6} value={otp} onChange={setOtp} className="mx-auto" containerClassName="justify-center mb-4" >
                  <InputOTPGroup>
                    {[...Array(6)].map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <Button
                  className="w-full bg-black hover:bg-gray-900 text-white font-medium mt-4"
                  onClick={handleVerifyPhoneOtp}
                  disabled={otp.length !== 6 || isVerifyingOtp}
                >
                  {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </div>
            )}
            {phoneVerified && (
                <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white font-medium mt-4">
                    <Link href={`/auth/ai integration/onboarding/profile?type=${finalUserType}`}>Continue</Link>
                </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}


export default function VerifyEmailPage() {
  return (
    // Suspense boundary for Next.js App Router if useSearchParams is used directly or in children.
    // For this component structure, VerifyEmailPageContent directly uses useSearchParams.
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading verification options...</div>}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
