export type PersistedRole = 'driver' | 'passenger';

const AUTH_TOKEN_KEY = 'auth_token';
const ROLE_KEY = 'commuto_role';

const hasWindow = () => typeof window !== 'undefined';

const read = (storage: Storage, key: string): string | null => {
    try {
        return storage.getItem(key);
    } catch {
        return null;
    }
};

const write = (storage: Storage, key: string, value: string) => {
    try {
        storage.setItem(key, value);
    } catch {
        // Ignore storage write errors (private mode/quota issues)
    }
};

const remove = (storage: Storage, key: string) => {
    try {
        storage.removeItem(key);
    } catch {
        // Ignore storage remove errors
    }
};

const normalizeRole = (value: string | null): PersistedRole | null => {
    if (value === 'driver' || value === 'passenger') {
        return value;
    }
    return null;
};

export const authStorage = {
    getToken(): string | null {
        if (!hasWindow()) return null;

        const sessionToken = read(window.sessionStorage, AUTH_TOKEN_KEY);
        if (sessionToken) {
            return sessionToken;
        }

        // Backward-compatible migration from localStorage to sessionStorage.
        const legacyToken = read(window.localStorage, AUTH_TOKEN_KEY);
        if (legacyToken) {
            write(window.sessionStorage, AUTH_TOKEN_KEY, legacyToken);
            remove(window.localStorage, AUTH_TOKEN_KEY);
        }
        return legacyToken;
    },

    setToken(token: string) {
        if (!hasWindow()) return;
        write(window.sessionStorage, AUTH_TOKEN_KEY, token);
        remove(window.localStorage, AUTH_TOKEN_KEY);
    },

    clearToken() {
        if (!hasWindow()) return;
        remove(window.sessionStorage, AUTH_TOKEN_KEY);
        remove(window.localStorage, AUTH_TOKEN_KEY);
    },

    getRole(): PersistedRole | null {
        if (!hasWindow()) return null;

        const sessionRole = normalizeRole(read(window.sessionStorage, ROLE_KEY));
        if (sessionRole) {
            return sessionRole;
        }

        // Backward-compatible migration from localStorage to sessionStorage.
        const legacyRole = normalizeRole(read(window.localStorage, ROLE_KEY));
        if (legacyRole) {
            write(window.sessionStorage, ROLE_KEY, legacyRole);
            remove(window.localStorage, ROLE_KEY);
        }
        return legacyRole;
    },

    setRole(role: PersistedRole) {
        if (!hasWindow()) return;
        write(window.sessionStorage, ROLE_KEY, role);
        remove(window.localStorage, ROLE_KEY);
    },

    clearRole() {
        if (!hasWindow()) return;
        remove(window.sessionStorage, ROLE_KEY);
        remove(window.localStorage, ROLE_KEY);
    },

    clearSession() {
        this.clearToken();
        this.clearRole();
    },
};
