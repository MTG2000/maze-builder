class Graph {
  width: number;
  height: number;
  adjacencyList: {
    [key: number]: number[];
  };
  vertexCount: number;
  edgesList: [number, number][] = [];
  portals: number[] = [];

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

  buildFrom2DArray(array: number[], dimension: number) {
    const getVertexNeighbors = (v: number) => {
      let neighobrs: number[] = [];
      if (!array[v]) return neighobrs;

      if (v % dimension !== 0 && array[v - 1])
        // not first column
        neighobrs.push(v - 1);
      if (v % dimension !== dimension - 1 && array[v + 1])
        // not last column
        neighobrs.push(v + 1);
      if (v >= dimension && array[v - dimension])
        // not first row
        neighobrs.push(v - dimension);
      if (v + dimension < dimension * dimension && array[v + dimension])
        // not last row
        neighobrs.push(v + dimension);

      return neighobrs;
    };

    for (let i = 0; i < dimension * dimension; i++) {
      if (array[i] === 8) {
        this.portals.push(i);
      }
      for (const neighbor of getVertexNeighbors(i)) {
        this.addEdge(i, neighbor);
        this.edgesList.push([i, neighbor]);
      }
    }

    for (const portal of this.portals) {
      for (let i = 0; i < this.portals.length; i++) {
        const otherPortal = this.portals[i];
        if (portal !== otherPortal) {
          this.addEdge(portal, otherPortal);
        }
      }
    }
  }
}

export default Graph;
