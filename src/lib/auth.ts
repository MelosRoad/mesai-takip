import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Kullanıcı Adı", type: "text" },
                password: { label: "Şifre", type: "password" }
            },
            async authorize(credentials) {
                console.log("Login attempt for:", credentials?.username);

                // 1. Fallback / Hardcoded Check (For Vercel SQLite issues)
                const fallbackUsers: any = {
                    "admin": { id: "admin-id", name: "Yönetici", role: "admin", password: "admin" },
                    "user": { id: "user-id", name: "Personel", role: "user", password: "user" }
                };

                const username = credentials?.username;
                const password = credentials?.password;

                if (!username || !password) return null;

                // First try Database
                try {
                    const user = await prisma.user.findUnique({
                        where: { username: username }
                    });

                    if (user && user.password === password) {
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.username,
                            role: user.role
                        }
                    }
                } catch (e) {
                    console.log("DB Error (using fallback):", e);
                }

                // If DB failed or User not found, try Fallback
                if (fallbackUsers[username] && fallbackUsers[username].password === password) {
                    console.log("Using Fallback User for:", username);
                    const u = fallbackUsers[username];
                    return {
                        id: u.id,
                        name: u.name,
                        email: username,
                        role: u.role
                    };
                }

                return null;
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = (token as any).role;
                (session.user as any).id = (token as any).id;
            }
            return session
        }
    },
    pages: {
        signIn: '/login',
    }
}
