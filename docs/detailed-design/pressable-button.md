# PressableButton 상세설계

소스: `components/PressableButton.tsx`

## 역할

기본 button 속성을 보존하면서 메뉴/일반 버튼 스타일과 모바일 터치 피드백을 통일한다.

## Props

- 표준 `ButtonHTMLAttributes<HTMLButtonElement>`.
- `variant: default | menu`.
- 전달받은 touch start/end/cancel handler를 내부 pressed 처리 후 호출한다.

## 상태

`pressed`는 touch start에서 true, touch end/cancel에서 false다. menu는 작은 scale과 배경/그림자, default는 더 큰 scale 피드백을 사용한다.

`className`은 공통 클래스와 pressed 클래스 뒤에 결합되므로 호출자가 세부 스타일을 덮을 수 있다.

