"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Logo } from "@/components/logo"; // Logo component not used
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { loginUser as apiLoginUser } from "@/lib/api"; // API function for your backend
import { auth as firebaseAuth } from "@/lib/firebase"; // Firebase auth instance
import { signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

// Zod Schema for Login
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"), // Min 1, as min 8 is for signup
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: authLoginContext, user: authUser } = useAuth(); // Get login function from AuthContext

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    try {
      // Step 1: Sign in with Firebase
      const firebaseUserCredential = await firebaseSignInWithEmailAndPassword(firebaseAuth, data.email, data.password);
      const firebaseUser = firebaseUserCredential.user;

      if (firebaseUser) {
        if (!firebaseUser.emailVerified) {
          // Optional: Resend verification email if user tries to log in without verifying
          await sendEmailVerification(firebaseUser);
          toast.error("Your email is not verified. We've sent a new verification link. Please check your inbox.", { duration: 10000 });
          // It's important NOT to log them into your backend here.
          // They should verify first.
          // Optionally, you could sign them out of Firebase locally too: await firebaseAuth.signOut();
          return; // Stop the login process
        }

        // Step 2: Call your backend's login endpoint to get your app's JWT token
        // This endpoint should verify credentials against your PostgreSQL DB
        const backendLoginResponse = await apiLoginUser({
          email: data.email,
          password: data.password, // Your backend will re-verify this password
        });

        if (backendLoginResponse.token && backendLoginResponse.user) {
          // Step 3: Update AuthContext with token and user data from your backend
          authLoginContext(backendLoginResponse.token, backendLoginResponse.user);
          toast.success("Logged in successfully!");

          // Step 4: Navigation
          // Check if user has completed onboarding. This check might need to be more robust.
          // For instance, check a specific flag from backendLoginResponse.user or a profile field.
          const isOnboardingComplete = backendLoginResponse.user.profile?.bio; // Example check

          if (isOnboardingComplete) {
            router.push("/feed"); // Or any other main app page
          } else {
            // Redirect to the correct onboarding step.
            // Pass userType from backendLoginResponse.user.user_type
            const userType = backendLoginResponse.user.user_type || 'individual';
            // TODO: Determine the correct next onboarding step based on backendLoginResponse.user data
            // For now, redirecting to verify-email as a fallback or if it's the first step.
            // This logic needs to be smarter, perhaps checking profile, preferences etc.
            router.push(`/auth/ai integration/onboarding/verify-email?type=${userType}&email=${data.email}`);
          }
        } else {
          toast.error("Login failed. Invalid response from server.");
        }
      } else {
        // This case should ideally not be reached if Firebase sign-in fails, as it would throw an error.
        toast.error("Firebase login failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "An unknown error occurred during login.";
      if (error.code) { // Firebase errors
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential': // More generic Firebase error for invalid email/password
            errorMessage = "Invalid email or password.";
            break;
          case 'auth/invalid-email':
            errorMessage = "The email address is not valid.";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.";
            break;
          default:
            errorMessage = `Firebase error: ${error.message}`;
        }
      } else if (error.response?.data?.message) { // Error from your backend API
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    }
  };

  // If user is already logged in (e.g. page reloaded with valid token), redirect
  useEffect(() => {
    if (authUser) {
      const nextUrl = searchParams.get('next') || '/feed';
      router.replace(nextUrl);
    }
  }, [authUser, router, searchParams]);


  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex w-full max-w-6xl mx-auto rounded-2xl shadow-xl overflow-hidden border">
        <div className="w-1/2 flex-col items-center justify-center bg-[#FFFCF6] p-12 hidden md:flex">
          <Image
            src="/imagex.png"
            alt="Decorative Abstract Pattern"
            width={400}
            height={400}
            className="mb-10"
            priority
          />
          <h2 className="text-3xl font-black text-brand-text-dark text-left w-full mb-2" style={{fontFamily: 'Inter, sans-serif'}}>
              Where Connections Spark Opportunities
            </h2>
          <p className="text-lg text-brand-text-medium text-left w-full" style={{fontFamily: 'Inter, sans-serif'}}>
            Real roles. Real startups.
          </p>
        </div>
        <div className="w-full md:w-1/2 flex flex-col justify-center bg-white p-8 sm:p-12 min-h-full">
          <div className="mb-8 text-center">
            <span className="text-2xl font-black" style={{fontFamily: 'Lora, serif', color: '#000000'}}>100</span>
            <span className="text-2xl font-black" style={{fontFamily: 'Lora, serif', color: '#0056B3'}}>Networks</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-text-dark mb-8 text-center" style={{fontFamily: 'Inter, sans-serif'}}>Login</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-base font-semibold text-brand-text-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@gmail.com"
                {...register("email")}
                className="mt-2 bg-brand-bg-input border-brand-border placeholder-brand-text-light focus:border-brand-blue focus:ring-1 focus:ring-brand-blue py-3 px-4 text-base sm:text-lg font-bold"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password" className="text-base font-semibold text-brand-text-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  {...register("password")}
                  className="mt-2 bg-brand-bg-input border-brand-border placeholder-brand-text-light focus:border-brand-blue focus:ring-1 focus:ring-brand-blue py-3 px-4 text-base sm:text-lg font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 sm:px-4 flex items-center text-brand-text-medium hover:text-brand-blue"
                >
                  {showPassword ? <EyeOffIcon className="h-5 w-5 sm:h-6 sm:w-6" /> : <EyeIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black hover:bg-brand-text-dark text-white py-3 text-base sm:text-lg font-bold rounded-lg mt-2 shadow-md"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="flex items-center my-6">
            <hr className="flex-grow border-brand-border" />
            <span className="mx-2 sm:mx-4 text-sm sm:text-base text-brand-text-medium font-medium">or Sign in with</span>
            <hr className="flex-grow border-brand-border" />
          </div>
          
          <div className="flex gap-4 sm:gap-8 mb-6 justify-center">
            <button className="hover:opacity-70 transition-opacity cursor-pointer">
              <svg className="w-10 h-10 sm:w-12 sm:h-12" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>
            <button className="hover:opacity-70 transition-opacity cursor-pointer">
              <svg className="w-10 h-10 sm:w-12 sm:h-12" viewBox="0 0 24 24">
                <path fill="#0077B5" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </button>
          </div>
          <div className="mt-8 text-center">
            <span className="text-sm sm:text-base font-bold text-brand-text-dark">Don&apos;t have an account? </span>
            <Link href="/auth/ai integration/signup" className="font-bold text-brand-blue underline ml-1 text-sm sm:text-base">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
