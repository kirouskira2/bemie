const fs = require('fs');

async function run() {
  const token = process.env.SUPABASE_ACCESS_TOKEN || "";
  const projectRef = process.env.SUPABASE_PROJECT_REF || "frhfhytzxjoponzpxbtt";
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  const blocks = [
    // 1. Categories
    `create table if not exists public.categories (
      id text primary key,
      name text not null,
      slug text not null unique,
      sort_order int default 0,
      created_at timestamptz default now()
    );`,

    // 2. Products
    `create table if not exists public.products (
      id text primary key,
      nome text not null,
      cor text not null,
      categoria_id text references public.categories(id),
      preco decimal(10,2) not null check (preco > 0),
      preco_promocional decimal(10,2) default 0,
      desconto_percentual int default 0 check (desconto_percentual >= 0 and desconto_percentual <= 100),
      oferta_tipo text default 'nenhuma' check (oferta_tipo in ('desconto', 'nenhuma')),
      ativo boolean not null default true,
      deleted_at timestamptz,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );`,

    // 3. Product Sizes
    `create table if not exists public.product_sizes (
      id uuid default gen_random_uuid() primary key,
      product_id text references public.products(id) on delete cascade not null,
      tamanho text not null check (tamanho in ('P', 'M', 'G', 'GG', 'U')),
      quantidade int not null default 0 check (quantidade >= 0),
      unique(product_id, tamanho)
    );`,

    // 4. Product Photos
    `create table if not exists public.product_photos (
      id uuid default gen_random_uuid() primary key,
      product_id text references public.products(id) on delete cascade not null,
      url text not null,
      sort_order int default 0
    );`,

    // 5. Orders
    `create table if not exists public.orders (
      id uuid default gen_random_uuid() primary key,
      mp_payment_id text unique,
      mp_preference_id text,
      status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled', 'refunded')),
      payment_method text check (payment_method in ('pix', 'credit_card', 'debit_card', 'whatsapp_manual')),
      subtotal decimal(10,2) not null check (subtotal >= 0),
      shipping_cost decimal(10,2) not null default 0 check (shipping_cost >= 0),
      total decimal(10,2) not null check (total >= 0),
      shipping_method text default 'correios',
      tracking_code text,
      carrier text,
      customer_name text not null,
      customer_email text,
      customer_phone text not null,
      customer_cpf text,
      shipping_address jsonb not null,
      customer_notes text,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );`,

    // 6. Order Items
    `create table if not exists public.order_items (
      id uuid default gen_random_uuid() primary key,
      order_id uuid references public.orders(id) on delete cascade not null,
      product_id text references public.products(id),
      tamanho text not null,
      quantidade int not null check (quantidade > 0),
      preco_unitario decimal(10,2) not null check (preco_unitario >= 0),
      total_item decimal(10,2) not null check (total_item >= 0)
    );`,

    // 7. Processed Events
    `create table if not exists public.processed_events (
      id uuid default gen_random_uuid() primary key,
      event_id text not null unique,
      source text not null,
      status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
      response_payload jsonb,
      created_at timestamptz default now(),
      processed_at timestamptz
    );`,

    // 8. Indexes
    `create index if not exists idx_products_active on public.products(ativo) where deleted_at is null;
     create index if not exists idx_products_category on public.products(categoria_id);
     create index if not exists idx_product_sizes_lookup on public.product_sizes(product_id, tamanho);
     create index if not exists idx_product_photos_order on public.product_photos(product_id, sort_order);
     create index if not exists idx_orders_status on public.orders(status);
     create index if not exists idx_processed_events_source on public.processed_events(source, created_at desc);`,

    // 9. RLS Enablement
    `alter table public.categories enable row level security;
     alter table public.products enable row level security;
     alter table public.product_sizes enable row level security;
     alter table public.product_photos enable row level security;
     alter table public.orders enable row level security;
     alter table public.order_items enable row level security;
     alter table public.processed_events enable row level security;`,

    // 10. RLS Policies
    `drop policy if exists "Allow public read categories" on public.categories;
     create policy "Allow public read categories" on public.categories for select using (true);

     drop policy if exists "Allow public read active products" on public.products;
     create policy "Allow public read active products" on public.products for select using (ativo = true and deleted_at is null);

     drop policy if exists "Allow public read product sizes" on public.product_sizes;
     create policy "Allow public read product sizes" on public.product_sizes for select using (true);

     drop policy if exists "Allow public read product photos" on public.product_photos;
     create policy "Allow public read product photos" on public.product_photos for select using (true);

     drop policy if exists "Allow public insert orders" on public.orders;
     create policy "Allow public insert orders" on public.orders for insert with check (true);

     drop policy if exists "Allow public read own order" on public.orders;
     create policy "Allow public read own order" on public.orders for select using (true);

     drop policy if exists "Allow public insert order items" on public.order_items;
     create policy "Allow public insert order items" on public.order_items for insert with check (true);

     drop policy if exists "Allow public read order items" on public.order_items;
     create policy "Allow public read order items" on public.order_items for select using (true);

     drop policy if exists "Allow backend access processed events" on public.processed_events;
     create policy "Allow backend access processed events" on public.processed_events for all using (true);`,

    // 11. RPC: Atomic Stock Deduction
    `create or replace function public.atomic_deduct_product_stock(
      p_product_id text,
      p_tamanho text,
      p_quantidade int
    ) returns boolean as $$
    declare
      v_updated int;
    begin
      update public.product_sizes
      set quantidade = quantidade - p_quantidade
      where product_id = p_product_id
        and tamanho = p_tamanho
        and quantidade >= p_quantidade;

      get diagnostics v_updated = row_count;
      return v_updated > 0;
    end;
    $$ language plpgsql security definer;`,

    // 12. RPC: Claim Idempotent Event
    `create or replace function public.claim_idempotent_event(
      p_event_id text,
      p_source text
    ) returns table (
      is_duplicate boolean,
      current_status text,
      cached_payload jsonb
    ) as $$
    declare
      v_existing public.processed_events%rowtype;
    begin
      select * into v_existing 
      from public.processed_events
      where event_id = p_event_id 
      for update;

      if found then
        return query select true, v_existing.status, v_existing.response_payload;
        return;
      end if;

      insert into public.processed_events (event_id, source, status)
      values (p_event_id, p_source, 'processing');

      return query select false, 'processing'::text, null::jsonb;
    end;
    $$ language plpgsql security definer;`
  ];

  for (let i = 0; i < blocks.length; i++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: blocks[i] })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`❌ Bloco ${i + 1} falhou:`, err);
      process.exit(1);
    } else {
      console.log(`✅ Bloco ${i + 1}/${blocks.length} executado com sucesso.`);
    }
  }

  console.log("🎉 TODAS AS 12 ETAPAS DE MIGRAÇÃO FORAM CONCLUÍDAS COM SUCESSO!");
}

run().catch(console.error);
