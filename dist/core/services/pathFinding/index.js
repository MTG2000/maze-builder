import __SNOWPACK_ENV__ from '../../../../__snowpack__/env.js';
import.meta.env = __SNOWPACK_ENV__;

import {parseGridTo2DArray} from "./parser.js";
import Graph from "./BFS/graph.js";
import {bfs as bfs2} from "./BFS/bfs.js";
export async function findPath(grid, start, end, dimension, accuracy = 1) {
  const girdArray = parseGridTo2DArray(grid);
  const graph2 = new Graph(dimension, dimension);
  graph2.buildFrom2DArray(girdArray, dimension);
  if (import.meta.env.MODE === "production") {
    return useBFS(graph2, start, end);
  }
  return await useProlog(graph2, start, end, dimension, accuracy);
}
function useBFS(graph2, start, end) {
  return bfs2(graph2, start, end);
}
async function useProlog(graph2, start, end, dimension, accuracy) {
  let knowledgeBase = "";
  for (let i = 0; i < graph2.edgesList.length; i++) {
    const [v1, v2] = graph2.edgesList[i];
    knowledgeBase = knowledgeBase.concat(`path(${v1},${v2}).
`);
  }
  for (let i = 0; i < graph2.portals.length; i++) {
    knowledgeBase = knowledgeBase.concat(`portal(${graph2.portals[i]}).
`);
  }
  knowledgeBase = knowledgeBase.concat(`
        :- use_module(library(lists)).
 
        
        
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
  try {
    const res = await fetch("http://localhost:5000/find", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        limit: dimension * dimension * accuracy,
        knowledgeBase,
        query: `startSearch(${start},${end},Result).`
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
