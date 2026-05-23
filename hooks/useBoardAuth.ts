import { useCallback, useEffect, useState } from "react";

export type CurrentUser = {
    email: string;
    permissionFlg: boolean;
    role: string;
};

type UseBoardAuthOptions = {
    onSignOutComplete?: () => void;
};

export function useBoardAuth({ onSignOutComplete }: UseBoardAuthOptions = {}) {
    // 로그인 모달 열기/닫기 상태
    const [signInOpen, setSignInOpen] = useState(false);
    // 회원가입 모달 열기/닫기 상태
    const [signUpOpen, setSignUpOpen] = useState(false);
    // 화면 표시용 로그인 유저 상태 - 권한 최종 판단은 서버 API에서 처리
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    // 현재의 유저 정보를 불러옴 (email, permissionFlg, role)
    useEffect(() => {
        const loadCurrentUser = async() => {
            const response = await fetch("/api/me");
            const data = await response.json();

            setCurrentUser(data.user ?? null);
        };

        loadCurrentUser();
    }, []);

    // SignOut을 위한 핸들러
    const handleSignOut = useCallback(async() => {
        await fetch("/api/signout", {
            method: "POST",
        });
        setCurrentUser(null);
        onSignOutComplete?.();
    }, [onSignOutComplete]);

    return {
        signInOpen,
        setSignInOpen,
        signUpOpen,
        setSignUpOpen,
        currentUser,
        setCurrentUser,
        canEditMemos: currentUser?.permissionFlg === true,
        handleSignOut,
    };
}
