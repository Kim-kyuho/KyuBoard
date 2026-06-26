"use client";
import PressableButton from "./PressableButton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

type BoardProps = {
    currentBoardId: number;
    boardIds: number[];
    onInvalidBoard: () => void;
}

export default function BoardNavigator({currentBoardId, boardIds, onInvalidBoard}: BoardProps) {
    const router = useRouter();
    const currentIndex = boardIds.indexOf(currentBoardId);
    const prevBoardId = currentIndex > 0 ? boardIds[currentIndex - 1] : null;
    const nextBoardId = currentIndex >= 0 && currentIndex < boardIds.length - 1
        ? boardIds[currentIndex + 1]
        : null;

    const moveBoard = (boardId: number | null) => {
        if (boardId === null) {
            onInvalidBoard();
            return;
        }
        router.push(`/boards/${boardId}`);
    };

    return(
        <>
            <div className="fixed right-5 top-5 z-[50000] flex items-center gap-0.5 rounded-xl text-neutral-900">
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
