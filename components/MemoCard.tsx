import { useCallback, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import PressableButton from "@/components/PressableButton";
import ConfirmDialog from "@/components/ConfrimDialog";



// 메모 카드 컴포넌트
interface MemoCardProps {
    id : number;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color : string;
    isPublic: boolean;
}
export default function MemoCard({ memo, zoom, canEdit, onPermissionDenied, onInsert, onUpdate, onDelete}: { 
	    memo: MemoCardProps; 
	    zoom: number;
        canEdit: boolean;
        onPermissionDenied: () => void;
	    onInsert:(
        tempId: number,
        borderId: number,
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
            1,
            memoContent,
            Math.round(memoState.x),
            Math.round(memoState.y),
            Math.round(memoState.width),
            Math.round(memoState.height),
            memo.color,
            memo.isPublic
        );
    },[memo.id, memoContent, memoState.x, memoState.y, memoState.width, memoState.height, memo.color, memo.isPublic, onInsert]);
    // 메모 갱신 함수 - 메모 카드 이동, 크기 조절, 내용 변경 시 호출되어 변경된 메모 정보를 부모 컴포넌트로 전달
    const updateMemo = useCallback(() => {
        onUpdate(
            memo.id,
            memoContent,
            Math.round(memoState.x),
            Math.round(memoState.y),
            Math.round(memoState.width),
            Math.round(memoState.height),
            memo.color,
            memo.isPublic
        );
    },[ memo.id, memoContent, memoState.x, memoState.y, memoState.width, memoState.height, memo.color, memo.isPublic, onUpdate]);
    // 컨텍스트 메뉴 오픈: Edit, Delete 버튼이 있는 메뉴 - 메모 카드에서 우클릭 시 열림
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    // 메모 편집가능 상태
    const [isEditing, setIsEditing] = useState(false);
    // 메모 저장 확인 다이얼로그 오픈 상태
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    // 메모 삭제 확인 다이얼로그 오픈 상태
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    // 컨텍스트 메뉴 위치 상태
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    // 컨텍스트 메뉴 외부 클릭 감지를 위한 ref - 메뉴 영역 외부 클릭 시 메뉴 닫기
    const menuRef = useRef<HTMLDivElement | null>(null);
    // 메모 전체 영역을 감싸는 div의 ref - closest(.memo-rnd-${memo.id})로 변경함에 따라 사용중지
    // const divRef = useRef<HTMLDivElement | null>(null);
    // 메모 내용 편집을 위한 ref - 편집 모드에서 텍스트 영역에 포커스 주기 위해 사용
    const memoRef = useRef<HTMLTextAreaElement | null>(null);
    // 저장 확인 다이얼로그 내부 클릭 감지를 위한 ref 
    const saveDialogRef = useRef<HTMLDivElement | null>(null);
    // 삭제 확인 다이얼로그 내부 클릭 감지를 위한 ref
    const deleteDialogRef = useRef<HTMLDivElement | null>(null);
    // 모바일에서 더블탭 이벤트 감지를 위한 ref - 직전의 탭 시간을 저장
    const lastTapRef = useRef<number>(0);
    const outsideTouchStartRef = useRef<{ x: number; y: number } | null>(null);

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
        const isDoubleTap = currentTime - lastTapRef.current < 300;
        lastTapRef.current = currentTime;
        // 더블탭이 감지되면 편집 모드로 전환
        if (isDoubleTap) {
            event.preventDefault();
            editMemo();
        }
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
            // 저장 다이얼로그 안쪽에서 이벤트가 발생했는지 체크
            const isClickInsideSaveDialog = saveDialogRef.current?.contains(target);
            // 삭제 다이얼로그 안쪽에서 이벤트가 발생했는지 체크
            const isClickInsideDeleteDialog = deleteDialogRef.current?.contains(target);
            // 메모 안쪽에서 이벤가 발생헀는지 체크 (해당하는 클래스가 존재할 때, 그 엘리멘트 요소를 반환)
            const isClickInsideMemo = targetElement?.closest(`.memo-rnd-${memo.id}`);
            // 다이얼로그 안쪽에 클릭 이벤트가 발생한 경우 리턴
            if (isClickInsideSaveDialog || isClickInsideDeleteDialog) {
                return;
            }
            // 컨텍스트 메뉴 안쪽에 클릭 이벤트가 발생하지 않았을 경우 Context메모를 닫음
            if (!isClickInsideMenu) {
                setContextMenuOpen(false);
            }
            // 메모가 수정 가능한 상태 & 메모나 컨텍스트 메모의 외부를 클릭한 경우
            if(!isClickInsideMemo && !isClickInsideMenu && isEditing){
                // 터치기기의 경우 세이브 다이얼로그를 띄우지 않고 좌표를 저장
                if (event.pointerType === "touch") {
                    outsideTouchStartRef.current = {
                        x: event.clientX,
                        y: event.clientY,
                    };
                    return;
                }

                // PC의 경우 세이브 다이얼로그를 오픈
                setSaveDialogOpen(true);
                return;
            }

            outsideTouchStartRef.current = null;
        }

        // 터치 기기를 위한 핸들러 - 메모나 컨텍스트 메뉴 외부를 클릭한 경우 
        const handleTouchOutsideEnd = (event: PointerEvent) => {
            if (event.pointerType !== "touch" || !outsideTouchStartRef.current || !isEditing) {
                return;
            }

            const deltaX = event.clientX - outsideTouchStartRef.current.x;
            const deltaY = event.clientY - outsideTouchStartRef.current.y;
            const moved = Math.hypot(deltaX, deltaY);
            outsideTouchStartRef.current = null;
            
            // 터치 시작과 끝점의 거리가 10px미만인 경우 세이브 다이얼로그를 오픈
            if (moved < 10) {
                setSaveDialogOpen(true);
            }
        }
        // 외부 터치의 시작 좌표를 클리어
        const clearOutsideTouchStart = () => {
            outsideTouchStartRef.current = null;
        }
        // 누르기 동작은 handleClickOutside 함수에 적용, 떼기 동작은 handleTouchOutsideEnd에 적용, 취소는 clearOutsideTouchStart에 적용
        document.addEventListener("pointerdown", handleClickOutside);
        document.addEventListener("pointerup", handleTouchOutsideEnd);
        document.addEventListener("pointercancel", clearOutsideTouchStart);
        return () => {
            document.removeEventListener("pointerdown", handleClickOutside);
            document.removeEventListener("pointerup", handleTouchOutsideEnd);
            document.removeEventListener("pointercancel", clearOutsideTouchStart);
        };
    }, [isEditing, memo.id]);
    
    // 메모 수정에 대한 함수
    const editMemo = () => {
        // 메모 수정이 불가능 한 상태일때 (미접속, 미허가)
        // 허가 메시지를 출력하고 리턴
        if (!canEdit) {
            onPermissionDenied();
            return;
        }
        setIsEditing(true);
        setSaveDialogOpen(false);
        window.setTimeout(() => {memoRef.current?.focus();
    }, 0);
        
    }
    // 모바일에서 길게 누름 이벤트 감지를 위한 ref
    const longPressRef = useRef<number| null>(null);
    // const openContextMenu = (x: number, y: number) => {
    //     setContextMenuPosition({ x, y });
    //     setContextMenuOpen(true);
    // };

    return (
        <>
            <Rnd 
                className={`memo-rnd-${memo.id}`}
                default={{
                    x: memo.x,
                    y: memo.y,
                    width: memo.width ?? 300,
                    height: memo.height ?? 200,
                }}
                bounds="parent"
                scale={zoom}
                // 텍스트가 활성화되어 있을 때만 드래그 가능
                disableDragging={ !isEditing }
                // 텍스트가 활성화되어 있을 때만 크기 조절 가능
                enableResizing={ isEditing } 
                /* 마우스 우클릭 이벤트 - 클릭한 좌표에 컨텍스트 메뉴를 표시 */
                onContextMenu={(e: ReactMouseEvent<HTMLElement>) => {
                    e.preventDefault();
                    // 메모 수정이 불가능 한 상태일때 (미접속, 미허가)
                    // 허가 메시지를 출력하고 리턴
                    if (!canEdit) {
                        onPermissionDenied();
                        return;
                    }
                    if(isTouchDevice()) { return; }

                    // 보드의 화면상 위치와 크기 정보
                    const board = document.querySelector(".kyu-board");
                    const rect = board?.getBoundingClientRect();
                    // 컨텍스트 메모 위치에 줌을 적용
                    const x = rect ? (e.clientX - rect.left) / zoom : e.clientX;
                    const y = rect ? (e.clientY - rect.top) /zoom : e.clientY;
                    setContextMenuPosition({ x, y });
                    setContextMenuOpen(true);
                }}
                 /* 모바일에서 길게 누름 이벤트 - 터치한 좌표에 컨텍스트 메뉴를 표시 */      
	                onPointerDown={(e: PointerEvent) => {
	                    if (e.pointerType !== "touch") return;
                        if (!canEdit) {
                            return;
                        }

	                    const x = e.clientX;
                    const y = e.clientY;

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

                /* 모바일에서 길게 누름 이벤트 - 터치한 좌표에 컨텍스트 메뉴를 표시 */
                // onTouchStart={(e: TouchEvent<HTMLTextAreaElement> ) => {
                //     const touch = e.touches[0];
                //     longPressRef.current = setTimeout(() => {
                //         openContextMenu(touch.clientX, touch.clientY);
                //     }, 500);
                // }}
                // onTouchEnd={() => {
                //     if (longPressRef.current) {
                //         clearTimeout(longPressRef.current);
                //     }
                // }}
                // onTouchMove={() => {
                //     if (longPressRef.current) {
                //         clearTimeout(longPressRef.current);
                //     }
                // }}

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
                    className="h-full w-full">
                    {memo.isPublic ? (
                        // 편집 모드에서는 텍스트 영역, 일반 모드에서는 div로 내용을 표시
                        isEditing ? (
                            <textarea
                                ref={memoRef}
                                className="h-full w-full rounded-xl border p-4 shadow-md text-neutral-900"
                                value={memoContent}
                                style={{
                                    backgroundColor: memo.color,
                                    borderColor: "#facc15",
                                    resize: "none",
                                }}
                                onChange={(event) => setMemoContent(event.target.value)}
	                            />
                        ) : (
                            <div
                                className="h-full w-full whitespace-pre-wrap rounded-xl border p-4 shadow-md text-neutral-900"
                                style={{
                                    backgroundColor: memo.color,
                                    borderColor: "#facc15",
                                    touchAction: "none",
                                }}
                                onDoubleClick={editMemo}
                                onPointerDown={handleDoubleTap}
                            >
                                {memoContent}
                            </div>
                        )
                    ) : (
                        <div
                            className="h-full w-full rounded-xl border p-4 shadow-md text-neutral-900"
                            style={{
                                backgroundColor: memo.color,
                                borderColor: "#facc15",
                                touchAction: "none",
                            }}
                        >
	                            This memo is private.
	                        </div>
                    )}
                </div>
        </Rnd>
        
	        {/* 컨텍스트 메뉴: Edit, Delete 버튼이 있는 메뉴 - 메모 카드에서 우클릭 시 열림 */
	                contextMenuOpen && (
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
                        window.location.reload();
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
