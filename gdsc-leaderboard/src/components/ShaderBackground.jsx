// Full-screen WebGL backdrop: domain-warped aurora sky, a striped synthwave sun and a
// neon grid floor rushing toward the horizon, plus a glow that follows the cursor.
// Falls back to the body's CSS background if WebGL is unavailable.
import { useEffect, useRef } from 'react';
import { useColorMode } from '@chakra-ui/react';
import { useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { hyperMode, useToggle } from '../lib/vibes';

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uDark;
uniform float uHyper;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}

vec3 hueShift(vec3 c, float a) {
  const vec3 k = vec3(0.57735);
  float ca = cos(a);
  return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;

  vec3 orange = vec3(1.0, 0.4, 0.0);
  vec3 magenta = vec3(1.0, 0.18, 0.53);
  vec3 violet = vec3(0.36, 0.17, 1.0);
  vec3 gold = vec3(1.0, 0.82, 0.25);

  // Sky: two rounds of domain warping give the slow aurora swirl.
  vec2 q = vec2(fbm(p * 1.4 + vec2(0.0, t * 0.04)), fbm(p * 1.4 + vec2(5.2, -t * 0.03)));
  vec2 r = vec2(fbm(p * 1.4 + 3.5 * q + vec2(1.7, 9.2) + t * 0.06),
                fbm(p * 1.4 + 3.5 * q + vec2(8.3, 2.8) - t * 0.05));
  float f = fbm(p * 1.4 + 3.5 * r);
  vec3 aurora = mix(violet, magenta, clamp(q.x * 1.6, 0.0, 1.0));
  aurora = mix(aurora, orange, clamp(r.y * r.y * 2.2, 0.0, 1.0));
  float glow = smoothstep(0.25, 0.85, f);

  vec3 darkSky = vec3(0.03, 0.01, 0.07) + aurora * glow * 1.05;
  vec3 lightBase = vec3(1.0, 0.96, 0.92);
  vec3 lightSky = mix(lightBase, mix(lightBase, aurora, 0.5), glow);

  // Horizon and sun.
  float hy = -0.2;
  vec2 sp = p - vec2(0.0, hy + 0.14);
  float d = length(sp);
  float cutWidth = smoothstep(0.06, -0.28, sp.y) * 0.75;
  float stripes = step(cutWidth, fract(sp.y * 24.0 - t * 0.35));
  float sun = smoothstep(0.3, 0.295, d) * stripes * step(hy, p.y);
  vec3 sunColor = mix(magenta, gold, smoothstep(-0.25, 0.28, sp.y));
  float halo = exp(-d * 3.5) * 0.55;

  vec3 darkCol = darkSky + sunColor * sun + mix(magenta, orange, 0.5) * halo * 0.6;
  vec3 lightCol = mix(lightSky, sunColor, sun * 0.9) + orange * halo * 0.12;

  // Grid floor in perspective, scrolling toward the viewer.
  if (p.y < hy) {
    float depth = hy - p.y;
    float z = 0.32 / depth;
    vec2 g = vec2(p.x * z * 1.6, z + t * (0.8 + uHyper * 3.0));
    vec2 toLine = 0.5 - abs(fract(g) - 0.5);
    float lw = clamp(0.012 * z, 0.015, 0.5);
    float line = max(1.0 - smoothstep(0.0, lw, toLine.x), 1.0 - smoothstep(0.0, lw, toLine.y));
    float fade = smoothstep(0.0, 0.18, depth);
    vec3 lineColor = mix(magenta, orange, smoothstep(0.0, 0.3, depth));
    float haze = exp(-depth * 16.0);

    darkCol = vec3(0.02, 0.0, 0.05) + lineColor * line * fade * 1.1 + mix(magenta, orange, 0.4) * haze * 0.7;
    lightCol = vec3(1.0, 0.93, 0.88) - (1.0 - lineColor) * line * fade * 0.55 + orange * haze * 0.25;
  }

  vec3 col = mix(lightCol, darkCol, uDark);

  // Cursor glow.
  vec2 m = (uMouse * uRes - 0.5 * uRes) / uRes.y;
  float md = length(p - m);
  col += mix(orange * 0.07, orange * 0.2, uDark) * exp(-md * md * 10.0);

  // HYPER MODE: everything cycles through the rainbow.
  col = mix(col, hueShift(col, t * 1.5), uHyper);

  col *= mix(1.0, smoothstep(1.4, 0.25, length(p)), mix(0.15, 0.6, uDark));
  col += (hash(gl_FragCoord.xy + fract(t) * 100.0) - 0.5) * 0.045;
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

export default function ShaderBackground() {
  const canvasRef = useRef(null);
  const { colorMode } = useColorMode();
  const { pathname } = useLocation();
  const [hyper] = useToggle(hyperMode);
  const reduceMotion = useReducedMotion();
  // The reveal stage is always dark, whatever the site theme.
  const target = useRef({ dark: 1, hyper: 0 });
  const redraw = useRef(() => {});

  useEffect(() => {
    target.current.dark = colorMode === 'dark' || pathname === '/reveal' ? 1 : 0;
    target.current.hyper = hyper ? 1 : 0;
    redraw.current();
  }, [colorMode, pathname, hyper]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return;

    const program = gl.createProgram();
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = Object.fromEntries(
      ['uRes', 'uTime', 'uMouse', 'uDark', 'uHyper'].map((name) => [name, gl.getUniformLocation(program, name)])
    );

    // Render below native resolution; it's a soft background and this keeps laptops cool.
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.6;
    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * scale);
      canvas.height = Math.floor(window.innerHeight * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
      redraw.current();
    };

    const mouse = { x: 0.5, y: 0.6, tx: 0.5, ty: 0.6 };
    const onMove = (event) => {
      mouse.tx = event.clientX / window.innerWidth;
      mouse.ty = 1 - event.clientY / window.innerHeight;
    };

    const state = { time: 12, dark: target.current.dark, hyper: target.current.hyper, last: performance.now() };
    let frame = 0;

    const draw = () => {
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, state.time);
      gl.uniform2f(u.uMouse, mouse.x, mouse.y);
      gl.uniform1f(u.uDark, state.dark);
      gl.uniform1f(u.uHyper, state.hyper);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const tick = (now) => {
      const dt = Math.min((now - state.last) / 1000, 0.1);
      state.last = now;
      // Ease theme/hyper changes instead of snapping; hyper also speeds time up.
      state.dark += (target.current.dark - state.dark) * Math.min(dt * 4, 1);
      state.hyper += (target.current.hyper - state.hyper) * Math.min(dt * 3, 1);
      state.time += dt * (1 + state.hyper * 5);
      mouse.x += (mouse.tx - mouse.x) * Math.min(dt * 5, 1);
      mouse.y += (mouse.ty - mouse.y) * Math.min(dt * 5, 1);
      draw();
      frame = requestAnimationFrame(tick);
    };

    if (reduceMotion) {
      // One still frame, redrawn only when the theme or size changes.
      redraw.current = () => {
        state.dark = target.current.dark;
        state.hyper = target.current.hyper;
        draw();
      };
    } else {
      window.addEventListener('pointermove', onMove, { passive: true });
      frame = requestAnimationFrame(tick);
    }
    window.addEventListener('resize', resize);
    resize();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', resize);
      redraw.current = () => {};
      // Don't lose the context: StrictMode remounts reuse this same canvas.
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
