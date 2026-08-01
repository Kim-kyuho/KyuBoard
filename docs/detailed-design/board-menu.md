# BoardMenu 상세설계

소스: `components/BoardMenu.tsx`

## Props

| Prop | 타입 | 사용처 |
| --- | --- | --- |
| `menuOpen` | `boolean` | 드롭다운 표시 조건 (54줄) |
| `currentBoard` | `{ title: string } \| undefined` | `currentBoard?.title`이 있을 때만 제목/Compile 항목 노출 (56줄) |
| `setMenuOpen` | `Dispatch<SetStateAction<boolean>>` | Ellipsis 버튼 토글(51줄), 보드 제목 클릭(60줄), Compile 클릭(69줄), Sign-in/Sign-up 클릭(96, 104줄)에서 `false`로 닫기 |
| `setSignInOpen` | `Dispatch<SetStateAction<boolean>>` | Sign-in 버튼 클릭 시 `true` (97줄) |
| `setSignUpOpen` | `Dispatch<SetStateAction<boolean>>` | Sign-up 버튼 클릭 시 `true` (105줄) |
| `currentUser` | `CurrentUser \| null` | 로그인/비로그인 분기 (77줄) |
| `onSignOut` | `() => void` | "Sign-out" 버튼 `onClick` (87줄) |
| `onCompileMarkdown` | `(() => void) \| undefined` | "Compile to Markdown" 클릭 시 `setMenuOpen(false)` 후 옵셔널 체이닝으로 호출 (70줄) |

## State

없음 — `menuOpen`을 포함한 모든 상태는 부모(`BoardClient`)가 소유하고, 이 컴포넌트는 setter만 받아 조작한다.

## 렌더 구조 (33~115줄)

| 요소 | 조건 | 비고 |
| --- | --- | --- |
| 로고 `Link` "•kyu.board" (36줄) | 항상 | `href="/"`, `fixed left-5 top-5`, `z-50000`, 터치 콜아웃/선택 비활성화 |
| Ellipsis 토글 버튼 (49줄) | 항상 | `fixed right-5 top-5`, `z-50000`, 클릭 시 `setMenuOpen(prev => !prev)` |
| 드롭다운 패널 (55줄) | `menuOpen`이 true일 때만 | `fixed right-5 top-17`, `z-50000` |
| 보드 제목 항목 (58줄) | `currentBoard?.title`이 있을 때만 | 클릭해도 콜백 없이 메뉴만 닫힘(표시 전용) |
| "Compile to Markdown" 항목 (65줄) | `currentBoard?.title`이 있을 때만 | 메뉴 닫고 `onCompileMarkdown?.()` |
| 로그인 정보 블록 (78줄) | `currentUser`가 truthy | `[{role}]`과 이메일 표시, "Sign-out" 버튼 |
| Sign-in/Sign-up 블록 (92줄) | `currentUser`가 falsy | 두 버튼 각각 메뉴를 닫고 대응 모달 오픈 상태를 true로 |

## 알려진 특이사항

- 보드 제목 항목(58~64줄)은 클릭 이벤트가 있지만 실질 동작은 "메뉴 닫기"뿐이다 — 시각적으로는 버튼이라 클릭 가능해 보이지만 표시 그 이상의 기능이 없다.
- `onCompileMarkdown`이 없는 화면(보드 목록 등)에서도 `currentBoard?.title`만 있으면 Compile 항목이 노출될 수 있는 구조이나, 실제로는 두 조건이 항상 같이 전달되는지는 호출자(`BoardClient`) 쪽 구현에 달려 있다.
