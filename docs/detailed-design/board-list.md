# BoardList 상세설계

소스: `components/BoardList.tsx`, `hooks/useBoardList.ts`

## BoardList Props

| Prop | 타입 | 사용처 |
| --- | --- | --- |
| `boards` | `BoardListBoard[]` (`{boardId, title, width, height}`) | `useBoardList`의 `boardList` 초기값 |

## 로컬 State (BoardList.tsx)

| State | 초기값 | 갱신 지점 | 소비 지점 |
| --- | --- | --- | --- |
| `menuOpen` | `false` | `BoardMenu`가 setter로 조작, `useBoardAuth`의 `onSignOutComplete` 콜백에서도 `false`로 (28줄) | `BoardMenu`에 전달 |

인증 관련 state(`signInOpen`, `signUpOpen`, `currentUser` 등)는 `useBoardAuth`가, 목록/모달/삭제 관련 state는 `useBoardList`가 소유한다 — 이 컴포넌트 자신은 두 훅을 연결하는 조립 역할만 한다.

## `useBoardList` State (19~27줄)

| State | 초기값 | 갱신 지점 | 소비 지점 |
| --- | --- | --- | --- |
| `boardList` | `boards` | `handleBoardRenamed`(제목 교체), `handleDeleteBoard`(제거) | 목록 렌더 |
| `createBoardOpen` | `false` | `handleCreateBoardClick`(true, 관리자만), `handleBoardCreated`(false) | `CreateBoardModal` 렌더 조건 |
| `renameBoardOpen` | `false` | `BoardActionMenu`의 `onRename`(true), `handleBoardRenamed`(false) | `RenameBoardModal` 렌더 조건 |
| `boardListMessage` | `""` | 권한 거부 3곳(44, 68줄 등), 삭제 실패(97줄), main 클릭 시 초기화(BoardList.tsx 104~106줄) | `BoardMessage type="permission"` |
| `actionMenuOpen` | `false` | `openBoardActionMenu`(토글 로직, 74줄), 메뉴 바깥 클릭(30~34줄), `handleBoardClick`(false), `openDeleteDialog`(false) | `BoardActionMenu` 렌더 조건 |
| `selectedBoardId` | `null` | `openBoardActionMenu`, `handleDeleteBoard` 성공 후 `null`로 | 어느 카드의 액션 메뉴를 열지, 삭제 대상 판정 |
| `selectedBoardTitle` | `null` | `BoardList.tsx`의 `onRename` 콜백에서 `board.title`로 설정(174줄) | `RenameBoardModal`의 `title` prop |
| `deleteDialogOpen` | `false` | `openDeleteDialog`(true), `handleDeleteBoard`/`closeDeleteDialog`(false) | `ConfirmDialog` 렌더 조건 |
| `menuRef` | `useRef(null)` | - | 바깥 클릭 판정(31줄), `BoardActionMenu`의 `ref` prop으로 전달 |

## 바깥 클릭으로 액션 메뉴 닫기 (29~40줄)

전역 `pointerdown` 리스너: 클릭 대상이 `menuRef.current`(현재 열린 `BoardActionMenu`의 DOM) 안이 아니면 `setActionMenuOpen(false)`. `useEffect` 의존성 배열이 빈 배열이라 컴포넌트 생애 동안 한 번만 등록된다.

## 핸들러

| 함수 | 동작 |
| --- | --- |
| `handleCreateBoardClick` (42~50줄) | `currentUser?.role !== "admin"`이면 메시지 설정 후 종료, 관리자면 메시지 초기화 + `createBoardOpen = true` |
| `handleBoardRenamed(boardId, title)` (52~60줄) | 모달 닫고 `boardList`에서 해당 `boardId`의 `title`만 교체(불변 업데이트) |
| `handleBoardCreated(boardId)` (62~65줄) | 모달 닫고 `router.push(/boards/{boardId})`로 즉시 이동 — `boardList`에 새 항목을 추가하지 않는다(목록 화면으로 안 돌아오고 바로 이동하므로 로컬 상태 불일치가 드러나지 않음) |
| `openBoardActionMenu(boardId)` (66~75줄) | 관리자 아니면 메시지 후 종료. 관리자면 `selectedBoardId`를 그 id로 설정하고, **이미 같은 보드가 선택돼 있었다면 토글, 다른 보드였다면 무조건 true**(74줄) — 즉 A메뉴가 열린 상태에서 B의 점3개를 누르면 바로 B메뉴로 전환된다 |
| `handleBoardClick` (77~79줄) | `Link` 클릭 시 액션 메뉴 닫기(카드 이동 전 메뉴 정리) |
| `openDeleteDialog` (81~84줄) | 액션 메뉴 닫고 삭제 확인 다이얼로그 열기 |
| `handleDeleteBoard` (86~106줄) | `selectedBoardId === null`이면 종료. `DELETE /api/boards/{id}` → 실패 시 메시지 설정 + 다이얼로그만 닫음(선택 상태는 유지) → 성공 시 목록에서 제거 + 다이얼로그 닫기 + `selectedBoardId = null` + **`router.refresh()`로 서버 컴포넌트 데이터 재검증** |
| `closeDeleteDialog` | `deleteDialogOpen = false` |

## BoardList 렌더 구조 (58~210줄)

| 요소 | 조건 | 비고 |
| --- | --- | --- |
| `BoardMenu` (60줄) | 항상 | 로그인/메뉴 상태 표시 |
| `SignInModal`/`SignUpModal` (69, 76줄) | 각 open state | - |
| `CreateBoardModal` (82줄) | `createBoardOpen` | `ownerId={currentUser?.email ?? null}` |
| `RenameBoardModal` (90줄) | `renameBoardOpen && selectedBoardId !== null && selectedBoardTitle !== null` | 세 조건 모두 충족해야 렌더 |
| `BoardMessage type="permission"` (99줄) | `boardListMessage` truthy | - |
| `<main>` (101줄) | 항상 | `onClick`: `boardListMessage`가 있으면 지움(배경 클릭으로 알림 닫기) |
| 보드 카드 반복 (111줄) | `boardList` 각 항목 | 아래 상세 |
| "New Board" 버튼 (184줄) | 항상(관리자 여부와 무관하게 항상 노출, 클릭 시 `handleCreateBoardClick`이 권한 검사) | - |
| `ConfirmDialog` (201줄) | `deleteDialogOpen` | 메시지 "Delete this board and all memos?" |

### 보드 카드 내부 (112~180줄)

- `Link`(122줄)로 카드 전체가 클릭 가능, `onClick={handleBoardClick}`으로 메뉴 닫기
- 미리보기(130줄): `<iframe src="/boards/{id}" sandbox="" style={{width:1920px, height:1080px, transform:"scale(0.5)"}}>` — **실제 보드 페이지를 1920x1080으로 통째로 로드한 뒤 절반 축소해 썸네일처럼 사용**(`sandbox=""`로 스크립트/폼 등 모든 권한 차단, `pointerEvents:"none"` + 위에 겹친 빈 `div`로 클릭이 iframe에 전달되지 않게 이중 차단)
- 점3개 버튼(153줄): `onPointerDown`과 `onClick` 양쪽에서 `preventDefault`+`stopPropagation` — 부모 `Link`로의 이벤트 전파와 기본 동작(포커스 이동 등)을 모두 차단한 뒤 `openBoardActionMenu(board.boardId)` 호출
- `BoardActionMenu`(169줄): `actionMenuOpen && selectedBoardId === board.boardId`일 때만, 즉 한 번에 하나의 카드에만 렌더

## 알려진 특이사항

- 보드 미리보기가 실제 페이지를 iframe으로 통째로 로드하는 방식이라, 보드 수가 많은 목록 화면에서는 각 카드마다 `/boards/[boardId]` 전체를 다시 렌더링하는 비용(DB 조회 포함)이 발생한다 — 저비용 정적 썸네일이 아니다.
- `handleBoardCreated`가 목록에 새 보드를 추가하지 않고 바로 이동하므로, 뒤로가기로 목록에 돌아오면 서버 재조회(Next 라우팅) 전까지 새 보드가 안 보일 가능성이 있다(실제 여부는 Next.js 캐싱 정책에 따라 달라짐).
- 삭제 실패 시 `selectedBoardId`를 초기화하지 않는다 — 다이얼로그만 닫히고 어떤 보드가 "선택됨" 상태인지는 내부적으로 남아있다(사용자가 바로 다시 점3개를 눌러도 `openBoardActionMenu`가 새로 `selectedBoardId`를 설정하므로 눈에 띄는 부작용은 없음).
