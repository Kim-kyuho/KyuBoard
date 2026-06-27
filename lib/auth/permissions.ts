export type PermissionUser = {
    permissionFlg: boolean;
} | null | undefined;

export const memoPermissionMessages = {
    signedOut: "Please sign in before editing memos.",
    pendingApproval: "Your account is waiting for administrator approval.",
} as const;

export function getMemoPermissionMessage(user: PermissionUser) {
    if (!user) {
        return memoPermissionMessages.signedOut;
    }

    if (!user.permissionFlg) {
        return memoPermissionMessages.pendingApproval;
    }

    return null;
}
