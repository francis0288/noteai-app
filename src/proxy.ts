import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/((?!login|reset-password|api/auth|_next/static|_next/image|favicon.ico|logo.svg|logo.png|uploads).*)",
  ],
};
