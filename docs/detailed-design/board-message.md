# BoardMessage 상세설계

소스: `components/BoardMessage.tsx`

## 역할

권한, 메모 탐색, 폼 오류 메시지를 동일한 입력 계약으로 표시한다.

## Props

- `message: string`: 빈 문자열이면 렌더링하지 않는다.
- `type: permission | memo | error`.

`permission`과 `memo`는 화면 상단 중앙의 고정 알림으로 같은 스타일을 사용한다. `error`는 부모 레이아웃 안의 작은 문단으로 표시한다.

