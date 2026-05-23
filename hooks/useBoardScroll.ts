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
    boardZoom: number;
    writeClicked: boolean;
};

export function useBoardScroll({ boardZoom, writeClicked }: UseBoardScrollOptions) {
    // 보드 스크롤 영역 ref - 이미지 업로드 위치 계산에 사용
    const boardScrollRef = useRef<HTMLElement | null>(null);
    // 보드 드래그 스크롤 상태 - 마우스 왼쪽 버튼으로 보드를 잡고 이동 중인지 체크
    const [boardPanning, setBoardPanning] = useState(false);
    // 마우스 왼쪽 버튼으로 보드를 드래그 스크롤하기 위한 상태 ref
    const boardPanRef = useRef<BoardPanState | null>(null);
    // 보드 드래그 스크롤 직후 클릭 이벤트가 실행되는 것을 막기 위한 ref
    const suppressBoardClickRef = useRef(false);
    // 보드 드래그 스크롤 종료 후 외부 클릭 피드백을 잠시 막기 위한 타이머 ref
    const boardPanClearTimerRef = useRef<number | null>(null);

    // 보드 드래그 스크롤 상태를 초기화
    const clearBoardPanMode = () => {
        if (boardPanClearTimerRef.current) {
            window.clearTimeout(boardPanClearTimerRef.current);
            boardPanClearTimerRef.current = null;
        }

        delete document.documentElement.dataset.boardPanning;
    };

    // 보드 드래그 스크롤이 시작될 수 있는 영역인지 체크
    const canStartBoardPan = (target: EventTarget | null) => {
        const targetElement = target instanceof Element ? target : null;

        if (!targetElement) {
            return false;
        }

        return !targetElement.closest(
            "[class*='memo-rnd-'], [class*='image-rnd-'], .board-toolbar, .confirm-dialog, button, input, textarea, a, [contenteditable='true']"
        );
    };

    // 마우스 왼쪽 버튼으로 보드 드래그 스크롤을 시작
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

    // 보드 드래그 스크롤 중 스크롤 위치를 갱신
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

    // 보드 드래그 스크롤 종료
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

    // 이미지 업로드 위치 계산 함수 - 현재 보이는 보드 화면의 중앙에 이미지를 생성
    const getImageUploadPoint = () => {
        const scrollElement = boardScrollRef.current;
        if (!scrollElement) {
            return { x: 0, y: 0 };
        }

        return {
            x: Math.max(0, (scrollElement.scrollLeft + scrollElement.clientWidth / 2) / boardZoom - 200),
            y: Math.max(0, (scrollElement.scrollTop + scrollElement.clientHeight / 2) / boardZoom - 150),
        };
    };

    // 보드 드래그 스크롤 관련 전역 상태 정리
    useEffect(() => {
        return () => {
            if (boardPanClearTimerRef.current) {
                window.clearTimeout(boardPanClearTimerRef.current);
            }

            delete document.documentElement.dataset.boardPanning;
        };
    }, []);

    return {
        boardScrollRef,
        boardPanning,
        suppressBoardClickRef,
        handleBoardPanStart,
        handleBoardPanMove,
        handleBoardPanEnd,
        getImageUploadPoint,
    };
}
