# BoardToolBar 상세설계

소스: `components/BoardToolBar.tsx`

## 역할

보드 일반 명령과 카드 전용 도구 Portal 슬롯, 항상 표시되는 줌 컨트롤을 배치한다.

## Props와 명령

| 명령 | 콜백 |
| --- | --- |
| 이전/다음 메모 | `onFocusPrevMemo`, `onFocusNextMemo` |
| 검색 | `setSearchBarOpen` |
| 메모/이미지/표/Mermaid 생성 | 각 create/upload callback |
| 드로잉 | `onDrawingToggleClick` |
| 줌 | `boardZoom`, `setBoardZoom` |

## 표시 규칙

- `cardEditing === false`: 오른쪽 하단 일반 도구 세로 목록 표시.
- `cardEditing === true`: 일반 목록 숨김.
- `#card-tool-portal`: 상태와 관계없이 존재하며 카드 또는 드로잉 툴바의 Portal 대상이다.
- `BoardZoomControl`: 항상 표시한다.

모든 일반 명령은 실행 후 BoardMenu를 닫는다. 검색 버튼만 검색 패널 상태를 토글한다.

## 레이아웃

- 위치: `fixed bottom-16 right-5`
- z-index: 50000
- 각 아이콘 버튼: 40 x 40
- 클래스 `.board-toolbar`는 카드 외부 저장과 보드 패닝 제외 판정에도 사용된다.

