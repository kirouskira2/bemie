const fs = require('fs');

async function seed() {
  const token = process.env.SUPABASE_ACCESS_TOKEN || "";
  const projectRef = process.env.SUPABASE_PROJECT_REF || "frhfhytzxjoponzpxbtt";
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  async function querySql(sql) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HTTP ${res.status}: ${err}`);
    }
    return res.json();
  }

  console.log("🌱 Iniciando o Seed dos dados da Bemiê...");

  // 1. Inserir Categorias
  const categories = [
    { id: 'biquinis', name: 'Biquínis', slug: 'biquinis', sort_order: 1 },
    { id: 'maios', name: 'Maiôs', slug: 'maios', sort_order: 2 },
    { id: 'saidas', name: 'Saídas de Praia', slug: 'saidas', sort_order: 3 },
    { id: 'acessorios', name: 'Acessórios', slug: 'acessorios', sort_order: 4 }
  ];

  for (const cat of categories) {
    await querySql(`
      insert into public.categories (id, name, slug, sort_order)
      values ('${cat.id}', '${cat.name}', '${cat.slug}', ${cat.sort_order})
      on conflict (id) do update set name = excluded.name;
    `);
  }
  console.log("✅ Categorias inseridas.");

  // 2. Ler os produtos do JSON
  const rawData = fs.readFileSync('bemie3/src/data/bemieProducts.json', 'utf8');
  const products = JSON.parse(rawData);

  console.log(`Carregados ${products.length} produtos de bemieProducts.json.`);

  for (const p of products) {
    // Sanitização de strings para SQL
    const nomeSafe = p.nome.replace(/'/g, "''");
    const corSafe = (p.cor || '').replace(/'/g, "''");
    const categoriaId = p.categoria || 'biquinis';
    const preco = Number(p.preco) || 0;
    const desconto = Number(p.descontoPercentual) || 0;
    const ofertaTipo = p.ofertaTipo === 'desconto' ? 'desconto' : 'nenhuma';
    const precoPromo = ofertaTipo === 'desconto' && desconto > 0 
      ? Number((preco * (1 - desconto / 100)).toFixed(2)) 
      : 0;

    // Inserir Produto
    await querySql(`
      insert into public.products (
        id, nome, cor, categoria_id, preco, preco_promocional, desconto_percentual, oferta_tipo, ativo
      ) values (
        '${p.id}', '${nomeSafe}', '${corSafe}', '${categoriaId}', ${preco}, ${precoPromo}, ${desconto}, '${ofertaTipo}', true
      ) on conflict (id) do update set
        nome = excluded.nome,
        cor = excluded.cor,
        preco = excluded.preco,
        preco_promocional = excluded.preco_promocional,
        desconto_percentual = excluded.desconto_percentual,
        oferta_tipo = excluded.oferta_tipo;
    `);

    // Inserir Tamanhos
    if (Array.isArray(p.tamanhos)) {
      for (const t of p.tamanhos) {
        const tamSafe = t.t.toUpperCase();
        const qty = Number(t.q) || 0;
        await querySql(`
          insert into public.product_sizes (product_id, tamanho, quantidade)
          values ('${p.id}', '${tamSafe}', ${qty})
          on conflict (product_id, tamanho) do update set quantidade = excluded.quantidade;
        `);
      }
    }

    // Inserir Fotos
    if (Array.isArray(p.photos)) {
      for (let idx = 0; idx < p.photos.length; idx++) {
        const photoUrl = p.photos[idx];
        await querySql(`
          insert into public.product_photos (product_id, url, sort_order)
          values ('${p.id}', '${photoUrl}', ${idx});
        `);
      }
    }

    console.log(`  -> Produto ${p.id} (${p.nome.substring(0, 25)}...) migrado.`);
  }

  console.log("🎉 SEED COMPLETO COM SUCESSO!");
}

seed().catch(err => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
