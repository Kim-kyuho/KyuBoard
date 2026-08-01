# DrawingToolBar 상세설계

소스: `components/DrawingToolBar.tsx`, `hooks/useBoardDrawing.ts`

## 역할

드로잉 undo, 색상, 굵기, 지우개, 패닝, 완료 명령을 CardToolPortal에 표시한다.

## 상태와 도구

- 로컬 UI 상태: 색상 메뉴, 굵기 메뉴.
- 도메인 상태: `useBoardDrawing`의 drawingTool, penColor, penWidth.
- erase와 pan은 같은 버튼을 다시 누르면 draw로 돌아간다.
- 활성 도구 아이콘은 pink 색으로 표시한다.
- 색상과 굵기 메뉴는 버튼 왼쪽에 열린다.

## 저장 시점

`useBoardDrawing`은 획 추가, 지우기, undo 때 `unsavedRef`를 설정한다. 완료 버튼이 drawing mode를 끌 때 변경된 경우에만 `PATCH /api/drawings/{boardId}`를 호출한다.

드로잉 진입은 승인 사용자인지 확인한다. 종료 시 도구는 draw로 초기화된다.

