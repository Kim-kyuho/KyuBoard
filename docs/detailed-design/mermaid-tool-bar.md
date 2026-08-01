# MermaidToolBar 상세설계

소스: `components/MermaidToolBar.tsx`

## 역할

편집 Mermaid 카드에 레이어 앞/뒤 이동과 삭제 명령을 제공한다.

ImageToolBar와 동일한 Portal 구조를 사용하지만 Mermaid 전용 label과 콜백 계약을 유지한다. Delete는 확인 다이얼로그를 여는 콜백이다.

