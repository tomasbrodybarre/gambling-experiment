# Gambling Experiment

## Scientific Objective
To investigate the cognitive and economic dynamics of decision-making under unfolding uncertainty, in an in-game betting scenario. The task isolates how agents update subjective beliefs (Bayesian processing) and adjust financial commitments (Risk Management) as information transitions from ambiguous to certain. Key latent variables include Loss Aversion, Sunk Cost Sensitivity, and Belief Inertia.

## Task Mechanics
- **Structure**: A sequential "Player vs. House" accumulation game.
- **Stimuli**: Two 6-sided dice (one for Player, one for House).
- **State Space**: Information is displayed as the Cumulative Sum of all rolls to date.
- **Trials structure**: Fixed horizon of 3 stages per trial.
- **Trial Count**: Currently configured for 10 trials per block.

## Trial Progression
Each trial follows a strictly defined sequence:

1.  **Initialization (The Ante)**:
    - The Player is automatically "opted in" with a mandatory 20¢ Ante.
    - Current Bet $b_0 = 20¢$.

2.  **Sequential Stages (t = 1 to 3)**:
    - **Information Phase**: Dice are rolled. The screen displays the new result of the rolls and the new Cumulative Sums ($S_{Player}$ vs. $S_{House}$).
    - **Action Phase (Only for t < 3)**: Player adjusts their stake relative to the previous stage. They are constrained to incremental changes:
        - **Add**: Add 10¢ to the pot.
        - **Hold**: Keep the current pot constant.
        - **Retract**: Remove 10¢ from the pot (provided $b_t > 0$).
    - **Belief Elicitation (Only for t < 3)**: Player reports subjective P(Win) (0–100%).

3.  **Resolution**:
    - If $S_{Player} > S_{House}$: Player wins 2x Final Bet (Net Profit = Final Bet).
    - If $S_{Player} \le S_{House}$: Player loses Final Bet (Net Profit = -Final Bet).
    - Outcomes are added/subtracted from the Cumulative Wealth Pool.

## Economic Parameters
- **Endowment**: Player starts with $5.00 USD (500 cents) in their wealth pool.
- **Wealth Dynamics**: Carry-over between trials. The game terminates if the wealth pool reaches $0.
- **Expected Value (EV)**:
    - Random Agent: EV < 0.
    - Bayesian Agent: EV > 0.

## Key Manipulations & Measures
- **Volatility**: The 3-stage design ensures P(Win) fluctuates significantly.
- **Asymmetric Sensitivity**: Do players add money in "Good" states at the same rate they remove money in "Bad" states?
- **The Sunk Cost Test**: In trials where P(Win) drops below 50% after the Ante, does the player immediately Retract?
- **Inertia effects**: Do gains and losses in preceding trials impact current betting behavior?
- **Loss aversion**: What does a player’s objective and subjective win probability need to be for them to bet money?
- **Bayes optimality**: How close do human subjective probabilities match Bayes optimal probabilities?

## Technical Details

### Stack
- **HTML5**: Structure and layout.
- **CSS3**: Styling (Vanilla).
- **JavaScript (ES6+)**: Game logic and DOM manipulation.

### Project Structure
- `index.html`: Main entry point for the application.
- `css/`: Contains `style.css` for all visual styling.
- `js/`:
    - `main.js`: Application entry point and initialization.
    - `game.js`: Core game loop and state management.
    - `ui.js`: DOM updates and event handling.
    - `math.js`: Probability calculations and Bayesian updating logic.
    - `logger.js`: Data logging for experiment results.
- `tests/`: Python and JS scripts for verifying math and logic.

### Usage
1.  Clone the repository.
2.  Open `index.html` in a modern web browser.
3.  Follow the on-screen instructions to participate in the experiment.
