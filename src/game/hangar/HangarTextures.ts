import * as THREE from 'three';
import type { HangarResourceTracker } from './HangarResourceTracker';

/** Procedural canvas textures for the hangar surfaces; each texture is registered with the tracker. */
export function generateDeckPlateTexture(tracker: HangarResourceTracker): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  // Ultra-smooth brushed dark titanium alloy gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 2048, 2048);
  bgGrad.addColorStop(0, '#0c1322');
  bgGrad.addColorStop(0.5, '#0f172a');
  bgGrad.addColorStop(1, '#0a0f1d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 2048, 2048);

  // Large architectural plate subdivisions (512x512) with anti-aliased bevels
  const plateSize = 512;
  for (let x = 0; x < 2048; x += plateSize) {
    for (let y = 0; y < 2048; y += plateSize) {
      // Soft interior plate tone with subtle center highlight
      const plateGrad = ctx.createRadialGradient(
        x + plateSize / 2, y + plateSize / 2, 20,
        x + plateSize / 2, y + plateSize / 2, plateSize / 1.4
      );
      plateGrad.addColorStop(0, '#162238');
      plateGrad.addColorStop(1, '#111a2d');
      ctx.fillStyle = plateGrad;
      ctx.fillRect(x + 6, y + 6, plateSize - 12, plateSize - 12);

      // Smooth recessed expansion groove
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 6;
      ctx.strokeRect(x + 3, y + 3, plateSize - 6, plateSize - 6);

      // Soft chamfer bevel highlight
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 8, y + 8, plateSize - 16, plateSize - 16);

      // Precision countersunk titanium fasteners with subtle shadow and specular dot
      const rivetOffsets = [36, plateSize - 36];
      for (const rx of rivetOffsets) {
        for (const ry of rivetOffsets) {
          // Recessed socket shadow
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(x + rx, y + ry, 6.0, 0, Math.PI * 2);
          ctx.fill();

          // Titanium bolt head
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(x + rx - 0.5, y + ry - 0.5, 4.0, 0, Math.PI * 2);
          ctx.fill();

          // Specular dot
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.arc(x + rx - 1.5, y + ry - 1.5, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  const texture = tracker.trackTexture(new THREE.CanvasTexture(canvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.generateMipmaps = true;
  texture.anisotropy = 16;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export function generateRunwayTexture(tracker: HangarResourceTracker): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  // Dark graphite aerospace composite base
  ctx.fillStyle = '#0c1322';
  ctx.fillRect(0, 0, 2048, 2048);

  // Central dark technical runway corridor with smooth gradient
  const corridorGrad = ctx.createLinearGradient(160, 0, 1888, 0);
  corridorGrad.addColorStop(0, '#151f33');
  corridorGrad.addColorStop(0.5, '#1e293b');
  corridorGrad.addColorStop(1, '#151f33');
  ctx.fillStyle = corridorGrad;
  ctx.fillRect(160, 0, 1728, 2048);

  // Anti-aliased hazard borders on left and right
  const drawHazardStrip = (startX: number) => {
    const stripeWidth = 64;
    for (let y = -stripeWidth * 2; y < 2048 + stripeWidth * 2; y += stripeWidth * 2) {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + 120, y + 120);
      ctx.lineTo(startX + 120, y + 120 + stripeWidth);
      ctx.lineTo(startX, y + stripeWidth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(startX, y + stripeWidth);
      ctx.lineTo(startX + 120, y + 120 + stripeWidth);
      ctx.lineTo(startX + 120, y + 120 + stripeWidth * 2);
      ctx.lineTo(startX, y + stripeWidth * 2);
      ctx.closePath();
      ctx.fill();
    }
  };
  drawHazardStrip(40);
  drawHazardStrip(1888);

  // Central illuminated cyan guide lines with soft glow
  ctx.shadowColor = '#0284c7';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(1024, 0);
  ctx.lineTo(1024, 2048);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Guidance chevrons pointing toward launch exit
  ctx.fillStyle = '#38bdf8';
  for (let cy = 240; cy < 2048; cy += 480) {
    ctx.beginPath();
    ctx.moveTo(1024, cy - 90);
    ctx.lineTo(1140, cy + 40);
    ctx.lineTo(1088, cy + 40);
    ctx.lineTo(1024, cy - 30);
    ctx.lineTo(960, cy + 40);
    ctx.lineTo(908, cy + 40);
    ctx.closePath();
    ctx.fill();
  }

  // High-tech aerospace vector typography
  ctx.font = 'bold 64px "Orbitron", monospace';
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.fillText('BAY 09 // LAUNCH VECTOR', 1024, 1040);

  const texture = tracker.trackTexture(new THREE.CanvasTexture(canvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2);
  texture.generateMipmaps = true;
  texture.anisotropy = 16;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export function generateWallArmorTexture(tracker: HangarResourceTracker): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 2048, 1024);

  // Corrugated architectural armor ribs with smooth shading
  for (let x = 0; x < 2048; x += 256) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, 0, 40, 1024);

    const ribGrad = ctx.createLinearGradient(x + 40, 0, x + 216, 0);
    ribGrad.addColorStop(0, '#1e293b');
    ribGrad.addColorStop(0.5, '#334155');
    ribGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = ribGrad;
    ctx.fillRect(x + 40, 0, 176, 1024);

    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 216, 0, 20, 1024);
  }

  // Horizontal reinforced blast seams
  ctx.fillStyle = '#0a0f1d';
  ctx.fillRect(0, 240, 2048, 32);
  ctx.fillRect(0, 720, 2048, 32);

  const texture = tracker.trackTexture(new THREE.CanvasTexture(canvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 2);
  texture.generateMipmaps = true;
  texture.anisotropy = 16;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}
