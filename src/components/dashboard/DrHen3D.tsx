"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// A real, genuinely-3D WebGL character built from primitive geometry (no
// external .glb asset — none exists for this specific character, and
// generating one needs a 3D modeling/image-to-3D tool this environment
// doesn't have). Reads as a cute low-poly/stylized mascot, not a photoreal
// render — but it's true 3D: real lighting, real depth, real animation
// (idle sway, breathing, blinking, a waving wing, subtle cursor-follow).

const COLORS = {
  body: 0xa85c2e,
  bodyShade: 0x8b4a24,
  comb: 0xc62828,
  beak: 0xf2a93b,
  coat: 0xfafaf8,
  coatShade: 0xe5e3dd,
  steth: 0x4a4f57,
  eye: 0x1a1208,
  leg: 0xe8871e,
};

export function DrHen3D({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- scene / camera / renderer -----------------------------------
    const scene = new THREE.Scene();
    // Dead-simple camera aimed straight at the origin — no tilt/offset math
    // that could be miscalculated. The character group itself is shifted
    // down (see `chicken.position.y` below) so its vertical center sits at
    // world y=0, right where this camera is already looking.
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(2, 4, 3);
    const fill = new THREE.DirectionalLight(0xfff1de, 0.8);
    fill.position.set(-3, 1.5, 2);
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(key, fill, ambient);

    // --- build the character ------------------------------------------
    const chicken = new THREE.Group();
    chicken.position.y = -1.2; // recenter: character spans world y:[0,2.5] -> local center ~1.2
    scene.add(chicken);

    const torso = new THREE.Group();
    chicken.add(torso);

    const bodyMat = new THREE.MeshStandardMaterial({ color: COLORS.body, roughness: 0.65 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 32), bodyMat);
    body.scale.set(1, 1.15, 0.92);
    body.position.set(0, 0.95, 0);
    torso.add(body);

    // legs
    const legMat = new THREE.MeshStandardMaterial({ color: COLORS.leg, roughness: 0.5 });
    for (const x of [-0.22, 0.22]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 12), legMat);
      leg.position.set(x, 0.2, 0);
      chicken.add(leg);
      const foot = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.1, 4), legMat);
      foot.rotation.x = Math.PI;
      foot.position.set(x, 0.02, 0.05);
      chicken.add(foot);
    }

    // white coat draped over the lower torso
    const coatMat = new THREE.MeshStandardMaterial({ color: COLORS.coat, roughness: 0.8 });
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.68, 0.85, 32, 1, true), coatMat);
    coat.position.set(0, 0.68, 0);
    torso.add(coat);
    const coatCollar = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 12, 24), new THREE.MeshStandardMaterial({ color: COLORS.coatShade }));
    coatCollar.rotation.x = Math.PI / 2;
    coatCollar.position.set(0, 1.08, 0);
    torso.add(coatCollar);

    // wings
    const wingMat = new THREE.MeshStandardMaterial({ color: COLORS.bodyShade, roughness: 0.6 });
    const leftWing = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), wingMat);
    leftWing.scale.set(0.6, 1.3, 0.7);
    leftWing.position.set(-0.62, 0.95, 0.05);
    torso.add(leftWing);

    const wingPivot = new THREE.Group();
    wingPivot.position.set(0.62, 1.15, 0.05);
    torso.add(wingPivot);
    const rightWing = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), wingMat);
    rightWing.scale.set(0.6, 1.3, 0.7);
    rightWing.position.set(0, -0.15, 0);
    wingPivot.add(rightWing);

    // head group (separate so it can bob/turn independently)
    const head = new THREE.Group();
    head.position.set(0, 1.92, 0.05);
    torso.add(head);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.46, 32, 32), bodyMat);
    head.add(headMesh);

    // comb
    const combMat = new THREE.MeshStandardMaterial({ color: COLORS.comb, roughness: 0.5 });
    for (const [x, s] of [[-0.14, 0.85], [0, 1], [0.14, 0.85]] as [number, number][]) {
      const bump = new THREE.Mesh(new THREE.SphereGeometry(0.11 * s, 16, 16), combMat);
      bump.position.set(x, 0.44, -0.05);
      head.add(bump);
    }

    // wattle
    const wattle = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 12), combMat);
    wattle.rotation.x = Math.PI;
    wattle.position.set(0, -0.28, 0.36);
    head.add(wattle);

    // beak
    const beakMat = new THREE.MeshStandardMaterial({ color: COLORS.beak, roughness: 0.4 });
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.26, 16), beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -0.03, 0.48);
    head.add(beak);

    // eyes (refs kept for blink animation)
    const eyeMat = new THREE.MeshStandardMaterial({ color: COLORS.eye, roughness: 0.3 });
    const eyeGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.19, 0.08, 0.4);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.19, 0.08, 0.4);
    head.add(leftEye, rightEye);
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (const eye of [leftEye, rightEye]) {
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), highlightMat);
      glint.position.set(0.025, 0.03, 0.06);
      eye.add(glint);
    }

    // stethoscope: neck loop + tube down to chest disc
    const stethMat = new THREE.MeshStandardMaterial({ color: COLORS.steth, roughness: 0.35, metalness: 0.2 });
    const neckLoop = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.028, 12, 32, Math.PI * 1.5), stethMat);
    neckLoop.position.set(0, 1.55, 0.1);
    neckLoop.rotation.set(Math.PI / 2, 0, Math.PI * 0.25);
    torso.add(neckLoop);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 10), stethMat);
    tube.position.set(0, 1.28, 0.42);
    tube.rotation.x = 0.35;
    torso.add(tube);
    const chestDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 20), stethMat);
    chestDisc.rotation.x = Math.PI / 2;
    chestDisc.position.set(0, 1.02, 0.58);
    torso.add(chestDisc);

    // ground contact shadow (soft radial-gradient sprite, cheap + no shadow maps needed)
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(0,0,0,0.35)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.6),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.005;
    chicken.add(shadow);

    // --- resize handling -------------------------------------------------
    // setSize's 3rd arg (false) skips Three's own inline width/height style,
    // so our explicit 100%/100% CSS above always governs the displayed size
    // even if the internal drawing-buffer resolution updates a beat later.
    function applySize(w: number, h: number) {
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    // Fallback in case ResizeObserver's first callback is delayed.
    const rect = container.getBoundingClientRect();
    applySize(rect.width || 260, rect.height || 260);

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      applySize(width, height);
    });
    ro.observe(container);

    // --- pointer parallax (head gently follows cursor) -------------------
    const pointerTarget = { x: 0, y: 0 };
    function onPointerMove(e: PointerEvent) {
      const rect = container!.getBoundingClientRect();
      pointerTarget.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerTarget.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }
    function onPointerLeave() {
      pointerTarget.x = 0;
      pointerTarget.y = 0;
    }
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    // --- animation loop ----------------------------------------------------
    const clock = new THREE.Clock();
    let nextBlinkAt = 2 + Math.random() * 2;
    let blinkPhase = -1; // -1 = not blinking
    let raf = 0;

    function tick() {
      const t = clock.getElapsedTime();

      chicken.rotation.y += (pointerTarget.x * 0.35 - chicken.rotation.y + Math.sin(t * 0.4) * 0.12) * 0.04;
      head.rotation.x += (-pointerTarget.y * 0.2 - head.rotation.x) * 0.06;

      torso.scale.y = 1 + Math.sin(t * 1.3) * 0.015;
      torso.position.y = Math.sin(t * 1.3) * 0.01;

      wingPivot.rotation.z = -0.15 + Math.sin(t * 1.8) * 0.22;

      if (blinkPhase < 0 && t > nextBlinkAt) blinkPhase = 0;
      if (blinkPhase >= 0) {
        blinkPhase += 0.09;
        const s = blinkPhase < 1 ? 1 - Math.sin(blinkPhase * Math.PI) : 1;
        leftEye.scale.y = rightEye.scale.y = Math.max(s, 0.05);
        if (blinkPhase >= 1) {
          blinkPhase = -1;
          nextBlinkAt = t + 2.5 + Math.random() * 3;
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      container.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m.dispose());
        }
      });
      shadowTex.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className={className} />;
}
