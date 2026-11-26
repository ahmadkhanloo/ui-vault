/* Liquid Glass — vanilla runtime, generated from the MIT source at
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
const __engine = (function () {
// Liquid Glass engine — one shared WebGL2 context that draws every glass surface on the
// page and copies each result into the surface's own 2D <canvas>, so a page full of
// glass never hits the browser's WebGL context limit.
//
// Zero dependencies. A GLSL lens with tinted glass, a 1 px border, a frosted resting
// state, an opt-in gooey droplet and an opt-in frosted blur (cards). The rim mirrors what
// surrounds the glass: a colourful neighbour shows on the side that faces it.
//
// Cost model: the loop runs only while a spring moves, a surface is dirty or the
// cursor light changes; at rest it stops completely. Off-screen surfaces are not
// drawn, and neither is a frame that would come out exactly as the one on the canvas.
// `prefers-reduced-motion` freezes every spring at its target.
// If WebGL2 is missing or the context is lost, every surface falls back to plain CSS.
//
// COPY THIS FILE VERBATIM. Do not rewrite or "simplify" the shader: the look comes
// from the exact constants below. MIT — https://github.com/bilalgursen/liquid-glass

                                          
                                                   

/** One frame of one glass shape. Lengths in CSS px; origin = the canvas's top-left. */
                         
                                                                    
              
             
               
                
                                                                                   
              
                                   
            
            
            
            
                
                                                                                
               
                                                                                                
                                               
     
                                                                                               
                                                                                             
                                                   
     
          
             
             
              
              
             
             
                                                                                                                                                                            
                                   
                                                                                                                                                   
                                            
       
                                                                                              
                                                                                             
                                                                                                 
       
                                                                                                                              
   
                                    
               
     
                                                                                      
                                                                                       
                                                                         
     
               
                
                        
                      
                                                                       
                  
            
              
                                                                          
                   
              
                                                     
                      
                                                        
                      
                                                              
                
       
                                                                                                
                                                                                  
                                                                                            
       
                                                                                              
                   
                   
                      
                      
                    
                                                           
                 
                                                                                                                 
                 
                                                                            
                    
       
                                                                                          
                                                                                                     
                                                                                                    
       
                   
   
     
                                                                                                                     
                                                                                                  
                                                                                                  
                                                                                              
                                                                                                  
                                                                                                
                                                                                               
                                                                      
     
                                                                                                                   
                                                                                                 
          
                                                          
                
                     
                                                                                                             
                    
                  
                       
                    
                                                                                                               
                   
                                                                                                    
                      
                      
                                                                            
                       
                      
   
                                            
                      
     
                                                                                              
                                                                                                                   
                                                                                                                    
                                                                         
                                                                                             
     
                                                                                                                               
                                                                                                                                            
                        
     
                                                                                              
                                                                                                  
                                                               
     
                     
                                                            
                 
                 
 

                         
                           
                               
                
     
                                                                                                
                                                                                                   
     
                   
                  
                                                                 
                                                       
                                                                                   
                                              
                                            
                    
                                                               
                  
     
                                                                                                  
                                                                                                           
     
                
                                                                                                                             
                
     
                                                                                              
                                                                                             
                                            
     
               
     
                                                                                                
                                                                                                 
                                                                                                
                                                                      
     
                  
                                                                                          
                     
     
                                                                                                  
                                                                                                 
     
                   
     
                                                                                               
                                                                                                  
                                                                                   
     
                                                           
 

                           
                                
                                   
                                                                       
                  
                                                               
                                     
 

/** Damped spring. `omega` = speed (rad/s), `zeta` = damping ratio (< 1 bounces). Returns true while moving. */
                                             
function stepSpring(s        , target        , { omega, zeta }                                 , dt        ) {
  const d = s.x - target
  if (zeta > 0.9995) {
    const b = s.v + omega * d
    const e = Math.exp(-omega * dt)
    s.x = target + (d + b * dt) * e
    s.v = (s.v - omega * b * dt) * e
  } else {
    const wd = omega * Math.sqrt(1 - zeta * zeta)
    const b = (s.v + zeta * omega * d) / wd
    const e = Math.exp(-zeta * omega * dt)
    const cos = Math.cos(wd * dt)
    const sin = Math.sin(wd * dt)
    const x = (d * cos + b * sin) * e
    s.x = target + x
    s.v = e * wd * (b * cos - d * sin) - zeta * omega * x
  }
  // Thresholds scale with the target so pixel springs do not idle on an invisible tail.
  const scale = Math.max(1, Math.abs(target))
  const settled = Math.abs(s.x - target) < 5e-4 * scale && Math.abs(s.v) < 0.005 * scale
  if (settled) {
    s.x = target
    s.v = 0
  }
  return !settled
}

/**
 * The light of a press. The rule, kept here and applied by the engine:
 *
 * - A button is lit by GLOW: a press lets light in where it lands, the light holds a moment and
 *   fades as it spreads. A view says `button: true` and the engine does the rest (Button, Action
 *   Button and Button Group, through GlassLayer). The control of a surface that opens (GlassPopup)
 *   is a button too and brings the same light itself (`glow` on its lens), because there it goes
 *   on to open the surface.
 * - A surface is lit by LIGHT alone: a soft white light where the press lands, for as long as it
 *   is held. Every glass that is not a button is a surface: a card, a menu or a list that has
 *   opened, a lens, a thumb, a badge. Nothing asks for it; `pointerLight: false` on a lens opts out.
 * - A surface that holds choices also lights up around a choice pressed in it, with GLOW's
 *   `select` values: a wide, soft light that stays inside the glass. A choice is an option, a
 *   menu item, or anything marked `data-glass-item` or `data-glass-pick`. The engine does it for
 *   every surface (a menu, a submenu, a card with rows); the lists of a Select, a Dropdown Menu
 *   and a Popover bring the same light themselves (theirs leaves with the surface) and say
 *   `choices: false`.
 * - A button takes LIGHT too, beneath its GLOW. No light follows the pointer, and a pointer that
 *   only rests on the glass lights nothing.
 *
 * A new component follows the rule by saying what it is: it never draws a light of its own.
 *
 * GLOW: a press lets light into the glass where it lands. The light paints nothing: it brightens what
 * is already there, keeping its colour (luminance L becomes L^(1 / (1 + amount)) at the centre,
 * so black stays black and white stays white). These are
 * the values for wider controls; GLOW_SMALL, below, holds the same set for small ones.
 */
const GLOW = {
  /** One press, at the centre of the light. Presses that land before the last has faded add up, to `stack` presses at most. */
  amount: 3.55,
  stack: 3,
  /**
   * A choice made inside an open surface: this much of a press, and a light of its own size. It
   * is a wide, soft light around the choice (`selectReach` at first, `selectSpread` more as it
   * fades, both × the control's height) and it leaves as the surface starts back in.
   */
  select: 0.45,
  selectReach: 1.6,
  selectSpread: 1.2,
  /** A choice's light is gone once the surface is this far back in (0–1 of the way open; higher = it leaves sooner). */
  selectLeave: 0.5,
  /** The light's reach at first, and how much further it spreads as it fades (both × the control's height). */
  reach: 1.65,
  spread: 3,
  /** It stays for at least this long (seconds), comes up at `riseSpeed`, fades at `fadeSpeed` and spreads at `spreadSpeed` (springs: higher = faster). */
  hold: 0.2,
  riseSpeed: 60,
  fadeSpeed: 5.5,
  spreadSpeed: 5,
  /**
   * The press that opens a surface: its light grows with the surface until it covers it whole
   * (its reach ends at `cover` × the surface's diagonal). It lets go once the surface is this
   * far open (0–1) and fades at `coverFadeSpeed`: a flash, not a wash.
   */
  cover: 0.9,
  coverUntil: 0.1,
  coverFadeSpeed: 10,
  /** How much of the light spills past an open surface's edge (0 = none). */
  halo: 0.35,
}
/**
 * What the rim mirrors of the page around the glass. Each point of the rim looks outwards and
 * takes the colour of what it faces, where that differs from the surface the glass sits on: an
 * orange button above a control shows as an orange edge along its top. Only clear glass
 * mirrors: glass in its own colour (tinted, or a lens frosted over at rest) shows nothing.
 * These values are the look.
 */
const MIRROR = {
  /**
   * How much of a neighbour shows on the rim's line (1 at most: the line is the rim light's own,
   * as thin as the one that leans towards the cursor), and in the band that begins inside it.
   */
  line: 1,
  band: 0.7,
  /**
   * How deep that band goes: this × the glass's shorter half (or its reach, on taller glass).
   * The rim's edge looks `reach` far; the look shortens with depth and ends here, so a
   * neighbour's picture fills the band where it is near and thins out where the rim turns
   * away from it: a crescent on a round glass.
   */
  depth: 0.58,
  /** How fast the picture fades from the rim inwards, an exponent (1 = evenly, higher = it keeps closer to the rim). */
  fall: 1,
  /** How soft the picture is: the patch each point gathers, × the reach (0 = a sharp mirror). */
  soft: 1,
  /** How much more than its plain difference from the surface a neighbour counts. */
  gain: 1.8,
  /** How much a darker neighbour dims the rim (× the above; 0 = not at all). */
  dim: 0.65,
  /** How far the rim's edge looks: this × the glass's height, between `reachMin` and `reachMax` px. */
  reach: 0.55,
  reachMin: 24,
  reachMax: 96,
  /** What a point gathers along its look: shares from its near part, from further out and from its far end. */
  near: 0.25,
  mid: 0.35,
  far: 0.4,
  /** The rim light's far side: its brightness (× the lit side's), and how much of the surroundings' colour it takes (0 = always white). */
  bounce: 0.6,
  tint: 1,
}

/**
 * The same light on a small control: a single icon, or a label of about five letters (up to
 * roughly twice as wide as it is tall, as in GOOEY). In between the two sets are blended. The
 * light stays close to the press there, comes up slower and holds until the surface is half open.
 */
const GLOW_SMALL              = { ...GLOW, reach: 0.7, spread: 0.7, riseSpeed: 24, coverUntil: 0.5 }

/** The light on a morphing control (Popover): GLOW's, staying longer and adding up a little further. */
const MORPH_GLOW              = { ...GLOW, stack: 3.5, hold: 0.5 }
const MORPH_GLOW_SMALL              = { ...GLOW_SMALL, stack: MORPH_GLOW.stack, hold: MORPH_GLOW.hold }

/**
 * LIGHT, the light every glass takes under a press and the only one a surface takes (the rule is
 * above GLOW): glass lit from within, beginning where the press landed. A press (any
 * pointer, or Space / Enter on the focused control) brings it up, and it stays at that point of
 * the glass for as long as the press is held, wherever the pointer goes; let go, it sinks back.
 * It follows nothing, and a pointer that only rests on the glass lights nothing. It is white laid over the
 * glass: strongest at that point, falling off evenly to nothing at its radius, and it never
 * leaves the glass. Every glass takes it: the kit's controls, and a surface that opens
 * (GlassPopup), on top of its own light (GLOW). A lens that says `pointerLight: false` does not,
 * and `on: false` turns it off everywhere. The light and its numbers are those of Glass HQ's liquid-glass 0.0.2 (MIT,
 * https://github.com/Glass-HQ/liquid-glass). Read on every frame: do not tune them casually.
 */
const LIGHT = {
  on: true,
  /** How white the glass is under the pointer at full light (0–1): on a light page, and on a dark one. */
  strength: 0.3,
  strengthDark: 0.16,
  /** How much of the full light a press brings. */
  press: 1,
  /** The light's radius: `size ×` the glass's longer side, between `sizeMin` and `sizeMax` px. */
  size: 0.9,
  sizeMin: 36,
  sizeMax: 180,
  /** A press comes up in about `rise` seconds, overshooting a little (`riseBounce`: 0 = none), and sinks back in `fade` seconds, without bounce. */
  rise: 0.24,
  riseBounce: 0.2,
  fade: 0.42,
}

/** Every spring the kit uses. Hover width/height bounce out of phase: the glass wobbles like a drop. */
const SPRINGS = {
  press: { omega: 16, zeta: 0.6 },
  hoverX: { omega: 17, zeta: 0.42 },
  hoverY: { omega: 12, zeta: 0.34 },
  /** A droplet separating from the body: slow, one small overshoot. */
  dropletOut: { omega: 5, zeta: 0.72 },
  /** The droplet melting back in (pointer leaves or presses). */
  dropletIn: { omega: 13, zeta: 0.7 },
  /** A lens sliding to the newly selected option. */
  slide: { omega: 14, zeta: 0.75 },
  /** A dragged lens following the finger. */
  drag: { omega: 40, zeta: 0.999 },
}         

/**
 * Glass that a held pointer pulls after itself: press it, drag away, and it follows a little way
 * through a rubber band, stretches along the pull and thins across it, then swings back like gel
 * when let go. It is for buttons: the engine does it for glass whose view says `pull: true`
 * (GlassLayer does, so Button, Action Button and Button Group; `pull={false}` there keeps one in
 * its place), the innermost one under the press, by moving and stretching its host (CSS
 * `translate` and `scale`, content included). The control of a surface that opens (GlassPopup:
 * Select, Dropdown Menu, Popover, Menu) is a button too while it is shut, and opens when the press
 * is let go on it. No other glass is pulled, and `on: false` here turns it off everywhere. The motion and its numbers are those of Glass HQ's liquid-glass 0.0.2 (MIT,
 * https://github.com/Glass-HQ/liquid-glass). Read on every frame: do not tune them casually.
 */
const PULL = {
  on: true,
  /**
   * Glass whose longer side is at most this (px) is small: it follows the pointer from the point
   * it was pressed at. Larger glass moves only once the pointer is past its edge, by how far past.
   */
  smallUntil: 72,
  /** The furthest the pull moves small glass, px: `smallReach + smallReachPerPx × its longer side`. */
  smallReach: 4,
  smallReachPerPx: 0.15,
  /** The same for larger glass, `reachMax` at most. */
  reach: 3,
  reachPerPx: 0.04,
  reachMax: 10,
  /** How fast the band stiffens: 0.55 is a scroll view's. */
  resistance: 0.55,
  /** Following the pointer takes `follow + followPerPx × the longer side` seconds, without bounce (larger glass is heavier). */
  follow: 0.18,
  followPerPx: 5e-4,
  /** Let go: back to rest in about `release` seconds, overshooting like gel (`releaseBounce`: 0 = none, towards 1 = more). */
  release: 0.5,
  releaseBounce: 0.42,
  /**
   * The stretch along one axis: `stretch × the pull ÷ the glass's size that way`, plus
   * `stretchPerSpeed ×` the pull's own speed and `stretchPerDrift ×` the speed the glass's place
   * on the page moves at (px/s). Small glass stretches by `smallStretchMax` at most, larger by
   * `stretchMax`. Across, the glass thins by the square root of the stretch.
   */
  stretch: 0.5,
  stretchPerSpeed: 7e-5,
  stretchPerDrift: 5e-5,
  smallStretchMax: 0.2,
  stretchMax: 0.12,
  /** The drift speed is smoothed in at this rate while held, and dies out at `driftOut` (per second). */
  driftIn: 12,
  driftOut: 10,
}

/**
 * Presses the kit sends itself: GlassPopup keeps a press that would open its surface and hands it
 * on when it is let go. Such a press is no pointer holding the glass: nothing is pulled or lit by
 * it, and no release follows it. Whoever dispatches one adds it here first.
 */
const HANDED_ON = new WeakSet       ()

/** A rubber band: a short pull follows almost one to one, a long one nears `limit` and never reaches it. */
function rubberBand(offset        , limit        , resistance = 0.55) {
  if (!(limit > 0)) return 0
  return Math.sign(offset) * limit * (1 - 1 / ((Math.abs(offset) * resistance) / limit + 1))
}

/**
 * The gooey popup: a surface (a list, a menu, a popover) that swells out of its anchor as one
 * body of glass, holds on by a neck that thins and snaps, and plays the same motion backwards to
 * close. Used by GlassPopup (`glass-popup.tsx`). These values are the look: do not tune them casually.
 */
const GOOEY = {
  /** How heavy the two halves are. Heavier glass is thrown less by a jolt and swings back slower. */
  weight: 6,
  /** The panel opening: speed, and damping (below 1 it overshoots as it lands). */
  openSpeed: 11,
  openDamping: 1,
  /** Closing replays the opening backwards, at closeSpeed / openSpeed × its pace (equal = the same pace). */
  closeSpeed: 26,
  /** The panel lets go of the trigger once it is this far open (0–1). */
  detachAt: 0.1,
  /** How fast the neck thins once it lets go (lower = a slower snap). */
  snapSpeed: 5.6,
  /** Bridge softness in px at full strength, and how far the panel leans back towards the trigger. */
  neckSoftness: 50,
  neckPull: 11,
  /** The jolt when the neck snaps: its strength, how fast it swings, how soon it dies out (higher = sooner). */
  kick: 6,
  recoilSpeed: 4,
  recoilDamping: 1,
  /** How far each half is thrown by a jolt, and how far the trigger sags while attached (px). */
  triggerJolt: 0,
  panelJolt: 0,
  triggerSag: 6,
  /** The list: how far open the panel is when the first option appears (0–1), the delay between options and each one's fade (seconds). */
  itemsAt: 0.85,
  itemsGap: 0.06,
  itemsFade: 0.22,
  /**
   * Small controls only: a single icon, or a label of about five letters (up to roughly twice as
   * wide as they are tall). The bridge is as wide as the whole control there, so it gets its own
   * softness in px (in place of neckSoftness), a fade of that softness towards the control's far
   * edge (0–1, and how far in it recovers, × the height) and a neck no thinner than this × the
   * height, at first and once it has gathered. Wider controls keep the values above.
   */
  smallNeckSoftness: 14,
  smallEdgeFade: 1,
  smallEdgeReach: 0.5,
  smallNeck: 0.6,
  smallNeckWide: 1.2,
}

/**
 * The morphing popup: a control that becomes its surface. The surface (Card's glass, as in the
 * gooey popup) comes out over the control itself: round all the way, a little past its own box,
 * then settled, while the control lets go of its label and its glass gives way to the card. The
 * surface's content comes into focus inside it as it grows. Closing is a calmer motion of its
 * own: the content goes first and the surface slides back into the control, slowing as it lands. Used by GlassPopup with `opening: 'morph'` (`glass-popup.tsx`). These values are the
 * look: do not tune them casually.
 */
const MORPH = {
  /** The side that grows the most: its speed, and damping (below 1 it lands past the surface and comes back). */
  openSpeed: 30,
  openDamping: 1,
  /** The other side follows on a slower spring with more bounce. */
  crossSpeed: 16,
  crossDamping: 0.58,
  /**
   * While the first side runs ahead of the other, the glass is this much thinner across (× how
   * far ahead, 0–1); as the other catches up and passes it, as much wider.
   */
  pinch: 0,
  /** Corners, frost and the content's focus follow at this speed, without a bounce. */
  calmSpeed: 12,
  /** Closing replays the opening backwards, at this × its pace. */
  closePace: 1.7,
  /** The control's label is gone once the surface is this far out (0–1). */
  labelOut: 0.02,
  /** The content fades in with the calm follow, and is fully visible once that is this far (0–1). */
  contentFade: 0.75,
  /** How soft the label gets as it goes, and the content as it starts (a blur, CSS px). */
  labelBlur: 0,
  contentBlur: 5.5,
  /** How much of the surface's growth the content takes: 1 = it is as small as the glass is, 0 = full size from the start, only cut to the glass. */
  zoom: 1,
  /**
   * Not gooey: the surface and the control are two shapes laid over each other, with a clean
   * edge where they meet. `gooey: 1` melts them there instead, by `softness` CSS px.
   */
  gooey: 0,
  softness: 40,
  /** How the surface starts, in the control's middle: 0 = a circle as tall as the control, 1 = the control's own box. */
  seed: 1,
  /** It stays round all the way until the calm follow is this far (0–1); its own corners come after. */
  cornersFrom: 0.3,
  /**
   * Its weight. At the press the control is thrown down (`kick`: how hard; `throw`: how far a
   * throw of 1 carries it, CSS px) and swings back at `swingSpeed`, dying out by `swingDamping`
   * (below 1 it swings to and fro). Heavier glass is thrown less and swings slower.
   */
  weight: 8,
  kick: 8,
  swingSpeed: 17.5,
  swingDamping: 0.6,
  throw: 80,
  /** The surface comes out this long after the press (seconds): the control is thrown first. */
  openDelay: 0.1,
  /**
   * The surface's way into place: as it grows it is carried up to `drop` CSS px above its place
   * (negative: below), and comes down `dropDelay` seconds after the press on a soft spring
   * (`dropSpeed`; `dropDamping` 1 = no bounce). 0 px = it grows where it is.
   */
  drop: 60,
  dropDelay: 0.2,
  dropSpeed: 9,
  dropDamping: 1,
  /** Asked to close, the surface stays as it is this long (seconds) before it goes back in. */
  closeDelay: 0,
  /**
   * `closeSoft: 1`: closing is a motion of its own (`0`: the opening played backwards). The
   * surface goes back into the control on one spring with no bounce (`closeSpeed`), slowing as it
   * lands, and the control stays still: it is not thrown, does not swell and does not light up. The content
   * does not wait for the glass: it is gone `closeFade` seconds after the close begins. A choice's
   * light comes into the control with the surface and narrows to `closeGlowReach` (× the control's
   * height) as it does, so it does not flood the control. `closeKick`:
   * with the opening played backwards, how much of the throw the control takes once the surface
   * is back in (× `kick`; 0 = it stays still).
   */
  closeSoft: 1,
  closeSpeed: 14,
  closeFade: 0.12,
  closeGlowReach: 1,
  closeKick: 1,
  /** The control's own glass (clear, lit) gives way to the card's between these two points of the calm follow (0–1). */
  frostFrom: 0,
  frostTo: 0.05,
}

/**
 * The growing popup: a control whose glass becomes its menu. One shape on one spring: the
 * control's own outline grows into the menu's, wherever the menu lies (below, above or beside
 * it), and shrinks back along the same path to close. The side the menu lies on runs ahead and
 * the other follows, so the glass pours towards its place instead of scaling up. The control's
 * label goes as the glass leaves it; the menu's content stays where it is and the glass opens
 * over it. A close that is interrupted carries on from where it is, at the speed it has. It takes
 * no light from a press (GLOW is not used here). Used by
 * GlassPopup with `opening: 'grow'` (`glass-popup.tsx`). The motion and its numbers are those of
 * Glass HQ's liquid-glass 0.0.2 (MIT, https://github.com/Glass-HQ/liquid-glass). These values
 * are the look: do not tune them casually.
 */
const MENU = {
  /** Opening takes about `open` seconds and lands a little past the menu (`openBounce`: 0 = not at all, towards 1 = more). */
  open: 0.42,
  openBounce: 0.18,
  /** Closing: the same, on its own spring. */
  close: 0.32,
  closeBounce: 0.1,
  /**
   * The side the menu lies on leads and the other follows, both as exponents: the leading side
   * goes as 1 − (1 − p)^lead, the other as p^follow (1 and 1: both sides grow evenly).
   */
  lead: 1.6,
  follow: 1.4,
  /**
   * On the way the corners stay round: no tighter than `round` × the shape's shorter side, until
   * the motion is `roundFrom` of the way (0–1), easing to the menu's own corners by `roundUntil`.
   */
  round: 0.34,
  roundFrom: 0.35,
  roundUntil: 0.8,
  /** The control's label goes between these two points of the way (0–1), softening by `labelBlur` CSS px. */
  labelFrom: 0.02,
  labelTo: 0.3,
  labelBlur: 3,
  /** The menu's content shows between these two points, coming out of a blur of `contentBlur` CSS px (0 = none: the cheapest). */
  contentFrom: 0.4,
  contentTo: 0.9,
  /** Closing, the content does not wait for the glass: it is gone this long (seconds) after the close begins. */
  closeFade: 0.12,
  contentBlur: 6,
  /** The control's glass (clear, lit) gives way to the card's between these two points. Done by `labelTo`, so the label is gone before the menu's layer takes the glass over. */
  frostFrom: 0,
  frostTo: 0.3,
}

const lerp =(a        , b        , t        ) => a + (b - a) * t
const clamp = (v        , a = 0, b = 1) => Math.max(a, Math.min(b, v))
const smooth = (a        , b        , v        ) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const mixRgb = (a     , b     , t        )      => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
const rgbCss = (c     ) => `rgb(${Math.round(c[0] * 255)} ${Math.round(c[1] * 255)} ${Math.round(c[2] * 255)})`

const isVisibleColor = (c        ) => !!c && c !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(c) && !/\/\s*0\)$/.test(c)

/** The colour an element sits on: the first ancestor with a painted background. */
function surfaceColorOf(el                )         {
  for (let a = el; a; a = a.parentElement) {
    const c = getComputedStyle(a).backgroundColor
    if (isVisibleColor(c)) return c
  }
  return getComputedStyle(document.documentElement).colorScheme.includes('dark') ? 'black' : 'white'
}

/** The lens is designed 120 units tall; every optic below is in those units. */
const DESIGN_HEIGHT = 120

const VERTEX = `#version 300 es
in vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uSize, uCenter, uHalf, uLightDir;
uniform float uUnit, uDevicePx, uRadius, uBevel, uBodyX, uBand, uFieldRadius;
uniform vec3 uDrop;
uniform vec4 uBlob;
uniform vec2 uBlobShape, uBlobNeck, uBlobFade;
uniform float uRim, uCaustic, uInner, uTopRefl, uTopBase, uRimWidth, uFresnel;
uniform float uShadow, uShadowSoft, uShadowOffset;
uniform float uLightMix, uEdgeClear;
uniform vec3 uSurface, uColor, uBorder;
uniform float uBorderWidth, uBorderAlpha;
uniform sampler2D uBack, uFront;
uniform float uTextured, uRefract, uMag, uDisp, uBlurCenter, uBlurEdge, uBlurShift, uFrost, uFrostBlur, uFrostMix;
uniform float uFrostEdge, uSaturation, uBendCurve, uEdgeBand;
uniform vec2 uRadial;
uniform vec4 uGlow;
uniform vec2 uGlowHalo;
uniform float uGlowBlob;
uniform vec4 uLight;
uniform vec4 uBlobMat;
uniform vec3 uBlobLine;
uniform float uCssPx;
uniform sampler2D uAround;
uniform vec4 uAroundBox;
uniform float uAroundScale, uReach;
uniform vec4 uMirror, uSeen;
uniform vec2 uBounce;
uniform float uFall, uSoft;
out vec4 outColor;

// design units -> texture uv (textures are uploaded flipped: top row at v = 1)
vec2 toUv(vec2 d) {
  vec2 q = d * uUnit;
  return clamp(vec2(q.x / uSize.x, 1.0 - q.y / uSize.y), vec2(0.0005), vec2(0.9995));
}
vec3 backdrop(vec2 st, float lod) {
  vec4 c = textureLod(uBack, st, lod);
  return c.rgb + (1.0 - c.a) * uSurface;
}
// What surrounds the glass (GlassLens.reflection), at a point of the canvas in design units and
// blurred over spread. Where the picture is empty, or there is none, it is the surface colour.
vec3 around(vec2 d, float spread) {
  vec2 st = clamp((d - uAroundBox.xy) / uAroundBox.zw, vec2(0.002), vec2(0.998));
  vec4 c = textureLod(uAround, vec2(st.x, 1.0 - st.y), log2(max(spread * uAroundScale, 1.0)));
  return c.rgb + (1.0 - c.a) * uSurface;
}
// Frosted glass: the backdrop under a gaussian blur of deviation sigma (design units),
// gathered from 32 taps on a golden-angle spiral out to 2.5 deviations. Each tap reads a
// mip about as wide as the gap between taps, so the frost stays smooth while the backdrop moves.
vec3 frosted(vec2 p, float sigma) {
  float lod = max(log2(sigma * 0.8 * uUnit) - 0.5, 0.0);
  vec3 sum = vec3(0.0);
  float total = 0.0;
  for (int i = 0; i < 32; i++) {
    float f = float(i) + 0.5;
    float r = sqrt(f / 32.0) * 2.5 * sigma;
    float a = f * 2.39996323;
    float w = exp(-0.5 * r * r / (sigma * sigma));
    sum += backdrop(toUv(p + r * vec2(cos(a), sin(a))), lod) * w;
    total += w;
  }
  return sum / total;
}
// The sharp bend: the backdrop at p pushed by bend, its colours split slightly.
vec3 bent(vec2 p, vec2 bend, float split, float lod) {
  return vec3(
    backdrop(toUv(p + bend * (1.0 + split)), lod).r,
    backdrop(toUv(p + bend), lod).g,
    backdrop(toUv(p + bend * (1.0 - split)), lod).b);
}
float roundRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float melt(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
  return mix(a, b, h) - k * h * (1.0 - h);
}
// The glass shape: a pill body, smoothly unioned with a separating droplet.
float bodyShape(vec2 p) {
  float body = roundRect(p - vec2(uBodyX, 0.0), uHalf, uRadius);
  if (uDrop.y <= 0.0) return body;
  float d = length(p - vec2(uDrop.x, 0.0)) - uDrop.y;
  float k = max(uDrop.z, 1e-3);
  float h = clamp(0.5 + 0.5 * (d - body) / k, 0.0, 1.0);
  return mix(d, body, h) - k * h * (1.0 - h);
}
// ...and with the optional second box (uBlobShape.y = its bridge softness, 0 = none).
float blobSoft(vec2 p) {
  float k = uBlobShape.y;
  if (uBlobNeck.y > 0.0) {
    float n = (p.x - uBlobNeck.x) / uBlobNeck.y;
    // A peaked falloff: as the softness drops, the bridge thins into a thread before it breaks.
    k *= exp(0.2 - sqrt(n * n + 0.04));
  }
  // On a small body the bridge belongs to the side that faces the second box: towards the far
  // edge the softness fades out (uBlobFade: how much, and how far in), or it raises a ridge there.
  if (uBlobFade.x > 0.0) {
    float back = smoothstep(-uHalf.y, -uHalf.y + 2.0 * uHalf.y * max(uBlobFade.y, 0.01), p.y * sign(uBlob.y));
    k *= mix(1.0, back, uBlobFade.x);
  }
  return max(k, 1e-3);
}
float shape(vec2 p) {
  float s = bodyShape(p);
  if (uBlobShape.y <= 0.0) return s;
  return melt(roundRect(p - uBlob.xy, uBlob.zw, uBlobShape.x), s, blobSoft(p));
}
// What casts the drop shadow: the body alone once a blob has a glass of its own.
float caster(vec2 p) {
  return uBlobShape.y > 0.0 && uBlobLine.z > 0.5 ? bodyShape(p) : shape(p);
}
// The body with corners at least as round as the bend is deep (see uBand in main).
float field(vec2 p) {
  float f = roundRect(p - vec2(uBodyX, 0.0), uHalf, uFieldRadius);
  if (uBlobShape.y <= 0.0) return f;
  return melt(roundRect(p - uBlob.xy, uBlob.zw, uBlobShape.x), f, blobSoft(p));
}
// The reference darkens linear colour; on sRGB values the same factor is k^(1/2.2).
float dim(float k) { return pow(clamp(k, 0.0, 1.0), 1.0 / 2.2); }
vec3 dim(vec3 k) { return pow(clamp(k, 0.0, 1.0), vec3(1.0 / 2.2)); }
float height(vec2 p) {
  float t = pow(clamp(-shape(p) / uBevel, 0.0, 1.0), 1.0 / 1.4);
  return sqrt(1.0 - (1.0 - t) * (1.0 - t));
}
// Radial bend (the SVG card's): towards the centre, strongest at the rim, fading over the
// half size. uRadial is the full bend per axis (design units); uEdgeBand / 0.35 = bendDepth.
float radialRatio(float d) {
  return clamp(1.0 - abs(d) / (min(uHalf.x, uHalf.y) * uEdgeBand / 0.35), 0.0, 1.0);
}
// d = shape(q): the caller has it already.
vec2 radialBend(vec2 q, float d) {
  vec2 c = q - vec2(uBodyX, 0.0);
  float k = pow(radialRatio(d), uBendCurve) * smoothstep(1.5 * uCssPx, -0.5 * uCssPx, d);
  return -c / max(length(c), 1e-4) * k * uRadial;
}
// Frost after the bend: every tap is bent on its own, and taps outside the glass are left
// out (the SVG filter saw nothing beyond the card), so the rim keeps its colour.
vec3 frostedRadial(vec2 q, float dq, float sigma) {
  float lod = max(log2(sigma * 0.8 * uUnit) - 0.5, 0.0);
  vec3 sum = vec3(0.0);
  float total = 0.0;
  for (int i = 0; i < 32; i++) {
    float f = float(i) + 0.5;
    float r = sqrt(f / 32.0) * 2.5 * sigma;
    float a = f * 2.39996323;
    vec2 t = q + r * vec2(cos(a), sin(a));
    // One shape per tap: it masks the tap and bends it.
    float dt = shape(t);
    float w = exp(-0.5 * r * r / (sigma * sigma)) * step(dt, 0.0);
    sum += backdrop(toUv(uCenter + t + radialBend(t, dt)), lod) * w;
    total += w;
  }
  return total > 1e-4 ? sum / total : backdrop(toUv(uCenter + q + radialBend(q, dq)), lod);
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
  vec2 local = px / uUnit - uCenter;
  float dist = shape(local);

  // Drop shadow: tight + ambient, kept near the glass, faded before the canvas edge.
  float vFade = smoothstep(-0.1, 0.9, local.y / uHalf.y) * 0.92 + 0.08;
  float outside = smoothstep(-4.0, 14.0, dist);
  float near = 1.0 - smoothstep(-6.0, uShadowSoft, caster(local - vec2(0.0, uShadowOffset)));
  float far = 1.0 - smoothstep(-10.0, uShadowSoft * 1.5, caster(local - vec2(0.0, uShadowOffset * 1.6)));
  float border = min(min(px.x, px.y), min(uSize.x - px.x, uSize.y - px.y));
  float sh = clamp((near + far) * uShadow * vFade * outside, 0.0, 0.85) * smoothstep(0.0, 14.0, border);
  vec4 outsideCol = vec4(0.0, 0.0, 0.0, 1.0 - dim(1.0 - sh));

  // Glow (see below): its strength here. It stays inside the glass unless a halo is asked for
  // (uGlowHalo: 1 = around the body, 2 = around the blob; and how much).
  float glowAt = 0.0;
  if (uGlow.w > 0.0) {
    vec2 gd = (local - uGlow.xy) / max(uGlow.z, 1.0);
    glowAt = uGlow.w * exp(-dot(gd, gd));
    if (uGlowHalo.x > 0.5) {
      // Past that edge it brightens the page the same way: the page's own colour at its
      // brightest, laid over just thick enough to lift the surface colour to L^(1 / (1 + halo)).
      float edgeDist = uGlowHalo.x > 1.5 ? roundRect(local - uBlob.xy, uBlob.zw, uBlobShape.x) : roundRect(local - vec2(uBodyX, 0.0), uHalf, uRadius);
      float halo = glowAt * uGlowHalo.y * exp(-max(edgeDist, 0.0) / 28.0) * smoothstep(0.0, 14.0, border);
      float pageL = max(dot(uSurface, vec3(0.2126, 0.7152, 0.0722)), 1e-4);
      float pageMax = max(max(uSurface.r, uSurface.g), uSurface.b);
      float cover = clamp((pow(pageL, 1.0 / (1.0 + halo)) / pageL - 1.0) * pageMax / max(1.0 - pageMax, 1e-3), 0.0, 1.0);
      outsideCol = vec4(uSurface / max(pageMax, 1e-3) * cover, cover + outsideCol.a * (1.0 - cover));
    }
  }

  // Outside the glass the shadow (and the halo) is the whole pixel: about half of every canvas
  // stops here, before the bevel, the bend and the light are worked out.
  float aa = max(fwidth(dist), 1e-4);
  float mask = 1.0 - smoothstep(-aa, aa, dist);
  if (mask <= 0.0) {
    outColor = outsideCol;
    return;
  }

  // The lighting belongs to the body. A melted blob takes none of it (no reflection, inner
  // shading, rim light or caustic): its face stays flat, and the light fades out where it begins.
  float lit = 1.0;
  if (uBlobShape.y > 0.0) lit = 1.0 - smoothstep(-2.0, 8.0, roundRect(local - vec2(uBodyX, 0.0), uHalf, uRadius));
  // A blob with a glass of its own: its tint, frost and bend take over where the light leaves.
  float own = (1.0 - lit) * uBlobLine.z;
  float frostCover = mix(uFrost, uBlobMat.x, own);
  float frostBlur = mix(uFrostBlur, uBlobMat.y, own);
  float bendCurve = mix(uBendCurve, uBlobMat.z, own);
  float edgeBand = mix(uEdgeBand, uBlobMat.w, own);

  // Surface normal from the bevel height field.
  float e = 1.25;
  float h = height(local);
  vec2 grad = vec2(height(local + vec2(e, 0.0)) - h, height(local + vec2(0.0, e)) - h) / e;
  vec3 normal = normalize(vec3(-grad * 42.0, 1.0));
  float depth = clamp(1.0 - h, 0.0, 1.0);
  float edge = 1.0 - smoothstep(0.0, uBevel * edgeBand, -dist);
  vec2 dir = normalize(vec2(shape(local + vec2(e, 0.0)) - dist, shape(local + vec2(0.0, e)) - dist) + 1e-6);

  vec3 glass;
  if (uTextured > 0.5 && (uRadial.x > 0.0 || uRadial.y > 0.0)) {
    // Radial bend, then frost: the old SVG card's rim.
    float ratio = radialRatio(dist);
    float sharpLod = max(uBlurShift, 0.0);
    if (uFrostBlur > 0.0 && dist < 1.0) {
      vec3 frost = frostedRadial(local, dist, uFrostBlur * mix(1.0, uFrostEdge, pow(ratio, 1.3)));
      glass = uFrostMix < 1.0 ? mix(bent(uCenter + local, radialBend(local, dist), uDisp * 0.35, sharpLod), frost, uFrostMix) : frost;
    } else {
      glass = bent(uCenter + local, radialBend(local, dist), uDisp * 0.35, sharpLod);
    }
    if (uSaturation != 1.0) glass = max(mix(vec3(dot(glass, vec3(0.2126, 0.7152, 0.0722))), glass, uSaturation), 0.0);
  } else if (uTextured > 0.5) {
    // Refraction: magnify the middle, bend inwards at the rim, split colours slightly.
    // A lens with square corners (uBand > 0) bends deeper than its corner radius. The
    // bend then follows a shape whose corners are at least that round: on the real
    // shape its direction would break along the diagonals. Mask and light keep the real shape.
    float bendEdge = edge;
    vec2 bendDir = dir;
    if (uBand > 0.0) {
      float fd = field(local);
      bendDir = normalize(vec2(field(local + vec2(e, 0.0)) - fd, field(local + vec2(0.0, e)) - fd) + 1e-6);
      bendEdge = 1.0 - smoothstep(0.0, uBand, -fd);
    }
    vec2 magnified = local / (uMag * h + 1.0);
    vec2 bend = -bendDir * uRefract * pow(bendEdge, bendCurve);
    float split = uDisp * 0.35 * (1.0 - own);
    float lod = max(mix(uBlurCenter, uBlurEdge, pow(bendEdge, 1.3)) + uBlurShift, 0.0);
    vec2 at = uCenter + magnified;
    if (frostBlur > 0.0 && dist < 1.0) {
      // Frosted (inside the glass only: outside, nothing of it shows). The frost hides the
      // colour split, so one bent point is enough; uFrostMix lets the sharp bend show through.
      vec3 frost = frosted(at + bend, frostBlur * mix(1.0, uFrostEdge, pow(bendEdge, 1.3)));
      glass = uFrostMix < 1.0 ? mix(bent(at, bend, split, lod), frost, uFrostMix) : frost;
    } else {
      glass = bent(at, bend, split, lod);
    }
    // Vibrancy: what shows through, more (or less) saturated.
    if (uSaturation != 1.0) glass = max(mix(vec3(dot(glass, vec3(0.2126, 0.7152, 0.0722))), glass, uSaturation), 0.0);
  } else {
    // Tinted glass: its own colour in the middle, thinning towards the rim.
    glass = mix(uSurface, uColor, 1.0 - edge * uEdgeClear);
  }

  // Top reflection.
  float ny = local.y / uHalf.y;
  float nx = (local.x - uBodyX) / uHalf.x;
  float top = ((1.0 - smoothstep(-0.05, 0.75, ny)) * (1.0 - nx * 0.12) * uTopRefl * 0.6 + uTopBase) * lit;
  glass *= dim(1.0 - vec3(1.0, 1.0, 0.72) * top);

  // Frosted resting state: a still lens is the flat highlight colour.
  glass = mix(glass, uColor, frostCover * step(0.5, uTextured));

  // Inner shading: just inside the rim, a wide band on the left, a deep ring.
  float up = clamp(-dir.y, 0.0, 1.0);
  float right = clamp(dir.x, 0.0, 1.0);
  float left = clamp(-dir.x, 0.0, 1.0);
  float down = clamp(dir.y, 0.0, 1.0);
  float inner = uInner * lit;
  float innerBand = smoothstep(uBevel * -0.19, uBevel * -0.024, dist);
  glass *= dim(1.0 - innerBand * (up + left * 0.6 + right * 0.3 + down * 0.15) * inner * 2.2);
  float deepBand = smoothstep(uBevel * -0.73, uBevel * -0.13, dist);
  glass *= dim(1.0 - deepBand * left * inner * 2.0);
  float hx = (dist + uBevel * 0.45) / (uBevel * 0.26);
  float ring = exp(-hx * hx);
  glass *= dim(1.0 - ring * (right * 0.9 + up * 0.5 + left * 0.4 + down * 0.3) * inner * 1.5);

  // Rim light + fresnel; leans a little towards the cursor when there is one.
  float fresnel = pow(clamp(1.0 - normal.z, 0.0, 1.0), 6.0);
  float rimW = max(uDevicePx * 1.1, 1.0) * uRimWidth;
  float rimLine = 1.0 - smoothstep(0.0, rimW * 1.6, abs(dist + rimW * 1.8));
  float fall = exp(-(local.y / 30.0) * (local.y / 30.0));
  float studio = right * right * fall * 0.9 + down * down * 0.2 + left * left * 0.55;
  float lightCos = dot(dir, uLightDir);
  float facing = clamp(lightCos, 0.0, 1.0);
  float away = clamp(-lightCos, 0.0, 1.0);
  float aimed = facing * facing * 0.9 + away * away * 0.55;
  float lean = uLightMix * 0.4;
  float rimDir = mix(studio, aimed, lean);
  float front = mix(right, facing, lean);
  float back = mix(left, away, lean);
  // What this point of the glass mirrors. The bevel is a curved mirror: its very edge looks far
  // out, the way the rim faces there, and the look shortens with depth, down to nothing at the
  // band's inner end (uMirror.z). So a neighbour's picture is squeezed into the rim, deepest
  // where it is nearest and thinner as the rim turns away from it: a crescent on a round glass,
  // on a pill a band that tapers round the ends. Each point gathers a soft patch of the
  // surroundings (uSoft wide) at three places along its look, so the picture has no hard edge.
  float into = clamp(-dist / uMirror.z, 0.0, 1.0);
  float look = uReach * (1.0 - into);
  vec2 rimAt = uCenter + local - dir * dist;
  vec2 across = vec2(-dir.y, dir.x) * uSoft * 0.7;
  vec3 seen = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    vec2 at = rimAt + dir * look * (0.4 + 0.3 * float(i));
    seen += (around(at, uSoft) * 0.4 + around(at + across, uSoft) * 0.3 + around(at - across, uSoft) * 0.3) * uSeen[i];
  }
  // The light is white where it lands; the far side and the bottom are lit by what bounces back
  // from the surroundings, and take their colour (white from anything dark or grey).
  float seenMax = max(max(seen.r, seen.g), seen.b);
  vec3 bounce = mix(vec3(1.0), seen / max(seenMax, 1e-3), smoothstep(0.08, 0.5, seenMax) * uBounce.y);
  vec3 rimCol = mix(vec3(1.0), bounce, down * 0.6);
  rimCol = mix(rimCol, bounce * uBounce.x, back * 0.85);
  glass += rimCol * (rimLine * rimDir * uRim + fresnel * front * uFresnel * step(0.001, uRim)) * lit;

  // Reflection: the rim mirrors what differs from the surface the glass sits on. A neighbour
  // of another colour shows on the rim that faces it; a darker one dims it a little.
  // (uMirror: on the line, in the band inside it, that band's depth, the dimming. uSeen.w: the gain.)
  // much: how far what is seen differs from the surface; hue: that difference at full strength.
  vec3 differs = (seen - uSurface) * uSeen.w;
  float much = max(max(abs(differs.r), abs(differs.g)), abs(differs.b));
  vec3 hue = differs / max(much, 1e-4);
  much = min(much, 1.0);
  // On the rim it is the rim light's own line, no thicker; the band begins inside that line.
  float band = pow(1.0 - into, uFall) * uMirror.y * smoothstep(0.0, rimW * 1.8, -dist);
  float mirror = min(lit * max(rimLine * uMirror.x, band), 1.0) * much;
  // What it lacks of the surface's colour is taken out of the glass; then the glass is lifted
  // towards the neighbour's colour: dark glass mirrors it on any page.
  glass *= 1.0 - max(-hue, 0.0) * mirror * uMirror.w;
  glass += max(clamp(uSurface + hue, 0.0, 1.0) - glass, 0.0) * mirror;

  // Glow: light let in at one point, fading smoothly with distance. It brightens whatever glass
  // is near, evenly from the middle to the rim, a melted blob included (the halo is above),
  // unless the light is kept to the body (uGlowBlob: how much of it the blob takes).
  float glassL = max(dot(glass, vec3(0.2126, 0.7152, 0.0722)), 1e-4);
  glass *= pow(glassL, 1.0 / (1.0 + glowAt * mix(uGlowBlob, 1.0, lit))) / glassL;

  // Pointer light (LIGHT): white laid over the glass, strongest where the press landed and falling
  // off evenly to nothing at its radius. (uLight: its centre, its radius, how white.)
  if (uLight.w > 0.0) glass = mix(glass, vec3(1.0), uLight.w * max(1.0 - length(local - uLight.xy) / max(uLight.z, 1e-3), 0.0));

  // Caustic: warm light gathering inside the bottom edge.
  glass += vec3(1.0, 0.92, 0.86) * smoothstep(0.72, 0.98, depth) * down * uCaustic * lit;

  // Bordered body (outline buttons): a flat line just inside the edge.
  glass = mix(glass, uBorder, smoothstep(-uBorderWidth - aa, -uBorderWidth + aa, dist) * step(1e-4, uBorderWidth) * uBorderAlpha);
  // ...and the white line of a blob with its own glass.
  glass = mix(glass, vec3(1.0), smoothstep(-uBlobLine.x - aa, -uBlobLine.x + aa, dist) * uBlobLine.y * own);
  vec4 col = mix(outsideCol, vec4(clamp(glass, 0.0, 1.0), 1.0), mask);
  // Front layer (selected labels) sits on the frosted pill and fades as the lens clears.
  vec4 fg = texture(uFront, gl_FragCoord.xy / uSize) * mask * uFrost * step(0.5, uTextured);
  outColor = fg + col * (1.0 - fg.a);
}
`

function createEngine()                     {
  const glCanvas = document.createElement('canvas')
  const gl = glCanvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false })
  if (!gl) return null
  const compile = (type        , src        ) => {
    const s = gl.createShader(type)
    if (!s) return null
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s
    console.warn('[liquid-glass] shader failed to compile', gl.getShaderInfoLog(s))
    return null
  }
  const vs = compile(gl.VERTEX_SHADER, VERTEX)
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT)
  const program = gl.createProgram()
  if (!vs || !fs || !program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const attr = gl.getAttribLocation(program, 'a')
  gl.enableVertexAttribArray(attr)
  gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0)

  // Two shared canvases for textured lenses: what lies beneath, and what rides on top.
  // Each view keeps its own pair of textures, so a frame that only moves the light re-uses them.
  const layer = () => {
    const canvas = document.createElement('canvas')
    return { canvas, ctx: canvas.getContext('2d') }
  }
  const texture = (mipmapped         ) => {
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmapped ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR)
    if (mipmapped) gl.generateMipmap(gl.TEXTURE_2D)
    return tex
  }
  const back = layer()
  const front = layer()
  if (!back.ctx || !front.ctx) return null
                                                                                                            
  const painted = new Map                    ()
  // A third, small one for what surrounds a lens (its reflection), and each view's own texture of it:
  // where the picture was taken (the canvas's box then, CSS px) and how far past it it reaches.
  const around = layer()
  if (!around.ctx) return null
                                                                                                                                                       
  const mirrored = new Map                     ()
  /** Texels per CSS px of that picture: it is only ever seen blurred. */
  const AROUND_SCALE = 0.5
  /** It is taken again this often, at most (ms). */
  const AROUND_EVERY = 400
  // What a lens without layers samples (and ignores): a texture unit is never left empty.
  const blank = { back: texture(true), front: texture(false) }
  /** The page behind a still lens is read again this often while only the light moves (ms). */
  const REPAINT_EVERY = 120
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  gl.uniform1i(gl.getUniformLocation(program, 'uBack'), 0)
  gl.uniform1i(gl.getUniformLocation(program, 'uFront'), 1)
  gl.uniform1i(gl.getUniformLocation(program, 'uAround'), 2)
  const locations = new Map                                     ()
  const u = (name        ) => {
    if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name))
    return locations.get(name) ?? null
  }
  // Every uniform of a frame goes through `set`, which keeps the values: a view whose frame
  // would come out exactly as the one already on its canvas is not drawn again.
  const sent           = []
  const set = (name        , a        , b         , c         , d         ) => {
    const at = u(name)
    if (b === undefined) gl.uniform1f(at, a)
    else if (c === undefined) gl.uniform2f(at, a, b)
    else if (d === undefined) gl.uniform3f(at, a, b, c)
    else gl.uniform4f(at, a, b, c, d)
    sent.push(a, b ?? 0, c ?? 0, d ?? 0)
  }
  /** What a view's canvas shows now: its uniforms (empty = nothing usable) and its CSS box. */
  const shown = new WeakMap                                            ()

  const views = new Set           ()
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  let dead = false

  // Colour resolving: paint any CSS colour into a 1×1 canvas and read it back.
  const probeCanvas = document.createElement('canvas')
  probeCanvas.width = probeCanvas.height = 1
  const probe = probeCanvas.getContext('2d', { willReadFrequently: true })
  // A colour that means the same on every page and in every theme is resolved once: a scroll
  // or a hover asks for the same few again and again, and asking touches the DOM.
  const ABSOLUTE = /^(?:#[0-9a-f]{3,8}|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)|black|white|transparent)$/i
  const resolved = new Map              ()
  const resolveColor = (css        )       => {
    if (!probe) return [1, 1, 1, 1]
    const fixed = ABSOLUTE.test(css) && !/currentcolor/i.test(css)
    const known = fixed ? resolved.get(css) : undefined
    if (known) return [known[0], known[1], known[2], known[3]]
    const span = document.createElement('span')
    span.style.color = css
    // Measured on <body>, never inside a host whose children are observed.
    document.body.appendChild(span)
    const computed = getComputedStyle(span).color
    span.remove()
    probe.clearRect(0, 0, 1, 1)
    probe.fillStyle = computed
    probe.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data
    if (fixed) {
      if (resolved.size > 400) resolved.clear()
      resolved.set(css, [r / 255, g / 255, b / 255, a / 255])
    }
    return [r / 255, g / 255, b / 255, a / 255]
  }

  // Cursor light: shared, fades in on the first mouse move, out when the pointer leaves.
  const pointer = { x: 0, y: 0, active: false, moved: false, mix: 0 }

  // Pointer light (LIGHT). `beam` is the pointer that lights: where it is, what it is over
  // and which pointer is held (`id`, -1 = none).
  // Each lit view keeps its own light: how bright (a spring), where on the glass, and why.
  const beam = { x: 0, y: 0, over: null                      , id: -1 }
              
                
                                                                    
             
             
                  
                
                                                                                                         
                 
                                                                                                   
              
              
              
              
                 
                                                                                                                                            
                                                                 
                                                                          
                   
   
  const lights = new Map                ()
  let relit = false
  const hostOf = (v           ) => v.canvas.parentElement
  /** The pointer is on this glass: inside its body, and on its host (not on something lying over it). */
  const onBlob = (s     ) => !!s.blob && Math.abs(beam.x - (s.sx - s.bodyX + s.blob.x)) <= s.blob.hx && Math.abs(beam.y - (s.sy + s.blob.y)) <= s.blob.hy
  const under = (v           , s     ) => {
    if ((Math.abs(beam.x - s.sx) > s.hx || Math.abs(beam.y - s.sy) > s.hy) && !onBlob(s)) return false
    if (s.free) return true
    const host = hostOf(v)
    return !!host && beam.over instanceof Node && host.contains(beam.over) && !host.matches(':disabled, [data-disabled], [aria-disabled="true"]')
  }
  /** A press belongs to the innermost glass under it: a button on a card lights up, the card does not. */
  const innermost = (v           ) => {
    const host = hostOf(v)
    for (const [other, s] of lights) {
      const inner = hostOf(other)
      if (other !== v && !s.free && other.visible && host && inner && inner !== host && host.contains(inner) && under(other, s)) return false
    }
    return true
  }
  /** Advances a view's light; true while it still changes. */
  const stepLight = (v           , dt        , still         ) => {
    const s = lights.get(v)
    if (!s) return false
    const held = s.press || s.key
    const target = LIGHT.on && held ? LIGHT.press : 0
    if (still) {
      const changed = s.glow.x !== target
      s.glow.x = target
      s.glow.v = 0
      return changed
    }
    return stepSpring(s.glow, target, held ? { omega: (2 * Math.PI) / Math.max(LIGHT.rise, 0.01), zeta: clamp(1 - LIGHT.riseBounce, 0.05, 1) } : { omega: (2 * Math.PI) / Math.max(LIGHT.fade, 0.01), zeta: 1 }, dt)
  }

  // The flash of a press on a button (GLOW): the rule above GLOW, applied. A view that says
  // `button: true` is lit where a press lands on it (or at its centre, by Space / Enter): the
  // light comes up, holds for as long as the press does (`hold` at least) and fades as it
  // spreads. Each button keeps its own: how bright, how far it has spread, where it landed (from
  // the host's centre, px), how long it still holds, how many presses' worth is asked for, how
  // small the glass is (which set of values it takes), its height, and what holds it.
  // A surface keeps one too, for a choice pressed in it (`choice`): the same light with GLOW's
  // `select` values, measured in the choice's own height.
                                                                                                                                                                            
  /** What counts as a choice inside a surface. */
  const CHOICES = ':is([role=option],[role=menuitem],[data-glass-item],[data-glass-pick])'
  const flashes = new Map                  ()
  const flashTune = (small        )              => {
    if (small <= 0) return GLOW
    if (small >= 1) return GLOW_SMALL
    const mixed = { ...GLOW }
    for (const name of Object.keys(mixed)                         ) mixed[name] = lerp(GLOW[name], GLOW_SMALL[name], small)
    return mixed
  }
  /**
   * Light on this glass at this point (viewport px), or at its centre. Presses that land before
   * the last has faded add up. `choice`: the element chosen inside a surface, whose light it is.
   */
  const flash = (v           , x         , y         , choice              ) => {
    const host = hostOf(v)
    if (!host) return null
    let f = flashes.get(v)
    if (!f) flashes.set(v, (f = { glow: { x: 0, v: 0 }, spread: { x: 0, v: 0 }, x: 0, y: 0, hold: 0, level: 0, small: 0, height: 0, by: -1, key: false, choice: false }))
    const r = host.getBoundingClientRect()
    // A light that is still bright keeps spreading from where it is: only a fresh one starts small.
    if (f.glow.x < 0.08) f.spread.x = f.spread.v = 0
    f.x = x === undefined ? 0 : clamp(x - (r.left + r.width / 2), -r.width / 2, r.width / 2)
    f.y = y === undefined ? 0 : clamp(y - (r.top + r.height / 2), -r.height / 2, r.height / 2)
    f.choice = !!choice
    f.height = (choice ?? host).offsetHeight
    // (A surface takes the wide set of values, whatever its own shape.)
    f.small = choice ? 0 : 1 - smooth(2, 2.4, host.offsetWidth / Math.max(f.height, 1))
    const tune = flashTune(f.small)
    f.level = Math.min(Math.max(f.glow.x, 0) + (choice ? tune.select : 1), tune.stack)
    f.hold = tune.hold
    wake()
    return f
  }
  /** Advances a button's flash; true while it still changes. */
  const stepFlash = (v           , dt        , still         ) => {
    const f = flashes.get(v)
    if (!f) return false
    if (still) {
      const changed = f.glow.x !== 0
      f.glow.x = f.glow.v = f.spread.x = f.spread.v = f.hold = 0
      return changed
    }
    const lit = f.by !== -1 || f.key || f.hold > 0
    const holding = f.hold > 0
    f.hold = Math.max(0, f.hold - dt)
    const tune = flashTune(f.small)
    const a = stepSpring(f.glow, lit ? f.level : 0, { omega: lit ? tune.riseSpeed : tune.fadeSpeed, zeta: 1 }, dt)
    const b = stepSpring(f.spread, lit || f.glow.x > 0.004 ? 1 : 0, { omega: tune.spreadSpeed, zeta: 1 }, dt)
    // A press held still changes nothing: the loop rests until the hold runs out or the press ends.
    return holding || a || (b && f.glow.x > 0.004)
  }
  /** The flash as a lens's `glow`, for a lens that brings none of its own. (The canvas is scaled with the host: the light is measured on the page, so it is divided by that scale.) */
  const flashOf = (v           )                    => {
    const f = flashes.get(v)
    if (!f || f.glow.x <= 0.004) return undefined
    const tune = flashTune(f.small)
    const k = Math.max(0.5, v.grow ?? 1)
    const far = clamp(f.spread.x)
    const reach = f.choice ? tune.selectReach + tune.selectSpread * far : tune.reach + tune.spread * far
    return { x: f.x / k, y: f.y / k, r: f.height * reach, amount: Math.max(0, f.glow.x) * tune.amount, blob: 1 }
  }

  // Pull (PULL): glass a held pointer drags after itself, where the view asks for it (buttons).
  // One pointer holds one glass, the innermost under the press. The engine moves its host (CSS `translate`) and stretches it (CSS
  // `scale`, times the view's own `grow`), and lets go when the pointer does.
                 
                                                                       
             
             
                                                                                                     
                                                                                                                                                   
                                                                                        
                  
                  
                                                                                     
                        
                                                  
                 
                  
   
  const pulls = new Map                   ()
  const pulledOf = (v           ) => {
    let p = pulls.get(v)
    if (!p) pulls.set(v, (p = { x: { x: 0, v: 0 }, y: { x: 0, v: 0 }, by: null, driftX: 0, driftY: 0, own: null, moved: '', scaled: '' }))
    return p
  }
  /** The centre of the glass on screen where it rests, without the pull. */
  const restOf = (host             , p        ) => {
    const r = host.getBoundingClientRect()
    return { x: r.left + r.width / 2 - p.x.x, y: r.top + r.height / 2 - p.y.x }
  }
  const letGo = (v           , p        ) => {
    p.by = null
    v.held = false
  }
  /** Advances a view's pull and writes its host's `translate` and `scale`; true while it still moves. */
  const stepPull = (v           , dt        , still         ) => {
    const p = pulls.get(v)
    if (!p && v.grow === undefined) return false
    const host = hostOf(v)
    if (!host) return false
    const s = p ?? pulledOf(v)
    if (s.by && (v.pull !== true || !PULL.on)) letGo(v, s)
    let sx = 1
    let sy = 1
    let moving = false
    if (still) {
      s.x.x = s.x.v = s.y.x = s.y.v = s.driftX = s.driftY = 0
    } else if (s.by || s.x.x !== 0 || s.y.x !== 0 || s.x.v !== 0 || s.y.v !== 0 || s.driftX !== 0 || s.driftY !== 0) {
      const w = Math.max(host.offsetWidth, 1)
      const h = Math.max(host.offsetHeight, 1)
      const size = Math.max(w, h)
      const small = size <= PULL.smallUntil
      let tx = 0
      let ty = 0
      const by = s.by
      if (by) {
        const at = restOf(host, s)
        // Small glass: how far the pointer has gone since the press. Larger: how far past the edge it is.
        const dx = small ? by.nowX - by.x - (at.x - by.cx) : by.nowX - clamp(by.nowX, at.x - w / 2, at.x + w / 2)
        const dy = small ? by.nowY - by.y - (at.y - by.cy) : by.nowY - clamp(by.nowY, at.y - h / 2, at.y + h / 2)
        const limit = small ? PULL.smallReach + PULL.smallReachPerPx * size : Math.min(PULL.reachMax, PULL.reach + PULL.reachPerPx * size)
        tx = rubberBand(dx, limit, PULL.resistance)
        ty = rubberBand(dy, limit, PULL.resistance)
        if (dt > 0) {
          s.driftX += ((at.x - by.lastX) / dt - s.driftX) * Math.min(1, dt * PULL.driftIn)
          s.driftY += ((at.y - by.lastY) / dt - s.driftY) * Math.min(1, dt * PULL.driftIn)
        }
        by.lastX = at.x
        by.lastY = at.y
      } else {
        s.driftX = Math.abs(s.driftX) < 1 ? 0 : s.driftX * Math.exp(-dt * PULL.driftOut)
        s.driftY = Math.abs(s.driftY) < 1 ? 0 : s.driftY * Math.exp(-dt * PULL.driftOut)
      }
      const spring = by ? { omega: (2 * Math.PI) / (PULL.follow + PULL.followPerPx * by.size), zeta: 1 } : { omega: (2 * Math.PI) / PULL.release, zeta: 1 - PULL.releaseBounce }
      const mx = stepSpring(s.x, tx, spring, dt)
      const my = stepSpring(s.y, ty, spring, dt)
      const most = small ? PULL.smallStretchMax : PULL.stretchMax
      const along = (pull        , length        , drift        ) =>
        Math.min(most, (PULL.stretch * Math.abs(pull.x)) / length + PULL.stretchPerSpeed * Math.abs(pull.v) + PULL.stretchPerDrift * Math.abs(drift))
      const kx = along(s.x, w, s.driftX)
      const ky = along(s.y, h, s.driftY)
      sx = (1 + kx) / Math.sqrt(1 + ky)
      sy = (1 + ky) / Math.sqrt(1 + kx)
      moving = !!by || mx || my || s.driftX !== 0 || s.driftY !== 0
    }
    const on = Math.abs(s.x.x) > 0.01 || Math.abs(s.y.x) > 0.01
    const px = `${s.x.x.toFixed(3)}px`
    const py = `${s.y.x.toFixed(3)}px`
    const moved = !on ? '' : s.own ? `calc(${s.own[0]} + ${px}) calc(${s.own[1] ?? '0px'} + ${py})` : `${px} ${py}`
    const grow = v.grow ?? 1
    const even = Math.abs(sx - 1) < 1e-4 && Math.abs(sy - 1) < 1e-4
    const scaled = even ? (grow === 1 ? '' : grow.toFixed(4)) : `${(grow * sx).toFixed(5)} ${(grow * sy).toFixed(5)}`
    // The frame that brings the host to rest is still drawn: a view that draws the pull itself (see `pulled`) must see it end.
    if (moved !== s.moved || scaled !== s.scaled) moving = true
    if (moved !== s.moved) host.style.translate = s.moved = moved
    if (scaled !== s.scaled) host.style.scale = s.scaled = scaled
    const at = v.pulled ?? (v.pulled = { x: 0, y: 0, sx: 1, sy: 1 })
    at.x = on ? s.x.x : 0
    at.y = on ? s.y.x : 0
    at.sx = even ? 1 : sx
    at.sy = even ? 1 : sy
    return moving
  }

  const draw = (v           , refresh         , repaint         ) => {
    const m = v.lens(refresh)
    let on = shown.get(v)
    if (!on) shown.set(v, (on = { sent: [], box: '' }))
    if (!m || m.width < 2 || m.height < 2) {
      v.ctx.clearRect(0, 0, v.canvas.width, v.canvas.height)
      on.sent.length = 0
      return
    }
    // The canvas's box is written only when it changes.
    const box = `${m.left}|${m.top}|${m.width}|${m.height}`
    if (box !== on.box) {
      on.box = box
      const st = v.canvas.style
      st.left = `${m.left}px`
      st.top = `${m.top}px`
      st.width = `${m.width}px`
      st.height = `${m.height}px`
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const devW = Math.max(2, Math.round(m.width * dpr))
    const devH = Math.max(2, Math.round(m.height * dpr))
    if (v.canvas.width !== devW || v.canvas.height !== devH) {
      v.canvas.width = devW
      v.canvas.height = devH
      on.sent.length = 0
    }
    // The shared GL canvas only grows; each view is drawn into its bottom-left corner.
    if (glCanvas.width < devW || glCanvas.height < devH) {
      glCanvas.width = Math.max(glCanvas.width, devW)
      glCanvas.height = Math.max(glCanvas.height, devH)
    }
    gl.viewport(0, 0, devW, devH)

    const unit = m.unit
    const r = m.refraction
    /** The layers are the ones this view was last drawn with. */
    let fresh = true
    if (r) {
      let p = painted.get(v)
      if (!p) painted.set(v, (p = { back: texture(true), front: texture(false), w: 0, h: 0, at: 0 }))
      const now = performance.now()
      const sized = p.w === devW && p.h === devH
      // A painter that takes only `back` has no front layer: none is cleared or uploaded.
      const fronted = r.paint.length > 1
      fresh = !repaint && sized && now - p.at < REPAINT_EVERY
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, p.back)
      if (!fresh) {
        for (const l of fronted ? [back, front] : [back]) {
          if (l.canvas.width !== devW || l.canvas.height !== devH) {
            l.canvas.width = devW
            l.canvas.height = devH
          }
          l.ctx .setTransform(1, 0, 0, 1, 0, 0)
          l.ctx .clearRect(0, 0, devW, devH)
          l.ctx .setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        // A painter that says nothing changed keeps the textures it already has.
        fresh = r.paint(back.ctx , front.ctx ) === false && sized
      }
      if (!fresh) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, back.canvas)
        gl.generateMipmap(gl.TEXTURE_2D)
      }
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, fronted ? p.front : blank.front)
      if (!fresh) {
        if (fronted) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, front.canvas)
        p.w = devW
        p.h = devH
        p.at = now
      }
    } else {
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, blank.back)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, blank.front)
    }
    sent.length = 0
    // The surroundings, for the reflection. The picture is taken when it is first needed, and
    // again when sizes and colours are re-read or the canvas changes size, AROUND_EVERY apart at
    // most (a change that comes sooner waits its turn). A scroll takes none: what surrounds the
    // glass rides along. Until then the picture stays where it was taken, even if the canvas has
    // moved since.
    // Only clear glass mirrors: in full while its own colour covers it no more than a clear
    // button's tint does (0.6), less as the cover grows, and not at all once the glass is its
    // own colour (tinted glass, a lens frosted over at rest, a control painted in its fill).
    // Unlit glass mirrors nothing either. Glass that mirrors nothing takes no picture.
    const clear = r ? clamp((1 - r.frost) / 0.4) : 0
    const mirror = m.strength * Math.max(0, m.tune?.mirror ?? 1) * clear
    const f = mirror > 0 ? m.reflection : undefined
    if (refresh && m.reflection && !f) {
      const idle = mirrored.get(v)
      if (idle) idle.due = true
    }
    gl.activeTexture(gl.TEXTURE2)
    if (f) {
      let a = mirrored.get(v)
      if (!a) mirrored.set(v, (a = { tex: texture(true), w: 0, h: 0, at: 0, left: 0, top: 0, reach: 0, due: true, timer: 0 }))
      const taken = a
      const reach = clamp(f.height * MIRROR.reach, MIRROR.reachMin, Math.max(MIRROR.reachMin, MIRROR.reachMax))
      const aw = Math.max(2, Math.ceil((m.width + 2 * reach) * AROUND_SCALE))
      const ah = Math.max(2, Math.ceil((m.height + 2 * reach) * AROUND_SCALE))
      const now = performance.now()
      gl.bindTexture(gl.TEXTURE_2D, a.tex)
      if (refresh || (f.live && repaint) || a.w !== aw || a.h !== ah || a.reach !== reach) a.due = true
      if (a.due && a.w && now - a.at < AROUND_EVERY) {
        if (!a.timer)
          a.timer = window.setTimeout(
            () => {
              taken.timer = 0
              if (mirrored.get(v) !== taken) return
              v.repaint = true
              wake()
            },
            AROUND_EVERY - (now - a.at),
          )
      } else if (a.due) {
        a.due = false
        if (around.canvas.width !== aw || around.canvas.height !== ah) {
          around.canvas.width = aw
          around.canvas.height = ah
        }
        const c = around.ctx 
        c.setTransform(1, 0, 0, 1, 0, 0)
        c.clearRect(0, 0, aw, ah)
        c.setTransform(AROUND_SCALE, 0, 0, AROUND_SCALE, reach * AROUND_SCALE, reach * AROUND_SCALE)
        f.paint(c, reach)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, around.canvas)
        gl.generateMipmap(gl.TEXTURE_2D)
        a.w = aw
        a.h = ah
        a.at = now
        a.left = m.left
        a.top = m.top
        a.reach = reach
        fresh = false
      }
      set('uAroundBox', (a.left - m.left - a.reach) / unit, (a.top - m.top - a.reach) / unit, a.w / AROUND_SCALE / unit, a.h / AROUND_SCALE / unit)
      set('uAroundScale', AROUND_SCALE * unit)
      set('uReach', reach / unit)
    } else {
      gl.bindTexture(gl.TEXTURE_2D, blank.back)
      set('uAroundBox', 0, 0, 1, 1)
      set('uAroundScale', 1)
      set('uReach', 0)
    }
    set('uTextured', r ? 1 : 0)
    set('uRefract', r?.refract ?? 0)
    set('uMag', r?.magnify ?? 0)
    set('uDisp', r?.dispersion ?? 0)
    set('uBlurCenter', r?.blurCenter ?? 0)
    set('uBlurEdge', r?.blurEdge ?? 0)
    // Blur level follows screen density (reference: 2.27 device px per design unit).
    set('uBlurShift', Math.log2(Math.max((unit * dpr) / 2.27, 1e-3)))
    set('uFrost', r?.frost ?? 0)
    set('uFrostBlur', Math.max(0, r?.blur ?? 0) / unit)
    set('uFrostMix', clamp(r?.blurMix ?? 1))
    // Radial bend: a share of the viewport per axis, as the SVG card's map was.
    const radial = Math.max(0, r?.radial ?? 0)
    set('uRadial', (radial * window.innerWidth) / unit, (radial * window.innerHeight) / unit)
    set('uCssPx', 1 / unit)
    set('uSize', devW, devH)
    set('uUnit', unit * dpr)
    set('uDevicePx', 1 / (unit * dpr))
    set('uCenter', m.cx / unit, m.cy / unit)
    set('uHalf', Math.max(m.hx / unit, 0.5), Math.max(m.hy / unit, 0.5))
    const radius = Math.max(0, Math.min(m.radius, m.hx - 0.5, m.hy - 0.5) / unit)
    set('uRadius', radius)
    const band = r ? (m.band ?? 0) : 0
    set('uBand', band)
    set('uFieldRadius', Math.min(Math.max(radius, band), Math.max(0, (Math.min(m.hx, m.hy) - 0.5) / unit)))
    set('uBodyX', m.bodyX / unit)
    set('uDrop', (m.droplet?.x ?? 0) / unit, (m.droplet?.r ?? 0) / unit, (m.droplet?.k ?? 0) / unit)
    const blob = m.blob
    set('uBlob', (blob?.x ?? 0) / unit, (blob?.y ?? 0) / unit, (blob?.hx ?? 0) / unit, (blob?.hy ?? 0) / unit)
    set('uBlobShape', (blob?.r ?? 0) / unit, (blob?.k ?? 0) / unit)
    set('uBlobNeck', (blob?.neck?.x ?? 0) / unit, (blob?.neck?.w ?? 0) / unit)
    set('uBlobFade', blob?.fade?.amount ?? 0, blob?.fade?.reach ?? 0.5)
    const mat = blob?.material
    set('uBlobMat', clamp(mat?.frost ?? 0), Math.max(0, mat?.blur ?? 0) / unit, Math.max(0.05, mat?.bendCurve ?? 1.6), 0.35 * Math.max(0.05, mat?.bendDepth ?? 1))
    set('uBlobLine', Math.max(0, mat?.borderWidth ?? 0) / unit, clamp(mat?.borderAlpha ?? 0), mat ? 1 : 0)
    set('uBevel', Math.max(m.bevel, 2))
    const k = m.tune ?? {}
    set('uRim', 0.55 * m.strength * (k.rim ?? 1))
    set('uCaustic', 0.08 * m.strength * (k.caustic ?? 1))
    set('uInner', 0.1 * m.strength * (k.inner ?? 1))
    set('uTopRefl', 0.3 * m.strength * (k.reflection ?? 1))
    set('uTopBase', 0.02 * m.strength * (k.reflection ?? 1))
    set('uRimWidth', Math.max(0.05, k.rimWidth ?? 1))
    set('uFresnel', 0.02 * (k.fresnel ?? 1))
    // The band is as deep as a share of the glass's shorter half, and of its reach on glass taller than that.
    const reached = m.reflection ? clamp(m.reflection.height * MIRROR.reach, MIRROR.reachMin, Math.max(MIRROR.reachMin, MIRROR.reachMax)) : 0
    const deep = (Math.max(0.01, MIRROR.depth) * Math.max(1, Math.min(m.hx, m.hy, reached || Infinity))) / unit
    set('uMirror', clamp(MIRROR.line) * mirror, MIRROR.band * mirror, deep, clamp(MIRROR.dim))
    set('uSoft', (Math.max(0, MIRROR.soft) * reached) / unit)
    const shares = Math.max(MIRROR.near + MIRROR.mid + MIRROR.far, 1e-3)
    set('uSeen', MIRROR.near / shares, MIRROR.mid / shares, MIRROR.far / shares, Math.max(0, MIRROR.gain))
    // The far side of the rim light takes the surroundings' colour on clear glass only.
    set('uBounce', Math.max(0, MIRROR.bounce), clamp(MIRROR.tint) * clear)
    set('uFall', Math.max(0.05, MIRROR.fall))
    set('uBendCurve', Math.max(0.05, k.bendCurve ?? 1.6))
    set('uEdgeBand', 0.35 * Math.max(0.05, k.bendDepth ?? 1))
    set('uSaturation', Math.max(0, k.saturation ?? 1))
    set('uFrostEdge', Math.max(0.05, k.frostEdge ?? 1))
    set('uShadow', m.shadow * m.strength)
    set('uShadowSoft', m.shadowSoftness)
    set('uShadowOffset', m.shadowOffset)
    set('uSurface', ...m.surface)
    set('uColor', ...m.color)
    set('uEdgeClear', m.edgeClear)
    set('uBorder', ...(m.border ?? m.color))
    set('uBorderWidth', m.border ? Math.max(0, m.borderWidth ?? 1) / unit : 0)
    set('uBorderAlpha', clamp(m.borderAlpha ?? 1))
    const dx = pointer.x - m.screenX
    const dy = pointer.y - m.screenY
    const d = Math.hypot(dx, dy)
    // The light turns in half-degree steps (one step is less than a level of rim light on an
    // 8-bit screen), and stays put while it is off: a cursor moving far away, or over glass
    // without cursor light, leaves the frame as it is.
    const lightMix = m.cursorLight ? pointer.mix : 0
    const aim = lightMix > 0 && d > 0.5 ? (Math.round(Math.atan2(dy, dx) * (360 / Math.PI)) * Math.PI) / 360 : -Math.PI / 2
    set('uLightDir', Math.cos(aim), Math.sin(aim))
    set('uLightMix', lightMix)
    const glow = m.glow ?? flashOf(v)
    set('uGlow', (glow?.x ?? 0) / unit, (glow?.y ?? 0) / unit, (glow?.r ?? 0) / unit, Math.max(0, glow?.amount ?? 0))
    set('uGlowHalo', glow?.halo ? (glow.halo.around === 'blob' && blob ? 2 : 1) : 0, clamp(glow?.halo?.amount ?? 0))
    set('uGlowBlob', clamp(glow?.blob ?? 1))
    // Pointer light: what the pointer is doing to this glass is worked out here, where the
    // glass's place on screen is fresh; the light itself is advanced once a frame (stepLight).
    let lit = lights.get(v)
    // A glass that continues another takes that one's light (see `lightOf`), measured from here.
    const shared = m.lightOf && m.lightOf !== v ? lights.get(m.lightOf) : undefined
    if (shared) {
      lit = { ...shared, x: shared.x + shared.sx - shared.bodyX - m.screenX, y: shared.y + shared.sy - m.screenY }
    } else if (LIGHT.on && m.pointerLight !== false) {
      if (!lit) {
        const host = hostOf(v)
        lit = { glow: { x: 0, v: 0 }, x: 0, y: 0, press: false, key: false, free: !!host && getComputedStyle(host).pointerEvents === 'none', sx: 0, sy: 0, hx: 0, hy: 0, bodyX: 0, blob: null, onBlob: false }
        lights.set(v, lit)
      }
      lit.sx = m.screenX + m.bodyX
      lit.sy = m.screenY
      lit.hx = m.hx
      lit.hy = m.hy
      lit.bodyX = m.bodyX
      lit.blob = blob ? { x: blob.x, y: blob.y, hx: blob.hx, hy: blob.hy } : null
      // A held pointer lights the glass it is on, or comes onto (a lens arriving under it), until it lets go.
      // The light stays at the point of the glass it began at: it does not follow the pointer.
      const press = lit.press || (beam.id !== -1 && under(v, lit) && innermost(v))
      if (press !== lit.press) {
        relit = true
        if (press) {
          lit.x = beam.x - m.screenX
          lit.y = beam.y - m.screenY
          lit.onBlob = onBlob(lit) && (Math.abs(beam.x - lit.sx) > lit.hx || Math.abs(beam.y - lit.sy) > lit.hy)
        }
      }
      lit.press = press
    }
    const shine = lit && LIGHT.on && m.pointerLight !== false ? clamp(lit.glow.x) : 0
    if (lit && shine > 0) {
      const pageL = 0.2126 * m.surface[0] + 0.7152 * m.surface[1] + 0.0722 * m.surface[2]
      // (A press on a surface beside the control takes the surface's size, not the control's.)
      const side = lit.onBlob && lit.blob ? Math.max(lit.blob.hx, lit.blob.hy) : Math.max(m.hx, m.hy)
      const span = clamp(LIGHT.size * 2 * side, LIGHT.sizeMin, Math.max(LIGHT.sizeMin, LIGHT.sizeMax))
      set('uLight', lit.x / unit, lit.y / unit, span / unit, shine * clamp(lerp(LIGHT.strengthDark, LIGHT.strength, smooth(0.25, 0.6, pageL))))
    } else {
      set('uLight', 0, 0, 1, 0)
    }
    // The same layers and the same uniforms as the frame on the canvas: nothing to draw.
    if (fresh && on.sent.length === sent.length && sent.every((value, i) => value === on.sent[i])) return
    on.sent = sent.slice()
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    v.ctx.clearRect(0, 0, devW, devH)
    v.ctx.drawImage(glCanvas, 0, glCanvas.height - devH, devW, devH, 0, 0, devW, devH)
    v.drawn?.()
  }

  let raf = 0
  let last = 0
  const frame = (now        ) => {
    raf = 0
    if (dead) return
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60
    last = now
    const still = reduced.matches
    const target = pointer.active && !still ? 1 : 0
    const before = pointer.mix
    pointer.mix += (target - pointer.mix) * Math.min(1, dt * 6)
    if (Math.abs(pointer.mix - target) < 0.002) pointer.mix = target
    const relight = pointer.moved || pointer.mix !== before
    pointer.moved = false
    let running = pointer.mix !== target
    for (const v of views) {
      const stepped = v.step(dt, still)
      // After the view's own springs: its `grow` is this frame's.
      const pulled = stepPull(v, dt, still)
      const moving = stepped || pulled
      // (Both lights of a press: what a surface takes, and a button's flash.)
      const lit = stepLight(v, dt, still)
      const flashing = stepFlash(v, dt, still)
      const glowing = lit || flashing
      if (moving || glowing) running = true
      if (!v.visible) continue
      const again = v.repaint === true
      if (moving || glowing || v.dirty || again || relight) {
        const refresh = v.dirty
        v.dirty = false
        v.repaint = false
        // Only the light moved: the layers are as they were, so they are not painted again.
        draw(v, refresh, moving || refresh || again)
      }
    }
    // A view may have woken the engine during this frame (a popup that has just gone back in
    // does): the next frame is then already asked for, and asking again would start a second
    // loop beside this one, for as long as anything on the page moves.
    // A draw found the pointer on (or off) some glass: its light starts on the next frame.
    if (relit) running = true
    relit = false
    if (running) wake()
    else if (!raf) last = 0
  }
  const wake = () => {
    if (!raf && !dead) raf = requestAnimationFrame(frame)
  }
  const invalidateAll = () => {
    for (const v of views) v.dirty = true
    wake()
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.active = true
      pointer.moved = true
      wake()
    },
    { passive: true },
  )
  document.documentElement.addEventListener('pointerleave', () => {
    pointer.active = false
    pointer.moved = true
    wake()
  })
  // Pull (PULL): a press holds the innermost glass under it that asks to be pulled, and it is
  // followed over the whole window until it lets go.
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (!PULL.on || e.button !== 0 || reduced.matches || !(e.target instanceof Node) || HANDED_ON.has(e)) return
      let held                   = null
      let heldHost                     = null
      for (const v of views) {
        const host = hostOf(v)
        if (v.pull !== true || !host || !host.contains(e.target) || host.matches(':disabled, [data-disabled], [aria-disabled="true"]')) continue
        if (pulls.get(v)?.by) return
        if (!heldHost || heldHost.contains(host)) {
          held = v
          heldHost = host
        }
      }
      if (!held || !heldHost) return
      const p = pulledOf(held)
      // The host's own translate is read while the pull's is off it.
      if (!p.moved) {
        const own = getComputedStyle(heldHost).translate
        p.own = !own || own === 'none' ? null : own.split(' ')
      }
      const at = restOf(heldHost, p)
      p.by = { id: e.pointerId, x: e.clientX, y: e.clientY, nowX: e.clientX, nowY: e.clientY, cx: at.x, cy: at.y, lastX: at.x, lastY: at.y, size: Math.max(heldHost.offsetWidth, heldHost.offsetHeight) }
      p.driftX = p.driftY = 0
      held.held = true
      wake()
    },
    { passive: true, capture: true },
  )
  window.addEventListener(
    'pointermove',
    (e) => {
      for (const p of pulls.values()) {
        if (p.by?.id !== e.pointerId) continue
        p.by.nowX = e.clientX
        p.by.nowY = e.clientY
        wake()
      }
    },
    { passive: true, capture: true },
  )
  const unhold = (e              ) => {
    for (const [v, p] of pulls) {
      if (p.by?.id !== e.pointerId) continue
      letGo(v, p)
      wake()
    }
  }
  window.addEventListener('pointerup', unhold, { passive: true, capture: true })
  window.addEventListener('pointercancel', unhold, { passive: true, capture: true })
  // Pointer light (LIGHT): where the lighting pointer is, what it is over and whether it is held.
  // Which glass that lights is decided when each glass is drawn, so every change asks for a frame.
  const lightMoved = () => {
    pointer.moved = true
    wake()
  }
  window.addEventListener(
    'pointermove',
    (e) => {
      // Only the held pointer counts (a lens may come under it): one that moves over the page without pressing asks for nothing.
      if (!LIGHT.on || e.pointerId !== beam.id) return
      beam.x = e.clientX
      beam.y = e.clientY
      beam.over = e.target
      lightMoved()
    },
    { passive: true, capture: true },
  )
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (!LIGHT.on || e.button !== 0 || HANDED_ON.has(e)) return
      beam.x = e.clientX
      beam.y = e.clientY
      beam.over = e.target
      beam.id = e.pointerId
      lightMoved()
    },
    { passive: true, capture: true },
  )
  const lift = (e              ) => {
    if (e.pointerId !== beam.id) return
    beam.id = -1
    for (const s of lights.values()) s.press = false
    lightMoved()
  }
  window.addEventListener('pointerup', lift, { passive: true, capture: true })
  window.addEventListener('pointercancel', lift, { passive: true, capture: true })
  // A button's flash (GLOW): a press lights the innermost button under it where it lands, and
  // holds it until that pointer lets go; Space or Enter lights the focused button's centre.
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (e.button !== 0 || HANDED_ON.has(e) || !(e.target instanceof Node)) return
      // A choice pressed inside a surface lights that surface around it.
      const choice = e.target instanceof Element ? e.target.closest             (CHOICES) : null
      const chosen = choice && !choice.matches('[data-disabled], [aria-disabled="true"]') ? choice : null
      let hit                   = null
      let hitHost                     = null
      for (const v of views) {
        const host = hostOf(v)
        if (!host || host.matches(':disabled, [data-disabled], [aria-disabled="true"]')) continue
        if (v.button === true ? !(v.pressArea ?? host).contains(e.target) : !chosen || v.choices === false || !v.visible || !host.contains(chosen)) continue
        if (!hitHost || hitHost.contains(host)) {
          hit = v
          hitHost = host
        }
      }
      const f = hit && flash(hit, e.clientX, e.clientY, hit.button === true ? undefined : (chosen ?? undefined))
      if (f) f.by = e.pointerId
    },
    { passive: true, capture: true },
  )
  const unflash = (e              ) => {
    for (const f of flashes.values()) {
      if (f.by !== e.pointerId) continue
      f.by = -1
      wake()
    }
  }
  window.addEventListener('pointerup', unflash, { passive: true, capture: true })
  window.addEventListener('pointercancel', unflash, { passive: true, capture: true })
  const flashKey = (e               ) => {
    if (e.key !== ' ' && e.key !== 'Enter') return
    const down = e.type === 'keydown'
    if (down && e.repeat) return
    if (!down) {
      for (const f of flashes.values()) f.key = false
      return wake()
    }
    const focused = document.activeElement
    if (!focused) return
    // On a surface, the key chooses the focused choice: the light starts at its middle.
    const choice = focused.closest             (CHOICES)
    const chosen = choice && !choice.matches('[data-disabled], [aria-disabled="true"]') ? choice : null
    let surface                   = null
    let surfaceHost                     = null
    for (const v of views) {
      const host = hostOf(v)
      if (!host || host.matches(':disabled, [data-disabled], [aria-disabled="true"]')) continue
      if (v.button === true) {
        if (!focused.contains(v.canvas)) continue
        const f = flash(v)
        if (f) f.key = true
      } else if (chosen && v.choices !== false && v.visible && host.contains(chosen) && (!surfaceHost || surfaceHost.contains(host))) {
        surface = v
        surfaceHost = host
      }
    }
    if (surface && chosen) {
      const r = chosen.getBoundingClientRect()
      const f = flash(surface, r.left + r.width / 2, r.top + r.height / 2, chosen)
      if (f) f.key = true
    }
    wake()
  }
  window.addEventListener('keydown', flashKey, true)
  window.addEventListener('keyup', flashKey, true)
  window.addEventListener(
    'focusout',
    () => {
      for (const f of flashes.values()) f.key = false
      wake()
    },
    true,
  )
  // Space or Enter on the focused control lights the middle of its glass while the key is down.
  const key = (e               ) => {
    if (e.key !== ' ' && e.key !== 'Enter') return
    const down = e.type === 'keydown'
    if (down && (!LIGHT.on || e.repeat)) return
    const focused = document.activeElement
    for (const [v, s] of lights) {
      const held = down && !s.free && !!focused && focused.contains(v.canvas)
      if (held && !s.key && !s.press) {
        s.x = s.bodyX
        s.y = 0
      }
      s.key = held
    }
    wake()
  }
  window.addEventListener('keydown', key, true)
  window.addEventListener('keyup', key, true)
  window.addEventListener(
    'focusout',
    () => {
      for (const s of lights.values()) s.key = false
      wake()
    },
    true,
  )
  // Theme switches (class="dark", data-theme, color-scheme) re-read every colour.
  new MutationObserver(invalidateAll).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme', 'style'],
  })
  new MutationObserver(invalidateAll).observe(document.body, { attributes: true, attributeFilter: ['data-theme'], subtree: true })
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', invalidateAll)
  // A radial bend scales with the viewport.
  window.addEventListener('resize', invalidateAll, { passive: true })
  glCanvas.addEventListener('webglcontextlost', () => {
    dead = true
    for (const v of views) {
      v.lost()
      v.ctx.clearRect(0, 0, v.canvas.width, v.canvas.height)
    }
    // No frame comes after this: the hosts get back what the engine wrote on them.
    for (const [v, p] of pulls) {
      const host = hostOf(v)
      v.held = false
      if (host && p.moved) host.style.translate = ''
      if (host && p.scaled) host.style.scale = ''
    }
    pulls.clear()
    engine = undefined
  })

  return {
    add: (v) => {
      views.add(v)
      wake()
    },
    remove: (v) => {
      views.delete(v)
      lights.delete(v)
      flashes.delete(v)
      const pulled = pulls.get(v)
      if (pulled) {
        pulls.delete(v)
        v.held = false
        const host = hostOf(v)
        if (host && pulled.moved) host.style.translate = ''
        if (host && pulled.scaled) host.style.scale = ''
      }
      const a = mirrored.get(v)
      if (a) {
        mirrored.delete(v)
        clearTimeout(a.timer)
        gl.deleteTexture(a.tex)
      }
      const p = painted.get(v)
      if (!p) return
      painted.delete(v)
      gl.deleteTexture(p.back)
      gl.deleteTexture(p.front)
    },
    wake,
    resolveColor,
  }
}

let engine                                

/** The shared engine (created on first use, client only). `null` = no WebGL2: use the CSS look. */
function getGlassEngine()                     {
  if (typeof window === 'undefined') return null
  if (engine === undefined) engine = createEngine()
  return engine
}

return { stepSpring, GLOW, MIRROR, GLOW_SMALL, MORPH_GLOW, MORPH_GLOW_SMALL, LIGHT, SPRINGS, PULL, HANDED_ON, rubberBand, GOOEY, MORPH, MENU, lerp, clamp, smooth, mixRgb, rgbCss, surfaceColorOf, DESIGN_HEIGHT, getGlassEngine }
})()
const { stepSpring, GLOW, MIRROR, GLOW_SMALL, MORPH_GLOW, MORPH_GLOW_SMALL, LIGHT, SPRINGS, PULL, HANDED_ON, rubberBand, GOOEY, MORPH, MENU, lerp, clamp, smooth, mixRgb, rgbCss, surfaceColorOf, DESIGN_HEIGHT, getGlassEngine } = __engine

// ===== dom-snapshot.ts =====================================================
const __snapshot = (function () {
// dom-snapshot — paints a DOM subtree into a Canvas2D context at its on-screen position.
//
// A WebGL lens cannot read the page's pixels, so glass that bends the page needs the
// page as a texture. This paints a good-enough picture of it: backgrounds (colours,
// gradients and images, with their size, position and repeat), rounded borders, text,
// inline SVG icons, canvases, images and video (with object-fit) and backdrop blur.
// Siblings are painted in CSS order: negative z-index, content, positioned, positive z-index.
// It is not a browser renderer: no shadows, conic gradients, masks, rotation or
// ::before/::after. An image from another origin is requested again with CORS; if its
// server does not allow that it is left out, because a canvas such an image has touched
// can never become a WebGL texture. Used by `material="clear"` glass, by GlassBadge and,
// through `drawAround`, for what every rim mirrors of the page around it.
//
// COPY THIS FILE VERBATIM. MIT — https://github.com/bilalgursen/liquid-glass

                                                         
                                                                       

const isVisibleColor = (color        ) =>
  !!color && color !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(color) && !/\/\s*0\)$/.test(color)

/** Splits on a separator that is not inside parentheses: "a(1, 2), b" → ["a(1, 2)", "b"]. */
function splitTop(text        , separator        ) {
  const parts           = []
  let depth = 0
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === separator && depth === 0) {
      parts.push(text.slice(start, i))
      start = i + 1
    }
  }
  parts.push(text.slice(start))
  return parts.map((part) => part.trim()).filter(Boolean)
}

/** "40%" or "12px" of a span. */
const lengthOf = (token        , span        ) => (token.endsWith('%') ? (span * parseFloat(token)) / 100 : parseFloat(token) || 0)

/** One axis of a CSS position ("25%", "12px", "right", "calc(100% - 8px)") inside `free` px of room. */
function along(token                    , free        ) {
  if (!token) return free / 2
  const calc = /^calc\(([-\d.]+)% ([+-]) ([\d.]+)px\)$/.exec(token)
  if (calc) return (free * Number(calc[1])) / 100 + (calc[2] === '-' ? -1 : 1) * Number(calc[3])
  if (/^-?[\d.]/.test(token)) return lengthOf(token, free)
  return token === 'left' || token === 'top' ? 0 : token === 'right' || token === 'bottom' ? free : free / 2
}

/** `background-position`, `object-position` and a gradient's `at …` as an offset into the free room. */
function placeOf(position        , freeX        , freeY        )                   {
  let [a, b, c, d] = splitTop(position, ' ')
  // "right 10px bottom 20px": offsets measured from the named edges.
  if (d) return [a === 'right' ? freeX - along(b, freeX) : along(b, freeX), c === 'bottom' ? freeY - along(d, freeY) : along(d, freeY)]
  if (a === 'top' || a === 'bottom' || b === 'left' || b === 'right') [a, b] = [b, a]
  return [along(a, freeX), along(b, freeY)]
}

// ── Sources: loading, and keeping the canvas readable ────────────────────────

const verdicts = new WeakMap                                        ()

/**
 * Is this source safe to draw? One image without CORS (or an SVG, in some browsers)
 * taints the whole canvas and WebGL can then no longer read it, so each source is
 * tried once on a 1×1 canvas first. `key` is whatever makes it a different picture.
 */
function isClean(source          , key = '') {
  const known = verdicts.get(source)
  if (known && known.key === key) return known.ok
  let ok = false
  try {
    const probe = document.createElement('canvas')
    probe.width = probe.height = 1
    const ctx = probe.getContext('2d', { willReadFrequently: true })
    if (ctx) {
      ctx.drawImage(source, 0, 0, 1, 1)
      ctx.getImageData(0, 0, 1, 1)
      ok = true
    }
  } catch {
    // SecurityError: another origin without CORS. InvalidStateError: a broken image.
  }
  verdicts.set(source, { key, ok })
  return ok
}

const waiting = new WeakMap                                   ()

/** True once the image can be drawn. Until then `onStale` is called when it arrives. */
function isLoaded(image                  , onStale             ) {
  if (image.complete) return image.naturalWidth > 0
  if (!onStale) return false
  let callbacks = waiting.get(image)
  if (!callbacks) {
    const pending = (callbacks = new Set())
    waiting.set(image, pending)
    image.addEventListener(
      'load',
      () => {
        waiting.delete(image)
        pending.forEach((notify) => notify())
      },
      { once: true },
    )
  }
  callbacks.add(onStale)
  return false
}

const isSameOrigin = (src        ) => {
  try {
    const url = new URL(src, location.href)
    return url.protocol === 'data:' || url.protocol === 'blob:' || url.origin === location.origin
  } catch {
    return false
  }
}

const copies = new Map                          ()

/** Our own copy of an image by URL: a CSS background, or an <img> the page loaded without CORS. */
function imageCopy(src        ) {
  let image = copies.get(src)
  if (!image) {
    if (copies.size > 200) copies.clear()
    image = new Image()
    if (!isSameOrigin(src)) image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.src = src
    copies.set(src, image)
  }
  return image
}

/** Draws an image or a video frame into its box the way `object-fit` and `object-position` place it. */
function drawFitted(ctx                          , source          , sw        , sh        , box     , radius        , style                     ) {
  const fit = style.objectFit
  let w = box.w
  let h = box.h
  if (fit !== 'fill') {
    const contain = Math.min(box.w / sw, box.h / sh)
    const k = fit === 'cover' ? Math.max(box.w / sw, box.h / sh) : fit === 'none' ? 1 : fit === 'scale-down' ? Math.min(1, contain) : contain
    w = sw * k
    h = sh * k
  }
  const [ox, oy] = placeOf(style.objectPosition, box.w - w, box.h - h)
  const clips = radius > 0 || w > box.w + 0.5 || h > box.h + 0.5
  if (clips) {
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(box.x, box.y, box.w, box.h, radius)
    ctx.clip()
  }
  ctx.drawImage(source, box.x + ox, box.y + oy, w, h)
  if (clips) ctx.restore()
}

const svgCache = new WeakMap                                                   ()
/** Set when this browser treats an SVG image as unreadable: icons are then left out. */
let svgTaints = false

/**
 * Draws an inline SVG as an image. Colours that come from classes are inlined first.
 * Built once per element and rebuilt when the colour, the cache key or the size
 * changes, so an animated SVG keeps its first frame instead of rebuilding every call.
 */
function drawSvg(ctx                          , svg               , color        , box     , onStale                          , cacheKey        ) {
  if (svgTaints) return
  const key = `${color}|${cacheKey}|${Math.round(box.w)}x${Math.round(box.h)}`
  let entry = svgCache.get(svg)
  if (!entry || entry.key !== key) {
    const clone = svg.cloneNode(true)                 
    const originals = [svg, ...svg.querySelectorAll('*')]
    const clones = [clone, ...clone.querySelectorAll('*')]
    originals.forEach((original, i) => {
      const style = getComputedStyle(original)
      const target = clones[i]              
      target.removeAttribute('class')
      target.style.fill = style.fill
      target.style.stroke = style.stroke
      target.style.animation = 'none'
    })
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(box.w))
    clone.setAttribute('height', String(box.h))
    clone.style.color = color
    const image = new Image()
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`
    entry = { key, image }
    svgCache.set(svg, entry)
  }
  if (!isLoaded(entry.image, onStale)) return
  if (isClean(entry.image)) ctx.drawImage(entry.image, box.x, box.y, box.w, box.h)
  else svgTaints = true
}

// ── Backgrounds: gradients and images ────────────────────────────────────────

                                                             
               
                                                                                        
                                                                                                                      
                                                              

function parseStops(args          , currentColor        )                {
  const stops         = []
  for (const arg of args) {
    const tokens = splitTop(arg, ' ')
    const positions           = []
    while (tokens.length && /^-?[\d.]+(%|px)$/.test(tokens[tokens.length - 1])) positions.unshift(tokens.pop()          )
    if (!tokens.length) continue // a colour hint (a position alone) is skipped
    const color = tokens.join(' ').replace(/currentcolor/gi, currentColor)
    if (!positions.length) stops.push({ color, at: null, px: false })
    for (const position of positions) stops.push({ color, at: parseFloat(position), px: position.endsWith('px') })
  }
  return stops.length > 1 ? stops : null
}

/** One layer of a computed `background-image`; null for what is not supported (conic gradients, image-set…). */
function parseImage(text        , currentColor        )                         {
  const url = /^url\((['"]?)(.*)\1\)$/.exec(text)
  if (url) return { kind: 'url', src: url[2] }
  const gradient = /^(repeating-)?(linear|radial)-gradient\(([\s\S]*)\)$/.exec(text)
  if (!gradient) return null
  const repeating = !!gradient[1]
  const args = splitTop(gradient[3], ',')
  // The first argument is the direction or the shape, unless it is already a colour.
  // "in oklab" (the interpolation space) is dropped: canvas always blends in sRGB.
  const first = args[0] ?? ''
  const head = first.replace(/\bin\s+[\w-]+(\s+\w+\s+hue)?/i, '').trim()
  const spaceOnly = head === '' && first !== ''
  if (gradient[2] === 'linear') {
    let angle = Math.PI
    let corner = ''
    let isDirection = spaceOnly
    if (/^to\s/.test(head)) {
      const v = /top/.test(head) ? 't' : /bottom/.test(head) ? 'b' : ''
      const hz = /left/.test(head) ? 'l' : /right/.test(head) ? 'r' : ''
      if (v && hz) corner = v + hz
      else angle = ({ t: 0, r: Math.PI / 2, b: Math.PI, l: Math.PI * 1.5 }                          )[v || hz] ?? Math.PI
      isDirection = true
    } else if (/^-?[\d.]+(deg|grad|rad|turn)$/.test(head)) {
      const n = parseFloat(head)
      angle = head.endsWith('turn') ? n * Math.PI * 2 : head.endsWith('grad') ? (n * Math.PI) / 200 : head.endsWith('rad') ? n : (n * Math.PI) / 180
      isDirection = true
    }
    const stops = parseStops(isDirection ? args.slice(1) : args, currentColor)
    return stops && { kind: 'linear', repeating, stops, angle, corner }
  }
  const isShape = spaceOnly || /^(circle|ellipse|closest-|farthest-|at\s|-?[\d.]+(px|%))/.test(head)
  const [shape = '', at = 'center'] = isShape ? head.split(/\s*\bat\s+/) : []
  const size = shape.match(/-?[\d.]+(px|%)/g) ?? []
  const stops = parseStops(isShape ? args.slice(1) : args, currentColor)
  return (
    stops && {
      kind: 'radial',
      repeating,
      stops,
      circle: /circle/.test(shape) || size.length === 1,
      extent: /(closest|farthest)-(side|corner)/.exec(shape)?.[0] ?? 'farthest-corner',
      size,
      at,
    }
  )
}

const parsed = new Map                                    ()

function imagesOf(style                     ) {
  const value = style.backgroundImage
  const key = /currentcolor/i.test(value) ? `${value}|${style.color}` : value
  let images = parsed.get(key)
  if (!images) {
    if (parsed.size > 300) parsed.clear()
    images = splitTop(value, ',').map((image) => parseImage(image, style.color))
    parsed.set(key, images)
  }
  return images
}

/** A stop's colour at zero alpha. CSS fades in premultiplied colour, canvas does not, so "transparent" has to keep the hue next to it. */
function clearOf(color        ) {
  const legacy = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(color)
  if (legacy) return `rgba(${legacy[1]}, ${legacy[2]}, ${legacy[3]}, 0)`
  const modern = /^([a-z-]+\([^/)]+?)\s*(\/[^)]*)?\)$/.exec(color)
  return modern ? `${modern[1]} / 0)` : color
}

/**
 * Resolves stop positions along a gradient line `length` px long. Returns the part of
 * the line the stops span (`from`..`to`, as fractions of it) and each stop inside that
 * part (0..1). `reach`: how far along the line the box extends (repeats cover it).
 */
function rampOf(stops        , length        , repeating         , reach = 1) {
  const at = stops.map((stop) => (stop.at === null ? null : stop.px ? stop.at / Math.max(length, 1e-6) : stop.at / 100))
  if (at[0] === null) at[0] = 0
  if (at[at.length - 1] === null) at[at.length - 1] = 1
  for (let i = 1; i < at.length; i++) {
    if (at[i] === null) {
      // Stops without a position are spread evenly between their neighbours.
      let j = i
      while (at[j] === null) j++
      const a = at[i - 1]          
      const b = Math.max(at[j]          , a)
      for (let k = i; k < j; k++) at[k] = a + ((b - a) * (k - i + 1)) / (j - i + 1)
    }
    at[i] = Math.max(at[i]          , at[i - 1]          )
  }
  let list                     = []
  stops.forEach((stop, i) => {
    const p = at[i]          
    const before = stops[i - 1]
    const after = stops[i + 1]
    // A transparent stop becomes its neighbours' colours at zero alpha (see clearOf).
    const fades = !isVisibleColor(stop.color)
    const fromBefore = fades && !!before && isVisibleColor(before.color)
    const toAfter = fades && !!after && isVisibleColor(after.color)
    if (fromBefore) list.push([p, clearOf(before.color)])
    if (toAfter) list.push([p, clearOf(after.color)])
    if (!fromBefore && !toAfter) list.push([p, stop.color])
  })
  let from = list[0][0]
  let to = list[list.length - 1][0]
  const period = to - from
  if (repeating && period > 1e-4) {
    const first = Math.floor(-from / period)
    const count = Math.ceil((reach - from) / period) - first
    if (count > 200) return null
    const one = list
    list = []
    for (let k = first; k < first + count; k++) for (const [p, color] of one) list.push([p + k * period, color])
    from += first * period
    to = from + count * period
  }
  // Stops that all share one position are a hard edge: keep the line a hair long, or canvas paints nothing.
  const span = Math.max(to - from, 0.02 / Math.max(length, 1e-6))
  return { from, to: from + span, stops: list.map(([p, color])                   => [Math.min(1, Math.max(0, (p - from) / span)), color]) }
}

/** Fills (0, 0, w, h) with a CSS gradient. */
function fillGradient(ctx                          , gradient          , w        , h        ) {
  if (gradient.kind === 'linear') {
    let angle = gradient.angle
    if (gradient.corner) {
      // "to top right": the line that puts the two neighbouring corners on the 50 % mark.
      const base = Math.atan2(h, w)
      angle = ({ tr: base, br: Math.PI - base, bl: Math.PI + base, tl: -base }                          )[gradient.corner] ?? base
    }
    const sin = Math.sin(angle)
    const cos = Math.cos(angle)
    const length = Math.abs(w * sin) + Math.abs(h * cos)
    const ramp = rampOf(gradient.stops, length, gradient.repeating)
    if (!ramp) return
    // The gradient line runs through the centre of the box.
    const x = (t        ) => w / 2 + sin * length * (t - 0.5)
    const y = (t        ) => h / 2 - cos * length * (t - 0.5)
    const fill = ctx.createLinearGradient(x(ramp.from), y(ramp.from), x(ramp.to), y(ramp.to))
    for (const [p, color] of ramp.stops) fill.addColorStop(p, color)
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, w, h)
    return
  }
  const [cx, cy] = placeOf(gradient.at, w, h)
  const dx = [Math.abs(cx), Math.abs(w - cx)]
  const dy = [Math.abs(cy), Math.abs(h - cy)]
  const pick = gradient.extent.startsWith('closest') ? Math.min : Math.max
  let rx = pick(...dx)
  let ry = pick(...dy)
  if (gradient.size.length) {
    rx = lengthOf(gradient.size[0], w)
    ry = gradient.size[1] ? lengthOf(gradient.size[1], h) : rx
  } else if (gradient.circle) rx = ry = gradient.extent.endsWith('corner') ? Math.hypot(rx, ry) : pick(rx, ry)
  else if (gradient.extent.endsWith('corner')) {
    rx *= Math.SQRT2
    ry *= Math.SQRT2
  }
  if (rx < 0.01 || ry < 0.01) return
  const ramp = rampOf(gradient.stops, rx, gradient.repeating, Math.hypot(Math.max(...dx) / rx, Math.max(...dy) / ry))
  if (!ramp) return
  const inner = Math.max(0, rx * ramp.from)
  const fill = ctx.createRadialGradient(0, 0, inner, 0, 0, Math.max(rx * ramp.to, inner + 1e-3))
  for (const [p, color] of ramp.stops) fill.addColorStop(p, color)
  // An ellipse is a circle squeezed along y.
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(1, ry / rx)
  ctx.fillStyle = fill
  ctx.fillRect(-cx, (-cy * rx) / ry, w, (h * rx) / ry)
  ctx.restore()
}

/**
 * Paints an element's `background-image` layers. `area` is the box they are sized and
 * positioned in, `bounds` the part of it worth painting. The caller has clipped to the box.
 */
function paintBackgrounds(ctx                          , style                     , area     , bounds     , onStale             ) {
  const images = imagesOf(style)
  const sizes = splitTop(style.backgroundSize, ',')
  const positions = splitTop(style.backgroundPosition, ',')
  const repeats = splitTop(style.backgroundRepeat, ',')
  // The first layer is the top one: paint from the last.
  for (let n = images.length - 1; n >= 0; n--) {
    const image = images[n]
    if (!image) continue
    let source                          = null
    let tw = area.w
    let th = area.h
    if (image.kind === 'url') {
      source = imageCopy(image.src)
      if (!isLoaded(source, onStale) || !isClean(source)) continue
      tw = source.naturalWidth
      th = source.naturalHeight
    }
    // Tile size: gradients have no size of their own and fill the area.
    const size = sizes[n % sizes.length] ?? 'auto'
    if (size === 'cover' || size === 'contain') {
      const k = (size === 'cover' ? Math.max : Math.min)(area.w / tw, area.h / th)
      tw *= k
      th *= k
    } else {
      const [sw = 'auto', sh = 'auto'] = splitTop(size, ' ')
      const ratio = tw / th
      if (sw !== 'auto') tw = lengthOf(sw, area.w)
      if (sh !== 'auto') th = lengthOf(sh, area.h)
      if (source && sw !== 'auto' && sh === 'auto') th = tw / ratio
      if (source && sw === 'auto' && sh !== 'auto') tw = th * ratio
    }
    if (!(tw >= 0.5 && th >= 0.5)) continue
    const [ox, oy] = placeOf(positions[n % positions.length] ?? '0% 0%', area.w - tw, area.h - th)
    const repeat = repeats[n % repeats.length] ?? 'repeat'
    const [repeatX, repeatY = repeatX] = repeat.split(' ')
    const tilesX = repeat !== 'repeat-y' && repeatX !== 'no-repeat'
    const tilesY = repeat !== 'repeat-x' && repeatY !== 'no-repeat'
    // Only the tiles that reach the visible part.
    const x0 = area.x + ox
    const y0 = area.y + oy
    const i0 = tilesX ? Math.floor((bounds.x - x0) / tw) : 0
    const i1 = tilesX ? Math.floor((bounds.x + bounds.w - x0 - 0.01) / tw) : 0
    const j0 = tilesY ? Math.floor((bounds.y - y0) / th) : 0
    const j1 = tilesY ? Math.floor((bounds.y + bounds.h - y0 - 0.01) / th) : 0
    // A very fine pattern blurs to nothing under glass: not worth hundreds of tiles.
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > 400) continue
    try {
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          ctx.save()
          ctx.translate(x0 + i * tw, y0 + j * th)
          if (source) ctx.drawImage(source, 0, 0, tw, th)
          else fillGradient(ctx, image            , tw, th)
          ctx.restore()
        }
      }
    } catch {
      // A colour this browser's canvas cannot parse: the layer is left out
      // (the gradient is built before anything else is saved, so one restore is owed).
      ctx.restore()
    }
  }
}

// ── Text and backdrop blur ───────────────────────────────────────────────────

/** Draws one text node line by line, where the page laid it out and in its own font. */
function drawText(
  ctx                          ,
  node      ,
  style                     ,
  originX        ,
  originY        ,
  lang                    ,
  isVisible                            ,
) {
  const raw = node.textContent ?? ''
  let text = raw.replace(/\s+/g, ' ').trim()
  if (!text) return
  const range = document.createRange()
  range.selectNodeContents(node)
  const lines = [...range.getClientRects()].filter((rect) => rect.width > 0.5)
  if (!lines.length) return
  // The page shows the transformed text. Upper and lower case follow the page's
  // language (Turkish i → İ); browsers capitalise without it.
  const transform = style.textTransform
  if (transform === 'uppercase') text = text.toLocaleUpperCase(lang)
  else if (transform === 'lowercase') text = text.toLocaleLowerCase(lang)
  else if (transform === 'capitalize') text = text.replace(/(^|\s)(\S)/g, (_, gap        , letter        ) => gap + letter.toUpperCase())
  const rtl = style.direction === 'rtl'
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  if ('letterSpacing' in ctx) ctx.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing
  ctx.direction = rtl ? 'rtl' : 'ltr'
  ctx.textAlign = 'left'
  ctx.fillStyle = style.color
  ctx.textBaseline = 'alphabetic'
  const metrics = ctx.measureText('Hgİş')
  const ascent = metrics.fontBoundingBoxAscent
  const descent = metrics.fontBoundingBoxDescent
  const space = ctx.measureText(' ').width
  // Fill each line with as many words as fit (a single line takes them all).
  const words = text.split(' ')
  let next = 0
  lines.forEach((rect, i) => {
    let line = ''
    if (i === lines.length - 1) line = words.slice(next).join(' ')
    else {
      while (next < words.length) {
        const candidate = line ? `${line} ${words[next]}` : words[next]
        if (line && ctx.measureText(candidate).width > rect.width + 1) break
        line = candidate
        next++
      }
    }
    if (!line || !isVisible(rect)) return
    // A leading space takes room only after an inline neighbour (not at the start of a
    // block): then the line box is wider than its words, and the text starts further in.
    const lead = i === 0 && !rtl && /^\s/.test(raw) && rect.width - ctx.measureText(line).width > space * 0.5 ? space : 0
    const baseline = rect.top - originY + (rect.height - (ascent + descent)) / 2 + ascent
    ctx.fillText(line, rect.left - originX + lead, baseline)
  })
}

let scratch                               

/**
 * Blurs a box of the canvas in place (the counterpart of `backdrop-filter: blur()`).
 * Like CSS, only what is inside the box is blurred and its edge pixels repeat outwards,
 * so content next to a frosted bar does not bleed into it.
 */
function blurBackdrop(ctx                          , box     , radius        , blurPx        ) {
  const matrix = ctx.getTransform()
  const scale = matrix.a
  const left = Math.max(0, Math.floor(box.x * scale + matrix.e))
  const top = Math.max(0, Math.floor(box.y * scale + matrix.f))
  const w = Math.min(ctx.canvas.width, Math.ceil((box.x + box.w) * scale + matrix.e)) - left
  const h = Math.min(ctx.canvas.height, Math.ceil((box.y + box.h) * scale + matrix.f)) - top
  if (w < 1 || h < 1) return
  const pad = Math.ceil(blurPx * scale * 3)
  scratch ??= document.createElement('canvas')
  scratch.width = w + 2 * pad
  scratch.height = h + 2 * pad
  const copy = scratch.getContext('2d')
  if (!copy) return
  copy.imageSmoothingEnabled = false
  copy.drawImage(ctx.canvas, left, top, w, h, pad, pad, w, h)
  copy.drawImage(scratch, pad, pad, 1, h, 0, pad, pad, h)
  copy.drawImage(scratch, pad + w - 1, pad, 1, h, pad + w, pad, pad, h)
  copy.drawImage(scratch, 0, pad, w + 2 * pad, 1, 0, 0, w + 2 * pad, pad)
  copy.drawImage(scratch, 0, pad + h - 1, w + 2 * pad, 1, 0, pad + h, w + 2 * pad, pad)
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(box.x, box.y, box.w, box.h, radius)
  ctx.clip()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
  ctx.clearRect(left, top, w, h)
  ctx.filter = `blur(${blurPx * scale}px)`
  ctx.drawImage(scratch, left - pad, top - pad)
  ctx.restore()
}

// ── The walk ─────────────────────────────────────────────────────────────────

/**
 * Where a child paints among its siblings (CSS 2.1 appendix E, per parent):
 * 0 negative z-index, 1 content in the flow, 2 positioned and stacking boxes, 3 positive z-index.
 */
function layerOf(style                     , inFlexOrGrid         )                             {
  const positioned = style.position !== 'static'
  const z = (positioned || inFlexOrGrid) && style.zIndex !== 'auto' ? parseInt(style.zIndex, 10) || 0 : 0
  if (z) return [z < 0 ? 0 : 3, z]
  const stacks =
    positioned ||
    style.opacity !== '1' ||
    style.transform !== 'none' ||
    style.filter !== 'none' ||
    style.isolation === 'isolate' ||
    (style.backdropFilter || 'none') !== 'none'
  return [stacks ? 2 : 1, 0]
}

                                  
     
                                                                      
                                                                             
     
                                       
                                                                          
                                                                       
                                                                      
                                      
                                                                                  
                      
                                                                                            
                   
     
                                                                                                  
                                                                                                    
                                                                                                                   
     
                                                                 
 

/**
 * Paints `root` and everything inside it into `ctx`. The context must already be
 * scaled so that one unit is one CSS px. Boxes that clip their overflow clip their
 * children; fixed and sticky elements are painted last, on top.
 */
/** A computed `clip-path` of the `inset()` or `path()` kind as a canvas path; anything else is not clipped. */
function clipShape(value        , box     )                {
  if (!value || value === 'none') return null
  const path = /^path\((?:[a-z-]+\s*,\s*)?["'](.*)["']\)$/s.exec(value)
  if (path) {
    const shape = new Path2D()
    shape.addPath(new Path2D(path[1]), new DOMMatrix().translate(box.x, box.y))
    return shape
  }
  const inset = /^inset\((.*)\)$/s.exec(value)
  if (!inset) return null
  const [sides, round = ''] = inset[1].split(/\s+round\s+/)
  const length = (token        , of        ) => (token.endsWith('%') ? (parseFloat(token) / 100) * of : parseFloat(token) || 0)
  const t = sides.trim().split(/\s+/)
  const top = length(t[0], box.h)
  const right = length(t[1] ?? t[0], box.w)
  const bottom = length(t[2] ?? t[0], box.h)
  const left = length(t[3] ?? t[1] ?? t[0], box.w)
  const w = Math.max(0, box.w - left - right)
  const h = Math.max(0, box.h - top - bottom)
  const shape = new Path2D()
  shape.roundRect(box.x + left, box.y + top, w, h, Math.min(round ? length(round.trim().split(/\s+/)[0], Math.min(w, h)) : 0, w / 2, h / 2))
  return shape
}

function drawDom(ctx                          , root         , options                    ) {
  const { origin, region, skip, onStale, cacheKey = document.documentElement.className, found } = options
  const originX = origin.left
  const originY = origin.top
  const deferred                                          = []
  const intersects = (rect         ) =>
    !region || (rect.right > region.left && rect.left < region.right && rect.bottom > region.top && rect.top < region.bottom)
  let lang                    
  try {
    lang = Intl.getCanonicalLocales(document.documentElement.lang)[0]
  } catch {
    // Not a language tag: the default locale's rules apply.
  }

  const walk = (element         , parentOpacity        , isDeferred = false, style = getComputedStyle(element)) => {
    if (skip?.(element)) return
    if (style.display === 'none' || style.visibility === 'hidden') return
    const opacity = parentOpacity * Number(style.opacity)
    if (opacity < 0.01) return
    if (!isDeferred && element !== root && (style.position === 'fixed' || style.position === 'sticky')) {
      deferred.push({ element, opacity: parentOpacity })
      found?.pinned.push(element)
      return
    }
    const drawChildren = () => {
      const inFlexOrGrid = /flex|grid/.test(style.display)
      const children = [...element.childNodes].map((node) => {
        const childStyle = node instanceof Element ? getComputedStyle(node) : null
        const [layer, z] = childStyle ? layerOf(childStyle, inFlexOrGrid) : [1, 0]
        return { node, childStyle, layer, z }
      })
      // The sort is stable: within a layer, document order.
      children.sort((a, b) => a.layer - b.layer || a.z - b.z)
      for (const { node, childStyle } of children) {
        if (childStyle) walk(node           , opacity, false, childStyle)
        else if (node.nodeType === Node.TEXT_NODE) {
          ctx.globalAlpha = opacity
          drawText(ctx, node        , style, originX, originY, lang, intersects)
        }
      }
    }
    if (style.display === 'contents') {
      drawChildren()
      return
    }
    const rect = element.getBoundingClientRect()
    // Screen-reader-only text (a 1 px square) and empty boxes are not painted, a hairline is;
    // nothing outside the region is visited.
    if (rect.width <= 0 || rect.height <= 0 || (rect.width <= 1 && rect.height <= 1) || !intersects(rect)) return
    if (found) {
      if (isDeferred) found.touched = true
      else if (!found.loose) {
        // A transform from a stylesheet stays put (a centred box); one written inline is a script's, and may follow the scroll.
        const inline = (element               ).style                                   
        found.loose =
          style.animationName !== 'none' ||
          (style.backgroundImage !== 'none' && style.backgroundAttachment.includes('fixed')) ||
          (!!inline && !!(inline.transform || inline.translate || inline.rotate || inline.scale))
      }
    }
    const box      = { x: rect.left - originX, y: rect.top - originY, w: rect.width, h: rect.height }
    // A `clip-path` (inset or path) cuts the box and everything inside it, as on screen.
    const shape = clipShape(style.clipPath, box)
    if (shape) {
      ctx.save()
      ctx.clip(shape)
    }
    try {
      paintBox(element, style, rect, box, opacity, drawChildren)
    } finally {
      if (shape) ctx.restore()
    }
  }
  const paintBox = (element         , style                     , rect         , box     , opacity        , drawChildren            ) => {
    const radius = Math.min(parseFloat(style.borderTopLeftRadius) || 0, rect.width / 2, rect.height / 2)
    // Frosted veil (backdrop-filter: blur): blur what is already painted beneath it first,
    // otherwise text behind a translucent veil shows up sharp in the glass.
    const backdropBlur = /blur\(([\d.]+)px\)/.exec(style.backdropFilter)
    if (backdropBlur) blurBackdrop(ctx, box, radius, Number(backdropBlur[1]))
    ctx.globalAlpha = opacity
    // `background-clip: text` paints the background inside the letters only: no box.
    const hasBox = style.backgroundClip !== 'text'
    if (hasBox && isVisibleColor(style.backgroundColor)) {
      ctx.beginPath()
      ctx.roundRect(box.x, box.y, box.w, box.h, radius)
      ctx.fillStyle = style.backgroundColor
      ctx.fill()
    }
    if (hasBox && style.backgroundImage !== 'none') {
      // The part of the box inside the region: only the tiles that reach it are painted.
      const bounds = { ...box }
      if (region) {
        bounds.x = Math.max(box.x, region.left - originX)
        bounds.y = Math.max(box.y, region.top - originY)
        bounds.w = Math.min(box.x + box.w, region.right - originX) - bounds.x
        bounds.h = Math.min(box.y + box.h, region.bottom - originY) - bounds.y
      }
      // A fixed background is laid out in the viewport, whatever the element's box.
      const area      = style.backgroundAttachment.includes('fixed') ? { x: -originX, y: -originY, w: innerWidth, h: innerHeight } : box
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(box.x, box.y, box.w, box.h, radius)
      ctx.clip()
      paintBackgrounds(ctx, style, area, bounds, onStale)
      ctx.restore()
    }
    const borderWidth = parseFloat(style.borderTopWidth) || 0
    if (borderWidth > 0 && style.borderTopStyle !== 'none' && isVisibleColor(style.borderTopColor)) {
      ctx.beginPath()
      ctx.roundRect(box.x + borderWidth / 2, box.y + borderWidth / 2, box.w - borderWidth, box.h - borderWidth, Math.max(0, radius - borderWidth / 2))
      ctx.lineWidth = borderWidth
      ctx.strokeStyle = style.borderTopColor
      ctx.setLineDash(style.borderTopStyle === 'dashed' ? [4, 3] : [])
      ctx.stroke()
      ctx.setLineDash([])
    }
    if (element instanceof SVGSVGElement) {
      drawSvg(ctx, element, style.color, box, onStale, cacheKey)
      return
    }
    if (element instanceof HTMLCanvasElement) {
      if (element.width && element.height && isClean(element)) ctx.drawImage(element, box.x, box.y, box.w, box.h)
      return
    }
    if (element instanceof HTMLImageElement) {
      const src = element.currentSrc || element.src
      if (!src) return
      // The element itself when the canvas stays readable, otherwise our own CORS copy.
      const image = element.complete && element.naturalWidth && isClean(element, src) ? element : imageCopy(src)
      if (isLoaded(image, onStale) && isClean(image, src)) drawFitted(ctx, image, image.naturalWidth, image.naturalHeight, box, radius, style)
      return
    }
    if (element instanceof HTMLVideoElement) {
      // The current frame; `live` glass follows the playback.
      if (element.readyState >= 2 && element.videoWidth && isClean(element, element.currentSrc)) drawFitted(ctx, element, element.videoWidth, element.videoHeight, box, radius, style)
      return
    }
    const clips = element !== root && style.overflow !== 'visible' && element !== document.body && element !== document.documentElement
    if (clips) {
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(box.x, box.y, box.w, box.h, radius)
      ctx.clip()
    }
    drawChildren()
    if (clips) ctx.restore()
  }
  walk(root, 1)
  for (let i = 0; i < deferred.length; i++) walk(deferred[i].element, deferred[i].opacity, true)
  ctx.globalAlpha = 1
}

/**
 * Paints what surrounds a box of the viewport, `reach` px past it on every side, with the box's
 * top-left on the context's origin: what a glass rim mirrors (`GlassLens.reflection`).
 */
function drawAround(
  ctx                          ,
  root         ,
  box                                                              ,
  reach        ,
  options                                              ,
) {
  drawDom(ctx, root, {
    ...options,
    origin: box,
    region: { left: box.left - reach, top: box.top - reach, right: box.left + box.width + reach, bottom: box.top + box.height + reach },
  })
}

return { drawDom, drawAround }
})()
const { drawDom, drawAround } = __snapshot

// ===== glass-layer.tsx (constants + CSS + effect body) =====================
/** Size of the hover/press response. Matches the kit's Button. */
const PRESS_SCALE = 1.08
const HOVER_SCALE = 1.04
const HOVER_GROW = 0.08
const MAX_GROW_PX = 6
/** Gap between the separated droplet and the body, as a share of the height. */
const DROPLET_GAP = 0.25
/** A pulse: the glass swells as if hovered and pressed for this long (seconds, unless `pulseHold` says otherwise), then lets go. */
const PULSE = 0.16
/** A droplet melting in: the glass nods once it is this far in (0–1 of the way out). */
const NOD_AT = 0.15
/** Already hovered, its hover swell is at rest: the pulse pushes its width and height instead (per second). */
const PULSE_KICK = { x: 24, y: 20 }
/**
 * During a pulse the content stretches with the glass, each way by this much of what the pulse
 * adds to the glass's swell that way (`--glass-bend`). It comes in and fades at these rates (per second).
 * Held swollen, the content does not stay stretched: it evens out at `even`, and as the glass
 * lets go it follows at `back` (per second).
 */
const PULSE_BEND = { amount: 0.5, in: 30, out: 5, even: 4, back: 12 }

const GLASS_CSS = `
/* Layered, so a utility class on the host (absolute, fixed) still wins over relative. */
@layer components{:where([data-glass-host]){position:relative;isolation:isolate}}
/* Unlayered on purpose: once the glass draws, it must beat the host's own fill utilities. */
[data-glass-host][data-glass-ready]{background:transparent!important;border-color:transparent!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
@keyframes glass-marquee{to{transform:translateX(-50%)}}
[data-glass-marquee]{animation:glass-marquee var(--glass-marquee-duration,5s) linear infinite}
/* Swapped labels and icons rise from a soft blur; a check draws itself in. */
@keyframes glass-in{from{opacity:0;filter:blur(3px);transform:translateY(4px)}}
[data-glass-in]{animation:glass-in .38s cubic-bezier(.2,.8,.2,1) both}
@keyframes glass-draw{from{stroke-dashoffset:25}}
[data-glass-draw]{stroke-dasharray:25;animation:glass-draw .42s cubic-bezier(.65,0,.35,1) .12s both}
@keyframes glass-spin{to{transform:rotate(1turn)}}
[data-glass-spin]{animation:glass-spin .8s linear infinite}
[data-glass-ready] [data-glass-fallback]{visibility:hidden}
@media (prefers-reduced-motion:reduce){[data-glass-marquee],[data-glass-in],[data-glass-draw],[data-glass-spin]{animation:none}}
`

/**
 * Put one glass layer on `canvas`, whose parent element is the host.
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

function __glassEffect() {

const canvas = canvasRef.current
const host = canvas?.parentElement
const ctx = canvas?.getContext('2d')
const engine = disabled ? null : getGlassEngine()
if (!canvas || !host || !ctx || !engine) return

const clear = material === 'clear'
let w = 0
let h = 0
let hasDroplet = false
/** The host's own corner radius in px; null = a pill. */
let corner                = null
let surface      = [1, 1, 1]
// Colours come from the host's own CSS (rest, hover, selected…) and cross-fade.
let color             = [
  [1, 1, 1],
  [1, 1, 1],
]
let border                    = null
/** Clear glass: opacity of the optional rim line (GlassOptics). */
let borderAlpha = 1
/** Clear glass: the tint ended up dark (optics.dark applies). */
let darkGlass = false
let colorT = 1
let unpaintable = false
let sampled = false
let pressed = false
let hovered = false
let ready = false
const page = {
  canvas: document.createElement('canvas'),
  ctx: null                                   ,
  key: '',
  at: 0,
  stale: true,
  /** The surface colour the picture was last filled with. */
  fill: '',
  // Where the glass and the page were when the picture was taken, and what the walk found:
  // elements pinned to the viewport, and whether everything else scrolls as one piece.
  size: '',
  lx: 0,
  ly: 0,
  sx: 0,
  sy: 0,
  pinned: []             ,
  rigid: false,
}
const press         = { x: 0, v: 0 }
const growX         = { x: 0, v: 0 }
const growY         = { x: 0, v: 0 }
const scale         = { x: 1, v: 0 }
const drop         = { x: 0, v: 0 }
/** How much the droplet is on its way in (0–1), eased: the bridge is held flat then (see the lens). */
let closing = 0
// A pulse: seconds of its swell left, and how much the content bends with it (0–1).
let settle = 0
/** A nod: seconds left of a hover's swell alone (the droplet splitting off or melting in). */
let nod = 0
/** A nod asked for while the droplet is still on its way in: it plays once the two are one body. */
let nodDue = false
const playNod = () => {
  nodDue = false
  // Hovered, the hover swell is at rest already: its springs are pushed instead (a pulse's push).
  if (hovered) {
    growX.v += PULSE_KICK.x
    growY.v += PULSE_KICK.y
  } else nod = PULSE
}
let bend = 0
/** The swell the glass is settling at (0–1, eased): the content bends by what is beyond it, so it is even once the glass holds still. */
let bendFrom = 0
let bent = ''
/** What this canvas carries to undo a pull's stretch of the host: its `scale`, and the point it is taken about. */
let unstretched = ''
let unstretchedAt = ''
const setBend = (next        ) => {
  if (bent === next) return
  bent = next
  if (next) host.style.setProperty('--glass-bend', next)
  else host.style.removeProperty('--glass-bend')
}
const maxScale = () => 1 + (2 * MAX_GROW_PX) / Math.max(w, 1)
const view            = {
  canvas,
  ctx,
  dirty: true,
  visible: false,
  // What this glass is, for the light of a press (see GLOW in engine.ts): one that swells is a
  // button and takes the flash of a press; one that holds still (a card) is a surface.
  button: swell,
  // A button is pulled after the pointer that holds it (PULL); glass that holds still (a card) is not.
  pull: pull && swell,
  grow: 1,
  step: (dt, still) => {
    if (still) {
      press.x = growX.x = growY.x = press.v = growX.v = growY.v = 0
      drop.x = hasDroplet && dropletRef.current === 'apart' ? 1 : 0
      drop.v = 0
      closing = drop.x ? 0 : 1
      bendFrom = hovered ? 1 : 0
      settle = nod = bend = 0
      nodDue = false
      setBend('')
      scale.x = 1
      view.grow = 1
      if (colorT !== 1) view.dirty = true
      colorT = 1
      return false
    }
    const greeting = settle > 0
    settle = Math.max(0, settle - dt)
    const nodding = nod > 0
    nod = Math.max(0, nod - dt)
    const hov = hovered || greeting || nodding ? 1 : 0
    // A pulse swells the glass as a press does, on top of the hover.
    // (A pointer that holds the glass to pull it keeps it pressed outside it too.)
    const down = pressed || (swell && view.held === true) || greeting
    const target = down ? Math.min(PRESS_SCALE, maxScale()) : hov ? Math.min(HOVER_SCALE, maxScale()) : 1
    const a = stepSpring(press, down ? 1 : 0, SPRINGS.press, dt)
    const b = stepSpring(growX, hov, SPRINGS.hoverX, dt)
    const c = stepSpring(growY, hov, SPRINGS.hoverY, dt)
    const d = stepSpring(scale, target, SPRINGS.press, dt)
    const apart = dropletRef.current === 'apart' && view.visible && !pressed
    const e = hasDroplet ? stepSpring(drop, apart ? 1 : 0, apart ? SPRINGS.dropletOut : SPRINGS.dropletIn, dt) : false
    closing = clamp(closing + (apart ? -1 : 1) * dt * 12)
    if (nodDue && (apart || drop.x < NOD_AT)) playNod()
    // The content follows the glass while the pulse lasts, and lets go as it settles.
    bend = clamp(bend + ((greeting ? 1 : 0) - bend) * Math.min(1, dt * (greeting ? PULSE_BEND.in : PULSE_BEND.out)))
    if (!greeting && bend < 0.004) bend = 0
    bendFrom = clamp(bendFrom + (hov - bendFrom) * Math.min(1, dt * (hov > bendFrom ? PULSE_BEND.even : PULSE_BEND.back)))
    const by = bend * PULSE_BEND.amount * 2 * HOVER_GROW
    setBend(bend ? `${(1 + (by * (growX.x - bendFrom) * h) / Math.max(w, 1)).toFixed(4)} ${(1 + by * (growY.x - bendFrom)).toFixed(4)}` : '')
    // The engine writes the host's scale: this, times the stretch of a pull.
    view.grow = scale.x
    const fading = 1 - colorT > 0.004
    colorT = fading ? colorT + (1 - colorT) * Math.min(1, dt * 14) : 1
    return a || b || c || d || e || greeting || nodding || nodDue || bend > 0 || fading || (clear && live && view.visible)
  },
  lens: (refresh) => {
    if (refresh) {
      w = host.offsetWidth
      h = host.offsetHeight
      // The glass takes the host's corners (`rounded-lg`); round enough is a pill.
      const rounding = getComputedStyle(host).borderTopLeftRadius
      const px = rounding.endsWith('%') ? (Math.min(w, h) * parseFloat(rounding)) / 100 : parseFloat(rounding) || 0
      corner = px >= Math.min(w, h) / 2 - 0.5 ? null : px
      // The droplet: a direct child marked `data-glass-drop`, laid out by its owner at the end.
      const had = hasDroplet
      hasDroplet = dropletRef.current !== 'none' && [...host.children].some((c) => c.hasAttribute('data-glass-drop'))
      // Springs step before shapes are read: one more frame lets the droplet start moving.
      if (hasDroplet !== had) engine.wake()
      const s = engine.resolveColor(surfaceColorOf(host.parentElement))
      surface = [s[0], s[1], s[2]]
      if (clear) {
        const o = tuneRef.current.optics
        const custom = o?.tintColor || getComputedStyle(host).getPropertyValue('--glass-tint').trim()
        const luminance = 0.2126 * surface[0] + 0.7152 * surface[1] + 0.0722 * surface[2]
        const t = custom ? engine.resolveColor(custom) : null
        const tc      = t ? [t[0], t[1], t[2]] : luminance > 0.5 ? [1, 1, 1] : [0, 0, 0]
        // Light or dark glass: lets the host pick a readable text colour (data-[glass-tone=…]:).
        const tone = 0.2126 * tc[0] + 0.7152 * tc[1] + 0.0722 * tc[2] > 0.5 ? 'light' : 'dark'
        if (host.dataset.glassTone !== tone) host.dataset.glassTone = tone
        darkGlass = tone === 'dark'
        color = [tc, tc]
        // An optional line just inside the rim.
        const line = darkGlass ? { ...o, ...o?.dark } : o
        const bc = line?.borderColor && (line.borderAlpha ?? 0) > 0 ? engine.resolveColor(line.borderColor) : null
        border = bc ? [[bc[0], bc[1], bc[2]], [bc[0], bc[1], bc[2]]] : null
        borderAlpha = bc ? clamp((line?.borderAlpha ?? 0) * bc[3]) : 1
        colorT = 1
        sampled = true
      } else {
        // Read the host's own fill and border with the glass briefly lifted.
        const had = 'glassReady' in host.dataset
        const transition = host.style.transition
        host.style.transition = 'none'
        if (had) delete host.dataset.glassReady
        const st = getComputedStyle(host)
        const fill = engine.resolveColor(st.backgroundColor)
        const bw = st.borderTopStyle === 'solid' ? parseFloat(st.borderTopWidth) || 0 : 0
        const bc = engine.resolveColor(st.borderTopColor)
        const cannot = st.backgroundImage !== 'none' || (st.borderTopStyle !== 'solid' && st.borderTopStyle !== 'none')
        if (had) {
          host.dataset.glassReady = ''
          void getComputedStyle(host).backgroundColor
        }
        host.style.transition = transition
        const next = mixRgb(surface, [fill[0], fill[1], fill[2]], fill[3])
        const nextBorder             = bw > 0 && bc[3] > 0.02 ? mixRgb(next, [bc[0], bc[1], bc[2]], bc[3]) : null
        unpaintable = cannot || (fill[3] < 0.02 && !nextBorder)
        const now = sampled ? mixRgb(color[0], color[1], colorT) : next
        const nowBorder = sampled && border ? mixRgb(border[0], border[1], colorT) : (nextBorder ?? next)
        const changed = sampled && (now.some((v, i) => Math.abs(v - next[i]) > 0.004) || !!border !== !!nextBorder)
        color = [now, next]
        border = nextBorder ? [nowBorder, nextBorder] : null
        colorT = changed ? 0 : 1
        sampled = true
        if (changed) engine.wake()
      }
    }
    if (w < 2 || h < 2) return null
    if (unpaintable) {
      if (ready) {
        ready = false
        delete host.dataset.glassReady
      }
      return null
    }
    // The host itself is scaled; the glass inside the canvas is divided by that scale.
    const p = clamp(press.x, -0.12, 1.15)
    const s = Math.max(0.5, scale.x)
    const k = lerp(1, Math.min(PRESS_SCALE, maxScale()), p) / s
    const grow = (h * HOVER_GROW) / s
    const t = hasDroplet ? clamp(drop.x, 0, 1.06) : 0
    const pull = h * (1 + DROPLET_GAP) * t
    const hy = (h / 2) * k + grow * growY.x
    // Swollen, the droplet's end sits a little off the body's. It joins it as the two
    // become one, or the end would jump when the droplet goes (the spring's last
    // ripple brings it back for a moment).
    const dropX = (w / 2 - h / 2) * k + grow * lerp(growX.x - growY.x, growX.x * 0.5, smooth(0, 0.15, t))
    // The canvas keeps 8px beside the glass and 10px above it, and more whenever the glass
    // swells past that (a push while it is already swollen): its end is never cut off.
    const reach = Math.max((w / 2) * k + grow * growX.x, t > 0.001 ? dropX + hy : 0)
    // A pull stretches the host. That stretch is undone on this canvas and drawn by the glass
    // itself: it stays a pill with round ends, as long and as thin as the pull makes it, and
    // bends what really lies behind it (not a picture of it, pulled out of shape with the host).
    const px = view.pulled?.sx ?? 1
    const py = view.pulled?.sy ?? 1
    // Room for the longest a pull can make it, taken once: a canvas that changed size on
    // every frame of a pull would be painted from scratch each time.
    const most = px === 1 && py === 1 ? 0 : Math.max(w, h) <= PULL.smallUntil ? PULL.smallStretchMax : PULL.stretchMax
    const padX = Math.max(8, Math.ceil(reach * (1 + most) - w / 2 + 2))
    const padTop = Math.max(10, Math.ceil(hy * (1 + most) - h / 2 + 2))
    const padBottom = Math.round(h * 0.8 + 4)
    const origin = `${padX + w / 2}px ${padTop + h / 2}px`
    const undo = px === 1 && py === 1 ? '' : `${(1 / px).toFixed(6)} ${(1 / py).toFixed(6)}`
    if (undo !== unstretched || (undo && origin !== unstretchedAt)) {
      canvas.style.transformOrigin = unstretchedAt = origin
      canvas.style.scale = unstretched = undo
    }
    const rect = host.getBoundingClientRect()
    const pc = clamp(press.x)
    const unit = h / DESIGN_HEIGHT
    const bevel = lerp(DESIGN_HEIGHT * 0.42, 62, pc)
    // Square corners swell with the glass.
    const radius = corner === null ? 999 : corner * (hy / (h / 2))
    const { tint, blur, optics: o } = tuneRef.current
    // The engine scales the shadow with the light too; divide it back out, so they tune apart.
    const strength = Math.max(clamp(o?.light ?? 1, 0, 3), 1e-4)
    // The gooey bridge opens as the droplet leaves and closes once it has snapped.
    const bridge = h * 0.34 * py * smooth(0, 0.15, t) * (1 - smooth(0.8, 1, t))
    // On its way in, the droplet ends up inside the body's end, and a bridge that soft would
    // swell that end past the body (it grew, then shrank as the droplet went). There the
    // bridge only fills the dip between the two: the end stays as tall as the rest.
    const dip = Math.hypot(hy * py, (pull * k * px) / 2) - hy * py
    return {
      // The canvas is placed against the padding box; the glass is measured on the border box.
      left: -padX - host.clientLeft,
      top: -padTop - host.clientTop,
      width: w + 2 * padX,
      height: h + padTop + padBottom,
      unit,
      cx: padX + w / 2,
      cy: padTop + h / 2,
      hx: ((w / 2 - pull / 2) * k + grow * growX.x) * px,
      hy: hy * py,
      radius,
      bodyX: (-pull / 2) * k * px,
      droplet:
        t > 0.001
          ? {
              x: dropX * px,
              r: hy * py,
              k: lerp(bridge, Math.min(bridge, 4 * dip), closing),
            }
          : undefined,
      // Shading bands deeper than a square corner would meet in diagonal seams: the bevel
      // stays within the corner, and the bend keeps the depth it has on a pill.
      bevel: (corner === null ? bevel : Math.min(bevel, (radius / unit) * 1.2)) * Math.max(0.05, o?.bevel ?? 1),
      band: corner === null || hasDroplet ? undefined : bevel * 0.35 * Math.max(0.05, o?.bendDepth ?? 1),
      shadow: (0.12 * lerp(0.55, 1, pc) * Math.max(0, o?.shadow ?? 1)) / strength,
      shadowSoftness: 34 * lerp(0.6, 1, pc) * Math.max(0.05, o?.shadowSoftness ?? 1),
      shadowOffset: 22 * lerp(0.5, 1, pc) * Math.max(0, o?.shadowOffset ?? 1),
      strength,
      tune: o && {
        rim: o.rim,
        rimWidth: o.rimWidth,
        fresnel: o.fresnel,
        inner: o.inner,
        reflection: o.reflection,
        caustic: o.caustic,
        mirror: o.mirror,
        bendCurve: o.bendCurve,
        bendDepth: o.bendDepth,
        saturation: o.saturation,
        frostEdge: o.frostEdge,
      },
      color: mixRgb(color[0], color[1], colorT),
      border: border ? mixRgb(border[0], border[1], colorT) : undefined,
      borderAlpha: clear ? borderAlpha : undefined,
      borderWidth: clear ? o?.borderWidth : undefined,
      surface,
      edgeClear: 0.2,
      cursorLight: o?.cursorLight ?? true,
      pointerLight: true,
      // What the rim of clear glass mirrors: the page around it. Tinted glass mirrors nothing.
      reflection: !clear ? undefined : {
        height: h,
        live,
        paint: (around, reach) => {
          const r = host.getBoundingClientRect()
          const box = { left: r.left + (r.width - w) / 2 - padX, top: r.top + (r.height - h) / 2 - padTop, width: w + 2 * padX, height: h + padTop + padBottom }
          drawAround(around, (backdrop ? host.closest(backdrop) : null) ?? document.body, box, reach, {
            skip: (el) => el === host || el.hasAttribute('data-glass-skip'),
            onStale: dirty,
          })
        },
      },
      refraction: clear
        ? {
            paint: (back) => {
              back.translate(padX, padTop)
              const fill = rgbCss(surface)
              const recoloured = fill !== page.fill
              page.fill = fill
              back.fillStyle = fill
              back.fillRect(-padX, -padTop, w + 2 * padX, h + padTop + padBottom)
              const root = (backdrop ? host.closest(backdrop) : null) ?? document.body
              const r = host.getBoundingClientRect()
              const lx = r.left + (r.width - w) / 2
              const ly = r.top + (r.height - h) / 2
              const target = back.canvas
              const key = `${target.width}:${target.height}:${Math.round(lx * 2)}:${Math.round(ly * 2)}:${Math.round(scrollX)}:${Math.round(scrollY)}`
              const now = performance.now()
              if (!page.ctx) page.ctx = page.canvas.getContext('2d')
              const region = { left: lx - padX, top: ly - padTop, right: lx + w + padX, bottom: ly + h + padBottom }
              // Scrolling with the page, the glass keeps the same page behind it: the picture it has
              // is still right. Not when something in it moves by itself, or is pinned to the
              // viewport (a sticky header) and touches the glass, now or when it was painted.
              const rides =
                !live &&
                page.rigid &&
                page.size === `${target.width}:${target.height}` &&
                Math.abs(lx - page.lx + scrollX - page.sx) < 0.05 &&
                Math.abs(ly - page.ly + scrollY - page.sy) < 0.05 &&
                !page.pinned.some((el) => {
                  const b = el.getBoundingClientRect()
                  return b.width > 0 && b.height > 0 && b.right > region.left && b.left < region.right && b.bottom > region.top && b.top < region.bottom
                })
              // The page is re-painted when the glass moves over it, and at most every 120 ms otherwise.
              // `live` reads it again every frame at 60 Hz, and every second or third frame on a faster display.
              const again = !!page.ctx && (page.stale || (key !== page.key && !rides) || now - page.at > (live ? 12 : 120))
              if (page.ctx && again) {
                page.stale = false
                page.key = key
                page.at = now
                page.size = `${target.width}:${target.height}`
                page.lx = lx
                page.ly = ly
                page.sx = scrollX
                page.sy = scrollY
                if (page.canvas.width !== target.width || page.canvas.height !== target.height) {
                  page.canvas.width = target.width
                  page.canvas.height = target.height
                }
                const pc2 = page.ctx
                pc2.setTransform(1, 0, 0, 1, 0, 0)
                pc2.clearRect(0, 0, target.width, target.height)
                pc2.setTransform(back.getTransform())
                const found = { pinned: []             , touched: false, loose: false }
                drawDom(pc2, root, {
                  origin: { left: lx, top: ly },
                  region,
                  skip: (el) => el === host || el.hasAttribute('data-glass-skip'),
                  onStale: () => {
                    page.stale = true
                    view.dirty = true
                    engine.wake()
                  },
                  found,
                })
                page.pinned = found.pinned
                page.rigid = !found.loose && !found.touched
              }
              back.save()
              back.setTransform(1, 0, 0, 1, 0, 0)
              back.drawImage(page.canvas, 0, 0)
              back.restore()
              // The same picture of the page as last time: the engine keeps its texture.
              return again || recoloured
            },
            refract: lerp(44, 37, pc) * Math.max(0, o?.refraction ?? 1),
            magnify: Math.max(0, o?.magnify ?? 0),
            dispersion: Math.max(0, o?.dispersion ?? 0.12),
            blurCenter: Math.max(0, o?.clearBlur ?? 0.35),
            blurEdge: Math.max(0, o?.clearBlurEdge ?? 2.2),
            frost: clamp(darkGlass ? (o?.dark?.tint ?? tint) : tint),
            blur,
            blurMix: o?.frostMix,
            radial: o?.bendMode === 'radial' ? 0.065 * Math.max(0, o?.refraction ?? 1) : undefined,
          }
        : undefined,
      screenX: rect.left + rect.width / 2,
      screenY: rect.top + rect.height / 2,
    }
  },
  drawn: () => {
    if (ready) return
    ready = true
    host.dataset.glassReady = ''
  },
  lost: () => {
    delete host.dataset.glassReady
    view.grow = 1
  },
}

const isDisabled = () => host.matches(":disabled, [aria-disabled='true']")
const dirty = () => {
  view.dirty = true
  engine.wake()
}
pokeRef.current = dirty
// The nod: a hover's swell alone, for PULSE seconds. A droplet melting in swells once it is
// in: pushed while it is still out, its end would stick out past the body's.
nodRef.current = () => {
  if (!swell || host.matches(':disabled')) return
  if (hasDroplet && dropletRef.current === 'merged' && drop.x >= NOD_AT) nodDue = true
  else playNod()
  dirty()
}
// The pulse (see `pulse`): the glass swells as under a hover and a press at once, and lets
// go. Hovered, its hover swell is at rest already: those springs are pushed, so it wobbles.
pulseRef.current = () => {
  if (!swell || host.matches(':disabled')) return
  if (hovered) {
    growX.v += PULSE_KICK.x
    growY.v += PULSE_KICK.y
  }
  settle = Math.max(0, pulseHoldRef.current ?? PULSE)
  dirty()
}
const onDown = () => {
  if (!swell || isDisabled()) return
  pressed = true
  engine.wake()
}
const onUp = () => {
  pressed = false
  engine.wake()
}
const onEnter = (e              ) => {
  if (!swell || e.pointerType !== 'mouse' || isDisabled()) return
  hovered = true
  dirty()
}
const onLeave = () => {
  pressed = false
  hovered = false
  dirty()
}
const target              = (trigger ? host.closest             (trigger) : null) ?? host
if (target !== host) view.pressArea = target
target.addEventListener('pointerdown', onDown)
target.addEventListener('pointerup', onUp)
target.addEventListener('pointercancel', onUp)
target.addEventListener('pointerenter', onEnter)
target.addEventListener('pointerleave', onLeave)
const io = new IntersectionObserver(([entry]) => {
  view.visible = entry.isIntersecting
  dirty()
})
io.observe(host)
const ro = new ResizeObserver(dirty)
ro.observe(host)
// Content changes (label, selected state) re-check the droplet and colours.
const mo = new MutationObserver(dirty)
mo.observe(host, {
  childList: true,
  attributes: true,
  attributeFilter: ['class', 'disabled', 'aria-pressed', 'aria-checked', 'aria-selected', 'aria-expanded', 'data-state'],
})
// A scroll changes what lies behind, never the glass: sizes and colours are not read again.
const onScroll = () => {
  view.repaint = true
  engine.wake()
}
if (clear) addEventListener('scroll', onScroll, { passive: true, capture: true })
engine.add(view)
if (window.__lgDebug) window.__lgDebug({ view: view, page: page, host: host })

return () => {
  engine.remove(view)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  io.disconnect()
  ro.disconnect()
  mo.disconnect()
  removeEventListener('scroll', onScroll, { capture: true })
  target.removeEventListener('pointerdown', onDown)
  target.removeEventListener('pointerup', onUp)
  target.removeEventListener('pointercancel', onUp)
  target.removeEventListener('pointerenter', onEnter)
  target.removeEventListener('pointerleave', onLeave)
  delete host.dataset.glassReady
  delete host.dataset.glassTone
  host.style.removeProperty('--glass-bend')
  canvas.style.scale = ''
  pokeRef.current = null
  pulseRef.current = null
  nodRef.current = null
}
  
}

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
const OPTION_UNITS = 80
const OPTICS = (OPTION_UNITS * 1.35) / 120
const HOVER_SPEED = 3.5
const HOVER_ACCEL = 1.6

/**
 * Mounts GlassBadge's renderer: a tinted drop with `children` flowing through it.
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

function __badgeEffect() {

const canvas = canvasRef.current
const host = canvas?.parentElement
const ctx = canvas?.getContext('2d')
const engine = getGlassEngine()
if (!canvas || !host || !ctx || !engine) return

let w = 0
let h = 0
let surface      = [1, 1, 1]
let paint = 'blue'
let ink = 'white'
let dot = 'white'
let font = '600 12px sans-serif'
let offset = 0
let still = false
let rate = 1
let hovered = false
const snap = { canvas: document.createElement('canvas'), small: document.createElement('canvas'), stale: true, at: 0 }

const measure = () => {
  w = host.offsetWidth
  h = host.offsetHeight
  const s = engine.resolveColor(surfaceColorOf(host.parentElement))
  surface = [s[0], s[1], s[2]]
  const had = 'glassReady' in host.dataset
  if (had) delete host.dataset.glassReady
  const st = getComputedStyle(host)
  const p = engine.resolveColor(st.backgroundColor)
  if (had) host.dataset.glassReady = ''
  paint = rgbCss([p[0], p[1], p[2]])
  ink = st.color
  dot = dotColor ?? st.color
  font = `${st.fontWeight} ${st.fontSize} ${st.fontFamily}`
  snap.stale = true
}

const view            = {
  canvas,
  ctx,
  dirty: true,
  visible: false,
  step: (dt, reduced) => {
    still = reduced
    if (reduced || !view.visible) return false
    rate += ((hovered ? HOVER_SPEED : 1) - rate) * Math.min(1, dt * HOVER_ACCEL)
    offset += dt * speed * rate
    return true
  },
  lens: (refresh) => {
    if (refresh || !w) measure()
    if (w < 2 || h < 2) return null
    const padX = 6
    const padTop = 8
    const padBottom = Math.round(h * 0.9 + 6)
    const box = host.getBoundingClientRect()
    return {
      left: -padX,
      top: -padTop,
      width: w + 2 * padX,
      height: h + padTop + padBottom,
      unit: h / OPTION_UNITS,
      cx: padX + w / 2,
      cy: padTop + h / 2,
      hx: w / 2,
      hy: h / 2,
      radius: 999,
      bodyX: 0,
      bevel: OPTION_UNITS * 0.42,
      shadow: 0.1,
      shadowSoftness: 30 * OPTICS,
      shadowOffset: 12 * OPTICS,
      strength: 1,
      color: surface,
      surface,
      edgeClear: 0,
      refraction: {
        paint: (back) => {
          const dpr = back.getTransform().a
          back.translate(padX, padTop)
          // What sits behind the badge, painted at a quarter resolution: a cheap blur.
          const now = performance.now()
          const W = back.canvas.width
          const H = back.canvas.height
          if (snap.stale || now - snap.at > 500) {
            snap.stale = false
            snap.at = now
            const sw = Math.max(1, Math.round(W / 4))
            const sh = Math.max(1, Math.round(H / 4))
            snap.small.width = sw
            snap.small.height = sh
            const sc = snap.small.getContext('2d')
            if (sc) {
              sc.setTransform(dpr / 4, 0, 0, dpr / 4, (padX * dpr) / 4, (padTop * dpr) / 4)
              sc.fillStyle = rgbCss(surface)
              sc.fillRect(-padX, -padTop, W, H)
              const root = host.offsetParent ?? document.body
              drawDom(sc, root, {
                origin: { left: box.left, top: box.top },
                region: { left: box.left - padX, top: box.top - padTop, right: box.right + padX, bottom: box.bottom + padBottom },
                skip: (el) => el === host,
                onStale: () => {
                  snap.stale = true
                  view.dirty = true
                  engine.wake()
                },
              })
            }
          }
          back.save()
          back.setTransform(1, 0, 0, 1, 0, 0)
          back.imageSmoothingQuality = 'high'
          back.drawImage(snap.small, 0, 0, W, H)
          back.restore()
          back.globalAlpha = tint
          back.fillStyle = paint
          back.fillRect(-padX, -padTop, w + 2 * padX, h + padTop + padBottom)
          back.globalAlpha = 1
          back.font = font
          back.textBaseline = 'middle'
          back.fillStyle = ink
          const mid = h / 2 + 0.5
          if (still) {
            back.textAlign = 'center'
            back.fillText(children, w / 2, mid)
            return
          }
          const tw = back.measureText(children).width + 12
          back.textAlign = 'left'
          for (let x = -((offset % 1) * tw) - tw; x < w + tw; x += tw) {
            back.fillStyle = ink
            back.fillText(children, x + 6, mid)
            back.fillStyle = dot
            back.fillRect(x - 2, h / 2 - 1.5, 4, 4)
          }
        },
        refract: 22 * OPTICS,
        magnify: 0.1,
        dispersion: 0.12,
        blurCenter: 0,
        blurEdge: 2.2,
        frost: 0,
      },
      cursorLight: true,
      pointerLight: true,
      // What the rim of a clear badge mirrors: the page around it. A badge in its own
      // colour (`tint` above a clear button's 0.6) mirrors nothing.
      reflection:
        tint > 0.6
          ? undefined
          : {
              height: h,
              paint: (around, reach) => {
                drawAround(around, document.body, { left: box.left - padX, top: box.top - padTop, width: w + 2 * padX, height: h + padTop + padBottom }, reach, {
                  skip: (el) => el === host || el.hasAttribute('data-glass-skip'),
                  onStale: dirty,
                })
              },
            },
      screenX: box.left + w / 2,
      screenY: box.top + h / 2,
    }
  },
  drawn: () => {
    host.dataset.glassReady = ''
  },
  lost: () => {
    delete host.dataset.glassReady
  },
}

const dirty = () => {
  view.dirty = true
  engine.wake()
}
const io = new IntersectionObserver(([entry]) => {
  view.visible = entry.isIntersecting
  dirty()
})
io.observe(host)
const ro = new ResizeObserver(dirty)
ro.observe(host)
const parent = host.offsetParent
if (parent) ro.observe(parent)
const enter = (e       ) => {
  if ((e                ).pointerType === 'mouse') hovered = true
}
const leave = () => {
  hovered = false
}
parent?.addEventListener('pointerenter', enter)
parent?.addEventListener('pointerleave', leave)
engine.add(view)
if (window.__lgDebug) window.__lgDebug({ view: view, page: page, host: host })
return () => {
  engine.remove(view)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  io.disconnect()
  ro.disconnect()
  parent?.removeEventListener('pointerenter', enter)
  parent?.removeEventListener('pointerleave', leave)
  delete host.dataset.glassReady
}
  
}

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
