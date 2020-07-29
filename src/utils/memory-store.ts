export class MemoryStore {
  hits: Map<string, number>;
  constructor(clearPeriod: number) {
    this.hits = new Map();
    setInterval(this.reset.bind(this), clearPeriod);
  }

  incr(key: string): number {
    let counter = this.hits.get(key) || 0;
    counter++;
    this.hits.set(key, counter);
    return counter;
  }

  reset(): void {
    this.hits.clear();
  }
}
