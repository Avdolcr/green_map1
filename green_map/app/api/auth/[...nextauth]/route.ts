import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// This creates the API routes that NextAuth.js needs to work
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 