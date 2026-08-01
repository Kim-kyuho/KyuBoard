# BoardClient 상세설계

소스: `components/BoardClient.tsx`

보드 화면의 클라이언트 루트 — 9개의 `useBoard*` 훅을 조립해 카드 컬렉션, 편집 상태, 인증, 검색, 드로잉, 줌, 패닝을 하나의 화면으로 연결한다. 이 컴포넌트 자신은 파생 state 1개(`isEditing`)를 제외하면 로컬 로직을 거의 갖지 않는 "배선(wiring)" 계층이다.

## Props (86~88줄)

| Prop | 타입 | 사용처 |
| --- | --- | --- |
| `currentBoard` | `{boardId, title, width, height}` | `boardWidth`/`boardHeight`, 각 훅의 `boardId` 인자, `BoardMenu.currentBoard` |
| `mappedImages` | `Image[]` | `useBoardImages.initialImages` |
| `mappedMemos` | `Memo[]` | `useBoardMemos.initialMemos` |
| `mappedMermaids` | `Mermaid[]` | `useBoardMermaids.initialMermaids` |
| `mappedTables` | `Table[]` | `useBoardTables.initialTables` |
| `mappedStrokes` | `BoardStroke[]` | `useBoardDrawing.initialStrokes` |

이 props는 서버 컴포넌트(`app/boards/[boardId]/page.tsx`)가 DB 행을 화면 모델로 매핑해 전달한 값이다 — 필드명이 "mapped"인 이유.

## 로컬 State/Ref (91~101줄)

| State/Ref | 초기값 | 갱신 지점 | 소비 지점 |
| --- | --- | --- | --- |
| `cardLocationRef` | `useRef(null)` | - | `.board-scroll-layer` DOM(357줄), 다수 훅(`useBoardImages`, `useBoardMermaids`, `useBoardTables`, `useBoardScroll`)에 공유 전달 — **보드 스크롤 컨테이너에 대한 단일 진실 공급원** |
| `menuOpen` | `false` | `BoardMenu` setter, `useBoardAuth.onSignOutComplete`(118줄) | `BoardMenu`, `BoardToolBar` |
| `markdownViewOpen` | `false` | Compile 메뉴 클릭(289줄) → true, `BoardMarkdownView.onClose` → false | `BoardMarkdownView` 렌더 조건 |
| `permissionMessage` | `""` | `showPermissionMessage()`(95~101줄), 각 훅의 `setPermissionMessage` 콜백, `main onClick`에서 초기화(352줄) | `BoardMessage type="permission"` |

`showPermissionMessage()` (95~101줄): `currentUser`가 있으면 "승인 대기 중" 문구, 없으면 "로그인 필요" 문구 — **로그인은 했지만 미승인 상태**와 **비로그인 상태**를 구분해서 안내한다.

## 조립하는 9개 훅과 그 경계

| 훅 | 소유하는 도메인 | BoardClient가 가져오는 것 |
| --- | --- | --- |
| `useBoardZoom` | `boardZoom` | 값과 setter, 여러 하위 컴포넌트/훅에 전파 |
| `useBoardAuth` | 로그인 모달 상태, `currentUser`, `canEditCard` | 인증 UI 상태 전부 + 권한 플래그 |
| `useBoardImages` | `images` 컬렉션, 업로드 파이프라인 | CRUD 핸들러 + `imageInputRef`(상세: `image-card.md`) |
| `useBoardMemos` | `memos` 컬렉션 | CRUD 핸들러 |
| `useBoardMemoFocus` | 포커스된 메모, 이전/다음 이동 | `memos`를 인자로 받아 파생 |
| `useBoardSearch` | 검색어/결과/인덱스 | `memos`, `focusMemoById`를 인자로 받음 |
| `useBoardMermaids` | `mermaids` 컬렉션 | CRUD 핸들러(상세: `mermaid-card.md`) |
| `useBoardTables` | `tables` 컬렉션 | CRUD 핸들러(상세: `table-card.md`) |
| `useBoardDrawing` | `strokes`, 그리기 모드/도구 | CRUD/토글 핸들러(상세: `drawing-tool-bar.md`) |
| `useBoardScroll` | 보드 패닝 | `isEditing`과 `cardLocationRef`를 넘겨받아 패닝 이벤트 핸들러 반환 |
| `useCardLayer` | 없음(4개 setter를 받아 z 갱신만 수행) | `handleCardLayer(type, id, "front"|"back")` |

## 파생 값: `isEditing` (247~251줄)

```
isEditing = editingMemoId !== null || editingImageId !== null || editingMermaidId !== null || editingTableId !== null
```

네 카드 타입의 "편집 중 ID"가 각 훅에 독립적으로 존재하고, 이 컴포넌트가 OR로 합쳐 하나의 편집 플래그를 만든다. **이 네 값이 동시에 여러 개 non-null이 되는 것을 막는 코드는 어디에도 없다** — 각 카드의 `onEditing` 호출 시점(더블클릭 등)이 겹치지 않는다는 UI상의 전제에 의존한다(기존 문서 63~65줄에서도 지적된 부분).

`isEditing`의 소비처:
- `useBoardScroll`에 `cardEditing`으로 전달(259줄) — 편집 중에는 보드 패닝 비활성
- `BoardToolBar`의 `cardEditing={isEditing || drawingMode}`(293줄) — 드로잉 모드도 동일하게 일반 툴바를 숨기는 조건에 포함

## 렌더 구조 / DOM 트리 (272~473줄)

```text
<input type="file" hidden>              (274줄, 이미지 업로드 트리거 대상)
<BoardMenu>                              (281줄)
<BoardToolBar>                           (292줄)
{drawingMode && <DrawingToolBar>}        (306줄)
{searchBarOpen && <BoardSearchPanel>}    (319줄)
{signInOpen && <SignInModal>}            (329줄)
{signUpOpen && <SignUpModal>}            (335줄)
{markdownViewOpen && <BoardMarkdownView>} (340줄)
<BoardMessage type="permission">         (346줄)
<BoardMessage type="memo">                (347줄)
<main onClick={메시지 초기화}>            (349줄)
  └ div.board-scroll-layer (pointer down/move/up → useBoardScroll)
      └ div.board-size-layer (폭/높이 = board * zoom, 스크롤 가능 영역 크기)
          └ div.kyu-board (실제 보드, transform: scale(zoom))
              ├ ImageCard[]   (385줄)
              ├ MemoCard[]    (402줄)
              ├ MermaidCard[] (422줄)
              ├ TableCard[]   (439줄)
              └ DrawingLayer  (456줄)
```

카드 배열의 **DOM 순서는 렌더 순서일 뿐 시각적 겹침과 무관** — 실제 쌓임 순서는 각 카드의 `z`(비편집 시) 또는 `ACTIVE_CARD_Z`(편집 시)가 결정한다.

### `.kyu-board`의 인라인 스타일 (370~384줄)
- `width/height`: 원본 `boardWidth/boardHeight`(줌 미적용), `transform: scale(boardZoom)`으로 시각적 축소/확대(레이아웃 크기는 그대로 두고 시각적으로만 스케일)
- 배경: `radial-gradient` 점 패턴(24px 격자) — 모눈 배경
- `cursor: boardPanning ? "grabbing" : "grab"` — 패닝 중 커서 피드백
- 텍스트 선택/콜아웃 비활성화(다른 여러 컴포넌트와 동일 패턴)

### 각 카드에 공통으로 전달되는 콜백 패턴
모든 카드 타입(Image/Memo/Mermaid/Table)이 동일한 형태로 연결된다:
- `isEditing={editing{Type}Id === item.id}` — 이 카드가 "그 타입의 편집 대상 ID"와 일치하는지
- `onEditing={() => setEditing{Type}Id(item.id)}` / `onEditingClear={() => setEditing{Type}Id(null)}`
- `onPermissionDenied={showPermissionMessage}` — 4종 카드 모두 동일한 함수 참조 공유
- `onBringToFront`/`onSendToBack={() => handleCardLayer("{type}", item.id, "front"|"back")}` — `useCardLayer` 단일 핸들러를 타입 문자열로 분기

`MemoCard`만 추가로 `isFocused`/`onFocus`/`onFocusClear`를 받는다(다른 카드 타입에는 "포커스" 개념이 없음).

### `DrawingLayer`의 `key` (457줄)

```
key={drawingMode ? "drawing-active" : "drawing-inactive"}
```

그리기 모드 on/off 전환마다 **컴포넌트를 강제로 언마운트·재마운트**시킨다 — `useDrawingPointer`의 포인터 소유권 Ref들이 모드 전환 시점에 남아있을 수 있는 상태를 리셋하기 위한 의도적 트릭(React state가 아니라 key 변경을 이용한 강제 리셋).

## 이벤트 배선

| 이벤트 | 위치 | 핸들러 |
| --- | --- | --- |
| 이미지 input `onChange` (279줄) | 숨김 `<input type="file">` | `handleUploadImage`(`useBoardImages`) |
| `.board-scroll-layer` pointerdown/move/up (359~361줄) | 보드 스크롤 컨테이너 | `handleBoardPanStart`/`Move`/`End`(`useBoardScroll`) |
| `<main>` onClick (351줄) | 전체 화면 배경 | `permissionMessage`/`memoMessage` 둘 다 초기화 — 어떤 배경 클릭이든 두 안내 메시지를 함께 지운다 |
| Compile 메뉴 (289줄) | `BoardMenu.onCompileMarkdown` | `setMarkdownViewOpen(true)` |

## 알려진 특이사항

- `BoardNavigator`가 291줄에서 주석 처리되어 렌더되지 않는다(상세: `board-navigator.md`) — 재활성화 시 `boardIds`라는, 현재 `BoardClient`에 전달되지 않는 prop이 추가로 필요하다(주석 코드가 참조하는 `boardIds` 변수는 현재 스코프에 존재하지 않는다 — 그대로 주석만 해제하면 컴파일 에러가 난다).
- 새 카드 타입을 추가하려면: ① props에 `mapped{Type}` 추가, ② 전용 `useBoard{Type}` 훅 작성, ③ `isEditing` 계산에 그 편집 ID 포함, ④ `<{Type}Card>` map 블록 추가, ⑤ `useCardLayer`의 setter 목록에 추가 — 다섯 지점을 함께 바꿔야 하며 그중 하나라도 빠지면 타입 에러 없이 조용히 기능이 누락될 수 있는 지점들이 있다(예: `isEditing` 계산 누락은 타입 체크로 못 잡음).
- `canEditCard`(`useBoardAuth`가 계산)가 5개 훅(`useBoardImages`, `useBoardMemos`, `useBoardMermaids`, `useBoardTables`, `useBoardDrawing`)에 각각 개별로 전달된다 — 권한 판정 로직 자체는 한 곳(`useBoardAuth`)에 있지만, 그 값을 쓰는 지점은 흩어져 있다.
