"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  Clock3,
  FileQuestion,
  Loader2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/*
 * Keep this temporarily so OLD attempts
 * created before question_snapshot existed
 * can still be reviewed.
 *
 * We can remove this later after we confirm
 * there are no legacy attempts we care about.
 */
import { questionBank } from "@/data/questions";


/*
 * =========================================
 * ATTEMPT ANSWER
 * =========================================
 */

type AttemptAnswer = {
  questionId: string | number;
  selectedAnswer: number | null;
};


/*
 * =========================================
 * QUESTION SNAPSHOT
 * =========================================
 */

type SnapshotQuestion = {
  questionId: string;

  questionText: string | null;

  questionImagePath: string | null;

  options: string[];

  selectedAnswer: number | null;

  correctAnswer: number;

  explanation: string | null;

  displayImageUrl?: string | null;
};


/*
 * =========================================
 * SUPABASE ATTEMPT
 * =========================================
 */

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

  answers: AttemptAnswer[];

  question_snapshot: SnapshotQuestion[] | null;

  completed_at: string;
};


/*
 * =========================================
 * SUBJECT DISPLAY NAMES
 * =========================================
 */

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
  "obstetrics-gynecology":
    "Obstetrics & Gynecology",
  psychiatry: "Psychiatry",
  radiology: "Radiology",
  radiodiagnosis: "Radiodiagnosis",
  dermatology: "Dermatology",
  anesthesiology: "Anesthesiology",
  orthopedics: "Orthopedics",
  ent: "ENT",
  ophthalmology: "Ophthalmology",
};


export default function AttemptResultPage() {
  const params = useParams();

  const attemptId =
    String(params.attemptId || "");

  const [attempt, setAttempt] =
    useState<SupabaseAttempt | null>(null);

  const [questions, setQuestions] =
    useState<SnapshotQuestion[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [legacyAttempt, setLegacyAttempt] =
    useState(false);


  /*
   * =========================================
   * LOAD ATTEMPT
   * =========================================
   */

  useEffect(() => {
    async function loadAttempt() {
      const supabase = createClient();

      try {
        setLoading(true);

        setError("");

        setLegacyAttempt(false);


        /*
         * =========================
         * CURRENT USER
         * =========================
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
         * =========================
         * LOAD THIS USER'S ATTEMPT
         * =========================
         *
         * We keep BOTH filters:
         *
         * attempt ID
         * logged-in user ID
         */

        const {
          data,
          error: attemptError,
        } = await supabase
          .from("attempts")
          .select("*")
          .eq(
            "id",
            attemptId
          )
          .eq(
            "user_id",
            user.id
          )
          .single();


        if (attemptError) {
          throw attemptError;
        }


        if (!data) {
          setError(
            "Attempt not found."
          );

          return;
        }


        const loadedAttempt =
          data as SupabaseAttempt;


        setAttempt(
          loadedAttempt
        );


        /*
         * =========================
         * NEW ATTEMPT
         * =========================
         *
         * New randomized attempts have
         * question_snapshot.
         */

        if (
          Array.isArray(
            loadedAttempt.question_snapshot
          ) &&
          loadedAttempt.question_snapshot.length >
            0
        ) {

          /*
           * Create signed URLs for
           * private question images.
           */

          const questionsWithImages =
            await Promise.all(

              loadedAttempt.question_snapshot.map(
                async (question) => {

                  if (
                    !question.questionImagePath
                  ) {

                    return {
                      ...question,

                      displayImageUrl:
                        null,
                    };

                  }


                  const {
                    data: signedData,
                    error: signedError,
                  } =
                    await supabase.storage
                      .from(
                        "question-images"
                      )
                      .createSignedUrl(
                        question.questionImagePath,
                        60 * 60 * 6
                      );


                  if (signedError) {

                    console.warn(
                      "Unable to create signed question image URL:",
                      signedError.message
                    );

                    return {
                      ...question,

                      displayImageUrl:
                        null,
                    };

                  }


                  return {
                    ...question,

                    displayImageUrl:
                      signedData.signedUrl,
                  };

                }
              )

            );


          setQuestions(
            questionsWithImages
          );

          return;
        }


        /*
         * =========================
         * LEGACY ATTEMPT SUPPORT
         * =========================
         *
         * Attempts created before
         * question_snapshot existed
         * still depended on questions.ts.
         */

        const subjectTests =
          questionBank[
            loadedAttempt.subject
          ];


        const legacyTest =
          subjectTests?.find(
            (test) =>
              test.id ===
              loadedAttempt.test_id
          );


        if (!legacyTest) {

          setError(
            "The question data for this older attempt is no longer available."
          );

          return;
        }


        const legacyQuestions: SnapshotQuestion[] =
          legacyTest.questions.map(
            (question) => {

              const savedAnswer =
                loadedAttempt.answers?.find(
                  (answer) =>
                    String(
                      answer.questionId
                    ) ===
                    String(
                      question.id
                    )
                );


              return {
                questionId:
                  String(
                    question.id
                  ),

                questionText:
                  question.question,

                questionImagePath:
                  null,

                options:
                  question.options,

                selectedAnswer:
                  savedAnswer
                    ?.selectedAnswer ??
                  null,

                correctAnswer:
                  question.correctAnswer,

                explanation:
                  question.explanation,

                displayImageUrl:
                  null,
              };

            }
          );


        setLegacyAttempt(
          true
        );

        setQuestions(
          legacyQuestions
        );

      } catch (err: unknown) {

        let message =
          "Unable to load this attempt.";


        if (
          typeof err === "object" &&
          err !== null
        ) {

          const supabaseError =
            err as {
              message?: string;
            };


          if (
            supabaseError.message
          ) {

            /*
             * Don't expose Supabase's
             * confusing .single() message
             * directly to students.
             */

            if (
              supabaseError.message
                .toLowerCase()
                .includes(
                  "multiple (or no) rows"
                )
            ) {

              message =
                "Attempt not found.";

            }

          }

        }


        setError(message);

      } finally {

        setLoading(false);

      }
    }


    if (attemptId) {
      loadAttempt();
    }

  }, [attemptId]);


  /*
   * =========================================
   * LOADING
   * =========================================
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="flex items-center gap-3 text-sm text-slate-500">

          <Loader2
            size={20}
            className="animate-spin"
          />

          Loading result...

        </div>

      </main>
    );
  }


  /*
   * =========================================
   * ERROR
   * =========================================
   */

  if (
    error ||
    !attempt
  ) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">

        <header className="border-b border-slate-200 bg-white">

          <div className="mx-auto flex h-20 max-w-5xl items-center px-6">

            <Link
              href="/attempts"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >

              <ArrowLeft size={18} />

              Back to Previous Attempts

            </Link>

          </div>

        </header>


        <main className="mx-auto max-w-5xl px-6 py-16">

          <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">

            <AlertCircle
              size={40}
              className="mx-auto text-red-400"
            />


            <h1 className="mt-5 text-xl font-semibold">

              Attempt not found

            </h1>


            <p className="mt-2 text-sm text-slate-500">

              {error ||
                "The selected attempt could not be found."}

            </p>

          </div>

        </main>

      </div>
    );
  }


  /*
   * =========================================
   * SUBJECT
   * =========================================
   */

  const subjectName =
    subjectNames[
      attempt.subject
    ] ||
    attempt.subject
      .split("-")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");


  /*
   * =========================================
   * DATE + TIME
   * =========================================
   */

  const completedDate =
    new Date(
      attempt.completed_at
    );


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


  /*
   * =========================================
   * TIME USED
   * =========================================
   */

  const usedMinutes =
    Math.floor(
      attempt.time_used / 60
    )
      .toString()
      .padStart(
        2,
        "0"
      );


  const usedSeconds =
    (
      attempt.time_used % 60
    )
      .toString()
      .padStart(
        2,
        "0"
      );


  /*
   * =========================================
   * MAIN PAGE
   * =========================================
   */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">


      {/* =========================
          HEADER
      ========================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex h-20 max-w-5xl items-center px-6">

          <Link
            href="/attempts"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >

            <ArrowLeft size={18} />

            Back to Previous Attempts

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

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">

            <FileQuestion
              size={28}
            />

          </div>


          <p className="mt-6 text-sm font-medium text-blue-600">

            {subjectName}

          </p>


          <h1 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">

            {attempt.test_title}

          </h1>


          <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-slate-400">

            <span className="flex items-center gap-2">

              <CalendarDays
                size={16}
              />

              {formattedDate}

            </span>


            <span className="flex items-center gap-2">

              <Clock3
                size={16}
              />

              {formattedTime}

            </span>


            <span className="flex items-center gap-2">

              <Clock3
                size={16}
              />

              Time used:{" "}
              {usedMinutes}:
              {usedSeconds}

            </span>

          </div>


          {legacyAttempt && (

            <div className="mt-5 inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">

              Legacy attempt

            </div>

          )}

        </section>


        {/* =========================
            SCORE SUMMARY
        ========================== */}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">


          {/* Score */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-400">
              Score
            </p>

            <p className="mt-2 text-2xl font-bold">

              {attempt.correct}/
              {attempt.total_questions}

            </p>

          </div>


          {/* Correct */}

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">

              <CheckCircle2
                size={16}
              />

              Correct

            </div>

            <p className="mt-2 text-2xl font-bold text-emerald-600">

              {attempt.correct}

            </p>

          </div>


          {/* Wrong */}

          <div className="rounded-2xl border border-red-100 bg-red-50 p-5">

            <div className="flex items-center gap-2 text-sm font-medium text-red-500">

              <XCircle
                size={16}
              />

              Wrong

            </div>

            <p className="mt-2 text-2xl font-bold text-red-500">

              {attempt.wrong}

            </p>

          </div>


          {/* Accuracy */}

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

            <p className="text-sm font-medium text-blue-500">

              Accuracy

            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600">

              {attempt.score_percentage}%

            </p>

          </div>

        </section>


        {/* =========================
            QUESTION REVIEW
        ========================== */}

        <section className="mt-12">

          <div className="mb-6">

            <h2 className="text-2xl font-bold">

              Question Review

            </h2>

            <p className="mt-1 text-sm text-slate-500">

              Review your answers and compare
              them with the correct answers.

            </p>

          </div>


          <div className="space-y-6">

            {questions.map(
              (
                question,
                index
              ) => {

                const selectedAnswer =
                  question.selectedAnswer;


                const isUnanswered =
                  selectedAnswer ===
                  null;


                const isCorrect =
                  !isUnanswered &&
                  selectedAnswer ===
                    question.correctAnswer;


                const isWrong =
                  !isUnanswered &&
                  selectedAnswer !==
                    question.correctAnswer;


                return (

                  <article
                    key={
                      question.questionId
                    }
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >


                    {/* =========================
                        QUESTION HEADER
                    ========================== */}

                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">

                      <div className="min-w-0 flex-1">

                        <p className="text-sm font-semibold text-blue-600">

                          Question{" "}
                          {index + 1}

                        </p>


                        {question.questionText && (

                          <h3 className="mt-3 text-base font-semibold leading-7 text-slate-900">

                            {
                              question.questionText
                            }

                          </h3>

                        )}

                      </div>


                      {/* Status */}

                      {isCorrect && (

                        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">

                          <CheckCircle2
                            size={14}
                          />

                          Correct

                        </div>

                      )}


                      {isWrong && (

                        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500">

                          <XCircle
                            size={14}
                          />

                          Wrong

                        </div>

                      )}


                      {isUnanswered && (

                        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600">

                          <AlertCircle
                            size={14}
                          />

                          Unanswered

                        </div>

                      )}

                    </div>


                    {/* =========================
                        QUESTION IMAGE
                    ========================== */}

                    {question.displayImageUrl && (

                      <div className="border-b border-slate-100 p-6">

                        <img
                          src={
                            question.displayImageUrl
                          }
                          alt={`Question ${
                            index + 1
                          }`}
                          className="max-h-[520px] max-w-full rounded-xl border border-slate-200 object-contain"
                        />

                      </div>

                    )}


                    {question.questionImagePath &&
                      !question.displayImageUrl && (

                      <div className="border-b border-slate-100 p-6">

                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">

                          The question image could not be loaded.

                        </div>

                      </div>

                    )}


                    {/* =========================
                        OPTIONS
                    ========================== */}

                    <div className="space-y-3 p-6">

                      {question.options.map(
                        (
                          option,
                          optionIndex
                        ) => {

                          const isSelected =
                            selectedAnswer ===
                            optionIndex;


                          const isCorrectOption =
                            question.correctAnswer ===
                            optionIndex;


                          let optionClass =
                            "border-slate-200 bg-white";


                          let labelClass =
                            "bg-slate-100 text-slate-500";


                          if (
                            isCorrectOption
                          ) {

                            optionClass =
                              "border-emerald-200 bg-emerald-50";

                            labelClass =
                              "bg-emerald-100 text-emerald-700";

                          }


                          if (
                            isSelected &&
                            !isCorrectOption
                          ) {

                            optionClass =
                              "border-red-200 bg-red-50";

                            labelClass =
                              "bg-red-100 text-red-600";

                          }


                          return (

                            <div
                              key={
                                optionIndex
                              }
                              className={`flex items-center gap-4 rounded-xl border p-4 ${optionClass}`}
                            >

                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${labelClass}`}
                              >

                                {String.fromCharCode(
                                  65 +
                                    optionIndex
                                )}

                              </div>


                              <p className="flex-1 text-sm font-medium text-slate-700">

                                {option}

                              </p>


                              <div className="shrink-0">

                                {isCorrectOption && (

                                  <span className="text-xs font-semibold text-emerald-600">

                                    Correct Answer

                                  </span>

                                )}


                                {isSelected &&
                                  !isCorrectOption && (

                                  <span className="text-xs font-semibold text-red-500">

                                    Your Answer

                                  </span>

                                )}

                              </div>

                            </div>

                          );

                        }
                      )}

                    </div>


                    {/* =========================
                        ANSWER SUMMARY
                    ========================== */}

                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-5">

                      <div className="grid gap-4 sm:grid-cols-2">


                        {/* Your Answer */}

                        <div>

                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">

                            Your Answer

                          </p>


                          <p
                            className={`mt-1 text-sm font-semibold ${
                              isCorrect
                                ? "text-emerald-600"
                                : isWrong
                                ? "text-red-500"
                                : "text-amber-600"
                            }`}
                          >

                            {isUnanswered
                              ? "Not answered"
                              : `${String.fromCharCode(
                                  65 +
                                    selectedAnswer!
                                )}. ${
                                  question
                                    .options[
                                    selectedAnswer!
                                  ]
                                }`}

                          </p>

                        </div>


                        {/* Correct Answer */}

                        <div>

                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">

                            Correct Answer

                          </p>


                          <p className="mt-1 text-sm font-semibold text-emerald-600">

                            {String.fromCharCode(
                              65 +
                                question
                                  .correctAnswer
                            )}
                            .{" "}
                            {
                              question.options[
                                question
                                  .correctAnswer
                              ]
                            }

                          </p>

                        </div>

                      </div>


                      {/* =========================
                          EXPLANATION
                      ========================== */}

                      {question.explanation && (

                        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">

                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">

                            Explanation

                          </p>

                          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">

                            {
                              question.explanation
                            }

                          </p>

                        </div>

                      )}

                    </div>

                  </article>

                );

              }
            )}

          </div>

        </section>


        {/* =========================
            BACK BUTTON
        ========================== */}

        <div className="mt-10 flex justify-center">

          <Link
            href="/attempts"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
          >

            <ArrowLeft
              size={17}
            />

            Back to Previous Attempts

          </Link>

        </div>


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