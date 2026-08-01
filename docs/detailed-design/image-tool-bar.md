# ImageToolBar 상세설계

소스: `components/ImageToolBar.tsx`

## 역할

편집 이미지에 Bring to Front, Send to Back, Delete 아이콘 명령을 제공한다.

모든 버튼은 `CardToolPortal`과 `CardToolButton`을 사용한다. Delete는 rose 색이며 실제 삭제가 아니라 ImageCard의 확인 다이얼로그를 연다.

