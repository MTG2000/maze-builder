import { Tile } from 'src/core/models/Tile';
import { parseGridTo2DArray } from './parser';
import Graph from './BFS/graph';
import { bfs } from './BFS/bfs';

export async function findPath(
  grid: (Tile | null)[],
  start: number,
  end: number,
  dimension: number,
  accuracy: number = 1,
) {
  // Parsing to graph structure
  const girdArray = parseGridTo2DArray(grid);
  const graph = new Graph(dimension, dimension);
  graph.buildFrom2DArray(girdArray, dimension);

  if (import.meta.env.MODE === 'production') {
    return useBFS(graph, start, end);
  }

  // This is only to use if you have a prolog backend ( Ignore it )
  return await useProlog(graph, start, end, dimension, accuracy);
}

function useBFS(graph: Graph, start: number, end: number) {
  return bfs(graph, start, end);
}
async function useProlog(
  graph: Graph,
  start: number,
  end: number,
  dimension: number,
  accuracy: number,
) {
  // ***
  // Build Knowledge Base

  let knowledgeBase = '';

  // Create the path(s) knowledge base
  for (let i = 0; i < graph.edgesList.length; i++) {
    const [v1, v2] = graph.edgesList[i];
    knowledgeBase = knowledgeBase.concat(`path(${v1},${v2}).\n`);
  }

  // Create the portal(s) knowledge base
  for (let i = 0; i < graph.portals.length; i++) {
    knowledgeBase = knowledgeBase.concat(`portal(${graph.portals[i]}).\n`);
  }

  // Rules
  knowledgeBase = knowledgeBase.concat(`
        :- use_module(library(lists)).
 
        
        portal(-1).
        portalPath(X,Y) :- portal(X), portal(Y), X\\=Y.

        startSearch(Start,End,Result) :- find(Start,End,[],Result,0).


        find(S,E,Visited,Result,_) :- path(S,E), reverse(Visited,Temp), append(Temp,[S,E],Result).
        find(S,E,Visited,Result,EnteredPortal) :-
            ( 
                EnteredPortal is 0 ,
                portalPath(S,X),
                \\+(member(X,Visited)),
                 find(X,E,[S|Visited],Result,1)
            )
            ;
            ( 
               path(S,X) ,
               \\+(member(X,Visited)),
               find(X,E,[S|Visited],Result,EnteredPortal) 
            ).
  `);

  // Get The right num of answers & return the shortest
  try {
    const res = await fetch('http://localhost:5000/find', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: dimension * dimension * accuracy,
        knowledgeBase,
        query: `startSearch(${start},${end},Result).`,
      }),
    });

    const data = await res.json();
    console.log(data);

    if (data.error) {
      alert(data.error.msg);
      return { path: [] };
    }
    return { path: data.path || [] };
  } catch (error) {
    alert('An Error Occured, Please Try Again');
    return { path: [] };
  }
}
