"use client";

import GeminiIcon from "./GeminiIcon";
import PressableButton from "./PressableButton";

type AiAssistantButtonProps = {
    aiPanelOpen: boolean;
    onToggle: () => void;
};

// 보드 메뉴(Ellipsis) 바로 아래에 고정되는 AI 어시스턴트 진입 버튼.
// 활성 강조색은 BoardToolBar의 토글 버튼들과 같은 값을 쓴다.
//
// 보드 메뉴 드롭다운과 같은 자리(top-17)에 놓이므로 z를 한 단계 올려 항상 위에 오게 한다.
// 렌더 순서에 기대면 JSX 위치가 바뀔 때 조용히 가려진다.
export default function AiAssistantButton({ aiPanelOpen, onToggle }: AiAssistantButtonProps) {
    return (
        <PressableButton
            className="fixed right-5 top-17 z-50000 bg-white/75 px-3 py-3 shadow-md"
            onClick={onToggle}
            aria-label="Open AI assistant"
            aria-pressed={aiPanelOpen}
        >
            <GeminiIcon
                className="h-5 w-5 text-neutral-900"
                style={aiPanelOpen ? { color: "#ec4899" } : undefined}
            />
        </PressableButton>
    );
}
