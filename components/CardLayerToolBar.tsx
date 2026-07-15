"use client";

import { BringToFront, SendToBack, Trash2 } from "lucide-react";
import { CardToolButton, CardToolPortal } from "./CardToolPortal";

type CardLayerToolBarProps = {
    cardName: string;
    onBringToFront: () => void;
    onSendToBack: () => void;
    onDelete: () => void;
};

export default function CardLayerToolBar({
    cardName,
    onBringToFront,
    onSendToBack,
    onDelete,
}: CardLayerToolBarProps) {
    return (
        <CardToolPortal>
            <CardToolButton label={`Bring ${cardName} to front`} onClick={onBringToFront}>
                <BringToFront />
            </CardToolButton>
            <CardToolButton label={`Send ${cardName} to back`} onClick={onSendToBack}>
                <SendToBack />
            </CardToolButton>
            <CardToolButton label={`Delete ${cardName}`} onClick={onDelete} className="text-rose-600">
                <Trash2 />
            </CardToolButton>
        </CardToolPortal>
    );
}
