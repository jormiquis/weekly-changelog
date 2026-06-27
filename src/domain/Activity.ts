export class Activity {

    constructor(
        private createdAt: Date,
        private metaData: Object
    ) {}

    static create(
        createdAt: Date,
        metaData: Object
    ) {
        return new Activity(createdAt, metaData);
    }

    public hasBeenCreatedOnLastWeek(today: Date): boolean {
          const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
          const diff = today.getTime() - this.createdAt.getTime();

          return diff >= 0 && diff <= sevenDaysInMs
     }
}