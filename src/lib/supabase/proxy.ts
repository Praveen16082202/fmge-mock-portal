import { createServerClient } from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";


export async function updateSession(
  request: NextRequest
) {
  let supabaseResponse =
    NextResponse.next({
      request,
    });


  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {

          getAll() {
            return request.cookies.getAll();
          },


          setAll(cookiesToSet) {

            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {

                request.cookies.set(
                  name,
                  value
                );

              }
            );


            supabaseResponse =
              NextResponse.next({
                request,
              });


            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {

                supabaseResponse.cookies.set(
                  name,
                  value,
                  options
                );

              }
            );

          },

        },
      }
    );


  /*
   * =========================================
   * CURRENT USER
   * =========================================
   */

  const {
    data: { user },
  } =
    await supabase.auth.getUser();


  const pathname =
    request.nextUrl.pathname;


  /*
   * =========================================
   * PUBLIC ROUTES
   * =========================================
   */

  const isPublicPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/account-suspended" ||
    pathname.startsWith("/auth");


  /*
   * =========================================
   * NOT LOGGED IN
   * =========================================
   */

  if (
    !user &&
    !isPublicPage
  ) {

    const url =
      request.nextUrl.clone();

    url.pathname =
      "/login";

    return NextResponse.redirect(
      url
    );

  }


  /*
   * =========================================
   * LOGGED-IN USER ACCESS STATUS
   * =========================================
   */

  let accessStatus:
    | string
    | null = null;


  if (user) {

    const {
      data,
      error,
    } =
      await supabase.rpc(
        "get_my_access_status"
      );


    if (error) {

      console.error(
        "Unable to check account status:",
        error
      );


      /*
       * Fail closed.
       *
       * If we cannot determine whether
       * the account should have access,
       * don't allow protected routes.
       */

      if (
        !isPublicPage
      ) {

        const url =
          request.nextUrl.clone();

        url.pathname =
          "/login";

        return NextResponse.redirect(
          url
        );

      }

    } else {

      accessStatus =
        data;

    }

  }


  /*
   * =========================================
   * SUSPENDED STUDENT
   * =========================================
   *
   * Suspended students are sent to one
   * dedicated page.
   *
   * They cannot access:
   *
   * dashboard
   * subjects
   * tests
   * attempts
   * performance
   * admin
   * etc.
   */

  if (
    user &&
    accessStatus ===
      "suspended" &&
    pathname !==
      "/account-suspended"
  ) {

    const url =
      request.nextUrl.clone();

    url.pathname =
      "/account-suspended";

    return NextResponse.redirect(
      url
    );

  }


  /*
   * =========================================
   * INVALID / BLOCKED ACCOUNT
   * =========================================
   */

  if (
    user &&
    accessStatus ===
      "blocked" &&
    pathname !==
      "/account-suspended"
  ) {

    const url =
      request.nextUrl.clone();

    url.pathname =
      "/account-suspended";

    return NextResponse.redirect(
      url
    );

  }


  /*
   * =========================================
   * ACTIVE / ADMIN USER VISITING
   * SUSPENDED PAGE
   * =========================================
   */

  if (
    user &&
    (
      accessStatus === "active" ||
      accessStatus === "admin"
    ) &&
    pathname ===
      "/account-suspended"
  ) {

    const url =
      request.nextUrl.clone();


    if (
      accessStatus ===
        "admin"
    ) {

      url.pathname =
        "/admin";

    } else {

      url.pathname =
        "/dashboard";

    }


    return NextResponse.redirect(
      url
    );

  }


  /*
   * =========================================
   * LOGGED-IN USER VISITING AUTH PAGES
   * =========================================
   *
   * Do NOT redirect /reset-password.
   *
   * Password recovery creates a temporary
   * authenticated session and the user must
   * remain on /reset-password.
   */

  if (
    user &&
    (
      pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/forgot-password"
    )
  ) {

    const url =
      request.nextUrl.clone();


    if (
      accessStatus ===
        "admin"
    ) {

      url.pathname =
        "/admin";

    } else if (
      accessStatus ===
        "suspended" ||
      accessStatus ===
        "blocked"
    ) {

      url.pathname =
        "/account-suspended";

    } else {

      url.pathname =
        "/dashboard";

    }


    return NextResponse.redirect(
      url
    );

  }


  return supabaseResponse;
}