"use client";
import PressableButton from "./PressableButton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

type BoardProps = {
    currentBoardId: number;
    boardIds: number[];
    onInvalidBoard: () => void;
}

// 보드 이동을 위한 컴포넌트 - 서버로부터 현재 보드id(최신)과 보드id리스트를 Input하여 조작
export default function BoardNavigator({currentBoardId, boardIds, onInvalidBoard}: BoardProps) {
    // 라우터
    const router = useRouter();
    // 현재 보드id 리스트의 인덱스
    const currentIndex = boardIds.indexOf(currentBoardId);
    // 이전 보드id - 인덱스 - 1
    const prevBoardId = currentIndex > 0 ? boardIds[currentIndex - 1] : null;
    // 다음 보드id - 인덱스 + 1
    const nextBoardId = currentIndex >= 0 && currentIndex < boardIds.length - 1
        ? boardIds[currentIndex + 1]
        : null;

    // 보드 이동
    const moveBoard = (boardId: number | null) => {
        if (boardId === null) {
            onInvalidBoard();
            return;
        }

        router.push(`/boards/${boardId}`);
    };

    return(
        <>
            <div className="fixed right-5 top-5 z-50 flex items-center gap-0.5 rounded-xl text-neutral-900">
                <PressableButton 
                    variant="menu"
                    onClick={() => moveBoard(prevBoardId)}
                >
                    <ChevronLeft />
                </PressableButton>
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    // 표시내용을 인덱스로
                    defaultValue={currentIndex + 1}
                    className="h-9 w-8 rounded-md bg-white/70 text-center text-sm font-semibold text-neutral-900 shadow-md outline-none"
                />

                <PressableButton 
                    variant="menu"
                    onClick={() => moveBoard(nextBoardId)}
                >
                    <ChevronRight />
                </PressableButton>
            </div>
        </>
    )
}
