import React, { useState, useEffect } from 'react';

const ActionsBar = ({gameProps, player, stage}) => {
  const [playerSolution, updatePlayerSolution] = React.useState("");

  const handlePlayerSolutionChange = (e) => {
    updatePlayerSolution(e.target.value.trim());
  }

  const submitAnswer = (e) => {
    e.preventDefault();
    gameProps.moves.submitAnswer(playerSolution);
  }

  switch(stage) {
    case "play":
        return player.giveUp ? "" :
        <div className="actions">
          <form className="row flex-center" onSubmit={submitAnswer}>
            <input autoFocus className="input solution-box" type="text" placeholder="your solution" onChange={handlePlayerSolutionChange}/>
          </form>
          <button className="row flex-center" onClick={() => gameProps.moves.giveUp()}>Give up</button>
        </div>;
    case "wait":
      return (
        <div className="actions">
          {player.ready ? "" : <button className="row flex-center" onClick={() => gameProps.moves.getReady()}>I'm ready</button>}
        </div>
      );
    default:
      return ""

  }
};

export const Get24Board = (props) => {
  if (props.ctx.gameover) {
    return (
    <div className="col flex-center">
      <div className="row flex-center">
        <h1>Get24!</h1>
      </div>
      <div className="row flex-center">
        <h3>{props.ctx.gameover.winner === props.playerID ? "You won!": "You lost..."}</h3>
      </div>
    </div>)
  }
  const currentStage = props.ctx.activePlayers[props.playerID];
  const currentPlayer = props.G.players[props.playerID];
  const otherPlayerId = props.playerID === "0" ? "1" : "0";
  const fadeCards = props.G.currentCards !== null && (currentStage !== "play" || currentPlayer.giveUp);
  return (
    <div>
    <div className="col flex-center">
      <div className="row flex-center">
        <h1>Get24!</h1>
      </div>
      <div className="row flex-center">
        <h4>yours: {currentPlayer.deck.length}, opponent's: {props.G.players[otherPlayerId].deck.length}</h4>
      </div>
      <div className={fadeCards ? "status status-float" : "status is-hidden"}><h3>{currentPlayer.status}</h3></div>
      {props.G.currentCards === null ? "" : <div className={fadeCards ? "fade" : ""}>
        <div className="row flex-center flex-spaces child-borders child-shadows-hover">
            <div className="col col-fill no-padding number-card margin">
              <h1>{props.G.currentCards[0]}</h1>
            </div>
            <div className="col col-fill no-padding number-card margin">
              <h1>{props.G.currentCards[1]}</h1>
            </div>
        </div>
        <div className="row flex-center child-borders child-shadows-hover">
            <div className="col flex-center col-fill no-padding number-card margin">
              <h1>{props.G.currentCards[2]}</h1>
            </div>
            <div className="col col-fill no-padding number-card margin">
              <h1>{props.G.currentCards[3]}</h1>
            </div>
        </div>
        </div>}
    </div>
    <div className="col flex-center">
      <ActionsBar gameProps={props} player={currentPlayer} stage={currentStage}/>
      <div className="status"><h3>{fadeCards ? "" : currentPlayer.status}</h3></div>
    </div>
    </div>
  )
};
