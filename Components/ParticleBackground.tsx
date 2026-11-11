"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initParticles = () => {
      const isMobile = window.innerWidth < 640;
      // Optimize particle count for mobile battery and frame rate
      const count = isMobile
        ? Math.min(26, Math.max(16, Math.floor(window.innerWidth / 15)))
        : Math.min(60, Math.floor(window.innerWidth / 24));

      particles = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * (isMobile ? 0.25 : 0.35),
        vy: (Math.random() - 0.5) * (isMobile ? 0.25 : 0.35),
        r: Math.random() * 1.6 + 1.1,
      }));
    };

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const drawParticles = () => {
      if (prefersReducedMotion) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const isMobile = window.innerWidth < 640;
      const maxDistance = isMobile ? 90 : 130;

      // Update positions
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
        if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;
      }

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < maxDistance) {
            ctx.strokeStyle = `rgba(34, 193, 255, ${(1 - d / maxDistance) * (isMobile ? 0.14 : 0.18)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw glowing particle nodes
      for (const p of particles) {
        const glowRadius = isMobile ? p.r * 3.5 : p.r * 4.5;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        g.addColorStop(0, "rgba(34, 193, 255, 0.9)");
        g.addColorStop(0.35, "rgba(139, 92, 246, 0.55)");
        g.addColorStop(1, "rgba(192, 38, 211, 0)");

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Center bright dot
        ctx.fillStyle = "#eef2ff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(drawParticles);
    };

    resizeCanvas();
    initParticles();
    drawParticles();

    const handleResize = () => {
      resizeCanvas();
      initParticles();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      style={{ background: "#0a0e1a" }}
    />
  );
}
