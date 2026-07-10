export class Activity {

    constructor(
        private createdAt: Date,
        readonly metaData: Record<string, unknown>
    ) {}

    static create(
        createdAt: Date,
        metaData: Record<string, unknown>
    ) {
        return new Activity(createdAt, metaData);
    }

    public hasBeenCreatedOnLastWeek(today: Date): boolean {
          const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
          const diff = today.getTime() - this.createdAt.getTime();

          return diff >= 0 && diff <= sevenDaysInMs
     }
}