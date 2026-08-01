# MemoEditor 상세설계

소스: `components/MemoEditor.tsx`

## 역할

TipTap 기반 HTML 편집기이며 부모 MemoCard에 서식 명령 API를 노출한다.

## Props와 Ref API

- `content`: 제어할 HTML.
- `onChange(html)`: TipTap update마다 `editor.getHTML()` 전달.
- ref handle: code block, blockquote, H1-H6, bold, italic, strike, horizontal rule, highlight.

`useImperativeHandle`은 TipTap editor 객체 전체를 노출하지 않고 카드 툴바가 필요한 명령만 외부에 제공한다.

## Extension

- StarterKit. 내장 hardBreak는 비활성.
- 사용자 HardBreak: Shift+Enter.
- Highlight: multicolor.
- InlineMarkdownInputRules: bold, italic, strike, inline code, highlight의 입력/paste 변환.

## 동기화

- 외부 content와 editor HTML이 다를 때만 `setContent(..., emitUpdate: false)`.
- editor 생성 후 다음 task에서 끝 위치에 포커스한다.
- pointerup은 기본 동작을 막고 editor가 포커스되지 않은 경우 끝 위치를 포커스한다.

## 출력

EditorContent의 편집 영역 클래스는 `memo-editor-content`다. 읽기 모드와 같은 전역 타이포그래피 규칙을 공유한다.

