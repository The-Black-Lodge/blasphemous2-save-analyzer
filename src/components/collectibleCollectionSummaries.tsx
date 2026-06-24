import type { ReactNode } from "react"

const MAPGENIE =
  "https://mapgenie.io/blasphemous-2/maps/cvstodia?locationIds="

export const collectibleCollectionSummaries: Record<string, ReactNode> = {
  lacrimatorio: (
    <>
      Turns into <em>Plenus Lacrimatorio</em> when all 4 are collected. Bring to the <a href='https://mapgenie.io/blasphemous-2/maps/cvstodia?locationIds=524351' target="_blank" rel="noopener noreferrer">Icebound Mausoleum</a> to transform it into <em>Beatus Lacrimatorio</em>.
    </>
  ),
  lullabies: (
    <>
      After collecting all 5, deliver the{" "}
      <em>Lullaby of the White Shore</em> to the{" "}
      <a href={`${MAPGENIE}509142`} target="_blank" rel="noopener noreferrer">
        Mother
      </a>
      .
    </>
  ),
  mementos: (
    <>
      Deliver the mementos to{" "}
      <a href={`${MAPGENIE}509092`} target="_blank" rel="noopener noreferrer">
        Montañés
      </a>{" "}
      to receive new figures.
    </>
  ),
  offerings: (
    <>
      Deliver completed offerings to the{" "}
      <a href={`${MAPGENIE}597394`} target="_blank" rel="noopener noreferrer">
        Altar
      </a>{" "}
      to unlock <em>Servants</em>.
    </>
  ),
  "sealed-envelope": (
    <>
      After reading all 5 letters, make a{" "}
      <a href={`${MAPGENIE}523550`} target="_blank" rel="noopener noreferrer">
        Leap of Faith
      </a>
      .
    </>
  ),
  "sleeping-daughter": (
    <>
      After waking <em>Daughters</em>, return to the{" "}
      <a href={`${MAPGENIE}520868`} target="_blank" rel="noopener noreferrer">
        Mistress of Mourning
      </a>{" "}
      for combat challenges and rewards.
    </>
  ),
}
