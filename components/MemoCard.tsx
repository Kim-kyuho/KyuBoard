import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { MouseEvent } from "react";
import { TouchEvent } from "react";
import PressableButton from "@/components/PressableButton";


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
export default function MemoCard({ memo, onDelete, onSave }: { memo: MemoCardProps; onDelete: (id: number) => void; onSave: (id: number, content: string, x: number, y: number, width: number, height: number, color: string, isPublic: boolean) => void; })
   {
    // 메모 카드의 위치, 크기, 내용, 색상, 공개/비공개 상태
    const [memoState, setMemoState] = useState({
        x: memo.x,
        y: memo.y,
        width: memo.width ?? 300,
        height: memo.height ?? 200,
    });
    // 컨텍스트 메뉴 오픈: Edit, Delete 버튼이 있는 메뉴 - 메모 카드에서 우클릭 시 열림
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    // 컨텍스트 메뉴 위치 상태
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    // 컨텍스트 메뉴 외부 클릭 감지를 위한 ref - 메뉴 영역 외부 클릭 시 메뉴 닫기
    const menuRef = useRef<HTMLDivElement | null>(null);
    // 화면 전체 클릭 감지 & React 컴포넌트 바깥클릭을 감지하기 위해 글로벌 마우스이벤트 사용(안정성 확보)
    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setContextMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    // 모바일에서 길게 누름 이벤트 감지를 위한 ref
    const longPressRef = useRef<NodeJS.Timeout | null>(null);
    const openContextMenu = (x: number, y: number) => {
        setContextMenuPosition({ x, y });
        setContextMenuOpen(true);
    };

    return (
        <>
            <Rnd 
                default={{
                    x: memo.x,
                    y: memo.y,
                    width: memo.width ?? 300,
                    height: memo.height ?? 200,
                }}
                    bounds="parent"
                /* 마우스 우클릭 이벤트 - 클릭한 좌표에 컨텍스트 메뉴를 표시 */
                onContextMenu={(e: MouseEvent<HTMLTextAreaElement>) => {
                    e.preventDefault();
                    const x = e.clientX;
                    const y = e.clientY;
                    setContextMenuPosition({ x, y });
                    setContextMenuOpen(true);
                }}       
                /* 모바일에서 길게 누름 이벤트 - 터치한 좌표에 컨텍스트 메뉴를 표시 */
                onTouchStart={(e: TouchEvent<HTMLTextAreaElement> ) => {
                    const touch = e.touches[0];
                    longPressRef.current = setTimeout(() => {
                        openContextMenu(touch.clientX, touch.clientY);
                    }, 500);
                }}
                onTouchEnd={() => {
                    if (longPressRef.current) {
                        clearTimeout(longPressRef.current);
                    }
                }}
                onTouchMove={() => {
                    if (longPressRef.current) {
                        clearTimeout(longPressRef.current);
                    }
                }}
                // 메모 카드 이동 완료 시 onSave 함수 호출하여 변경된 메모 정보 저장
                onDragStop={(e, d) => {
                    setMemoState((prev) => ({ ...prev, x: d.x, y: d.y }));
                }}
                // 메모 카드 크기 조절 완료 시 onSave 함수 호출하여 변경된 메모 정보 저장
                onResizeStop={(e, direction, ref, delta, position) => {
                    setMemoState({
                        x: position.x,
                        y: position.y,
                        width: parseInt(ref.style.width),
                        height: parseInt(ref.style.height),
                    }); 
                }}
            >   
            { /* 메모 공개/비공개 상태에 따른 표시 */
            memo.isPublic ? 
                /* 공개 메모 */
                <textarea
                    className="h-full w-full rounded-xl border p-4 shadow-md text-neutral-900" 
                    defaultValue ={memo.content}
                    style=
                    {{
                        backgroundColor: memo .color,
                        borderColor: '#facc15',
                        resize: 'none',
                    }}
                    onBlur={(e) => {
                        onSave(
                            memo.id, 
                            e.target.value, 
                            memoState.x, 
                            memoState.y, 
                            memoState.width, 
                            memoState.height, 
                            memo.color, 
                            memo.isPublic);
                    }}
                >
                </textarea>
                /* 비공개 메모 */
                :<textarea 
                    className="absolute rounded-xl border p-4 shadow-md text-neutral-900" 
                    defaultValue = "비공개 메모입니다."
                    style={{
                    left: `${memo .x}px`,
                    top: `${memo .y}px`,
                    width: `${memo .width}px`,
                    height: `${memo .height}px`,
                    backgroundColor: memo .color,
                    borderColor: '#facc15',
                    resize: 'none',
                }}>
                </textarea>}
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
                                onDelete(memo.id);
                            }}>    
                            Delete
                        </PressableButton>
                    </div>
                )
            }
        </>    
    );
}
