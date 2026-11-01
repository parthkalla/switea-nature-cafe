import { useEffect } from 'react';

/**
 * 60fps / 120fps Real-Time 3D Scroll Parallax Engine for Mobile & Desktop.
 * Uses IntersectionObserver to track visible cards + requestAnimationFrame
 * to deliver punchy, visible 3D tilt and food image displacement without lag.
 */
export function useFoodParallax() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const activeCards = new Set<HTMLElement>();

    // 1. IntersectionObserver: Only track cards currently in or near viewport (2-4 cards on phone)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const card = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            activeCards.add(card);
          } else {
            activeCards.delete(card);
            // Reset transforms when scrolled off-screen to release GPU layer
            const img = card.querySelector<HTMLElement>('.parallax-img');
            if (img) img.style.transform = '';
            card.style.transform = '';
          }
        });
      },
      {
        rootMargin: '100px 0px 100px 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    const observeAllCards = () => {
      const cards = document.querySelectorAll<HTMLElement>('.parallax-card');
      cards.forEach((c) => observer.observe(c));
    };

    observeAllCards();

    // Re-observe if dynamic items load or category changes
    const mutationObserver = new MutationObserver(() => {
      observeAllCards();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // 2. High-speed, buttery-smooth RAF scroll loop
    let ticking = false;

    const updateParallax = () => {
      const vh = window.innerHeight;

      activeCards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        // Normalized ratio: -0.5 when card is at top of viewport, +0.5 when at bottom
        const ratio = cardCenter / vh - 0.5;

        // Image vertical shift: -24px (scrolled past) to +24px (coming up)
        const imgShiftY = Math.round(ratio * 46);

        // Card 3D perspective tilt: tilts slightly toward viewer on entry, straightens in middle
        const cardTiltX = (ratio * 5).toFixed(1);

        // Apply GPU-accelerated transforms
        const img = card.querySelector<HTMLElement>('.parallax-img');
        if (img) {
          img.style.transform = `scale(1.2) translate3d(0, ${imgShiftY}px, 0)`;
        }

        // Apply subtle 3D card tilt
        card.style.transform = `perspective(900px) rotateX(${cardTiltX}deg)`;

        // Dynamic light reflection glare
        const glare = card.querySelector<HTMLElement>('.scroll-glare');
        if (glare) {
          const glarePercent = Math.round((ratio + 0.5) * 100);
          glare.style.opacity = `${Math.max(0.1, 0.45 - Math.abs(ratio) * 0.7)}`;
          glare.style.background = `linear-gradient(${120 + ratio * 40}deg, transparent ${glarePercent - 25}%, rgba(255,255,255,0.4) ${glarePercent}%, transparent ${glarePercent + 25}%)`;
        }
      });

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateParallax();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      observer.disconnect();
      mutationObserver.disconnect();
      activeCards.clear();
    };
  }, []);
}
