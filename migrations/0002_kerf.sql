-- Kerf dual-bin inventory. Per-user. TEXT ids (Better Auth user ids are text).

create table if not exists kerf_items (
  id text primary key,
  user_id text not null,
  sku text not null,
  name text not null,
  category text not null default 'spares',
  unit text not null default 'pcs',
  billed_qty integer not null default 0,
  ghost_qty integer not null default 0,
  billed_cost numeric(14,2) not null default 0,
  selling_price numeric(14,2) not null default 0,
  reorder_level integer not null default 0,
  tally_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists kerf_items_user_sku on kerf_items (user_id, sku);
create index if not exists kerf_items_user on kerf_items (user_id);
create index if not exists kerf_items_tally on kerf_items (user_id, tally_name);

create table if not exists kerf_batches (
  id text primary key,
  user_id text not null,
  kind text not null,
  channel text not null,
  party text,
  voucher_no text,
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  meta text
);

create index if not exists kerf_batches_user on kerf_batches (user_id, occurred_at desc);

create table if not exists kerf_moves (
  id text primary key,
  user_id text not null,
  item_id text not null references kerf_items(id) on delete cascade,
  batch_id text references kerf_batches(id) on delete set null,
  kind text not null,
  bin text not null,
  qty integer not null,
  unit_price numeric(14,2) not null default 0,
  channel text not null,
  party text,
  voucher_no text,
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists kerf_moves_user on kerf_moves (user_id, occurred_at desc);
create index if not exists kerf_moves_item on kerf_moves (item_id);
create index if not exists kerf_moves_batch on kerf_moves (batch_id);
