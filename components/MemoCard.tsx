interface MemoCardProps {
    content: string;
    x: number;
    y: number;
    with?: number;
    height?: number;
    color? : string;
}

export default function MemoCard({ 
    content, 
    x, 
    y, 
    with: width = 240, 
    height = 240, 
    color = 'yellow',
}: MemoCardProps) {
    return (
        <div 
            className="absolute rounded-xl border p-4 shadow-md" 
            style={{
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            backgroundColor: color,
            borderColor: '#facc15',
      }}
        >
      <p className="text-sm text-neutral-800">{content}</p>
    </div>
    );
}