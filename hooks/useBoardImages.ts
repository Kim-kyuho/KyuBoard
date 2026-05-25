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
    // 이미지 자동 배치 위치 계산용 ref - 현재 보이는 보드 화면의 중앙 좌표 계산에 사용
    const imageLocationRef = useRef<HTMLElement | null>(null);
    // 이미지 파일 업로드 input ref - 툴바 버튼 클릭 시 파일 선택창을 열기 위해 사용
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    // 이미지 리스트 상태
    const [images, setImages] = useState(initialImages);
    // 현재 선택된 이미지 ID 상태
    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

    // 이미지 업로드 버튼 클릭 핸들러 - 파일 선택 input을 실행
    const handleImageUploadClick = () => {
        if (!canEditMemos) {
            showPermissionMessage();
            return;
        }

        imageInputRef.current?.click();
    };

    // 이미지 초기 표시 크기 계산 함수 - 400x300 안에 들어오도록 원본 비율을 유지해서 축소
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

    // 이미지 자동 배치 위치 계산 함수 - 현재 보이는 보드 화면의 중앙에 이미지를 생성
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

    // 이미지 업로드 핸들러 - 선택한 파일을 임시 이미지로 생성하고 저장은 ImageCard에서 처리
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

    // 이미지 생성을 위한 핸들러 - ImageCard에서 저장 확인 시 파일을 API로 전송하고 반환된 이미지 정보로 교체
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

    // 이미지 갱신을 위한 핸들러 - ImageCard에서 이동, 크기 조절 완료 시 호출
    const handleUpdateImage = async (imageId: number, boardId: number, publicId: string, secureUrl: string, fileName: string | null, x: number, y: number, width: number, height: number) => {
        const response = await fetch(`/api/images/${imageId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ boardId, publicId, secureUrl, fileName, x, y, width, height }),
        });
        const data = await response.json();

        if (!data.ok) {
            setPermissionMessage(data.message ?? "You do not have permission to edit images.");
            return;
        }

        setImages((prev) =>
            prev.map((image) =>
                image.imageId === imageId ? { ...image, boardId, publicId, secureUrl, fileName, x, y, width, height } : image
            )
        );
    };

    // 이미지 삭제를 위한 핸들러 - Cloudinary 이미지와 DB 데이터를 함께 삭제
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

        if (!data.ok) {
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
