# SignUpModal 상세설계

소스: `components/SignUpModal.tsx`

## 역할

가입 입력을 클라이언트에서 1차 검증하고 사용자 생성 API를 호출한다.

## 검증

- email: 공백/@/domain 기본 정규식.
- password: 10자 이상, 영문과 숫자 포함.
- confirm password: password와 일치.
- 오류 필드에는 rose border/background를 표시한다.

## 요청

`POST /api/signup`에 email/password를 전송한다. 실패 응답의 `error` 값이 Email already exists인지 구분해 이메일 메시지를 만든다. 성공하면 별도 로그인 없이 모달만 닫는다.

서버는 같은 검증을 다시 수행하고 scrypt hash, 미승인 user 역할로 저장한다.

