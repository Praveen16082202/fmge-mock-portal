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
  LogIn,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";


export default function LoginPage() {
  const router =
    useRouter();


  /*
   * =========================================
   * STATE
   * =========================================
   */

  const [
    loginIdentifier,
    setLoginIdentifier,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);


  /*
   * =========================================
   * LOGIN
   * =========================================
   */

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const supabase =
      createClient();

    try {

      const input =
        loginIdentifier
          .trim();


      if (!input) {
        setError(
          "Enter your email or Student ID."
        );

        return;
      }


      /*
       * =====================================
       * DETERMINE LOGIN TYPE
       * =====================================
       *
       * Email:
       *
       * student@gmail.com
       *
       * Student ID:
       *
       * FMGE1
       * FMGE01
       * FMGE001
       * FMGE0001
       */

      let loginEmail =
        input;


      const isStudentId =
        /^FMGE\d{1,4}$/i.test(
          input
        );


      /*
       * =====================================
       * STUDENT ID → EMAIL
       * =====================================
       */

      if (isStudentId) {

        const {
          data:
            resolvedEmail,

          error:
            lookupError,
        } =
          await supabase.rpc(
            "get_email_for_student_login",
            {
              p_student_id:
                input,
            }
          );


        if (
          lookupError
        ) {

          console.error(
            "Student ID lookup failed:",
            lookupError
          );

          setError(
            "Unable to sign in. Please try again."
          );

          return;
        }


        if (
          !resolvedEmail
        ) {

          setError(
            "Invalid Student ID or password."
          );

          return;
        }


        loginEmail =
          resolvedEmail;

      }


      /*
       * =====================================
       * EMAIL VALIDATION
       * =====================================
       */

      else if (
        !input.includes("@")
      ) {

        setError(
          "Enter a valid email address or Student ID."
        );

        return;

      }


      /*
       * =====================================
       * SUPABASE SIGN IN
       * =====================================
       */

      const {
        error:
          loginError,
      } =
        await supabase.auth
          .signInWithPassword({
            email:
              loginEmail,

            password,
          });


      if (loginError) {

        /*
         * Keep message generic.
         *
         * This avoids revealing whether
         * an email or Student ID exists.
         */

        setError(
          "Invalid email/Student ID or password."
        );

        return;
      }


      /*
       * =====================================
       * CHECK ADMIN
       * =====================================
       */

      const {
        data: isAdmin,

        error:
          adminError,
      } =
        await supabase.rpc(
          "is_admin"
        );


      if (adminError) {

        console.error(
          "Admin check failed:",
          adminError
        );

        /*
         * Proxy will perform the
         * final account-status check.
         */

        router.push(
          "/dashboard"
        );

        router.refresh();

        return;
      }


      /*
       * =====================================
       * ADMIN
       * =====================================
       */

      if (
        isAdmin === true
      ) {

        router.push(
          "/admin"
        );

        router.refresh();

        return;
      }


      /*
       * =====================================
       * STUDENT ACCESS STATUS
       * =====================================
       */

      const {
        data:
          accessStatus,

        error:
          accessError,
      } =
        await supabase.rpc(
          "get_my_access_status"
        );


      if (accessError) {

        console.error(
          "Access status check failed:",
          accessError
        );

        /*
         * Proxy still provides
         * server-side enforcement.
         */

        router.push(
          "/dashboard"
        );

        router.refresh();

        return;
      }


      /*
       * Suspended / blocked
       */

      if (
        accessStatus ===
          "suspended" ||
        accessStatus ===
          "blocked"
      ) {

        router.push(
          "/account-suspended"
        );

        router.refresh();

        return;
      }


      /*
       * Active student
       */

      router.push(
        "/dashboard"
      );

      router.refresh();

    } catch (err) {

      console.error(
        "Login failed:",
        err
      );

      setError(
        "Something went wrong. Please try again."
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


        {/* Login Card */}

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">


          <div className="mb-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

              <LogIn
                size={21}
              />

            </div>


            <h2 className="mt-5 text-2xl font-bold text-slate-900">

              Welcome back

            </h2>


            <p className="mt-2 text-sm text-slate-500">

              Sign in using your email address or FMGE Student ID.

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
            onSubmit={
              handleLogin
            }
            className="space-y-5"
          >


            {/* Email / Student ID */}

            <div>

              <label
                htmlFor="loginIdentifier"
                className="mb-2 block text-sm font-medium text-slate-700"
              >

                Email or Student ID

              </label>


              <input
                id="loginIdentifier"
                type="text"
                value={
                  loginIdentifier
                }
                onChange={(
                  event
                ) =>
                  setLoginIdentifier(
                    event.target.value
                  )
                }
                placeholder="you@example.com or FMGE0001"
                required
                autoComplete="username"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />


              <p className="mt-2 text-xs text-slate-400">

                Students can use their FMGE Student ID, for example{" "}

                <span className="font-mono font-semibold text-slate-500">

                  FMGE0001

                </span>

                .

              </p>

            </div>


            {/* Password */}

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >

                Password

              </label>


              <div className="relative">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
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
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />


                {/* Show / Hide Password */}

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  title={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-600 focus:outline-none"
                >

                  {showPassword ? (

                    <EyeOff
                      size={19}
                    />

                  ) : (

                    <Eye
                      size={19}
                    />

                  )}

                </button>

              </div>

            </div>


            {/* Forgot Password */}

            <div className="flex justify-end">

              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >

                Forgot password?

              </Link>

            </div>


            {/* Login */}

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

                  Signing in...

                </>

              ) : (

                "Sign In"

              )}

            </button>

          </form>


          {/* Sign Up */}

          <p className="mt-6 text-center text-sm text-slate-500">

            Don&apos;t have an account?{" "}

            <Link
              href="/signup"
              className="font-semibold text-blue-600 transition hover:text-blue-700"
            >

              Create one

            </Link>

          </p>

        </div>


        {/* Footer */}

        <p className="mt-6 text-center text-xs text-slate-400">

          FMGE Prep • Mock Test Portal • GP Techs

        </p>

      </div>

    </main>

  );
}