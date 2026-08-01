# BoardZoomControl 상세설계

소스: `components/BoardZoomControl.tsx`

## 역할

보드 확대 비율을 5% 단위로 조정하고 현재 퍼센트를 표시한다.

## 계약

- 입력: `boardZoom`, React state setter.
- 감소/증가량: 0.05.
- 최소: 0.25.
- 최대: 2.
- 부동소수 오차를 줄이기 위해 두 자리로 반올림한다.
- 표시는 `Math.round(boardZoom * 100)%`다.

위치는 `fixed bottom-7 right-5`, z-index 50000이다. 퍼센트 선택으로 iPad 드래그가 발생하지 않도록 selection/callout을 비활성화한다.

