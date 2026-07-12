CREATE TABLE public.tables (
    table_id serial PRIMARY KEY,
    board_id integer NOT NULL,
    source jsonb NOT NULL,
    x integer NOT NULL DEFAULT 0,
    y integer NOT NULL DEFAULT 0,
    z integer NOT NULL DEFAULT 1,
    width integer NOT NULL,
    height integer NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT tables_board_id_fkey
        FOREIGN KEY (board_id)
        REFERENCES public.boards(board_id)
        ON DELETE CASCADE
);
