import React, { useState } from 'react';
import { Particles } from '../magicui/Particles';
import { BorderBeam } from '../magicui/BorderBeam';
import { ShimmerButton } from '../magicui/ShimmerButton';
import { signInAdmin } from '../../services/productsService';

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
      setErrorMsg('Credenciais inválidas.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await signInAdmin(email, password);
    setLoading(false);

    if (res.success) {
      onLoginSuccess();
    } else {
      setErrorMsg('Credenciais inválidas.');
    }
  };

  const handleSolicitarAcesso = (e: React.MouseEvent) => {
    e.preventDefault();
    // Acesso demonstrativo / VIP liberado
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans select-none">
      {/* 1. Fundo radial escuro idêntico ao print */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black" />

      {/* 2. Particles oficial Magic UI */}
      <Particles
        className="absolute inset-0 z-0"
        quantity={150}
        ease={80}
        color="#ffffff"
        refresh={true}
      />

      {/* Botão sutil discreto no topo para voltar à loja */}
      <button
        type="button"
        onClick={onBackToStore}
        title="Voltar para o catálogo"
        className="absolute top-6 left-6 z-20 text-xs text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <span>←</span>
        <span>Voltar à loja</span>
      </button>

      {/* 3. Card Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Cabeçalho exatamente como no print */}
        <div className="text-center mb-10">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onBackToStore();
            }}
            className="text-4xl font-bold tracking-tighter text-white inline-block mb-4 hover:opacity-90 transition-opacity cursor-pointer"
          >
            AURA.
          </a>
          <h1 className="text-2xl font-medium tracking-tight text-white">Portal Exclusivo</h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Acesse o portfólio restrito e oportunidades off-market.
          </p>
        </div>

        {/* Card Glassmorphism com BorderBeam do Magic UI */}
        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden">
          <BorderBeam size={250} duration={12} delay={9} />

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block"
                htmlFor="email"
              >
                E-MAIL
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all text-sm"
                placeholder="vip@exemplo.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  className="text-xs font-semibold uppercase tracking-widest text-zinc-500 block"
                  htmlFor="password"
                >
                  SENHA
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Entre em contato com o suporte para redefinir sua senha.');
                  }}
                  className="text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  Esqueceu?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

            <ShimmerButton
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-12 rounded-xl disabled:opacity-50"
              background="#ffffff"
              shimmerColor="#000000"
            >
              <span className="text-black font-semibold text-sm whitespace-pre-wrap">
                {loading ? 'Autenticando...' : 'Entrar no Portal'}
              </span>
            </ShimmerButton>

            <p className="text-center text-xs text-zinc-500 mt-2">
              Ainda não é um cliente VIP?{' '}
              <button
                type="button"
                onClick={handleSolicitarAcesso}
                className="text-white font-medium hover:underline cursor-pointer"
              >
                Solicite seu acesso
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
