"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  CheckCircle2,
  KeyRound,
  Loader2,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/client";


export default function ResetPasswordPage() {
  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [checking, setChecking] =
    useState(true);

  const [
    validSession,
    setValidSession,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);


  /*
   * =========================================
   * CHECK RECOVERY SESSION
   * =========================================
   */

  useEffect(() => {
    const supabase =
      createClient();

    async function checkRecoverySession() {
      try {
        /*
         * Existing session
         */

        const {
          data: { session },
        } =
          await supabase.auth.getSession();

        if (session) {
          setValidSession(true);
        }


        /*
         * Listen for Supabase password
         * recovery authentication event.
         */

        const {
          data: {
            subscription,
          },
        } =
          supabase.auth.onAuthStateChange(
            (
              event,
              session
            ) => {

              if (
                event ===
                "PASSWORD_RECOVERY"
              ) {
                setValidSession(
                  true
                );
              }

              if (session) {
                setValidSession(
                  true
                );
              }

              setChecking(false);
            }
          );


        /*
         * Safety fallback
         */

        window.setTimeout(
          () => {
            setChecking(false);
          },
          1000
        );


        return () => {
          subscription.unsubscribe();
        };

      } catch {
        setChecking(false);
      }
    }


    let cleanup:
      | (() => void)
      | undefined;


    checkRecoverySession().then(
      (result) => {
        cleanup = result;
      }
    );


    return () => {
      cleanup?.();
    };

  }, []);


  /*
   * =========================================
   * RESET PASSWORD
   * =========================================
   */

  async function handleReset(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");


    /*
     * Password length
     */

    if (
      password.length < 6
    ) {
      setError(
        "Password must contain at least 6 characters."
      );

      return;
    }


    /*
     * Password match
     */

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }


    setLoading(true);

    const supabase =
      createClient();


    try {

      /*
       * =================================
       * UPDATE PASSWORD
       * =================================
       */

      const {
        error: updateError,
      } =
        await supabase.auth.updateUser({
          password,
        });


      if (updateError) {
        throw updateError;
      }


      /*
       * =================================
       * SHOW SUCCESS FIRST
       * =================================
       */

      setSuccess(true);


      /*
       * =================================
       * CHECK ADMIN STATUS
       * =================================
       */

      const {
        data: isAdmin,
        error: adminCheckError,
      } =
        await supabase.rpc(
          "is_admin"
        );


      if (adminCheckError) {
        throw adminCheckError;
      }


      /*
       * =================================
       * REDIRECT
       * =================================
       *
       * Admin:
       * /admin
       *
       * Student:
       * /dashboard
       */

      window.setTimeout(
        () => {

          if (
            isAdmin === true
          ) {
            window.location.href =
              "/admin";

          } else {
            window.location.href =
              "/dashboard";
          }

        },
        1200
      );

    } catch (err: unknown) {

      let message =
        "Unable to update password.";


      if (
        typeof err === "object" &&
        err !== null
      ) {

        const authError =
          err as {
            message?: string;
          };


        if (
          authError.message
        ) {
          message =
            authError.message;
        }

      }


      setSuccess(false);

      setError(message);

    } finally {

      setLoading(false);

    }
  }


  /*
   * =========================================
   * CHECKING RESET LINK
   * =========================================
   */

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="flex items-center gap-3 text-sm text-slate-500">

          <Loader2
            size={20}
            className="animate-spin"
          />

          Verifying reset link...

        </div>

      </main>
    );
  }


  /*
   * =========================================
   * SUCCESS
   * =========================================
   */

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">

            <CheckCircle2
              size={28}
            />

          </div>


          <h1 className="mt-5 text-2xl font-bold text-slate-900">

            Password updated

          </h1>


          <p className="mt-2 text-sm leading-6 text-slate-500">

            Your password has been changed successfully.

          </p>


          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">

            <Loader2
              size={16}
              className="animate-spin"
            />

            Redirecting to your portal...

          </div>

        </div>

      </main>
    );
  }


  /*
   * =========================================
   * INVALID / EXPIRED LINK
   * =========================================
   */

  if (!validSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">

        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <h1 className="text-xl font-bold text-slate-900">

            Invalid or expired reset link

          </h1>


          <p className="mt-2 text-sm leading-6 text-slate-500">

            Request a new password reset link and try again.

          </p>


          <Link
            href="/forgot-password"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >

            Request New Link

          </Link>

        </div>

      </main>
    );
  }


  /*
   * =========================================
   * RESET FORM
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


        {/* Card */}

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">


          <div className="mb-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

              <KeyRound size={21} />

            </div>


            <h2 className="mt-5 text-2xl font-bold text-slate-900">

              Set new password

            </h2>


            <p className="mt-2 text-sm text-slate-500">

              Enter a new password for your account.

            </p>

          </div>


          {/* Error */}

          {error && (

            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

              {error}

            </div>

          )}


          {/* Form */}

          <form
            onSubmit={handleReset}
            className="space-y-5"
          >


            {/* New password */}

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >

                New Password

              </label>


              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter new password"
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* Confirm password */}

            <div>

              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >

                Confirm Password

              </label>


              <input
                id="confirmPassword"
                type="password"
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Confirm new password"
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* Submit */}

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

                  Updating...
                </>

              ) : (

                "Update Password"

              )}

            </button>

          </form>

        </div>

      </div>

    </main>
  );
}