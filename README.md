# Gambling Experiment

## Scientific Objective
To investigate the cognitive and economic dynamics of decision-making under unfolding uncertainty in an in-game betting scenario. The task isolates how agents update subjective beliefs (Bayesian processing) and adjust financial commitments (Risk Management) as information transitions from ambiguous to certain. This design incorporates proper scoring rules (Brier scoring) to incentivize truthful belief reporting, enabling measurement of calibration and overconfidence.

## Task Mechanics
- **Structure**: A sequential "Player vs. House" dice accumulation game.
- **Pre-Experiment**: The Canadian Problem Gambling Index (CPGI) questionnaire (Ferris & Wynne, 2001).
- **Stimuli**: Two 6-sided dice (one for Player, one for House).
- **State Space**: Information is displayed as the Cumulative Sum of all rolls to date.
- **Trial Structure**: Fixed horizon of 3 stages per trial.
- **Trial Count**: 10 trials total.
- **Payout Structure**: Base payment of $3.00 + performance-based bonus tied to wealth and accuracy.

## Trial Progression
Each session follows a strictly defined sequence:

1. **Welcome & Questionnaire**:
   - Participant sees a welcome screen.
   - Participant completes the 9-item Canadian Problem Gambling Index (CPGI).
   - Responses are recorded (0-3 scale) and a total score is calculated.

2. **Instructions**:
   - Three screens explaining the game rules, accuracy scoring, and payout formula.

3. **Initialization (The Ante)**:
   - The Player is automatically "opted in" with a mandatory 15-point Ante, immediately deducted from wealth and added to the current bet.

4. **Sequential Stages (t = 1 to 3)**:
   For each stage:
   - **Action Phase**: Player adjusts their stake. Incremental changes are constrained to:
     - **Add**: Increase bet by 5 points (deducted immediately).
     - **Hold**: Keep the current bet constant.
     - **Retract**: Decrease bet by 5 points (refunded immediately).
   - **Belief Elicitation**: Player reports subjective P(Win) on a 0–100% scale.
   - **Information Phase**: Dice are rolled and displayed. Cumulative sums update ($S_{Player}$ vs. $S_{House}$).

5. **Resolution**:
   - If $S_{Player} > S_{House}$: Player wins 2× Final Bet.
   - If $S_{Player} \leq S_{House}$: Player loses Final Bet (already deducted).
   - Wealth is updated with winnings only (losses were deducted incrementally).

## Brier Scoring & Payout System

### Accuracy Measurement
- After each trial, **Brier scores** are calculated for all three belief reports.
- **Brier Score**: $(p - outcome)^2$, where $p$ is reported probability (0–1) and outcome is 1 (win) or 0 (loss).
- **Accuracy Score**: $1 - \text{Brier Score}$ (higher is better, range 0–1).

### Payment Formula
At experiment completion:
- **Final Wealth**: Total points accumulated across all 10 trials.
- **Mean Accuracy**: Average of all 30 Accuracy Scores (3 per trial × 10 trials).
- **Performance Reward**: $\frac{\text{Wealth} \times \text{Mean Accuracy}}{100}$
- **Total Payment**: $3.00 + \text{Performance Reward}$

### Incentive Properties
- **Truthful Reporting**: Brier scoring is a proper scoring rule—maximizing expected accuracy requires reporting true beliefs.
- **Dual Optimization**: Players must both maximize wealth (betting strategy) and accuracy (calibration).
- **Overconfidence Penalty**: Extreme confidence (0% or 100%) that proves incorrect yields zero accuracy for that judgment.

## Economic Parameters
- **Endowment**: Player starts with 300 points.
- **Wealth Dynamics**: Carry-over between trials. Game continues even if wealth reaches 0 (minimum payout: $3.00 base).
- **Expected Value**:
  - Random Agent: EV < 0 (both wealth and accuracy suffer).
  - Bayesian Agent: EV > 0 (optimal under both metrics).

## Key Manipulations & Measures
- **Volatility**: The 3-stage design ensures P(Win) fluctuates significantly across stages.
- **Asymmetric Sensitivity**: Do players add money in "Good" states at the same rate they remove money in "Bad" states?
- **The Sunk Cost Test**: In trials where P(Win) drops below 50%, does the player immediately Retract?
- **Calibration vs. Resolution**: Does high accuracy come from good discrimination or hedging near 50%?
- **Inertia Effects**: Do gains and losses in preceding trials impact current betting behavior?
- **Loss Aversion**: What objective and subjective win probabilities are required for players to increase bets?
- **Bayesian Optimality**: How closely do human subjective probabilities match Bayes-optimal probabilities?
- **Problem Gambling Severity**: How does CPGI score correlate with risk-taking and calibration?

## Technical Details

### Stack
- **HTML5**: Structure and layout.
- **CSS3**: Styling (Vanilla, dark mode theme).
- **JavaScript (ES6+)**: Game logic, Brier scoring, and DOM manipulation.

### Project Structure
- `index.html`: Main entry point with Welcome, Questionnaire, Instructions, and Game interfaces.
- `css/`:
  - `style.css`: All visual styling with dark theme and dice animations.
- `js/`:
  - `main.js`: Application entry point and initialization.
  - `game.js`: Core game loop, state management, questionnaire logic, and Brier score calculation.
  - `ui.js`: DOM updates, event handling, and dice animations.
  - `math.js`: Bayesian probability calculations and Brier scoring functions.
  - `logger.js`: Data logging and CSV export with full trial history.

### Data Output
The experiment logs comprehensive data including:
- **Questionnaire**: Individual CPGI item responses (Q1-Q9) and Total Score.
- Trial-by-trial outcomes and wealth changes.
- Stage-by-stage actions, beliefs, and dice rolls.
- Ground-truth probabilities (Bayesian optimal).
- Brier scores and Accuracy scores for each judgment.
- Final aggregate metrics (mean accuracy, performance reward).

### Usage
1. Clone the repository.
2. Open `index.html` in a modern web browser.
3. Complete the Welcome screen and Questionnaire.
4. Read through the three instruction screens.
5. Complete 10 trials of the dice game.
6. Review payout breakdown and download CSV data.

## Design Rationale
This task bridges behavioral economics and metacognition research by:
1. **Separating Risk Preferences from Belief Accuracy**: The "pay as you go" betting structure and proper scoring independently measure risk tolerance and calibration.
2. **Incentivizing Honesty**: Brier scoring eliminates strategic misreporting of beliefs.
3. **Measuring Bayesian Updating**: Ground-truth probabilities are calculable, allowing direct comparison with human judgments.
4. **Testing Heuristics vs. Rationality**: Sequential revelation tests whether humans exhibit optimal stopping, sunk cost fallacies, or gambler's fallacies.
