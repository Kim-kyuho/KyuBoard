import { useCallback, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import PressableButton from "@/components/PressableButton";
import ConfirmDialog from "@/components/ConfrimDialog";
import MemoEditor from "./MemoEditor";


// 메모 카드 컴포넌트
interface MemoCardProps {
    id : number;
    boardId: number;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color : string;
    isPublic: boolean;
}

type MemoPointerArea = "inmemo" | "outmemo";

type LastPointerAction = {
    time: number;
    area: MemoPointerArea;
};

export default function MemoCard({ memo, zoom, canEdit, isFocused, onFocus, onFocusClear, onPermissionDenied, onInsert, onUpdate, onDelete}: { 
    memo: MemoCardProps; 
    zoom: number;
    canEdit: boolean;
    isFocused: boolean;
    onFocus: () => void;
    onFocusClear: () => void;
    onPermissionDenied: () => void;
    onInsert:(
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
    onDelete: (
        id: number
    ) => void; 
    })
   {
    // 컨텍스트 메뉴 오픈: Edit, Delete 버튼이 있는 메뉴 - 메모 카드에서 우클릭 시 열림
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    // 메모 편집가능 상태
    const [isEditing, setIsEditing] = useState(false);
    // 메모 저장 확인 다이얼로그 오픈 상태
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    // 메모 삭제 확인 다이얼로그 오픈 상태
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    // 메모 수정 취소 확인 다이얼로그 오픈 상태
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    // 컨텍스트 메뉴 위치 상태
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    // 컨텍스트 메뉴 외부 클릭 감지를 위한 ref - 메뉴 영역 외부 클릭 시 메뉴 닫기
    const menuRef = useRef<HTMLDivElement | null>(null);
    // 메모 전체 영역을 감싸는 div의 ref - closest(.memo-rnd-${memo.id})로 변경함에 따라 사용중지
    // const divRef = useRef<HTMLDivElement | null>(null);
    // 메모 에디터 포커스용 ref - 편집 모드 진입 시 메모 에디터 영역에 포커스 주기 위해 사용
    const memoFocusRef = useRef<HTMLDivElement | null>(null);
    // 모바일에서 더블탭 이벤트 감지를 위한 ref - 직전의 탭 시간과 영역을 저장
    const lastTapRef = useRef<LastPointerAction>({ time: 0, area: "outmemo" });
    const outsideTouchStartRef = useRef<{ x: number; y: number } | null>(null);
    // 더블클릭 이벤트 감지를 위한 ref - 직전의 클릭 시간과 영역을 저장
    const lastClickRef = useRef<LastPointerAction>({ time: 0, area: "outmemo" });
    // 더블클릭에서 첫번째 클릭시 두번클릭까지 걸리는 시간 감지를 위한 ref
    const clickTimerRef = useRef<number | null>(null);
    // 보드 드래그 스크롤 여부 확인 전까지 외부 클릭 피드백을 잠시 지연하기 위한 ref
    const pendingOutsideActionRef = useRef<number | null>(null);

    // 메모 카드의 위치, 크기, 내용, 색상, 공개/비공개 상태
    const [memoState, setMemoState] = useState({
        x: memo.x,
        y: memo.y,
        width: memo.width ?? 300,
        height: memo.height ?? 200,
    });
    // 메모 내용 상태 - 편집 모드에서 텍스트 영역의 내용을 저장하기 위해 사용
    const [memoContent, setMemoContent] = useState(memo.content);
    // 메모 수정 취소 함수 - 저장하지 않은 내용, 위치, 크기를 원래 메모 정보로 되돌림
    const resetMemoDraft = useCallback(() => {
        setMemoContent(memo.content);
        setMemoState({
            x: memo.x,
            y: memo.y,
            width: memo.width ?? 300,
            height: memo.height ?? 200,
        });
    }, [memo.content, memo.height, memo.width, memo.x, memo.y]);
    // 메모 수정 취소 함수 - 기존 메모는 원래 상태로 되돌리고, 새로 만든 임시 메모는 화면에서 제거
    const cancelMemoDraft = useCallback(() => {
        if (memo.id < 0) {
            onDelete(memo.id);
            onFocusClear();
            return;
        }

        resetMemoDraft();
        setIsEditing(false);
        onFocusClear();
    }, [memo.id, onDelete, onFocusClear, resetMemoDraft]);
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
    },[memo.id, memo.boardId, memoContent, memoState.x, memoState.y, memoState.width, memoState.height, memo.color, memo.isPublic, onInsert]);
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
    },[ memo.id, memo.boardId, memoContent, memoState.x, memoState.y, memoState.width, memoState.height, memo.color, memo.isPublic, onUpdate]);
    

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
        // 300ms 이내에 추가 클릭/탭이 없을시, 수정 취소 확인 다이얼로그를 오픈
        clickTimerRef.current = window.setTimeout(() => {
            setCancelDialogOpen(true);
            clickTimerRef.current = null;
        }, 300);
    }, []);

    // 터치 디바이스 여부를 판단하는 함수
    const isTouchDevice = () =>
        // 브라우저 환경에서 윈도우 존재 확인, 터치 이벤트 및 최대 터치 포인트 지원 여부를 통해 터치 디바이스를 판별
        typeof window !== "undefined" && 
        ("ontouchstart" in window || navigator.maxTouchPoints > 0);
        // 모바일에서 더블탭 이벤트 감지를 위한 함수 - 터치 디바이스에서 텍스트 영역을 더블탭하면 편집 모드로 전환  
        const handleDoubleTap = (event: ReactPointerEvent<HTMLDivElement>) => {
            if (event.pointerType !== "touch") { return; }
            // 현재시간
            const currentTime = event.timeStamp;
            // 300ms 이내의 두 번째 탭을 더블탭으로 인식
            const isDoubleTap = lastTapRef.current.area === "inmemo" && currentTime - lastTapRef.current.time < 300;
            lastTapRef.current = { time: currentTime, area: "inmemo" };
            // 더블탭이 감지되면 편집 모드로 전환
            if (isDoubleTap) {
                event.preventDefault();
                editMemo();
            }
        }

        const getBoardPoint = (clientX: number, clientY:number) => {
            const board = document.querySelector(".kyu-board");
            const boardRect = board?.getBoundingClientRect();

            return {
                x: boardRect ? (clientX - boardRect.left) / zoom : clientX,
                y: boardRect ? (clientY - boardRect.top) / zoom : clientY,
            };
    }
    // 화면 전체 클릭 감지 & React 컴포넌트 바깥클릭을 감지하기 위해 글로벌 마우스이벤트 사용(안정성 확보)
    // 수정중인 메모에 대한 피드백
    useEffect(() => {
        // const handleClickOutside = (event: PointerEvent<HTMLDivElement>) => {
        //     if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        //         setContextMenuOpen(false);
        //     }
        // };
        // document.addEventListener("mousedown", handleClickOutside);
        // return () => {
        //     document.removeEventListener("mousedown", handleClickOutside);
        // };
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
            // 메모 안쪽에서 이벤가 발생헀는지 체크 (해당하는 클래스가 존재할 때, 그 엘리멘트 요소를 반환)
            const isClickInsideMemo = targetElement?.closest(`.memo-rnd-${memo.id}`);
            // 다른 메모를 포함한 RND 메모 영역에서 이벤트가 발생했는지 체크
            const isClickInsideAnyMemo = targetElement?.closest("[class*='memo-rnd-']");

            // 메모가 수정 가능한 상태에서는 현재 메모와 확인 다이얼로그 이외의 이벤트를 제한
            if (isEditing && !isClickInsideMemo && !isClickInsideConfirmDialog) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                setContextMenuOpen(false);

                const now = event.timeStamp;
                const hasPreviousClick = lastClickRef.current.time !== 0;
                const isDoubleClick = hasPreviousClick && lastClickRef.current.area === "outmemo" && now - lastClickRef.current.time < 300;
                lastClickRef.current = { time: now, area: "outmemo" };

                handleOutsideDraftAction(isDoubleClick);
                return;
            }

            // 다이얼로그 안쪽에 클릭 이벤트가 발생한 경우 리턴
            if (isClickInsideBoardToolBar || isClickInsideConfirmDialog) {
                return;
            }
            // 보드 드래그 스크롤 중에는 메모 외부 클릭 피드백을 실행하지 않음
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
            // 컨텍스트 메뉴 안쪽에 클릭 이벤트가 발생하지 않았을 경우 Context메모를 닫음
            if (!isClickInsideMenu) {
                setContextMenuOpen(false);
            }
            if (!isClickInsideMemo && !isClickInsideAnyMemo && !isClickInsideMenu && isFocused) {
                runAfterBoardPanCheck(onFocusClear);
                return;
            }

            outsideTouchStartRef.current = null;
        }

        /* 피드백 변경으로 인한 사용중지 - RND외부에서 원터치 원클릭으로 저장 다이얼로그를 호출했던 동작을 더블클릭으로 변경 */
        // 터치 기기를 위한 핸들러 - 메모나 컨텍스트 메뉴 외부를 클릭한 경우 
        const handleTouchOutsideEnd = (event: PointerEvent) => {
        //     // 터치가 아닐 경우 리턴
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
                const now = event.timeStamp;
                const isDoubleTap = lastTapRef.current.area === "outmemo" && now - lastTapRef.current.time < 300;
                lastTapRef.current = { time: now, area: "outmemo" };

                // 외부 더블탭/단일탭 피드백을 처리
                handleOutsideDraftAction(isDoubleTap);
                return;
            }
        }
        // 외부 터치의 시작 좌표를 클리어
        const clearOutsideTouchStart = () => {
            outsideTouchStartRef.current = null;
        }
        // 편집 중 외부 클릭이 다른 메모의 포커스/편집 이벤트로 이어지는 것을 차단
        const blockOutsideClickWhileEditing = (event: MouseEvent) => {
            if (!isEditing) {
                return;
            }

            const target = event.target as Node;
            const targetElement = target instanceof Element ? target : null;
            const isClickInsideMemo = targetElement?.closest(`.memo-rnd-${memo.id}`);
            const isClickInsideConfirmDialog = targetElement?.closest(".confirm-dialog");

            if (isClickInsideMemo || isClickInsideConfirmDialog) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        };
        // 누르기 동작은 handleClickOutside 함수에 적용, 떼기 동작은 handleTouchOutsideEnd에 적용, 취소는 clearOutsideTouchStart에 적용
        document.addEventListener("pointerdown", handleClickOutside, true);
        document.addEventListener("click", blockOutsideClickWhileEditing, true);
        document.addEventListener("pointerup", handleTouchOutsideEnd);
        document.addEventListener("pointercancel", clearOutsideTouchStart);
        return () => {
            document.removeEventListener("pointerdown", handleClickOutside, true);
            document.removeEventListener("click", blockOutsideClickWhileEditing, true);
            document.removeEventListener("pointerup", handleTouchOutsideEnd);
            document.removeEventListener("pointercancel", clearOutsideTouchStart);
            if (clickTimerRef.current) {
                window.clearTimeout(clickTimerRef.current);
            }
            if (pendingOutsideActionRef.current) {
                window.clearTimeout(pendingOutsideActionRef.current);
            }
        };
    }, [handleOutsideDraftAction, isEditing, isFocused, memo.id, onFocusClear]);
    
    // 메모 수정에 대한 함수
    const editMemo = () => {
        // 메모 수정이 불가능 한 상태일때 (미접속, 미허가)
        // 허가 메시지를 출력하고 리턴
        if (!canEdit) {
            onPermissionDenied();
            return;
        }
        setIsEditing(true);
        onFocus();
        setSaveDialogOpen(false);
        setCancelDialogOpen(false);
        window.setTimeout(() => {memoFocusRef.current?.focus();
    }, 0);
        
    }
    // 메모 단일 클릭 시 해당 메모에 포커스를 적용
    const handleMemoClick = (event: ReactMouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        onFocus();
    };
    // 모바일에서 길게 누름 이벤트 감지를 위한 ref
    const longPressRef = useRef<number| null>(null);
    // const openContextMenu = (x: number, y: number) => {
    //     setContextMenuPosition({ x, y });
    //     setContextMenuOpen(true);
    // };

    return (
        <>
            <Rnd 
                className={`memo-rnd-${memo.id} select-none rounded-xl ${isFocused ? "ring-2 ring-indigo-700 ring-offset-2" : ""}`}
                style={{
                    WebkitTouchCallout: "none",
                    WebkitUserSelect: isEditing ? "text" : "none",
                    userSelect: isEditing ? "text" : "none",
                    touchAction: isEditing ? "auto" : "none",
                    cursor: isEditing ? "text" : "default",
                }}
                default={{
                    x: memo.x,
                    y: memo.y,
                    width: memo.width ?? 300,
                    height: memo.height ?? 200,
                }}
                position={{
                    x: memoState.x,
                    y: memoState.y,
                }}
                size={{
                    width: memoState.width,
                    height: memoState.height,
                }}
                bounds="parent"
                scale={zoom}
                // 텍스트가 활성화되어 있을 때만 드래그 가능
                disableDragging={ !isEditing || !canEdit }
                // 텍스트가 활성화되어 있을 때만 크기 조절 가능
                enableResizing={ isEditing } 
                /* 마우스 우클릭 이벤트 - 클릭한 좌표에 컨텍스트 메뉴를 표시 */
                onContextMenu={(e: ReactMouseEvent<HTMLElement>) => {
                    e.preventDefault();
                    // 메모 수정이 불가능 한 상태일때 (미접속, 미허가)
                    if (!canEdit) {
                        // 허가 메시지를 출력하고 리턴
                        onPermissionDenied();
                        return;
                    }
                    if(isTouchDevice()) { return; }
                    // 보드로부터 좌표 GET
                    const {x, y} = getBoardPoint(e.clientX, e.clientY);
                    setContextMenuPosition({ x, y });
                    setContextMenuOpen(true);
                }}

                /* 모바일에서 길게 누름 이벤트 - 터치한 좌표에 컨텍스트 메뉴를 표시 */      
                onPointerDown={(e: PointerEvent) => {
                    if (e.pointerType !== "touch") return;
                    if (!canEdit) {
                        return;
                    }
                    // 보드로부터 좌표 GET
	                const {x, y} = getBoardPoint(e.clientX, e.clientY);

                    longPressRef.current = window.setTimeout(() => {
                        setContextMenuPosition({ x, y });
                        setContextMenuOpen(true);
                    }, 600);
                }}
                onPointerUp={() => {
                    if (longPressRef.current) {
                        clearTimeout(longPressRef.current);
                    }
                }}
                onPointerMove={() => {
                    if (longPressRef.current) {
                        clearTimeout(longPressRef.current);
                    }
                }}

                // 메모 카드 이동 완료 시 좌표 저장
                onDragStop={(e, d) => {
                    setMemoState((prev) => ({ ...prev, x: d.x, y: d.y }));
                }}
                // 메모 카드 크기 조절 완료 시 사이즈 정보 저장
                onResizeStop={(e, direction, ref, delta, position) => {
                    setMemoState({
                        x: position.x,
                        y: position.y,
                        width: ref.offsetWidth,
                        height: ref.offsetHeight,
	                    }); 
	                }}
            >   
                {/* 메모 카드 내용 영역 - 공개 메모는 내용 표시, 비공개 메모는 "비공개 메모입니다." 표시 */}
                <div //ref={divRef} - closest(.memo-rnd-${memo.id})로 변경함에 따라 사용중지
                    className="h-full w-full"
                    onClick={handleMemoClick}
                >
                    {memo.isPublic ? (
                        // 편집 모드에서는 텍스트 영역, 일반 모드에서는 div로 내용을 표시
                        isEditing ? (
                            <div
                                className="h-full w-full rounded-xl p-4 shadow-md text-neutral-900"
                                ref={memoFocusRef}
                                tabIndex={-1}
                                style={{
                                    backgroundColor: "#fffadc",
                                    cursor: "text",
                                }}
                            >
                            <MemoEditor
                                content={memoContent}
                                onChange={setMemoContent}
                            />
                            </div>
                            
                        ) : (
                            <div
                                className="h-full w-full rounded-xl p-4 shadow-md text-neutral-900"
                                style={{
                                    backgroundColor: "#fffadc",
                                    WebkitTouchCallout: "none",
                                    WebkitUserSelect: "none",
                                    userSelect: "none",
                                    touchAction: "none",
                                }}
                                onDoubleClick={editMemo}
                                onPointerDown={handleDoubleTap}
                            >
                                <div
                                    className="memo-editor-content"
                                    dangerouslySetInnerHTML={{ __html: memoContent }}
                                />
                            </div>
                        )
                    ) : (
                        <div
                            className="h-full w-full rounded-xl p-4 shadow-md text-neutral-900"
                            style={{
                                backgroundColor: "#fffadc",
                                WebkitTouchCallout: "none",
                                WebkitUserSelect: "none",
                                userSelect: "none",
                                touchAction: "none",
                            }}
                        >
	                            This memo is private.
	                        </div>
                    )}
                </div>
            </Rnd>
        
	        {/* 컨텍스트 메뉴: Edit, Delete 버튼이 있는 메뉴 - 메모 카드에서 우클릭 시 열림 */}
            {contextMenuOpen && (
                <div 
                    ref={menuRef}
                    className=" fixed bg-white px-3 py-4 shadow-md"
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
                            setCancelDialogOpen(false);
                            setIsEditing(false);
                            setDeleteDialogOpen(true);
                        }}>    
                        Delete
                    </PressableButton>
                </div>
                )
            }
            {/* 저장 확인 다이얼로그 - 메모 카드 영역 외부 클릭 시 열림, Yes 클릭 시 메모 저장, No 클릭 시 페이지 새로고침하여 변경사항 무시 */}
            {saveDialogOpen && (
                <ConfirmDialog 
                    message="Save changes?"
                    onConfirm={() => {
                        if (memo.id < 0){
                            insertMemo();
                        } else{
                            updateMemo();
                        }
                        setSaveDialogOpen(false);
                        setIsEditing(false);
                    }}
                    onCancel={() => {
                        cancelMemoDraft();
                        setSaveDialogOpen(false);
                    }}
                />
            )}
            {/* 수정 취소 확인 다이얼로그 - Yes 클릭 시 메모 수정 취소 */}
            {cancelDialogOpen && (
                <ConfirmDialog
                    message="Discard changes?"
                    onConfirm={() => {
                        setCancelDialogOpen(false);
                        cancelMemoDraft();
                    }}
                    onCancel={() => {
                        setCancelDialogOpen(false);
                    }}
                />
            )}
            {/* 저장 확인 다이얼로그와 삭제 확인 다이얼로그 - 각각의 다이얼로그에서 Yes 클릭 시 메모 저장 또는 삭제, No 클릭 시 다이얼로그 닫기 */}
            {deleteDialogOpen && (
                <ConfirmDialog
                    message="Delete this memo?"
                    onConfirm={() => {
                        onDelete(memo.id);
                        setDeleteDialogOpen(false);
                    }}
                    onCancel={() => {
                        setDeleteDialogOpen(false);
                    }}
                />
            )}
	        </>    
	    );
	}
