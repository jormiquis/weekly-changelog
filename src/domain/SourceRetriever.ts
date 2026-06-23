import type { Activity } from "./Activity.js";

export abstract class SourceRetriever {
     abstract fetchAll(): Promise<any[]>;
     abstract mapToActivity(raw: any[]): Activity[];

     filterByWeek(activities: Activity[]): Activity[] {
         return activities.filter(activity => activity.hasBeenCreatedOnLastWeek());
     }
}