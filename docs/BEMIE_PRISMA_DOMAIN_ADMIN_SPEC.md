# 🏖️ Bemiê Moda Praia — Especificação Canônica de Domínio & Painel Admin (Prisma V5.0)

**Classificação:** DOMAIN & ADMIN SPECIFICATION  
**Target:** Prisma V5.0 (Factory 1: Design Intocado / Factory 2: Engenharia Blindada)  
**Status:** 🟢 Aprovado para Execução  

---

## 1. Princípio Soberano: Design Intocado & Zero Visual Drift

> [!IMPORTANT]
> **DIRETRIZ DE DESIGN DO CLIENTE (NÃO-NEGOCIÁVEL):**
> O design visual, a paleta de cores (tons areia, terracota, dourado e off-white), a tipografia refinada, as microinterações GSAP, o zoom de produto e a estrutura estética atual da Bemiê **NÃO DEVEM SER MODIFICADOS**.
> O **Padrão de Qualidade Prisma** é aplicado exclusivamente como **motor de engenharia de backend e arquitetura**, substituindo arquivos JSON estáticos e links de WhatsApp por persistência transacional real, Server Actions seguras, RLS e concorrência atômica.

---

## 2. Mapeamento do Frontend Atual como Domínio

O frontend existente em `bemie3/src/components` é a nossa **Fábrica 1 (Gaveta de Tela)**:

| Componente Atual | Papel no Domínio | Tratamento Prisma (Zero Drift) |
|:---|:---|:---|
| [`BemieCatalog.tsx`](file:///C:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismainglesv4.6/bemie3/src/components/BemieCatalog.tsx) | Vitrine principal de produtos e filtros | Mantém 100% do layout e paginação; consome dados reativos do PostgreSQL em vez de JSON estático. |
| [`CartDrawer.tsx`](file:///C:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismainglesv4.6/bemie3/src/components/CartDrawer.tsx) | Gaveta de carrinho e formulário de entrega | Mantém todos os campos, inputs e estilos intactos; o botão "Avançar" dispara a Server Action do Mercado Pago. |
| [`ProductImageZoom.tsx`](file:///C:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismainglesv4.6/bemie3/src/components/ProductImageZoom.tsx) | Zoom e galeria de fotos | Preservado pixel a pixel; consome URLs do Supabase Storage. |
| [`EagleShowcase.tsx`](file:///C:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismainglesv4.6/bemie3/src/components/EagleShowcase.tsx) | Vídeos Reels em loop | Preservado integralmente consumindo `/bemie/reels/reel-*.mp4`. |

---

## 3. Especificação do Domínio Admin (/admin)

O Painel Administrativo adota a **mesma linguagem visual e elegância da Bemiê** (design minimalista, tipografia limpa e tons claros), integrando 4 operações fundamentais de gestão:

```
┌────────────────────────────────────────────────────────┐
│             PAINEL ADMINISTRATIVO BEMIÊ                │
├────────────────────────────────────────────────────────┤
│ 1. INCLUIR PRODUTO (Upload, fotos, grade P/M/G)        │
│ 2. REMOVER PRODUTO (Soft-delete seguro com histórico)  │
│ 3. TROCAR PREÇO & DESCONTO (Edição inline em tempo real│
│ 4. AJUSTE DE ESTOQUE (Gestão por tamanho / Esgotar)    │
└────────────────────────────────────────────────────────┘
```

---

### 3.1 Funcionalidade 1: Incluir Produto (Create)

Permite cadastrar novas coleções e peças diretamente pelo painel.

* **Campos Obrigatórios:**
  * Nome do Produto (ex: *"Biquíni Cortininha Tulum"*).
  * Cor / Variação (ex: *"Terracota e Dourado"*).
  * Categoria (`biquinis`, `maios`, `saidas`, `acessorios`).
  * Preço Base (R$).
  * Desconto Opcional (%) e Oferta Ativa (`desconto` | `nenhuma`).
  * Grade de Estoque por Tamanho: `P` (qtd), `M` (qtd), `G` (qtd), `GG` (qtd).
  * Upload de Fotos: Múltiplas imagens, salvas no Supabase Storage mantendo a nomenclatura padronizada `p_{id}_{index}.jpg`.

* **Contrato Zod (Fábrica 2 — Validação Estrita):**
```typescript
export const CreateProductSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cor: z.string().min(2, "Cor é obrigatória"),
  categoriaId: z.string().min(1, "Categoria é obrigatória"),
  preco: z.number().positive("Preço deve ser maior que zero"),
  descontoPercentual: z.number().min(0).max(100).default(0),
  ofertaTipo: z.enum(["desconto", "nenhuma"]).default("nenhuma"),
  tamanhos: z.array(z.object({
    tamanho: z.enum(["P", "M", "G", "GG", "U"]),
    quantidade: z.number().int().min(0)
  })).min(1, "Informe ao menos um tamanho"),
  photos: z.array(z.string().url()).min(1, "Adicione pelo menos uma foto")
});
```

* **Server Action Segura:**
```typescript
"use server";

export async function createProductAction(input: z.infer<typeof CreateProductSchema>): Promise<ActionResponse<Product>> {
  // 1. Validar sessão de Admin no servidor (Kill Switch K8)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'admin') {
    return { success: false, error: "Acesso não autorizado." };
  }

  // 2. Validação de dados com Zod
  const validated = CreateProductSchema.parse(input);

  // 3. Inserção transacional com geração de ID no padrão p_xxxx
  const productId = `p_${generateShortId()}`;
  // Persiste em products, product_sizes e product_photos...
  return { success: true, data: newProduct };
}
```

---

### 3.2 Funcionalidade 2: Remover Produto (Soft-Delete)

* **Regra de Ouro Prisma:** Um produto com histórico de compras no Mercado Pago **nunca deve sofrer `DELETE` físico**, pois isso corromperia os pedidos anteriores da cliente (`order_items`).
* **Comportamento:** O botão "Excluir" aplica `deleted_at = now()` e `ativo = false`.
* **Efeito:** O produto desaparece instantaneamente da vitrine pública do catálogo, mas o histórico financeiro permanece 100% íntegro.

* **Server Action:**
```typescript
"use server";

export async function softDeleteProductAction(productId: string): Promise<ActionResponse<boolean>> {
  const supabase = await createClient();
  // Checagem de role de Admin...
  const { error } = await supabase
    .from("products")
    .update({ ativo: false, deleted_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: true };
}
```

---

### 3.3 Funcionalidade 3: Trocar Preço e Desconto (Inline Quick-Edit)

Permite à dona da loja alterar preços e criar promoções relâmpago de 20% com 1 clique na tabela do admin.

* **Campos Editáveis:**
  * `preco`: Valor cheio da peça.
  * `descontoPercentual`: Percentual de desconto.
  * `ofertaTipo`: Ativação imediata da tag "20% OFF" na foto do produto.
* **Cálculo Automático:** O `precoPromocional` é recalculado pelo banco via trigger ou pela Server Action: `preco - (preco * (descontoPercentual / 100))`.
* **Sem Redeploy:** A alteração reflete imediatamente no catálogo do site em menos de 1 segundo.

* **Server Action:**
```typescript
"use server";

export async function updateProductPriceAction(input: {
  productId: string;
  preco: number;
  descontoPercentual: number;
  ofertaTipo: "desconto" | "nenhuma";
}): Promise<ActionResponse<boolean>> {
  const supabase = await createClient();
  // Validação Zod + Validação Admin...
  const precoPromocional = input.ofertaTipo === "desconto"
    ? Number((input.preco * (1 - input.descontoPercentual / 100)).toFixed(2))
    : input.preco;

  const { error } = await supabase
    .from("products")
    .update({
      preco: input.preco,
      desconto_percentual: input.descontoPercentual,
      preco_promocional: precoPromocional,
      oferta_tipo: input.ofertaTipo,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.productId);

  return { success: !error, error: error?.message };
}
```

---

### 3.4 Funcionalidade 4: Ajuste de Estoque por Tamanho & Botão "Esgotar"

* Gestão visual de quantidade por grade:
  * `[ - ]  P: 2 un  [ + ]`
  * `[ - ]  M: 1 un  [ + ]`
  * `[ - ]  G: 0 un  [ + ]`
* **Botão "Esgotar Peça":** Zera todas as grades de tamanho com 1 clique, fazendo a badge "Esgotado" aparecer na vitrine e desabilitando o botão de compra.

---

## 4. Segurança e Governança Prisma (Kill Switches)

1. **Kill Switch K8 (Trust Boundary Server-Side):**
   * Nenhuma requisição do painel envia `isAdmin: true` no corpo da requisição. Toda Server Action valida `auth.getUser()` diretamente no token de sessão JWT emitido pelo Supabase Auth.
2. **Universal RLS:**
   * A tabela `products` possui política de leitura pública para produtos ativos (`SELECT WHERE ativo = true AND deleted_at IS NULL`).
   * Políticas de `INSERT`, `UPDATE` e `DELETE` são restritas exclusivamente a usuários administradores.
3. **Imutabilidade de Auditoria:**
   * Toda troca de preço e alteração de estoque gera log na tabela `audit_logs`, registrando quem alterou, quando e o valor anterior.
