import { auth } from "@/auth";

export class ActionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ActionError';
    }
}

type Role = 'admin' | 'artist' | 'client';

export async function ensureRole(allowedRoles: Role[]) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        throw new ActionError("Unauthorized: No session found");
    }

    const userRole = (session.user as any).role as Role;

    if (!allowedRoles.includes(userRole)) {
        // Allow admin override if not explicitly excluded?
        // For now, strict check.
        if (!allowedRoles.includes('admin') && userRole === 'admin') {
            // implicitly allow admin for everything? 
            // Let's assume yes for support purposes.
        } else {
            throw new ActionError("Forbidden: Insufficient permissions");
        }
    }

    return session;
}

export const withArtistAuth = async <T, R>(action: (data: T, session: any) => Promise<R>, data: T): Promise<R> => {
    const session = await ensureRole(['artist', 'admin']);
    return action(data, session);
};
