"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileQuestion,
  History,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { createBrowserClient } from "@supabase/ssr";

type SupabaseAttempt = {
  id: string;
  user_id: string;
  subject: string;
  test_id: number;
  test_title: string;
  total_questions: number;
  correct: number;
  wrong: number;
  unanswered: number;
  score_percentage: number;
  time_used: number;
  answers: unknown;
  completed_at: string;
};

export default function AttemptsPage() {
  const [attempts, setAttempts] = useState<SupabaseAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Supabase browser client
   */

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  /*
   * Load attempts for logged-in user
   */

  useEffect(() => {
    async function loadAttempts() {
      setLoading(true);
      setError("");

      try {
        /*
         * Get logged-in user
         */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setError("You are not logged in.");
          setLoading(false);
          return;
        }

        /*
         * Get this user's attempts
         */

        const { data, error: attemptsError } =
          await supabase
            .from("attempts")
            .select("*")
            .eq("user_id", user.id)
            .order("completed_at", {
              ascending: false,
            });

        if (attemptsError) {
          throw attemptsError;
        }

        setAttempts(data || []);
      } catch (err) {
        console.error(
          "Failed to load attempts:",
          err
        );

        setError(
          "Unable to load your previous attempts."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAttempts();
  }, []);

  /*
   * Loading state
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">

        <header className="border-b border-slate-200 bg-white">

          <div className="mx-auto flex h-20 max-w-5xl items-center px-6">

            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </Link>

          </div>

        </header>

        <main className="mx-auto max-w-5xl px-6 py-12">

          <div className="animate-pulse">

            <div className="h-14 w-14 rounded-2xl bg-slate-200" />

            <div className="mt-6 h-4 w-32 rounded bg-slate-200" />

            <div className="mt-3 h-10 w-72 rounded bg-slate-200" />

            <div className="mt-3 h-5 w-96 max-w-full rounded bg-slate-200" />

            <div className="mt-10 space-y-5">

              <div className="h-32 rounded-2xl bg-slate-200" />

              <div className="h-32 rounded-2xl bg-slate-200" />

            </div>

          </div>

        </main>

      </div>
    );
  }

  /*
   * Error state
   */

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">

        <header className="border-b border-slate-200 bg-white">

          <div className="mx-auto flex h-20 max-w-5xl items-center px-6">

            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </Link>

          </div>

        </header>

        <main className="mx-auto max-w-5xl px-6 py-12">

          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

            <XCircle
              size={42}
              className="mx-auto text-red-400"
            />

            <h2 className="mt-5 text-lg font-semibold text-red-800">
              Something went wrong
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

          </div>

        </main>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =========================
          HEADER
      ========================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex h-20 max-w-5xl items-center px-6">

          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>

        </div>

      </header>


      {/* =========================
          MAIN
      ========================== */}

      <main className="mx-auto max-w-5xl px-6 py-12">

        {/* Page Heading */}

        <section>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <History size={28} />
          </div>

          <p className="mt-6 text-sm font-medium text-blue-600">
            Test History
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">
            Previous Attempts
          </h1>

          <p className="mt-3 text-slate-500">
            Review your previously completed practice tests.
          </p>

        </section>


        {/* =========================
            EMPTY STATE
        ========================== */}

        {attempts.length === 0 ? (

          <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

            <FileQuestion
              size={42}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-5 text-lg font-semibold">
              No attempts yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Complete a subject test and your result will appear here.
            </p>

            <Link
              href="/subjects"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Browse Subject Tests
            </Link>

          </section>

        ) : (

          /* =========================
             ATTEMPT LIST
          ========================== */

          <section className="mt-10 space-y-5">

            {attempts.map((attempt) => {

              const completedDate =
                new Date(attempt.completed_at);

              const formattedDate =
                completedDate.toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                );

              const formattedTime =
                completedDate.toLocaleTimeString(
                  "en-IN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }
                );

              return (

                <Link
                  key={attempt.id}
                  href={`/attempts/${attempt.id}`}
                  className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >

                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                    {/* =========================
                        TEST INFORMATION
                    ========================== */}

                    <div className="flex items-start gap-5">

                      {/* Icon */}

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <FileQuestion size={23} />
                      </div>


                      {/* Details */}

                      <div>

                        <p className="text-sm font-medium capitalize text-blue-600">
                          {attempt.subject}
                        </p>

                        <h2 className="mt-1 text-lg font-semibold">
                          {attempt.test_title}
                        </h2>


                        {/* Date + Time */}

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">

                          <span className="flex items-center gap-1.5">
                            <CalendarDays size={14} />
                            {formattedDate}
                          </span>

                          <span className="flex items-center gap-1.5">
                            <Clock3 size={14} />
                            {formattedTime}
                          </span>

                        </div>

                      </div>

                    </div>


                    {/* =========================
                        RESULT SUMMARY
                    ========================== */}

                    <div className="flex flex-wrap items-center gap-3">

                      {/* Score */}

                      <div className="min-w-[105px] rounded-xl bg-slate-50 px-5 py-4 text-center">

                        <p className="text-xs text-slate-400">
                          Score
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {attempt.correct}/
                          {attempt.total_questions}
                        </p>

                      </div>


                      {/* Correct */}

                      <div className="min-w-[105px] rounded-xl bg-emerald-50 px-5 py-4 text-center">

                        <div className="flex items-center justify-center gap-1 text-xs font-medium text-emerald-600">
                          <CheckCircle2 size={13} />
                          Correct
                        </div>

                        <p className="mt-1 text-lg font-bold text-emerald-600">
                          {attempt.correct}
                        </p>

                      </div>


                      {/* Wrong */}

                      <div className="min-w-[105px] rounded-xl bg-red-50 px-5 py-4 text-center">

                        <div className="flex items-center justify-center gap-1 text-xs font-medium text-red-500">
                          <XCircle size={13} />
                          Wrong
                        </div>

                        <p className="mt-1 text-lg font-bold text-red-500">
                          {attempt.wrong}
                        </p>

                      </div>


                      {/* Accuracy */}

                      <div className="min-w-[105px] rounded-xl bg-blue-50 px-5 py-4 text-center">

                        <p className="text-xs text-blue-500">
                          Accuracy
                        </p>

                        <p className="mt-1 text-lg font-bold text-blue-600">
                          {attempt.score_percentage}%
                        </p>

                      </div>


                      {/* Arrow */}

                      <div className="ml-1 flex h-10 w-10 items-center justify-center rounded-full">

                        <ChevronRight
                          size={22}
                          className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                        />

                      </div>

                    </div>

                  </div>

                </Link>

              );
            })}

          </section>

        )}


        {/* =========================
            FOOTER
        ========================== */}

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          FMGE Prep • Mock Test Portal
        </footer>

      </main>

    </div>
  );
}