// Builds a build-free vanilla runtime out of the real liquid-glass source.
// - engine.ts / dom-snapshot.ts: type-stripped verbatim, export keywords removed
// - glass-layer.tsx: its useEffect body is lifted verbatim (types stripped) into mountGlass()
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const KIT = join(here, '../src/liquid-glass')
const OUT = join(here, '../liquid-glass.js')

const strip = (code) => stripTypeScriptTypes(code, { mode: 'strip' })
const flat = (code) =>
  strip(code)
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+(?=(?:async\s+)?(?:function|const|let|var|class)\b)/gm, '')

const read = (f) => readFileSync(join(KIT, f), 'utf8')

/** Exported runtime names of a module (types are erased, so they are skipped). */
function exportedNames(code) {
  const names = []
  for (const m of code.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    names.push(m[1])
  }
  return [...new Set(names)]
}

/**
 * Wrap a module in its own scope and hand back only what it exports, so two
 * modules that happen to declare the same helper do not collide.
 */
function moduleScope(key, code) {
  const names = exportedNames(code)
  return `const ${key} = (function () {\n${flat(code)}\nreturn { ${names.join(', ')} }\n})()`
}

// ---- 1. leaf modules -------------------------------------------------------
const engine = moduleScope('__engine', read('engine.ts'))
const snapshot = moduleScope('__snapshot', read('dom-snapshot.ts'))
const engineNames = exportedNames(read('engine.ts')).join(', ')
const snapshotNames = exportedNames(read('dom-snapshot.ts')).join(', ')

// ---- 2. the layer: constants, CSS, and the effect body ---------------------
const layerSrc = read('glass-layer.tsx')
const lines = layerSrc.split('\n')

/** Slice source by an exact starting marker line and an exact ending marker. */
function between(src, startMarker, endMarker, includeEnd = true) {
  const from = src.indexOf(startMarker)
  if (from < 0) throw new Error('start marker not found: ' + startMarker)
  const to = src.indexOf(endMarker, from)
  if (to < 0) throw new Error('end marker not found: ' + endMarker)
  return src.slice(from, includeEnd ? to + endMarker.length : to)
}

const constants = between(
  layerSrc,
  '/** Size of the hover/press response.',
  'const PULSE_BEND = { amount: 0.5, in: 30, out: 5, even: 4, back: 12 }',
)

const glassCss = (() => {
  const m = layerSrc.match(/export const GLASS_CSS = (`[\s\S]*?`)\n/)
  if (!m) throw new Error('GLASS_CSS not found')
  return m[1]
})()

/** Strips React's wrapper from an effect and returns its body, de-indented, types stripped. */
function liftEffect(src, startMarker, endMarker, name) {
  const raw = between(src, startMarker, endMarker)
  const body = raw
    .slice(raw.indexOf('{') + 1, raw.lastIndexOf('}'))
    .split('\n')
    .map((l) => (l.startsWith('    ') ? l.slice(4) : l)) // de-indent one level
    .join('\n')
  // The body is plain JavaScript apart from type annotations: wrap it so the
  // stripper sees a real function, then keep the wrapper as the effect runner.
  return strip(`function ${name}() {\n${body}\n}`).replace(
    'engine.add(view)',
    'engine.add(view)\nif (window.__lgDebug) window.__lgDebug({ view: view, page: page, host: host })',
  )
}

// The layer's effect body: from `useEffect(() => {` to its dependency array.
const effectFn = liftEffect(
  layerSrc,
  'useEffect(() => {\n    const canvas = canvasRef.current',
  '}, [material, backdrop, live, trigger, disabled, swell, pull])',
  '__glassEffect',
)

// ---- 3. the badge: its own renderer, lifted the same way -------------------
const badgeSrc = read('glass-badge.tsx')
const badgeConstants = between(badgeSrc, 'const OPTION_UNITS = 80', 'const HOVER_ACCEL = 1.6')
const badgeEffect = liftEffect(
  badgeSrc,
  'useEffect(() => {\n    const canvas = canvasRef.current',
  '}, [children, dotColor, speed, tint])',
  '__badgeEffect',
)

const out = `/* Liquid Glass — vanilla runtime, generated from the MIT source at
 * https://github.com/bilalgursen/liquid-glass (src/components/liquid-glass/).
 * engine.ts + dom-snapshot.ts are type-stripped verbatim; GlassLayer's effect body is
 * lifted verbatim. Nothing here was re-implemented: only React is replaced by DOM calls.
 * Load as a classic script; it defines window.LiquidGlass.
 *
 *   const glass = LiquidGlass.mount(hostElement)      // host needs the canvas child
 *   glass.set({ tint, blur, droplet, optics })        // re-read colours, animate a droplet
 *   glass.pulse()                                     // the glass answers once
 *   glass.destroy()
 */
;(function () {
'use strict'

// ===== engine.ts ===========================================================
${engine}
const { ${engineNames} } = __engine

// ===== dom-snapshot.ts =====================================================
${snapshot}
const { ${snapshotNames} } = __snapshot

// ===== glass-layer.tsx (constants + CSS + effect body) =====================
${strip(constants)}

const GLASS_CSS = ${glassCss}

/**
 * Put one glass layer on \`canvas\`, whose parent element is the host.
 * Mirrors <GlassLayer/>'s props one for one.
 */
function mountGlass(canvas, options) {
  const opts = options || {}
  // The React refs of the original, as plain boxes so the lifted code is unchanged.
  const canvasRef = { current: canvas }
  const dropletRef = { current: opts.droplet !== undefined ? opts.droplet : 'none' }
  const tuneRef = {
    current: {
      tint: opts.tint !== undefined ? opts.tint : 0.6,
      blur: opts.blur !== undefined ? opts.blur : 0,
      optics: opts.optics,
    },
  }
  const pulseHoldRef = { current: opts.pulseHold }
  const pokeRef = { current: null }
  const pulseRef = { current: null }
  const nodRef = { current: null }
  // Props read when the glass is built (the effect's dependency array).
  const material = opts.material !== undefined ? opts.material : 'clear'
  const backdrop = opts.backdrop
  const live = !!opts.live
  const trigger = opts.trigger
  const disabled = !!opts.disabled
  const swell = opts.swell !== false
  const pull = opts.pull !== false

${effectFn}

  const cleanup = __glassEffect()
  const host = canvas.parentElement
  return {
    host: host,
    canvas: canvas,
    /** Re-read the glass's colours and animation without rebuilding it. */
    set: function (next) {
      next = next || {}
      const from = dropletRef.current
      if ('droplet' in next) dropletRef.current = next.droplet
      if ('pulseHold' in next) pulseHoldRef.current = next.pulseHold
      if ('tint' in next || 'blur' in next || 'optics' in next) {
        tuneRef.current = {
          tint: 'tint' in next ? next.tint : tuneRef.current.tint,
          blur: 'blur' in next ? next.blur : tuneRef.current.blur,
          optics: 'optics' in next ? next.optics : tuneRef.current.optics,
        }
      }
      if (pokeRef.current) pokeRef.current()
      // The droplet splitting off or melting in: the glass nods once.
      if (from !== dropletRef.current && from !== 'none' && dropletRef.current !== 'none' && nodRef.current) {
        nodRef.current()
      }
    },
    /** The glass answers once, as if hovered and pressed for a moment. */
    pulse: function () {
      if (pulseRef.current) pulseRef.current()
    },
    destroy: function () {
      if (cleanup) cleanup()
    },
  }
}

// The host has to carry the canvas as its first child.
function layerFor(host, options) {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText = 'position:absolute;z-index:-1;max-width:none;pointer-events:none;width:0;height:0'
  host.insertBefore(canvas, host.firstChild)
  return mountGlass(canvas, options)
}

// One <style> with the CSS the glass relies on.
function injectStyles(doc) {
  doc = doc || document
  if (doc.getElementById('liquid-glass-css')) return
  const style = doc.createElement('style')
  style.id = 'liquid-glass-css'
  style.textContent = GLASS_CSS
  doc.head.appendChild(style)
}

// ===== glass-badge.tsx (its own renderer) ==================================
${strip(badgeConstants)}

/**
 * Mounts GlassBadge's renderer: a tinted drop with \`children\` flowing through it.
 * Mirrors <GlassBadge/>; changing children/dotColor/speed/tint needs a rebuild,
 * which is what React's effect did too.
 */
function mountBadge(canvas, options) {
  const opts = options || {}
  const canvasRef = { current: canvas }
  const children = opts.children !== undefined ? opts.children : ''
  const dotColor = opts.dotColor
  const speed = opts.speed !== undefined ? opts.speed : 0.4
  const tint = opts.tint !== undefined ? opts.tint : 0.82

${badgeEffect}

  const cleanup = __badgeEffect()
  return {
    host: canvas.parentElement,
    canvas: canvas,
    destroy: function () {
      if (cleanup) cleanup()
    },
  }
}

function badgeFor(host, options) {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText = 'position:absolute;max-width:none;pointer-events:none;width:0;height:0'
  host.insertBefore(canvas, host.firstChild)
  return mountBadge(canvas, options)
}

window.LiquidGlass = {
  mount: mountGlass,
  layerFor: layerFor,
  badgeFor: badgeFor,
  injectStyles: injectStyles,
  css: GLASS_CSS,
  getGlassEngine: getGlassEngine,
  DESIGN_HEIGHT: DESIGN_HEIGHT,
  stepSpring: stepSpring,
  SPRINGS: SPRINGS,
}
})()
`

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, out, 'utf8')
console.log('wrote', OUT, (out.length / 1024).toFixed(1) + ' KB')
