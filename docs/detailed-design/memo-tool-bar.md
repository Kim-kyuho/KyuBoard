# MemoToolBar 상세설계

소스: `components/MemoToolBar.tsx`, `hooks/useMemoToolBar.ts`

## 역할

메모 편집 명령을 3개 모드로 나눠 CardToolPortal에 표시한다.

## 모드

| 모드 | 도구 |
| --- | --- |
| main | 색상, text formatting, block formatting, front, back, delete |
| format | back, heading, bold, italic, strike, highlight |
| block | back, divider, code block, blockquote |

모드 전환 시 색상/heading 서브 메뉴를 닫고 `toolbar-reveal` 효과를 다시 적용한다.

## 서브 메뉴

- 색상: Yellow, Pink, Blue, Green. 버튼 왼쪽에 가로로 연다.
- 제목: H1-H6. 버튼 왼쪽에 가로로 연다.
- 선택 후 해당 메뉴를 닫는다.

Toolbar는 편집 상태나 저장을 직접 변경하지 않는다. MemoCard가 MemoEditor ref와 카드 훅 명령을 Props로 연결한다.

