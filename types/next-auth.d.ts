import { DefaultSession, DefaultUser } from "next-auth";
import NextAuth from "next-auth";
import "next-auth/jwt";
import { Role } from "@prisma/client";

declare module "next-auth" {
    interface User extends DefaultUser {
        id: string;
        role?: Role;
    }

    interface Session extends DefaultSession {
        user: {
            id: string;
            role?: Role;
        } & DefaultUser;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        role?: Role;
    }
}
