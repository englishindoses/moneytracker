import { useSettings } from '../lib/settings'
import {
  ArrowCluster,
  Berries,
  Checklist,
  Coin,
  DotGridSquare,
  Flower,
  LeafSprig,
  Piggy,
  Sparkle,
  Star,
  Triangles,
} from './Doodles'

/**
 * Decorative doodles scattered behind the page, like the margins of a real
 * bujo spread. Purely ornamental: aria-hidden, non-interactive, and drawn at
 * `--doodle-opacity` so they never fight the numbers for attention.
 *
 * On phones only the corner doodles render — the middle of a small screen is
 * where the actual content lives.
 */
export function PageDecor() {
  const { theme } = useSettings()

  const set =
    theme === 'warm'
      ? { a: LeafSprig, b: Flower, c: Berries, d: Star }
      : theme === 'cool'
        ? { a: ArrowCluster, b: Triangles, c: DotGridSquare, d: Sparkle }
        : { a: Checklist, b: Coin, c: Piggy, d: Star }

  const { a: TopLeft, b: BottomRight, c: MidRight, d: Accent } = set

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden text-accent"
      style={{ opacity: 'var(--doodle-opacity)' }}
    >
      <TopLeft className="absolute -left-6 top-10 h-40 w-40 -rotate-12" />
      <BottomRight className="absolute -right-8 bottom-8 h-48 w-48 rotate-6" />
      <MidRight className="absolute right-4 top-1/3 hidden h-32 w-32 -rotate-6 sm:block" />
      <Accent className="absolute left-1/4 bottom-1/4 hidden h-16 w-16 rotate-12 sm:block" />
      <Accent className="absolute right-1/3 top-6 hidden h-10 w-10 -rotate-12 md:block" />
    </div>
  )
}
