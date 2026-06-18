import prayerKindsJson from "../data/prayer-kinds.json"

type PrayerKind = "chant" | "verse"

const kindBySource = new Map<string, PrayerKind>()
const trueTormentOnly = new Set(prayerKindsJson.trueTormentOnly)

for (const source of prayerKindsJson.chant) {
  kindBySource.set(source, "chant")
}

for (const source of prayerKindsJson.verse) {
  kindBySource.set(source, "verse")
}

export function getPrayerKind(source: string): PrayerKind | null {
  return kindBySource.get(source) ?? null
}

export function isTrueTormentOnlyPrayer(source: string): boolean {
  return trueTormentOnly.has(source)
}
