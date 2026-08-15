"use client";

import LogoutButton from "./LogoutButton";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  BarChart3,
  ClipboardList,
  Lock,
  LayoutDashboard,
  User,
  ChevronRight,
  Clock3,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function Dashboard() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState("Student");
  const [userEmail, setUserEmail] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);

  /* =========================
     LOAD USER
  ========================== */

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name;

      if (fullName) {
        setUserName(fullName);
      } else if (user.email) {
        setUserName(user.email.split("@")[0]);
      }

      if (user.email) {
        setUserEmail(user.email);
      }
    }

    loadUser();
  }, []);


  /* =========================
     CLOSE PROFILE DROPDOWN
     WHEN CLICKING OUTSIDE
  ========================== */

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target as Node
        )
      ) {
        setProfileOpen(false);
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


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =========================
          SIDEBAR
      ========================== */}

      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-200 bg-white lg:block">

        {/* Logo */}

        <div className="flex h-20 items-center border-b border-slate-200 px-6">

          <div>

            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              FMGE<span className="text-blue-600">Prep</span>
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
            <LayoutDashboard size={19} />
            Dashboard
          </Link>


          {/* Subject Tests */}

          <Link
            href="/subjects"
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <BookOpen size={19} />
            Subject Tests
          </Link>


          {/* Previous Attempts */}

          <Link
            href="/attempts"
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <ClipboardList size={19} />
            Previous Attempts
          </Link>


          {/* Performance */}

          <Link
            href="/performance"
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <BarChart3 size={19} />
            Performance
          </Link>

        </nav>

      </aside>


      {/* =========================
          MAIN CONTENT
      ========================== */}

      <main className="lg:ml-64">

        {/* =========================
            HEADER
        ========================== */}

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


          {/* =========================
              PROFILE
          ========================== */}

          <div
            ref={profileRef}
            className="relative"
          >

            {/* Profile Trigger */}

            <button
              type="button"
              onClick={() =>
                setProfileOpen((open) => !open)
              }
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50"
            >

              {/* User Name */}

              <span className="hidden text-sm font-medium text-slate-700 sm:block">
                {userName}
              </span>


              {/* Profile Icon */}

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">

                <User
                  size={19}
                  className="text-slate-600"
                />

              </div>

            </button>


            {/* =========================
                PROFILE DROPDOWN
            ========================== */}

            {profileOpen && (

              <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">

                {/* User Information */}

                <div className="border-b border-slate-100 px-4 py-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">

                      <User size={19} />

                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-slate-900">
                        {userName}
                      </p>

                      <p className="truncate text-xs text-slate-400">
                        {userEmail}
                      </p>

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


        {/* =========================
            PAGE CONTENT
        ========================== */}

        <div className="p-6 lg:p-10">

          {/* Welcome Section */}

          <section className="mb-8">

            <p className="mb-2 text-sm font-medium text-blue-600">
              Welcome back 👋
            </p>

            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
              Keep pushing forward.
            </h1>

            <p className="mt-2 max-w-xl text-slate-500">
              Practice consistently, track your performance, and strengthen
              your medical knowledge one subject at a time.
            </p>

          </section>


          {/* =========================
              MAIN CARDS
          ========================== */}

          <section className="grid gap-5 md:grid-cols-2">

            {/* SUBJECT TESTS */}

            <Link
              href="/subjects"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <BookOpen size={24} />
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
                <ChevronRight size={16} />
              </div>

            </Link>


            {/* PERFORMANCE */}

            <Link
              href="/performance"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                  <BarChart3 size={24} />
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
                <ChevronRight size={16} />
              </div>

            </Link>

          </section>


          {/* =========================
              PREVIOUS ATTEMPTS
          ========================== */}

          <section className="mt-5">

            <Link
              href="/attempts"
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <div className="flex items-center gap-5">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <ClipboardList size={24} />
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


          {/* =========================
              FULL MOCK TEST
              COMING SOON
          ========================== */}

          <section className="mt-5">

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6">

              {/* Coming Soon Badge */}

              <div className="absolute right-6 top-6">

                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-500">
                  COMING SOON
                </span>

              </div>


              {/* Icon */}

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Lock size={23} />
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
                <Clock3 size={16} />
                Feature under development
              </div>

            </div>

          </section>


          {/* =========================
              FOOTER
          ========================== */}

          <footer className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
            FMGE Prep • Mock Test Portal
          </footer>

        </div>

      </main>

    </div>
  );
}