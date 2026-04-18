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
export default function MemoCard({ memo }: { memo: MemoCardProps })
   {
    return (
        <div 
            className="absolute rounded-xl border p-4 shadow-md" 
            style={{
            left: `${memo .x}px`,
            top: `${memo .y}px`,
            width: `${memo .width}px`,
            height: `${memo .height}px`,
            backgroundColor: memo .color,
            borderColor: '#facc15',
      }}
        >
    {memo.isPublic ? <p className="text-sm text-neutral-800">{memo.content}</p>:<p className="text-sm text-neutral-800 italic">비공개 메모</p>}


    </div>
    );
}