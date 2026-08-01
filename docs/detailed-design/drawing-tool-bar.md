# DrawingToolBar 상세설계

소스: `components/DrawingToolBar.tsx`, `hooks/useBoardDrawing.ts`, `lib/board-stroke.ts`

## DrawingToolBar Props

| Prop | 타입 | 사용처 |
| --- | --- | --- |
| `drawingTool` | `DrawingTool` | 지우개/팬 버튼의 `aria-pressed`·아이콘 색(108~127줄) |
| `penColor` | `string` | Palette 아이콘 색(69줄) |
| `penWidth` | `number` | 굵기 아이콘의 `strokeWidth`(90줄) |
| `onChangeColor` | `(color: string) => void` | 색상 선택 시(48줄) |
| `onChangeWidth` | `(width: number) => void` | 굵기 선택 시(53줄) |
| `onTogglePan` | `() => void` | Pan 버튼 클릭(123줄) |
| `onToggleErase` | `() => void` | Erase 버튼 클릭(112줄) |
| `onUndo` | `() => void` | Undo 버튼 클릭(64줄) |
| `onDone` | `() => void` | Check(완료) 버튼 클릭(130줄) |

## State (34~35줄)

| State | 초기값 | 갱신 지점 | 소비 지점 |
| --- | --- | --- | --- |
| `openColorMenu` | `false` | `toggleColorMenu`(37~40줄), 색상 선택 후 `handleColorSelect`가 `false`로(49줄) | 색상 팔레트 팝업 렌더 조건(71줄) |
| `openWidthMenu` | `false` | `toggleWidthMenu`(42~45줄), 굵기 선택 후 `handleWidthSelect`가 `false`로(54줄) | 굵기 팝업 렌더 조건(92줄) |

두 메뉴는 상호 배타적이다 — 하나를 열면(`toggleColorMenu`/`toggleWidthMenu`) 다른 하나를 항상 `false`로 닫는다(38~39, 43~44줄).

## 핸들러

| 함수 | 동작 |
| --- | --- |
| `toggleColorMenu` | `openColorMenu` 토글 + `openWidthMenu` 강제 닫기 |
| `toggleWidthMenu` | `openWidthMenu` 토글 + `openColorMenu` 강제 닫기 |
| `handleColorSelect(color)` | `onChangeColor(color)` 호출 후 메뉴 닫기 |
| `handleWidthSelect(width)` | `onChangeWidth(width)` 호출 후 메뉴 닫기 |
| `closeMenus()` | 두 메뉴 모두 닫기 — Erase/Pan 버튼 클릭 시 먼저 호출(111, 122줄) |

## 렌더 구조 (62~134줄)

| 요소 | 조건 | 비고 |
| --- | --- | --- |
| Undo (64줄) | 항상 | 클릭 즉시 `onUndo()`, 활성/비활성 조건 없음(스택이 비어도 버튼은 항상 눌림 가능 — 실제 무동작 처리는 `useBoardDrawing.handleUndoStroke`가 담당) |
| Pen color (68줄) | 항상 | 팔레트 아이콘 색을 `penColor`로 동적 지정 |
| 색상 팝업 (71줄) | `openColorMenu`일 때만 | `lib/board-stroke.ts`의 `penColors`(5색: Ink/Red/Blue/Green/Purple) 순회, 원형 스와치 버튼 |
| Pen width (89줄) | 항상 | `Minus` 아이콘의 `strokeWidth`로 현재 굵기 시각화 |
| 굵기 팝업 (92줄) | `openWidthMenu`일 때만 | `penWidths`(Thin 2 / Medium 4 / Bold 8) 순회 |
| Erase (107줄) | 항상, `aria-pressed={drawingTool==="erase"}` | 라벨이 상태에 따라 "Erase" ↔ "Stop erasing"으로 바뀜, 활성 시 아이콘이 `#ec4899`(activeToolColor) |
| Pan (118줄) | 항상, `aria-pressed={drawingTool==="pan"}` | 라벨 "Pan the board" ↔ "Stop panning", 활성 시 동일 강조색 |
| Finish drawing (129줄) | 항상 | `Check` 아이콘, `onDone()` |

## 도구 상태 소유자: `useBoardDrawing` (`hooks/useBoardDrawing.ts`)

이 컴포넌트 자신은 `drawingTool`/`penColor`/`penWidth`를 소유하지 않는다 — 실제 소유자는 부모가 사용하는 `useBoardDrawing`이다.

| State | 초기값 | 비고 |
| --- | --- | --- |
| `strokes` | `initialStrokes` | 확정된 획 배열 |
| `drawingMode` | `false` | 그리기 레이어 입력 활성 여부 |
| `drawingTool` | `"draw"` | `"draw" \| "pan" \| "erase"` |
| `penColor` | `defaultPenColor` ("Ink" `#1f2937`) | - |
| `penWidth` | `defaultPenWidth` (Medium, 4) | - |
| `unsavedRef` | `false` | 획 추가/지우기/undo 시 `true`로 표시(저장 필요 플래그) |

### `handleToggleDrawingMode` (50~70줄)
- 이미 그리기 모드 → 모드 종료 + `drawingTool`을 `"draw"`로 리셋 + `unsavedRef`가 true면 `saveStrokes(strokes)`(`PATCH /api/drawings/{boardId}`) 호출 후 플래그 초기화
- 아니면 → `canEditCard`가 false면 `showPermissionMessage()`로 거부, true면 모드 진입 + 도구를 `"draw"`로 리셋

### `toggleDrawingTool(tool)` (72~74줄)
같은 도구를 다시 누르면 `"draw"`로 되돌아가는 **토글** 방식 — `handleTogglePanTool`/`handleToggleEraseTool`이 이를 감쌈.

### `handleStrokeEnd`/`handleErase`/`handleUndoStroke` (76~112줄)
셋 다 상태 변경 성공 시 `unsavedRef.current = true`로 표시. `handleErase`는 `eraseStrokesAlongPath`가 참조 동일 배열을 반환하면(실제로 지워진 게 없으면) 플래그를 세우지 않는다(97~99줄).

## 알려진 특이사항

- 저장은 "완료" 버튼(모드 종료) 시점에만 일어난다 — 그리는 도중에는 서버에 반영되지 않으므로, 그리기 모드에서 벗어나지 않고 새로고침하면 미저장 획을 잃는다.
- Undo 버튼은 항상 클릭 가능하게 렌더되며(disabled 처리 없음) 빈 스택에서는 `handleUndoStroke`가 조용히 아무 것도 하지 않는다 — 사용자에게 "더 이상 undo할 게 없다"는 피드백이 없다.
