class Graph {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.adjacencyList = {};
    this.vertexCount = this.width * this.height;
    this._buildAdjacencyList();
  }
  _buildAdjacencyList() {
    for (let i = 0; i < this.vertexCount; i++) {
      this.adjacencyList[i] = [];
    }
  }
  edgeExists(first, second) {
    return this.adjacencyList[first].some((neighbor) => neighbor === second);
  }
  getIncidentEdges(vertex) {
    return this.adjacencyList[vertex].map((neighbor) => ({
      first: vertex,
      second: neighbor,
      weight: 1
    }));
  }
  addEdge(firstVertex, secondVertex) {
    this.adjacencyList[firstVertex].unshift(secondVertex);
  }
  buildFrom2DArray(array, length) {
    const getVertexNeighbors = (v) => {
      let neighobrs = [];
      if (!array[v])
        return neighobrs;
      if (v % length !== 0 && array[v - 1])
        neighobrs.push(v - 1);
      if (v % length !== length - 1 && array[v + 1])
        neighobrs.push(v + 1);
      if (v > length && array[v - length])
        neighobrs.push(v - length);
      if (v + length < length * length && array[v + length])
        neighobrs.push(v + length);
      return neighobrs;
    };
    let portals = [];
    for (let i = 0; i < length * length; i++) {
      if (array[i] === 8) {
        portals.push(i);
      }
      for (const neighbor of getVertexNeighbors(i)) {
        this.addEdge(i, neighbor);
      }
    }
    for (const portal of portals) {
      for (let i = 0; i < portals.length; i++) {
        const otherPortal = portals[i];
        if (portal !== otherPortal) {
          this.addEdge(portal, otherPortal);
        }
      }
    }
  }
}
export default Graph;
