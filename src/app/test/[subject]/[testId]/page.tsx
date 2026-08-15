"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import { useParams } from "next/navigation";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  CheckCircle2,
  XCircle,
  MinusCircle,
  RotateCcw,
  Loader2,
  AlertCircle,
  Cloud,
  CloudOff,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";


/* ==================================================
   SUBJECT NAMES
================================================== */

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
  dermatology: "Dermatology",
  radiodiagnosis: "Radiodiagnosis",
  radiology: "Radiology",
  anesthesiology: "Anesthesiology",
  orthopedics: "Orthopedics",
  ent: "ENT",
  ophthalmology: "Ophthalmology",
};


/* ==================================================
   QUESTION SHOWN DURING TEST
================================================== */

type PracticeQuestion = {
  session_id: string;

  id: string;

  subject: string;

  question_text: string | null;

  question_image_url: string | null;

  options: string[];

  display_image_url?: string | null;
};


/* ==================================================
   RESUMED QUESTION
================================================== */

type ResumeQuestion = PracticeQuestion & {
  saved_answers: Record<string, number>;

  started_at: string;

  expires_at: string;
};


/* ==================================================
   RESULT SNAPSHOT
================================================== */

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


/* ==================================================
   SUBMIT RESULT
================================================== */

type SubmitResult = {
  attemptId: string;

  sessionId: string;

  totalQuestions: number;

  correct: number;

  wrong: number;

  unanswered: number;

  scorePercentage: number;

  questionSnapshot: SnapshotQuestion[];
};


/* ==================================================
   SESSION METADATA
================================================== */

type SessionMeta = {
  started_at: string;

  expires_at: string;
};


export default function TestPage() {

  /* ==================================================
     ROUTE
  ================================================== */

  const params = useParams();

  const subjectSlug =
    String(
      params.subject || "anatomy"
    ).toLowerCase();

  const testId =
    Number(
      params.testId || "1"
    );

  const subjectName =
    subjectNames[subjectSlug] ||
    subjectSlug
      .split("-")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");


  /* ==================================================
     STATE
  ================================================== */

  const [questions, setQuestions] =
    useState<PracticeQuestion[]>([]);

  const [sessionId, setSessionId] =
    useState("");

  const [sessionStartedAt, setSessionStartedAt] =
    useState("");

  const [sessionExpiresAt, setSessionExpiresAt] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] =
    useState<Record<string, number>>({});

  const [
    markedQuestions,
    setMarkedQuestions,
  ] = useState<string[]>([]);

  const [timeLeft, setTimeLeft] =
    useState(0);

  const [timeUsed, setTimeUsed] =
    useState(0);

  const [submitted, setSubmitted] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [
    submissionError,
    setSubmissionError,
  ] = useState("");

  const [result, setResult] =
    useState<SubmitResult | null>(null);

  const [progressSaving, setProgressSaving] =
    useState(false);

  const [
    progressSaveError,
    setProgressSaveError,
  ] = useState("");

  const [resumedSession, setResumedSession] =
    useState(false);


  /*
   * Prevent React development mode from
   * starting/resuming twice.
   */

  const startedRef =
    useRef(false);

  /*
   * Prevent autosave from running while we
   * are initially hydrating saved answers.
   */

  const progressReadyRef =
    useRef(false);


  /* ==================================================
     IMAGE SIGNING
  ================================================== */

  async function addSignedImageUrls(
    sourceQuestions: PracticeQuestion[]
  ) {
    const supabase =
      createClient();

    return await Promise.all(
      sourceQuestions.map(
        async (question) => {

          if (
            !question.question_image_url
          ) {
            return {
              ...question,
              display_image_url: null,
            };
          }

          const {
            data,
            error,
          } =
            await supabase.storage
              .from("question-images")
              .createSignedUrl(
                question.question_image_url,
                60 * 60 * 6
              );

          if (error) {
            console.warn(
              "Unable to load question image:",
              error.message
            );

            return {
              ...question,
              display_image_url: null,
            };
          }

          return {
            ...question,
            display_image_url:
              data.signedUrl,
          };
        }
      )
    );
  }


  /* ==================================================
     LOAD / RESUME TEST
  ================================================== */

  useEffect(() => {

    if (
      !subjectSlug ||
      startedRef.current
    ) {
      return;
    }

    startedRef.current = true;


    async function loadTest() {
      const supabase =
        createClient();

      try {
        setLoading(true);

        setLoadError("");

        setSubmissionError("");

        setProgressSaveError("");

        progressReadyRef.current =
          false;


        /* ------------------------------------------
           Confirm login
        ------------------------------------------ */

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setLoadError(
            "You are not logged in."
          );

          return;
        }


        /* ------------------------------------------
           STEP 1
           Try to resume existing session
        ------------------------------------------ */

        const {
          data: resumeData,
          error: resumeError,
        } =
          await supabase.rpc(
            "resume_practice_test",
            {
              p_subject:
                subjectSlug,
            }
          );

        if (resumeError) {
          throw resumeError;
        }


        /* ------------------------------------------
           EXISTING SESSION FOUND
        ------------------------------------------ */

        if (
          resumeData &&
          resumeData.length > 0
        ) {
          const resumedQuestions =
            resumeData as ResumeQuestion[];

          const firstRow =
            resumedQuestions[0];

          const signedQuestions =
            await addSignedImageUrls(
              resumedQuestions
            );

          setSessionId(
            firstRow.session_id
          );

          setSessionStartedAt(
            firstRow.started_at
          );

          setSessionExpiresAt(
            firstRow.expires_at
          );

          setQuestions(
            signedQuestions
          );

          setAnswers(
            firstRow.saved_answers || {}
          );

          setResumedSession(true);

          /*
           * Calculate timer directly from
           * server timestamps.
           */

          const now =
            Date.now();

          const expires =
            new Date(
              firstRow.expires_at
            ).getTime();

          const started =
            new Date(
              firstRow.started_at
            ).getTime();

          const remainingSeconds =
            Math.max(
              Math.ceil(
                (expires - now) / 1000
              ),
              0
            );

          const usedSeconds =
            Math.max(
              Math.floor(
                (now - started) / 1000
              ),
              0
            );

          setTimeLeft(
            remainingSeconds
          );

          setTimeUsed(
            usedSeconds
          );

          /*
           * Autosave may run after this
           * initial hydration is finished.
           */

          window.setTimeout(
            () => {
              progressReadyRef.current =
                true;
            },
            300
          );

          return;
        }


        /* ------------------------------------------
           STEP 2
           No session → create a new one
        ------------------------------------------ */

        const {
          data: startData,
          error: startError,
        } =
          await supabase.rpc(
            "start_practice_test",
            {
              p_subject:
                subjectSlug,

              p_question_count:
                30,
            }
          );

        if (startError) {
          throw startError;
        }

        if (
          !startData ||
          startData.length === 0
        ) {
          setLoadError(
            "No active questions are available for this subject."
          );

          return;
        }

        const newQuestions =
          startData as PracticeQuestion[];

        const createdSessionId =
          newQuestions[0].session_id;

        if (!createdSessionId) {
          throw new Error(
            "Practice test session was not created."
          );
        }


        /* ------------------------------------------
           Load authoritative timestamps
        ------------------------------------------ */

        const {
          data: sessionData,
          error: sessionError,
        } =
          await supabase
            .from(
              "practice_test_sessions"
            )
            .select(
              "started_at, expires_at"
            )
            .eq(
              "id",
              createdSessionId
            )
            .single();

        if (sessionError) {
          throw sessionError;
        }

        if (
          !sessionData?.started_at ||
          !sessionData?.expires_at
        ) {
          throw new Error(
            "Practice session timing information is missing."
          );
        }

        const sessionMeta =
          sessionData as SessionMeta;


        /* ------------------------------------------
           Sign image URLs
        ------------------------------------------ */

        const signedQuestions =
          await addSignedImageUrls(
            newQuestions
          );


        /* ------------------------------------------
           Store new session
        ------------------------------------------ */

        setSessionId(
          createdSessionId
        );

        setSessionStartedAt(
          sessionMeta.started_at
        );

        setSessionExpiresAt(
          sessionMeta.expires_at
        );

        setQuestions(
          signedQuestions
        );

        setAnswers({});

        setResumedSession(false);


        /* ------------------------------------------
           Initialize countdown from server
        ------------------------------------------ */

        const now =
          Date.now();

        const started =
          new Date(
            sessionMeta.started_at
          ).getTime();

        const expires =
          new Date(
            sessionMeta.expires_at
          ).getTime();

        setTimeLeft(
          Math.max(
            Math.ceil(
              (expires - now) / 1000
            ),
            0
          )
        );

        setTimeUsed(
          Math.max(
            Math.floor(
              (now - started) / 1000
            ),
            0
          )
        );

        progressReadyRef.current =
          true;

      } catch (err: unknown) {

        let message =
          `Unable to start ${subjectName} practice test.`;

        if (
          typeof err === "object" &&
          err !== null
        ) {
          const rpcError =
            err as {
              message?: string;
            };

          if (rpcError.message) {
            message =
              rpcError.message;
          }
        }

        setLoadError(
          message
        );

      } finally {

        setLoading(false);

      }
    }


    loadTest();

  }, [subjectSlug]);


  /* ==================================================
     SERVER-BASED TIMER
  ================================================== */

  useEffect(() => {

    if (
      loading ||
      submitted ||
      !sessionStartedAt ||
      !sessionExpiresAt ||
      questions.length === 0
    ) {
      return;
    }


    function updateTimer() {
      const now =
        Date.now();

      const started =
        new Date(
          sessionStartedAt
        ).getTime();

      const expires =
        new Date(
          sessionExpiresAt
        ).getTime();

      const remainingSeconds =
        Math.max(
          Math.ceil(
            (expires - now) / 1000
          ),
          0
        );

      const usedSeconds =
        Math.max(
          Math.floor(
            (now - started) / 1000
          ),
          0
        );

      setTimeLeft(
        remainingSeconds
      );

      setTimeUsed(
        usedSeconds
      );
    }


    updateTimer();

    const timer =
      window.setInterval(
        updateTimer,
        1000
      );


    return () => {
      window.clearInterval(
        timer
      );
    };

  }, [
    loading,
    submitted,
    sessionStartedAt,
    sessionExpiresAt,
    questions.length,
  ]);


  /* ==================================================
     AUTO-SAVE ANSWERS
  ================================================== */

  useEffect(() => {

    if (
      !progressReadyRef.current ||
      !sessionId ||
      submitted ||
      isSaving ||
      loading
    ) {
      return;
    }


    /*
     * Debounce so rapidly clicking answers
     * does not spam Supabase.
     */

    const saveTimer =
      window.setTimeout(
        async () => {

          const supabase =
            createClient();

          try {
            setProgressSaving(true);

            setProgressSaveError("");

            const {
              error,
            } =
              await supabase.rpc(
                "save_practice_progress",
                {
                  p_session_id:
                    sessionId,

                  p_answers:
                    answers,
                }
              );

            if (error) {
              throw error;
            }

          } catch (err: unknown) {

            let message =
              "Unable to save progress.";

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

            setProgressSaveError(
              message
            );

          } finally {

            setProgressSaving(false);

          }

        },
        700
      );


    return () => {
      window.clearTimeout(
        saveTimer
      );
    };

  }, [
    answers,
    sessionId,
    submitted,
    isSaving,
    loading,
  ]);


  /* ==================================================
     AUTO-SUBMIT AT 00:00
  ================================================== */

  useEffect(() => {

    if (
      !loading &&
      questions.length > 0 &&
      sessionId &&
      sessionExpiresAt &&
      timeLeft === 0 &&
      !submitted &&
      !isSaving
    ) {
      submitTest();
    }

  }, [
    timeLeft,
    loading,
    submitted,
    isSaving,
    questions.length,
    sessionId,
    sessionExpiresAt,
  ]);


  /* ==================================================
     CURRENT QUESTION
  ================================================== */

  const question =
    questions[currentQuestion];


  /* ==================================================
     SELECT ANSWER
  ================================================== */

  function selectAnswer(
    answerIndex: number
  ) {
    if (!question) {
      return;
    }

    setAnswers(
      (previous) => ({
        ...previous,
        [question.id]:
          answerIndex,
      })
    );
  }


  /* ==================================================
     MARK FOR REVIEW
  ================================================== */

  function toggleMark() {
    if (!question) {
      return;
    }

    setMarkedQuestions(
      (previous) => {

        if (
          previous.includes(
            question.id
          )
        ) {
          return previous.filter(
            (id) =>
              id !== question.id
          );
        }

        return [
          ...previous,
          question.id,
        ];
      }
    );
  }


  /* ==================================================
     NEXT / PREVIOUS
  ================================================== */

  function nextQuestion() {
    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        (previous) =>
          previous + 1
      );
    }
  }


  function previousQuestion() {
    if (
      currentQuestion > 0
    ) {
      setCurrentQuestion(
        (previous) =>
          previous - 1
      );
    }
  }


  /* ==================================================
     SIGN RESULT IMAGES
  ================================================== */

  async function prepareSnapshotImages(
    snapshot: SnapshotQuestion[]
  ) {
    const supabase =
      createClient();

    return await Promise.all(
      snapshot.map(
        async (item) => {

          if (
            !item.questionImagePath
          ) {
            return {
              ...item,
              displayImageUrl: null,
            };
          }

          const {
            data,
            error,
          } =
            await supabase.storage
              .from("question-images")
              .createSignedUrl(
                item.questionImagePath,
                60 * 60 * 6
              );

          if (error) {
            return {
              ...item,
              displayImageUrl: null,
            };
          }

          return {
            ...item,
            displayImageUrl:
              data.signedUrl,
          };
        }
      )
    );
  }


  /* ==================================================
     SUBMIT
  ================================================== */

  async function submitTest() {

    if (
      isSaving ||
      submitted ||
      !sessionId ||
      questions.length === 0
    ) {
      return;
    }

    const supabase =
      createClient();

    try {
      setIsSaving(true);

      setSubmissionError("");

      progressReadyRef.current =
        false;


      const submittedAnswers =
        questions.map(
          (item) => ({
            questionId:
              item.id,

            selectedAnswer:
              answers[item.id] !==
              undefined
                ? answers[item.id]
                : null,
          })
        );


      const {
        data,
        error,
      } =
        await supabase.rpc(
          "submit_practice_test",
          {
            p_session_id:
              sessionId,

            p_test_id:
              Number.isFinite(
                testId
              )
                ? testId
                : 1,

            p_test_title:
              "Practice Test",

            p_time_used:
              timeUsed,

            p_answers:
              submittedAnswers,
          }
        );


      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          "No result was returned after submission."
        );
      }

      const serverResult =
        data as SubmitResult;

      const snapshotWithImages =
        await prepareSnapshotImages(
          serverResult.questionSnapshot ||
            []
        );

      setResult({
        ...serverResult,

        questionSnapshot:
          snapshotWithImages,
      });

      setSubmitted(true);

    } catch (err: unknown) {

      let message =
        "Unable to submit this test. Please try again.";

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

      setSubmissionError(
        message
      );

      progressReadyRef.current =
        true;

    } finally {

      setIsSaving(false);

    }
  }


  /* ==================================================
     LOADING
  ================================================== */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-center">

          <Loader2
            size={28}
            className="mx-auto animate-spin text-blue-600"
          />

          <p className="mt-4 text-sm text-slate-500">

            Checking for an active{" "}
            {subjectName} test...

          </p>

        </div>

      </main>
    );
  }


  /* ==================================================
     LOAD ERROR
  ================================================== */

  if (
    loadError ||
    questions.length === 0
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">

        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <AlertCircle
            size={42}
            className="mx-auto text-red-400"
          />

          <h1 className="mt-5 text-xl font-bold text-slate-900">

            Unable to Start Test

          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">

            {loadError ||
              "No questions are available."}

          </p>

          <Link
            href={`/subjects/${subjectSlug}`}
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >

            Back to {subjectName}

          </Link>

        </div>

      </main>
    );
  }


  /* ==================================================
     TIME FORMAT
  ================================================== */

  const minutes =
    Math.floor(
      timeLeft / 60
    )
      .toString()
      .padStart(
        2,
        "0"
      );

  const seconds =
    (
      timeLeft % 60
    )
      .toString()
      .padStart(
        2,
        "0"
      );

  const usedMinutes =
    Math.floor(
      timeUsed / 60
    )
      .toString()
      .padStart(
        2,
        "0"
      );

  const usedSeconds =
    (
      timeUsed % 60
    )
      .toString()
      .padStart(
        2,
        "0"
      );


  /* ==================================================
     RESULT SCREEN
  ================================================== */

  if (
    submitted &&
    result
  ) {
    return (
      <main className="min-h-screen bg-slate-50">

        <header className="border-b border-slate-200 bg-white">

          <div className="mx-auto flex h-20 max-w-5xl items-center px-6">

            <Link
              href={`/subjects/${subjectSlug}`}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >

              <ArrowLeft size={18} />

              Back to Tests

            </Link>

          </div>

        </header>


        <div className="mx-auto max-w-5xl px-6 py-10">

          {/* =========================
              RESULT SUMMARY
          ========================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">

            <div className="text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">

                <CheckCircle2 size={32} />

              </div>

              <p className="mt-5 text-sm font-medium text-blue-600">

                Test Completed

              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-900">

                {subjectName} — Practice Test

              </h1>

              <p className="mt-2 text-slate-500">

                Here is your performance summary.

              </p>

            </div>


            <div className="mx-auto mt-8 max-w-sm text-center">

              <p className="text-sm font-medium text-slate-400">

                Your Score

              </p>

              <p className="mt-1 text-5xl font-bold text-slate-900">

                {result.correct}

                <span className="text-2xl text-slate-300">

                  /{result.totalQuestions}

                </span>

              </p>

              <p className="mt-2 text-lg font-semibold text-blue-600">

                {result.scorePercentage}% Accuracy

              </p>

            </div>


            <div className="mt-10 grid gap-4 sm:grid-cols-4">

              <div className="rounded-2xl bg-emerald-50 p-5 text-center">

                <CheckCircle2
                  size={22}
                  className="mx-auto text-emerald-600"
                />

                <p className="mt-2 text-sm text-emerald-700">
                  Correct
                </p>

                <p className="mt-1 text-2xl font-bold text-emerald-800">
                  {result.correct}
                </p>

              </div>


              <div className="rounded-2xl bg-red-50 p-5 text-center">

                <XCircle
                  size={22}
                  className="mx-auto text-red-500"
                />

                <p className="mt-2 text-sm text-red-600">
                  Wrong
                </p>

                <p className="mt-1 text-2xl font-bold text-red-700">
                  {result.wrong}
                </p>

              </div>


              <div className="rounded-2xl bg-slate-100 p-5 text-center">

                <MinusCircle
                  size={22}
                  className="mx-auto text-slate-500"
                />

                <p className="mt-2 text-sm text-slate-500">
                  Unanswered
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-700">
                  {result.unanswered}
                </p>

              </div>


              <div className="rounded-2xl bg-blue-50 p-5 text-center">

                <Clock3
                  size={22}
                  className="mx-auto text-blue-600"
                />

                <p className="mt-2 text-sm text-blue-600">
                  Time Used
                </p>

                <p className="mt-1 text-2xl font-bold text-blue-800">

                  {usedMinutes}:{usedSeconds}

                </p>

              </div>

            </div>

          </section>


          {/* =========================
              QUESTION REVIEW
          ========================== */}

          <section className="mt-8">

            <div className="mb-5">

              <h2 className="text-2xl font-bold text-slate-900">
                Question Review
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review your answers and explanations.
              </p>

            </div>


            <div className="space-y-4">

              {result.questionSnapshot.map(
                (
                  item,
                  index
                ) => {

                  const isAnswered =
                    item.selectedAnswer !==
                    null;

                  const isCorrect =
                    isAnswered &&
                    item.selectedAnswer ===
                      item.correctAnswer;


                  return (
                    <div
                      key={item.questionId}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >

                      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

                        <div className="flex items-center gap-3">

                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                              !isAnswered
                                ? "bg-slate-100 text-slate-500"
                                : isCorrect
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {index + 1}
                          </span>

                          <span className="text-sm font-semibold text-slate-700">

                            Question {index + 1}

                          </span>

                        </div>


                        <div className="flex items-center gap-2">

                          {!isAnswered ? (
                            <>
                              <MinusCircle
                                size={17}
                                className="text-slate-400"
                              />

                              <span className="text-sm font-medium text-slate-400">
                                Unanswered
                              </span>
                            </>
                          ) : isCorrect ? (
                            <>
                              <CheckCircle2
                                size={17}
                                className="text-emerald-500"
                              />

                              <span className="text-sm font-medium text-emerald-600">
                                Correct
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle
                                size={17}
                                className="text-red-500"
                              />

                              <span className="text-sm font-medium text-red-600">
                                Incorrect
                              </span>
                            </>
                          )}

                        </div>

                      </div>


                      <div className="p-5 sm:p-6">

                        {item.questionText && (
                          <h3 className="font-semibold leading-7 text-slate-900">

                            {item.questionText}

                          </h3>
                        )}


                        {item.displayImageUrl && (
                          <div className="mt-5">

                            <img
                              src={
                                item.displayImageUrl
                              }
                              alt={`Question ${
                                index + 1
                              }`}
                              className="max-h-[500px] max-w-full rounded-xl border border-slate-200 object-contain"
                            />

                          </div>
                        )}


                        <div className="mt-6 space-y-3">

                          {item.options.map(
                            (
                              option,
                              optionIndex
                            ) => {

                              const correctOption =
                                optionIndex ===
                                item.correctAnswer;

                              const userOption =
                                item.selectedAnswer ===
                                optionIndex;

                              let optionClass =
                                "border-slate-200 bg-white";

                              if (
                                correctOption
                              ) {
                                optionClass =
                                  "border-emerald-200 bg-emerald-50";
                              }

                              if (
                                userOption &&
                                !correctOption
                              ) {
                                optionClass =
                                  "border-red-200 bg-red-50";
                              }

                              return (
                                <div
                                  key={optionIndex}
                                  className={`flex items-center gap-4 rounded-xl border p-4 ${optionClass}`}
                                >

                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">

                                    {String.fromCharCode(
                                      65 +
                                        optionIndex
                                    )}

                                  </span>

                                  <span className="flex-1 text-sm text-slate-700">

                                    {option}

                                  </span>

                                  {correctOption && (
                                    <span className="text-xs font-semibold text-emerald-600">
                                      Correct Answer
                                    </span>
                                  )}

                                  {userOption &&
                                    !correctOption && (
                                      <span className="text-xs font-semibold text-red-500">
                                        Your Answer
                                      </span>
                                    )}

                                </div>
                              );
                            }
                          )}

                        </div>


                        <div className="mt-5 grid gap-3 sm:grid-cols-2">

                          <div
                            className={`rounded-xl p-4 ${
                              !isAnswered
                                ? "bg-slate-50"
                                : isCorrect
                                ? "bg-emerald-50"
                                : "bg-red-50"
                            }`}
                          >

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">

                              Your Answer

                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">

                              {item.selectedAnswer ===
                              null
                                ? "Not answered"
                                : `${String.fromCharCode(
                                    65 +
                                      item.selectedAnswer
                                  )}. ${
                                    item.options[
                                      item
                                        .selectedAnswer
                                    ]
                                  }`}

                            </p>

                          </div>


                          <div className="rounded-xl bg-emerald-50 p-4">

                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">

                              Correct Answer

                            </p>

                            <p className="mt-1 text-sm font-medium text-emerald-800">

                              {String.fromCharCode(
                                65 +
                                  item.correctAnswer
                              )}
                              .{" "}
                              {
                                item.options[
                                  item
                                    .correctAnswer
                                ]
                              }

                            </p>

                          </div>

                        </div>


                        {item.explanation && (
                          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">

                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">

                              Explanation

                            </p>

                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-blue-900">

                              {item.explanation}

                            </p>

                          </div>
                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </section>


          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">

            <Link
              href={`/subjects/${subjectSlug}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >

              <ArrowLeft size={17} />

              Back to Tests

            </Link>


            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >

              <RotateCcw size={17} />

              Retake Test

            </button>

          </div>

        </div>

      </main>
    );
  }


  /* ==================================================
     TEST INTERFACE
  ================================================== */

  return (
    <main className="min-h-screen bg-slate-50">


      {/* Header */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

          <Link
            href={`/subjects/${subjectSlug}`}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >

            <ArrowLeft size={18} />

            Exit Test

          </Link>


          <div className="hidden text-center sm:block">

            <p className="text-xs text-slate-400">
              {subjectName}
            </p>

            <p className="text-sm font-semibold text-slate-900">
              Practice Test
            </p>

            {resumedSession && (
              <p className="mt-0.5 text-[11px] font-medium text-blue-500">
                Resumed session
              </p>
            )}

          </div>


          <div className="flex items-center gap-3">

            {/* Save indicator */}

            <div className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">

              {progressSaveError ? (
                <>
                  <CloudOff
                    size={14}
                    className="text-red-400"
                  />

                  <span className="text-red-500">
                    Save failed
                  </span>
                </>
              ) : progressSaving ? (
                <>
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />

                  Saving...
                </>
              ) : (
                <>
                  <Cloud size={14} />

                  Auto-saved
                </>
              )}

            </div>


            {/* Timer */}

            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                timeLeft <= 60
                  ? "bg-red-50 text-red-600"
                  : "bg-slate-100 text-slate-700"
              }`}
            >

              <Clock3 size={18} />

              {minutes}:{seconds}

            </div>

          </div>

        </div>

      </header>


      {/* Errors */}

      {(submissionError ||
        progressSaveError) && (
        <div className="mx-auto max-w-7xl px-6 pt-6">

          {submissionError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

              {submissionError}

            </div>
          )}

          {progressSaveError &&
            !submissionError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">

                Your latest answer could not be auto-saved.
                You can continue the test and we&apos;ll
                try again after the next answer.

              </div>
            )}

        </div>
      )}


      {/* Main */}

      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">


          {/* Question */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <p className="text-sm font-medium text-blue-600">

                  Question{" "}
                  {currentQuestion + 1}{" "}
                  of {questions.length}

                </p>

                <h1 className="mt-1 text-lg font-semibold text-slate-900">

                  Choose the best answer

                </h1>

              </div>


              <button
                type="button"
                onClick={toggleMark}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  markedQuestions.includes(
                    question.id
                  )
                    ? "bg-amber-50 text-amber-600"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                }`}
              >

                <Flag size={17} />

                <span className="hidden sm:inline">

                  {markedQuestions.includes(
                    question.id
                  )
                    ? "Marked"
                    : "Mark for Review"}

                </span>

              </button>

            </div>


            <div className="p-6 sm:p-8">

              {question.question_text && (
                <h2 className="max-w-3xl text-lg font-semibold leading-8 text-slate-900">

                  {question.question_text}

                </h2>
              )}


              {question.display_image_url ? (
                <div className="mt-6">

                  <img
                    src={
                      question.display_image_url
                    }
                    alt={`Question ${
                      currentQuestion + 1
                    }`}
                    className="max-h-[520px] max-w-full rounded-xl border border-slate-200 object-contain"
                  />

                </div>
              ) : question.question_image_url ? (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">

                  The question image could not be loaded.

                </div>
              ) : null}


              <div className="mt-8 space-y-3">

                {question.options.map(
                  (
                    option,
                    index
                  ) => {

                    const selected =
                      answers[
                        question.id
                      ] === index;

                    const optionLetter =
                      String.fromCharCode(
                        65 + index
                      );

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() =>
                          selectAnswer(
                            index
                          )
                        }
                        className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                        }`}
                      >

                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                            selected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >

                          {optionLetter}

                        </span>

                        <span
                          className={`text-sm leading-6 ${
                            selected
                              ? "font-medium text-blue-900"
                              : "text-slate-700"
                          }`}
                        >

                          {option}

                        </span>

                      </button>
                    );
                  }
                )}

              </div>

            </div>


            {/* Navigation */}

            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-5">

              <button
                type="button"
                onClick={
                  previousQuestion
                }
                disabled={
                  currentQuestion ===
                  0
                }
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >

                <ChevronLeft size={17} />

                Previous

              </button>


              {currentQuestion ===
              questions.length - 1 ? (

                <button
                  type="button"
                  onClick={submitTest}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {isSaving
                    ? "Submitting..."
                    : "Submit Test"}

                  {!isSaving && (
                    <CheckCircle2
                      size={17}
                    />
                  )}

                </button>

              ) : (

                <button
                  type="button"
                  onClick={
                    nextQuestion
                  }
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >

                  Next Question

                  <ChevronRight
                    size={17}
                  />

                </button>

              )}

            </div>

          </section>


          {/* =========================
              QUESTION NAVIGATOR
          ========================== */}

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <h2 className="font-semibold text-slate-900">
              Questions
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Click a question to jump directly to it.
            </p>


            <div className="mt-5 grid grid-cols-5 gap-2">

              {questions.map(
                (
                  item,
                  index
                ) => {

                  const answered =
                    answers[
                      item.id
                    ] !== undefined;

                  const marked =
                    markedQuestions.includes(
                      item.id
                    );

                  const active =
                    currentQuestion ===
                    index;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setCurrentQuestion(
                          index
                        )
                      }
                      className={`relative flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition ${
                        active
                          ? "bg-blue-600 text-white"
                          : answered
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >

                      {index + 1}

                      {marked && (
                        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                      )}

                    </button>
                  );
                }
              )}

            </div>


            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-3 w-3 rounded bg-blue-600" />
                Current
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-3 w-3 rounded bg-emerald-100" />
                Answered
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-3 w-3 rounded bg-slate-100" />
                Not Answered
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                Marked for Review
              </div>

            </div>


            <div className="mt-6 border-t border-slate-100 pt-5">

              <div className="flex justify-between text-xs">

                <span className="text-slate-400">
                  Progress
                </span>

                <span className="font-semibold text-slate-700">

                  {
                    Object.keys(
                      answers
                    ).length
                  }
                  /{questions.length}

                </span>

              </div>


              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">

                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${
                      (
                        Object.keys(
                          answers
                        ).length /
                        questions.length
                      ) * 100
                    }%`,
                  }}
                />

              </div>

            </div>


            {/* Auto-save status mobile */}

            <div className="mt-6 border-t border-slate-100 pt-5 sm:hidden">

              <div className="flex items-center gap-2 text-xs">

                {progressSaveError ? (
                  <>
                    <CloudOff
                      size={14}
                      className="text-red-400"
                    />

                    <span className="text-red-500">
                      Auto-save failed
                    </span>
                  </>
                ) : progressSaving ? (
                  <>
                    <Loader2
                      size={14}
                      className="animate-spin text-slate-400"
                    />

                    <span className="text-slate-400">
                      Saving progress...
                    </span>
                  </>
                ) : (
                  <>
                    <Cloud
                      size={14}
                      className="text-emerald-500"
                    />

                    <span className="text-emerald-600">
                      Progress saved
                    </span>
                  </>
                )}

              </div>

            </div>

          </aside>

        </div>

      </div>

    </main>
  );
}