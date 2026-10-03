import type { CSSProperties } from "react";

type Particle = {
  id: number;
  dotStyle: CSSProperties & {
    "--particle-delay": string;
    "--particle-duration": string;
  };
  outerStyle: CSSProperties;
};

function pseudoRandom(input: number) {
  const value = Math.sin(input * 12.9898) * 43_758.5453;
  return value - Math.floor(value);
}

function createParticles(): Particle[] {
  const particles: Particle[] = [];
  let randomInput = 1;

  for (let index = 0; index < 90; index++) {
    const x = pseudoRandom(randomInput++) * 100;
    const y = pseudoRandom(randomInput++) * 100;
    const dx = (x - 50) / 50;
    const dy = (y - 50) / 46;
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

    if (distanceFromCenter < 0.5) continue;

    const fade = Math.min(1, (distanceFromCenter - 0.5) / 0.55);
    const size = 1.2 + pseudoRandom(randomInput++) * 2.6;
    const brightness = 0.45 + pseudoRandom(randomInput++) * 0.55;
    const glow = size * (1.6 + pseudoRandom(randomInput++) * 1.4);
    const duration = 2.6 + pseudoRandom(randomInput++) * 4.5;
    const delay = -pseudoRandom(randomInput++) * duration;

    particles.push({
      id: index,
      outerStyle: {
        left: `${x.toFixed(3)}%`,
        opacity: Number((fade * brightness).toFixed(3)),
        top: `${y.toFixed(3)}%`,
      },
      dotStyle: {
        "--particle-delay": `${delay.toFixed(2)}s`,
        "--particle-duration": `${duration.toFixed(2)}s`,
        boxShadow: `0 0 ${glow.toFixed(1)}px ${(glow * 0.35).toFixed(1)}px rgba(255,255,255,.55)`,
        height: `${size.toFixed(2)}px`,
        width: `${size.toFixed(2)}px`,
      },
    });
  }

  return particles;
}

const particles = createParticles();

export default function ParticleField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {particles.map((particle) => (
        <span
          className="absolute -translate-x-1/2 -translate-y-1/2"
          key={particle.id}
          style={particle.outerStyle}
        >
          <span
            className="particle-dot block rounded-full bg-white"
            style={particle.dotStyle}
          />
        </span>
      ))}
    </div>
  );
}
