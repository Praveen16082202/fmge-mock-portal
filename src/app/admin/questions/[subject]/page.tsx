"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  ShieldX,
  Loader2,
  BookOpen,
  FileQuestion,
  X,
  Upload,
  Save,
  Image as ImageIcon,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Question = {
  id: string;
  subject: string;
  question_text: string | null;
  question_image_url: string | null;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  is_active: boolean;
  created_at: string;

  // Only used for displaying private Storage images.
  display_image_url?: string | null;
};

export default function SubjectQuestionsPage() {
  const params = useParams();

  const subject = String(params.subject || "").toLowerCase();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState("");

  /*
   * =========================
   * ADD QUESTION STATE
   * =========================
   */

  const [showAddQuestion, setShowAddQuestion] =
    useState(false);

  const [questionText, setQuestionText] =
    useState("");

  const [options, setOptions] = useState([
    "",
    "",
    "",
    "",
  ]);

  const [correctAnswer, setCorrectAnswer] =
    useState(0);

  const [explanation, setExplanation] =
    useState("");

  const [questionImage, setQuestionImage] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const supabase = createClient();

  /*
   * =========================
   * DISPLAY SUBJECT NAME
   * =========================
   */

  const subjectName = subject
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");

  /*
   * =========================
   * LOAD QUESTIONS
   * =========================
   */

  async function loadQuestions() {
    try {
      setLoading(true);
      setError("");

      /*
       * Check logged-in user
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
       * Check admin
       */

      const {
        data: isAdmin,
        error: adminError,
      } = await supabase.rpc("is_admin");

      if (adminError) {
        throw adminError;
      }

      if (isAdmin !== true) {
        setError(
          "You do not have permission to access this page."
        );

        return;
      }

      /*
       * Load questions for current subject
       */

      const {
        data,
        error: questionsError,
      } = await supabase
        .from("questions")
        .select("*")
        .eq("subject", subject)
        .order("created_at", {
          ascending: false,
        });

      if (questionsError) {
        throw questionsError;
      }

      const loadedQuestions =
        (data ?? []) as Question[];

      /*
       * =========================
       * CREATE SIGNED IMAGE URLS
       * =========================
       *
       * question-images is private.
       *
       * We store the Storage object path
       * inside question_image_url.
       *
       * Example:
       *
       * anatomy/abc-question.png
       *
       * We DO NOT store a permanent public URL.
       */

      const questionsWithImages =
        await Promise.all(
          loadedQuestions.map(
            async (question) => {
              if (
                !question.question_image_url
              ) {
                return {
                  ...question,
                  display_image_url: null,
                };
              }

              /*
               * Compatibility in case a full
               * URL was ever stored previously.
               */

              if (
                question.question_image_url.startsWith(
                  "http"
                )
              ) {
                return {
                  ...question,
                  display_image_url:
                    question.question_image_url,
                };
              }

              const {
                data: signedData,
                error: signedError,
              } = await supabase.storage
                .from("question-images")
                .createSignedUrl(
                  question.question_image_url,
                  60 * 60 * 6
                );

              if (signedError) {
                console.error(
                  "Unable to create signed image URL:",
                  signedError
                );

                return {
                  ...question,
                  display_image_url: null,
                };
              }

              return {
                ...question,
                display_image_url:
                  signedData.signedUrl,
              };
            }
          )
        );

      setQuestions(
        questionsWithImages
      );
    } catch (err) {
      console.error(
        "Failed to load questions:",
        err
      );

      setError(
        `Unable to load ${subjectName} questions.`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (subject) {
      loadQuestions();
    }
  }, [subject]);

  /*
   * =========================
   * OPEN ADD QUESTION
   * =========================
   */

  function openAddQuestion() {
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer(0);
    setExplanation("");
    setQuestionImage(null);
    setImagePreview(null);
    setFormError("");
    setShowAddQuestion(true);
  }

  /*
   * =========================
   * CLOSE ADD QUESTION
   * =========================
   */

  function closeAddQuestion() {
    if (saving) {
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setShowAddQuestion(false);
    setImagePreview(null);
  }

  /*
   * =========================
   * OPTION CHANGE
   * =========================
   */

  function updateOption(
    index: number,
    value: string
  ) {
    setOptions((current) =>
      current.map((option, i) =>
        i === index
          ? value
          : option
      )
    );
  }

  /*
   * =========================
   * IMAGE SELECTION
   * =========================
   */

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
     * Basic image validation
     */

    if (
      !file.type.startsWith("image/")
    ) {
      setFormError(
        "Please select a valid image file."
      );

      return;
    }

    /*
     * 10 MB limit
     */

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setFormError(
        "Question image must be smaller than 10 MB."
      );

      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    const preview =
      URL.createObjectURL(file);

    setQuestionImage(file);
    setImagePreview(preview);
    setFormError("");
  }

  /*
   * =========================
   * SAVE QUESTION
   * =========================
   */

  async function saveQuestion() {
    if (saving) {
      return;
    }

    setFormError("");

    /*
     * Question can be:
     *
     * text only
     * image only
     * text + image
     */

    if (
      !questionText.trim() &&
      !questionImage
    ) {
      setFormError(
        "Add question text, a question image, or both."
      );

      return;
    }

    /*
     * All 4 options are required.
     */

    const cleanedOptions =
      options.map((option) =>
        option.trim()
      );

    if (
      cleanedOptions.some(
        (option) => !option
      )
    ) {
      setFormError(
        "Please enter all four answer options."
      );

      return;
    }

    setSaving(true);

    let uploadedImagePath:
      | string
      | null = null;

    try {
      /*
       * =========================
       * VERIFY ADMIN AGAIN
       * =========================
       */

      const {
        data: isAdmin,
        error: adminError,
      } = await supabase.rpc(
        "is_admin"
      );

      if (
        adminError ||
        isAdmin !== true
      ) {
        throw new Error(
          "Admin authorization failed."
        );
      }

      /*
       * =========================
       * UPLOAD QUESTION IMAGE
       * =========================
       */

      if (questionImage) {
        const extension =
          questionImage.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
          "png";

        const fileName =
          `${crypto.randomUUID()}.${extension}`;

        uploadedImagePath =
          `${subject}/${fileName}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from("question-images")
          .upload(
            uploadedImagePath,
            questionImage,
            {
              cacheControl: "3600",
              upsert: false,
            }
          );

        if (uploadError) {
          throw uploadError;
        }
      }

      /*
       * =========================
       * INSERT QUESTION
       * =========================
       */

      const {
        error: insertError,
      } = await supabase
        .from("questions")
        .insert({
          subject,
          question_text:
            questionText.trim() ||
            null,

          /*
           * Store private Storage PATH,
           * not public URL.
           */

          question_image_url:
            uploadedImagePath,

          options:
            cleanedOptions,

          correct_answer:
            correctAnswer,

          explanation:
            explanation.trim() ||
            null,

          is_active: true,
        });

      if (insertError) {
        /*
         * If DB insert fails after
         * upload, remove orphan image.
         */

        if (uploadedImagePath) {
          await supabase.storage
            .from("question-images")
            .remove([
              uploadedImagePath,
            ]);
        }

        throw insertError;
      }

      /*
       * =========================
       * SUCCESS
       * =========================
       */

      if (imagePreview) {
        URL.revokeObjectURL(
          imagePreview
        );
      }

      setShowAddQuestion(false);

      setQuestionText("");
      setOptions([
        "",
        "",
        "",
        "",
      ]);

      setCorrectAnswer(0);
      setExplanation("");
      setQuestionImage(null);
      setImagePreview(null);

      /*
       * Reload pool immediately.
       */

      await loadQuestions();

    } catch (err) {
      console.error(
        "Failed to save question:",
        err
      );

      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to save question."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =========================
   * LOADING
   * =========================
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="flex items-center gap-3 text-slate-500">

          <Loader2
            size={20}
            className="animate-spin"
          />

          Loading {subjectName} questions...

        </div>

      </main>
    );
  }

  /*
   * =========================
   * ERROR
   * =========================
   */

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">

        <div className="mx-auto max-w-5xl">

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >

            <ArrowLeft size={17} />

            Back to Admin

          </Link>


          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">

            <ShieldX
              size={45}
              className="mx-auto text-red-500"
            />

            <h1 className="mt-5 text-xl font-bold text-slate-900">
              Unable to access Question Bank
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
   * =========================
   * MAIN PAGE
   * =========================
   */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">


      {/* =========================
          HEADER
      ========================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-6 px-6 py-4">

          <div>

            <Link
              href="/admin"
              className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
            >

              <ArrowLeft size={16} />

              Admin Dashboard

            </Link>


            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                <BookOpen size={20} />

              </div>


              <div>

                <h1 className="text-xl font-bold">
                  {subjectName} Question Pool
                </h1>

                <p className="text-sm text-slate-400">
                  Manage all {subjectName} questions
                </p>

              </div>

            </div>

          </div>


          {/* Add Question */}

          <button
            type="button"
            onClick={openAddQuestion}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >

            <Plus size={18} />

            Add Question

          </button>

        </div>

      </header>


      {/* =========================
          CONTENT
      ========================== */}

      <section className="mx-auto max-w-6xl px-6 py-10">


        {/* =========================
            STATISTICS
        ========================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2">


          {/* Total */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-400">
              Total Questions
            </p>

            <p className="mt-2 text-3xl font-bold">
              {questions.length}
            </p>

          </div>


          {/* Active */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-400">
              Active Questions
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {
                questions.filter(
                  (question) =>
                    question.is_active
                ).length
              }
            </p>

          </div>

        </div>


        {/* =========================
            QUESTION LIST
        ========================== */}

        {questions.length === 0 ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

              <FileQuestion size={26} />

            </div>


            <h2 className="mt-5 text-lg font-semibold">
              No {subjectName} questions yet
            </h2>


            <p className="mt-2 text-sm text-slate-500">
              Add your first {subjectName} question
              to start building the question pool.
            </p>


            <button
              type="button"
              onClick={openAddQuestion}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >

              <Plus size={17} />

              Add First Question

            </button>

          </div>

        ) : (

          <div className="space-y-4">

            {questions.map(
              (question, index) => (

                <article
                  key={question.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0 flex-1">


                      {/* Number + Status */}

                      <div className="flex items-center gap-3">

                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">

                          Q{index + 1}

                        </span>


                        {question.is_active ? (

                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">

                            Active

                          </span>

                        ) : (

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">

                            Inactive

                          </span>

                        )}

                      </div>


                      {/* Question Text */}

                      {question.question_text && (

                        <p className="mt-4 text-sm font-medium leading-6 text-slate-800">

                          {question.question_text}

                        </p>

                      )}


                      {/* Question Image */}

                      {question.display_image_url && (

                        <div className="mt-4">

                          <img
                            src={
                              question.display_image_url
                            }
                            alt="Question"
                            className="max-h-96 max-w-full rounded-xl border border-slate-200 object-contain"
                          />

                        </div>

                      )}


                      {/* Options */}

                      <div className="mt-5 grid gap-2 sm:grid-cols-2">

                        {question.options.map(
                          (
                            option,
                            optionIndex
                          ) => {

                            const isCorrect =
                              optionIndex ===
                              question.correct_answer;

                            return (

                              <div
                                key={optionIndex}
                                className={`rounded-lg border px-4 py-3 text-sm ${
                                  isCorrect
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-slate-50 text-slate-600"
                                }`}
                              >

                                <span className="mr-2 font-semibold">

                                  {String.fromCharCode(
                                    65 +
                                      optionIndex
                                  )}
                                  .

                                </span>

                                {option}

                                {isCorrect && (

                                  <span className="ml-2 text-xs font-semibold">

                                    ✓ Correct

                                  </span>

                                )}

                              </div>

                            );

                          }
                        )}

                      </div>


                      {/* Explanation */}

                      {question.explanation && (

                        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">

                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">

                            Explanation

                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-600">

                            {question.explanation}

                          </p>

                        </div>

                      )}

                    </div>

                  </div>

                </article>

              )
            )}

          </div>

        )}

      </section>


      {/* =========================
          ADD QUESTION MODAL
      ========================== */}

      {showAddQuestion && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 px-4 py-8">

          <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl">


            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <p className="text-sm font-medium text-blue-600">
                  {subjectName}
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Add Question
                </h2>

              </div>


              <button
                type="button"
                onClick={closeAddQuestion}
                disabled={saving}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >

                <X size={20} />

              </button>

            </div>


            {/* Modal Content */}

            <div className="space-y-7 p-6">


              {/* Form Error */}

              {formError && (

                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

                  {formError}

                </div>

              )}


              {/* Question Text */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">

                  Question Text

                  <span className="ml-2 font-normal text-slate-400">
                    Optional if using image
                  </span>

                </label>

                <textarea
                  value={questionText}
                  onChange={(event) =>
                    setQuestionText(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Enter the question..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>


              {/* Question Image */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">

                  Question Image

                  <span className="ml-2 font-normal text-slate-400">
                    Optional
                  </span>

                </label>


                <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-5 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50">

                  <Upload size={19} />

                  {questionImage
                    ? "Change Image"
                    : "Upload Question Image"}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleImageChange
                    }
                    className="hidden"
                  />

                </label>


                {questionImage && (

                  <p className="mt-2 text-xs text-slate-400">

                    {questionImage.name}

                  </p>

                )}


                {imagePreview && (

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">

                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">

                      <ImageIcon size={15} />

                      Image Preview

                    </div>

                    <img
                      src={imagePreview}
                      alt="Question preview"
                      className="max-h-96 max-w-full rounded-lg object-contain"
                    />

                  </div>

                )}

              </div>


              {/* Options */}

              <div>

                <div className="mb-3">

                  <h3 className="text-sm font-semibold text-slate-700">
                    Answer Options
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Enter all four options and choose the correct answer.
                  </p>

                </div>


                <div className="space-y-3">

                  {options.map(
                    (
                      option,
                      index
                    ) => (

                      <div
                        key={index}
                        className={`flex items-center gap-3 rounded-xl border p-3 ${
                          correctAnswer ===
                          index
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >


                        {/* Correct Answer Radio */}

                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={
                            correctAnswer ===
                            index
                          }
                          onChange={() =>
                            setCorrectAnswer(
                              index
                            )
                          }
                          className="h-4 w-4 accent-emerald-600"
                        />


                        {/* Letter */}

                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                            correctAnswer ===
                            index
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >

                          {String.fromCharCode(
                            65 + index
                          )}

                        </div>


                        {/* Option */}

                        <input
                          type="text"
                          value={option}
                          onChange={(
                            event
                          ) =>
                            updateOption(
                              index,
                              event.target
                                .value
                            )
                          }
                          placeholder={`Option ${String.fromCharCode(
                            65 +
                              index
                          )}`}
                          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-300"
                        />

                      </div>

                    )
                  )}

                </div>


                <p className="mt-3 text-xs text-emerald-600">

                  Correct answer:{" "}

                  <span className="font-semibold">

                    {String.fromCharCode(
                      65 +
                        correctAnswer
                    )}

                  </span>

                </p>

              </div>


              {/* Explanation */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">

                  Explanation

                  <span className="ml-2 font-normal text-slate-400">
                    Optional
                  </span>

                </label>

                <textarea
                  value={explanation}
                  onChange={(event) =>
                    setExplanation(
                      event.target.value
                    )
                  }
                  rows={5}
                  placeholder="Explain why the answer is correct..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>


            {/* Modal Footer */}

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-5">

              <button
                type="button"
                onClick={closeAddQuestion}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >

                Cancel

              </button>


              <button
                type="button"
                onClick={saveQuestion}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {saving ? (

                  <>

                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    Saving...

                  </>

                ) : (

                  <>

                    <Save size={17} />

                    Save Question

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