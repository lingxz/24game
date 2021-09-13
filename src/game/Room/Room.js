import React, { useState, useEffect, useRef } from "react";
import { Prompt, useParams } from "react-router-dom";
import { Client } from "boardgame.io/react";
import { SocketIO } from "boardgame.io/multiplayer";
import { DEFAULT_PORT, APP_PRODUCTION, API_URL } from "../../config";
import { Get24 } from "../Game";
import { Get24Board } from "../Board";
import { api } from "../LobbyAPI";

const STORAGE_KEY = "get24";
const CAPACITY = 10;

const { origin, protocol, hostname } = window.location;
const SERVER_URL = APP_PRODUCTION ? API_URL : `${protocol}//${hostname}:${DEFAULT_PORT}`;

/** Load the queue from localStorage. */
const loadQueue = () => {
  let queue = null;
  try {
    queue = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "");
  } catch {} // Ignore errors.
  if (!Array.isArray(queue)) {
    queue = []; // Initialize the queue.
  }
  return queue;
};


/** Load credentials from localStorage. */
const loadCredentials = (matchID, playerID) => {
  const queue = loadQueue();
  for (const item of queue) {
    if (
      item &&
      item.matchID === matchID &&
      item.playerID === playerID &&
      typeof item.credentials === "string"
    ) {
      return item.credentials;
    }
  }
  return null;
};

/** Save credentials to localStorage. */
const saveCredentials = (matchID, playerID, credentials) => {
  const queue = loadQueue();
  queue.push({ matchID, playerID, credentials });
  while (queue.length > CAPACITY) {
    queue.shift();
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};


const ShareLink = ({ matchID, playerID }) => {
  const inputRef = useRef(null);
  const opponentID = playerID === "0" ? "1" : "0"
  const url = `${window.location.origin}/join/${matchID}/${opponentID}`;

  const copyToClipboard = (e) => {
    if (inputRef.current && document.queryCommandSupported("copy")) {
      inputRef.current.select();
      document.execCommand("copy");
      e.target.focus();
    }
  };

  return (
    <div className="row flex-center">
      <div className="col no-padding">
        <div className="form-group">
          <label>Share this link with your opponent:</label>
          <input
            className="input-block"
            type="text"
            readOnly
            value={url}
            ref={inputRef}
            onClick={copyToClipboard}
          />
        </div>
      </div>
    </div>
  );
};


const Modal = ({ matchID, playerID }) => (
  <div>
    <input
      className="modal-state"
      id="modal-1"
      type="checkbox"
      defaultChecked
    />
    <div className="modal">
      {
        // Uncomment to enable the modal background.
        // TypeScript doesn't like custom attributes, so we need to ignore the following line.
        //@ts-ignore
        //<label className="modal-bg" for="modal-1"></label>
      }
      <div className="modal-body">
        <div className="row flex-center">
          <div className="col no-padding">
            <h4 className="modal-title">
              You are: Player {playerID}
            </h4>
          </div>
        </div>
        <ShareLink matchID={matchID} playerID={playerID} />
        <div className="row flex-center">
          <div className="col no-padding">
            {
              // TypeScript doesn't like custom attributes, so we need to ignore the following line.
              //@ts-ignore
              <label for="modal-1" class="modal-link">
                Dismiss
              </label>
            }
          </div>
        </div>
      </div>
    </div>
  </div>
);


const Room = () => {
  const { matchID, playerID } = useParams();
  const [credentials, setCredentials] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const creds = loadCredentials(matchID, playerID);
    if (creds) {
      setCredentials(creds);
    } else {
      api.joinRoom(matchID, playerID)
        .then((creds) => {
          saveCredentials(matchID, playerID, creds);
          setCredentials(creds);
        })
        .catch((err) => setError(err.toString()));
    }
  }, [matchID, playerID]);

  const Get24Client = Client({ 
    game: Get24, 
    board: Get24Board,
    numPlayers: 2,
    multiplayer: SocketIO({server: SERVER_URL})
  });

  return (
    <div>
      <div className="row flex-center">
        <div className="col no-padding">
          {credentials && (
            <div className="row flex-center">
              <div className="col no-padding">
                <Get24Client
                  matchID={matchID}
                  playerID={playerID}
                  credentials={credentials}
                  debug={false}
                />
              </div>
            </div>
          )}
          {error && (
            <div className="alert alert-danger margin-top">{error}</div>
          )}
          {credentials && <ShareLink matchID={matchID} playerID={playerID} />}
          {credentials && <Modal matchID={matchID} playerID={playerID} />}
        </div>
      </div>
      <Prompt message="Are you sure you want to leave?" />
    </div>
  );
};

export default Room;