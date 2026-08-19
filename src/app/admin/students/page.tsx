"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Search,
  ShieldX,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/client";


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


type StatusFilter =
  | "all"
  | "active"
  | "suspended";


export default function StudentsPage() {

  /*
   * =========================================
   * STATE
   * =========================================
   */

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [students, setStudents] =
    useState<StudentProfile[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>("all");


  /*
   * =========================================
   * LOAD STUDENTS
   * =========================================
   */

  useEffect(() => {
    const supabase =
      createClient();

    async function loadStudents() {
      try {

        setLoading(true);

        setError("");


        /*
         * =================================
         * CHECK LOGIN
         * =================================
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
         * =================================
         * CHECK ADMIN
         * =================================
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


        if (
          isAdmin !== true
        ) {
          setError(
            "You do not have permission to view student accounts."
          );

          return;
        }


        /*
         * =================================
         * LOAD STUDENT PROFILES
         * =================================
         */

        const {
          data,
          error: studentsError,
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
            .order(
              "student_number",
              {
                ascending: true,
              }
            );


        if (studentsError) {
          throw studentsError;
        }


        setStudents(
  (data ?? []) as StudentProfile[]
);

      } catch (err) {

        console.error(
          "Failed to load students:",
          err
        );


        setError(
          err instanceof Error
            ? err.message
            : "Unable to load student accounts."
        );

      } finally {

        setLoading(false);

      }
    }


    loadStudents();

  }, []);


  /*
   * =========================================
   * COUNTS
   * =========================================
   */

  const totalStudents =
    students.length;


  const activeStudents =
    students.filter(
      (student) =>
        student.status ===
        "active"
    ).length;


  const suspendedStudents =
    students.filter(
      (student) =>
        student.status ===
        "suspended"
    ).length;


  /*
   * =========================================
   * FILTERED STUDENTS
   * =========================================
   */

  const filteredStudents =
    useMemo(() => {

      const normalizedSearch =
        search
          .trim()
          .toLowerCase();


      return students.filter(
        (student) => {

          /*
           * Status
           */

          const statusMatches =
            statusFilter ===
              "all" ||
            student.status ===
              statusFilter;


          if (!statusMatches) {
            return false;
          }


          /*
           * No search text
           */

          if (
            !normalizedSearch
          ) {
            return true;
          }


          /*
           * Search using:
           *
           * FMGE ID
           * Email
           * Name
           */

          const studentId =
            student.student_id
              ?.toLowerCase() ||
            "";


          const email =
            student.email
              ?.toLowerCase() ||
            "";


          const fullName =
            student.full_name
              ?.toLowerCase() ||
            "";


          return (
            studentId.includes(
              normalizedSearch
            ) ||
            email.includes(
              normalizedSearch
            ) ||
            fullName.includes(
              normalizedSearch
            )
          );

        }
      );

    }, [
      students,
      search,
      statusFilter,
    ]);


  /*
   * =========================================
   * DATE
   * =========================================
   */

  function formatDate(
    value: string
  ) {

    try {

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

    } catch {

      return "—";

    }
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

          Loading students...

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

      <main className="min-h-screen bg-slate-50 px-6 py-10">

        <div className="mx-auto max-w-5xl">


          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >

            <ArrowLeft
              size={17}
            />

            Admin Dashboard

          </Link>


          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">

            <ShieldX
              size={45}
              className="mx-auto text-red-500"
            />


            <h1 className="mt-5 text-xl font-bold text-slate-900">

              Unable to access Student Management

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
   * PAGE
   * =========================================
   */

  return (

    <main className="min-h-screen bg-slate-50 text-slate-900">


      {/* =====================================
          HEADER
      ====================================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex min-h-20 max-w-6xl items-center px-6 py-4">

          <div>


            <Link
              href="/admin"
              className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
            >

              <ArrowLeft
                size={16}
              />

              Admin Dashboard

            </Link>


            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">

                <Users
                  size={22}
                />

              </div>


              <div>

                <h1 className="text-xl font-bold">

                  Student Management

                </h1>


                <p className="text-sm text-slate-400">

                  View and manage FMGE Prep student accounts.

                </p>

              </div>

            </div>

          </div>

        </div>

      </header>


      {/* =====================================
          CONTENT
      ====================================== */}

      <section className="mx-auto max-w-6xl px-6 py-10">


        {/* =====================================
            STATISTICS
        ====================================== */}

        <div className="grid gap-4 sm:grid-cols-3">


          {/* Total */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm font-medium text-slate-500">

                Total Students

              </p>

              <Users
                size={19}
                className="text-slate-400"
              />

            </div>


            <p className="mt-3 text-3xl font-bold text-slate-900">

              {totalStudents}

            </p>

          </div>


          {/* Active */}

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm font-medium text-emerald-600">

                Active Students

              </p>

              <UserCheck
                size={19}
                className="text-emerald-500"
              />

            </div>


            <p className="mt-3 text-3xl font-bold text-emerald-600">

              {activeStudents}

            </p>

          </div>


          {/* Suspended */}

          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm font-medium text-red-600">

                Suspended

              </p>

              <UserX
                size={19}
                className="text-red-500"
              />

            </div>


            <p className="mt-3 text-3xl font-bold text-red-600">

              {suspendedStudents}

            </p>

          </div>

        </div>


        {/* =====================================
            SEARCH + FILTERS
        ====================================== */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row">


            {/* Search */}

            <div className="relative flex-1">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />


              <input
                type="text"
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by Student ID, email or name..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* Status */}

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >

              <option value="all">

                All Status

              </option>

              <option value="active">

                Active

              </option>

              <option value="suspended">

                Suspended

              </option>

            </select>

          </div>


          <p className="mt-3 text-xs text-slate-400">

            Showing{" "}
            <span className="font-semibold text-slate-600">

              {
                filteredStudents.length
              }

            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-600">

              {students.length}

            </span>{" "}
            students

          </p>

        </div>


        {/* =====================================
            STUDENT LIST
        ====================================== */}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">


          {/* Desktop headings */}

          <div className="hidden grid-cols-[150px_1fr_150px_140px_80px] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">

            <div>
              Student ID
            </div>

            <div>
              Student
            </div>

            <div>
              Joined
            </div>

            <div>
              Status
            </div>

            <div className="text-right">
              Action
            </div>

          </div>


          {filteredStudents.length ===
          0 ? (

            /*
             * EMPTY
             */

            <div className="px-6 py-16 text-center">

              <Users
                size={36}
                className="mx-auto text-slate-300"
              />


              <h2 className="mt-4 font-semibold text-slate-700">

                No students found

              </h2>


              <p className="mt-1 text-sm text-slate-400">

                Try changing the search or status filter.

              </p>

            </div>

          ) : (

            filteredStudents.map(
              (student) => (

                <Link
                  key={
                    student.user_id
                  }
                  href={`/admin/students/${student.student_id}`}
                  className="group block border-b border-slate-100 px-6 py-5 transition last:border-b-0 hover:bg-slate-50"
                >


                  <div className="grid gap-4 md:grid-cols-[150px_1fr_150px_140px_80px] md:items-center">


                    {/* ID */}

                    <div>

                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400 md:hidden">

                        Student ID

                      </p>


                      <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 font-mono text-sm font-bold text-blue-600">

                        {
                          student.student_id
                        }

                      </span>

                    </div>


                    {/* Student */}

                    <div className="min-w-0">

                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400 md:hidden">

                        Student

                      </p>


                      <p className="truncate font-semibold text-slate-900">

                        {
                          student.full_name?.trim()
                            ? student.full_name
                            : "Name not provided"
                        }

                      </p>


                      <p className="mt-1 truncate text-sm text-slate-500">

                        {
                          student.email ||
                          "No email"
                        }

                      </p>

                    </div>


                    {/* Joined */}

                    <div>

                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400 md:hidden">

                        Joined

                      </p>


                      <p className="text-sm text-slate-600">

                        {
                          formatDate(
                            student.created_at
                          )
                        }

                      </p>

                    </div>


                    {/* Status */}

                    <div>

                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400 md:hidden">

                        Status

                      </p>


                      {student.status ===
                      "active" ? (

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">

                          <span className="h-2 w-2 rounded-full bg-emerald-500" />

                          Active

                        </span>

                      ) : (

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">

                          <span className="h-2 w-2 rounded-full bg-red-500" />

                          Suspended

                        </span>

                      )}

                    </div>


                    {/* View */}

                    <div className="flex justify-end">

                      <div className="flex items-center gap-1 text-sm font-semibold text-blue-600">

                        View

                        <ChevronRight
                          size={17}
                          className="transition group-hover:translate-x-1"
                        />

                      </div>

                    </div>

                  </div>

                </Link>

              )
            )

          )}

        </div>

      </section>

    </main>

  );
}