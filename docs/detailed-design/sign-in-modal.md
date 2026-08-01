# SignInModal 상세설계

소스: `components/SignInModal.tsx`

## 역할

이메일과 비밀번호를 받아 세션 로그인을 수행하고 현재 사용자 상태를 부모에 전달한다.

## 흐름

1. FormData에서 email/password를 읽는다.
2. `POST /api/signin`.
3. 실패 시 API message를 내부 오류로 표시한다.
4. 성공 시 `onSignIn(data.user)` 후 닫는다.

input은 email/current-password autocomplete를 사용한다. 모달은 body Portal, backdrop 70, panel 80이다.

