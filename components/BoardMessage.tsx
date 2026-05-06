"use client";

type BoardMessageType = "permission" | "memo" | "error"
type BoardMessageProps = {
    message: string
    type: BoardMessageType
}

export default function BoardMessage({ message, type }:BoardMessageProps){
    // 타입이 permission 일때 표시하는 메시지
    if(type === "permission"){
        return(
            <>
            {/* Permission메시지가 존재할 떄 화면상에 표시 */}
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
    // 타입이 memo 일때 표시하는 메시지
    if(type === "memo"){
        return(
            <>
            {/* Memo메시지가 존재할 떄 화면상에 표시 */}
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
    // 타입이 error 일때 표시하는 메시지
    if(type === "error"){
        return(
            <>
            {/* Permission메시지가 존재할 떄 화면상에 표시 */}
            {message && (
                <p className="text-xs leading-5 text-rose-600">
                    {message}
                </p>
            )}
            </>
        )
    }  
}
