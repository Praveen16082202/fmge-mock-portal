"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Target,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

import { createBrowserClient } from "@supabase/ssr";


type Attempt = {
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
  answers: unknown[];
  completed_at: string;
};


type PageProps = {
  params: Promise<{
    subject: string;
  }>;
};


export default function SubjectPerformancePage({
  params,
}: PageProps) {

  const [subject, setSubject] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  /*
   * =========================
   * SUPABASE CLIENT
   * =========================
   */

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );


  /*
   * =========================
   * LOAD SUBJECT ATTEMPTS
   * =========================
   */

  useEffect(() => {

    async function loadPage() {

      try {

        setLoading(true);
        setError("");


        /*
         * Resolve URL parameter
         */

        const resolvedParams = await params;

        const subjectName = decodeURIComponent(
          resolvedParams.subject
        ).toLowerCase();

        setSubject(subjectName);


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

          setError(
            "You are not logged in."
          );

          return;
        }


        /*
         * Get only this user's attempts
         * for the selected subject.
         */

        const {
          data,
          error: attemptsError,
        } = await supabase
          .from("attempts")
          .select("*")
          .eq("user_id", user.id)
          .eq("subject", subjectName)
          .order("completed_at", {
            ascending: false,
          });


        if (attemptsError) {
          throw attemptsError;
        }


        setAttempts(
          (data || []) as Attempt[]
        );

      } catch (err) {

        console.error(
          "Failed to load subject performance:",
          err
        );

        setError(
          "Unable to load performance data."
        );

      } finally {

        setLoading(false);

      }

    }


    loadPage();

  }, [params]);


  /*
   * =========================
   * STATISTICS
   * =========================
   */

  const statistics = useMemo(() => {

    const testsCompleted =
      attempts.length;


    const totalQuestions =
      attempts.reduce(
        (total, attempt) =>
          total +
          attempt.total_questions,
        0
      );


    const correct =
      attempts.reduce(
        (total, attempt) =>
          total + attempt.correct,
        0
      );


    const wrong =
      attempts.reduce(
        (total, attempt) =>
          total + attempt.wrong,
        0
      );


    const unanswered =
      attempts.reduce(
        (total, attempt) =>
          total +
          attempt.unanswered,
        0
      );


    const accuracy =
      totalQuestions > 0
        ? Math.round(
            (correct /
              totalQuestions) *
              100
          )
        : 0;


    const averageScore =
      attempts.length > 0
        ? Math.round(
            attempts.reduce(
              (total, attempt) =>
                total +
                attempt.score_percentage,
              0
            ) / attempts.length
          )
        : 0;


    const bestScore =
      attempts.length > 0
        ? Math.max(
            ...attempts.map(
              (attempt) =>
                attempt.score_percentage
            )
          )
        : 0;


    return {
      testsCompleted,
      totalQuestions,
      correct,
      wrong,
      unanswered,
      accuracy,
      averageScore,
      bestScore,
    };

  }, [attempts]);


  /*
   * =========================
   * SUBJECT NAME
   * =========================
   */

  const displaySubject =
    subject.charAt(0).toUpperCase() +
    subject.slice(1);


  /*
   * =========================
   * LOADING STATE
   * =========================
   */

  if (loading) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-slate-50">

        <p className="text-sm text-slate-500">
          Loading performance...
        </p>

      </div>

    );

  }


  /*
   * =========================
   * ERROR STATE
   * =========================
   */

  if (error) {

    return (

      <div className="min-h-screen bg-slate-50 text-slate-900">

        <header className="border-b border-slate-200 bg-white">

          <div className="mx-auto flex h-20 max-w-5xl items-center px-6">

            <Link
              href="/performance"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              <ArrowLeft size={18} />
              Back to Performance
            </Link>

          </div>

        </header>


        <main className="mx-auto max-w-5xl px-6 py-12">

          <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">

            <h1 className="text-xl font-bold">
              Unable to load performance
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

          </div>

        </main>

      </div>

    );

  }


  /*
   * =========================
   * NO ATTEMPTS
   * =========================
   */

  if (attempts.length === 0) {

    return (

      <div className="min-h-screen bg-slate-50 text-slate-900">

        <header className="border-b border-slate-200 bg-white">

          <div className="mx-auto flex h-20 max-w-5xl items-center px-6">

            <Link
              href="/performance"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              <ArrowLeft size={18} />
              Back to Performance
            </Link>

          </div>

        </header>


        <main className="mx-auto max-w-5xl px-6 py-12">

          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

            <BarChart3
              size={42}
              className="mx-auto text-slate-300"
            />


            <h1 className="mt-5 text-xl font-bold">
              No attempts found
            </h1>


            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">

              You haven't completed any tests for{" "}

              <span className="font-semibold capitalize">
                {displaySubject}
              </span>

              {" "}yet.

            </p>


            <Link
              href="/subjects"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Browse Subject Tests
            </Link>

          </div>

        </main>

      </div>

    );

  }


  /*
   * =========================
   * MAIN PAGE
   * =========================
   */

  return (

    <div className="min-h-screen bg-slate-50 text-slate-900">


      {/* =========================
          HEADER
      ========================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-6">

          <Link
            href="/performance"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >
            <ArrowLeft size={18} />
            Back to Performance
          </Link>

        </div>

      </header>


      {/* =========================
          MAIN
      ========================== */}

      <main className="mx-auto max-w-5xl px-6 py-10">


        {/* =========================
            TITLE
        ========================== */}

        <section>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <BarChart3 size={28} />
          </div>


          <p className="mt-6 text-sm font-medium text-emerald-600">
            Subject Performance
          </p>


          <h1 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl capitalize">
            {displaySubject}
          </h1>


          <p className="mt-3 max-w-xl text-slate-500">

            Review your performance and test history for{" "}

            <span className="font-medium">
              {displaySubject}
            </span>.

          </p>

        </section>


        {/* =========================
            STATISTICS
        ========================== */}

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">


          {/* TESTS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ClipboardList size={20} />
            </div>


            <p className="mt-5 text-sm text-slate-400">
              Tests Completed
            </p>


            <p className="mt-1 text-2xl font-bold">
              {statistics.testsCompleted}
            </p>

          </div>


          {/* QUESTIONS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Target size={20} />
            </div>


            <p className="mt-5 text-sm text-slate-400">
              Questions
            </p>


            <p className="mt-1 text-2xl font-bold">
              {statistics.totalQuestions}
            </p>

          </div>


          {/* AVERAGE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={20} />
            </div>


            <p className="mt-5 text-sm text-slate-400">
              Average Score
            </p>


            <p className="mt-1 text-2xl font-bold">
              {statistics.averageScore}%
            </p>

          </div>


          {/* BEST */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <CheckCircle2 size={20} />
            </div>


            <p className="mt-5 text-sm text-slate-400">
              Best Score
            </p>


            <p className="mt-1 text-2xl font-bold">
              {statistics.bestScore}%
            </p>

          </div>

        </section>


        {/* =========================
            ACCURACY SUMMARY
        ========================== */}

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-lg font-bold">
                Overall Accuracy
              </h2>


              <p className="mt-1 text-sm text-slate-500">

                Your accuracy across all completed{" "}

                {displaySubject} tests.

              </p>

            </div>


            <p className="text-3xl font-bold text-emerald-600">
              {statistics.accuracy}%
            </p>

          </div>


          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">

            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{
                width: `${statistics.accuracy}%`,
              }}
            />

          </div>


          <div className="mt-5 grid grid-cols-3 gap-4 text-center">


            {/* CORRECT */}

            <div>

              <p className="text-lg font-bold text-emerald-600">
                {statistics.correct}
              </p>

              <p className="text-xs text-slate-400">
                Correct
              </p>

            </div>


            {/* WRONG */}

            <div>

              <p className="text-lg font-bold text-red-500">
                {statistics.wrong}
              </p>

              <p className="text-xs text-slate-400">
                Wrong
              </p>

            </div>


            {/* UNANSWERED */}

            <div>

              <p className="text-lg font-bold text-slate-400">
                {statistics.unanswered}
              </p>

              <p className="text-xs text-slate-400">
                Unanswered
              </p>

            </div>

          </div>

        </section>


        {/* =========================
            RECENT TESTS
        ========================== */}

        <section className="mt-10">

          <div className="mb-5">

            <h2 className="text-xl font-bold">
              Recent {displaySubject} Tests
            </h2>


            <p className="mt-1 text-sm text-slate-500">
              Your completed tests for this subject.
            </p>

          </div>


          <div className="space-y-3">

            {attempts
              .map((attempt) => (

                <Link
                  key={attempt.id}
                  href={`/attempts/${attempt.id}`}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <CheckCircle2 size={20} />
                    </div>


                    <div>

                      <p className="font-semibold">
                        {attempt.test_title}
                      </p>


                      <p className="mt-1 text-xs text-slate-400">

                        {new Date(
                          attempt.completed_at
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}

                        {" • "}

                        {attempt.correct}/
                        {attempt.total_questions} correct

                      </p>

                    </div>

                  </div>


                  <div className="flex items-center gap-4">

                    <div className="text-right">

                      <p className="text-lg font-bold">
                        {attempt.score_percentage}%
                      </p>


                      <p className="text-xs text-slate-400">
                        Score
                      </p>

                    </div>


                    <ChevronRight
                      size={20}
                      className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                    />

                  </div>

                </Link>

              ))}

          </div>

        </section>


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