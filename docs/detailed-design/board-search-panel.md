# BoardSearchPanel 상세설계

소스: `components/BoardSearchPanel.tsx`

## 역할

메모 텍스트 검색어, 현재 결과 순번과 이전/다음 이동 명령을 표시하는 제어 컴포넌트다.

## Props

- `searchText`: 제어 입력값.
- `currentIndex`, `searchCount`: `현재/전체` 표시.
- `onTextChange`: 검색어 변경.
- `onPrev`, `onNext`: 검색 결과 이동.

검색과 포커스 계산은 `useBoardSearch`와 `useBoardMemoFocus`가 담당한다. 패널은 상태를 만들지 않는다.

위치는 화면 하단 중앙이며 z-index 50000이다. input 글자 크기는 iOS 자동 확대를 피하도록 16px이다.

