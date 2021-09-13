// src/server.js
const { Server, Origins } = require('boardgame.io/server');
const { Get24 } = require('./game/Game');
const { WEB_URL } = require('./config');

const server = Server({
  games: [Get24],
  origins: [Origins.LOCALHOST, WEB_URL],
});

server.run(8000);