# BoardList 상세설계

소스: `components/BoardList.tsx`

## 역할

보드 목록 화면의 클라이언트 루트다. 인증 UI, 목록 상태, 생성/이름 변경/삭제 모달과 보드 미리보기를 조정한다.

## 입력과 상태

- 입력 `boards`: 서버에서 조회한 `boardId`, title, width, height 배열.
- 인증: `useBoardAuth`.
- 목록 CRUD와 선택 상태: `useBoardList`.
- 각 보드의 action menu는 전역 `selectedBoardId`와 해당 ID 비교로 하나만 표시한다.

## 보드 항목

- 전체 항목은 `/boards/{boardId}` Link다.
- 미리보기는 sandbox 권한이 없는 iframe을 1920 x 1080으로 열고 scale 0.5를 적용한다.
- iframe은 `pointerEvents: none`이며 투명 overlay가 입력을 차단한다.
- 제목은 한 줄 truncate한다.
- 우상단 Ellipsis는 Link 이벤트와 분리해 개별 메뉴를 연다.

## 권한

- 새 보드, rename, delete는 client에서 admin 역할을 먼저 검사한다.
- 실패 메시지는 `BoardMessage`로 표시한다.
- 서버 API에서도 같은 권한을 재검증한다.

## 삭제

1. BoardActionMenu에서 다이얼로그를 연다.
2. 확인 시 `DELETE /api/boards/{id}`.
3. 성공하면 로컬 목록에서 제거하고 `router.refresh()`.

