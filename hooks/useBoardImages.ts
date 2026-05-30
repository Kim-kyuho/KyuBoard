import { ChangeEvent, useRef, useState } from "react";

export type BoardImage = {
    imageId: number;
    boardId: number;
    publicId: string;
    secureUrl: string;
    fileName: string | null;
    file?: File;
    x: number;
    y: number;
    width: number;
    height: number;
};

type BoardPoint = {
    x: number;
    y: number;
};

type UseBoardImagesOptions = {
    initialImages: BoardImage[];
    boardId: number;
    boardZoom: number;
    canEditMemos: boolean;
    showPermissionMessage: () => void;
    setPermissionMessage: (message: string) => void;
};

export function useBoardImages({
    initialImages,
    boardId,
    boardZoom,
    canEditMemos,
    showPermissionMessage,
    setPermissionMessage,
}: UseBoardImagesOptions) {
    const imageLocationRef = useRef<HTMLElement | null>(null);
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const [images, setImages] = useState(initialImages);
    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

    const handleImageUploadClick = () => {
        if (!canEditMemos) {
            showPermissionMessage();
            return;
        }
        imageInputRef.current?.click();
    };

    const getImageDisplaySize = (file: File) =>
        new Promise<{ width: number; height: number }>((resolve) => {
            const imageUrl = URL.createObjectURL(file);
            const image = document.createElement("img");

            image.onload = () => {
                const maxWidth = 400;
                const maxHeight = 300;
                const scale = Math.min(
                    maxWidth / image.naturalWidth,
                    maxHeight / image.naturalHeight,
                    1
                );

                URL.revokeObjectURL(imageUrl);
                resolve({
                    width: Math.round(image.naturalWidth * scale),
                    height: Math.round(image.naturalHeight * scale),
                });
            };

            image.onerror = () => {
                URL.revokeObjectURL(imageUrl);
                resolve({ width: 400, height: 300 });
            };

            image.src = imageUrl;
        });

    const getImageAutoLocation = (): BoardPoint => {
        const locationElement = imageLocationRef.current;
        if (!locationElement) {
            return { x: 0, y: 0 };
        }

        return {
            x: Math.max(0, (locationElement.scrollLeft + locationElement.clientWidth / 2) / boardZoom - 200),
            y: Math.max(0, (locationElement.scrollTop + locationElement.clientHeight / 2) / boardZoom - 150),
        };
    };

    const handleUploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) {
            return;
        }
        if (!canEditMemos) {
            showPermissionMessage();
            return;
        }

        const { x, y } = getImageAutoLocation();
        const { width, height } = await getImageDisplaySize(file);
        const tempImageUrl = URL.createObjectURL(file);
        const tempImage: BoardImage = {
            imageId: -Date.now(),
            boardId,
            publicId: "",
            secureUrl: tempImageUrl,
            fileName: file.name,
            file,
            x: Math.round(x),
            y: Math.round(y),
            width,
            height,
        };

        setImages((prev) => [...prev, tempImage]);
        setSelectedImageId(tempImage.imageId);
    };

    const handleInsertImage = async (tempId: number, file: File, boardId: number, x: number, y: number, width: number, height: number) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("boardId", String(boardId));
        formData.append("x", String(x));
        formData.append("y", String(y));
        formData.append("width", String(width));
        formData.append("height", String(height));

        const response = await fetch("/api/images", {
            method: "POST",
            body: formData,
        });
        const data = await response.json();

        if (!data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to upload images.");
            return;
        }

        const tempImage = images.find((image) => image.imageId === tempId);
        if (tempImage?.secureUrl) {
            URL.revokeObjectURL(tempImage.secureUrl);
        }

        setImages((prev) =>
            prev.map((image) =>
                image.imageId === tempId ? data.image : image
            )
        );
        setSelectedImageId(data.image.imageId);
    };

    const handleUpdateImage = async (imageId: number, boardId: number, publicId: string, secureUrl: string, fileName: string | null, x: number, y: number, width: number, height: number) => {
        const response = await fetch(`/api/images/${imageId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ boardId, publicId, secureUrl, fileName, x, y, width, height }),
        });
        const data = await response.json();

        if (!response.ok || !data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to edit images.");
            return;
        }

        setImages((prev) =>
            prev.map((image) =>
                image.imageId === imageId ? { ...image, boardId, publicId, secureUrl, fileName, x, y, width, height } : image
            )
        );
    };

    const handleDeleteImage = async (imageId: number) => {
        if (imageId < 0) {
            const tempImage = images.find((image) => image.imageId === imageId);
            if (tempImage?.secureUrl) {
                URL.revokeObjectURL(tempImage.secureUrl);
            }

            setImages((prev) => prev.filter((image) => image.imageId !== imageId));
            setSelectedImageId(null);
            return;
        }

        const response = await fetch(`/api/images/${imageId}`, {
            method: "DELETE",
        });
        const data = await response.json();

        if (!response.ok || !data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to delete images.");
            return;
        }

        setImages((prev) => prev.filter((image) => image.imageId !== imageId));
        setSelectedImageId(null);
    };

    return {
        imageLocationRef,
        imageInputRef,
        images,
        selectedImageId,
        setSelectedImageId,
        handleImageUploadClick,
        handleUploadImage,
        handleInsertImage,
        handleUpdateImage,
        handleDeleteImage,
    };
}
