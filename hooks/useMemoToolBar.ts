import { useState } from "react";

export function useMemoToolBar({
    onChangeColor,
    onHeading,
}: {
    onChangeColor?: (color: string) => void;
    onHeading?: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
}) {
    const [openMemoColorMenu, setOpenMemoColorMenu] = useState(false);
    const [openHeadingMenu, setOpenHeadingMenu] = useState(false);

    const memoColors = [
        { name: "Yellow", value: "#fffadc" },
        { name: "Pink", value: "#ffe4ec" },
        { name: "Blue", value: "#e0f2fe" },
        { name: "Green", value: "#dcfce7" },
    ];

    const headingLevels = [
        { name: "h1", value: 1 },
        { name: "h2", value: 2 },
        { name: "h3", value: 3 },
        { name: "h4", value: 4 },
        { name: "h5", value: 5 },
        { name: "h6", value: 6 },
    ] as const;

    const toggleColorMenu = () => {
        setOpenMemoColorMenu((prev) => !prev);
        setOpenHeadingMenu(false);
    };

    const toggleHeadingMenu = () => {
        setOpenHeadingMenu((prev) => !prev);
        setOpenMemoColorMenu(false);
    };

    const handleColorSelect = (color: string) => {
        onChangeColor?.(color);
        setOpenMemoColorMenu(false);
    };

    const handleHeadingSelect = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
        onHeading?.(level);
        setOpenHeadingMenu(false);
    };

    return {
        memoColors,
        headingLevels,
        openMemoColorMenu,
        openHeadingMenu,
        toggleColorMenu,
        toggleHeadingMenu,
        handleColorSelect,
        handleHeadingSelect,
    };
}
