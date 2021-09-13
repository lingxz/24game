import React, { useState } from "react";
import { api } from "../LobbyAPI";
import { DEFAULT_PORT, APP_PRODUCTION, API_URL } from "../../config";
import { Link, useHistory } from "react-router-dom";

const { origin, protocol, hostname } = window.location;
const SERVER_URL = APP_PRODUCTION ? API_URL : `${protocol}//${hostname}:${DEFAULT_PORT}`;

const CreateMatch = () => {
  const history = useHistory();
  const [player, setPlayer] = useState("0");
  const [clicked, setClicked] = useState(false);
  const [matchID, setMatchID] = useState("");
  const [error, setError] = useState("");

  const onClick = () => {
    setClicked(true);
    api.createMatch()
      .then((id) => setMatchID(id))
      .catch((err) => setError(err.toString()));
  };

  return (
    <div>
      <div className="row flex-center">
        <div className="col flex-initial">
          <button disabled={clicked} onClick={onClick}>
            Create match
          </button>
        </div>
        <div className="col flex-initial">
          <fieldset className="form-group">
            <label className="paper-radio">
              <input
                type="radio"
                value="Player 1"
                checked={player === "0"}
                onChange={() => setPlayer("0")}
              />
              <span>as Player 1</span>
            </label>
            <label className="paper-radio">
              <input
                type="radio"
                value="Player 2 (no difference)"
                checked={player === "1"}
                onChange={() => setPlayer("1")}
              />
              <span>as Player 2 (no difference)</span>
            </label>
          </fieldset>
        </div>
        {/* Push history so that the back button works. */}
        {matchID && history.push(`/join/${matchID}/${player}`)}
      </div>
      {error && (
        <div className="row flex-center">
          <div className="col no-padding">
            <div className="alert alert-danger">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
};




const Credits = () => (
  <div className="row flex-center">
    <div className="col" style={{ textAlign: "center" }}>
      <p>
        Made with by Lingyi
      </p>
      <p>Explore the project on <a target="_blank" href="https://github.com/lingxz/24game">GitHub</a></p>
    </div>
  </div>
);

const HelpLink = () => (
  <div className="row flex-center">
    <div className="col flex-initial">
      <Link to="/help" className="no-underline">
        <button>How to play</button>
      </Link>
    </div>
    <div className="col flex-initial">
      <p>Learn the rules!</p>
    </div>
  </div>
);


const Home = () => (
  <div className="row flex-center">
    <div className="col no-padding">
      <div style={{ textAlign: "center" }}>
        <h1>24 game</h1>
      </div>
      <HelpLink />
      <CreateMatch />
      <Credits />
    </div>
  </div>
);

export default Home;