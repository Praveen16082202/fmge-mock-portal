import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient as createAdminClient,
} from "@supabase/supabase-js";

import {
  createClient as createServerClient,
} from "@/lib/supabase/server";


export async function POST(
  request: NextRequest
) {
  try {
    /*
     * =========================================
     * 1. VERIFY CURRENT USER
     * =========================================
     */

    const supabase =
      await createServerClient();


    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();


    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "You must be logged in.",
        },
        {
          status: 401,
        }
      );
    }


    /*
     * =========================================
     * 2. VERIFY ADMIN
     * =========================================
     */

    const {
      data: isAdmin,
      error: adminCheckError,
    } =
      await supabase.rpc(
        "is_admin"
      );


    if (adminCheckError) {
      console.error(
        "Admin verification failed:",
        adminCheckError
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify admin access.",
        },
        {
          status: 500,
        }
      );
    }


    if (
      isAdmin !== true
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to delete student accounts.",
        },
        {
          status: 403,
        }
      );
    }


    /*
     * =========================================
     * 3. READ REQUEST
     * =========================================
     */

    const body =
      await request.json();


    const studentId =
      typeof body.studentId ===
      "string"
        ? body.studentId
            .trim()
            .toUpperCase()
        : "";


    if (!studentId) {
      return NextResponse.json(
        {
          error:
            "Student ID is required.",
        },
        {
          status: 400,
        }
      );
    }


    /*
     * Accept only proper FMGE IDs.
     *
     * Example:
     * FMGE0001
     */

    if (
      !/^FMGE\d{4,}$/.test(
        studentId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid Student ID.",
        },
        {
          status: 400,
        }
      );
    }


    /*
     * =========================================
     * 4. CREATE PRIVILEGED SERVER CLIENT
     * =========================================
     *
     * IMPORTANT:
     *
     * SUPABASE_SECRET_KEY must NEVER use
     * NEXT_PUBLIC_ in the variable name.
     *
     * This client exists only inside this
     * server Route Handler.
     */

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;


    const supabaseSecretKey =
      process.env
        .SUPABASE_SECRET_KEY;


    if (
      !supabaseUrl ||
      !supabaseSecretKey
    ) {
      console.error(
        "Missing Supabase server credentials."
      );

      return NextResponse.json(
        {
          error:
            "Server configuration error.",
        },
        {
          status: 500,
        }
      );
    }


    const adminSupabase =
      createAdminClient(
        supabaseUrl,
        supabaseSecretKey,
        {
          auth: {
            autoRefreshToken:
              false,

            persistSession:
              false,

            detectSessionInUrl:
              false,
          },
        }
      );


    /*
     * =========================================
     * 5. FIND STUDENT
     * =========================================
     */

    const {
      data: student,
      error: studentError,
    } =
      await adminSupabase
        .from(
          "student_profiles"
        )
        .select(
          `
          user_id,
          student_id,
          full_name,
          email,
          status
          `
        )
        .eq(
          "student_id",
          studentId
        )
        .maybeSingle();


    if (studentError) {
      console.error(
        "Student lookup failed:",
        studentError
      );

      return NextResponse.json(
        {
          error:
            "Unable to find student account.",
        },
        {
          status: 500,
        }
      );
    }


    if (!student) {
      return NextResponse.json(
        {
          error:
            "Student account not found.",
        },
        {
          status: 404,
        }
      );
    }


    /*
     * =========================================
     * 6. DO NOT ALLOW SELF-DELETION
     * =========================================
     */

    if (
      student.user_id ===
      user.id
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot delete your own account from the student management portal.",
        },
        {
          status: 403,
        }
      );
    }


    /*
     * =========================================
     * 7. PROTECT ADMIN ACCOUNTS
     * =========================================
     *
     * Even if an admin accidentally appeared
     * inside student_profiles, this prevents
     * the account from being deleted.
     */

    const {
      data: targetAdmin,
      error: targetAdminError,
    } =
      await adminSupabase
        .from(
          "admin_users"
        )
        .select(
          "user_id"
        )
        .eq(
          "user_id",
          student.user_id
        )
        .maybeSingle();


    if (targetAdminError) {
      console.error(
        "Target admin check failed:",
        targetAdminError
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify target account.",
        },
        {
          status: 500,
        }
      );
    }


    if (targetAdmin) {
      return NextResponse.json(
        {
          error:
            "Admin accounts cannot be deleted from Student Management.",
        },
        {
          status: 403,
        }
      );
    }


    /*
     * =========================================
     * 8. DELETE SUPABASE AUTH USER
     * =========================================
     *
     * Hard delete.
     *
     * Because your related user tables use
     * ON DELETE CASCADE, deleting auth.users
     * also removes:
     *
     * student_profiles
     * attempts
     * practice_test_sessions
     * user_question_history
     * auth sessions / identities
     */

    const {
      error: deleteError,
    } =
      await adminSupabase
        .auth.admin
        .deleteUser(
          student.user_id,
          false
        );


    if (deleteError) {
      console.error(
        "Student deletion failed:",
        deleteError
      );

      return NextResponse.json(
        {
          error:
            "Unable to delete student account.",
        },
        {
          status: 500,
        }
      );
    }


    /*
     * =========================================
     * 9. SUCCESS
     * =========================================
     */

    return NextResponse.json(
      {
        success: true,

        message:
          `${studentId} was permanently deleted.`,

        student: {
          studentId:
            student.student_id,

          fullName:
            student.full_name,

          email:
            student.email,
        },
      },
      {
        status: 200,
      }
    );

  } catch (error) {
    console.error(
      "Delete student API error:",
      error
    );


    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while deleting the student.",
      },
      {
        status: 500,
      }
    );
  }
}