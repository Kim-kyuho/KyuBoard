import { useMemo, useState } from "react";

type SearchMemo = {
    id: number;
    content: string;
};

type UseBoardSearchOptions = {
    memos: SearchMemo[];
    focusMemoById: (memoId: number | null) => void;
    setMemoMessage: (message: string) => void;
};

export function useBoardSearch({
    memos,
    focusMemoById,
    setMemoMessage,
}: UseBoardSearchOptions) {
    // 검색바 오픈 상태
    const [searchBarOpen, setSearchBarOpen] = useState(false);
    // 검색어 상태
    const [searchText, setSearchText] = useState("");
    // 현재 검색 결과 인덱스
    const [searchIndex, setSearchIndex] = useState(0);

    // 검색어에 해당하는 메모 리스트
    const searchResults = useMemo(() => {
        const query = searchText.trim().toLowerCase();

        if (!query) {
            return [];
        }

        return memos.filter((memo) =>
            memo.content.toLowerCase().includes(query)
        );
    }, [memos, searchText]);

    // 검색 결과 메모로 이동
    const focusSearchResult = (index: number) => {
        const targetMemo = searchResults[index];

        if (!targetMemo) {
            setMemoMessage("No search results.");
            return;
        }

        setSearchIndex(index);
        focusMemoById(targetMemo.id);
    };

    // 다음 검색 결과 이동
    const handleSearchNext = () => {
        if (searchResults.length === 0) {
            setMemoMessage("No search results.");
            return;
        }

        const nextIndex = searchIndex >= searchResults.length - 1
            ? 0
            : searchIndex + 1;

        focusSearchResult(nextIndex);
    };

    // 이전 검색 결과 이동
    const handleSearchPrev = () => {
        if (searchResults.length === 0) {
            setMemoMessage("No search results.");
            return;
        }

        const prevIndex = searchIndex <= 0
            ? searchResults.length - 1
            : searchIndex - 1;

        focusSearchResult(prevIndex);
    };

    // 검색어 변경
    const handleSearchTextChange = (query: string) => {
        setSearchText(query);
        setSearchIndex(0);

        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) {
            return;
        }

        const firstMemo = memos.find((memo) =>
            memo.content.toLowerCase().includes(normalizedQuery)
        );

        if (firstMemo) {
            focusMemoById(firstMemo.id);
        }
    };

    return {
        searchBarOpen,
        setSearchBarOpen,
        searchText,
        searchIndex,
        searchResults,
        handleSearchTextChange,
        handleSearchPrev,
        handleSearchNext,
    };
}
