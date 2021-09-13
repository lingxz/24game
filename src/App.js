import { Client } from 'boardgame.io/react';
import { Get24 } from './game/Game';
import { Get24Board } from './game/Board';
import { SocketIO } from 'boardgame.io/multiplayer'
import ReactDOM from "react-dom";
import {
  Redirect,
  Route,
  BrowserRouter as Router,
  Switch,
} from "react-router-dom";
import Home from "./game/Home/Home";
import Room from "./game/Room/Room";
import "../node_modules/papercss/dist/paper.min.css";
import './App.css';


const Get24Client = Client({ 
  game: Get24, 
  board: Get24Board,
  numPlayers: 2,
  multiplayer: SocketIO({server: 'localhost:8000'})
});

const App = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <Home />
        </Route>
        <Route exact path="/join/:matchID/:playerID">
          <Room />
        </Route>
        <Route path="*">
          <Redirect to="/" />
        </Route>
      </Switch>
    </Router>
  )
};
export default App;