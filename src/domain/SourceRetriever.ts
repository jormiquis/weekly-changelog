import type { Activity } from "./Activity.js";

export abstract class SourceRetriever {
     abstract fetchAll(): Promise <any[]>;
     abstract mapToActivity(raw: any[]): Activity[];

     filterByWeek(activities: Activity[]): Activity[] {
         return activities.filter(activity => activity.hasBeenCreatedOnLastWeek());
     }

     async retrieve(): Promise<Activity[]> {
          const all = await this.fetchAll();
          const activities = this.mapToActivity(all);

          return this.filterByWeek(activities);
     }
}