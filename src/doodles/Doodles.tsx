/**
 * Hand-drawn bullet-journal doodles, written as SVG paths by hand so the repo
 * owns them outright — no third-party asset licences to worry about.
 *
 * All of them stroke in `currentColor` and inherit size from the parent, so a
 * doodle can be dropped anywhere and picks up the theme automatically.
 */
import type { SVGProps } from 'react'

type D = SVGProps<SVGSVGElement>

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/* --------------------------------------------------------------------------
   Botanical — the warm theme
   -------------------------------------------------------------------------- */

export function LeafSprig(props: D) {
  return (
    <svg viewBox="0 0 64 96" aria-hidden="true" {...props}>
      <g {...stroke}>
        <path d="M32 92C32 70 30 44 34 20c1-7 3-12 5-16" />
        <path d="M33 74c-8-2-13-7-15-14 8-1 14 3 17 10zM35 74c8-3 12-9 13-16-8 0-13 4-15 12z" />
        <path d="M35 56c-8-2-12-7-14-14 8-1 13 3 16 10zM37 55c8-3 11-9 12-16-8 0-13 4-14 12z" />
        <path d="M37 38c-7-2-11-7-12-13 7-1 12 3 14 9zM39 37c7-3 10-9 11-15-7 0-12 4-13 11z" />
      </g>
    </svg>
  )
}

export function Flower(props: D) {
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true" {...props}>
      <g {...stroke}>
        <path d="M36 30c-4-8 0-16 6-18 3 6 1 14-6 18z" />
        <path d="M40 34c8-4 16 0 18 6-6 3-14 1-18-6z" />
        <path d="M40 40c4 8 0 16-6 18-3-6-1-14 6-18z" />
        <path d="M34 38c-8 4-16 0-18-6 6-3 14-1 18 6z" />
        <circle cx="37" cy="35" r="4" />
        <path d="M39 44c2 9 0 17-6 24" />
        <path d="M36 56c-6-1-9-4-10-9 6 0 9 3 10 9z" />
      </g>
    </svg>
  )
}

export function Berries(props: D) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <g {...stroke}>
        <path d="M12 8c8 10 16 26 18 46" />
        <circle cx="26" cy="30" r="5" />
        <circle cx="38" cy="22" r="5" />
        <circle cx="34" cy="38" r="4" />
        <path d="M30 26c4-3 6-6 7-10M32 36c5 0 9-2 12-6" />
      </g>
    </svg>
  )
}

/* --------------------------------------------------------------------------
   Geometric — the cool theme
   -------------------------------------------------------------------------- */

export function ArrowCluster(props: D) {
  return (
    <svg viewBox="0 0 80 64" aria-hidden="true" {...props}>
      <g {...stroke}>
        <path d="M6 40c14 0 26-6 34-18" />
        <path d="M34 20l6 2-1 7" />
        <path d="M14 52c18 2 33-3 44-16" />
        <path d="M52 32l7 3-2 8" />
      </g>
    </svg>
  )
}

export function Triangles(props: D) {
  return (
    <svg viewBox="0 0 80 64" aria-hidden="true" {...props}>
      <g {...stroke}>
        <path d="M10 48l14-26 15 26z" />
        <path d="M36 48l12-20 13 20z" />
        <path d="M4 54h68" />
      </g>
    </svg>
  )
}

export function DotGridSquare(props: D) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <g {...stroke}>
        <path d="M10 12h44v42H10z" />
      </g>
      <g fill="currentColor">
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <circle key={`${r}-${c}`} cx={19 + c * 9} cy={21 + r * 9} r="1.4" />
          )),
        )}
      </g>
    </svg>
  )
}

/* --------------------------------------------------------------------------
   Stationery — used by every theme
   -------------------------------------------------------------------------- */

export function Star(props: D) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <g {...stroke}>
        <path d="M16 5l3.2 7.4 8 .7-6 5.3 1.8 7.9-7-4.2-7 4.2 1.8-7.9-6-5.3 8-.7z" />
      </g>
    </svg>
  )
}

export function Sparkle(props: D) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <g {...stroke}>
        <path d="M16 4v9M16 19v9M4 16h9M19 16h9" />
      </g>
    </svg>
  )
}

/**
 * The ribbon behind a page title. Unlike the other doodles this one is *sized by
 * its content*: it stretches to whatever box it is given (`preserveAspectRatio`
 * off) so a long month name never outgrows it. `vector-effect` keeps the outline
 * an even weight while the shape is being stretched.
 */
export function Banner(props: D) {
  return (
    <svg viewBox="0 0 160 40" preserveAspectRatio="none" aria-hidden="true" {...props}>
      <path
        d="M3 4h154l-12 16 12 16H3l12-16z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function Paperclip(props: D) {
  return (
    <svg viewBox="0 0 32 56" aria-hidden="true" {...props}>
      <g {...stroke}>
        <path d="M20 10v30a7 7 0 01-14 0V16a5 5 0 0110 0v24a2 2 0 01-4 0V18" />
      </g>
    </svg>
  )
}

export function Coin(props: D) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" {...props}>
      <g {...stroke}>
        <circle cx="20" cy="20" r="13" />
        <path d="M20 12v16M16 16h6a3 3 0 010 6h-5M17 22h5a3 3 0 010 6h-6" />
      </g>
    </svg>
  )
}

export function Piggy(props: D) {
  return (
    <svg viewBox="0 0 64 48" aria-hidden="true" {...props}>
      <g {...stroke}>
        <path d="M14 34c-6-4-8-10-6-16 3-8 12-12 22-12s19 5 21 13c1 6-2 12-8 15" />
        <path d="M18 33v8M28 36v6M40 36v6M50 32v8" />
        <path d="M50 20c3-4 7-5 9-3-1 4-4 6-8 6" />
        <circle cx="24" cy="18" r="1.6" fill="currentColor" stroke="none" />
        <path d="M26 8c2-4 6-5 9-3M22 24h10" />
      </g>
    </svg>
  )
}

export function Checklist(props: D) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <g {...stroke}>
        <path d="M10 14h8v8h-8zM10 30h8v8h-8zM10 46h8v8h-8z" />
        <path d="M11 17l3 4 5-7M11 33l3 4 5-7" />
        <path d="M26 18h28M26 34h28M26 50h20" />
      </g>
    </svg>
  )
}

export function WashiTape(props: D & { width?: number }) {
  return (
    <svg viewBox="0 0 120 32" aria-hidden="true" {...props}>
      <path d="M4 6l112-2 2 22-114 2z" fill="currentColor" opacity="0.5" />
      <g {...stroke} opacity="0.6">
        <path d="M18 6v22M34 5v22M50 5v22M66 4v22M82 4v22M98 4v22" />
      </g>
    </svg>
  )
}
