
export abstract class SourceRetriever {
    abstract fetch(): Promise<any[]>
}