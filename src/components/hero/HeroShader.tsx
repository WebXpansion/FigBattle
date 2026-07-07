"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { vertexShader, fluidShader, displayShader } from "./shaders";

// Config du shader (reprise de l'original, ajustée pour la perf).
const config = {
  brushSize: 25.0,
  brushStrength: 0.5,
  distortionAmount: 2.5,
  fluidDecay: 0.98,
  trailLength: 0.8,
  stopDecay: 0.85,
  colorIntensity: 1.0,
  softness: 1.0,
  energyDecay: 0.94,
  energySmoothing: 0.08,
  holdDuration: 1000,
  paletteRevealDuration: 2800,
  parallaxAmount: 0.9,
  parallaxSmoothing: 0.06,
};

// Palettes accordées à la DA FigBattle (magenta / cyan / violet sombre dominants).
const palettes = [
  { colors: ["#b8fff7", "#6e3466", "#0133ff", "#66d1fe"] },
  { colors: ["#ffafcc", "#ff2e88", "#5390d9", "#7400b8"] },
  { colors: ["#5ad7ff", "#ff2e88", "#0133ff", "#160a24"] },
  { colors: ["#caffbf", "#80ffdb", "#5390d9", "#7400b8"] },
  { colors: ["#e9ff70", "#ff2e88", "#00bbf9", "#9b5de5"] },
];

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}
function convertPalette(p: { colors: string[] }) {
  return p.colors.map(hexToRgb);
}
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function HeroShader() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Respecte la préférence d'animation réduite : pas de WebGL, fond statique.
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) {
      container.style.background =
        "radial-gradient(120% 80% at 70% 20%, #6e3466, #160a24 60%, #0b0414)";
      return;
    }

    // Détection mobile : on allège (pixelRatio plus bas, pas de hold tactile).
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const maxPixelRatio = isMobile ? 1 : 2;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.autoClear = false;
    container.appendChild(renderer.domElement);

    const createTarget = () =>
      new THREE.WebGLRenderTarget(container.clientWidth, container.clientHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
      });

    const fluidTarget1 = createTarget();
    const fluidTarget2 = createTarget();
    let currentFluidTarget = fluidTarget1;
    let previousFluidTarget = fluidTarget2;
    let frameCount = 0;

    const fluidMaterial = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
        iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
        iFrame: { value: 0 },
        iPreviousFrame: { value: null },
        uBrushSize: { value: config.brushSize },
        uBrushStrength: { value: config.brushStrength },
        uFluidDecay: { value: config.fluidDecay },
        uTrailLength: { value: config.trailLength },
        uStopDecay: { value: config.stopDecay },
      },
      vertexShader,
      fragmentShader: fluidShader,
    });

    const displayMaterial = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
        iFluid: { value: null },
        uDistortionAmount: { value: config.distortionAmount },
        uParallax: { value: new THREE.Vector2(0, 0) },
        uColor1: { value: new THREE.Vector3() },
        uColor2: { value: new THREE.Vector3() },
        uColor3: { value: new THREE.Vector3() },
        uColor4: { value: new THREE.Vector3() },
        uNextColor1: { value: new THREE.Vector3() },
        uNextColor2: { value: new THREE.Vector3() },
        uNextColor3: { value: new THREE.Vector3() },
        uNextColor4: { value: new THREE.Vector3() },
        uRevealProgress: { value: 0 },
        uRevealCenter: {
          value: new THREE.Vector2(container.clientWidth * 0.5, container.clientHeight * 0.5),
        },
        uRevealBorderColor: { value: new THREE.Vector3(1, 1, 1) },
        uColorIntensity: { value: config.colorIntensity },
        uSoftness: { value: config.softness },
      },
      vertexShader,
      fragmentShader: displayShader,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const fluidPlane = new THREE.Mesh(geometry, fluidMaterial);
    const displayPlane = new THREE.Mesh(geometry, displayMaterial);

    let mouseX = 0, mouseY = 0, prevMouseX = 0, prevMouseY = 0;
    let pointerClientX = window.innerWidth * 0.5;
    let pointerClientY = window.innerHeight * 0.5;
    let lastMoveTime = 0;
    let lastPointerTime = performance.now();
    let hasPointerMoved = false;
    let pointerVisible = false;
    let energy = 0, targetEnergy = 0;
    const parallax = new THREE.Vector2(0, 0);
    const targetParallax = new THREE.Vector2(0, 0);
    let isHolding = false, holdStartTime = 0, holdTriggered = false;
    let holdProgress = 0, holdVisualProgress = 0;
    let activePaletteIndex = 0;
    let currentPaletteColors = convertPalette(palettes[0]);
    const paletteReveal = { active: false, startTime: 0, nextPaletteIndex: 0 };

    const applyPaletteUniforms = () => {
      displayMaterial.uniforms.uColor1.value.set(...currentPaletteColors[0]);
      displayMaterial.uniforms.uColor2.value.set(...currentPaletteColors[1]);
      displayMaterial.uniforms.uColor3.value.set(...currentPaletteColors[2]);
      displayMaterial.uniforms.uColor4.value.set(...currentPaletteColors[3]);
    };
    const applyNextPaletteUniforms = (index: number) => {
      const c = convertPalette(palettes[index]);
      displayMaterial.uniforms.uNextColor1.value.set(...c[0]);
      displayMaterial.uniforms.uNextColor2.value.set(...c[1]);
      displayMaterial.uniforms.uNextColor3.value.set(...c[2]);
      displayMaterial.uniforms.uNextColor4.value.set(...c[3]);
    };

    const updatePointer = (e: PointerEvent, addEnergy: boolean) => {
      const now = performance.now();
      const rect = container.getBoundingClientRect();
      pointerClientX = e.clientX;
      pointerClientY = e.clientY;
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      targetParallax.set(nx * config.parallaxAmount, -ny * config.parallaxAmount);
      const newX = e.clientX - rect.left;
      const newY = rect.height - (e.clientY - rect.top);
      prevMouseX = hasPointerMoved ? mouseX : newX;
      prevMouseY = hasPointerMoved ? mouseY : newY;
      mouseX = newX;
      mouseY = newY;
      if (addEnergy) {
        const dx = mouseX - prevMouseX;
        const dy = mouseY - prevMouseY;
        const dt = Math.max((now - lastPointerTime) / 1000, 0.016);
        const speed = Math.sqrt(dx * dx + dy * dy) / dt;
        targetEnergy = Math.max(targetEnergy, clamp(speed / 2500, 0, 1));
      }
      lastPointerTime = now;
      lastMoveTime = now;
      hasPointerMoved = true;
      pointerVisible = true;
      fluidMaterial.uniforms.iMouse.value.set(mouseX, mouseY, prevMouseX, prevMouseY);
    };

    const triggerPaletteChange = (now: number) => {
      if (paletteReveal.active) return;
      const nextIndex = (activePaletteIndex + 1) % palettes.length;
      paletteReveal.active = true;
      paletteReveal.startTime = now;
      paletteReveal.nextPaletteIndex = nextIndex;
      applyNextPaletteUniforms(nextIndex);
      displayMaterial.uniforms.uRevealProgress.value = 0;
      displayMaterial.uniforms.uRevealCenter.value.set(mouseX, mouseY);
      displayMaterial.uniforms.uRevealBorderColor.value.set(
        ...hexToRgb(palettes[nextIndex].colors[2])
      );
      targetEnergy = 1;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      updatePointer(e, true);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!e.isPrimary || isMobile) return; // pas de hold tactile (conflit scroll)
      if (paletteReveal.active) return;
      updatePointer(e, false);
      isHolding = true;
      holdTriggered = false;
      holdStartTime = performance.now();
      targetEnergy = Math.max(targetEnergy, 0.35);
    };
    const endHold = () => {
      isHolding = false;
      holdTriggered = false;
    };
    const onLeave = () => {
      pointerVisible = false;
      isHolding = false;
      holdTriggered = false;
      hasPointerMoved = false;
      fluidMaterial.uniforms.iMouse.value.set(0, 0, 0, 0);
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", endHold);
    window.addEventListener("pointercancel", endHold);
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
      renderer.setSize(w, h);
      fluidMaterial.uniforms.iResolution.value.set(w, h);
      displayMaterial.uniforms.iResolution.value.set(w, h);
      fluidTarget1.setSize(w, h);
      fluidTarget2.setSize(w, h);
      frameCount = 0;
    };
    // ResizeObserver plutôt que le seul "resize" de la fenêtre : capte aussi
    // les cas où le conteneur change de hauteur sans que la fenêtre ne
    // redimensionne (ex: contenu de page plus haut que l'écran sur mobile).
    const resizeObserver = new ResizeObserver(() => onResize());
    resizeObserver.observe(container);

    applyPaletteUniforms();
    applyNextPaletteUniforms(activePaletteIndex);

    let raf = 0;
    let running = true;
    // Pause le rendu quand l'onglet n'est pas visible (économie batterie/CPU).
    const onVisibility = () => {
      running = !document.hidden;
      if (running) raf = requestAnimationFrame(animate);
    };
    document.addEventListener("visibilitychange", onVisibility);

    function animate() {
      if (!running) return;
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const time = now * 0.001;

      if (now - lastMoveTime > 100) {
        fluidMaterial.uniforms.iMouse.value.set(0, 0, 0, 0);
      }

      // hold
      let targetHold = 0;
      if (isHolding) {
        holdProgress = clamp((now - holdStartTime) / config.holdDuration, 0, 1);
        targetHold = holdProgress;
        targetEnergy = Math.max(targetEnergy, 0.2 + holdProgress * 0.8);
        if (holdProgress >= 1 && !holdTriggered) {
          triggerPaletteChange(now);
          holdTriggered = true;
          isHolding = false;
          holdProgress = 0;
          targetHold = 0;
        }
      } else {
        holdProgress = 0;
      }
      holdVisualProgress += (targetHold - holdVisualProgress) * 0.11;

      // transition de palette
      if (paletteReveal.active) {
        const raw = clamp(
          (now - paletteReveal.startTime) / config.paletteRevealDuration,
          0,
          1
        );
        displayMaterial.uniforms.uRevealProgress.value = easeInOutCubic(raw);
        if (raw >= 1) {
          activePaletteIndex = paletteReveal.nextPaletteIndex;
          currentPaletteColors = convertPalette(palettes[activePaletteIndex]);
          applyPaletteUniforms();
          displayMaterial.uniforms.uRevealProgress.value = 0;
          paletteReveal.active = false;
        }
      } else {
        displayMaterial.uniforms.uRevealProgress.value = 0;
      }

      // energy
      targetEnergy *= config.energyDecay;
      energy += (targetEnergy - energy) * config.energySmoothing;
      fluidMaterial.uniforms.uBrushSize.value = config.brushSize * (1 + energy * 0.7);
      fluidMaterial.uniforms.uBrushStrength.value = config.brushStrength * (1 + energy * 2.5);
      displayMaterial.uniforms.uDistortionAmount.value = config.distortionAmount * (1 + energy * 1.8);
      displayMaterial.uniforms.uColorIntensity.value = Math.max(
        0.95,
        config.colorIntensity * (1 - energy * 0.55)
      );

      // parallax
      parallax.x += (targetParallax.x - parallax.x) * config.parallaxSmoothing;
      parallax.y += (targetParallax.y - parallax.y) * config.parallaxSmoothing;
      displayMaterial.uniforms.uParallax.value.copy(parallax);

      // curseur visuel (hold)
     if (cursorRef.current) {
        const size = holdVisualProgress * 130;
        const s = cursorRef.current.style;
        s.left = `${pointerClientX}px`;
        s.top = `${pointerClientY}px`;
        s.width = `${size}px`;
        s.height = `${size}px`;
        s.opacity = pointerVisible && !isMobile ? "1" : "0";
        s.setProperty("--hold-progress", String(holdVisualProgress));
        s.setProperty("--energy", String(energy));
      }

      // uniforms temps
      fluidMaterial.uniforms.iTime.value = time;
      fluidMaterial.uniforms.iFrame.value = frameCount;
      displayMaterial.uniforms.iTime.value = time;
      applyPaletteUniforms();

      // render fluid -> target
      fluidMaterial.uniforms.iPreviousFrame.value = previousFluidTarget.texture;
      renderer.setRenderTarget(currentFluidTarget);
      renderer.clear();
      renderer.render(fluidPlane, camera);

      // render display -> écran
      displayMaterial.uniforms.iFluid.value = currentFluidTarget.texture;
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(displayPlane, camera);

      // swap
      const tmp = currentFluidTarget;
      currentFluidTarget = previousFluidTarget;
      previousFluidTarget = tmp;
      frameCount++;
    }
    raf = requestAnimationFrame(animate);

    // Cleanup complet au démontage (évite les fuites WebGL en SPA).
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", endHold);
      window.removeEventListener("pointercancel", endHold);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      geometry.dispose();
      fluidMaterial.dispose();
      displayMaterial.dispose();
      fluidTarget1.dispose();
      fluidTarget2.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0 -z-10 h-full w-full overflow-hidden"
        aria-hidden="true"
      />
      <div ref={cursorRef} className="hold-cursor" aria-hidden="true" />
    </>
  );
}