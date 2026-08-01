# TableGrid 상세설계

소스: `components/TableGrid.tsx`, `hooks/useTableEdit.tsx`, `lib/table-card.ts`

## 역할

TanStack Table의 headless model을 이용해 최소 편집 표 UI를 구성한다.

## 데이터 구조

```ts
type TableSource = {
    columns: Array<{ id: string; name: string; width?: number }>;
    rows: Array<{ id: string; cells: Record<string, string> }>;
};
```

열과 행 ID는 `createTableItemId()`로 생성한다. DB/API에서는 Zod schema로 최소 열 1개, 행 1개와 셀 구조를 검증한다.

## 유지 기능

- 행 추가
- 열 추가
- 행 체크박스 선택과 선택 행 삭제
- 열 이름 변경과 열 삭제
- 셀 문자열 편집
- 열 크기 변경

정렬, 필터, 그룹, pagination은 사용하지 않는다.

## 편집/표시 차이

- 툴 영역은 항상 32px 높이를 유지한다.
- 비편집 시 도구와 체크박스를 disabled 및 연회색으로 표시한다.
- 열 제목은 편집 input 또는 표시 span으로 전환한다.
- 셀은 편집 textarea 또는 표시 span으로 전환한다.
- textarea는 scrollHeight에 맞춰 높이를 자동 조절한다.
- 두 상태 모두 pre-wrap/anywhere 규칙으로 셀 안에서 개행한다.

## TanStack 구성

- `getCoreRowModel`만 사용한다.
- state: rowSelection, columnSizing.
- column resize mode: onChange.
- 첫 열은 고정 32px 선택 열이다.
- 데이터 열 최소 너비는 80, 기본 너비는 160이다.

## 입력 포커스 보존

`columns` 정의는 열 ID와 width로 만든 `columnStructureKey`에만 의존한다. 셀 값이나 열 이름 입력마다 column component가 재생성되어 input focus가 사라지는 것을 막기 위한 구조다. 최신 source는 table meta와 `sourceRef`로 전달한다.

행을 모두 삭제하거나 마지막 열을 삭제하는 작업은 거부한다.

