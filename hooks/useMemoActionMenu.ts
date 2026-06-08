import { useState } from "react";

export function useMemoContextMenu({
  onChangeColor,
}: {
  onChangeColor?: (color: string) => void;
}) {
  const [openMemoColorMenu, setOpenMemoColorMenu] = useState(false);

  const memoColors = [
    { name: "Yellow", value: "#fffadc" },
    { name: "Pink", value: "#ffe4ec" },
    { name: "Blue", value: "#e0f2fe" },
    { name: "Green", value: "#dcfce7" },
  ];

  const toggleColorMenu = () => {
    setOpenMemoColorMenu((prev) => !prev);
  };

  const handleColorSelect = (color: string) => {
    onChangeColor?.(color);
    setOpenMemoColorMenu(false);
  };

  return {
    memoColors,
    openMemoColorMenu,
    toggleColorMenu,
    handleColorSelect,
  };
}
