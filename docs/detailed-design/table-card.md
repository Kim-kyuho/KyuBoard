# TableCard 상세설계

소스: `components/TableCard.tsx`, `hooks/useTableCard.ts`

## 역할

JSONB 표 데이터를 Rnd 카드로 감싸고 편집, 위치·크기 저장, 레이어와 삭제 명령을 연결한다.

## Props

- `table: BoardTable`: id, boardId, source, x/y/z, width/height.
- `zoom`, `canEdit`, `isEditing`.
- 편집 상태, 권한 거부, insert/update/delete, front/back 콜백.

## 상태

- `source`와 `sourceRef`: TableGrid 표시 및 최신 저장값.
- `cardState`와 `cardStateRef`: Rnd 표시 및 최신 저장값.
- drag handle, delete dialog, double tap 시간, 외부 pointer 시작 Ref.

## Rnd 계약

- 최소 너비 360, 최소 높이 128.
- 편집 중에만 resize.
- 이동은 하단 `.table-drag-handle`에서만 시작.
- 내부 wrapper는 overflow hidden이므로 표 스크롤은 TableGrid 내부에서 처리한다.

## 저장

빈 보드에서 시작하고 끝난 pointer sequence에서 `BoardTable` 전체를 조립한다. 좌표와 크기를 반올림하며 음수 ID면 POST, 그 외에는 PATCH한다.

ConfirmDialog와 board toolbar는 빈 보드 판정에서 제외한다.

## 표시

TableGrid는 편집 여부와 관계없이 항상 렌더링된다. 편집 종료 때 도구 영역이 제거되어 레이아웃이 바뀌지 않도록 버튼만 비활성화한다.

