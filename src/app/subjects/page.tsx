import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
} from "lucide-react";

const subjects = [
  {
    name: "Anatomy",
    slug: "anatomy",
  },
  {
    name: "Physiology",
    slug: "physiology",
  },
  {
    name: "Biochemistry",
    slug: "biochemistry",
  },
  {
    name: "Pathology",
    slug: "pathology",
  },
  {
    name: "Pharmacology",
    slug: "pharmacology",
  },
  {
    name: "Microbiology",
    slug: "microbiology",
  },
  {
    name: "Forensic Medicine",
    slug: "forensic-medicine",
  },
  {
    name: "Community Medicine",
    slug: "community-medicine",
  },
  {
    name: "Medicine",
    slug: "medicine",
  },
  {
    name: "Surgery",
    slug: "surgery",
  },
  {
    name: "Pediatrics",
    slug: "pediatrics",
  },
  {
    name: "Obstetrics & Gynecology",
    slug: "obstetrics-gynecology",
  },
  {
    name: "Psychiatry",
    slug: "psychiatry",
  },
  {
    name: "Dermatology",
    slug: "dermatology",
  },
  {
    name: "Radiodiagnosis",
    slug: "radiodiagnosis",
  },
  {
    name: "Anesthesiology",
    slug: "anesthesiology",
  },
  {
    name: "Orthopedics",
    slug: "orthopedics",
  },
  {
    name: "ENT",
    slug: "ent",
  },
  {
    name: "Ophthalmology",
    slug: "ophthalmology",
  },
];

export default function SubjectsPage() {
  return (
    <main className="min-h-screen bg-slate-50">

      {/* Header */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex h-20 max-w-6xl items-center px-6">

          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >

            <ArrowLeft size={18} />

            Back to Dashboard

          </Link>

        </div>

      </header>


      {/* Main Content */}

      <div className="mx-auto max-w-6xl px-6 py-10">


        {/* Heading */}

        <div className="mb-8">

          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

            <BookOpen size={24} />

          </div>


          <h1 className="text-3xl font-bold tracking-tight text-slate-900">

            Subject Practice

          </h1>


          <p className="mt-2 max-w-2xl text-slate-500">

            Choose a subject to begin practicing FMGE-style questions.
            Each new attempt uses questions from that subject&apos;s
            active question pool.

          </p>

        </div>


        {/* Subject Grid */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {subjects.map((subject) => (

            <Link
              key={subject.slug}
              href={`/subjects/${subject.slug}`}
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
            >

              <div>

                <h2 className="font-semibold text-slate-900">

                  {subject.name}

                </h2>


                <p className="mt-1 text-sm text-slate-400">

                  Start practice

                </p>

              </div>


              <ChevronRight
                size={20}
                className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500"
              />

            </Link>

          ))}

        </div>

      </div>

    </main>
  );
}