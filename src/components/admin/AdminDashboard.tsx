import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BemieProduct } from '../../data/siteData';
import {
  getLiveBemieProducts,
  updateProductPrice,
  updateProductStock,
  softDeleteProduct,
  signOutAdmin,
} from '../../services/productsService';
import { ShimmerButton } from '../magicui/ShimmerButton';
import { NumberTicker } from '../magicui/NumberTicker';
import { BlurFade } from '../magicui/BlurFade';
import { fireBemieConfetti } from '../magicui/confetti';
import { CreateProductModal } from './CreateProductModal';
import {
  Plus,
  Search,
  ExternalLink,
  LogOut,
  RefreshCw,
  Package,
  Layers,
  DollarSign,
  Trash2,
  Check,
  Edit2,
  ChevronRight,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToStore: () => void;
  onLogout: () => void;
}

export function AdminDashboard({ onBackToStore, onLogout }: AdminDashboardProps) {
  const [products, setProducts] = useState<BemieProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState('');
  const [tempDiscount, setTempDiscount] = useState('0');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const live = await getLiveBemieProducts();
    setProducts(live);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleLogout = async () => {
    await signOutAdmin();
    onLogout();
  };

  // Filtragem
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat =
        categoryFilter === 'todas' || p.categoria.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, categoryFilter]);

  // Estatísticas calculadas
  const totalProducts = products.length;
  const totalStock = useMemo(() => {
    return products.reduce((acc, p) => {
      const itemStock = p.tamanhos?.reduce((sum, s) => sum + s.q, 0) || p.estoqueInicial || 0;
      return acc + itemStock;
    }, 0);
  }, [products]);

  const averagePrice = useMemo(() => {
    if (products.length === 0) return 0;
    const sum = products.reduce((acc, p) => acc + p.preco, 0);
    return Math.round(sum / products.length);
  }, [products]);

  // Edição rápida de preço
  const startEditPrice = (product: BemieProduct) => {
    setEditingPriceId(product.id);
    setTempPrice(product.preco.toString());
    setTempDiscount((product.descontoPercentual || 0).toString());
  };

  const savePrice = async (productId: string) => {
    const newPrice = parseFloat(tempPrice.replace(',', '.'));
    const newDiscount = parseFloat(tempDiscount) || 0;
    if (isNaN(newPrice) || newPrice <= 0) {
      showToast('Preço inválido');
      return;
    }

    setSavingId(productId);
    const ofertaTipo = newDiscount > 0 ? 'desconto' : 'nenhuma';
    const res = await updateProductPrice(productId, newPrice, newDiscount, ofertaTipo);
    setSavingId(null);

    if (res.success) {
      fireBemieConfetti({ particleCount: 40 });
      showToast('Preço atualizado com sucesso no Supabase!');
      setEditingPriceId(null);
      // Atualiza estado local
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                preco: newPrice,
                descontoPercentual: newDiscount,
                ofertaTipo,
                precoPromocional:
                  ofertaTipo === 'desconto' ? Number((newPrice * (1 - newDiscount / 100)).toFixed(2)) : 0,
              }
            : p
        )
      );
    } else {
      showToast('Erro ao atualizar preço: ' + res.error);
    }
  };

  // Ajuste rápido de estoque
  const adjustStock = async (productId: string, tamanho: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const currentSize = product.tamanhos?.find((s) => s.t === tamanho);
    const currentQty = currentSize ? currentSize.q : 0;
    const newQty = Math.max(0, currentQty + delta);

    // Otimista
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const updatedSizes = (p.tamanhos || []).map((s) =>
          s.t === tamanho ? { ...s, q: newQty } : s
        );
        return { ...p, tamanhos: updatedSizes };
      })
    );

    const res = await updateProductStock(productId, tamanho, newQty);
    if (!res.success) {
      showToast('Erro ao salvar estoque no Supabase');
      fetchProducts();
    }
  };

  // Remoção de produto
  const handleDeleteProduct = async (productId: string, nome: string) => {
    if (!window.confirm(`Deseja remover "${nome}" do catálogo da loja?`)) return;

    const res = await softDeleteProduct(productId);
    if (res.success) {
      showToast(`Produto "${nome}" removido do catálogo.`);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } else {
      showToast('Erro ao remover: ' + res.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#1C1917] font-sans">
      {/* Barra Superior / Header do Admin */}
      <header className="bg-white border-b border-[#E6DFD5] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-bold">
                Bemiê Admin
              </span>
            </div>
            <h1 className="text-lg font-serif tracking-tight text-[#1C1917] hidden sm:block">
              Gestão de Coleção
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchProducts}
              disabled={loading}
              title="Recarregar dados do banco"
              className="p-2 text-[#736B63] hover:text-[#1C1917] hover:bg-[#FAFAF9] rounded-xl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onBackToStore}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-[#736B63] hover:text-[#1C1917] bg-[#FAFAF9] hover:bg-[#F5F3EF] border border-[#E6DFD5] rounded-xl transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver Vitrine
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/60 rounded-xl transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Painel de Métricas (Magic UI NumberTicker) */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <BlurFade delay={0.05} yOffset={8}>
            <div className="bg-white p-6 rounded-2xl border border-[#E6DFD5] shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-[#736B63] mb-3">
                <span className="text-xs uppercase tracking-wider font-medium">Produtos Ativos</span>
                <Package className="w-4 h-4 text-[#C5A880]" />
              </div>
              <div className="text-3xl font-serif text-[#1C1917] flex items-baseline gap-1">
                <NumberTicker value={totalProducts} />
                <span className="text-xs text-[#A8A29E] font-sans">itens</span>
              </div>
            </div>
          </BlurFade>

          <BlurFade delay={0.1} yOffset={8}>
            <div className="bg-white p-6 rounded-2xl border border-[#E6DFD5] shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-[#736B63] mb-3">
                <span className="text-xs uppercase tracking-wider font-medium">Estoque Total</span>
                <Layers className="w-4 h-4 text-[#C5A880]" />
              </div>
              <div className="text-3xl font-serif text-[#1C1917] flex items-baseline gap-1">
                <NumberTicker value={totalStock} />
                <span className="text-xs text-[#A8A29E] font-sans">peças</span>
              </div>
            </div>
          </BlurFade>

          <BlurFade delay={0.15} yOffset={8}>
            <div className="bg-white p-6 rounded-2xl border border-[#E6DFD5] shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-[#736B63] mb-3">
                <span className="text-xs uppercase tracking-wider font-medium">Preço Médio</span>
                <DollarSign className="w-4 h-4 text-[#C5A880]" />
              </div>
              <div className="text-3xl font-serif text-[#1C1917] flex items-baseline gap-1">
                <span className="text-lg font-sans text-[#736B63]">R$</span>
                <NumberTicker value={averagePrice} decimalPlaces={0} />
              </div>
            </div>
          </BlurFade>
        </section>

        {/* Barra de Filtros e Adição de Produto */}
        <section className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6DFD5] shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            {/* Input de Busca */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou cor..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-[#FAFAF9] border border-[#E6DFD5] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* Filtro de Categoria */}
            <div className="sm:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAFAF9] border border-[#E6DFD5] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#C5A880]"
              >
                <option value="todas">Todas as categorias</option>
                <option value="biquinis">Biquínis</option>
                <option value="maios">Maiôs</option>
                <option value="saidas">Saídas</option>
                <option value="acessorios">Acessórios</option>
              </select>
            </div>
          </div>

          {/* Botão Adicionar Produto (Magic UI ShimmerButton) */}
          <ShimmerButton
            onClick={() => setIsCreateModalOpen(true)}
            shimmerColor="#E5D5C0"
            background="#1C1917"
            className="py-2.5 px-5 text-xs font-semibold"
          >
            <span className="flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#C5A880]" />
              Incluir Produto
            </span>
          </ShimmerButton>
        </section>

        {/* Lista e Gestão dos Produtos */}
        <section className="bg-white rounded-2xl border border-[#E6DFD5] shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E6DFD5] flex items-center justify-between">
            <h2 className="text-base font-serif text-[#1C1917]">
              Catálogo de Peças ({filteredProducts.length})
            </h2>
            <span className="text-xs text-[#736B63]">
              Edição direta de preços e estoque por tamanho
            </span>
          </div>

          {loading ? (
            <div className="p-16 text-center text-[#736B63] space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#C5A880]" />
              <p className="text-xs uppercase tracking-wider">Carregando catálogo do Supabase...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-16 text-center text-[#736B63] space-y-2">
              <p className="font-serif text-lg text-[#1C1917]">Nenhum produto encontrado</p>
              <p className="text-xs">Tente ajustar a busca ou adicionar um novo item.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E6DFD5]">
              {filteredProducts.map((product) => {
                const isEditingThisPrice = editingPriceId === product.id;
                const photo = product.photos?.[0] || '/bemie/hero-clean.jpg';

                return (
                  <div
                    key={product.id}
                    className="p-5 sm:p-6 hover:bg-[#FAFAF9]/60 transition-colors flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between"
                  >
                    {/* Bloco 1: Foto e Dados Básicos */}
                    <div className="flex items-center gap-4 min-w-[280px]">
                      <div className="w-16 h-20 bg-[#F5F3EF] rounded-xl overflow-hidden flex-shrink-0 border border-[#E6DFD5] relative group">
                        <img
                          src={photo}
                          alt={product.nome}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#C5A880]">
                          {product.categoria}
                        </span>
                        <h3 className="font-serif text-base text-[#1C1917] leading-tight">
                          {product.nome}
                        </h3>
                        <p className="text-xs text-[#736B63] mt-0.5">
                          Cor: <span className="text-[#1C1917] font-medium">{product.cor}</span>
                        </p>
                        <span className="inline-block mt-1 text-[10px] text-[#A8A29E] font-mono">
                          ID: {product.id}
                        </span>
                      </div>
                    </div>

                    {/* Bloco 2: Gestão de Preço & Desconto Inline */}
                    <div className="flex-1 w-full lg:w-auto bg-[#FAFAF9] p-3.5 rounded-xl border border-[#E6DFD5]">
                      <div className="text-[10px] uppercase tracking-wider text-[#736B63] font-medium mb-1.5 flex items-center justify-between">
                        <span>Preço & Oferta</span>
                        {!isEditingThisPrice && (
                          <button
                            onClick={() => startEditPrice(product)}
                            className="text-[#C5A880] hover:text-[#1C1917] flex items-center gap-1 text-[11px]"
                          >
                            <Edit2 className="w-3 h-3" /> Alterar Preço
                          </button>
                        )}
                      </div>

                      {isEditingThisPrice ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] text-[#736B63]">Preço (R$)</span>
                              <input
                                type="text"
                                value={tempPrice}
                                onChange={(e) => setTempPrice(e.target.value)}
                                className="w-full px-2.5 py-1 text-sm bg-white border border-[#E6DFD5] rounded-lg focus:border-[#C5A880] focus:outline-none"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-[#736B63]">Desconto (%)</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={tempDiscount}
                                onChange={(e) => setTempDiscount(e.target.value)}
                                className="w-full px-2.5 py-1 text-sm bg-white border border-[#E6DFD5] rounded-lg focus:border-[#C5A880] focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => savePrice(product.id)}
                              disabled={savingId === product.id}
                              className="px-3 py-1 bg-[#1C1917] text-white text-xs rounded-lg hover:bg-stone-800 transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5 text-[#C5A880]" />
                              {savingId === product.id ? 'Gravando...' : 'Salvar Preço'}
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="px-2 py-1 text-xs text-[#736B63] hover:text-[#1C1917]"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <span className="font-serif text-lg font-medium text-[#1C1917]">
                            R$ {product.preco.toFixed(2).replace('.', ',')}
                          </span>
                          {product.ofertaTipo === 'desconto' && product.descontoPercentual > 0 && (
                            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              -{product.descontoPercentual}% (Promo R${' '}
                              {product.precoPromocional.toFixed(2).replace('.', ',')})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bloco 3: Gestão de Estoque por Tamanho */}
                    <div className="w-full lg:w-auto">
                      <div className="text-[10px] uppercase tracking-wider text-[#736B63] font-medium mb-1.5">
                        Estoque por Tamanho
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {['P', 'M', 'G', 'GG'].map((tam) => {
                          const sizeObj = product.tamanhos?.find((s) => s.t === tam);
                          const qty = sizeObj ? sizeObj.q : 0;
                          const isLow = qty <= 2;

                          return (
                            <div
                              key={tam}
                              className="flex items-center bg-[#FAFAF9] border border-[#E6DFD5] rounded-xl px-2 py-1 gap-1.5"
                            >
                              <span className="text-xs font-semibold text-[#1C1917]">{tam}</span>
                              <span
                                className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${
                                  isLow
                                    ? 'bg-amber-100 text-amber-800 font-bold'
                                    : 'text-[#1C1917]'
                                }`}
                              >
                                {qty}
                              </span>
                              <div className="flex items-center gap-0.5 ml-1">
                                <button
                                  onClick={() => adjustStock(product.id, tam, -1)}
                                  title={`Diminuir estoque ${tam}`}
                                  className="w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-stone-200 text-[#736B63] hover:text-[#1C1917] text-xs transition-colors"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => adjustStock(product.id, tam, 1)}
                                  title={`Aumentar estoque ${tam}`}
                                  className="w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-stone-200 text-[#736B63] hover:text-[#1C1917] text-xs transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bloco 4: Ações / Excluir */}
                    <div className="flex items-center gap-2 self-end lg:self-center">
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.nome)}
                        title="Remover produto do catálogo"
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Modal de Criação de Produto */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProductCreated={fetchProducts}
      />

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1917] text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-stone-800 animate-in slide-in-from-bottom-2 duration-300">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
