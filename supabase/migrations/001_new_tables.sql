-- order_comments: per-order communication log
create table if not exists order_comments (
  id          uuid primary key default gen_random_uuid(),
  order_id    text not null,
  author      text not null default 'Admin',
  content     text not null,
  type        text not null default 'note', -- 'note' | 'email' | 'call'
  created_at  timestamptz not null default now()
);
create index if not exists order_comments_order_id_idx on order_comments(order_id);
alter table order_comments enable row level security;
drop policy if exists "allow all" on order_comments;
create policy "allow all" on order_comments for all using (true);

-- forwarders: freight forwarder management
create table if not exists forwarders (
  id          text primary key,
  name        text not null,
  country     text not null default '',
  city        text not null default '',
  contact     text not null default '',
  email       text not null default '',
  phone       text not null default '',
  website     text,
  rating      int not null default 0,
  routes      text[] not null default '{}',
  services    text[] not null default '{}',
  status      text not null default 'aktiv',
  notes       text,
  created_at  timestamptz not null default now()
);
alter table forwarders enable row level security;
drop policy if exists "allow all" on forwarders;
create policy "allow all" on forwarders for all using (true);

-- samples: Musterverwaltung
create table if not exists samples (
  id          text primary key,
  product     text not null,
  buyer_id    text not null,
  qty         text not null default '',
  supplier_id text not null default '',
  courier     text not null default '',
  tracking    text not null default '',
  sent_at     date,
  status      text not null default 'in_transit',
  feedback    text not null default '—',
  created_at  timestamptz not null default now()
);
alter table samples enable row level security;
drop policy if exists "allow all" on samples;
create policy "allow all" on samples for all using (true);
