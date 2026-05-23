import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type FocusMemo = {
    id: number;
};

export function useBoardMemoFocus(memos: FocusMemo[]) {
    // 메모 이동/탐색 관련 메시지 상태
    const [memoMessage, setMemoMessage] = useState("");
    // 현재 포커스된 메모 ID 상태
    const [focusedMemoId, setFocusedMemoId] = useState<number | null>(null);
    // 최초 진입 시 가장 ID가 빠른 메모로 이동했는지 저장
    const initialMemoFocusRef = useRef(false);

    // 메모 ID를 오름차순으로 정렬한 리스트
    const sortedMemoIds = useMemo(
        () => memos.map((memo) => memo.id).sort((a, b) => a - b),
        [memos]
    );

    // 메모 ID를 기준으로 해당 메모에 포커스를 주고 화면을 이동
    const focusMemoById = useCallback((memoId: number | null) => {
        setMemoMessage("");
        setFocusedMemoId(memoId);
        window.setTimeout(() => {
            document
                .querySelector(`.memo-rnd-${memoId}`)
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "center",
                });
        }, 0);
    }, []);

    // 보드 진입 시 가장 ID가 빠른 메모로 이동
    useEffect(() => {
        if (initialMemoFocusRef.current || sortedMemoIds.length === 0) {
            return;
        }

        initialMemoFocusRef.current = true;
        focusMemoById(sortedMemoIds[0]);
    }, [focusMemoById, sortedMemoIds]);

    // 이전 메모로 이동하기 위한 핸들러
    const handleFocusPrevMemo = () => {
        if (sortedMemoIds.length === 0) {
            setMemoMessage("No memos exist.");
            return;
        }

        const currentIndex = focusedMemoId === null
            ? -1
            : sortedMemoIds.indexOf(focusedMemoId);

        if (currentIndex === -1) {
            focusMemoById(sortedMemoIds[0]);
            return;
        }

        const prevMemoId = currentIndex > 0
            ? sortedMemoIds[currentIndex - 1]
            : null;

        if (!prevMemoId) {
            setMemoMessage("Prev memo does not exist.");
            return;
        }

        focusMemoById(prevMemoId);
    };

    // 다음 메모로 이동하기 위한 핸들러
    const handleFocusNextMemo = () => {
        if (sortedMemoIds.length === 0) {
            setMemoMessage("No memo exist.");
            return;
        }

        const currentIndex = focusedMemoId === null
            ? -1
            : sortedMemoIds.indexOf(focusedMemoId);

        if (currentIndex === -1) {
            focusMemoById(sortedMemoIds[0]);
            return;
        }

        const nextMemoId = currentIndex >= 0 && currentIndex < sortedMemoIds.length - 1
            ? sortedMemoIds[currentIndex + 1]
            : null;

        if (!nextMemoId) {
            setMemoMessage("Next memo does not exist.");
            return;
        }

        focusMemoById(nextMemoId);
    };

    return {
        memoMessage,
        setMemoMessage,
        focusedMemoId,
        setFocusedMemoId,
        focusMemoById,
        handleFocusPrevMemo,
        handleFocusNextMemo,
    };
}
