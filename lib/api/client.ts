export type ApiResponse = {
    ok: boolean;
    message?: string;
};

type RequestJsonOptions = {
    fallbackMessage: string;
    setErrorMessage: (message: string) => void;
};

export async function requestJson<T extends ApiResponse>(
    input: RequestInfo | URL,
    init: RequestInit,
    { fallbackMessage, setErrorMessage }: RequestJsonOptions
) {
    const response = await fetch(input, init);
    const data = await response.json().catch(() => null) as T | null;

    if (!response.ok || !data?.ok) {
        setErrorMessage(data?.message ?? fallbackMessage);
        return null;
    }

    return data;
}

export function jsonRequestInit(method: "POST" | "PATCH", body: unknown): RequestInit {
    return {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    };
}
