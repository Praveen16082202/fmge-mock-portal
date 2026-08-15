"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  ShieldCheck,
  ShieldX,
  Loader2,
  BookOpen,
  ChevronRight,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import LogoutButton from "@/app/dashboard/LogoutButton";

const subjects = [
  { name: "Anatomy", slug: "anatomy" },
  { name: "Physiology", slug: "physiology" },
  { name: "Biochemistry", slug: "biochemistry" },
  { name: "Pathology", slug: "pathology" },
  { name: "Pharmacology", slug: "pharmacology" },
  { name: "Microbiology", slug: "microbiology" },
  {
    name: "Forensic Medicine",
    slug: "forensic-medicine",
  },
  {
    name: "Community Medicine",
    slug: "community-medicine",
  },
  { name: "Medicine", slug: "medicine" },
  { name: "Surgery", slug: "surgery" },
  { name: "Pediatrics", slug: "pediatrics" },
  {
    name: "Obstetrics & Gynecology",
    slug: "obstetrics-gynecology",
  },
  { name: "Psychiatry", slug: "psychiatry" },
  { name: "Dermatology", slug: "dermatology" },
  {
    name: "Radiodiagnosis",
    slug: "radiodiagnosis",
  },
  {
    name: "Anesthesiology",
    slug: "anesthesiology",
  },
  {
    name: "Orthopedics",
    slug: "orthopedics",
  },
  { name: "ENT", slug: "ent" },
  {
    name: "Ophthalmology",
    slug: "ophthalmology",
  },
];

export default function AdminPage() {
  const [loading, setLoading] =
    useState(true);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * =========================
   * CHECK ADMIN ACCESS
   * =========================
   */

  useEffect(() => {
    const supabase = createClient();

    async function checkAdmin() {
      try {
        setLoading(true);
        setError("");

        /*
         * Logged-in user
         */

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setError(
            "You are not logged in."
          );

          return;
        }

        /*
         * Admin check
         */

        const {
          data,
          error: adminError,
        } =
          await supabase.rpc(
            "is_admin"
          );

        if (adminError) {
          throw adminError;
        }

        setIsAdmin(
          data === true
        );

      } catch (err) {
        console.error(
          "Admin check failed:",
          err
        );

        setError(
          "Unable to verify admin access."
        );

      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, []);


  /*
   * =========================
   * LOADING
   * =========================
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="flex items-center gap-3 text-slate-500">

          <Loader2
            className="animate-spin"
            size={20}
          />

          Checking admin access...

        </div>

      </main>
    );
  }


  /*
   * =========================
   * ERROR
   * =========================
   */

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">

        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <ShieldX
            size={48}
            className="mx-auto text-red-500"
          />

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Unable to access Admin
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

        </div>

      </main>
    );
  }


  /*
   * =========================
   * NOT ADMIN
   * =========================
   */

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">

        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <ShieldX
            size={48}
            className="mx-auto text-red-500"
          />

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Access Denied
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            You do not have permission to access the admin portal.
          </p>

        </div>

      </main>
    );
  }


  /*
   * =========================
   * ADMIN DASHBOARD
   * =========================
   */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* =========================
          HEADER
      ========================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-6 py-4">

          {/* Branding */}

          <div>

            <p className="text-sm font-medium text-blue-600">
              FMGE Prep
            </p>

            <h1 className="text-2xl font-bold tracking-tight">
              Admin Dashboard
            </h1>

          </div>


          {/* Admin + Logout */}

          <div className="flex items-center gap-3">

            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600 sm:flex">

              <ShieldCheck size={17} />

              Admin

            </div>


            <div className="rounded-xl border border-slate-200 bg-white px-2 py-1 shadow-sm">

              <LogoutButton />

            </div>

          </div>

        </div>

      </header>


      {/* =========================
          CONTENT
      ========================== */}

      <section className="mx-auto max-w-6xl px-6 py-10">

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">


          {/* Question Bank Header */}

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

              <BookOpen size={22} />

            </div>


            <div>

              <h2 className="text-xl font-bold">
                Question Bank
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage questions for each subject&apos;s question pool.
              </p>

            </div>

          </div>


          {/* =========================
              SUBJECTS
          ========================== */}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {subjects.map(
              (subject) => (

                <Link
                  key={subject.slug}
                  href={`/admin/questions/${subject.slug}`}
                  className="group rounded-xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <h3 className="font-semibold text-slate-900">
                        {subject.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Manage {subject.name} questions
                      </p>

                    </div>


                    <ChevronRight
                      size={19}
                      className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500"
                    />

                  </div>


                  <div className="mt-4 text-sm font-semibold text-blue-600">
                    Manage Questions
                  </div>

                </Link>

              )
            )}

          </div>

        </div>

      </section>

    </main>
  );
}