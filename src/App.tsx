import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';
import { ReactLenis, useLenis } from 'lenis/react';
import { TopBar } from './components/TopBar';
import { Menu } from './components/Menu';
import { BemieCatalog } from './components/BemieCatalog';
import { EaglePhotoTrio } from './components/EagleShowcase';
import { CtaWindow } from './components/CtaWindow';
import { InstagramGrid } from './components/InstagramGrid';
import { Footer } from './components/Footer';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { SiteFrames } from './components/SiteFrames';
import { SiteHero } from './components/SiteHero';
import { TrustMarquee } from './components/TrustMarquee';
import { AdminApp } from './components/admin/AdminApp';
import {
  PRELOADER_COUNTS,
  BEMIE_PRODUCTS,
} from './data/siteData';
import {
  resolveRouteTargetSelector,
  getStockForSize,
  CatalogFilterKey,
} from './utils/animationMath';

let isFirstVisit = true;

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  CustomEase.create('hop', '0.9, 0, 0.1, 1');
}

function loadSavedCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('bemie-loja-cart-v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function HomePage({ onNavigateToAdmin }: { onNavigateToAdmin?: () => void }) {
  const skipIntro =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [showLoader, setShowLoader] = useState(() => (skipIntro ? false : isFirstVisit));
  const [isLoaderRunning, setIsLoaderRunning] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(loadSavedCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<CatalogFilterKey>('todas');
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const lenis = useLenis();
  const didInitialScrollResetRef = useRef(false);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    const forceTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    forceTop();
    const rafId = window.requestAnimationFrame(forceTop);
    window.addEventListener('beforeunload', forceTop);
    return () => {
      isFirstVisit = false;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('beforeunload', forceTop);
    };
  }, []);

  useEffect(() => {
    if (lenis && !didInitialScrollResetRef.current) {
      didInitialScrollResetRef.current = true;
      lenis.scrollTo(0, { immediate: true });
    }
  }, [lenis]);

  useEffect(() => {
    try {
      window.localStorage.setItem('bemie-loja-cart-v1', JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  useEffect(() => {
    if (lenis) {
      if (isLoaderRunning || isCartOpen) {
        lenis.stop();
      } else {
        lenis.start();
      }
    }
  }, [lenis, isLoaderRunning, isCartOpen]);

  // Numana.com.ar viewport reveal observer ([data-transition="fade-in-up"] -> .is-inViewport)
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-transition]').forEach((el) => {
        el.classList.add('is-inViewport');
      });
      return;
    }

    const inViewportCallback: IntersectionObserverCallback = (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inViewport');
          entry.target.setAttribute('data-in-viewport', 'true');
          obs.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(inViewportCallback, {
      threshold: 0.06,
      rootMargin: '0px 0px -20px 0px',
    });

    const observeAllTargets = () => {
      document.querySelectorAll('[data-transition]:not(.is-inViewport)').forEach((el) => {
        observer.observe(el);
      });
    };

    observeAllTargets();

    const mutationObserver = new MutationObserver(() => {
      observeAllTargets();
    });
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [catalogCategoryFilter]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, 2400);
  }, []);

  const handleAddToCart = useCallback(
    (productId: string, size: string) => {
      const product = BEMIE_PRODUCTS.find((p) => p.id === productId);
      if (!product) return;
      const maxStock = getStockForSize(product.tamanhos, size);
      if (maxStock <= 0) {
        showToast('Tamanho esgotado');
        return;
      }

      setCart((prev) => {
        const existingIdx = prev.findIndex(
          (i) => i.produtoId === productId && i.tamanho === size
        );
        if (existingIdx >= 0) {
          const nextQty = Math.min(maxStock, prev[existingIdx].qty + 1);
          const copy = [...prev];
          copy[existingIdx] = { ...copy[existingIdx], qty: nextQty };
          return copy;
        }
        return [...prev, { produtoId: productId, tamanho: size, qty: 1 }];
      });

      showToast(`Adicionado ao carrinho — ${product.nome} (${size})`);
    },
    [showToast]
  );

  const handleUpdateQty = useCallback(
    (produtoId: string, tamanho: string, nextQty: number) => {
      const product = BEMIE_PRODUCTS.find((p) => p.id === produtoId);
      const maxStock = product ? getStockForSize(product.tamanhos, tamanho) : 0;
      const clamped = Math.min(nextQty, maxStock);

      setCart((prev) => {
        if (clamped <= 0) {
          return prev.filter((i) => !(i.produtoId === produtoId && i.tamanho === tamanho));
        }
        return prev.map((i) =>
          i.produtoId === produtoId && i.tamanho === tamanho ? { ...i, qty: clamped } : i
        );
      });
    },
    []
  );

  const handleClearCart = useCallback(() => {
    setCart([]);
    setIsCartOpen(false);
  }, []);

  const totalCartQty = cart.reduce((acc, item) => acc + item.qty, 0);

  useGSAP(
    () => {
      if (showLoader) {
        setIsLoaderRunning(true);
        gsap.registerPlugin(CustomEase);
        CustomEase.create('hop', '0.9, 0, 0.1, 1');

        const tl = gsap.timeline({ delay: 0.3, defaults: { ease: 'hop' } });
        const countEls = document.querySelectorAll('.count');

        countEls.forEach((count, index) => {
          const digits = count.querySelectorAll('.digit h1');
          tl.to(digits, { y: '0%', duration: 1, stagger: 0.075 }, index * 1);
          if (index < countEls.length) {
            tl.to(digits, { y: '-100%', duration: 1, stagger: 0.075 }, index * 1 + 1);
          }
        });

        tl.to(['.spinner', '.spinner-container', '.counter'], {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            gsap.set(['.spinner-container', '.counter'], { display: 'none' });
          },
        });
        tl.to('.word h1', { y: '0%', duration: 1 }, '<');
        tl.to('.divider', {
          scaleY: '100%',
          duration: 1,
          onComplete: () => gsap.to('.divider', { opacity: 0, duration: 0.3, delay: 0.3 }),
        });
        tl.to('#word-1 h1', { y: '100%', duration: 1, delay: 0.3 });
        tl.to('#word-2 h1', { y: '-100%', duration: 1 }, '<');
        tl.to(
          '.block',
          {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
            duration: 1,
            stagger: 0.1,
            delay: 0.75,
            onStart: () => {
              if (document.querySelector('.hero-img')) {
                gsap.to('.hero-img', { scale: 1, duration: 2, ease: 'hop' });
              }
            },
            onComplete: () => {
              gsap.set('.loader', { pointerEvents: 'none' });
              setIsLoaderRunning(false);
              setShowLoader(false);
            },
          },
          '<'
        );
      }
    },
    { dependencies: [showLoader] }
  );

  const handleNavigate = useCallback(
    (route: string) => {
      if (route === 'admin' || route === '#admin') {
        onNavigateToAdmin?.();
        return;
      }
      const selector = resolveRouteTargetSelector(route);
      if (selector === '.site-hero') {
        (window as unknown as { __bemieNavigating?: boolean }).__bemieNavigating = false;
        if (lenis) {
          lenis.start();
          lenis.scrollTo(0, { duration: 1.1 });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
      const targetEl = document.querySelector(selector);
      if (targetEl) {
        (window as unknown as { __bemieNavigating?: boolean }).__bemieNavigating = true;
        window.setTimeout(() => {
          (window as unknown as { __bemieNavigating?: boolean }).__bemieNavigating = false;
        }, 1350);
        if (lenis) {
          lenis.start();
          lenis.scrollTo(targetEl as HTMLElement, { duration: 1.15, offset: 0 });
        } else {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [lenis]
  );

  const handleSelectLookbookCategory = useCallback(
    (categoryFilter: CatalogFilterKey, productId: string) => {
      setCatalogCategoryFilter(categoryFilter);
      setHighlightedProductId(productId);

      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }
      highlightTimerRef.current = window.setTimeout(() => {
        setHighlightedProductId(null);
      }, 3400);

      (window as unknown as { __bemieNavigating?: boolean }).__bemieNavigating = true;
      window.setTimeout(() => {
        (window as unknown as { __bemieNavigating?: boolean }).__bemieNavigating = false;
      }, 1500);

      window.setTimeout(() => {
        const targetProductCard = document.querySelector(
          `#page3 [data-product-id="${productId}"]`
        ) as HTMLElement | null;
        const catalogSection = (document.querySelector('.bemie-catalog-section') ||
          document.querySelector('#page3')) as HTMLElement | null;
        const targetEl = catalogSection || targetProductCard;

        if (targetEl) {
          if (lenis) {
            lenis.start();
            lenis.scrollTo(targetEl, { duration: 1.15, offset: 0 });
          } else {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 60);
    },
    [lenis]
  );

  const handleOpenCart = useCallback(() => setIsCartOpen(true), []);
  const handleCloseCart = useCallback(() => setIsCartOpen(false), []);
  const handleExploreCatalog = useCallback(() => handleNavigate('#page3'), [handleNavigate]);
  const handleInstagramSelectProduct = useCallback(
    (productId: string) => handleSelectLookbookCategory('todas', productId),
    [handleSelectLookbookCategory]
  );

  return (
    <>
      <SiteFrames />

      <TopBar
        onNavigate={handleNavigate}
        cartCount={totalCartQty}
        onOpenCart={handleOpenCart}
        onSelectCategoryFilter={setCatalogCategoryFilter}
      />

      {showLoader && (
        <div className="loader">
          <div className="overlay">
            <div className="block" />
            <div className="block" />
          </div>
          <div className="intro-logo">
            <div className="word" id="word-1">
              <h1>
                <span>Bemiê</span>
              </h1>
            </div>
            <div className="word" id="word-2">
              <h1>Moda Praia</h1>
            </div>
          </div>
          <div className="divider" />
          <div className="spinner-container">
            <div className="spinner" />
          </div>
          <div className="counter">
            {PRELOADER_COUNTS.map(([d1, d2], idx) => (
              <div className="count" key={idx}>
                <div className="digit">
                  <h1>{d1}</h1>
                </div>
                <div className="digit">
                  <h1>{d2}</h1>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Menu
        cartCount={totalCartQty}
        onOpenCart={handleOpenCart}
        onNavigate={handleNavigate}
      />

      <SiteHero onExploreCatalog={handleExploreCatalog} />

      <TrustMarquee />

      <EaglePhotoTrio onSelectCategory={handleSelectLookbookCategory} />

      <BemieCatalog
        onAddToCart={handleAddToCart}
        selectedCategoryFilter={catalogCategoryFilter}
        onCategoryFilterChange={setCatalogCategoryFilter}
        highlightedProductId={highlightedProductId}
      />

      <TrustMarquee />

      <InstagramGrid
        onSelectProduct={handleInstagramSelectProduct}
      />

      <CtaWindow
        img="/assets/aistudio/cta-window-editorial.jpg"
        header="Bemiê"
        callout="Compre pelo catálogo e finalize no WhatsApp"
      />

      <Footer
        onNavigate={handleNavigate}
        onOpenCart={handleOpenCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={handleCloseCart}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onClearCart={handleClearCart}
        onNavigateCatalog={handleExploreCatalog}
      />

      {toastMsg && (
        <div className="bemie-toast" role="status" aria-live="polite">
          {toastMsg}
        </div>
      )}
    </>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState<'store' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const isHashAdmin = window.location.hash === '#admin';
      const isPathAdmin = window.location.pathname.startsWith('/admin');
      const isQueryAdmin = new URLSearchParams(window.location.search).get('view') === 'admin';
      return isHashAdmin || isPathAdmin || isQueryAdmin ? 'admin' : 'store';
    }
    return 'store';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const isHashAdmin = window.location.hash === '#admin';
      const isPathAdmin = window.location.pathname.startsWith('/admin');
      const isQueryAdmin = new URLSearchParams(window.location.search).get('view') === 'admin';
      setCurrentView(isHashAdmin || isPathAdmin || isQueryAdmin ? 'admin' : 'store');
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigateToStore = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = '';
      if (window.location.pathname.startsWith('/admin')) {
        window.history.pushState(null, '', '/');
      }
    }
    setCurrentView('store');
  };

  const navigateToAdmin = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = '#admin';
    }
    setCurrentView('admin');
  };

  if (currentView === 'admin') {
    return <AdminApp onBackToStore={navigateToStore} />;
  }

  return (
    <ReactLenis root>
      <HomePage onNavigateToAdmin={navigateToAdmin} />
    </ReactLenis>
  );
}
