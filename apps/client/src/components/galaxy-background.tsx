"use client";

import { useEffect, useRef } from "react";

const Galaxy2DBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<
    { x: number; y: number; ox: number; oy: number; size: number }[]
  >([]);
  const mouse = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const total = 100000;
    const points = [];

    for (let i = 0; i < total; i++) {
      const angle = i * 0.15;
      const baseRadius = Math.pow(i, 0.5) * 8;

      // Rumore casuale sulla posizione
      const randomOffset = (Math.random() - 0.5) * 10;
      const radius = baseRadius + randomOffset;

      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
        // Grandezza inversamente proporzionale alla distanza
        const size = Math.max(1, 4 - radius / 200 + Math.random());
        points.push({ x, y, ox: x, oy: y, size });
      }
    }

    pointsRef.current = points;

    let animationFrame: number;

    const animate = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "black";

      for (const p of pointsRef.current) {
        if (movedRef.current) {
          const dx = p.x - mouse.current.x;
          const dy = p.y - mouse.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 80) {
            p.x += (dx / dist) * 3;
            p.y += (dy / dist) * 3;
          }
        } else {
          p.x += (p.ox - p.x) * 0.02;
          p.y += (p.oy - p.y) * 0.02;
        }

        // Disegna una stella a croce con dimensione variabile
        ctx.beginPath();
        ctx.moveTo(p.x - p.size, p.y);
        ctx.lineTo(p.x + p.size, p.y);
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x, p.y + p.size);
        ctx.stroke();
      }

      movedRef.current = false;
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      movedRef.current = true;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full -z-10" />
  );
};

export default Galaxy2DBackground;
