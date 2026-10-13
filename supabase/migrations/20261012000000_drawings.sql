-- Meus desenhos na nuvem: coleções, metadados do desenho e conteúdo (cena .excalidraw + cenários do play).
-- Cada linha pertence a um usuário (owner_id) e o RLS garante que ninguém lê ou altera o que não é seu.

create table public.collections (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

create table public.drawings (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  collection_id uuid references public.collections (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Miniatura webp em data URL; limite evita linha gigante (vai para o Storage numa fase seguinte).
  thumbnail text check (thumbnail is null or char_length(thumbnail) <= 300000)
);

-- Conteúdo separado: a lista "Meus desenhos" carrega rápido sem trazer cenas inteiras.
create table public.drawing_contents (
  drawing_id uuid primary key references public.drawings (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  scene jsonb not null,
  book jsonb not null,
  check (octet_length(scene::text) <= 15000000)
);

create index drawings_owner_updated_idx on public.drawings (owner_id, updated_at desc);
create index drawings_collection_idx on public.drawings (collection_id);
create index collections_owner_idx on public.collections (owner_id);
create index drawing_contents_owner_idx on public.drawing_contents (owner_id);

alter table public.collections enable row level security;
alter table public.drawings enable row level security;
alter table public.drawing_contents enable row level security;

-- (select auth.uid()) em vez de auth.uid(): o Postgres avalia uma vez por consulta, não por linha.
create policy "collections: dono lê" on public.collections for select to authenticated using (owner_id = (select auth.uid()));
create policy "collections: dono cria" on public.collections for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "collections: dono altera" on public.collections for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "collections: dono apaga" on public.collections for delete to authenticated using (owner_id = (select auth.uid()));

-- Desenho só pode apontar para coleção do próprio dono.
create policy "drawings: dono lê" on public.drawings for select to authenticated using (owner_id = (select auth.uid()));
create policy "drawings: dono cria" on public.drawings for insert to authenticated with check (
  owner_id = (select auth.uid())
  and (collection_id is null or exists (select 1 from public.collections c where c.id = collection_id and c.owner_id = (select auth.uid())))
);
create policy "drawings: dono altera" on public.drawings for update to authenticated using (owner_id = (select auth.uid())) with check (
  owner_id = (select auth.uid())
  and (collection_id is null or exists (select 1 from public.collections c where c.id = collection_id and c.owner_id = (select auth.uid())))
);
create policy "drawings: dono apaga" on public.drawings for delete to authenticated using (owner_id = (select auth.uid()));

-- Conteúdo só existe para desenho do próprio dono.
create policy "contents: dono lê" on public.drawing_contents for select to authenticated using (owner_id = (select auth.uid()));
create policy "contents: dono cria" on public.drawing_contents for insert to authenticated with check (
  owner_id = (select auth.uid())
  and exists (select 1 from public.drawings d where d.id = drawing_id and d.owner_id = (select auth.uid()))
);
create policy "contents: dono altera" on public.drawing_contents for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "contents: dono apaga" on public.drawing_contents for delete to authenticated using (owner_id = (select auth.uid()));

-- Anônimo (sem login) não acessa nada; authenticated só o que as policies acima liberam.
revoke all on public.collections, public.drawings, public.drawing_contents from anon;
grant select, insert, update, delete on public.collections, public.drawings, public.drawing_contents to authenticated;
