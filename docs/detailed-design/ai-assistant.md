# AI 어시스턴트 상세설계

소스: `components/AiAssistantButton.tsx`, `components/AiChatPanel.tsx`, `components/GeminiIcon.tsx`, `hooks/useAiAssistant.ts`, `lib/ai/board-plan.ts`, `lib/ai/assistant.ts`

## 역할

자연어 요청을 받아 두 가지 일을 한다. 저장 여부는 두 경우 모두 사용자가 결정한다.

- **생성**: 메모, 표, Mermaid 카드를 임시 카드로 만들어 보드에 올린다. 이미지 카드는 만들지 않는다.
- **재배치**: 이미 보드에 있는 카드의 위치를 다시 잡는다. 내용은 바꾸지 않고 좌표만 바꾼다.

## AiAssistantButton

| Prop | 타입 | 사용처 |
| --- | --- | --- |
| `aiPanelOpen` | `boolean` | 아이콘 활성색(`#ec4899`)과 `aria-pressed` |
| `onToggle` | `() => void` | `useAiAssistant.handleToggleAiPanel` |

`fixed right-5 top-17`로 보드 메뉴 Ellipsis 버튼 바로 아래에 놓는다. `BoardMenu` 드롭다운이 같은 자리에 열리므로 z를 `50001`로 한 단계 올려 항상 드롭다운 위에 오게 한다. 렌더 순서에 기대면 JSX 위치가 바뀔 때 조용히 가려지므로 z로 명시한다.

lucide-react에는 Gemini 아이콘이 없어 `GeminiIcon`에 별 모양 심볼을 인라인 SVG로 둔다. `fill="currentColor"`라서 버튼의 text 색상을 따라간다.

## AiChatPanel

| Prop | 타입 | 사용처 |
| --- | --- | --- |
| `messages` | `AiChatMessage[]` | 말풍선 목록 |
| `sending` / `saving` | `boolean` | 입력 비활성화와 진행 표시 |
| `hasPendingCards` | `boolean` | Save/Discard 바 표시 조건 |
| `onSend` / `onSave` / `onDiscard` / `onClose` | 콜백 | 훅의 동일 이름 핸들러 |

- `fixed bottom-5 left-1/2 -translate-x-1/2`, 최대 높이 `60vh`.
- 로컬 state는 입력 초안 `draft` 하나다.
- `messages`나 `sending`이 바뀌면 목록을 맨 아래로 스크롤한다.
- 패널은 `.board-scroll-layer` 바깥에 렌더링되므로 카드 훅의 "빈 보드 클릭" 판정과 보드 패닝에 걸리지 않는다.

## `useAiAssistant` State

| State | 초기값 | 역할 |
| --- | --- | --- |
| `aiPanelOpen` | `false` | 채팅 패널 표시 |
| `aiStatus` | `null` | `null`은 미조회. `{available, message}` |
| `messages` | `[]` | 대화 기록. 서버에는 최근 20건만 보낸다 |
| `sending` / `saving` | `false` | 중복 요청 방지 |
| `pendingCards` | 빈 배열 3종 | 아직 저장하지 않은 AI 카드의 임시 ID |

카드 컬렉션은 소유하지 않는다. `useBoardMemos`/`useBoardMermaids`/`useBoardTables`의 setter와 insert 핸들러를 주입받아 쓴다.

## API 키

키는 사용자가 등록하지 않는다. 서버 환경변수 `AI_API_KEY` 하나를 쓰며, 배포 환경에서는 Vercel 프로젝트 설정에 넣는다. 키는 서버에만 존재하고 클라이언트로 내려가지 않는다.

호출 비용이 서버 소유자에게 청구되므로 접근 게이트가 곧 비용 통제 수단이다. 채팅은 카드 편집과 같은 조건, 즉 로그인과 관리자 승인을 요구한다.

## 진입 판정 (`handleToggleAiPanel`)

1. 이미 열려 있으면 닫는다.
2. `canEditCard`가 false면 `showPermissionMessage()`로 거부한다.
3. `aiStatus`가 없으면 `GET /api/ai/status`로 한 번 조회한다.
4. 쓸 수 없으면 그 이유를 권한 메시지로 띄우고, 쓸 수 있으면 채팅 패널을 연다.

## 배치 원점

- 생성(`getPlanOrigin`): 기존 카드들의 오른쪽 끝 최댓값 + `newColumnGap`(120)을 x로 잡아 새 열이 기존 카드와 겹치지 않게 한다. y는 현재 보이는 화면 상단 + 80이다.
- 재배치: 보드 전체를 다시 정리하므로 항상 보드 왼쪽 위(40, 40)에서 시작한다.

원점이 보드 밖을 가리켜도 `placeItems`가 보드 안으로 잘라 넣는다. 배치 후에는 첫 메모 위치로 `scrollTo`한다.

## 배치 방식 (`placeItems`)

모델이 `layout` 필드로 세 가지 중 하나를 고른다. 생략하면 `column`이다. 좌표는 어떤 방식에서도 모델이 정하지 않는다.

| layout | 흐름 | 쓰는 상황 |
| --- | --- | --- |
| `column` | 세로로 쌓다가 열이 차면 옆 열로 | 처음부터 끝까지 한 줄기로 읽는 문서 |
| `grid` | 좌에서 우로 채우고 줄바꿈 | 서로 대등한 항목 나열 |
| `tree` | 깊이를 x축, 형제를 y축 | 상위-하위 구조가 있는 설계 |

`tree`는 각 섹션의 `parentIndex`로 상위 섹션을 가리킨다. **자기보다 앞선 인덱스만 부모로 인정**하므로 순환이 생길 수 없다. 앞을 가리키거나 자기 자신을 가리키면 최상위로 취급한다.

`tree`는 잎만 세로 자리를 소비하고 부모를 자식들의 가운데에 놓는다. 같은 깊이끼리 겹치면 아래로 밀어 분리한다. 덕분에 같은 섹션 수라도 `column`보다 세로를 덜 쓴다.

`grid`는 행 높이를 가장 큰 섹션에 맞춰 하나로 통일한다. 그래야 줄이 어긋나지 않고, 아래 줄 메모의 꼭짓점을 위 줄 첨부 카드가 덮지 않는다.

세 방식 모두 같은 두 불변식 위에서 동작한다.

- 가로 간격 `pitchX`가 (메모 폭 - 겹침 + 첨부 폭)보다 크다 → 첨부 카드가 옆 칸 메모에 닿지 않는다.
- `sectionGap > attachmentOverlap` → 첨부 카드가 위 칸 메모의 아래 꼭짓점에 닿지 않는다.

`tests/unit/ai-board-plan.test.ts`의 `layout modes`가 세 방식 각각에 대해 "카드 하나가 정확히 메모 하나에만 걸린다"와 "보드를 벗어나지 않는다"를 전수 검증한다.

## 보드 경계 (`placeItems`)

**카드를 보드 밖에 두지 않는다.** 한 열을 아래로 쌓다가 남은 높이가 부족하면 다음 열로 넘어가고, 열도 더 못 만들면 남은 섹션을 배치하지 않고 `droppedSections`로 돌려준다. 채팅 패널이 그 수를 사용자에게 알린다.

열 간격은 `가장 넓은 (메모 폭 - 겹침 + 첨부 폭) + columnGap`이다. 이 값이 첨부 카드의 오른쪽 끝보다 크므로 첨부 카드가 옆 열 메모의 꼭짓점에 닿지 않는다.

`getPlanCapacity(bounds)`는 보드에 들어갈 수 있는 섹션 수를 추정해 모델에게 상한으로 알려준다.

> 초기 구현에는 이 경계 처리가 없어 한 열로 계속 아래로만 쌓았고, 3840x2160 보드에서 카드가 y=3322까지 내려가 보드 밖에 배치되는 버그가 있었다. `tests/unit/ai-board-plan.test.ts`의 `layoutBoardPlan board bounds`가 이 회귀를 막는다.

## 재배치 (`layoutArrangement`)

모델은 좌표가 아니라 `layout`과 `{ memoId, parentIndex?, attachment?: { type, cardId } }` 목록만 낸다. 좌표는 생성과 같은 `placeItems`가 정하므로 컴파일 접점 규칙이 그대로 지켜진다.

- 카드 크기는 사용자가 조절해 둔 현재 값을 그대로 쓰고 좌표만 바꾼다.
- 존재하지 않는 ID, 중복 ID는 조용히 건너뛴다. 이때 밀리는 인덱스에 맞춰 `parentIndex`를 다시 매핑하고, 부모가 걸러졌으면 최상위로 올린다.
- 이미 저장된 카드를 움직이므로 이전 좌표를 `pendingMoves`에 남긴다. Discard를 누르면 원래 자리로 되돌린다.
- 저장 시에는 INSERT가 아니라 각 카드의 PATCH로 좌표만 갱신한다.

**재배치로 문서 순서는 바꿀 수 없다.** Markdown 컴파일이 메모를 `id ASC`(생성 순)로 정렬하기 때문에, 메모를 공간적으로 옮겨도 문서 순서는 그대로다. 재배치가 바꿀 수 있는 것은 표·다이어그램이 어느 메모에 붙는지와 보드 정돈 상태뿐이다.

## 보드 스냅샷

재배치 대상을 모델이 고르려면 현재 보드에 무엇이 있는지 알아야 한다. 클라이언트가 저장된 카드(양수 ID)만 골라 ID와 요약을 만들어 `POST /api/ai/chat`에 함께 보낸다. 메모 요약은 HTML 태그를 제거한 앞부분이다. 서버는 이 목록을 신뢰하지 않고 형태와 길이만 검사한 뒤 시스템 프롬프트에 붙인다.

## 임시 ID

`-Date.now()`에서 시작해 1씩 **증가**시킨다. 기존 카드 생성 흐름과 달리 여러 장을 한 번에 만들기 때문에 값이 겹치면 안 되고, 증가 방향이어야 저장 전에도 메모 탐색 순서가 문서 순서와 같다.

## 저장 (`handleSavePendingCards`)

메모를 계획 순서대로 하나씩 `await` 하며 INSERT한다. 메모의 serial ID 순서가 곧 Markdown 문서 순서이므로 병렬로 보내면 순서가 뒤섞인다. 메모를 모두 저장한 뒤 Mermaid, 표를 저장한다.

## 서버 계약

| 경로 | 동작 |
| --- | --- |
| `GET /api/ai/status` | 서버에 키가 설정됐는지와 이 사용자가 쓸 수 있는지. 키 값은 다루지 않는다 |
| `POST /api/ai/chat` | 권한 확인 → 키 존재 확인 → 스냅샷 검사 → 모델 호출(폴백 포함) → `plan` 또는 `arrangement` 반환 |

`POST /api/ai/chat`은 DB에 카드를 쓰지 않는다. 서버에 `AI_API_KEY`가 없거나 모든 모델이 혼잡하면 503으로 응답한다.

카드를 여러 장 만드는 응답은 20초를 넘기기도 해서 `export const maxDuration = 60`을 둔다. 기본 타임아웃으로는 배포 환경에서 잘린다.

## 모델 호출 (`lib/ai/assistant.ts`)

- 공급자는 Google Gemini(`@google/genai`)다.
- 모델은 `assistantModels` 순서대로 시도해 첫 성공을 쓴다. 기본 순서는 `gemini-3.6-flash` → `gemini-3.5-flash`다.
- `GEMINI_MODEL`을 지정하면 그 모델을 맨 앞에 두고, 나머지는 폴백으로 남긴다.
- 429·500·503·NOT_FOUND는 다음 모델로 넘어간다. 그 외 오류(잘못된 요청 등)는 재시도해도 같으므로 즉시 던진다.
- 모든 모델이 실패하면 `AssistantUnavailableError`를 던지고 라우트가 503과 안내 문구로 응답한다.
- 함수 선언은 `create_board_cards`(생성)와 `rearrange_board_cards`(재배치) 둘이고, 스키마는 `parametersJsonSchema`로 일반 JSON Schema를 그대로 넘긴다.
- 두 함수가 동시에 호출되면 재배치를 우선 처리한다.
- Gemini는 어시스턴트 역할을 `model`로 부르므로 `toGeminiContents`가 역할 이름을 변환한다.
- 함수 호출이 없으면 계획 없이 답변만 반환한다.
- 함수 인자는 `boardPlanSchema`로 다시 검증한다. JSON Schema를 통과해도 모델 출력은 신뢰하지 않는다.

## 알려진 특이사항

- 대화 기록은 컴포넌트 state에만 있고 저장하지 않는다. 새로고침하면 사라진다.
- 새 계획이 오면 이전 미저장 카드를 먼저 걷어낸다. 한 번에 하나의 제안만 보드에 남는다.
- `isValidApiKeyFormat`은 접두사를 고정하지 않는다. Google이 키 형식을 `AIza...`에서 `AQ....`로 전환하는 중이라, 접두사를 하드코딩하면 정상 키가 거부된다. 형식 검사는 오타를 거르는 사전 필터일 뿐이고 진짜 관문은 `models.list()` 호출이다.
- 저장 도중 일부 INSERT가 실패하면 성공한 카드는 남는다. 실패 메시지는 각 컬렉션 훅이 표시한다.
- 호출 횟수 제한이 없다. 승인된 사용자가 여러 명이 되면 요청 제한을 함께 검토해야 한다.
- 최신 모델일수록 503(과부하)이 잦다. 기본값을 최신으로 올릴 때는 폴백 목록도 함께 확인한다.
