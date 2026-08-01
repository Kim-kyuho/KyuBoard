# BoardMenu 상세설계

소스: `components/BoardMenu.tsx`

## 역할

전 화면 공통 로고, 우상단 메뉴, 인증 진입점과 현재 보드의 Markdown 컴파일 명령을 제공한다.

## Props

| Props | 의미 |
| --- | --- |
| `menuOpen`, `setMenuOpen` | 메뉴 표시 상태 |
| `currentBoard?.title` | 보드 화면에서만 제목/Compile 표시 |
| `currentUser` | 이메일, 역할과 로그인 분기 |
| `setSignInOpen`, `setSignUpOpen` | 인증 모달 열기 |
| `onSignOut` | 로그아웃 |
| `onCompileMarkdown?` | Markdown 모달 열기 |

## 구조와 동작

- 좌상단 로고는 `/` 링크다.
- 우상단 Ellipsis 버튼이 메뉴를 토글한다.
- 보드 제목은 표시 전용 버튼이며 클릭 시 메뉴를 닫는다.
- Compile 버튼은 메뉴를 닫은 뒤 콜백을 호출한다.
- 로그인 상태는 role/email과 Sign-out을, 비로그인은 Sign-in/Sign-up을 표시한다.
- 고정 UI z-index는 50000이다.

## 모바일

로고 텍스트의 callout과 selection을 비활성화한다. 실제 버튼 피드백은 `PressableButton`이 처리한다.

