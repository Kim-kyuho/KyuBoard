// 메모를 추가하는 컴포넌트
export default function AddMemo({x,y}:{x:number,y:number}) {
    const newMemo = {
        id: 3,
        boardId: 1,
        content: "",
        x: x,
        y: y,
        width: 500,
        height: 300,
        color: "yellow",
        isPublic: true,
    };
    return (
        newMemo
    );
}