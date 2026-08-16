import { GoogleGenAI, type Content, type FunctionDeclaration } from "@google/genai";
import {
    boardArrangementSchema,
    boardPlanSchema,
    layoutModes,
    planMemoColors,
    type BoardArrangement,
    type BoardPlan,
} from "@/lib/ai/board-plan";

// Gemini 호출과 도구 정의를 모아둔 라이브러리.
// 카드 생성은 자유 텍스트 파싱이 아니라 function calling으로만 받는다.

// 최신 모델일수록 과부하(503)로 거절되는 일이 잦다. 순서대로 시도해 첫 성공을 쓴다.
const fallbackModels = ["gemini-3.6-flash", "gemini-3.5-flash"];

export const assistantModels = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL, ...fallbackModels.filter((model) => model !== process.env.GEMINI_MODEL)]
    : fallbackModels;

/** 모델 혼잡이나 일시적 장애로 실패했을 때 던진다. 호출자가 503으로 응답한다. */
export class AssistantUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AssistantUnavailableError";
    }
}

// 다른 모델로 넘어갈 가치가 있는 실패인지 판단한다. 잘못된 요청(400)은 재시도해도 같다.
const isRetryableModelError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);

    return (
        /"code":\s*(429|500|503)/.test(message) ||
        /UNAVAILABLE|RESOURCE_EXHAUSTED|INTERNAL|NOT_FOUND/.test(message)
    );
};

export const createBoardCardsToolName = "create_board_cards";
export const rearrangeBoardCardsToolName = "rearrange_board_cards";

const memoBlockSchema = {
    type: "object",
    properties: {
        type: {
            type: "string",
            enum: ["heading", "paragraph", "bulletList", "orderedList", "codeBlock", "blockquote"],
        },
        level: { type: "integer", minimum: 1, maximum: 6, description: "heading일 때만 사용" },
        text: { type: "string", description: "heading/paragraph/codeBlock/blockquote에서 사용" },
        items: {
            type: "array",
            items: { type: "string" },
            description: "bulletList/orderedList에서 사용",
        },
    },
    required: ["type"],
} as const;

// Gemini는 parametersJsonSchema로 일반 JSON Schema를 그대로 받는다.
export const createBoardCardsFunction: FunctionDeclaration = {
    name: createBoardCardsToolName,
    description:
        "사용자가 요청한 문서를 KyuBoard 카드로 만든다. 섹션 하나가 메모 카드 하나가 되고, 섹션 순서가 곧 최종 Markdown 문서의 순서다. 표나 다이어그램이 필요한 섹션에만 attachment를 붙인다.",
    parametersJsonSchema: {
        type: "object",
        properties: {
            layout: {
                type: "string",
                enum: [...layoutModes],
                description:
                    "배치 방식. column=한 줄기로 이어지는 문서, grid=서로 대등한 항목 나열, tree=상위-하위 구조가 있는 설계. 생략하면 column",
            },
            sections: {
                type: "array",
                minItems: 1,
                maxItems: 12,
                items: {
                    type: "object",
                    properties: {
                        blocks: {
                            type: "array",
                            minItems: 1,
                            items: memoBlockSchema,
                            description: "메모 카드 본문을 이루는 블록 목록",
                        },
                        color: {
                            type: "string",
                            enum: [...planMemoColors],
                            description: "메모 카드 배경색. 생략하면 기본 노란색",
                        },
                        parentIndex: {
                            type: "integer",
                            description:
                                "tree 배치일 때만 사용. 이 섹션의 상위 섹션 인덱스(0부터). 자기보다 반드시 작아야 한다. 최상위면 생략",
                        },
                        attachment: {
                            type: "object",
                            properties: {
                                type: { type: "string", enum: ["mermaid", "table"] },
                                source: { type: "string", description: "mermaid일 때 Mermaid 문법" },
                                columns: {
                                    type: "array",
                                    items: { type: "string" },
                                    description: "table일 때 열 이름",
                                },
                                rows: {
                                    type: "array",
                                    items: { type: "array", items: { type: "string" } },
                                    description: "table일 때 행 데이터. 각 행의 길이는 columns와 맞춘다",
                                },
                            },
                            required: ["type"],
                        },
                    },
                    required: ["blocks"],
                },
            },
        },
        required: ["sections"],
    },
};

export const rearrangeBoardCardsFunction: FunctionDeclaration = {
    name: rearrangeBoardCardsToolName,
    description:
        "보드에 이미 있는 카드의 위치를 다시 잡는다. 카드를 새로 만들거나 내용을 바꾸지 않고 배치만 정리한다. 어떤 메모에 어떤 표/다이어그램을 붙일지 다시 정할 때도 이 함수를 쓴다. 반드시 대화에 주어진 현재 보드 카드 목록의 ID만 사용한다.",
    parametersJsonSchema: {
        type: "object",
        properties: {
            layout: {
                type: "string",
                enum: [...layoutModes],
                description:
                    "배치 방식. column=한 줄기로 이어지는 문서, grid=서로 대등한 항목 나열, tree=상위-하위 구조가 있는 설계. 생략하면 column",
            },
            sections: {
                type: "array",
                minItems: 1,
                items: {
                    type: "object",
                    properties: {
                        memoId: { type: "integer", description: "현재 보드에 있는 메모 카드 ID" },
                        parentIndex: {
                            type: "integer",
                            description:
                                "tree 배치일 때만 사용. 이 섹션의 상위 섹션 인덱스(0부터). 자기보다 반드시 작아야 한다. 최상위면 생략",
                        },
                        attachment: {
                            type: "object",
                            properties: {
                                type: { type: "string", enum: ["mermaid", "table"] },
                                cardId: { type: "integer", description: "현재 보드에 있는 카드 ID" },
                            },
                            required: ["type", "cardId"],
                        },
                    },
                    required: ["memoId"],
                },
            },
        },
        required: ["sections"],
    },
};

export const assistantSystemPrompt = [
    "너는 KyuBoard의 AI 어시스턴트다. KyuBoard는 보드 위에 카드를 배치하면 그 배치가 그대로 하나의 Markdown 문서로 컴파일되는 도구다.",
    "",
    "규칙:",
    `- 문서나 설계를 만들어 달라는 요청에는 반드시 ${createBoardCardsToolName} 함수를 호출한다. 카드 내용을 채팅 본문에 그대로 적지 않는다.`,
    "- 섹션 순서가 최종 문서의 순서다. 개요에서 세부로 이어지도록 구성한다.",
    "- 메모 본문은 blocks 배열로만 표현한다. HTML이나 Markdown 문법 문자열을 직접 넣지 않는다.",
    "- 흐름·구조·관계를 보여줄 섹션에는 mermaid attachment를, 항목 비교나 정리에는 table attachment를 붙인다. 필요 없는 섹션에는 붙이지 않는다.",
    "- 한 섹션에는 attachment를 최대 하나만 붙일 수 있다.",
    "- Mermaid 문법은 flowchart, sequenceDiagram 등 표준 문법만 쓰고 노드 라벨은 큰따옴표로 감싼다.",
    "- 표를 만들 때 각 행의 셀 개수를 columns 개수와 정확히 맞춘다.",
    "- 단순한 질문이나 잡담에는 함수를 호출하지 말고 짧게 답한다.",
    "- 사용자가 쓴 언어로 답한다.",
    "",
    "배치(layout) 선택:",
    "- column: 처음부터 끝까지 한 줄기로 읽는 문서. 회고, 설명서, 순서가 중요한 글.",
    "- grid: 서로 대등한 항목을 나열하는 문서. 비교표 모음, 체크리스트, 카드 목록.",
    "- tree: 상위 개념 아래에 하위 항목이 붙는 구조. 아키텍처 설계, 조직도, 기능 분해.",
    "- tree를 고르면 각 섹션에 parentIndex로 상위 섹션을 지정한다. 최상위 섹션은 parentIndex를 생략한다.",
    "- parentIndex는 반드시 자기 인덱스보다 작아야 한다. 개요를 먼저 쓰고 세부를 뒤에 쓰면 자연히 지켜진다.",
    "",
    `- 이미 있는 카드를 정리·재배치하거나 표·다이어그램을 다른 메모에 붙이라는 요청에는 ${rearrangeBoardCardsToolName}를 호출한다. 이때 대화에 주어진 현재 보드 카드 목록의 ID만 쓴다.`,
    "- 좌표(x, y)는 절대 지정하지 않는다. 위치는 KyuBoard가 계산한다. 너는 순서와 붙임 관계만 정한다.",
    "- 최종 문서 순서는 메모의 생성 순서로 이미 정해져 있다. 재배치로는 문서 순서를 바꿀 수 없다.",
].join("\n");

export type AssistantMessage = {
    role: "user" | "assistant";
    content: string;
};

export type BoardSnapshot = {
    memos: { id: number; summary: string }[];
    mermaids: { id: number; summary: string }[];
    tables: { id: number; summary: string }[];
    /** 보드에 더 배치할 수 있는 섹션 수. 모델이 분량을 맞추는 데 쓴다. */
    capacity: number;
};

export type AssistantResult = {
    reply: string;
    plan: BoardPlan | null;
    arrangement: BoardArrangement | null;
};

// Gemini는 어시스턴트 역할을 "model"로 부른다.
const toGeminiContents = (messages: AssistantMessage[]): Content[] =>
    messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
    }));

// 재배치를 하려면 모델이 현재 보드에 무엇이 있는지 알아야 한다.
const describeSnapshot = (snapshot: BoardSnapshot) => {
    const describe = (label: string, cards: { id: number; summary: string }[]) =>
        cards.length === 0
            ? `${label}: 없음`
            : `${label}:\n${cards.map((card) => `  - id ${card.id}: ${card.summary}`).join("\n")}`;

    return [
        "현재 보드 상태:",
        describe("메모 카드", snapshot.memos),
        describe("Mermaid 카드", snapshot.mermaids),
        describe("표 카드", snapshot.tables),
        `이 보드에 새로 배치할 수 있는 섹션은 최대 ${snapshot.capacity}개다. 이보다 많이 만들지 않는다.`,
    ].join("\n");
};

export async function runBoardAssistant(
    apiKey: string,
    messages: AssistantMessage[],
    snapshot: BoardSnapshot
): Promise<AssistantResult> {
    const ai = new GoogleGenAI({ apiKey });
    const request = {
        contents: toGeminiContents(messages),
        config: {
            systemInstruction: [assistantSystemPrompt, "", describeSnapshot(snapshot)].join("\n"),
            tools: [{ functionDeclarations: [createBoardCardsFunction, rearrangeBoardCardsFunction] }],
        },
    };

    let response;
    let lastError: unknown;

    for (const model of assistantModels) {
        try {
            response = await ai.models.generateContent({ model, ...request });
            break;
        } catch (error) {
            lastError = error;

            if (!isRetryableModelError(error)) {
                throw error;
            }
            console.warn(`Gemini model ${model} unavailable, trying the next one.`);
        }
    }

    if (!response) {
        console.error("All Gemini models failed:", lastError);
        throw new AssistantUnavailableError(
            "AI 모델이 지금 혼잡합니다. 잠시 후 다시 시도해 주세요."
        );
    }

    const replyText = response.text?.trim();
    const calls = response.functionCalls ?? [];

    const rearrangeCall = calls.find((call) => call.name === rearrangeBoardCardsToolName);

    if (rearrangeCall?.args) {
        // 모델이 스키마를 벗어난 인자를 보낼 수 있으므로 반드시 다시 검증한다.
        const parsed = boardArrangementSchema.safeParse(rearrangeCall.args);

        if (!parsed.success) {
            return {
                reply: "재배치 계획을 이해하지 못했습니다. 다시 요청해 주세요.",
                plan: null,
                arrangement: null,
            };
        }

        return {
            reply: replyText || "카드를 다시 배치했습니다. 확인 후 저장하세요.",
            plan: null,
            arrangement: parsed.data,
        };
    }

    const createCall = calls.find((call) => call.name === createBoardCardsToolName);

    if (!createCall?.args) {
        return {
            reply: replyText || "요청을 이해하지 못했습니다. 다시 설명해 주세요.",
            plan: null,
            arrangement: null,
        };
    }

    const parsedArguments = boardPlanSchema.safeParse(createCall.args);

    if (!parsedArguments.success) {
        return {
            reply: "카드 구조를 만드는 데 실패했습니다. 요청을 더 구체적으로 적어 주세요.",
            plan: null,
            arrangement: null,
        };
    }

    const sectionCount = parsedArguments.data.sections.length;

    return {
        reply: replyText || `${sectionCount}개의 카드를 만들었습니다. 확인 후 저장하세요.`,
        plan: parsedArguments.data,
        arrangement: null,
    };
}
