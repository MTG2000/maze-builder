# Maze Builder

A Web Application that allows you to build a maze with extra special effects ( Holes, Portals, Start/End flags ) and includes options to control the grid properties ( show borders, dimensions ).
then when you are done, it will find the shortest path between a start & end point of your choosing.

### Technologies

The Application is Built using:

- React Js: A modern Front-End Framework
- TypeScript: A strict syntactical superset of JavaScript.
- Redux: One of the mostly used state-management tools
- Material-UI: A componets library built for ReactJs that uses Material-Design

The process of finding the shortest path between 2 points is implemented using BFS algorithm, but if you check the code, you will see that there is also a Prolog implementation for finding the shortest path, but you can ignore it ( it is for a university project 😁 ).

### Demo

you can play with the demo [Here](mtg2000.github.io/maze-builder)

### Running the App Locally

To Run the app locally you need to install NodeJs on your machine,
then after cloning the code, you need to run

```
npm install
```

to install the dependencies and devDependencies required for the app.

then run

```
npm start
```

The App is now up and running on "localhost:8080" and you can open it with any browser.
