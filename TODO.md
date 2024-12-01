# TODO - Features to Implement

## Force Stop at Space
- **Thwamp**: Make the player stop their turn at a specific space (circle) and do an action.  
  - Action type: `FORCE_STOP`

## Move Player Backward
- **Haunter**: Ability to choose another player and move them backward by X spaces.  
  - Action type: `MOVE_PLAYER_BACK` or `MOVE_PLAYER_FORWARD`
  - **Consideration**: Need a way to select the target player (prompt or UI selection)

## Other Actions
- **Skip Turn**: Skip the player's turn for a round.  
  - Action type: `SKIP_TURN`
  
- **Swap Places**: Swap positions of two players on the board.  
  - Action type: `SWAP_PLACES`

- **Change Direction**: A curse that makes the player go backwards along the board until the curse is lifted.  
  - Action type: `CHANGE_DIRECTION`
  - **Consideration**: Need a way to lift the curse

- **Mini Game**: Add a mini-game feature that challenges all players (e.g., reaction time test, clicking challenge).  
  - Action type: `MINI_GAME`
  - **Consideration**: Whoever wins, the loser drinks.

- **Teleport**: Ability to teleport a player to a specific space ID.  
  - Action type: `TELEPORT`
  - **Consideration**: Specify destination ID

- **Double Turn**: The player gets an additional immediate turn.  
  - Action type: `DOUBLE_TURN`

- **Freeze Player**: Choose another player to freeze, making them skip their turn.  
  - Action type: `FREEZE_PLAYER`
  - **Consideration**: Is this the same as `SKIP_TURN` for
