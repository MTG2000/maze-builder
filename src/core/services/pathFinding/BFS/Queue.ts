export default class Queue<T> {
  queue: T[];
  constructor() {
    this.queue = [];
  }

  empty() {
    return this.queue.length === 0;
  }

  enqueue(item: T) {
    this.queue.push(item);
  }

  dequeue() {
    return this.queue.shift();
  }
}
