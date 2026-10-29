import React, { useState } from 'react';
import { ShimmerButton } from '../magicui/ShimmerButton';
import { BlurFade } from '../magicui/BlurFade';
import { signInAdmin } from '../../services/productsService';
import { ShieldCheck, Lock, Mail, ArrowLeft, Sparkles } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToStore: () => void;
}

export function AdminLogin({ onLoginSuccess, onBackToStore }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor, informe seu email e senha de administrador.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await signInAdmin(email, password);
    setLoading(false);

    if (res.success) {
      onLoginSuccess();
    } else {
      // Mensagem clara e amigável
      setErrorMsg(
        res.error === 'Invalid login credentials'
          ? 'Credenciais inválidas. Verifique o email e senha digitados.'
          : res.error || 'Falha ao autenticar no Supabase Auth.'
      );
    }
  };

  const handleDemoAccess = () => {
    // Acesso demonstrativo para desenvolvimento/apresentação
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Moldura de luxo sutil */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#C5A880]" />

      <BlurFade delay={0.1} yOffset={12}>
        <div className="w-full max-w-md bg-white border border-[#E6DFD5] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-8 sm:p-10 relative">
          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <span className="inline-block text-[11px] uppercase tracking-[0.3em] text-[#C5A880] font-semibold mb-2">
              Área de Gestão
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-[#1C1917]">
              Bemiê Moda Praia
            </h1>
            <p className="text-xs text-[#736B63] mt-2 tracking-wide">
              Controle de catálogo, estoque em tempo real e preços
            </p>
          </div>

          {/* Alerta de erro */}
          {errorMsg && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
              <span className="font-bold">⚠️</span>
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#736B63] font-medium mb-1.5">
                E-mail Administrativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bemie.com.br"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FAFAF9] border border-[#E6DFD5] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#736B63] font-medium mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FAFAF9] border border-[#E6DFD5] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <ShimmerButton
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-xs text-center"
                shimmerColor="#E5D5C0"
                background="#1C1917"
              >
                {loading ? (
                  'Verificando...'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                    Acessar Painel
                  </span>
                )}
              </ShimmerButton>
            </div>
          </form>

          {/* Divisor */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E6DFD5]" />
            </div>
            <span className="relative bg-white px-3 text-[10px] uppercase tracking-wider text-[#A8A29E]">
              ou modo desenvolvimento
            </span>
          </div>

          {/* Botão Acesso Rápido Demo */}
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full py-2.5 px-4 text-xs text-[#736B63] hover:text-[#1C1917] bg-[#FAFAF9] hover:bg-[#F5F3EF] border border-[#E6DFD5] rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            Entrar como Administrador (Demo / Dev)
          </button>

          {/* Voltar à loja */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex items-center gap-1.5 text-xs text-[#736B63] hover:text-[#1C1917] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar para o catálogo Bemiê
            </button>
          </div>
        </div>
      </BlurFade>
    </div>
  );
}
