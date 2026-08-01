# BoardActionMenu 상세설계

소스: `components/BoardActionMenu.tsx`

## 역할

보드 목록 항목 안에서 Rename과 Delete 명령을 제공한다.

## Props

- `ref?`: `useBoardList`의 외부 클릭 판정 대상.
- `onRename`: rename 모달을 연다.
- `onDelete`: 삭제 확인 다이얼로그를 연다.

항목 기준 `absolute right-2 top-11`로 배치하며 z-index 50000이다. 메뉴 자체는 상태나 권한을 소유하지 않는다.

