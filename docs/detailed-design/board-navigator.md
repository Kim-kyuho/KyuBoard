# BoardNavigator 상세설계

소스: `components/BoardNavigator.tsx`

## 사용 여부 (검증됨)

`components/BoardClient.tsx:291`에서 `{/* <BoardNavigator .../> */}`로 주석 처리돼 있어 **현재 화면에 렌더되지 않는다.** 코드는 살아있지만 데드 컴포넌트 상태.

## Props

| Prop | 타입 | 사용처 |
| --- | --- | --- |
| `currentBoardId` | `number` | `boardIds.indexOf(currentBoardId)`로 현재 위치 계산 (14줄) |
| `boardIds` | `number[]` | 이전/다음 보드 id 조회 (15~18줄) |
| `onInvalidBoard` | `() => void` | 이동 대상이 없을 때 호출 (22줄) — `BoardClient`의 주석에는 `setPermissionMessage("This board does not exist.")`가 연결되어 있었다 |

## State

없음 — `useRouter()`만 사용, 로컬 state 없음.

## 파생 값 (14~18줄)

| 값 | 계산 |
| --- | --- |
| `currentIndex` | `boardIds.indexOf(currentBoardId)` — 못 찾으면 `-1` |
| `prevBoardId` | `currentIndex > 0 ? boardIds[currentIndex - 1] : null` |
| `nextBoardId` | `currentIndex >= 0 && currentIndex < boardIds.length - 1 ? boardIds[currentIndex + 1] : null` |

## 핸들러: `moveBoard(boardId: number \| null)` (20~26줄)

- `boardId === null` → `onInvalidBoard()` 호출 후 종료
- 그 외 → `router.push(`/boards/${boardId}`)`

## 렌더 구조 (28~54줄)

| 요소 | 비고 |
| --- | --- |
| 루트 `div` (30줄) | `fixed right-5 top-5`, `z-50000` |
| `ChevronLeft` `PressableButton` (31줄) | `onClick={() => moveBoard(prevBoardId)}` |
| 중앙 `<input>` (37줄) | `defaultValue={currentIndex + 1}`, `inputMode="numeric"`, `maxLength={2}` — **비제어(uncontrolled)이며 onChange 핸들러가 없어 사용자가 입력해도 아무 동작도 하지 않는다** |
| `ChevronRight` `PressableButton` (45줄) | `onClick={() => moveBoard(nextBoardId)}` |

## 알려진 특이사항

- 데드 코드이자, 살아있다 해도 중앙 input이 표시 전용일 뿐 실제 라우팅 입력으로 연결되지 않은 미완성 상태다.
- 재활성화하려면 `BoardMenu`(우상단, 동일 `z-50000` 추정) 등 다른 우상단 고정 UI와의 레이아웃/z-index 충돌을 함께 검토해야 한다.
