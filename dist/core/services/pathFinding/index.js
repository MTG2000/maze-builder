import __SNOWPACK_ENV__ from '../../../../__snowpack__/env.js';
import.meta.env = __SNOWPACK_ENV__;

import {parseGridTo2DArray} from "./parser.js";
import Graph from "./BFS/graph.js";
import {bfs as bfs2} from "./BFS/bfs.js";
export async function findPath(grid, start, end, dimension, accuracy = 1) {
  const girdArray = parseGridTo2DArray(grid);
  if (import.meta.env.MODE === "production ") {
    return useBFS(girdArray, start, end, dimension);
  }
  return await useProlog(girdArray, start, end, dimension, accuracy);
}
function useBFS(girdArray, start, end, dimension) {
  const graph2 = new Graph(dimension, dimension);
  graph2.buildFrom2DArray(girdArray, dimension);
  return bfs2(graph2, start, end);
}
async function useProlog(gridArray, start, end, dimension, accuracy) {
  let portals = [];
  let knowledgeBase = "";
  for (let i = 0; i < gridArray.length; i++) {
    if (gridArray[i])
      knowledgeBase = knowledgeBase.concat(`vertex(${i}).
`);
    if (gridArray[i] === 8)
      portals.push(i);
  }
  knowledgeBase = knowledgeBase.concat("portal(-1).\n");
  for (const p of portals) {
    knowledgeBase = knowledgeBase.concat(`portal(${p}).
`);
  }
  knowledgeBase = knowledgeBase.concat(`
        :- use_module(library(lists)).
 
        validTile(X,Y):- vertex(Y), X \\= Y.
        path(X,Y):- portal(X), portal(Y), validTile(X,Y).
        path(X,Y):- validTile(X,Y),X is Y+1, \\+(0 is mod(X,${dimension})).
        path(X,Y):- validTile(X,Y),X is Y-1, \\+(0 is mod(Y,${dimension})).
        path(X,Y):- validTile(X,Y),X is Y-${dimension}.
        path(X,Y):- validTile(X,Y),X is Y+${dimension}.

        find(S,E,Visited,Result):-path(S,E),reverse(Visited,Temp),append(Temp,[S,E],Result).
        find(S,E,Visited,R) :-
            path(S,A),
            \\+(member(A,Visited)),
            find(A,E,[S|Visited],R).
  `);
  try {
    const res = await fetch("http://localhost:5000/find", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        limit: dimension * dimension * accuracy,
        knowledgeBase,
        query: `find(${start},${end},[${start}],Result).`
      })
    });
    const data = await res.json();
    console.log(data);
    if (data.error) {
      alert(data.error.msg);
      return {path: []};
    }
    return {path: data.path || []};
  } catch (error) {
    alert("An Error Occured, Please Try Again");
    return {path: []};
  }
}
