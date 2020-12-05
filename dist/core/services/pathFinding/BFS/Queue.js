export default class Queue {
  constructor() {
    this.queue = [];
  }
  empty() {
    return this.queue.length === 0;
  }
  enqueue(item) {
    this.queue.push(item);
  }
  dequeue() {
    return this.queue.shift();
  }
}
