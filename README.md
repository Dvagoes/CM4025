# CM4025
 
This repository contains the code for the Justice for Ugly Animals website.
This website contains a post wall with commenting, as well as a simple game. There is also a profile page and login functionality to tie this all together.

To run the website, set up a .env with a port and a mongodb database address, then use the commands 
```
node server.js
```
or
```
npm start
```

server.js contains the vast majority of the server-side code
the views folder contains the ejs templates for constructing the pages, as well as the partials folder for the partial templates
the public folder contains public assets such as stylesheets and images, and is statically referenced by the express router

## API

the publicly accessible API consists of two commands for collecting data on Posts and Users

they can be accessed at ```'/getPosts'``` and ```'/getUserData'```

## Game

the game works as essentially a Higher or Lower game, comparing the Scores of Posts on the website. These scores are the number of likes given by the website's users to the posts. This is done using JQuery that can be found in the game.ejs file
