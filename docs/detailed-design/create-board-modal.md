# CreateBoardModal 상세설계

소스: `components/CreateBoardModal.tsx`

## 역할

보드 제목과 고정 크기 옵션을 입력받아 새 보드를 생성한다.

## Props

- `ownerId: string | null`: 현재 사용자 이메일.
- `onClose`: backdrop, 닫기, Cancel.
- `onCreated(boardId)`: 성공 후 BoardList가 새 보드로 이동.

## 검증과 요청

- 제목은 trim 후 비어 있으면 거부한다.
- 크기는 사전 정의된 가로형/세로형 1080p, 4K, 8K 계열 옵션만 허용한다.
- `POST /api/boards`에 title, width, height, ownerId를 전송한다.
- 실패 메시지는 내부 `BoardMessage type="error"`로 표시한다.

모달은 document.body Portal이며 backdrop 70, panel 80이다.

