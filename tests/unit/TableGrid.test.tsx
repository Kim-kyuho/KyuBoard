import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TableGrid from "@/components/TableGrid";
import type { TableSource } from "@/lib/table-card";

const initialSource: TableSource = {
    columns: [
        { id: "name", name: "Name", width: 160 },
        { id: "role", name: "Role", width: 160 },
    ],
    rows: [
        { id: "row-1", cells: { name: "Kyu", role: "Admin" } },
        { id: "row-2", cells: { name: "Lee", role: "User" } },
    ],
};

function TableHarness({ isEditing = true }: { isEditing?: boolean }) {
    const [source, setSource] = useState(initialSource);
    return (
        <>
            <TableGrid source={source} isEditing={isEditing} onChange={setSource} />
            <output data-testid="source">{JSON.stringify(source)}</output>
        </>
    );
}

describe("TableGrid", () => {
    beforeEach(() => {
        vi.spyOn(crypto, "randomUUID")
            .mockReturnValueOnce("new-column-id")
            .mockReturnValueOnce("new-row-id");
    });

    it("keeps cell and column inputs mounted while editing values", () => {
        render(<TableHarness />);
        const columnInput = screen.getAllByLabelText("Column name")[0];
        const cellInput = screen.getByDisplayValue("Kyu");

        fireEvent.change(columnInput, { target: { value: "Member" } });
        fireEvent.change(cellInput, { target: { value: "Kyuho" } });

        expect(columnInput).toHaveValue("Member");
        expect(cellInput).toHaveValue("Kyuho");
        expect(screen.getByTestId("source")).toHaveTextContent('"name":"Member"');
        expect(screen.getByTestId("source")).toHaveTextContent('"name":"Kyuho"');
    });

    it("adds a column and a row with initialized cells", () => {
        render(<TableHarness />);

        fireEvent.click(screen.getByRole("button", { name: /Column$/ }));
        fireEvent.click(screen.getByRole("button", { name: /Row$/ }));

        const source = JSON.parse(screen.getByTestId("source").textContent ?? "") as TableSource;
        expect(source.columns.at(-1)).toEqual({ id: "new-column-id", name: "Column 3", width: 160 });
        expect(source.rows.at(-1)).toEqual({
            id: "new-row-id",
            cells: { name: "", role: "", "new-column-id": "" },
        });
    });

    it("deletes a column and its cells but never deletes the final column", () => {
        render(<TableHarness />);

        fireEvent.click(screen.getByRole("button", { name: "Delete Name" }));
        let source = JSON.parse(screen.getByTestId("source").textContent ?? "") as TableSource;
        expect(source.columns.map((column) => column.id)).toEqual(["role"]);
        expect(source.rows[0].cells).toEqual({ role: "Admin" });
        expect(screen.queryByRole("button", { name: "Delete Role" })).not.toBeInTheDocument();

        source = JSON.parse(screen.getByTestId("source").textContent ?? "") as TableSource;
        expect(source.columns).toHaveLength(1);
    });

    it("renders values without editing controls in read-only mode", () => {
        render(<TableHarness isEditing={false} />);
        expect(screen.getByText("Kyu")).toBeInTheDocument();
        expect(screen.queryByPlaceholderText("Filter table")).not.toBeInTheDocument();
        expect(screen.queryByLabelText("Column name")).not.toBeInTheDocument();
    });
});
