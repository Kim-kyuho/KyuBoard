import MemoCard from "@/components/MemoCard";

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-auto bg-neutral-200">
      <div
        className="relative bg-white"
        style={{
          width: '3840px',
          height: '2160px',
          backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <MemoCard
          content="KyuBoard 첫 메모"
          x={240}
          y={180}
        />
      </div>
    </main>
  );
}
