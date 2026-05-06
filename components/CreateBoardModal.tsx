"use client";

import PressableButton from "@/components/PressableButton";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useState } from "react";
import BoardMessage from "./BoardMessage";

type CreateBoardModalProps = {
    ownerId: string | null;
    onClose: () => void;
    onCreated: (boardId: number) => void;
};

// 보드 크기 선택 옵션 - 보드 생성 시 width, height값으로 사용
const boardSizeOptions = [
    { label: "3840 x 2160", width: 3840, height: 2160 },
    { label: "1920 x 1080", width: 1920, height: 1080 },
    { label: "1280 x 720", width: 1280, height: 720 },
    { label: "480 x 320", width: 480, height: 320 },
    { label: "2160 x 3840", width: 2160, height: 3840 },
    { label: "1080 x 1920", width: 1080, height: 1920 },
    { label: "720 x 1280", width: 720, height: 1280 },
    { label: "320 x 480", width: 320, height: 480 },
];

// 보드 생성을 위한 모달을 추가
export default function CreateBoardModal({ ownerId, onClose, onCreated }: CreateBoardModalProps) {
    // 보드 생성 실패 또는 입력 에러 메시지 상태
    const [errorMessage, setErrorMessage] = useState("");

    // 보드 생성 핸들러 - title, size값을 API로 전달하여 보드를 생성
    const handleCreateBoard = async(title: string, sizeValue: string) => {
        // 선택된 보드 사이즈 정보를 GET
        const selectedSize = boardSizeOptions.find((option) => option.label === sizeValue);

        // title이 비어있을 경우 에러 메시지 출력
        if (!title.trim()) {
            setErrorMessage("Please enter a board title.");
            return;
        }

        // 선택된 보드 사이즈가 존재하지 않을 경우 에러 메시지 출력
        if (!selectedSize) {
            setErrorMessage("Please select a board size.");
            return;
        }

        // 보드 생성을 위한 API 호출
        const response = await fetch("/api/boards", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: title.trim(),
                width: selectedSize.width,
                height: selectedSize.height,
                ownerId: ownerId,
            }),
        });
        const data = await response.json();

        // 보드 생성에 실패한 경우 에러 메시지 출력
        if (!data.ok) {
            setErrorMessage(data.message ?? "Board could not be created.");
            return;
        }

        // 보드 생성 성공 시 생성된 boardId를 부모 컴포넌트로 전달
        onCreated(data.board.boardId);
    };

    return createPortal(
        <>
            {/* 모달의 바깥영역: 클릭할 시 화면닫기 */}
            <div
                className="fixed inset-0 bg-black/50"
                style={{ zIndex: 70 }}
                onClick={onClose}
            />
            {/* 보드 생성 모달 영역 */}
            <div
                className="fixed left-1/2 top-1/2 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-5 text-neutral-900 shadow-xl"
                style={{ zIndex: 80 }}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-bold">Create board</h2>
                    {/* 모달 닫기 버튼 */}
                    <PressableButton
                        className="p-1"
                        onClick={onClose}
                        aria-label="Close create board modal"
                    >
                        <X className="h-4 w-4" />
                    </PressableButton>
                </div>
                {/* 보드 생성을 위한 입력 Form */}
                <form
                    className="space-y-3"
                    onSubmit={(event) => {
                        event.preventDefault();

                        // FormData로부터 title, size값을 GET
                        const formData = new FormData(event.currentTarget);
                        const title = String(formData.get("title"));
                        const size = String(formData.get("size"));

                        handleCreateBoard(title, size);
                    }}
                >
                    {/* 보드 Title 입력 */}
                    <label className="block text-sm font-semibold">
                        Title
                        <input
                            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                            name="title"
                            type="text"
                            required
                        />
                    </label>
                    {/* 보드 사이즈 선택 */}
                    <label className="block text-sm font-semibold">
                        Board size
                        <select
                            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                            name="size"
                            defaultValue="3840 x 2160"
                        >
                            {boardSizeOptions.map((option) => (
                                <option key={option.label} value={option.label}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    
                    {/* 에러 메시지가 존재할 경우 화면상에 표시 */}
                    <BoardMessage type="error" message={errorMessage}/>

                    {/* Cancel, Create 버튼 영역 */}
                    <div className="flex justify-end gap-2 pt-2">
                        <PressableButton
                            className="px-3 py-2 text-sm font-semibold text-neutral-600"
                            type="button"
                            onClick={onClose}
                        >
                            Cancel
                        </PressableButton>
                        <PressableButton
                            className="bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-400"
                            type="submit"
                        >
                            Create
                        </PressableButton>
                    </div>
                </form>
            </div>
        </>,
        document.body
    );
}
