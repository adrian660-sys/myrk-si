"use client";

import { useEffect, useRef, useState } from "react";

export default function AudioPlayer() {
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);

  const buildAmbient = () => {
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 3);
    master.connect(ctx.destination);
    gainRef.current = master;

    // Layered drone tones
    const freqs = [55, 110, 165, 220];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;
      gain.gain.value = 0.3 - i * 0.05;
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      nodesRef.current.push(osc);
    });

    setReady(true);
  };

  const toggle = () => {
    if (!ctxRef.current) {
      buildAmbient();
      setPlaying(true);
      return;
    }
    if (playing) {
      gainRef.current?.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 1.5);
      setPlaying(false);
    } else {
      ctxRef.current.resume();
      gainRef.current?.gain.linearRampToValueAtTime(0.06, ctxRef.current.currentTime + 1.5);
      setPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      nodesRef.current.forEach((n) => { try { n.stop(); } catch {} });
      ctxRef.current?.close();
    };
  }, []);

  return (
    <div className="fixed bottom-8 left-6 z-50 flex flex-col items-center gap-1.5">
      {!ready && (
        <span className="text-cream/40 text-[10px] font-sans tracking-widest uppercase">
          ambient sound
        </span>
      )}
      <button
        onClick={toggle}
        className="relative w-9 h-9 flex items-center justify-center rounded-full border border-gold/30 hover:border-gold/70 transition-colors duration-300"
        aria-label={playing ? "Pause ambient sound" : "Play ambient sound"}
        title="Interact to enable ambient sound"
      >
        {playing && (
          <span className="absolute inset-0 rounded-full border border-gold/40 animate-pulse-ring" />
        )}
        <span className="text-gold/70 text-xs font-sans">♪</span>
      </button>
    </div>
  );
}
