import { useCallback, useEffect, useRef, useState } from "react";

type BoardZoomRef = {
    timer: number | null;
    closeTimer: number | null;
    interacting: boolean;
};

export function useBoardZoom() {
    const [boardZoom, setBoardZoom] = useState(0.75);
    const [zoomOpen, setZoomOpen] = useState(false);
    const [zoomClosing, setZoomClosing] = useState(false);
    const zoomRef = useRef<BoardZoomRef>({
        timer: null,
        closeTimer: null,
        interacting: false,
    });

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

    const showZoomControl = useCallback(() => {
        setZoomOpen(true);
        setZoomClosing(false);

        if (!zoomRef.current.interacting) {
            startZoomCloseTimer();
        }
    }, [startZoomCloseTimer]);

    const handleZoomControlStart = useCallback(() => {
        zoomRef.current.interacting = true;
        setZoomOpen(true);
        setZoomClosing(false);
        clearZoomTimers();
    }, [clearZoomTimers]);

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
