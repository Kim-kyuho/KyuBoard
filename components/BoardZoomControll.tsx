"use client";

import PressableButton from "./PressableButton";
import { Minus, Plus } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

type BoardZoomControllProps ={
    setBoardZoom: Dispatch<SetStateAction<number>>;
}

export default function BoardZoomControll({
    setBoardZoom
}:BoardZoomControllProps){
    return(
        <>
        {/* 줌 인 버튼 - 보드 영역만 확대하고 메뉴와 로고 크기는 유지 */}
        <PressableButton
            className="fixed right-5 bottom-20 z-50 bg-white/30 px-4 py-3 shadow-md"
            onClick={() => setBoardZoom((zoom) => Math.min(2, zoom + 0.1))}
            title="Zoom in"
        >
            <Plus className="w-5 h-5 text-neutral-900" />
        </PressableButton>
        {/* 줌 아웃 버튼 - 보드 영역만 축소하고 메뉴와 로고 크기는 유지 */}
        <PressableButton
            className="fixed right-5 bottom-5 z-50 bg-white/30 px-4 py-3 shadow-md"
            onClick={() => setBoardZoom((zoom) => Math.max(0.25, zoom - 0.1))}
            title="Zoom out"
        >
            <Minus className="w-5 h-5 text-neutral-900" />
        </PressableButton>
        </>
    )
}

