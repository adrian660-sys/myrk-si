"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ParticleCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 80;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Particles
    const COUNT = 2200;
    const positions = new Float32Array(COUNT * 3);
    const velocities: { vx: number; vy: number; vz: number }[] = [];
    const phases = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      velocities.push({
        vx: (Math.random() - 0.5) * 0.02,
        vy: (Math.random() - 0.5) * 0.01,
        vz: (Math.random() - 0.5) * 0.008,
      });
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Sprite texture — soft glowing dot
    const canvas2d = document.createElement("canvas");
    canvas2d.width = 32;
    canvas2d.height = 32;
    const ctx = canvas2d.getContext("2d")!;
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(201,168,76,1)");
    gradient.addColorStop(0.4, "rgba(201,168,76,0.5)");
    gradient.addColorStop(1, "rgba(201,168,76,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    const sprite = new THREE.CanvasTexture(canvas2d);

    const material = new THREE.PointsMaterial({
      size: 1.6,
      map: sprite,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Mouse parallax
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.3;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.15;
    };
    window.addEventListener("mousemove", onMouseMove);

    let animId: number;
    let t = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.006;

      const pos = geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < COUNT; i++) {
        const ix = i * 3;
        // Wave motion
        pos[ix + 1] += Math.sin(t + phases[i] * 2) * 0.012;
        pos[ix] += velocities[i].vx;
        pos[ix + 2] += velocities[i].vz;

        // Wrap bounds
        if (pos[ix] > 100) pos[ix] = -100;
        if (pos[ix] < -100) pos[ix] = 100;
        if (pos[ix + 1] > 60) pos[ix + 1] = -60;
        if (pos[ix + 1] < -60) pos[ix + 1] = 60;
      }

      geometry.attributes.position.needsUpdate = true;
      particles.rotation.y += 0.0005;

      // Mouse parallax
      camera.position.x += (mouseX * 20 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 10 - camera.position.y) * 0.03;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      sprite.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
