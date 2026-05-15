"use client";

import { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import ConfirmDialog from "@/components/ConfrimDialog";
import PressableButton from "@/components/PressableButton";

// 이미지 카드 정보
interface ImageCardProps {
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

// 이미지 카드 컴포넌트
export default function ImageCard({ image, zoom, canEdit, isSelected, onSelect, onSelectClear, onPermissionDenied, onInsert, onUpdate, onDelete}: {
    image: ImageCardProps;
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
}) {
    // 이미지 카드의 위치와 크기 상태
    const [imageState, setImageState] = useState({
        x: image.x,
        y: image.y,
        width: image.width,
        height: image.height,
    });
    // 저장 확인 다이얼로그 오픈 상태
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    // 삭제 확인 다이얼로그 오픈 상태
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    // 수정 취소 확인 다이얼로그 오픈 상태
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
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
    // 더블클릭 이벤트 감지를 위한 ref
    const lastClickRef = useRef<LastPointerAction>({ time: 0, area: "outimage" });
    // 더블클릭에서 첫번째 클릭시 두번클릭까지 걸리는 시간 감지를 위한 ref
    const clickTimerRef = useRef<number | null>(null);
    // 모바일에서 길게 누름 이벤트 감지를 위한 ref
    const longPressRef = useRef<number | null>(null);

    // 이미지 수정 취소 함수 - 저장하지 않은 위치와 크기를 원래 이미지 정보로 되돌림
    const resetImageDraft = useCallback(() => {
        setImageState({
            x: image.x,
            y: image.y,
            width: image.width,
            height: image.height,
        });
    }, [image.height, image.width, image.x, image.y]);

    // 이미지 수정 취소 함수 - 기존 이미지는 원래 상태로 되돌리고, 새로 만든 임시 이미지는 화면에서 제거
    const cancelImageDraft = useCallback(() => {
        if (image.imageId < 0) {
            onDelete(image.imageId, image.publicId);
            onSelectClear();
            return;
        }

        resetImageDraft();
        onSelectClear();
    }, [image.imageId, image.publicId, onDelete, onSelectClear, resetImageDraft]);

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

    // 외부 더블클릭/더블탭 처리 함수 - 더블액션이면 저장 다이얼로그, 단일 액션이면 수정 취소 타이머를 예약
    const handleOutsideDraftAction = useCallback((isDoubleAction: boolean) => {
        if (isDoubleAction) {
            if (clickTimerRef.current) {
                window.clearTimeout(clickTimerRef.current);
                clickTimerRef.current = null;
                setSaveDialogOpen(true);
                return;
            }
        }

        // 300ms 이내에 추가 클릭/탭이 없을시, 선택 상태를 해제하고 변경사항을 되돌림
        clickTimerRef.current = window.setTimeout(() => {
            setCancelDialogOpen(true);
            clickTimerRef.current = null;
        }, 300);
    }, [setCancelDialogOpen]);

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
        setSaveDialogOpen(false);
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

                const now = event.timeStamp;
                const hasPreviousClick = lastClickRef.current.time !== 0;
                const isDoubleClick = hasPreviousClick && lastClickRef.current.area === "outimage" && now - lastClickRef.current.time < 300;
                lastClickRef.current = { time: now, area: "outimage" };
                // 외부 더블클릭/단일클릭 피드백을 처리
                handleOutsideDraftAction(isDoubleClick);
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
                const now = event.timeStamp;
                const isDoubleTap = lastTapRef.current.area === "outimage" && now - lastTapRef.current.time < 300;
                lastTapRef.current = { time: now, area: "outimage" };

                handleOutsideDraftAction(isDoubleTap);
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
            if (clickTimerRef.current) {
                window.clearTimeout(clickTimerRef.current);
            }
        };
    }, [handleOutsideDraftAction, image.imageId, isSelected]);

    return (
        <>
            <Rnd
                className={`image-rnd-${image.imageId} select-none ${isSelected ? "rounded-xl border-2 border-dashed border-pink-500" : ""}`}
                style={{
                    WebkitTouchCallout: "none",
                    WebkitUserSelect: "none",
                    userSelect: "none",
                    touchAction: "none",
                }}
                default={{
                    x: image.x,
                    y: image.y,
                    width: image.width,
                    height: image.height,
                }}
                position={{
                    x: imageState.x,
                    y: imageState.y,
                }}
                size={{
                    width: imageState.width,
                    height: imageState.height,
                }}
                bounds="parent"
                scale={zoom}
                disableDragging={!isSelected}
                enableResizing={isSelected}
                /* 마우스 우클릭 이벤트 - 클릭한 좌표에 컨텍스트 메뉴를 표시 */
                onContextMenu={(event: ReactMouseEvent<HTMLElement>) => {
                    event.preventDefault();
                    if (!canEdit) {
                        onPermissionDenied();
                        return;
                    }
                    if (isTouchDevice()) { return; }

                    const { x, y } = getBoardPoint(event.clientX, event.clientY);
                    setContextMenuPosition({ x, y });
                    setContextMenuOpen(true);
                }}
                /* 모바일에서 길게 누름 이벤트 - 터치한 좌표에 컨텍스트 메뉴를 표시 */
                onPointerDown={(event: PointerEvent) => {
                    if (event.pointerType !== "touch") { return; }
                    if (!canEdit) { return; }

                    const { x, y } = getBoardPoint(event.clientX, event.clientY);
                    longPressRef.current = window.setTimeout(() => {
                        setContextMenuPosition({ x, y });
                        setContextMenuOpen(true);
                    }, 600);
                }}
                onPointerUp={() => {
                    if (longPressRef.current) {
                        window.clearTimeout(longPressRef.current);
                        longPressRef.current = null;
                    }
                }}
                onPointerMove={() => {
                    if (longPressRef.current) {
                        window.clearTimeout(longPressRef.current);
                        longPressRef.current = null;
                    }
                }}
                // 이미지 카드 이동 완료 시 좌표만 임시 저장
                onDragStop={(event, data) => {
                    setImageState((prev) => ({ ...prev, x: data.x, y: data.y }));
                }}
                // 이미지 카드 크기 조절 완료 시 사이즈 정보만 임시 저장
                onResizeStop={(event, direction, ref, delta, position) => {
                    setImageState({
                        x: position.x,
                        y: position.y,
                        width: ref.offsetWidth,
                        height: ref.offsetHeight,
                    });
                }}
            >
                <div
                    className="h-full w-full overflow-hidden rounded-xl bg-white shadow-md"
                    onClick={(event) => event.stopPropagation()}
                    onDoubleClick={selectImage}
                    onPointerDown={handleDoubleTap}
                >
                    <img
                        src={image.secureUrl}
                        alt={image.fileName ?? "Uploaded image"}
                        draggable={false}
                        className="h-full w-full object-contain"
                    />
                </div>
            </Rnd>

            {/* 컨텍스트 메뉴: Delete 버튼이 있는 메뉴 - 이미지 카드에서 우클릭 시 열림 */}
            {contextMenuOpen && (
                <div
                    ref={menuRef}
                    className="fixed bg-white px-3 py-4 shadow-md"
                    style={{
                        left: `${contextMenuPosition.x}px`,
                        top: `${contextMenuPosition.y}px`,
                    }}
                >
                    {/* Delete 버튼 */}
                    <PressableButton
                        variant="menu"
                        onClick={() => {
                            setContextMenuOpen(false);
                            setSaveDialogOpen(false);
                            setDeleteDialogOpen(true);
                        }}
                    >
                        Delete
                    </PressableButton>
                </div>
            )}

            {/* 저장 확인 다이얼로그 - 이미지 카드 영역 외부 더블클릭/더블탭 시 열림 */}
            {saveDialogOpen && (
                <ConfirmDialog
                    message="Save changes?"
                    onConfirm={() => {
                        saveImageDraft();
                        setSaveDialogOpen(false);
                        onSelectClear();
                    }}
                    onCancel={() => {
                        cancelImageDraft();
                        setSaveDialogOpen(false);
                    }}
                />
            )}

            {/* 삭제 확인 다이얼로그 - Yes 클릭 시 이미지 삭제 */}
            {deleteDialogOpen && (
                <ConfirmDialog
                    message="Delete this image?"
                    onConfirm={() => {
                        onDelete(image.imageId, image.publicId);
                        setDeleteDialogOpen(false);
                        onSelectClear();
                    }}
                    onCancel={() => {
                        setDeleteDialogOpen(false);
                    }}
                />
            )}

            {/* 수정 취소 확인 다이얼로그 - Yes 클릭 시 이미지 수정 취소 */}
            {cancelDialogOpen && (
                <ConfirmDialog
                    message="Discard changes?"
                    onConfirm={() => {
                        setCancelDialogOpen(false);
                        cancelImageDraft();
                        onSelectClear();
                    }}
                    onCancel={() => {
                        setCancelDialogOpen(false);
                    }}
                />
            )}


        </>
    );
}
