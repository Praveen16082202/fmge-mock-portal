"use client";

import LogoutButton from "./LogoutButton";
import Link from "next/link";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BookOpen,
  BarChart3,
  ClipboardList,
  Lock,
  LayoutDashboard,
  User,
  ChevronRight,
  Clock3,
  Copy,
  Check,
  BadgeCheck,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/client";


export default function Dashboard() {
  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  const [
    userName,
    setUserName,
  ] = useState("Student");

  const [
    userEmail,
    setUserEmail,
  ] = useState("");

  const [
    studentId,
    setStudentId,
  ] = useState("");

  const [
    copied,
    setCopied,
  ] = useState(false);

  const profileRef =
    useRef<HTMLDivElement>(
      null
    );


  /*
   * =========================================
   * LOAD USER + STUDENT PROFILE
   * =========================================
   */

  useEffect(() => {
    const supabase =
      createClient();


    async function loadUser() {
      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();


      if (userError) {
        console.error(
          "Unable to load user:",
          userError
        );

        return;
      }


      if (!user) {
        return;
      }


      /*
       * =====================================
       * AUTH METADATA
       * =====================================
       */

      const metadataName =
        user.user_metadata
          ?.full_name ||
        user.user_metadata
          ?.name;


      if (metadataName) {

        setUserName(
          metadataName
        );

      } else if (
        user.email
      ) {

        setUserName(
          user.email.split("@")[0]
        );

      }


      if (user.email) {
        setUserEmail(
          user.email
        );
      }


      /*
       * =====================================
       * STUDENT PROFILE
       * =====================================
       *
       * Fetch:
       *
       * student_id
       * full_name
       *
       * using the authenticated user's UUID.
       */

      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from(
            "student_profiles"
          )
          .select(
            `
            student_id,
            full_name,
            email
            `
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();


      if (profileError) {

        console.error(
          "Unable to load student profile:",
          profileError
        );

        return;

      }


      if (!profile) {
        return;
      }


      /*
       * Profile name takes priority
       * because admins can maintain it.
       */

      if (
        profile.full_name
          ?.trim()
      ) {

        setUserName(
          profile.full_name
        );

      }


      if (
        profile.email
      ) {

        setUserEmail(
          profile.email
        );

      }


      if (
        profile.student_id
      ) {

        setStudentId(
          profile.student_id
        );

      }

    }


    loadUser();

  }, []);


  /*
   * =========================================
   * CLOSE PROFILE DROPDOWN
   * WHEN CLICKING OUTSIDE
   * =========================================
   */

  useEffect(() => {

    function handleClickOutside(
      event: MouseEvent
    ) {

      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target as Node
        )
      ) {

        setProfileOpen(
          false
        );

      }

    }


    document.addEventListener(
      "mousedown",
      handleClickOutside
    );


    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

    };

  }, []);


  /*
   * =========================================
   * COPY STUDENT ID
   * =========================================
   */

  async function copyStudentId() {

    if (!studentId) {
      return;
    }


    try {

      await navigator.clipboard.writeText(
        studentId
      );

      setCopied(true);


      window.setTimeout(
        () => {
          setCopied(false);
        },
        1500
      );

    } catch (error) {

      console.error(
        "Unable to copy Student ID:",
        error
      );

    }

  }


  /*
   * =========================================
   * PAGE
   * =========================================
   */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">


      {/* =====================================
          SIDEBAR
      ====================================== */}

      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-200 bg-white lg:block">


        {/* Logo */}

        <div className="flex h-20 items-center border-b border-slate-200 px-6">

          <div>

            <h1 className="text-xl font-bold tracking-tight text-slate-900">

              FMGE
              <span className="text-blue-600">
                Prep
              </span>

            </h1>


            <p className="text-xs text-slate-400">

              Mock Test Portal

            </p>

          </div>

        </div>


        {/* Navigation */}

        <nav className="p-4">

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">

            Menu

          </p>


          {/* Dashboard */}

          <Link
            href="/dashboard"
            className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-3 py-3 text-sm font-semibold text-blue-600"
          >

            <LayoutDashboard
              size={19}
            />

            Dashboard

          </Link>


          {/* Subject Tests */}

          <Link
            href="/subjects"
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 transition hover:bg-slate-50"
          >

            <BookOpen
              size={19}
            />

            Subject Tests

          </Link>


          {/* Previous Attempts */}

          <Link
            href="/attempts"
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 transition hover:bg-slate-50"
          >

            <ClipboardList
              size={19}
            />

            Previous Attempts

          </Link>


          {/* Performance */}

          <Link
            href="/performance"
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 transition hover:bg-slate-50"
          >

            <BarChart3
              size={19}
            />

            Performance

          </Link>

        </nav>

      </aside>


      {/* =====================================
          MAIN CONTENT
      ====================================== */}

      <main className="lg:ml-64">


        {/* =====================================
            HEADER
        ====================================== */}

        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-10">


          {/* Header Title */}

          <div>

            <p className="text-sm text-slate-400">

              Dashboard

            </p>


            <h2 className="text-lg font-semibold">

              Your Preparation

            </h2>

          </div>


          {/* =================================
              PROFILE
          ================================== */}

          <div
            ref={
              profileRef
            }
            className="relative"
          >


            {/* Profile Trigger */}

            <button
              type="button"
              onClick={() =>
                setProfileOpen(
                  (open) =>
                    !open
                )
              }
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50"
            >


              {/* User Details */}

              <div className="hidden text-right sm:block">

                <p className="text-sm font-medium text-slate-700">

                  {userName}

                </p>


                {studentId && (

                  <p className="mt-0.5 font-mono text-xs font-semibold text-blue-600">

                    {studentId}

                  </p>

                )}

              </div>


              {/* Profile Icon */}

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">

                <User
                  size={19}
                  className="text-slate-600"
                />

              </div>

            </button>


            {/* =================================
                PROFILE DROPDOWN
            ================================== */}

            {profileOpen && (

              <div className="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">


                {/* User Information */}

                <div className="border-b border-slate-100 px-4 py-4">

                  <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">

                      <User
                        size={19}
                      />

                    </div>


                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-semibold text-slate-900">

                        {userName}

                      </p>


                      <p className="mt-1 truncate text-xs text-slate-400">

                        {userEmail}

                      </p>


                      {studentId && (

                        <div className="mt-3">

                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">

                            Student ID

                          </p>


                          <div className="mt-1 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">

                            <div className="flex items-center gap-2">

                              <BadgeCheck
                                size={15}
                                className="text-blue-600"
                              />

                              <span className="font-mono text-sm font-bold text-blue-600">

                                {studentId}

                              </span>

                            </div>


                            <button
                              type="button"
                              onClick={
                                copyStudentId
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 transition hover:bg-blue-100 hover:text-blue-700"
                              title="Copy Student ID"
                            >

                              {copied ? (

                                <Check
                                  size={15}
                                />

                              ) : (

                                <Copy
                                  size={15}
                                />

                              )}

                            </button>

                          </div>

                        </div>

                      )}

                    </div>

                  </div>

                </div>


                {/* Logout */}

                <div className="p-2">

                  <LogoutButton />

                </div>

              </div>

            )}

          </div>

        </header>


        {/* =====================================
            PAGE CONTENT
        ====================================== */}

        <div className="p-6 lg:p-10">


          {/* =================================
              WELCOME SECTION
          ================================== */}

          <section className="mb-8">


            <p className="mb-2 text-sm font-medium text-blue-600">

              Welcome back 👋

            </p>


            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">

              {userName !== "Student"
                ? `Keep pushing forward, ${userName}.`
                : "Keep pushing forward."}

            </h1>


            <p className="mt-2 max-w-xl text-slate-500">

              Practice consistently, track your performance, and strengthen
              your medical knowledge one subject at a time.

            </p>


            {/* Student ID Card */}

            {studentId && (

              <div className="mt-6 inline-flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">

                  <BadgeCheck
                    size={20}
                  />

                </div>


                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">

                    Your Student ID

                  </p>


                  <p className="mt-1 font-mono text-lg font-bold tracking-wide text-blue-700">

                    {studentId}

                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    copyStudentId
                  }
                  className="ml-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-500 shadow-sm transition hover:text-blue-700"
                  title="Copy Student ID"
                >

                  {copied ? (

                    <Check
                      size={16}
                    />

                  ) : (

                    <Copy
                      size={16}
                    />

                  )}

                </button>

              </div>

            )}

          </section>


          {/* =================================
              MAIN CARDS
          ================================== */}

          <section className="grid gap-5 md:grid-cols-2">


            {/* SUBJECT TESTS */}

            <Link
              href="/subjects"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                  <BookOpen
                    size={24}
                  />

                </div>


                <ChevronRight
                  size={20}
                  className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500"
                />

              </div>


              <h3 className="mt-6 text-xl font-semibold">

                Subject Tests

              </h3>


              <p className="mt-2 text-sm leading-6 text-slate-500">

                Practice FMGE questions subject-wise and focus on the areas
                where you need the most improvement.

              </p>


              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-blue-600">

                Start Practicing

                <ChevronRight
                  size={16}
                />

              </div>

            </Link>


            {/* PERFORMANCE */}

            <Link
              href="/performance"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">

                  <BarChart3
                    size={24}
                  />

                </div>


                <ChevronRight
                  size={20}
                  className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-500"
                />

              </div>


              <h3 className="mt-6 text-xl font-semibold">

                Performance

              </h3>


              <p className="mt-2 text-sm leading-6 text-slate-500">

                Monitor your accuracy, scores, and subject-wise progress
                throughout your preparation.

              </p>


              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-emerald-600">

                View Performance

                <ChevronRight
                  size={16}
                />

              </div>

            </Link>

          </section>


          {/* =================================
              PREVIOUS ATTEMPTS
          ================================== */}

          <section className="mt-5">

            <Link
              href="/attempts"
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <div className="flex items-center gap-5">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">

                  <ClipboardList
                    size={24}
                  />

                </div>


                <div>

                  <h3 className="font-semibold">

                    Previous Attempts

                  </h3>


                  <p className="mt-1 text-sm text-slate-500">

                    Review completed tests and analyze your previous results.

                  </p>

                </div>

              </div>


              <ChevronRight
                size={22}
                className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-500"
              />

            </Link>

          </section>


          {/* =================================
              FULL MOCK TEST
          ================================== */}

          <section className="mt-5">

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6">


              {/* Badge */}

              <div className="absolute right-6 top-6">

                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-500">

                  COMING SOON

                </span>

              </div>


              {/* Icon */}

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">

                <Lock
                  size={23}
                />

              </div>


              {/* Title */}

              <h3 className="mt-6 text-xl font-semibold text-slate-500">

                Full FMGE Mock Test

              </h3>


              {/* Description */}

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">

                Full-length FMGE simulation tests will be available here
                soon. For now, strengthen your preparation with
                subject-wise tests.

              </p>


              {/* Status */}

              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-400">

                <Clock3
                  size={16}
                />

                Feature under development

              </div>

            </div>

          </section>


          {/* =================================
              FOOTER
          ================================== */}

          <footer className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">

            FMGE Prep • Mock Test Portal • GP Techs

          </footer>

        </div>

      </main>

    </div>
  );
}