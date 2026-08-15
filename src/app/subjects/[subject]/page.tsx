"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileQuestion,
  Loader2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const subjectNames: Record<string, string> = {
  anatomy: "Anatomy",
  physiology: "Physiology",
  biochemistry: "Biochemistry",
  pathology: "Pathology",
  pharmacology: "Pharmacology",
  microbiology: "Microbiology",
  "forensic-medicine": "Forensic Medicine",
  "community-medicine": "Community Medicine",
  medicine: "Medicine",
  surgery: "Surgery",
  pediatrics: "Pediatrics",
  "obstetrics-gynecology": "Obstetrics & Gynecology",
  psychiatry: "Psychiatry",
  dermatology: "Dermatology",
  radiodiagnosis: "Radiodiagnosis",
  radiology: "Radiology",
  anesthesiology: "Anesthesiology",
  orthopedics: "Orthopedics",
  ent: "ENT",
  ophthalmology: "Ophthalmology",
};

export default function SubjectPage() {
  const params = useParams();

  const subject = String(
    params.subject || ""
  ).toLowerCase();

  const subjectName =
    subjectNames[subject] ||
    subject
      .split("-")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");

  const [loading, setLoading] =
    useState(true);

  const [
    activeQuestionCount,
    setActiveQuestionCount,
  ] = useState(0);

  const [error, setError] =
    useState("");

  /*
   * =========================================
   * LOAD ACTIVE QUESTION COUNT
   * =========================================
   *
   * IMPORTANT:
   *
   * This RPC ONLY counts questions.
   *
   * It does NOT create a practice session.
   */

  useEffect(() => {
    async function loadQuestionCount() {
      const supabase =
        createClient();

      try {
        setLoading(true);
        setError("");

        /*
         * Confirm logged-in user
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
         * Get active pool size
         */

        const {
          data,
          error: countError,
        } =
          await supabase.rpc(
            "get_practice_question_count",
            {
              p_subject: subject,
            }
          );

        if (countError) {
          throw countError;
        }

        setActiveQuestionCount(
          Number(data ?? 0)
        );

      } catch (err: unknown) {

        console.error(
          "Failed to load question count:",
          err
        );

        let message =
          `Unable to load ${subjectName} practice test.`;

        if (
          typeof err === "object" &&
          err !== null
        ) {
          const rpcError =
            err as {
              message?: string;
            };

          if (
            rpcError.message
          ) {
            message =
              rpcError.message;
          }
        }

        setError(message);

      } finally {

        setLoading(false);

      }
    }

    if (subject) {
      loadQuestionCount();
    }

  }, [subject]);


  /*
   * =========================================
   * TEST SIZE
   * =========================================
   *
   * Pool < 30
   * → use all available
   *
   * Pool >= 30
   * → use 30
   */

  const testQuestionCount =
    Math.min(
      activeQuestionCount,
      30
    );


  /*
   * =========================================
   * TEST DURATION
   * =========================================
   */

  const testDuration =
    Math.max(
      testQuestionCount,
      5
    );


  /*
   * =========================================
   * LOADING
   * =========================================
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="flex items-center gap-3 text-slate-500">

          <Loader2
            size={20}
            className="animate-spin"
          />

          Loading {subjectName}...

        </div>

      </main>
    );
  }


  /*
   * =========================================
   * ERROR
   * =========================================
   */

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50">

        <header className="border-b border-slate-200 bg-white">

          <div className="mx-auto flex h-20 max-w-5xl items-center px-6">

            <Link
              href="/subjects"
              className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >

              <ArrowLeft size={18} />

              Back to Subjects

            </Link>

          </div>

        </header>


        <div className="mx-auto max-w-5xl px-6 py-12">

          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

            <h1 className="text-xl font-bold text-slate-900">

              Unable to load practice test

            </h1>

            <p className="mt-2 text-sm text-slate-500">

              {error}

            </p>

          </div>

        </div>

      </main>
    );
  }


  /*
   * =========================================
   * MAIN PAGE
   * =========================================
   */

  return (
    <main className="min-h-screen bg-slate-50">


      {/* =========================
          HEADER
      ========================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex h-20 max-w-5xl items-center px-6">

          <Link
            href="/subjects"
            className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >

            <ArrowLeft size={18} />

            Back to Subjects

          </Link>

        </div>

      </header>


      {/* =========================
          MAIN CONTENT
      ========================== */}

      <div className="mx-auto max-w-5xl px-6 py-10">


        {/* Subject Heading */}

        <section className="mb-8">

          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">

            <BookOpen size={27} />

          </div>

          <p className="text-sm font-medium text-blue-600">

            Subject Practice

          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">

            {subjectName}

          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">

            Practice questions are selected
            randomly from the {subjectName}
            question pool for every new attempt.

          </p>

        </section>


        {/* =========================
            PRACTICE TEST CARD
        ========================== */}

        <section>

          {activeQuestionCount === 0 ? (

            /*
             * EMPTY POOL
             */

            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

              <BookOpen
                size={36}
                className="mx-auto text-slate-300"
              />

              <h2 className="mt-4 text-lg font-semibold text-slate-900">

                Questions coming soon

              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">

                There are currently no active
                questions in the {subjectName}
                question pool.

              </p>

            </div>

          ) : (

            /*
             * PRACTICE TEST AVAILABLE
             */

            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">


                {/* Test Information */}

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                    <FileQuestion size={23} />

                  </div>


                  <div>

                    <h2 className="font-semibold text-slate-900">

                      {subjectName} — Practice Test

                    </h2>


                    <p className="mt-1 text-sm text-slate-500">

                      Randomized questions from
                      the {subjectName} pool.

                    </p>


                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-400">


                      {/* Questions in this test */}

                      <span className="flex items-center gap-1.5">

                        <FileQuestion size={15} />

                        {testQuestionCount}{" "}
                        {testQuestionCount === 1
                          ? "Question"
                          : "Questions"}

                      </span>


                      {/* Duration */}

                      <span className="flex items-center gap-1.5">

                        <Clock3 size={15} />

                        {testDuration}{" "}
                        Minutes

                      </span>

                    </div>


                    {/* Pool Size */}

                    {activeQuestionCount > 30 && (

                      <p className="mt-2 text-xs text-slate-400">

                        {activeQuestionCount} active questions
                        available in the pool.

                      </p>

                    )}

                  </div>

                </div>


                {/* Start */}

                <Link
                  href={`/test/${subject}/1`}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >

                  Start Practice

                  <ChevronRight size={17} />

                </Link>

              </div>

            </div>

          )}

        </section>


        {/* =========================
            INFO BOX
        ========================== */}

        {activeQuestionCount > 0 && (

          <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">

            <div className="flex gap-3">

              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0 text-blue-600"
              />


              <div>

                <h3 className="text-sm font-semibold text-blue-900">

                  How practice tests work

                </h3>


                <p className="mt-1 text-sm leading-6 text-blue-700">

                  {activeQuestionCount < 30
                    ? `This subject currently has ${activeQuestionCount} active ${
                        activeQuestionCount === 1
                          ? "question"
                          : "questions"
                      }, so all available questions will be included in this attempt.`
                    : `This subject currently has ${activeQuestionCount} active questions. Each new practice attempt will randomly select 30 questions from the pool.`}

                </p>

              </div>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}