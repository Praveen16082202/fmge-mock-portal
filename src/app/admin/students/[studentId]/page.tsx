"use client";

import {
  use,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Loader2,
  Mail,
  ShieldCheck,
  ShieldX,
  Target,
  Trash2,
  User,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";


type StudentProfile = {
  user_id: string;
  student_number: number;
  student_id: string;
  email: string | null;
  full_name: string | null;
  status: "active" | "suspended";
  created_at: string;
  updated_at: string;
};


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
  completed_at: string;
};


type SubjectPerformance = {
  subject: string;
  tests: number;
  totalQuestions: number;
  answered: number;
  correct: number;
  wrong: number;
  unanswered: number;
  accuracy: number;
};


export default function StudentDetailsPage({
  params,
}: {
  params: Promise<{
    studentId: string;
  }>;
}) {
  const { studentId } = use(params);

  /*
   * =========================================
   * STATE
   * =========================================
   */

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [student, setStudent] =
    useState<StudentProfile | null>(
      null
    );

  const [attempts, setAttempts] =
    useState<Attempt[]>([]);


  /*
   * Account suspension / reactivation
   */

  const [
    accountActionLoading,
    setAccountActionLoading,
  ] = useState(false);

  const [
    accountActionError,
    setAccountActionError,
  ] = useState("");

  const [
    confirmAction,
    setConfirmAction,
  ] = useState<
    | "suspend"
    | "reactivate"
    | null
  >(null);


  /*
   * Account deletion
   */

  const [
    showDeleteModal,
    setShowDeleteModal,
  ] = useState(false);

  const [
    deleteConfirmation,
    setDeleteConfirmation,
  ] = useState("");

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);

  const [
    deleteError,
    setDeleteError,
  ] = useState("");


  /*
   * =========================================
   * LOAD STUDENT
   * =========================================
   */

  useEffect(() => {
    const supabase =
      createClient();

    async function loadStudent() {
      try {
        setLoading(true);
        setError("");

        /*
         * Check logged-in user
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
         * Check admin
         */

        const {
          data: isAdmin,
          error: adminError,
        } =
          await supabase.rpc(
            "is_admin"
          );

        if (adminError) {
          throw adminError;
        }

        if (isAdmin !== true) {
          setError(
            "You do not have permission to view student performance."
          );

          return;
        }


        /*
         * Load student profile
         */

        const {
          data: studentData,
          error: studentError,
        } =
          await supabase
            .from(
              "student_profiles"
            )
            .select(
              `
              user_id,
              student_number,
              student_id,
              email,
              full_name,
              status,
              created_at,
              updated_at
              `
            )
            .eq(
              "student_id",
              studentId
            )
            .maybeSingle();

        if (studentError) {
          throw studentError;
        }

        if (!studentData) {
          setError(
            `Student ${studentId} was not found.`
          );

          return;
        }

        const profile =
          studentData as StudentProfile;

        setStudent(profile);


        /*
         * Load this student's attempts
         */

        const {
          data: attemptsData,
          error: attemptsError,
        } =
          await supabase
            .from("attempts")
            .select(
              `
              id,
              user_id,
              subject,
              test_id,
              test_title,
              total_questions,
              correct,
              wrong,
              unanswered,
              score_percentage,
              time_used,
              completed_at
              `
            )
            .eq(
              "user_id",
              profile.user_id
            )
            .order(
              "completed_at",
              {
                ascending: false,
              }
            );

        if (attemptsError) {
          throw attemptsError;
        }

        setAttempts(
          attemptsData ?? []
        );

      } catch (err) {
        console.error(
          "Failed to load student:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load student information."
        );

      } finally {
        setLoading(false);
      }
    }

    loadStudent();

  }, [studentId]);


  /*
   * =========================================
   * CHANGE ACCOUNT STATUS
   * =========================================
   */

  async function changeAccountStatus(
    newStatus:
      | "active"
      | "suspended"
  ) {
    if (!student) {
      return;
    }

    const supabase =
      createClient();

    try {
      setAccountActionLoading(
        true
      );

      setAccountActionError("");

      /*
       * Confirm admin again
       */

      const {
        data: isAdmin,
        error: adminError,
      } =
        await supabase.rpc(
          "is_admin"
        );

      if (adminError) {
        throw adminError;
      }

      if (isAdmin !== true) {
        throw new Error(
          "You do not have permission to manage student accounts."
        );
      }


      /*
       * Update status
       */

      const {
        data: updatedStudent,
        error: updateError,
      } =
        await supabase
          .from(
            "student_profiles"
          )
          .update({
            status:
              newStatus,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "user_id",
            student.user_id
          )
          .select(
            `
            user_id,
            student_number,
            student_id,
            email,
            full_name,
            status,
            created_at,
            updated_at
            `
          )
          .single();

      if (updateError) {
        throw updateError;
      }

      setStudent(
        updatedStudent
      );

      setConfirmAction(null);

    } catch (err) {
      console.error(
        "Account status update failed:",
        err
      );

      setAccountActionError(
        err instanceof Error
          ? err.message
          : "Unable to update the student account."
      );

    } finally {
      setAccountActionLoading(
        false
      );
    }
  }


  /*
   * =========================================
   * DELETE STUDENT
   * =========================================
   */

  async function deleteStudentAccount() {
    if (!student) {
      return;
    }

    /*
     * Typed confirmation
     */

    if (
      deleteConfirmation
        .trim()
        .toUpperCase() !==
      student.student_id
        .toUpperCase()
    ) {
      setDeleteError(
        `Type ${student.student_id} exactly to confirm deletion.`
      );

      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError("");

      /*
       * Call secure server route
       */

      const response =
        await fetch(
          "/api/admin/students/delete",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              studentId:
                student.student_id,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to delete student account."
        );
      }

      /*
       * Student deleted successfully.
       * Return to student list.
       */

      window.location.href =
        "/admin/students";

    } catch (err) {
      console.error(
        "Student deletion failed:",
        err
      );

      setDeleteError(
        err instanceof Error
          ? err.message
          : "Unable to delete student account."
      );

    } finally {
      setDeleteLoading(false);
    }
  }


  /*
   * =========================================
   * PERFORMANCE
   * =========================================
   */

  const performance =
    useMemo(() => {
      let totalQuestions = 0;
      let correct = 0;
      let wrong = 0;
      let unanswered = 0;
      let totalTime = 0;

      for (
        const attempt of attempts
      ) {
        totalQuestions +=
          attempt.total_questions;

        correct +=
          attempt.correct;

        wrong +=
          attempt.wrong;

        unanswered +=
          attempt.unanswered;

        totalTime +=
          attempt.time_used;
      }

      const answered =
        correct + wrong;

      const accuracy =
        answered > 0
          ? (
              correct /
              answered
            ) * 100
          : 0;

      const overallScore =
        totalQuestions > 0
          ? (
              correct /
              totalQuestions
            ) * 100
          : 0;

      return {
        tests:
          attempts.length,

        totalQuestions,
        answered,
        correct,
        wrong,
        unanswered,
        accuracy,
        overallScore,
        totalTime,
      };

    }, [attempts]);


  /*
   * =========================================
   * SUBJECT PERFORMANCE
   * =========================================
   */

  const subjectPerformance =
    useMemo(() => {
      const subjectMap =
        new Map<
          string,
          SubjectPerformance
        >();

      for (
        const attempt of attempts
      ) {
        const existing =
          subjectMap.get(
            attempt.subject
          );

        if (existing) {
          existing.tests += 1;

          existing.totalQuestions +=
            attempt.total_questions;

          existing.correct +=
            attempt.correct;

          existing.wrong +=
            attempt.wrong;

          existing.unanswered +=
            attempt.unanswered;

          existing.answered +=
            attempt.correct +
            attempt.wrong;

          existing.accuracy =
            existing.answered > 0
              ? (
                  existing.correct /
                  existing.answered
                ) * 100
              : 0;

        } else {
          const answered =
            attempt.correct +
            attempt.wrong;

          subjectMap.set(
            attempt.subject,
            {
              subject:
                attempt.subject,

              tests: 1,

              totalQuestions:
                attempt.total_questions,

              answered,

              correct:
                attempt.correct,

              wrong:
                attempt.wrong,

              unanswered:
                attempt.unanswered,

              accuracy:
                answered > 0
                  ? (
                      attempt.correct /
                      answered
                    ) * 100
                  : 0,
            }
          );
        }
      }

      return Array.from(
        subjectMap.values()
      ).sort(
        (a, b) =>
          b.accuracy -
          a.accuracy
      );

    }, [attempts]);


  /*
   * =========================================
   * DATE HELPERS
   * =========================================
   */

  function formatDate(
    value: string
  ) {
    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(
      new Date(value)
    );
  }


  function formatDateTime(
    value: string
  ) {
    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(
      new Date(value)
    );
  }


  function formatDuration(
    seconds: number
  ) {
    const minutes =
      Math.floor(
        seconds / 60
      );

    const remainingSeconds =
      seconds % 60;

    return `${minutes}m ${remainingSeconds}s`;
  }


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

          Loading student performance...

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
    !student
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">

        <div className="mx-auto max-w-5xl">

          <Link
            href="/admin/students"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >

            <ArrowLeft
              size={17}
            />

            Student Management

          </Link>


          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">

            <ShieldX
              size={45}
              className="mx-auto text-red-500"
            />

            <h1 className="mt-5 text-xl font-bold text-slate-900">

              Unable to load student

            </h1>

            <p className="mt-2 text-sm text-slate-500">

              {error ||
                "Student not found."}

            </p>

          </div>

        </div>

      </main>
    );
  }


  /*
   * =========================================
   * PAGE
   * =========================================
   */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">


      {/* =====================================
          HEADER
      ====================================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-6xl px-6 py-5">

          <Link
            href="/admin/students"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >

            <ArrowLeft
              size={17}
            />

            Student Management

          </Link>


          <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">

                <User
                  size={27}
                />

              </div>


              <div>

                <div className="flex flex-wrap items-center gap-3">

                  <h1 className="text-2xl font-bold tracking-tight">

                    {
                      student.full_name?.trim()
                        ? student.full_name
                        : student.student_id
                    }

                  </h1>


                  {student.status ===
                  "active" ? (

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">

                      <UserCheck
                        size={13}
                      />

                      Active

                    </span>

                  ) : (

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">

                      <UserX
                        size={13}
                      />

                      Suspended

                    </span>

                  )}

                </div>


                <p className="mt-1 font-mono text-sm font-semibold text-blue-600">

                  {student.student_id}

                </p>

              </div>

            </div>


            <div className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600 sm:self-auto">

              <ShieldCheck
                size={16}
              />

              Admin View

            </div>

          </div>

        </div>

      </header>


      {/* =====================================
          CONTENT
      ====================================== */}

      <section className="mx-auto max-w-6xl space-y-8 px-6 py-10">


        {/* =====================================
            STUDENT INFORMATION
        ====================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="font-bold">

            Student Information

          </h2>


          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">


            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">

                Student ID

              </p>

              <p className="mt-2 font-mono font-bold text-blue-600">

                {student.student_id}

              </p>

            </div>


            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">

                Email

              </p>

              <p className="mt-2 flex items-center gap-2 text-sm font-medium">

                <Mail
                  size={15}
                  className="text-slate-400"
                />

                {student.email ||
                  "Not available"}

              </p>

            </div>


            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">

                Joined

              </p>

              <p className="mt-2 flex items-center gap-2 text-sm font-medium">

                <CalendarDays
                  size={15}
                  className="text-slate-400"
                />

                {
                  formatDate(
                    student.created_at
                  )
                }

              </p>

            </div>


            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">

                Account Status

              </p>

              <p className="mt-2 text-sm font-semibold capitalize">

                {student.status}

              </p>

            </div>

          </div>

        </div>


        {/* =====================================
            PERFORMANCE OVERVIEW
        ====================================== */}

        <div>

          <div className="flex items-center gap-3">

            <BarChart3
              size={22}
              className="text-blue-600"
            />

            <div>

              <h2 className="text-xl font-bold">

                Performance Overview

              </h2>

              <p className="mt-1 text-sm text-slate-500">

                Overall activity across completed tests.

              </p>

            </div>

          </div>


          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">


            {/* Tests */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <FileQuestion
                size={20}
                className="text-blue-500"
              />

              <p className="mt-4 text-sm text-slate-500">

                Tests Completed

              </p>

              <p className="mt-1 text-3xl font-bold">

                {performance.tests}

              </p>

            </div>


            {/* Answered */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <BookOpen
                size={20}
                className="text-violet-500"
              />

              <p className="mt-4 text-sm text-slate-500">

                Questions Answered

              </p>

              <p className="mt-1 text-3xl font-bold">

                {performance.answered}

              </p>

              <p className="mt-1 text-xs text-slate-400">

                {
                  performance.totalQuestions
                }{" "}
                questions seen

              </p>

            </div>


            {/* Correct */}

            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

              <CheckCircle2
                size={20}
                className="text-emerald-500"
              />

              <p className="mt-4 text-sm text-slate-500">

                Correct Answers

              </p>

              <p className="mt-1 text-3xl font-bold text-emerald-600">

                {performance.correct}

              </p>

            </div>


            {/* Accuracy */}

            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">

              <Target
                size={20}
                className="text-blue-500"
              />

              <p className="mt-4 text-sm text-slate-500">

                Answer Accuracy

              </p>

              <p className="mt-1 text-3xl font-bold text-blue-600">

                {
                  performance.accuracy.toFixed(
                    1
                  )
                }
                %

              </p>

              <p className="mt-1 text-xs text-slate-400">

                Overall score:{" "}

                {
                  performance.overallScore.toFixed(
                    1
                  )
                }
                %

              </p>

            </div>

          </div>


          {/* Secondary Stats */}

          <div className="mt-4 grid gap-4 sm:grid-cols-3">


            <div className="rounded-xl border border-red-100 bg-red-50 p-4">

              <div className="flex items-center gap-2 text-sm font-medium text-red-600">

                <XCircle
                  size={16}
                />

                Wrong Answers

              </div>

              <p className="mt-2 text-xl font-bold text-red-600">

                {performance.wrong}

              </p>

            </div>


            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">

              <p className="text-sm font-medium text-amber-700">

                Unanswered

              </p>

              <p className="mt-2 text-xl font-bold text-amber-700">

                {performance.unanswered}

              </p>

            </div>


            <div className="rounded-xl border border-slate-200 bg-white p-4">

              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">

                <Clock3
                  size={16}
                />

                Total Test Time

              </div>

              <p className="mt-2 text-xl font-bold">

                {
                  formatDuration(
                    performance.totalTime
                  )
                }

              </p>

            </div>

          </div>

        </div>


        {/* =====================================
            SUBJECT PERFORMANCE
        ====================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <Target
              size={20}
              className="text-violet-600"
            />

            <div>

              <h2 className="font-bold">

                Subject Performance

              </h2>

              <p className="mt-1 text-sm text-slate-500">

                Accuracy based on answered questions.

              </p>

            </div>

          </div>


          {subjectPerformance.length ===
          0 ? (

            <div className="py-12 text-center text-sm text-slate-400">

              No subject performance available yet.

            </div>

          ) : (

            <div className="mt-6 space-y-5">

              {subjectPerformance.map(
                (subject) => (

                  <div
                    key={
                      subject.subject
                    }
                  >

                    <div className="flex items-end justify-between gap-4">

                      <div>

                        <p className="font-semibold capitalize">

                          {
                            subject.subject.replaceAll(
                              "-",
                              " "
                            )
                          }

                        </p>

                        <p className="mt-1 text-xs text-slate-400">

                          {
                            subject.tests
                          }{" "}
                          test
                          {
                            subject.tests !==
                            1
                              ? "s"
                              : ""
                          }

                          {" • "}

                          {
                            subject.correct
                          }{" "}
                          correct

                          {" • "}

                          {
                            subject.wrong
                          }{" "}
                          wrong

                        </p>

                      </div>


                      <p className="font-bold text-blue-600">

                        {
                          subject.accuracy.toFixed(
                            1
                          )
                        }
                        %

                      </p>

                    </div>


                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">

                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{
                          width:
                            `${Math.min(
                              subject.accuracy,
                              100
                            )}%`,
                        }}
                      />

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>


        {/* =====================================
            RECENT ATTEMPTS
        ====================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">

            <h2 className="font-bold">

              Recent Test Attempts

            </h2>

            <p className="mt-1 text-sm text-slate-500">

              Latest completed tests for this student.

            </p>

          </div>


          {attempts.length === 0 ? (

            <div className="px-6 py-14 text-center">

              <FileQuestion
                size={36}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 font-semibold text-slate-600">

                No attempts yet

              </p>

            </div>

          ) : (

            <div>

              {attempts
                .slice(0, 10)
                .map(
                  (attempt) => (

                    <div
                      key={
                        attempt.id
                      }
                      className="border-b border-slate-100 px-6 py-5 last:border-b-0"
                    >

                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">


                        <div>

                          <p className="text-sm font-medium capitalize text-blue-600">

                            {
                              attempt.subject.replaceAll(
                                "-",
                                " "
                              )
                            }

                          </p>

                          <h3 className="mt-1 font-semibold">

                            {
                              attempt.test_title
                            }

                          </h3>

                          <p className="mt-2 text-xs text-slate-400">

                            {
                              formatDateTime(
                                attempt.completed_at
                              )
                            }

                          </p>

                        </div>


                        <div className="flex flex-wrap gap-3">


                          <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">

                            <p className="text-xs text-slate-400">

                              Score

                            </p>

                            <p className="mt-1 font-bold">

                              {
                                attempt.correct
                              }
                              /
                              {
                                attempt.total_questions
                              }

                            </p>

                          </div>


                          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center">

                            <p className="text-xs text-emerald-600">

                              Correct

                            </p>

                            <p className="mt-1 font-bold text-emerald-600">

                              {
                                attempt.correct
                              }

                            </p>

                          </div>


                          <div className="rounded-xl bg-red-50 px-4 py-3 text-center">

                            <p className="text-xs text-red-500">

                              Wrong

                            </p>

                            <p className="mt-1 font-bold text-red-500">

                              {
                                attempt.wrong
                              }

                            </p>

                          </div>


                          <div className="rounded-xl bg-blue-50 px-4 py-3 text-center">

                            <p className="text-xs text-blue-500">

                              Score %

                            </p>

                            <p className="mt-1 font-bold text-blue-600">

                              {
                                attempt.score_percentage
                              }
                              %

                            </p>

                          </div>

                        </div>

                      </div>

                    </div>

                  )
                )}

            </div>

          )}

        </div>


        {/* =====================================
            ACCOUNT MANAGEMENT
        ====================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

            <div>

              <h2 className="font-bold">

                Account Management

              </h2>

              <p className="mt-2 text-sm text-slate-500">

                {student.status ===
                "active"
                  ? "This student currently has access to the FMGE Prep portal."
                  : "This student's access to the FMGE Prep portal is currently suspended."}

              </p>

            </div>


            {student.status ===
            "active" ? (

              <button
                type="button"
                onClick={() =>
                  setConfirmAction(
                    "suspend"
                  )
                }
                disabled={
                  accountActionLoading
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >

                <UserX
                  size={17}
                />

                Suspend Account

              </button>

            ) : (

              <button
                type="button"
                onClick={() =>
                  setConfirmAction(
                    "reactivate"
                  )
                }
                disabled={
                  accountActionLoading
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >

                <UserCheck
                  size={17}
                />

                Reactivate Account

              </button>

            )}

          </div>


          {accountActionError && (

            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

              {accountActionError}

            </div>

          )}

        </div>


        {/* =====================================
            DANGER ZONE
        ====================================== */}

        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

            <div>

              <div className="flex items-center gap-2">

                <Trash2
                  size={19}
                  className="text-red-600"
                />

                <h2 className="font-bold text-red-600">

                  Danger Zone

                </h2>

              </div>


              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">

                Permanently delete this student account and all associated
                FMGE Prep data. This action cannot be undone.

              </p>

            </div>


            <button
              type="button"
              onClick={() => {
                setDeleteConfirmation(
                  ""
                );

                setDeleteError(
                  ""
                );

                setShowDeleteModal(
                  true
                );
              }}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >

              <Trash2
                size={17}
              />

              Delete Account

            </button>

          </div>

        </div>

      </section>


      {/* =====================================
          SUSPEND / REACTIVATE MODAL
      ====================================== */}

      {confirmAction && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                confirmAction ===
                "suspend"
                  ? "bg-red-50 text-red-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >

              {confirmAction ===
              "suspend" ? (

                <AlertTriangle
                  size={23}
                />

              ) : (

                <UserCheck
                  size={23}
                />

              )}

            </div>


            <h2 className="mt-5 text-xl font-bold text-slate-900">

              {confirmAction ===
              "suspend"
                ? "Suspend student account?"
                : "Reactivate student account?"}

            </h2>


            <p className="mt-3 text-sm leading-6 text-slate-500">

              {confirmAction ===
              "suspend"
                ? `${student.student_id} will no longer be able to access the FMGE Prep portal until an administrator reactivates the account.`
                : `${student.student_id} will regain access to the FMGE Prep portal.`}

            </p>


            <div className="mt-7 flex justify-end gap-3">

              <button
                type="button"
                disabled={
                  accountActionLoading
                }
                onClick={() =>
                  setConfirmAction(
                    null
                  )
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >

                Cancel

              </button>


              <button
                type="button"
                disabled={
                  accountActionLoading
                }
                onClick={() =>
                  changeAccountStatus(
                    confirmAction ===
                      "suspend"
                      ? "suspended"
                      : "active"
                  )
                }
                className={`inline-flex min-w-32 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  confirmAction ===
                  "suspend"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >

                {accountActionLoading ? (

                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />

                    Updating...
                  </>

                ) : confirmAction ===
                  "suspend" ? (

                  <>
                    <UserX
                      size={16}
                    />

                    Suspend
                  </>

                ) : (

                  <>
                    <UserCheck
                      size={16}
                    />

                    Reactivate
                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================
          DELETE ACCOUNT MODAL
      ====================================== */}

      {showDeleteModal && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-6">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">


            {/* Warning Icon */}

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">

              <AlertTriangle
                size={24}
              />

            </div>


            {/* Title */}

            <h2 className="mt-5 text-xl font-bold text-slate-900">

              Permanently delete account?

            </h2>


            {/* Student */}

            <p className="mt-3 text-sm leading-6 text-slate-500">

              You are about to permanently delete{" "}

              <span className="font-semibold text-slate-700">

                {
                  student.full_name ||
                  student.student_id
                }

              </span>

              {" "}from FMGE Prep.

            </p>


            {/* Danger Notice */}

            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">

              <p className="text-sm font-semibold text-red-700">

                This action cannot be undone.

              </p>

              <p className="mt-2 text-sm leading-6 text-red-600">

                The student&apos;s account, test attempts,
                performance history, practice sessions and
                question history will be permanently deleted.

              </p>

            </div>


            {/* Confirmation */}

            <div className="mt-5">

              <label
                htmlFor="delete-confirmation"
                className="block text-sm font-medium text-slate-700"
              >

                Type{" "}

                <span className="font-mono font-bold text-red-600">

                  {student.student_id}

                </span>

                {" "}to confirm

              </label>


              <input
                id="delete-confirmation"
                type="text"
                autoComplete="off"
                value={
                  deleteConfirmation
                }
                disabled={
                  deleteLoading
                }
                onChange={(
                  event
                ) => {
                  setDeleteConfirmation(
                    event.target.value
                  );

                  setDeleteError(
                    ""
                  );
                }}
                placeholder={
                  student.student_id
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm font-semibold uppercase text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:bg-slate-50"
              />

            </div>


            {/* Delete Error */}

            {deleteError && (

              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

                {deleteError}

              </div>

            )}


            {/* Buttons */}

            <div className="mt-7 flex justify-end gap-3">

              <button
                type="button"
                disabled={
                  deleteLoading
                }
                onClick={() => {
                  setShowDeleteModal(
                    false
                  );

                  setDeleteConfirmation(
                    ""
                  );

                  setDeleteError(
                    ""
                  );
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >

                Cancel

              </button>


              <button
                type="button"
                disabled={
                  deleteLoading ||
                  deleteConfirmation
                    .trim()
                    .toUpperCase() !==
                    student.student_id
                      .toUpperCase()
                }
                onClick={
                  deleteStudentAccount
                }
                className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >

                {deleteLoading ? (

                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />

                    Deleting...
                  </>

                ) : (

                  <>
                    <Trash2
                      size={16}
                    />

                    Delete Permanently
                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}