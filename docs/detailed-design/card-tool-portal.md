# CardToolPortal 상세설계

소스: `components/CardToolPortal.tsx`

## CardToolPortal

`#card-tool-portal`을 찾아 children을 Portal로 렌더링한다. 서버 렌더 또는 대상이 아직 없으면 null을 반환한다.

- 기본 wrapper: 세로, 우측 정렬, 4px gap.
- `animate=true`: `toolbar-reveal` 효과 적용.
- MemoToolBar는 내부 모드 전환 애니메이션을 직접 제어하기 위해 `animate=false`를 사용한다.

## CardToolButton

PressableButton의 카드 도구 공통 wrapper다.

- 필수 `label`을 aria-label과 title에 모두 사용한다.
- 40 x 40 아이콘 버튼.
- child SVG를 20 x 20으로 통일한다.
- hover/active 피드백을 공통 적용한다.
- 나머지 표준 button props를 그대로 전달한다.

