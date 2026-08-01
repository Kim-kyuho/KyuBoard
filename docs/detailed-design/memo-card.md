# MemoCard 상세설계

소스: `components/MemoCard.tsx`, `hooks/useMemoCard.ts`

## 역할

TipTap HTML 메모의 표시·편집, 이동, 리사이즈, 저장, 포커스, 삭제를 담당한다.

## 핵심 Props

| 그룹 | Props |
| --- | --- |
| 모델 | `memo`, `zoom`, `canEdit` |
| 상태 | `isEditing`, `isFocused` |
| 상태 명령 | `onEditing/Clear`, `onFocus/Clear` |
| 영속화 | `onInsert`, `onUpdate`, `onDelete` |
| 레이어 | `onBringToFront`, `onSendToBack` |

## 로컬 상태

- `memoState`: x, y, width, height.
- `memoContent`: TipTap HTML.
- `memoColor`: 배경색.
- `deleteDialogOpen`, `dragHandlePressed`.
- `memoFocusRef`: 편집 진입 후 포커스 대상.
- `outsidePressStartedRef`: 바깥에서 시작한 pointer sequence인지 기록.

## 표시 상태

- Rnd 이동/리사이즈 비활성.
- 메모 HTML을 `memo-editor-content`에 직접 삽입한다.
- 한 번 클릭은 메모 focus, 더블 클릭/더블 탭은 편집 진입이다.
- focused는 sky 계열 실선 `memo-focused`, editing은 `card-editing`을 사용한다.

## 편집 상태

- `MemoEditor`와 하단 drag handle을 표시한다.
- Rnd drag는 `.memo-drag-handle`에서만 시작한다.
- 편집 카드 z는 `ACTIVE_CARD_Z`.
- 전용 MemoToolBar는 Portal로 표시한다.

## 저장

1. document pointerdown에서 빈 보드 시작 여부를 기록한다.
2. pointerup도 같은 빈 보드이면 저장한다.
3. 음수 ID는 INSERT, 양수 ID는 UPDATE.
4. 좌표와 크기를 반올림하고 편집 상태를 해제한다.

툴바 입력은 저장을 유발하지 않는다. 바깥에서 시작하지 않은 카드 내부 드래그도 저장하지 않는다.

## 삭제

툴바 Delete가 ConfirmDialog를 열며 확인 시 부모 삭제 콜백과 편집 해제를 실행한다.

