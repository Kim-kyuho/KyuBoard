# RenameBoardModal 상세설계

소스: `components/RenameBoardModal.tsx`

## 역할

선택 보드의 기존 제목을 초기값으로 제공하고 변경 결과를 부모 목록에 반영한다.

## Props

- `boardId`: PATCH 경로.
- `title`: input `defaultValue`.
- `onClose`: 모달 종료.
- `onRenamed(boardId, title)`: 성공 응답 전달.

`PATCH /api/boards/{boardId}`에 trim한 title과 boardId를 전송한다. 성공 시 API의 board ID와 title을 그대로 부모에 넘긴다. 위치와 레이어는 CreateBoardModal과 같다.

