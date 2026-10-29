import { supabase } from '../lib/supabase';
import { BemieProduct } from '../data/siteData';
import localProductsJson from '../data/bemieProducts.json';

/**
 * Serviço de Produtos Bemiê (Prisma V5.0)
 * Integração reativa com Supabase PostgreSQL + Fallback estático
 */
export async function getLiveBemieProducts(): Promise<BemieProduct[]> {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        nome,
        cor,
        categoria_id,
        preco,
        preco_promocional,
        desconto_percentual,
        oferta_tipo,
        ativo,
        product_sizes (
          tamanho,
          quantidade
        ),
        product_photos (
          url,
          sort_order
        )
      `)
      .eq('ativo', true)
      .is('deleted_at', null)
      .order('id', { ascending: true });

    if (error || !products || products.length === 0) {
      console.warn('⚠️ Supabase indisponível ou vazio. Usando catálogo estático fallback.');
      return localProductsJson as unknown as BemieProduct[];
    }

    // Mapeamento idêntico ao contrato BemieProduct
    return products.map((p: any) => {
      const sortedPhotos = (p.product_photos || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((ph: any) => ph.url);

      const tamanhos = (p.product_sizes || []).map((s: any) => ({
        t: s.tamanho,
        q: s.quantidade,
      }));

      const tamanhoStr = tamanhos.map((s: any) => s.t).join(', ');
      const estoqueTotal = tamanhos.reduce((acc: number, s: any) => acc + s.q, 0);

      return {
        id: p.id,
        nome: p.nome,
        cor: p.cor,
        categoria: (p.categoria_id as any) || 'biquinis',
        styleTag: 'marquinha',
        estilos: ['marquinha', 'beachwear'],
        preco: Number(p.preco),
        ofertaTipo: (p.oferta_tipo as any) || 'nenhuma',
        descontoPercentual: Number(p.desconto_percentual) || 0,
        precoPromocional: Number(p.preco_promocional) || 0,
        tamanho: tamanhoStr || 'U',
        tamanhos: tamanhos,
        estoqueInicial: estoqueTotal,
        photos: sortedPhotos.length > 0 ? sortedPhotos : ['/bemie/hero-clean.jpg'],
        description: `Biquíni exclusivo Bemiê Moda Praia na cor ${p.cor}.`,
      };
    });
  } catch (err) {
    console.error('Erro ao conectar ao Supabase:', err);
    return localProductsJson as unknown as BemieProduct[];
  }
}

/**
 * Atualização rápida de preço e desconto (Admin)
 */
export async function updateProductPrice(
  productId: string,
  preco: number,
  descontoPercentual: number,
  ofertaTipo: 'desconto' | 'nenhuma'
): Promise<{ success: boolean; error?: string }> {
  try {
    const precoPromocional =
      ofertaTipo === 'desconto' && descontoPercentual > 0
        ? Number((preco * (1 - descontoPercentual / 100)).toFixed(2))
        : 0;

    const { error } = await supabase
      .from('products')
      .update({
        preco: preco,
        desconto_percentual: descontoPercentual,
        preco_promocional: precoPromocional,
        oferta_tipo: ofertaTipo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Atualização de estoque por tamanho (Admin)
 */
export async function updateProductStock(
  productId: string,
  tamanho: string,
  quantidade: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('product_sizes')
      .update({ quantidade })
      .eq('product_id', productId)
      .eq('tamanho', tamanho);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Soft delete de produto (Admin)
 */
export async function softDeleteProduct(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('products')
      .update({
        ativo: false,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface CreateProductInput {
  nome: string;
  cor: string;
  categoriaId: string;
  preco: number;
  descontoPercentual?: number;
  ofertaTipo?: 'desconto' | 'nenhuma';
  tamanhos: { tamanho: string; quantidade: number }[];
  photos: string[];
}

/**
 * Criação de novo produto no Supabase (Admin)
 */
export async function createProduct(
  input: CreateProductInput
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const productId = `p_${Date.now().toString(36)}`;
    const desconto = input.descontoPercentual || 0;
    const oferta = input.ofertaTipo || (desconto > 0 ? 'desconto' : 'nenhuma');
    const precoPromocional =
      oferta === 'desconto' && desconto > 0
        ? Number((input.preco * (1 - desconto / 100)).toFixed(2))
        : 0;

    // 1. Inserir Produto
    const { error: prodErr } = await supabase.from('products').insert({
      id: productId,
      nome: input.nome.trim(),
      cor: input.cor.trim(),
      categoria_id: input.categoriaId,
      preco: input.preco,
      preco_promocional: precoPromocional,
      desconto_percentual: desconto,
      oferta_tipo: oferta,
      ativo: true,
    });

    if (prodErr) throw prodErr;

    // 2. Inserir Tamanhos
    if (input.tamanhos && input.tamanhos.length > 0) {
      const sizesToInsert = input.tamanhos.map((s) => ({
        product_id: productId,
        tamanho: s.tamanho,
        quantidade: Math.max(0, s.quantidade),
      }));

      const { error: sizeErr } = await supabase.from('product_sizes').insert(sizesToInsert);
      if (sizeErr) console.warn('Aviso ao inserir tamanhos:', sizeErr.message);
    }

    // 3. Inserir Fotos
    if (input.photos && input.photos.length > 0) {
      const photosToInsert = input.photos.map((url, idx) => ({
        product_id: productId,
        url: url.trim(),
        sort_order: idx,
      }));

      const { error: photoErr } = await supabase.from('product_photos').insert(photosToInsert);
      if (photoErr) console.warn('Aviso ao inserir fotos:', photoErr.message);
    }

    return { success: true, id: productId };
  } catch (err: any) {
    console.error('Erro ao criar produto:', err);
    return { success: false, error: err.message || 'Falha ao salvar produto' };
  }
}

/**
 * Autenticação de Admin via Supabase Auth
 */
export async function signInAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro inesperado no login' };
  }
}

/**
 * Logout do Admin
 */
export async function signOutAdmin(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Erro ao encerrar sessão:', err);
  }
}

/**
 * Obter sessão atual de Admin
 */
export async function getAdminSession() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}
