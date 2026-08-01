# ConfirmDialog 상세설계

소스: `components/ConfirmDialog.tsx`

## 역할

보드와 카드 삭제 전 확인을 받는 공통 Portal 다이얼로그다.

## Props

- `message`: 질문 문구.
- `onConfirm`: Yes.
- `onCancel`: No.

backdrop과 panel 모두 `.confirm-dialog`를 사용한다. 카드 외부 저장 및 보드 패닝 로직이 이 클래스를 제외한다.

document.body에 렌더되며 backdrop z 40, panel z 50이다. backdrop 자체에는 취소 클릭 동작이 없다.

