import { Dispatch, SetStateAction } from "react";
import { BoardImage } from "@/hooks/useBoardImages";
import { BoardMemo } from "@/hooks/useBoardMemos";
import { BoardMermaid } from "@/hooks/useBoardMermaids";
import { jsonRequestInit, requestJson, type ApiResponse } from "@/lib/api/client";

export type CardLayerType = "memo" | "image" | "mermaid";
export type CardLayerAction = "front" | "back";

type CardLayer = {
    type: CardLayerType;
    id: number;
    z: number;
};

type UseCardLayerOptions = {
    boardId: number;
    setMemos: Dispatch<SetStateAction<BoardMemo[]>>;
    setImages: Dispatch<SetStateAction<BoardImage[]>>;
    setMermaids: Dispatch<SetStateAction<BoardMermaid[]>>;
    setPermissionMessage: (message: string) => void;
};

export function useCardLayer({
    boardId,
    setMemos,
    setImages,
    setMermaids,
    setPermissionMessage,
}: UseCardLayerOptions) {
    const applyCardLayers = (cards: CardLayer[]) => {
        const memoLayers = new Map(cards.filter((card) => card.type === "memo").map((card) => [card.id, card.z]));
        const imageLayers = new Map(cards.filter((card) => card.type === "image").map((card) => [card.id, card.z]));
        const mermaidLayers = new Map(cards.filter((card) => card.type === "mermaid").map((card) => [card.id, card.z]));

        setMemos((prev) =>
            prev.map((memo) =>
                memoLayers.has(memo.id) ? { ...memo, z: memoLayers.get(memo.id)! } : memo
            )
        );
        setImages((prev) =>
            prev.map((image) =>
                imageLayers.has(image.imageId) ? { ...image, z: imageLayers.get(image.imageId)! } : image
            )
        );
        setMermaids((prev) =>
            prev.map((mermaid) =>
                mermaidLayers.has(mermaid.id) ? { ...mermaid, z: mermaidLayers.get(mermaid.id)! } : mermaid
            )
        );
    };

    const handleCardLayer = async (type: CardLayerType, id: number, action: CardLayerAction) => {
        if (id < 0) {
            return;
        }

        const data = await requestJson<ApiResponse & { cards?: CardLayer[] }>(
            "/api/cards/layer",
            jsonRequestInit("POST", {
                boardId,
                type,
                id,
                action,
            }),
            {
                fallbackMessage: "Card layer could not be updated.",
                setErrorMessage: setPermissionMessage,
            }
        );

        if (!data) {
            return;
        }

        applyCardLayers(data.cards ?? []);
    };

    return {
        handleCardLayer,
    };
}
