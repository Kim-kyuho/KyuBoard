import { UIEvent, useEffect, useRef, useState } from "react";

export function useMemoActionMenu({
  onChangeColor,
  onHeading,
}: {
  onChangeColor?: (color: string) => void;
  onHeading?: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
}) {
  const [openMemoColorMenu, setOpenMemoColorMenu] = useState(false);
  const [openHeadingMenu, setOpenHeadingMenu] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const menuScrollRef = useRef<HTMLDivElement | null>(null);

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

  const handleMenuScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;

    setShowScrollHint(!isAtBottom);
  };

  useEffect(() => {
    const target = menuScrollRef.current;
    if (!target) return;

    const canScroll = target.scrollHeight > target.clientHeight + 1;
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;

    setShowScrollHint(canScroll && !isAtBottom);
  }, [openMemoColorMenu, openHeadingMenu]);

  return {
    memoColors,
    headingLevels,
    menuScrollRef,
    openMemoColorMenu,
    openHeadingMenu,
    showScrollHint,
    toggleColorMenu,
    toggleHeadingMenu,
    handleColorSelect,
    handleHeadingSelect,
    handleMenuScroll,
  };
}
