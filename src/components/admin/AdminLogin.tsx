import React, { useState } from 'react';
import { Particles } from '../magicui/Particles';
import { BorderBeam } from '../magicui/BorderBeam';
import { signInAdmin } from '../../services/productsService';
import { ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';

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
      setErrorMsg(
        res.error === 'Invalid login credentials'
          ? 'Credenciais inválidas. Verifique o email e senha digitados.'
          : res.error || 'Falha ao autenticar no Supabase Auth.'
      );
    }
  };

  const handleDemoAccess = () => {
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* 1. Fundo Radial escuro idêntico ao AURA */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black" />

      {/* 2. Efeito de Partículas Interativas (Magic UI Particles) */}
      <Particles
        className="pointer-events-none absolute inset-0 z-0"
        quantity={75}
        ease={70}
        color="#ffffff"
        refresh
      />

      {/* 3. Container Central */}
      <div className="relative z-10 w-full max-w-md">
        {/* Cabeçalho da Marca */}
        <div className="text-center mb-8">
          <button
            type="button"
            onClick={onBackToStore}
            className="text-4xl font-bold tracking-tighter text-white inline-block mb-3 hover:opacity-90 transition-opacity font-serif cursor-pointer"
          >
            BEMIÊ<span className="text-[#ffaa40]">.</span>
          </button>
          <h1 className="text-2xl font-medium tracking-tight text-white">Portal Exclusivo</h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Acesse o portfólio restrito e gestão de catálogo.
          </p>
        </div>

        {/* Card Glassmorphism com BorderBeam do Magic UI */}
        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden">
          {/* BorderBeam animado contínuo */}
          <BorderBeam size={240} duration={8} colorFrom="#ffaa40" colorTo="#9c40ff" />

          {/* Feedback de Erro */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-start gap-2.5 relative z-10">
              <span className="font-bold">⚠️</span>
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Formulário Estilo AURA */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
            <div>
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vip@bemie.com.br"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all text-sm"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-widest text-zinc-500 block"
                >
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => alert('Para redefinir sua senha, solicite ao administrador do sistema ou Supabase.')}
                  className="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  Esqueceu?
                </button>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all text-sm"
              />
            </div>

            {/* Botão Shimmer Button Estilo AURA (Branco com texto preto e brilho) */}
            <button
              type="submit"
              disabled={loading}
              style={
                {
                  '--spread': '90deg',
                  '--shimmer-color': '#000000',
                  '--radius': '12px',
                  '--speed': '3s',
                  '--cut': '0.05em',
                  '--bg': '#ffffff',
                } as React.CSSProperties
              }
              className="group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden [border-radius:var(--radius)] border border-white/10 px-6 py-3 whitespace-nowrap text-black [background:var(--bg)] transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px mt-2 w-full h-12 rounded-xl disabled:opacity-50"
            >
              <div className="-z-30 blur-[2px] absolute inset-0 overflow-visible">
                <div className="animate-shimmer-slide absolute inset-0 aspect-square h-full rounded-none">
                  <div className="animate-spin-around absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]" />
                </div>
              </div>

              <span className="text-black font-semibold text-sm whitespace-pre-wrap flex items-center gap-2">
                {loading ? 'Validando...' : 'Entrar no Portal'}
              </span>

              <div className="absolute inset-0 size-full rounded-xl px-4 py-1.5 shadow-[inset_0_-8px_10px_#ffffff1f] transform-gpu transition-all duration-300 ease-in-out group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]" />
            </button>
          </form>

          {/* Divisor */}
          <div className="relative my-6 text-center z-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative bg-zinc-900/90 px-3 text-[10px] uppercase tracking-wider text-zinc-500">
              ou acesso direto
            </span>
          </div>

          {/* Botão Acesso Rápido Demo Estilo AURA */}
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full py-2.5 px-4 text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center justify-center gap-2 relative z-10"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#ffaa40]" />
            Acessar como Administrador (Demo / Dev)
          </button>

          {/* Link para voltar */}
          <div className="mt-6 text-center relative z-10">
            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar para o catálogo Bemiê
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
