# SignUpModal 상세설계

소스: `components/SignUpModal.tsx`

## Props

| Prop | 타입 | 사용처 |
| --- | --- | --- |
| `onClose` | `() => void` | 오버레이(64줄), X 버튼(74줄), Cancel(167줄), 가입 성공 시(51줄) |

`SignInModal`과 달리 `onSignIn` 같은 콜백이 없다 — 가입 성공 후 자동 로그인은 하지 않는다.

## State

| State | 초기값 | 갱신 지점 | 소비 지점 |
| --- | --- | --- | --- |
| `errorMessages` | `{ email: "", password: "" }` (13~16줄) | 클라이언트 검증 실패 시(95~101줄) 또는 서버 실패 시(37~43줄) | 하단 에러 문구 블록(156~161줄) |
| `errorFields` | `{ email: false, password: false, confirmPassword: false }` (17~21줄) | 클라이언트 검증마다 3필드 모두 갱신(103~107줄), 서버 실패 시 email만 true·나머지 false(44~48줄) | 각 input의 `inputClassName(hasError)`가 rose 테두리/배경 적용 여부 결정 |

## 클라이언트 검증 (폼 `onSubmit`, 82~120줄)

| 검사 | 조건 |
| --- | --- |
| `emailInvalid` | `!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)` |
| `passwordInvalid` | `길이 < 10` 또는 영문자 없음 또는 숫자 없음 |
| `confirmPasswordInvalid` | `password !== confirmPassword` |

셋 중 하나라도 실패하면 `errorFields`를 갱신하고 `errorMessages`에 문구를 채운 뒤 **`handleSignUp`을 호출하지 않고 종료**(111줄). 모두 통과하면 에러를 비우고 `handleSignUp(email, password)` 호출 — **`confirmPassword`는 클라이언트 검증에만 쓰이고 서버로는 전송되지 않는다**(23~33줄 body에 없음).

## 핸들러: `handleSignUp(email, password)` (23~52줄)

1. `POST /api/signup` with `{ email, password }`
2. `!response.ok` → JSON 파싱 후 `data.error === "Email already exists"`면 전용 문구, 아니면 일반 실패 문구를 `errorMessages.email`에 설정, `password` 메시지는 비움, `errorFields`는 `{email: true, password: false, confirmPassword: false}`로 재설정 후 종료
3. 성공 → `onClose()`만 호출(로그인 상태 전환 없음)

## `inputClassName(hasError)` (54~57줄)

공통 클래스에 `hasError`면 `border-rose-300 bg-rose-50`, 아니면 `border-neutral-300` 추가.

## 렌더 구조 / z-index (59~183줄)

| 요소 | z-index/조건 | 비고 |
| --- | --- | --- |
| 오버레이 (61줄) | 70 | 클릭 시 `onClose` |
| 패널 (66줄) | 80 | `w-[min(22rem,calc(100vw-2rem))]` — `SignInModal`과 동일 폭 |
| Email input (124줄) | - | `type="email"`, `autoComplete="email"` |
| Password input (134줄) | - | `type="password"`, `autoComplete="new-password"` |
| Confirm password input (144줄) | - | `type="password"`, `autoComplete="new-password"` |
| 안내 문구 (152줄) | 항상 | "비밀번호는 해시로 저장되어 관리자도 볼 수 없음" + "관리자 승인 1회 필요" 고지 |
| 에러 블록 (156줄) | `errorMessages.email \|\| errorMessages.password`가 truthy일 때만 | email/password 메시지를 각각 조건부로 표시 |
| 빈 `<div className="flex justify-end gap-2 pt-2">` (162줄) | 항상 | **내용 없이 렌더만 되는 빈 div** — 바로 다음 줄(163)에 실제 버튼을 담은 동일 클래스의 div가 또 있다 |
| Cancel/Sign-up 버튼 행 (163줄) | 항상 | 실제 버튼이 담긴 행 |

## 서버 계약 불일치 (검증됨, 실제 버그)

`app/api/signup/route.ts`는 실패 시 항상 `{ ok: false, message: "..." }`를 반환하고(이메일 중복이면 `message: "Email already exists"`, 27, 38, 51, 78줄), **`error` 필드는 어디에서도 반환하지 않는다.**

그런데 `SignUpModal.handleSignUp`(39줄)은 `data.error === "Email already exists"`를 검사한다 — `data.error`는 항상 `undefined`이므로 **이 조건은 절대 참이 될 수 없다.** 그 결과:
- 이메일이 이미 등록돼 있어도 사용자는 "This email address is already registered."를 절대 볼 수 없고, 매번 일반 문구 "This email address could not be registered."만 표시된다.
- 올바르게 고치려면 `data.error`를 `data.message`로 바꿔야 한다.

## 알려진 특이사항

- **162번째 줄의 `<div className="flex justify-end gap-2 pt-2"></div>`는 빈 채로 남아있는 중복/잔여 마크업이다.** 화면상 빈 flex 컨테이너 하나가 추가로 렌더되어 `pt-2` 만큼의 불필요한 여백이 버튼 행 위에 하나 더 생긴다(기능 오류는 아니지만 편집 중 지우다 만 코드로 보인다).
- 가입 성공 시 자동 로그인이 없으므로, 사용자는 가입 후 별도로 `SignInModal`을 다시 열어야 한다(관리자 승인 전에는 로그인해도 편집 권한이 없다는 것과는 별개의 흐름).
