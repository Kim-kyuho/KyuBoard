# BoardMarkdownView 상세설계

소스: `components/BoardMarkdownView.tsx`

## 역할

보드 카드에서 컴파일한 Markdown을 모달로 미리 보고 원문 파일을 다운로드한다.

## Props

- `boardId`: 컴파일 API와 파일명에 사용.
- `onClose`: backdrop과 닫기 버튼에서 실행.

## 내부 구조

- `useBoardMarkdown`: GET, loading/error, Mermaid 섹션 분리, Blob 다운로드.
- 내부 `MarkdownMermaid`: `useMermaidRenderer`로 source를 SVG 또는 오류로 표시.
- 일반 섹션: React Markdown + remark-gfm + rehype-raw + rehype-sanitize.

## 렌더 흐름

1. Markdown 문자열을 Mermaid fenced block 캡처 정규식으로 분리한다.
2. 홀수 index는 Mermaid source, 짝수 index는 일반 Markdown이다.
3. 원문이 존재하고 로딩/오류가 없을 때 우상단 다운로드 버튼을 표시한다.
4. 다운로드 이름은 `board-{boardId}.md`다.

## 레이어

- backdrop: 60000.
- modal: 60001.
- 본문만 스크롤하며 헤더와 다운로드 버튼 위치는 유지한다.

