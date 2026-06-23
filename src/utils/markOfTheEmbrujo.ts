import markOfTheEmbrujoData from "../data/mark-of-the-embrujo.json"

export interface EmbrujoLocation {
  id: number
  sceneFile: string
  roomHash: number
  url: string | null
}

export const EMBRUJO_LOCATIONS =
  markOfTheEmbrujoData.locations as EmbrujoLocation[]
