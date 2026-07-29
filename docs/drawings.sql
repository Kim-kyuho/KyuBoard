CREATE TABLE public.drawings (
    drawing_id serial PRIMARY KEY,
    board_id integer NOT NULL UNIQUE,
    source jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT drawings_board_id_fkey
        FOREIGN KEY (board_id)
        REFERENCES public.boards(board_id)
        ON DELETE CASCADE
);
