import React, { useState } from 'react';
import { ShimmerButton } from '../magicui/ShimmerButton';
import { BlurFade } from '../magicui/BlurFade';
import { fireBemieConfetti } from '../magicui/confetti';
import { createProduct, CreateProductInput } from '../../services/productsService';
import { X, Plus, Sparkles, Image as ImageIcon } from 'lucide-react';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => void;
}

export function CreateProductModal({ isOpen, onClose, onProductCreated }: CreateProductModalProps) {
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('');
  const [categoriaId, setCategoriaId] = useState('biquinis');
  const [preco, setPreco] = useState('');
  const [descontoPercentual, setDescontoPercentual] = useState('0');
  const [estoqueP, setEstoqueP] = useState('5');
  const [estoqueM, setEstoqueM] = useState('5');
  const [estoqueG, setEstoqueG] = useState('5');
  const [estoqueGG, setEstoqueGG] = useState('2');
  const [photoUrl, setPhotoUrl] = useState('/bemie/hero-clean.jpg');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numPreco = parseFloat(preco.replace(',', '.'));
    if (!nome.trim() || isNaN(numPreco) || numPreco <= 0) {
      setErrorMsg('Informe um nome válido e um preço maior que zero.');
      return;
    }

    setSubmitting(true);

    const input: CreateProductInput = {
      nome: nome.trim(),
      cor: cor.trim() || 'Exclusiva',
      categoriaId: categoriaId,
      preco: numPreco,
      descontoPercentual: parseFloat(descontoPercentual) || 0,
      ofertaTipo: parseFloat(descontoPercentual) > 0 ? 'desconto' : 'nenhuma',
      tamanhos: [
        { tamanho: 'P', quantidade: parseInt(estoqueP) || 0 },
        { tamanho: 'M', quantidade: parseInt(estoqueM) || 0 },
        { tamanho: 'G', quantidade: parseInt(estoqueG) || 0 },
        { tamanho: 'GG', quantidade: parseInt(estoqueGG) || 0 },
      ],
      photos: [photoUrl.trim() || '/bemie/hero-clean.jpg'],
    };

    const res = await createProduct(input);
    setSubmitting(false);

    if (res.success) {
      fireBemieConfetti({ particleCount: 80 });
      onProductCreated();
      onClose();
    } else {
      setErrorMsg(res.error || 'Erro ao cadastrar produto no Supabase.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <BlurFade duration={0.3} yOffset={16} className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-[#E6DFD5] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Topo do Modal */}
          <div className="px-6 py-5 border-b border-[#E6DFD5] flex items-center justify-between bg-[#FAFAF9]">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold">
                Novo Cadastro
              </span>
              <h2 className="text-xl font-serif text-[#1C1917]">Incluir Produto</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#736B63] hover:text-[#1C1917] hover:bg-stone-200/50 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mensagem de Erro */}
          {errorMsg && (
            <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Corpo do Formulário com Scroll */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#736B63] mb-1">
                  Nome da Peça *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Biquíni Cortininha Tulum"
                  className="w-full px-3 py-2 text-sm bg-[#FAFAF9] border border-[#E6DFD5] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#736B63] mb-1">
                  Cor / Variação
                </label>
                <input
                  type="text"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  placeholder="Ex: Terracota Dourado"
                  className="w-full px-3 py-2 text-sm bg-[#FAFAF9] border border-[#E6DFD5] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#736B63] mb-1">
                  Categoria
                </label>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FAFAF9] border border-[#E6DFD5] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="biquinis">Biquínis</option>
                  <option value="maios">Maiôs</option>
                  <option value="saidas">Saídas</option>
                  <option value="acessorios">Acessórios</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#736B63] mb-1">
                  Preço Base (R$) *
                </label>
                <input
                  type="text"
                  required
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="249.90"
                  className="w-full px-3 py-2 text-sm bg-[#FAFAF9] border border-[#E6DFD5] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#736B63] mb-1">
                  Desconto (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={descontoPercentual}
                  onChange={(e) => setDescontoPercentual(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm bg-[#FAFAF9] border border-[#E6DFD5] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>

            {/* Grade de Estoque por Tamanho */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#736B63] mb-1.5 font-medium">
                Grade de Estoque Inicial
              </label>
              <div className="grid grid-cols-4 gap-3 bg-[#FAFAF9] p-3 rounded-xl border border-[#E6DFD5]">
                <div className="text-center">
                  <span className="block text-xs font-semibold text-[#1C1917] mb-1">P</span>
                  <input
                    type="number"
                    min="0"
                    value={estoqueP}
                    onChange={(e) => setEstoqueP(e.target.value)}
                    className="w-full py-1 text-center text-sm bg-white border border-[#E6DFD5] rounded-lg"
                  />
                </div>
                <div className="text-center">
                  <span className="block text-xs font-semibold text-[#1C1917] mb-1">M</span>
                  <input
                    type="number"
                    min="0"
                    value={estoqueM}
                    onChange={(e) => setEstoqueM(e.target.value)}
                    className="w-full py-1 text-center text-sm bg-white border border-[#E6DFD5] rounded-lg"
                  />
                </div>
                <div className="text-center">
                  <span className="block text-xs font-semibold text-[#1C1917] mb-1">G</span>
                  <input
                    type="number"
                    min="0"
                    value={estoqueG}
                    onChange={(e) => setEstoqueG(e.target.value)}
                    className="w-full py-1 text-center text-sm bg-white border border-[#E6DFD5] rounded-lg"
                  />
                </div>
                <div className="text-center">
                  <span className="block text-xs font-semibold text-[#1C1917] mb-1">GG</span>
                  <input
                    type="number"
                    min="0"
                    value={estoqueGG}
                    onChange={(e) => setEstoqueGG(e.target.value)}
                    className="w-full py-1 text-center text-sm bg-white border border-[#E6DFD5] rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* URL da Foto */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#736B63] mb-1 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#C5A880]" />
                URL da Foto Principal
              </label>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="/bemie/hero-clean.jpg ou URL Supabase"
                className="w-full px-3 py-2 text-sm bg-[#FAFAF9] border border-[#E6DFD5] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#C5A880]"
              />
              <p className="text-[11px] text-[#A8A29E] mt-1">
                Pode ser caminho local (ex: /bemie/hero-clean.jpg) ou link direto do Supabase Storage.
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E6DFD5]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-[#736B63] hover:text-[#1C1917] transition-colors"
              >
                Cancelar
              </button>
              <ShimmerButton
                type="submit"
                disabled={submitting}
                className="py-2.5 px-6 text-xs"
                shimmerColor="#E5D5C0"
                background="#1C1917"
              >
                {submitting ? (
                  'Gravando...'
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                    Salvar Produto
                  </span>
                )}
              </ShimmerButton>
            </div>
          </form>
        </div>
      </BlurFade>
    </div>
  );
}
