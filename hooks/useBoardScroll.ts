import { PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";

type BoardPanState = {
    pointerId: number;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
    pressedAt: number;
    isDragging: boolean;
};

export function useBoardScroll() {
    const [boardPanning, setBoardPanning] = useState(false);
    const boardPanRef = useRef<BoardPanState | null>(null);
    const boardPanClearTimerRef = useRef<number | null>(null);

    const clearBoardPanMode = () => {
        if (boardPanClearTimerRef.current) {
            window.clearTimeout(boardPanClearTimerRef.current);
            boardPanClearTimerRef.current = null;
        }

        delete document.documentElement.dataset.boardPanning;
    };

    const canStartBoardPan = (target: EventTarget | null) => {
        const targetElement = target instanceof Element ? target : null;

        if (!targetElement) {
            return false;
        }

        return !targetElement.closest(
            "[data-editing='true'], [data-selected='true'], .board-toolbar, .confirm-dialog, button, input, textarea, a, [contenteditable='true']"
        );
    };

    const handleBoardPanStart = (event: ReactPointerEvent<HTMLElement>) => {
        if (event.pointerType !== "mouse" || event.button !== 0) {
            return;
        }

        if (!canStartBoardPan(event.target)) {
            return;
        }

        clearBoardPanMode();
        boardPanRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            scrollLeft: event.currentTarget.scrollLeft,
            scrollTop: event.currentTarget.scrollTop,
            pressedAt: event.timeStamp,
            isDragging: false,
        };
    };

    const handleBoardPanMove = (event: ReactPointerEvent<HTMLElement>) => {
        const panState = boardPanRef.current;

        if (!panState || panState.pointerId !== event.pointerId) {
            return;
        }
        
        if (event.timeStamp - panState.pressedAt < 160) {
            return;
        }

        const deltaX = event.clientX - panState.startX;
        const deltaY = event.clientY - panState.startY;
        const moved = Math.hypot(deltaX, deltaY);

        if (!panState.isDragging) {
            if (moved < 5) {
                return;
            }

            panState.isDragging = true;
            setBoardPanning(true);
            event.currentTarget.setPointerCapture(event.pointerId);
        }

        document.documentElement.dataset.boardPanning = "true";
        event.preventDefault();

        event.currentTarget.scrollLeft = panState.scrollLeft - deltaX;
        event.currentTarget.scrollTop = panState.scrollTop - deltaY;
    };

    const handleBoardPanEnd = (event: ReactPointerEvent<HTMLElement>) => {
        const panState = boardPanRef.current;

        if (!panState || panState.pointerId !== event.pointerId) {
            return;
        }

        boardPanRef.current = null;
        setBoardPanning(false);

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        if (panState.isDragging) {
            boardPanClearTimerRef.current = window.setTimeout(() => {
                clearBoardPanMode();
            }, 160);
            return;
        }

        clearBoardPanMode();
    };

    useEffect(() => {
        return () => {
            if (boardPanClearTimerRef.current) {
                window.clearTimeout(boardPanClearTimerRef.current);
            }

            delete document.documentElement.dataset.boardPanning;
        };
    }, []);

    return {
        boardPanning,
        handleBoardPanStart,
        handleBoardPanMove,
        handleBoardPanEnd,
    };
}
