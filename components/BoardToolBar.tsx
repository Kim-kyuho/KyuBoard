"use client";

type BoardToolBarProps = {
    menuOpen: boolean;
    setMenuOpen: () => void;
    setSignInOpen: () => void;
    setSignUpOpen: () => void;
    setWriteClicked: () => void;
    handleSignOut: () => void;
    currentUser: () => void;
    canEditMemos: () => void;
    showPermissionMessage: () => void;
    
};

export default function BoardToolBar({
    menuOpen, 
    setMenuOpen, 
    setSignInOpen, 
    setSignUpOpen, 
    setWriteClicked, 
    handleSignOut,
    currentUser,
    canEditMemos,
    showPermissionMessage}:BoardToolBarProps){
    return {

    }
}