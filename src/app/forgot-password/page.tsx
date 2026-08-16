"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Loader2,
  Mail,
  CheckCircle2,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/client";


export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [sent, setSent] =
    useState(false);


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSent(false);
    setLoading(true);

    const supabase =
      createClient();

    try {
      /*
       * window.location.origin automatically becomes:
       *
       * Local:
       * http://localhost:3000
       *
       * Production:
       * https://your-site.vercel.app
       */

      const redirectTo =
        `${window.location.origin}/reset-password`;

      const {
        error: resetError,
      } =
        await supabase.auth
          .resetPasswordForEmail(
            email.trim(),
            {
              redirectTo,
            }
          );

      if (resetError) {
        throw resetError;
      }

      setSent(true);

    } catch (err: unknown) {
      let message =
        "Unable to send password reset email.";

      if (
        typeof err === "object" &&
        err !== null
      ) {
        const authError =
          err as {
            message?: string;
          };

        if (authError.message) {
          message =
            authError.message;
        }
      }

      setError(message);

    } finally {
      setLoading(false);
    }
  }


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


        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

          {sent ? (

            /*
             * =========================
             * EMAIL SENT
             * =========================
             */

            <div className="text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">

                <CheckCircle2
                  size={28}
                />

              </div>

              <h2 className="mt-5 text-2xl font-bold text-slate-900">

                Check your email

              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">

                If an account exists for{" "}
                <span className="font-semibold text-slate-700">
                  {email}
                </span>
                , a password reset link has been sent.

              </p>

              <Link
                href="/login"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >

                <ArrowLeft size={17} />

                Back to Login

              </Link>

            </div>

          ) : (

            /*
             * =========================
             * RESET REQUEST
             * =========================
             */

            <>

              <div className="mb-6">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                  <Mail size={21} />

                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-900">

                  Forgot password?

                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">

                  Enter the email address you used to create your account.
                  We&apos;ll send you a password reset link.

                </p>

              </div>


              {error && (

                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

                  {error}

                </div>

              )}


              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

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
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>


                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}

                </button>

              </form>


              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
              >

                <ArrowLeft size={16} />

                Back to Login

              </Link>

            </>

          )}

        </div>

      </div>

    </main>
  );
}