import type { ReactNode } from "react"

const MAPGENIE =
  "https://mapgenie.io/blasphemous-2/maps/cvstodia?locationIds="

export const questCollectionSummaries: Record<string, ReactNode> = {
  "ornate-chalice": (
    <>
      Increase max Health. Deliver to{" "}
      <a href={`${MAPGENIE}509170`} target="_blank" rel="noopener noreferrer">
        Our Lady of the Chalices
      </a>{" "}
      in the <em>City of the Blessed Name.</em>
    </>
  ),
  "empty-receptacle": (
    <>
      Increase max Bile Flasks. Deliver to{" "}
      <a href={`${MAPGENIE}509170`} target="_blank" rel="noopener noreferrer">
        Our Lady of the Chalices
      </a>{" "}
      in the <em>City of the Blessed Name.</em>
    </>
  ),
  "silver-clad-shard": (
    <>
      Increase Bile Flask effectiveness. Deliver to{" "}
      <a href={`${MAPGENIE}509170`} target="_blank" rel="noopener noreferrer">
        Our Lady of the Chalices
      </a>{" "}
      in the <em>City of the Blessed Name.</em>
    </>
  ),
  "fervent-kiss": (
    <>
      Increase max Fervour. Deliver to{" "}
      <a href={`${MAPGENIE}520870`} target="_blank" rel="noopener noreferrer">
        Besamanos
      </a>{" "}
      in the <em>Streets of Wakes.</em>
    </>
  ),
  "abandoned-rosary-knot": (
    <>
      Increase max Rosary Beads. Deliver to{" "}
      <a href={`${MAPGENIE}520866`} target="_blank" rel="noopener noreferrer">
        Sagrario
      </a>{" "}
      in the <em>Streets of Wakes.</em>
    </>
  ),
  "forgotten-tribute": (
    <>
      Deliver to the Procession of Shadows at the following locations:{" "}
      <a href={`${MAPGENIE}520930`} target="_blank" rel="noopener noreferrer">
        #1
      </a>
      ,{" "}
      <a href={`${MAPGENIE}520932`} target="_blank" rel="noopener noreferrer">
        #2
      </a>
      ,{" "}
      <a href={`${MAPGENIE}520935`} target="_blank" rel="noopener noreferrer">
        #3
      </a>
    </>
  ),
  "wax-seed": (
    <>
      Deliver to{" "}
      <a href={`${MAPGENIE}522609`} target="_blank" rel="noopener noreferrer">
        Cesareo
      </a>{" "}
      in <em>The Severed Tower.</em>
    </>
  ),
}
