import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: '/auth/signin',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard-artist');
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && nextUrl.pathname === '/auth/signin') {
                const role = (auth.user as any).role;
                if (role === 'artist') return Response.redirect(new URL('/dashboard-artist', nextUrl));
                // if(role === 'admin') return Response.redirect(new URL('/admin', nextUrl));
            }
            return true;
        },
        jwt({ token, user }) {
            if (user) {
                token.id = (user as any).id;
                token.role = (user as any).role;
                token.email = (user as any).email || token.email;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = (token.id as string) || (token.sub as string);
                session.user.role = token.role as any;
                session.user.email = (token.email as string) || session.user.email || '';
            }
            return session;
        },
    },
    providers: [], // Providers configured in auth.ts
} satisfies NextAuthConfig
