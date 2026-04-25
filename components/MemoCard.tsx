import { use, useEffect, useRef, useState } from "react";
import PressableButton from "@/components/PressableButton";

// 메모 카드 컴포넌트
interface MemoCardProps {
    id : number;
    content: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    color? : string;
    isPublic?: boolean;
}
export default function MemoCard({ memo, onDelete, onSave }: { memo: MemoCardProps; onDelete: (id: number) => void; onSave: (id: number, content: string) => void; })
   {
    // 컨텍스트 메뉴 오픈: Edit, Delete 버튼이 있는 메뉴 - 메모 카드에서 우클릭 시 열림
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    // 컨텍스트 메뉴 위치 상태
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    // 컨텍스트 메뉴 외부 클릭 감지를 위한 ref
    const menuRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
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
        <div onContextMenu={(e) => {
            /* 마우스 우클릭 이벤트 - 클릭한 좌표에 컨텍스트 메뉴를 표시 */
            e.preventDefault();
            const x = e.clientX;
            const y = e.clientY;
            setContextMenuPosition({ x, y });
            setContextMenuOpen(true);
            }}
            
            /* 모바일에서 길게 누름 이벤트 - 터치한 좌표에 컨텍스트 메뉴를 표시 */
            onTouchStart={(e) => {
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
        >   
        { /* 메모 공개/비공개 상태에 따른 표시 */
        memo.isPublic ? 
            /* 공개 메모 */
            <textarea
                className="absolute rounded-xl border p-4 shadow-md text-neutral-900" 
                defaultValue ={memo.content}
                style={{
                left: `${memo .x}px`,
                top: `${memo .y}px`,
                width: `${memo .width}px`,
                height: `${memo .height}px`,
                backgroundColor: memo .color,
                borderColor: '#facc15',
                resize: 'none',}}
                onBlur={(e) => {
                    onSave(memo.id, e.target.value);
                    }
                }
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
            {/* 컨텍스트 메뉴: Edit, Delete 버튼이 있는 메뉴 - 메모 카드에서 우클릭 시 열림 */
            contextMenuOpen && (
                <div 
                    ref={menuRef}
                    className="absolute bg-white px-4 py-3 shadow-md"
                    style={{
                        left: `${contextMenuPosition.x}px`,
                        top: `${contextMenuPosition.y}px`,
                }}>
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
            )}
    </div>
    
    );
}
