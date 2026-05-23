import { useCallback, useEffect, useRef, useState } from "react";

type BoardZoomRef = {
    timer: number | null;
    closeTimer: number | null;
    interacting: boolean;
};

export function useBoardZoom() {
    // 보드 줌 상태 - 보드 영역만 확대/축소하고 메뉴와 로고는 고정
    const [boardZoom, setBoardZoom] = useState(0.75);
    // 보드 줌 컨트롤러 오픈 상태 - 보드 영역을 확대/축소 하는 컨트롤러
    const [zoomOpen, setZoomOpen] = useState(false);
    // 줌이 자동으로 닫히는 상태 - 조작 중이 아닐때, 줌 컨트롤러를 사라지게 함
    const [zoomClosing, setZoomClosing] = useState(false);
    // 줌 컨트롤러의 타이머와 조작 상태
    const zoomRef = useRef<BoardZoomRef>({
        timer: null,
        closeTimer: null,
        interacting: false,
    });

    // 줌 컨트롤러 타이머의 클리어를 위한 함수
    const clearZoomTimers = useCallback(() => {
        if (zoomRef.current.timer) {
            window.clearTimeout(zoomRef.current.timer);
            zoomRef.current.timer = null;
        }

        if (zoomRef.current.closeTimer) {
            window.clearTimeout(zoomRef.current.closeTimer);
            zoomRef.current.closeTimer = null;
        }
    }, []);

    // 줌 컴트롤러 페이드아웃 타이머를 위한 함수
    const startZoomCloseTimer = useCallback(() => {
        clearZoomTimers();
        zoomRef.current.timer = window.setTimeout(() => {
            if (zoomRef.current.interacting) {
                return;
            }

            setZoomClosing(true);
            zoomRef.current.closeTimer = window.setTimeout(() => {
                setZoomOpen(false);
                setZoomClosing(false);
            }, 300);
        }, 2000);
    }, [clearZoomTimers]);

    // 줌 컨트롤러 출력을 위한 핸들러
    const showZoomControl = useCallback(() => {
        setZoomOpen(true);
        setZoomClosing(false);

        if (!zoomRef.current.interacting) {
            startZoomCloseTimer();
        }
    }, [startZoomCloseTimer]);

    // 줌 컨트롤러 조작할 경우(onFocus)를 위한 핸들러
    const handleZoomControlStart = useCallback(() => {
        zoomRef.current.interacting = true;
        setZoomOpen(true);
        setZoomClosing(false);
        clearZoomTimers();
    }, [clearZoomTimers]);

    // 줌 컨트롤러 조작하지 않을 경우(onBlur)를 위한 핸들러
    const handleZoomControlEnd = useCallback(() => {
        zoomRef.current.interacting = false;
        startZoomCloseTimer();
    }, [startZoomCloseTimer]);

    useEffect(() => {
        const currentZoomRef = zoomRef.current;

        return () => {
            if (currentZoomRef.timer) {
                window.clearTimeout(currentZoomRef.timer);
            }

            if (currentZoomRef.closeTimer) {
                window.clearTimeout(currentZoomRef.closeTimer);
            }
        };
    }, []);

    return {
        boardZoom,
        setBoardZoom,
        zoomOpen,
        zoomClosing,
        showZoomControl,
        handleZoomControlStart,
        handleZoomControlEnd,
    };
}
