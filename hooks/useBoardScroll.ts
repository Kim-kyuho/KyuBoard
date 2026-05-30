import { PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";

type BoardPanState = {
    pointerId: number;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
    isDragging: boolean;
};

type UseBoardScrollOptions = {
    writeClicked: boolean;
};

export function useBoardScroll({ writeClicked }: UseBoardScrollOptions) {
    const [boardPanning, setBoardPanning] = useState(false);
    const boardPanRef = useRef<BoardPanState | null>(null);
    const suppressBoardClickRef = useRef(false);
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
            "[class*='memo-rnd-'], [class*='image-rnd-'], .board-toolbar, .confirm-dialog, button, input, textarea, a, [contenteditable='true']"
        );
    };

    const handleBoardPanStart = (event: ReactPointerEvent<HTMLElement>) => {
        if (event.pointerType !== "mouse" || event.button !== 0 || writeClicked) {
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
            isDragging: false,
        };

        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleBoardPanMove = (event: ReactPointerEvent<HTMLElement>) => {
        const panState = boardPanRef.current;

        if (!panState || panState.pointerId !== event.pointerId) {
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
        }

        document.documentElement.dataset.boardPanning = "true";
        suppressBoardClickRef.current = true;
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
                suppressBoardClickRef.current = false;
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
        suppressBoardClickRef,
        handleBoardPanStart,
        handleBoardPanMove,
        handleBoardPanEnd,
    };
}
