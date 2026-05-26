import { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { DraggableData, RndDragEvent, RndResizeCallback } from "react-rnd";

export interface ImageCardImage {
    imageId: number;
    boardId: number;
    publicId: string;
    secureUrl: string;
    fileName: string | null;
    file?: File;
    x: number;
    y: number;
    width: number;
    height: number;
}

type ImagePointerArea = "inimage" | "outimage";

type LastPointerAction = {
    time: number;
    area: ImagePointerArea;
};

type UseImageCardOptions = {
    image: ImageCardImage;
    zoom: number;
    canEdit: boolean;
    isSelected: boolean;
    onSelect: () => void;
    onSelectClear: () => void;
    onPermissionDenied: () => void;
    onInsert: (
        tempId: number,
        file: File,
        boardId: number,
        x: number,
        y: number,
        width: number,
        height: number,
    ) => void;
    onUpdate: (
        imageId: number,
        boardId: number,
        publicId: string,
        secureUrl: string,
        fileName: string | null,
        x: number,
        y: number,
        width: number,
        height: number,
    ) => void;
    onDelete: (
        imageId: number,
        publicId: string,
    ) => void;
};

export function useImageCard({
    image,
    zoom,
    canEdit,
    isSelected,
    onSelect,
    onSelectClear,
    onPermissionDenied,
    onInsert,
    onUpdate,
    onDelete,
}: UseImageCardOptions) {
    // 이미지 카드의 위치와 크기 상태
    const [imageState, setImageState] = useState({
        x: image.x,
        y: image.y,
        width: image.width,
        height: image.height,
    });
    // 삭제 확인 다이얼로그 오픈 상태
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    // 컨텍스트 메뉴 오픈 상태
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    // 컨텍스트 메뉴 위치 상태
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    // 컨텍스트 메뉴 외부 클릭 감지를 위한 ref
    const menuRef = useRef<HTMLDivElement | null>(null);
    // 외부 터치 시작 좌표를 저장하기 위한 ref
    const outsideTouchStartRef = useRef<{ x: number; y: number } | null>(null);
    // 더블탭 이벤트 감지를 위한 ref
    const lastTapRef = useRef<LastPointerAction>({ time: 0, area: "outimage" });
    // 보드 드래그 스크롤 여부 확인 전까지 외부 클릭 피드백을 잠시 지연하기 위한 ref
    const pendingOutsideActionRef = useRef<number | null>(null);
    // 모바일에서 길게 누름 이벤트 감지를 위한 ref
    const longPressRef = useRef<number | null>(null);

    // 이미지 저장 함수 - 신규 이미지는 업로드/DB생성, 기존 이미지는 위치와 크기만 업데이트
    const saveImageDraft = useCallback(() => {
        if (image.imageId < 0) {
            if (!image.file) {
                return;
            }

            onInsert(
                image.imageId,
                image.file,
                image.boardId,
                Math.round(imageState.x),
                Math.round(imageState.y),
                Math.round(imageState.width),
                Math.round(imageState.height),
            );
            return;
        }

        onUpdate(
            image.imageId,
            image.boardId,
            image.publicId,
            image.secureUrl,
            image.fileName,
            Math.round(imageState.x),
            Math.round(imageState.y),
            Math.round(imageState.width),
            Math.round(imageState.height),
        );
    }, [image.boardId, image.file, image.fileName, image.imageId, image.publicId, image.secureUrl, imageState.height, imageState.width, imageState.x, imageState.y, onInsert, onUpdate]);

    // 터치 디바이스 여부를 판단하는 함수
    const isTouchDevice = () =>
        typeof window !== "undefined" &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    // 보드 좌표계에 맞춰 컨텍스트 메뉴 위치를 계산
    const getBoardPoint = (clientX: number, clientY: number) => {
        const board = document.querySelector(".kyu-board");
        const boardRect = board?.getBoundingClientRect();

        return {
            x: boardRect ? (clientX - boardRect.left) / zoom : clientX,
            y: boardRect ? (clientY - boardRect.top) / zoom : clientY,
        };
    };

    // 이미지 선택 함수 - 더블클릭/더블탭 시 점선 테두리 표시
    const selectImage = () => {
        if (!canEdit) {
            onPermissionDenied();
            return;
        }

        onSelect();
    };

    // 모바일에서 이미지 더블탭을 감지하기 위한 함수
    const handleDoubleTap = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== "touch") { return; }

        const currentTime = event.timeStamp;
        const isDoubleTap = lastTapRef.current.area === "inimage" && currentTime - lastTapRef.current.time < 300;
        lastTapRef.current = { time: currentTime, area: "inimage" };

        if (isDoubleTap) {
            event.preventDefault();
            selectImage();
        }
    };

    // 화면 전체 클릭 감지 & 이미지 외부 클릭을 감지하기 위해 글로벌 포인터 이벤트 사용
    useEffect(() => {
        const handleClickOutside = (event: PointerEvent) => {
            const target = event.target as Node;
            // 이벤트를 엘리멘트로 다루기 위한 체크
            const targetElement = target instanceof Element ? target : null;
            // 컨텍스트 메뉴 안쪽에서 이벤트가 발생했는지 체크
            const isClickInsideMenu = menuRef.current?.contains(target);
            // 보드 툴바 안쪽에서 이벤트가 발생했는지 체크
            const isClickInsideBoardToolBar = targetElement?.closest(".board-toolbar");
            // Portal로 표시되는 확인 다이얼로그 안쪽에서 이벤트가 발생했는지 체크
            const isClickInsideConfirmDialog = targetElement?.closest(".confirm-dialog");
            // 이미지 안쪽에서 이벤트가 발생했는지 체크
            const isClickInsideImage = targetElement?.closest(`.image-rnd-${image.imageId}`);

            if (isClickInsideBoardToolBar || isClickInsideConfirmDialog) {
                return;
            }
            // 보드 드래그 스크롤 중에는 이미지 외부 클릭 피드백을 실행하지 않음
            if (document.documentElement.dataset.boardPanning === "true") {
                return;
            }
            // 마우스 왼쪽 드래그 스크롤과 단순 외부 클릭을 구분하기 위해 외부 피드백 실행을 잠시 지연
            const runAfterBoardPanCheck = (callback: () => void) => {
                if (pendingOutsideActionRef.current) {
                    window.clearTimeout(pendingOutsideActionRef.current);
                }

                pendingOutsideActionRef.current = window.setTimeout(() => {
                    pendingOutsideActionRef.current = null;

                    if (document.documentElement.dataset.boardPanning === "true") {
                        return;
                    }

                    callback();
                }, 90);
            };

            if (!isClickInsideMenu) {
                setContextMenuOpen(false);
            }

            // 이미지가 선택된 상태 & 이미지나 컨텍스트 메뉴의 외부를 클릭한 경우
            if (!isClickInsideImage && !isClickInsideMenu && isSelected) {
                if (event.pointerType === "touch") {
                    outsideTouchStartRef.current = {
                        x: event.clientX,
                        y: event.clientY,
                    };
                    return;
                }

                // 외부 클릭 시 변경된 이미지 위치/크기를 저장하고 선택 상태를 해제
                runAfterBoardPanCheck(() => {
                    saveImageDraft();
                    onSelectClear();
                    setContextMenuOpen(false);
                });
                return;
            }

            outsideTouchStartRef.current = null;
        };

        // 터치 기기를 위한 핸들러 - 이미지나 컨텍스트 메뉴 외부를 탭한 경우
        const handleTouchOutsideEnd = (event: PointerEvent) => {
            if (event.pointerType !== "touch" || !outsideTouchStartRef.current || !isSelected) {
                return;
            }

            const deltaX = event.clientX - outsideTouchStartRef.current.x;
            const deltaY = event.clientY - outsideTouchStartRef.current.y;
            const moved = Math.hypot(deltaX, deltaY);
            outsideTouchStartRef.current = null;

            if (moved < 10) {
                saveImageDraft();
                onSelectClear();
                setContextMenuOpen(false);
            }
        };

        // 외부 터치의 시작 좌표를 클리어
        const clearOutsideTouchStart = () => {
            outsideTouchStartRef.current = null;
        };

        document.addEventListener("pointerdown", handleClickOutside);
        document.addEventListener("pointerup", handleTouchOutsideEnd);
        document.addEventListener("pointercancel", clearOutsideTouchStart);
        return () => {
            document.removeEventListener("pointerdown", handleClickOutside);
            document.removeEventListener("pointerup", handleTouchOutsideEnd);
            document.removeEventListener("pointercancel", clearOutsideTouchStart);
            if (pendingOutsideActionRef.current) {
                window.clearTimeout(pendingOutsideActionRef.current);
            }
        };
    }, [image.imageId, isSelected, onSelectClear, saveImageDraft]);

    const handleContextMenu = (event: ReactMouseEvent<HTMLElement>) => {
        event.preventDefault();
        if (!canEdit) {
            onPermissionDenied();
            return;
        }
        if (isTouchDevice()) { return; }

        const { x, y } = getBoardPoint(event.clientX, event.clientY);
        setContextMenuPosition({ x, y });
        setContextMenuOpen(true);
    };

    const handleLongPressStart = (event: ReactPointerEvent<HTMLElement>) => {
        if (event.pointerType !== "touch") { return; }
        if (!canEdit) { return; }

        const { x, y } = getBoardPoint(event.clientX, event.clientY);
        longPressRef.current = window.setTimeout(() => {
            setContextMenuPosition({ x, y });
            setContextMenuOpen(true);
        }, 600);
    };

    const clearLongPress = () => {
        if (longPressRef.current) {
            window.clearTimeout(longPressRef.current);
            longPressRef.current = null;
        }
    };

    // 이미지 카드 이동 완료 시 좌표만 임시 저장
    const handleDragStop = (_event: RndDragEvent, data: DraggableData) => {
        setImageState((prev) => ({ ...prev, x: data.x, y: data.y }));
    };

    // 이미지 카드 크기 조절 완료 시 사이즈 정보만 임시 저장
    const handleResizeStop: RndResizeCallback = (_event, _direction, ref, _delta, position) => {
        setImageState({
            x: position.x,
            y: position.y,
            width: ref.offsetWidth,
            height: ref.offsetHeight,
        });
    };

    const openDeleteDialog = () => {
        setContextMenuOpen(false);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        onDelete(image.imageId, image.publicId);
        setDeleteDialogOpen(false);
        onSelectClear();
    };

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false);
    };

    return {
        imageState,
        deleteDialogOpen,
        contextMenuOpen,
        contextMenuPosition,
        menuRef,
        selectImage,
        handleDoubleTap,
        handleContextMenu,
        handleLongPressStart,
        clearLongPress,
        handleDragStop,
        handleResizeStop,
        openDeleteDialog,
        confirmDelete,
        closeDeleteDialog,
    };
}
