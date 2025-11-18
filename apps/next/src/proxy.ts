import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

export default authkitMiddleware();

// Match against pages that require auth
// Leave this out if you want auth on every resource (including images, css etc.)
export const config = {
  matcher: [
    "/",
    "/pricing",
    "/dashboard/:path*",
    "/product",
    // Exclude callback and login routes from middleware
    "/((?!_next/static|_next/image|favicon.ico|callback|login|.*\\.css).*)",
  ],
};
// export const config = { matcher: ["/", "/account/:path*", "/api/:path*"] };
