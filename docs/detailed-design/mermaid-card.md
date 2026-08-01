# MermaidCard 상세설계

소스: `components/MermaidCard.tsx`, `hooks/useMermaidCard.ts`, `hooks/useMermaidRenderer.ts`

## 역할

Mermaid source를 편집하고 SVG를 실시간 렌더링하며 카드 위치·크기와 함께 저장한다.

## 모델과 상태

- 모델: id, boardId, source, x/y/z, width/height.
- `source`, `sourceRef`: 렌더용 state와 저장용 최신 Ref.
- `cardState`, `cardStateRef`: Rnd 표시와 저장 좌표.
- 삭제/drag handle/외부 시작 Ref.

## 표시

- 비편집: SVG 영역만 카드 전체에 표시.
- 편집: 상단 40% textarea, 하단 SVG 미리보기, 하단 drag handle.
- textarea는 spellcheck를 끄고 monospaced 16px로 표시한다.
- 렌더 오류는 rose pre block으로 카드 안에 표시한다.

## SVG 렌더

1. Mermaid와 ZenUML external diagram을 모듈 수준에서 초기화한다.
2. source 변경마다 ticket과 고유 render ID를 만든다.
3. parse 성공 후 render한다.
4. 오래된 ticket 결과는 state에 반영하지 않는다.
5. SVG width/height를 제거하고 `preserveAspectRatio="xMidYMid meet"`을 넣는다.
6. 임시 Mermaid DOM과 ZenUML의 충돌 전역 style을 제거한다.

## 저장

pointerdown과 pointerup이 모두 카드·툴바 밖의 board scroll layer이면 저장한다. 음수 ID는 POST, 기존 ID는 PATCH다. Ref에서 최신 source와 좌표를 읽는다.

## 편집

더블 클릭 또는 300ms 더블 탭으로 진입한다. Rnd 이동은 drag handle에서만 시작하며 편집 중에만 resize한다.

