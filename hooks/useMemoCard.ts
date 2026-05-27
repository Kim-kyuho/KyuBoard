import { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { DraggableData, RndDragEvent, RndResizeCallback } from "react-rnd";

export interface MemoCardMemo {
    id: number;
    boardId: number;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    isPublic: boolean;
}

type UseMemoCardOptions = {
    memo: MemoCardMemo;
    zoom: number;
    canEdit: boolean;
    isFocused: boolean;
    onFocus: () => void;
    onFocusClear: () => void;
    onPermissionDenied: () => void;
    onInsert: (
        tempId: number,
        boardId: number,
        content: string,
        x: number,
        y: number,
        width: number,
        height: number,
        color: string,
        isPublic: boolean
    ) => void;
    onUpdate: (
        id: number,
        boardId: number,
        content: string,
        x: number,
        y: number,
        width: number,
        height: number,
        color: string,
        isPublic: boolean
    ) => void;
    onDelete: (id: number) => void;
};

export function useMemoCard({
    memo,
    zoom,
    canEdit,
    isFocused,
    onFocus,
    onFocusClear,
    onPermissionDenied,
    onInsert,
    onUpdate,
    onDelete,
}: UseMemoCardOptions) {
    // 컨텍스트 메뉴 오픈: Edit, Delete 버튼이 있는 메뉴 - 메모 카드에서 우클릭 시 열림
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    // 메모 편집가능 상태
    const [isEditing, setIsEditing] = useState(false);
    // 메모 삭제 확인 다이얼로그 오픈 상태
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    // 메모 이동 핸들을 누르고 있는 상태
    const [dragHandlePressed, setDragHandlePressed] = useState(false);
    // 메모 리사이즈 중 상태
    const [isResizing, setIsResizing] = useState(false);
    // 컨텍스트 메뉴 위치 상태
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    // 컨텍스트 메뉴 외부 클릭 감지를 위한 ref - 메뉴 영역 외부 클릭 시 메뉴 닫기
    const menuRef = useRef<HTMLDivElement | null>(null);
    // 메모 에디터 포커스용 ref - 편집 모드 진입 시 메모 에디터 영역에 포커스 주기 위해 사용
    const memoFocusRef = useRef<HTMLDivElement | null>(null);
    // 모바일에서 메모 내부 더블탭 이벤트 감지를 위한 ref - 직전의 탭 시간을 저장
    const lastMemoTapRef = useRef(0);
    const outsideTouchStartRef = useRef<{ x: number; y: number } | null>(null);
    // 보드 드래그 스크롤 여부 확인 전까지 외부 클릭 피드백을 잠시 지연하기 위한 ref
    const pendingOutsideActionRef = useRef<number | null>(null);
    // 모바일에서 길게 누름 이벤트 감지를 위한 ref
    const longPressRef = useRef<number | null>(null);

    // 메모 카드의 위치, 크기, 내용, 색상, 공개/비공개 상태
    const [memoState, setMemoState] = useState({
        x: memo.x,
        y: memo.y,
        width: memo.width ?? 300,
        height: memo.height ?? 200,
    });
    // 메모 내용 상태 - 편집 모드에서 텍스트 영역의 내용을 저장하기 위해 사용
    const [memoContent, setMemoContent] = useState(memo.content);

    const insertMemo = useCallback(() => {
        onInsert(
            memo.id,
            memo.boardId,
            memoContent,
            Math.round(memoState.x),
            Math.round(memoState.y),
            Math.round(memoState.width),
            Math.round(memoState.height),
            memo.color,
            memo.isPublic
        );
    }, [memo.id, memo.boardId, memoContent, memoState.x, memoState.y, memoState.width, memoState.height, memo.color, memo.isPublic, onInsert]);

    // 메모 갱신 함수 - 메모 카드 이동, 크기 조절, 내용 변경 시 호출되어 변경된 메모 정보를 부모 컴포넌트로 전달
    const updateMemo = useCallback(() => {
        onUpdate(
            memo.id,
            memo.boardId,
            memoContent,
            Math.round(memoState.x),
            Math.round(memoState.y),
            Math.round(memoState.width),
            Math.round(memoState.height),
            memo.color,
            memo.isPublic
        );
    }, [memo.id, memo.boardId, memoContent, memoState.x, memoState.y, memoState.width, memoState.height, memo.color, memo.isPublic, onUpdate]);

    // 메모 저장 함수 - 임시 메모는 Insert, 기존 메모는 Update 처리
    const saveMemo = useCallback(() => {
        if (memo.id < 0) {
            insertMemo();
            return;
        }

        updateMemo();
    }, [insertMemo, memo.id, updateMemo]);

    // 터치 디바이스 여부를 판단하는 함수
    const isTouchDevice = () =>
        // 브라우저 환경에서 윈도우 존재 확인, 터치 이벤트 및 최대 터치 포인트 지원 여부를 통해 터치 디바이스를 판별
        typeof window !== "undefined" &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    // 메모 수정에 대한 함수
    const editMemo = useCallback(() => {
        // 메모 수정이 불가능 한 상태일때 (미접속, 미허가)
        // 허가 메시지를 출력하고 리턴
        if (!canEdit) {
            onPermissionDenied();
            return;
        }
        setIsEditing(true);
        onFocus();
        window.setTimeout(() => {memoFocusRef.current?.focus();
    }, 0);
    }, [canEdit, onFocus, onPermissionDenied]);

    // 모바일에서 더블탭 이벤트 감지를 위한 함수 - 터치 디바이스에서 텍스트 영역을 더블탭하면 편집 모드로 전환
    const handleDoubleTap = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== "touch") { return; }
        // 현재시간
        const currentTime = event.timeStamp;
        // 300ms 이내의 두 번째 탭을 더블탭으로 인식
        const isDoubleTap = currentTime - lastMemoTapRef.current < 300;
        lastMemoTapRef.current = currentTime;
        // 더블탭이 감지되면 편집 모드로 전환
        if (isDoubleTap) {
            event.preventDefault();
            editMemo();
        }
    };

    const getBoardPoint = (clientX: number, clientY:number) => {
        const board = document.querySelector(".kyu-board");
        const boardRect = board?.getBoundingClientRect();

        return {
            x: boardRect ? (clientX - boardRect.left) / zoom : clientX,
            y: boardRect ? (clientY - boardRect.top) / zoom : clientY,
        };
    };

    // 화면 전체 클릭 감지 & React 컴포넌트 바깥클릭을 감지하기 위해 글로벌 마우스이벤트 사용(안정성 확보)
    // 수정중인 메모에 대한 피드백
    useEffect(() => {
        const handleClickOutside = (event: PointerEvent) => {
            const target = event.target as Node;
            // 이벤트를 엘리멘트로 다루기 위한 체크
            const targetElement = target instanceof Element ? target : null;
            // 컨텍스트 메뉴 안쪽에서 이벤트가 발생했는지 체크
            const isClickInsideMenu = menuRef.current?.contains(target);
            // 보드 툴바 안쪽에서 이벤트가 발생했는지 체크
            const isClickInsideBoardToolBar = targetElement?.closest(".board-toolbar");
            // 메모 안쪽에서 이벤가 발생헀는지 체크 (해당하는 클래스가 존재할 때, 그 엘리멘트 요소를 반환)
            const isClickInsideMemo = targetElement?.closest(`.memo-rnd-${memo.id}`);
            // 다른 메모를 포함한 RND 메모 영역에서 이벤트가 발생했는지 체크
            const isClickInsideAnyMemo = targetElement?.closest("[class*='memo-rnd-']");

            // 보드 빈 영역에서 발생한 이벤트인지 체크
            const isClickInsideBoard = targetElement?.closest(".kyu-board");
            const isClickInsideEmptyBoard = Boolean(
                isClickInsideBoard &&
                !isClickInsideAnyMemo &&
                !isClickInsideMenu &&
                !isClickInsideBoardToolBar 
            );

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

            // 메모가 수정 가능한 상태에서는 현재 메모와 확인 다이얼로그 이외의 이벤트를 제한
            if (isEditing && !isClickInsideMemo) {
                setContextMenuOpen(false);

                //보드 빈 영역은 드래그 스크롤을 위해 pointerdown 이벤트를 막지 않음
                if (isClickInsideEmptyBoard) {
                    if (event.pointerType === "touch") {
                        outsideTouchStartRef.current = { x: event.clientX, y: event.clientY };
                        return;
                    }
                    saveMemo();
                    setIsEditing(false);
                    setContextMenuOpen(false);
                    return;
                }
            }

            // 다이얼로그 안쪽에 클릭 이벤트가 발생한 경우 리턴
            if (isClickInsideBoardToolBar || isClickInsideMenu) {
                return;
            }
            // 보드 드래그 스크롤 중에는 메모 외부 클릭 피드백을 실행하지 않음
            if (document.documentElement.dataset.boardPanning === "true") {
                return;
            }
            // 컨텍스트 메뉴 안쪽에 클릭 이벤트가 발생하지 않았을 경우 Context메모를 닫음
            if (!isClickInsideMenu) {
                setContextMenuOpen(false);
            }
            if (!isClickInsideMemo && !isClickInsideAnyMemo && !isClickInsideMenu && isFocused) {
                runAfterBoardPanCheck(onFocusClear);
                return;
            }

            outsideTouchStartRef.current = null;
        };
        // 터치 기기를 위한 핸들러 - 메모나 컨텍스트 메뉴 외부를 클릭한 경우
        const handleTouchOutside = (event: PointerEvent) => {
            if (event.pointerType !== "touch" || !outsideTouchStartRef.current || !isEditing) {
                return;
            }
            // 터치 누르는 점과 떼는 점의 거리를 계산함
            const deltaX = event.clientX - outsideTouchStartRef.current.x;
            const deltaY = event.clientY - outsideTouchStartRef.current.y;
            const moved = Math.hypot(deltaX, deltaY);
            outsideTouchStartRef.current = null;

            // 터치 누르는 점과 때는 점 거리가 10px미만인 경우 외부 더블탭을 체크
            if (moved < 10) {
                saveMemo();
                setIsEditing(false);
                setContextMenuOpen(false);
            }
            return;

        };
        // 외부 터치의 시작 좌표를 클리어
        const clearOutsideTouchStart = () => {
            outsideTouchStartRef.current = null;
        };
        // 편집 중 외부 클릭이 다른 메모의 포커스/편집 이벤트로 이어지는 것을 차단
        const blockOutsideClickWhileEditing = (event: MouseEvent) => {
            if (!isEditing) {
                return;
            }

            const target = event.target as Node;
            const targetElement = target instanceof Element ? target : null;
            // RND의 이벤트, 확인 다이얼로그의 경우 이벤트가 차단 되지 않도로 예외 설정
            const isClickInsideMemo = targetElement?.closest(`.memo-rnd-${memo.id}`);

            if (isClickInsideMemo) {
                return;
            }

            event.preventDefault();
            event.stopImmediatePropagation ();
        };
        // 누르기 동작은 handleClickOutside 함수에 적용, 떼기 동작은 handleTouchOutsideEnd에 적용, 취소는 clearOutsideTouchStart에 적용
        document.addEventListener("pointerdown", handleClickOutside, true);
        document.addEventListener("click", blockOutsideClickWhileEditing, true);
        document.addEventListener("pointerup", handleTouchOutside);
        document.addEventListener("pointercancel", clearOutsideTouchStart);
        return () => {
            document.removeEventListener("pointerdown", handleClickOutside, true);
            document.removeEventListener("click", blockOutsideClickWhileEditing, true); 
            document.removeEventListener("pointerup", handleTouchOutside);
            document.removeEventListener("pointercancel", clearOutsideTouchStart);
            if (pendingOutsideActionRef.current) {
                window.clearTimeout(pendingOutsideActionRef.current);
            }
        };
    }, [
        isEditing, isFocused, memo.id, saveMemo, onFocusClear]);

    // 메모 단일 클릭 시 해당 메모에 포커스를 적용
    const handleMemoClick = (event: ReactMouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        onFocus();
    };

    const handleContextMenu = (event: ReactMouseEvent<HTMLElement>) => {
        event.preventDefault();
        // 메모 수정이 불가능 한 상태일때 (미접속, 미허가)
        if (!canEdit) {
            // 허가 메시지를 출력하고 리턴
            onPermissionDenied();
            return;
        }
        if (isTouchDevice()) { return; }
        // 보드로부터 좌표 GET
        const { x, y } = getBoardPoint(event.clientX, event.clientY);
        setContextMenuPosition({ x, y });
        setContextMenuOpen(true);
    };

    const handleContextMenuTouch = (event: ReactPointerEvent<HTMLElement>) => {
        if (event.pointerType !== "touch") return;
        if (!canEdit) {
            return;
        }
        // 보드로부터 좌표 GET
        const { x, y } = getBoardPoint(event.clientX, event.clientY);

        longPressRef.current = window.setTimeout(() => {
            setContextMenuPosition({ x, y });
            setContextMenuOpen(true);
        }, 600);
    };

    const clearLongPress = () => {
        if (longPressRef.current) {
            clearTimeout(longPressRef.current);
            longPressRef.current = null;
        }
    };

    // 메모 카드 이동 완료 시 좌표 저장
    const handleDragStop = (_event: RndDragEvent, data: DraggableData) => {
        setMemoState((prev) => ({ ...prev, x: data.x, y: data.y }));
    };

    // 메모 카드 크기 조절 시작 시 피드백 표시
    const handleResizeStart = () => {
        setIsResizing(true);
    };

    // 메모 카드 크기 조절 완료 시 사이즈 정보 저장
    const handleResizeStop: RndResizeCallback = (_event, _direction, ref, _delta, position) => {
        setIsResizing(false);
        setMemoState({
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
        onDelete(memo.id);
        setDeleteDialogOpen(false);
    };

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false);
    };

    return {
        contextMenuOpen,
        contextMenuPosition,
        menuRef,
        isEditing,
        memoFocusRef,
        memoState,
        memoContent,
        setMemoContent,
        deleteDialogOpen,
        dragHandlePressed,
        setDragHandlePressed,
        isResizing,
        editMemo,
        handleDoubleTap,
        handleMemoClick,
        handleContextMenu,
        handleContextMenuTouch,
        clearLongPress,
        handleDragStop,
        handleResizeStart,
        handleResizeStop,
        openDeleteDialog,
        confirmDelete,
        closeDeleteDialog,
    };
}
