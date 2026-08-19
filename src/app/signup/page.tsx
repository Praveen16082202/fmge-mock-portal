"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";

import {
  UserPlus,
  Loader2,
} from "lucide-react";


export default function SignupPage() {
  const router =
    useRouter();

  const [
    fullName,
    setFullName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);


  /*
   * =========================================
   * SIGN UP
   * =========================================
   */

  async function handleSignup(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    const supabase =
      createClient();

    try {

      /*
       * Basic validation
       */

      if (
        !fullName.trim()
      ) {
        setError(
          "Please enter your full name."
        );

        return;
      }


      if (
        password.length < 6
      ) {
        setError(
          "Password must contain at least 6 characters."
        );

        return;
      }


      /*
       * =====================================
       * CREATE SUPABASE ACCOUNT
       * =====================================
       *
       * full_name is stored inside:
       *
       * auth.users.raw_user_meta_data
       *
       * Your existing database trigger
       * then copies it into:
       *
       * student_profiles.full_name
       */

      const {
        data,
        error: signupError,
      } =
        await supabase.auth.signUp({
          email:
            email.trim(),

          password,

          options: {
            data: {
              full_name:
                fullName.trim(),
            },
          },
        });


      if (signupError) {
        throw signupError;
      }


      /*
       * =====================================
       * EMAIL CONFIRMATION DISABLED
       * =====================================
       *
       * If Supabase immediately creates
       * a session, send student to dashboard.
       */

      if (data.session) {

        router.push(
          "/dashboard"
        );

        router.refresh();

        return;
      }


      /*
       * =====================================
       * EMAIL CONFIRMATION ENABLED
       * =====================================
       */

      setMessage(
        "Account created successfully. Please check your email to verify your account before signing in."
      );


      /*
       * Clear password after signup.
       */

      setPassword("");

    } catch (err: unknown) {

      console.error(
        "Signup failed:",
        err
      );


      let errorMessage =
        "Unable to create your account. Please try again.";


      if (
        typeof err === "object" &&
        err !== null
      ) {

        const signupError =
          err as {
            message?: string;
          };


        if (
          signupError.message
        ) {
          errorMessage =
            signupError.message;
        }

      }


      setError(
        errorMessage
      );

    } finally {

      setLoading(false);

    }
  }


  /*
   * =========================================
   * PAGE
   * =========================================
   */

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">

      <div className="w-full max-w-md">


        {/* Logo */}

        <div className="mb-8 text-center">

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">

            FMGE
            <span className="text-blue-600">
              Prep
            </span>

          </h1>


          <p className="mt-1 text-sm text-slate-400">

            Mock Test Portal

          </p>

        </div>


        {/* Sign Up Card */}

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">


          <div className="mb-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

              <UserPlus
                size={21}
              />

            </div>


            <h2 className="mt-5 text-2xl font-bold text-slate-900">

              Create account

            </h2>


            <p className="mt-2 text-sm leading-6 text-slate-500">

              Create your FMGE Prep account to begin practicing.

            </p>

          </div>


          {/* Error */}

          {error && (

            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

              {error}

            </div>

          )}


          {/* Success */}

          {message && (

            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-600">

              {message}

            </div>

          )}


          {/* Form */}

          <form
            onSubmit={
              handleSignup
            }
            className="space-y-5"
          >


            {/* Full Name */}

            <div>

              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >

                Full Name

              </label>


              <input
                id="fullName"
                type="text"
                value={
                  fullName
                }
                onChange={(
                  event
                ) =>
                  setFullName(
                    event.target.value
                  )
                }
                placeholder="Enter your full name"
                required
                autoComplete="name"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* Email */}

            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >

                Email

              </label>


              <input
                id="email"
                type="email"
                value={
                  email
                }
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* Password */}

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >

                Password

              </label>


              <input
                id="password"
                type="password"
                value={
                  password
                }
                onChange={(
                  event
                ) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="At least 6 characters"
                minLength={6}
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />


              <p className="mt-2 text-xs text-slate-400">

                Use at least 6 characters.

              </p>

            </div>


            {/* Submit */}

            <button
              type="submit"
              disabled={
                loading
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (

                <>

                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Creating account...

                </>

              ) : (

                "Create Account"

              )}

            </button>

          </form>


          {/* Login */}

          <p className="mt-6 text-center text-sm text-slate-500">

            Already have an account?{" "}

            <Link
              href="/login"
              className="font-semibold text-blue-600 transition hover:text-blue-700"
            >

              Sign in

            </Link>

          </p>

        </div>


        {/* Footer */}

        <p className="mt-6 text-center text-xs text-slate-400">

          FMGE Prep • Mock Test Portal

        </p>

      </div>

    </main>
  );
}