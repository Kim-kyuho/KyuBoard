import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    createSessionToken,
    getUserIdFromSessionToken,
    sessionCookieName,
} from "@/lib/auth/session";

describe("session tokens", () => {
    const originalSecret = process.env.AUTH_SECRET;

    beforeEach(() => {
        process.env.AUTH_SECRET = "test-session-secret";
    });

    afterEach(() => {
        if (originalSecret === undefined) {
            delete process.env.AUTH_SECRET;
        } else {
            process.env.AUTH_SECRET = originalSecret;
        }
    });

    it("uses the expected cookie name and round-trips a user id", () => {
        const token = createSessionToken(42);

        expect(sessionCookieName).toBe("kyuboard_session");
        expect(getUserIdFromSessionToken(token)).toBe(42);
    });

    it.each([
        undefined,
        "",
        "not-a-token",
        "0.signature",
        "-1.signature",
        "1.invalid",
        "1.abc.extra",
    ])("rejects invalid token %s", (token) => {
        expect(getUserIdFromSessionToken(token)).toBeNull();
    });

    it("rejects a token signed with another secret", () => {
        const token = createSessionToken(7);
        process.env.AUTH_SECRET = "another-secret";

        expect(getUserIdFromSessionToken(token)).toBeNull();
    });

    it("requires AUTH_SECRET", () => {
        delete process.env.AUTH_SECRET;

        expect(() => createSessionToken(1)).toThrow("AUTH_SECRET is required");
    });
});
