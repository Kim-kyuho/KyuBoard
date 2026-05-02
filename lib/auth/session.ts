import { createHmac } from "crypto";

// 세션을 위한 라이브러리
export const sessionCookieName = "kyuboard_session";

// 세션 비밀키 GET
function getSessionSecret() {
    // 런타임 환경의 세션 비밀키(Vercel)를 체크, 개발환경에서만 로컬 기본값을 사용
    const sessionSecret =
        process.env.AUTH_SECRET ??
        (process.env.NODE_ENV === "development" ? "kyuboard-local-auth-secret" : undefined);

    if (!sessionSecret) {
        throw new Error("AUTH_SECRET is required");
    }

    return sessionSecret;
}

// 세션 쿠키용 서명 생성 - 유저 정보의 id를 HMAC-SHA256으로 계산한 서명값을 hex문자열로 출력
// 개인학습: SHA256(가공된 비밀키 + SHA256(가공된 비밀키 + userId))
function signUserId(userId: number) {
    return createHmac("sha256", getSessionSecret())
        .update(String(userId))
        .digest("hex");
}
// 세션 토큰을 생성
export function createSessionToken(userId: number) {
    return `${userId}.${signUserId(userId)}`;
}

// 토큰 정보를 통해 유저 정보의 id를 습득
export function getUserIdFromSessionToken(token: string | undefined) {
    if (!token) {
        return null;
    }

    const [rawUserId, signature] = token.split(".");
    const userId = Number(rawUserId);

    if (!Number.isInteger(userId) || !signature) {
        return null;
    }

    if (signature !== signUserId(userId)) {
        return null;
    }

    return userId;
}
