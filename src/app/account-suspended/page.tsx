"use client";

import {
  LogOut,
  ShieldAlert,
} from "lucide-react";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";


export default function AccountSuspendedPage() {

  const [loggingOut, setLoggingOut] =
    useState(false);


  async function handleLogout() {

    if (loggingOut) {
      return;
    }


    setLoggingOut(true);


    const supabase =
      createClient();


    try {

      await supabase.auth.signOut();

      window.location.href =
        "/login";

    } catch (error) {

      console.error(
        "Logout failed:",
        error
      );

      setLoggingOut(false);

    }

  }


  return (

    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">

      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">


        {/* Icon */}

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">

          <ShieldAlert
            size={32}
          />

        </div>


        {/* Branding */}

        <p className="mt-6 text-sm font-semibold text-blue-600">

          FMGE Prep

        </p>


        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">

          Account Suspended

        </h1>


        <p className="mt-4 text-sm leading-6 text-slate-500">

          Your FMGE Prep account has been temporarily suspended by an administrator.

        </p>


        <p className="mt-3 text-sm leading-6 text-slate-500">

          Your test history and performance data have not been deleted.
          Please contact the administrator if you believe this was done by mistake.

        </p>


        {/* Logout */}

        <button
          type="button"
          onClick={
            handleLogout
          }
          disabled={
            loggingOut
          }
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >

          <LogOut
            size={17}
          />

          {loggingOut
            ? "Signing out..."
            : "Sign Out"}

        </button>


        <p className="mt-5 text-xs leading-5 text-slate-400">

          FMGE Prep Student Portal

        </p>

      </div>

    </main>

  );
}