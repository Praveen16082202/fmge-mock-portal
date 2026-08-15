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
  BookOpen,
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

export default function PerformancePage() {
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
   * LOAD USER ATTEMPTS
   * =========================
   */

  useEffect(() => {
    async function loadAttempts() {
      try {
        setLoading(true);
        setError("");


        /*
         * Get currently logged-in user
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
          return;
        }


        /*
         * Get only this user's attempts
         *
         * Newest attempts first.
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


        setAttempts(
          (data || []) as Attempt[]
        );

      } catch (err) {
        console.error(
          "Failed to load performance:",
          err
        );

        setError(
          "Unable to load performance data."
        );

      } finally {
        setLoading(false);
      }
    }


    loadAttempts();
  }, []);


  /*
   * =========================
   * OVERALL STATISTICS
   * =========================
   */

  const statistics = useMemo(() => {

    if (attempts.length === 0) {
      return {
        testsCompleted: 0,
        questionsAttempted: 0,
        averageScore: 0,
        overallAccuracy: 0,
      };
    }


    const testsCompleted =
      attempts.length;


    const questionsAttempted =
      attempts.reduce(
        (total, attempt) =>
          total +
          attempt.correct +
          attempt.wrong,
        0
      );


    const totalCorrect =
      attempts.reduce(
        (total, attempt) =>
          total + attempt.correct,
        0
      );


    const totalQuestions =
      attempts.reduce(
        (total, attempt) =>
          total +
          attempt.total_questions,
        0
      );


    const averageScore =
      Math.round(
        attempts.reduce(
          (total, attempt) =>
            total +
            attempt.score_percentage,
          0
        ) / attempts.length
      );


    const overallAccuracy =
      totalQuestions > 0
        ? Math.round(
            (totalCorrect /
              totalQuestions) *
              100
          )
        : 0;


    return {
      testsCompleted,
      questionsAttempted,
      averageScore,
      overallAccuracy,
    };

  }, [attempts]);


  /*
   * =========================
   * SUBJECT PERFORMANCE
   * =========================
   */

  const subjectPerformance =
    useMemo(() => {

      const subjectMap: {
        [subject: string]: {
          correct: number;
          wrong: number;
          unanswered: number;
          total: number;
          tests: number;
        };
      } = {};


      attempts.forEach((attempt) => {

        if (!subjectMap[attempt.subject]) {

          subjectMap[attempt.subject] = {
            correct: 0,
            wrong: 0,
            unanswered: 0,
            total: 0,
            tests: 0,
          };

        }


        subjectMap[
          attempt.subject
        ].correct += attempt.correct;


        subjectMap[
          attempt.subject
        ].wrong += attempt.wrong;


        subjectMap[
          attempt.subject
        ].unanswered +=
          attempt.unanswered;


        subjectMap[
          attempt.subject
        ].total +=
          attempt.total_questions;


        subjectMap[
          attempt.subject
        ].tests += 1;

      });


      return Object.entries(subjectMap)
        .map(([subject, data]) => ({
          subject,
          ...data,

          accuracy:
            data.total > 0
              ? Math.round(
                  (data.correct /
                    data.total) *
                    100
                )
              : 0,
        }))
        .sort(
          (a, b) =>
            b.accuracy -
            a.accuracy
        );

    }, [attempts]);


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
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </Link>

          </div>

        </header>


        <main className="mx-auto max-w-5xl px-6 py-12">

          <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">

            <h1 className="text-xl font-semibold">
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
   * EMPTY STATE
   * =========================
   */

  if (attempts.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">

        {/* HEADER */}

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


        {/* MAIN */}

        <main className="mx-auto max-w-5xl px-6 py-12">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <BarChart3 size={28} />
          </div>


          <p className="mt-6 text-sm font-medium text-emerald-600">
            Your Progress
          </p>


          <h1 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">
            Performance
          </h1>


          <p className="mt-3 max-w-xl text-slate-500">
            Track your preparation progress and identify
            areas that need more practice.
          </p>


          {/* EMPTY CARD */}

          <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

            <TrendingUp
              size={42}
              className="mx-auto text-slate-300"
            />


            <h2 className="mt-5 text-lg font-semibold">
              No performance data yet
            </h2>


            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Complete a few subject tests to start seeing
              your performance statistics here.
            </p>


            <Link
              href="/subjects"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Start a Test
            </Link>

          </section>

        </main>

      </div>
    );
  }


  /*
   * =========================
   * MAIN PERFORMANCE PAGE
   * =========================
   */

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

      <main className="mx-auto max-w-5xl px-6 py-10">


        {/* =========================
            PAGE TITLE
        ========================== */}

        <section>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <BarChart3 size={28} />
          </div>


          <p className="mt-6 text-sm font-medium text-emerald-600">
            Your Progress
          </p>


          <h1 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">
            Performance
          </h1>


          <p className="mt-3 max-w-xl text-slate-500">
            Track your preparation progress and identify
            subjects that need more attention.
          </p>

        </section>


        {/* =========================
            OVERALL STATISTICS
        ========================== */}

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">


          {/* TESTS COMPLETED */}

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


          {/* QUESTIONS ATTEMPTED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <BookOpen size={20} />
            </div>


            <p className="mt-5 text-sm text-slate-400">
              Questions Attempted
            </p>


            <p className="mt-1 text-2xl font-bold">
              {statistics.questionsAttempted}
            </p>

          </div>


          {/* AVERAGE SCORE */}

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


          {/* OVERALL ACCURACY */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Target size={20} />
            </div>


            <p className="mt-5 text-sm text-slate-400">
              Overall Accuracy
            </p>


            <p className="mt-1 text-2xl font-bold">
              {statistics.overallAccuracy}%
            </p>

          </div>

        </section>


        {/* =========================
            SUBJECT PERFORMANCE
        ========================== */}

        <section className="mt-10">

          <div className="mb-5">

            <h2 className="text-xl font-bold">
              Subject Performance
            </h2>


            <p className="mt-1 text-sm text-slate-500">
              Click a subject to view its complete performance history.
            </p>

          </div>


          <div className="space-y-4">

            {subjectPerformance.map(
              (subject) => {

                const progressWidth =
                  subject.accuracy;


                return (

                  <Link
                    key={subject.subject}
                    href={`/performance/${subject.subject}`}
                    className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >

                    <div className="flex items-center justify-between">

                      <div>

                        <div className="flex items-center gap-2">

                          <p className="text-base font-semibold capitalize">
                            {subject.subject}
                          </p>


                          <ChevronRight
                            size={17}
                            className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                          />

                        </div>


                        <p className="mt-1 text-xs text-slate-400">

                          {subject.tests}{" "}
                          {subject.tests === 1
                            ? "test"
                            : "tests"}{" "}

                          • {subject.correct} correct out of{" "}
                          {subject.total}

                        </p>

                      </div>


                      <div className="text-right">

                        <p className="text-xl font-bold text-blue-600">
                          {subject.accuracy}%
                        </p>


                        <p className="text-xs text-slate-400">
                          Accuracy
                        </p>

                      </div>

                    </div>


                    {/* PROGRESS BAR */}

                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">

                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{
                          width: `${progressWidth}%`,
                        }}
                      />

                    </div>


                    {/* CLICK HINT */}

                    <div className="mt-4 flex items-center justify-end text-xs font-medium text-slate-400 transition group-hover:text-blue-600">

                      View {subject.subject} performance

                      <ChevronRight
                        size={14}
                        className="ml-1 transition group-hover:translate-x-0.5"
                      />

                    </div>

                  </Link>

                );
              }
            )}

          </div>

        </section>


        {/* =========================
            RECENT PERFORMANCE
        ========================== */}

        <section className="mt-10">

          <div className="mb-5 flex items-end justify-between">

            <div>

              <h2 className="text-xl font-bold">
                Recent Performance
              </h2>


              <p className="mt-1 text-sm text-slate-500">
                Your latest completed tests.
              </p>

            </div>


            <Link
              href="/attempts"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>

          </div>


          <div className="space-y-3">

            {attempts
              .slice(0, 5)
              .map((attempt) => (

                <Link
                  key={attempt.id}
                  href={`/attempts/${attempt.id}`}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <CheckCircle2 size={19} />
                    </div>


                    <div>

                      <p className="text-sm font-medium capitalize text-blue-600">
                        {attempt.subject}
                      </p>


                      <p className="mt-1 font-semibold">
                        {attempt.test_title}
                      </p>

                    </div>

                  </div>


                  <div className="flex items-center gap-4">

                    <div className="text-right">

                      <p className="font-bold text-slate-900">
                        {attempt.score_percentage}%
                      </p>


                      <p className="text-xs text-slate-400">
                        {attempt.correct}/
                        {attempt.total_questions}
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