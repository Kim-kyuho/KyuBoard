import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ConfirmDialog from "@/components/ConfirmDialog";
import CreateBoardModal from "@/components/CreateBoardModal";
import PressableButton from "@/components/PressableButton";
import RenameBoardModal from "@/components/RenameBoardModal";

describe("PressableButton", () => {
    it("applies and clears touch feedback while forwarding callbacks", () => {
        const onTouchStart = vi.fn();
        const onTouchEnd = vi.fn();
        render(<PressableButton onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>Action</PressableButton>);
        const button = screen.getByRole("button", { name: "Action" });

        fireEvent.touchStart(button);
        expect(button).toHaveClass("scale-[0.96]");
        expect(onTouchStart).toHaveBeenCalledOnce();

        fireEvent.touchEnd(button);
        expect(button).not.toHaveClass("scale-[0.96]");
        expect(onTouchEnd).toHaveBeenCalledOnce();
    });
});

describe("ConfirmDialog", () => {
    it("renders through a portal and dispatches confirm and cancel", () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        render(<ConfirmDialog message="Delete card?" onConfirm={onConfirm} onCancel={onCancel} />);

        expect(screen.getByText("Delete card?")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Yes" }));
        fireEvent.click(screen.getByRole("button", { name: "No" }));
        expect(onConfirm).toHaveBeenCalledOnce();
        expect(onCancel).toHaveBeenCalledOnce();
    });
});

describe("board modals", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("creates a trimmed board with the selected dimensions", async () => {
        const onCreated = vi.fn();
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            json: vi.fn().mockResolvedValue({ ok: true, board: { boardId: 12 } }),
        }));
        render(<CreateBoardModal ownerId="owner" onClose={vi.fn()} onCreated={onCreated} />);

        fireEvent.change(screen.getByLabelText("Title"), { target: { value: "  Project  " } });
        fireEvent.change(screen.getByLabelText("Board size"), { target: { value: "1920 x 1080" } });
        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => expect(onCreated).toHaveBeenCalledWith(12));
        expect(fetch).toHaveBeenCalledWith("/api/boards", expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ title: "Project", width: 1920, height: 1080, ownerId: "owner" }),
        }));
    });

    it("shows create and rename API errors", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            json: vi.fn().mockResolvedValue({ ok: false, message: "Rejected" }),
        }));
        const create = render(<CreateBoardModal ownerId={null} onClose={vi.fn()} onCreated={vi.fn()} />);
        fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Board" } });
        fireEvent.click(screen.getByRole("button", { name: "Create" }));
        expect(await screen.findByText("Rejected")).toBeInTheDocument();
        create.unmount();

        render(<RenameBoardModal boardId={5} title="Old" onClose={vi.fn()} onRenamed={vi.fn()} />);
        fireEvent.click(screen.getByRole("button", { name: "Rename" }));
        expect(await screen.findByText("Rejected")).toBeInTheDocument();
    });

    it("renames a board and returns the server result", async () => {
        const onRenamed = vi.fn();
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            json: vi.fn().mockResolvedValue({ ok: true, board: { boardId: 5, title: "New title" } }),
        }));
        render(<RenameBoardModal boardId={5} title="Old" onClose={vi.fn()} onRenamed={onRenamed} />);

        fireEvent.change(screen.getByLabelText("Title"), { target: { value: "  New title  " } });
        fireEvent.click(screen.getByRole("button", { name: "Rename" }));

        await waitFor(() => expect(onRenamed).toHaveBeenCalledWith(5, "New title"));
        expect(fetch).toHaveBeenCalledWith("/api/boards/5", expect.objectContaining({
            method: "PATCH",
            body: JSON.stringify({ boardId: 5, title: "New title" }),
        }));
    });
});
