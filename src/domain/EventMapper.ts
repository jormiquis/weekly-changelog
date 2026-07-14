import type { Activity } from "./Activity.js"

export interface EventMapper {
  canHandle(event: any): boolean
  map(event: any): Activity
}