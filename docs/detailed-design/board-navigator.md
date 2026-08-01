# BoardNavigator 상세설계

소스: `components/BoardNavigator.tsx`

## 상태

현재 `BoardClient`에서 렌더 코드가 주석 처리되어 사용되지 않는다.

## 역할과 계약

`currentBoardId`의 배열 index를 계산해 이전/다음 보드로 `router.push`한다. 경계 밖 이동은 `onInvalidBoard`를 호출한다. 중앙 input은 현재 순번을 표시하지만 입력값을 실제 라우팅에 사용하지 않는다.

재활성화할 경우 BoardMenu와 같은 우상단 위치 및 z-index 충돌을 먼저 조정해야 한다.

