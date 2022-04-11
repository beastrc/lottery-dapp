import React from "react";

import PastGame from "./PastGame";

import { Card } from "semantic-ui-react";

const pastGame = props => (
  <Card.Group itemsPerRow={3}>
    {props.games.map((game, index) => (
      <PastGame
        key={index}
        index={index}
        luckyNumber={game.luckyNumber}
        jackpot={game.jackpot}
        numberOfWinners={game.numberOfWinners}
        numberOfParticipants={game.numberOfParticipants}
        endBlock={game.endBlock}
        drawBlock={game.drawBlock}
      />
    ))}
  </Card.Group>
);

export default pastGame;
