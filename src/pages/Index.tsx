import { useState, useEffect, useCallback, useRef } from "react";

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
}

interface BurstHeart {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  scale: number;
  lifetime: number;
  maxLifetime: number;
}

const HeartSVG = ({ size, color, opacity, style, className }: {
  size: number;
  color: string;
  opacity: number;
  style?: React.CSSProperties;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    opacity={opacity}
    style={style}
    className={className}
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const HeartShape = ({ children }: { children: React.ReactNode }) => (
  <div className="relative flex items-center justify-center" style={{ width: 320, height: 300 }}>
    <svg viewBox="0 0 320 300" className="absolute inset-0 w-full h-full drop-shadow-lg">
      <defs>
        <filter id="heartShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#f9a8d4" floodOpacity="0.5" />
        </filter>
      </defs>
      <path
        d="M160 280 C160 280, 10 180, 10 100 C10 40, 70 10, 120 10 C145 10, 160 30, 160 50 C160 30, 175 10, 200 10 C250 10, 310 40, 310 100 C310 180, 160 280, 160 280Z"
        fill="hsl(340, 80%, 88%)"
        filter="url(#heartShadow)"
      />
    </svg>
    <div className="relative z-10 text-center px-12 pt-6 pb-10 max-w-[240px]">
      {children}
    </div>
  </div>
);

const Index = () => {
  const [choice, setChoice] = useState<"none" | "not_harmful" | "yourself">("none");
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [burstHearts, setBurstHearts] = useState<BurstHeart[]>([]);
  const [showResult, setShowResult] = useState(false);
  const animFrameRef = useRef<number>(0);
  const burstFrameRef = useRef<number>(0);
  const heartIdRef = useRef(0);

  useEffect(() => {
    const hearts: FloatingHeart[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 15 + Math.random() * 30,
      opacity: 0.08 + Math.random() * 0.15,
      speed: 0.2 + Math.random() * 0.4,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.005 + Math.random() * 0.015,
    }));
    setFloatingHearts(hearts);
  }, []);

  useEffect(() => {
    const animate = () => {
      setFloatingHearts(prev =>
        prev.map(h => ({
          ...h,
          y: h.y <= -5 ? 105 : h.y - h.speed * 0.1,
          wobble: h.wobble + h.wobbleSpeed,
          x: h.x + Math.sin(h.wobble) * 0.15,
        }))
      );
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  useEffect(() => {
    if (burstHearts.length === 0) return;

    const animate = () => {
      setBurstHearts(prev => {
        const updated = prev
          .map(h => ({
            ...h,
            x: h.x + h.vx,
            y: h.y + h.vy,
            vy: h.vy + 0.15,
            lifetime: h.lifetime + 1,
            rotation: h.rotation + h.vx * 2,
            scale: h.lifetime > h.maxLifetime * 0.7
              ? Math.max(0, 1 - (h.lifetime - h.maxLifetime * 0.7) / (h.maxLifetime * 0.3))
              : 1,
            opacity: h.lifetime > h.maxLifetime * 0.6
              ? Math.max(0, h.opacity - 0.02)
              : h.opacity,
          }))
          .filter(h => h.lifetime < h.maxLifetime);
        return updated;
      });
      burstFrameRef.current = requestAnimationFrame(animate);
    };
    burstFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(burstFrameRef.current);
  }, [burstHearts.length > 0]);

  const createBurst = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const newHearts: BurstHeart[] = Array.from({ length: 20 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const force = 3 + Math.random() * 6;
      return {
        id: ++heartIdRef.current,
        x: cx,
        y: cy,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force - 3,
        size: 12 + Math.random() * 20,
        opacity: 0.7 + Math.random() * 0.3,
        rotation: Math.random() * 360,
        scale: 1,
        lifetime: 0,
        maxLifetime: 80 + Math.random() * 60,
      };
    });
    setBurstHearts(prev => [...prev, ...newHearts]);
  }, []);

  const handleChoice = (type: "not_harmful" | "yourself", e: React.MouseEvent<HTMLButtonElement>) => {
    createBurst(e);
    setChoice(type);
    setTimeout(() => setShowResult(true), 400);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-caveat"
      style={{ background: "linear-gradient(180deg, hsl(340, 60%, 95%) 0%, hsl(340, 50%, 92%) 100%)" }}>

      {floatingHearts.map(h => (
        <HeartSVG
          key={h.id}
          size={h.size}
          color="hsl(340, 70%, 75%)"
          opacity={h.opacity}
          style={{
            position: "fixed",
            left: `${h.x}%`,
            top: `${h.y}%`,
            pointerEvents: "none",
            transition: "none",
            willChange: "transform",
          }}
        />
      ))}

      {burstHearts.map(h => (
        <HeartSVG
          key={h.id}
          size={h.size}
          color={`hsl(${335 + Math.random() * 15}, ${60 + Math.random() * 20}%, ${55 + Math.random() * 20}%)`}
          opacity={h.opacity}
          style={{
            position: "fixed",
            left: h.x,
            top: h.y,
            transform: `rotate(${h.rotation}deg) scale(${h.scale})`,
            pointerEvents: "none",
            filter: h.scale < 0.5 ? "blur(2px)" : "none",
            willChange: "transform, opacity",
          }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        <h1
          className="text-6xl md:text-8xl font-bold text-center leading-tight select-none"
          style={{
            color: "hsl(340, 70%, 40%)",
            textShadow: "0 2px 10px hsla(340, 70%, 60%, 0.3)",
          }}
        >
          ты вредни жопи
        </h1>

        {choice === "none" && (
          <div className="flex flex-col sm:flex-row gap-4 mt-4 animate-fade-in">
            <button
              onClick={(e) => handleChoice("not_harmful", e)}
              className="px-8 py-4 rounded-full text-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              style={{
                background: "linear-gradient(135deg, hsl(340, 70%, 65%), hsl(340, 80%, 55%))",
                color: "white",
                textShadow: "0 1px 2px rgba(0,0,0,0.1)",
              }}
            >
              я не вредный
            </button>
            <button
              onClick={(e) => handleChoice("yourself", e)}
              className="px-8 py-4 rounded-full text-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              style={{
                background: "linear-gradient(135deg, hsl(340, 60%, 75%), hsl(340, 70%, 65%))",
                color: "white",
                textShadow: "0 1px 2px rgba(0,0,0,0.1)",
              }}
            >
              сама ты вредни жопи
            </button>
          </div>
        )}

        {showResult && choice === "not_harmful" && (
          <div className="animate-scale-in mt-2">
            <HeartShape>
              <p
                className="text-xl md:text-2xl font-semibold leading-snug"
                style={{ color: "hsl(340, 70%, 35%)" }}
              >
                нет, ты вредни, но я тебя очень люблю, Коль
              </p>
            </HeartShape>
          </div>
        )}

        {showResult && choice === "yourself" && (
          <div className="animate-fade-in mt-4">
            <p
              className="text-2xl md:text-3xl font-semibold text-center max-w-md leading-relaxed"
              style={{
                color: "hsl(340, 70%, 40%)",
                textShadow: "0 1px 6px hsla(340, 70%, 60%, 0.2)",
              }}
            >
              да, я знаю, но ты все равно меня любишь. и я тебя очень люблю, любимый цветочек
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out both;
        }
        .animate-scale-in {
          animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>
    </div>
  );
};

export default Index;
