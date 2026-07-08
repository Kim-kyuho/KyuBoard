# 인증과 권한

## 현재 유저 가져오기

세션 쿠키에서 user ID를 복원하고 DB에서 유저 정보를 조회한다.

```ts
export async function getCurrentUserFromRequest(request: NextRequest) {
  const userId = getUserIdFromSessionToken(
    request.cookies.get(sessionCookieName)?.value,
  );

  if (!userId) {
    return null;
  }

  const users = await db
    .select({ id, email, isApproved, role })
    .from(db_users)
    .where(eq(db_users.id, userId))
    .limit(1);

  return users[0] ?? null;
}
```

## 권한 메시지

```ts
export function getCardPermissionMessage(
  user: Awaited<ReturnType<typeof getCurrentUserFromRequest>>,
) {
  if (!user) {
    return "Please sign in before editing cards.";
  }

  if (!user.isApproved) {
    return "Your account is waiting for administrator approval.";
  }

  return null;
}
```

## 세션 토큰

토큰 구조:

```txt
userId.signature
```

서명 생성:

```ts
function signUserId(userId: number) {
  return createHmac("sha256", getSessionSecret())
    .update(String(userId))
    .digest("hex");
}
```

서명 검증:

```ts
function isValidSign(signature: string, expectedSignature: string) {
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer);
}
```

## 쿠키 설정

```ts
response.cookies.set(sessionCookieName, createSessionToken(user.id), {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
});
```

규보드 적용 위치:

- `lib/auth/session.ts`
- `lib/auth/current-user.ts`
- `lib/auth/password.ts`
- `app/api/signin/route.ts`
- `app/api/signout/route.ts`
