import { create, all } from 'mathjs'
import { INVALID_MOVE } from 'boardgame.io/core';
import { GAME_NAME } from "../config";
import { solve } from "./Solver";

const math = create(all, {});

/* ---- Setup ---- */
const setup = ({ includeFaceCards }) => {
  const maxNumber = includeFaceCards ? 13 : 10;
  const deck = [];
  for (let i = 1; i <= maxNumber; i++) {
    for (let j = 0; j < 4; j++) {
      deck.push(i);
    }
  }
  shuffle(deck);
  const first = deck.slice(0, deck.length / 2);
  const second = deck.slice(deck.length / 2)
  const players = {};
  players["0"] = {
    id: "0",
    name: "player0",
    deck: first,
    ready: false,
    giveUp: false,
    status: "",
  }
  players["1"] = {
    id: "1",
    name: "player1",
    deck: second,
    ready: false,
    giveUp: false,
    status: "",
  }
  return {
    players: players,
    winner: { name: "", id: "-1" },
    logs: ["Game created"],
    target: 24,
    currentCards: null,
    currentCardsAnswer: null,
    playerSolution: null,
  };
};

const changeNames = (G, ctx, playerList) => {
  for (let i = 0; i < playerList.length; i++) {
    G.players[`${i}`].name = playerList[i].name;
  }
};

function isNumber(c){
  return !isNaN(parseInt(c, 10));
}

const areNumbersInExpr = (expr, cards) => {
  const numbersInExpr = [];
  let currentNumber = "";
  for (const ch of expr) {
    const chIsNumber = isNumber(ch);
    if (chIsNumber) {
      currentNumber += ch;
    } else if (!chIsNumber && currentNumber.length === 0) {
      continue;
    } else if (!chIsNumber && currentNumber.length > 0) {
      numbersInExpr.push(parseInt(currentNumber));
      currentNumber = "";
    }
  }

  if (currentNumber.length > 0) {
    numbersInExpr.push(parseInt(currentNumber));
  }
  numbersInExpr.sort();
  const sortedCards = [...cards].sort();
  if (numbersInExpr.length !== sortedCards.length) {
    return false;
  }

  for (let i = 0; i < sortedCards.length; i++) {
    if (numbersInExpr[i] !== sortedCards[i]) {
      return false;
    }
  }
  return true;
}

/* ---- Actions ---- */
const submitAnswer = (G, ctx, expr) => {
  // TODO Check submitted expr is a math expression only
  // TODO Check only 4 operations.
  if (!areNumbersInExpr(expr, G.currentCards)) {
    return INVALID_MOVE;
  }
  const result = math.evaluate(expr);
  if (result === G.target) {
    // The loser gets all the cards.
    const slowerPlayer = ctx.playerID === "0" ? "1" : "0";
    G.playerSolution = expr;
    G.players[slowerPlayer].deck = G.players[slowerPlayer].deck.concat(G.currentCards);
    // G.currentCards = null;
    // G.currentCardsAnswer = null;
    // End turn.
    G.players[ctx.playerID].status = `You got it right! ${expr}=${G.target}!`;
    G.players[slowerPlayer].status = `Too slow! Your opponent got the answer ${expr}.`;
    
    for (const player of Object.values(G.players)) {
      player.giveUp = false;
      player.ready = false;
    };
    ctx.events.endTurn();
  } else {
    // G.players[ctx.playerID].status = `That's not right, ${expr} is not ${G.target}!`;
    G.players[ctx.playerID].status = "wrong";
  }
}

const dealCards = (G) => {
  let toRemoveFromFirstPlayer;
  let toRemoveFromSecondPlayer;
  if (G.players["0"].deck.length < 2) {
    toRemoveFromFirstPlayer = G.players["0"].deck.length;
    toRemoveFromSecondPlayer = 4 - toRemoveFromFirstPlayer;
  } else if (G.players["1"].deck.length < 2) {
    toRemoveFromSecondPlayer = G.players["1"].deck.length;
    toRemoveFromFirstPlayer = 4 - toRemoveFromSecondPlayer;
  } else {
    toRemoveFromFirstPlayer = 2;
    toRemoveFromSecondPlayer = 2;
  }

  const cards1 = G.players["0"].deck.splice(0, toRemoveFromFirstPlayer);
  const cards2 = G.players["1"].deck.splice(0, toRemoveFromSecondPlayer);
  const cards = cards1.concat(cards2);
  const ans = solve(cards, G.target);
  if (ans) {
    G.currentCards = cards;
    G.currentCardsAnswer = ans;
  } else {
    // Add the cards back, reshuffle, and deal again.
    G.players["0"].deck = G.players["0"].deck.concat(cards1);
    G.players["1"].deck = G.players["1"].deck.concat(cards2);
    shuffle(G.players["0"].deck);
    shuffle(G.players["1"].deck);
    dealCards(G);
  }
}

const getReady = (G, ctx) => {
  G.players[ctx.playerID].ready = true;
  if (Object.values(G.players).filter(player => player.ready).length === Object.keys(G.players).length) {
    console.log("Everyone is ready");
    // everyone is ready
    // Empty status logs
    G.players["0"].status = "";
    G.players["1"].status = "";
    // Move everyone to the next stage to play
    ctx.events.setActivePlayers({ all: "play" });
    // Reset everyone to not ready. 
    for (const player of Object.values(G.players)) {
      player.ready = false;
    };
    dealCards(G);
  } else {
    G.players[ctx.playerID].status = "Waiting for opponent to be ready..."
  }
}

const returnCards = (G) => {
  const first2 = G.currentCards.slice(0, 2);
  const last2 = G.currentCards.slice(2);
  G.players["0"].deck = G.players["0"].deck.concat(first2);
  G.players["1"].deck = G.players["1"].deck.concat(last2);
  // Clear cards.
  // G.currentCards = null;
  // G.currentCardsAnswer = null;
}

const giveUp = (G, ctx) => {
  G.players[ctx.playerID].giveUp = true;
  if (Object.values(G.players).filter(player => player.giveUp).length === Object.keys(G.players).length) {
    // everyone has given up

    G.players["0"].status = `Nobody got the answer, it is ${G.currentCardsAnswer}`;
    G.players["1"].status = `Nobody got the answer, it is ${G.currentCardsAnswer}`;
    
    // Put cards back into their decks.
    returnCards(G);
    // Reset everyone to giveUp = false. 
    for (const player of Object.values(G.players)) {
      player.giveUp = false;
    };

    // End turn so that we move on.
    ctx.events.endTurn();
  } else {
    G.players[ctx.playerID].status = "You gave up, waiting for opponent to solve."
  }
}


// Copied from stackoverflow https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
  var currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

const isVictory = (players) => {
  for (const player of players) {
    // Player wins when he runs out of cards.
    return player.deck.length === 0;
  }
}

const getWinner = (players) => {
  for (const player of players) {
    if (player.deck.length === 0) {
      return player.id;
    }
  }
}

export const Get24 = {
  name: GAME_NAME,
  setup: setup,
  moves: { changeNames },
  turn: {
    // Called at the beginning of a turn.
    onBegin: (G, ctx) => {
      ctx.events.setActivePlayers({ all: "wait" });
    },
    stages: {
      wait: {
        moves: { getReady }
      },
      play: { 
        moves: { submitAnswer, giveUp }
      },
    },
    // Called at the end of a turn.
    onEnd: (G, ctx) => {
      if (isVictory(Object.values(G.players))) {
        console.log("end game!!");
        ctx.events.endGame({ winner: getWinner(Object.values(G.players)) });
      }
    },
  },
  minPlayers: 2,
  maxPlayers: 2,
  disableUndo: true,
};