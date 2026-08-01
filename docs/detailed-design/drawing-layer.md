# DrawingLayer 상세설계

소스: `components/DrawingLayer.tsx`, `hooks/useDrawingPointer.ts`, `lib/board-stroke.ts`

## 역할

보드 전체 크기의 SVG에 저장 획, 작성 중 획과 지우개 커서를 렌더링하고 pointer 입력을 보드 좌표로 변환한다.

## Props

| Props | 의미 |
| --- | --- |
| `strokes` | 저장·로컬 확정 획 |
| `drawingMode` | SVG 입력 활성 여부 |
| `drawingTool` | draw, pan, erase |
| `penColor`, `penWidth` | 현재 획 스타일 |
| `zoom` | 좌표와 지우개 반경 보정 |
| `onStrokeEnd` | 완료 획 전달 |
| `onErase` | 지우개 이동 구간 전달 |

## 렌더 구조

- 저장 획은 모두 SVG path다.
- 현재 획은 별도 path로 즉시 표시한다.
- 지우개는 흰 fill, neutral gray stroke의 circle이다.
- z-index는 `ACTIVE_CARD_Z - 1`.
- 모드 off SVG는 `pointerEvents="none"`.
- draw/erase는 `data-drawing-capture="true"`, touch-action none, crosshair.
- pan은 입력을 캡처하지 않는다.

## 포인터 상태

- `activePointerRef`: 현재 입력을 소유한 pointer ID.
- `activePointerTypeRef`: pen/touch/mouse 구분.
- `currentPointsRef`: state 갱신과 무관한 최신 획.
- `previousEraserPointRef`: 연속 지우개 구간 시작.
- `penContactRef`: 펜 접촉 중 터치 억제.

## 팜 리젝션

펜 down 시 접촉 상태를 켠다. 그동안 비펜 입력과 비주 터치를 무시한다. 터치 입력 도중 펜이 들어오면 기존 입력을 폐기한다. 펜 up/cancel 또는 hover 상태가 확인되면 접촉을 해제한다.

## 획 종료

draw는 2개 이상의 점만 부모에 전달한다. pressure가 없거나 buttons가 풀린 move도 획 종료로 처리한다. erase는 각 이동 구간에서 즉시 부모의 획 배열을 분할한다.

저장 획의 path는 중간 점을 quadratic control point로, 현재 점과 다음 점의 중점을 endpoint로 사용한다. 지우개는 각 획 점과 지우개 이동 선분 사이의 거리를 검사하고 남은 연속 점 구간을 별도 획으로 분리한다.
