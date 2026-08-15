"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogIn, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const supabase = createClient();

    try {
      /*
       * =========================
       * SIGN IN
       * =========================
       */

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        setError(loginError.message);
        return;
      }


      /*
       * =========================
       * CHECK ADMIN STATUS
       * =========================
       *
       * is_admin() checks whether
       * the logged-in user's UUID
       * exists in public.admin_users.
       */

      const { data: isAdmin, error: adminError } =
        await supabase.rpc("is_admin");


      /*
       * If admin check fails, don't
       * prevent a normal user from
       * entering the student dashboard.
       */

      if (adminError) {
        console.error(
          "Admin check failed:",
          adminError
        );

        router.push("/dashboard");
        router.refresh();
        return;
      }


      /*
       * =========================
       * REDIRECT
       * =========================
       *
       * Admin  → /admin
       * Student → /dashboard
       */

      if (isAdmin === true) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">

      <div className="w-full max-w-md">

        {/* Logo */}

        <div className="mb-8 text-center">

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            FMGE<span className="text-blue-600">Prep</span>
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Mock Test Portal
          </p>

        </div>


        {/* Login Card */}

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

          <div className="mb-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <LogIn size={21} />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to continue your FMGE preparation.
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
            onSubmit={handleLogin}
            className="space-y-5"
          >

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
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                required
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
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* Login Button */}

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
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}

            </button>

          </form>


          {/* Sign Up */}

          <p className="mt-6 text-center text-sm text-slate-500">

            Don't have an account?{" "}

            <Link
              href="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Create one
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