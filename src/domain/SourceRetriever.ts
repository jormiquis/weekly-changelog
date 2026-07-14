import type { Activity } from "./Activity.js";
import type { EventMapper } from "./EventMapper.js";

export abstract class SourceRetriever {
     constructor(private readonly mappers: EventMapper[]){}

     abstract fetchAll(): Promise <any[]>;

     mapToActivity(raw: any[]): Activity[] {
          return raw.map(event => {
               const mapper = this.mappers.find(mapper => mapper.canHandle(event));
               return mapper?.map(event);
          }).filter((a): a is Activity => !!a)
     }

     private filterByWeek(activities: Activity[], today: Date): Activity[] {
          return activities.filter(activity => activity.hasBeenCreatedOnLastWeek(today));
     }

     async retrieve(today: Date): Promise<Activity[]> {
          const all = await this.fetchAll();
          const activities = this.mapToActivity(all);

          return this.filterByWeek(activities, today);
     }
}