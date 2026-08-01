# BoardClient 상세설계

소스: `components/BoardClient.tsx`

## 역할

보드 화면의 조정 허브다. 서버에서 받은 보드·카드·드로잉 데이터를 전용 훅에 분배하고, 화면 전역 상태와 컴포넌트 간 콜백을 연결한다.

## 입력

| Props | 형식 | 의미 |
| --- | --- | --- |
| `currentBoard` | boardId, title, width, height | 현재 보드 |
| `mappedImages` | Image[] | 초기 이미지 |
| `mappedMemos` | Memo[] | 초기 메모 |
| `mappedMermaids` | Mermaid[] | 초기 Mermaid |
| `mappedTables` | Table[] | 초기 표 |
| `mappedStrokes` | BoardStroke[] | 초기 획 |

## 내부 상태와 Ref

- `cardLocationRef`: 실제 `.board-scroll-layer` DIV. 중앙 배치와 스크롤 훅의 공통 기준이다.
- `menuOpen`, `markdownViewOpen`: 전역 메뉴와 Markdown 모달 표시.
- `permissionMessage`: 권한/API 오류 메시지.
- 각 카드 컬렉션과 편집 ID는 board hook에서 받는다.
- `isEditing`: 네 카드 편집 ID 중 하나라도 존재하는지 계산한다.

## DOM 구조

```text
hidden image input
fixed menus/modals/messages
main
└── .board-scroll-layer
    └── .board-size-layer
        └── .kyu-board
            ├── ImageCard[]
            ├── MemoCard[]
            ├── MermaidCard[]
            ├── TableCard[]
            └── DrawingLayer
```

카드 렌더 배열 순서는 DOM 순서일 뿐 실제 겹침은 각 카드의 `z`가 결정한다.

## 주요 흐름

1. `useBoardAuth` 결과로 `canEditCard`를 만든다.
2. 각 board hook이 초기 배열을 로컬 컬렉션으로 소유한다.
3. 카드에는 해당 ID의 편집 여부와 CRUD 콜백을 전달한다.
4. `useCardLayer` 응답은 네 컬렉션의 z를 동시에 갱신한다.
5. 드로잉 모드 또는 카드 편집 중에는 일반 BoardToolBar 도구를 숨긴다.
6. DrawingLayer는 모드별 key로 재마운트해 남은 포인터 상태를 제거한다.

## 이벤트

- `.board-scroll-layer`: pointer down/move/up을 `useBoardScroll`에 전달한다.
- `main.onClick`: 권한·메모 안내 메시지를 비운다.
- 이미지 파일 input change: 압축과 임시 카드 생성을 시작한다.

## 변경 주의

- `cardLocationRef`의 실제 타입은 `HTMLDivElement`다.
- 새 카드 종류를 추가하면 초기 Props, hook, 편집 판정, 렌더, 레이어 갱신을 함께 추가해야 한다.
- 카드 편집 ID는 종류별이라 현재 구조상 서로 다른 종류가 동시에 편집 상태가 될 수 있다. UI 진입 경로가 이를 방지한다는 전제다.

