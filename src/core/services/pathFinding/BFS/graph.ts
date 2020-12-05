class Graph {
  width: number;
  height: number;
  adjacencyList: {
    [key: number]: number[];
  };
  vertexCount: number;
  constructor(width: number, height: number) {
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

  edgeExists(first: number, second: number) {
    return this.adjacencyList[first].some((neighbor) => neighbor === second);
  }

  getIncidentEdges(vertex: number) {
    return this.adjacencyList[vertex].map((neighbor) => ({
      first: vertex,
      second: neighbor,
      weight: 1,
    }));
  }

  addEdge(firstVertex: number, secondVertex: number) {
    this.adjacencyList[firstVertex].unshift(secondVertex);
  }

  buildFrom2DArray(array: number[], length: number) {
    const getVertexNeighbors = (v: number) => {
      let neighobrs: number[] = [];
      if (!array[v]) return neighobrs;

      if (v % length !== 0 && array[v - 1])
        // not first column
        neighobrs.push(v - 1);
      if (v % length !== length - 1 && array[v + 1])
        // not last column
        neighobrs.push(v + 1);
      if (v >= length && array[v - length])
        // not first row
        neighobrs.push(v - length);
      if (v + length < length * length && array[v + length])
        // not last row
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
