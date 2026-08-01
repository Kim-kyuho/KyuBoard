# BoardMessage 상세설계

소스: `components/BoardMessage.tsx`

## Props

| Prop | 타입 | 사용처 |
| --- | --- | --- |
| `message` | `string` | 각 분기에서 `{message && (...)}`로 빈 문자열이면 아무것도 렌더하지 않음 (13, 27, 41줄) |
| `type` | `"permission" \| "memo" \| "error"` | 어느 `if` 분기를 타는지 결정 (10, 24, 38줄) |

## State

없음.

## 렌더 분기 (10~48줄)

| `type` | 조건부 렌더 여부 | 컨테이너 | 스타일 | 비고 |
| --- | --- | --- | --- | --- |
| `"permission"` | `message`가 truthy일 때만 (13줄) | `div` | `fixed left-1/2 top-20 ... rounded-xl bg-white ... text-rose-600 shadow-md`, `zIndex: 60` | `"memo"`와 마크업이 완전히 동일 |
| `"memo"` | `message`가 truthy일 때만 (27줄) | `div` | `permission`과 100% 동일한 className/스타일 | 코드가 그대로 중복 |
| `"error"` | `message`가 truthy일 때만 (41줄) | `p` | `text-xs leading-5 text-rose-600` | 상단 고정이 아니라 부모 레이아웃 안 인라인 문단 |
| 그 외(타입에 매칭 안 됨) | - | - | - | 세 `if` 모두 아니면 함수가 `undefined`를 반환(암묵적) — TypeScript 유니온이라 실제로는 도달 불가 |

## 알려진 특이사항

- `"permission"`과 `"memo"` 분기는 JSX가 글자 그대로 동일하다 — 두 타입을 구분하는 실질적 차이가 코드상 없고, 호출자가 의미상 다른 용도로 쓸 뿐이다. 하나로 합쳐도 동작이 바뀌지 않는다.
- 세 `if`가 `else if`가 아니라 독립된 `if`라서, 컴파일러 입장에서는 이론상 세 조건이 모두 거짓인 경로(현재 타입이 유니온이라 실질적으로는 발생 불가)가 존재한다.
