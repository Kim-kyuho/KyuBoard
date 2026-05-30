"use client";

type BoardMessageType = "permission" | "memo" | "error"
type BoardMessageProps = {
    message: string
    type: BoardMessageType
}

export default function BoardMessage({ message, type }:BoardMessageProps){
    if(type === "permission"){
        return(
            <>
            {message && (
                <div
                    className="fixed left-1/2 top-20 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-rose-600 shadow-md"
                    style={{ zIndex: 60 }}
                >
                    {message}
                </div>
            )}
            </>
        )
    }
    if(type === "memo"){
        return(
            <>
            {message && (
                <div
                    className="fixed left-1/2 top-20 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-rose-600 shadow-md"
                    style={{ zIndex: 60 }}
                >
                    {message}
                </div>
            )}
            </>
        )
    }
    if(type === "error"){
        return(
            <>
            {message && (
                <p className="text-xs leading-5 text-rose-600">
                    {message}
                </p>
            )}
            </>
        )
    }  
}
