/**
 * Game Logic
 * Manages the state of the experiment.
 */

class GameSession {
    constructor(config) {
        this.participantId = config.participantId || this.generateParticipantId();
        this.startWealth = config.startWealth || 500;
        this.ante = config.ante || 20;
        this.betStep = config.betStep || 10;
        this.nTrials = config.nTrials || 10;
        this.nStages = config.nStages || 3;
        this.diceSides = config.diceSides || 6;
        this.startingBias = config.startingBias || 0;
        this.blockSize = 100;

        this.trials = [];
        this.currentTrialIndex = 0;
        this.wealth = this.startWealth;

        // State
        this.state = 'SETUP';
        // Possible States:
        // SETUP, INSTRUCTIONS, TRIAL_START, STAGE_INFO, STAGE_ACTION, STAGE_BELIEF, STAGE_RESULT, TRIAL_END, BLOCK_BREAK, END

        // Current Trial Data
        this.currentTrial = null;
        this.currentStage = 0;
        this.currentBet = 0;
        this.playerSum = 0;
        this.houseSum = 0;
        this.playerRolls = [];
        this.houseRolls = [];

        // Temporary storage for action/belief
        this.lastAction = null;
        this.lastBelief = null;
    }

    generateParticipantId() {
        return 'P-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    start() {
        this.state = 'INSTRUCTIONS';
        UI.render();
    }

    proceedToFirstTrial() {
        this.startTrial();
    }

    startTrial() {
        if (this.currentTrialIndex >= this.nTrials) {
            this.endExperiment();
            return;
        }

        // Check for block break
        if (this.currentTrialIndex > 0 && this.currentTrialIndex % this.blockSize === 0 && this.state !== 'BLOCK_BREAK') {
            this.state = 'BLOCK_BREAK';
            UI.render();
            return;
        }

        this.state = 'TRIAL_START';
        this.currentStage = 0;

        // Deduct Ante
        if (this.wealth < this.ante) {
            alert("Bankrupt! Game Over.");
            this.endExperiment();
            return;
        }
        this.wealth -= this.ante;
        this.currentBet = this.ante;

        this.playerSum = 0;
        this.houseSum = this.startingBias;
        this.playerRolls = [];
        this.houseRolls = [];

        this.currentTrial = {
            trial_id: this.currentTrialIndex + 1,
            history: []
        };

        // Render initial empty state to ensure view transition happens before animation
        UI.render();

        // Move to first stage after short delay
        setTimeout(() => {
            this.nextStage();
        }, 100);
    }

    resumeFromBlockBreak() {
        this.state = 'TRIAL_START'; // Reset state to avoid loop
        this.startTrial();
    }

    nextStage() {
        this.currentStage++;

        // Roll Dice
        const pRoll = Math.floor(Math.random() * this.diceSides) + 1;
        const hRoll = Math.floor(Math.random() * this.diceSides) + 1;

        this.playerRolls.push(pRoll);
        this.houseRolls.push(hRoll);
        this.playerSum += pRoll;
        this.houseSum += hRoll;

        const remainingStages = this.nStages - this.currentStage;

        // Calculate Probs & Entropy
        const probs = MathLogic.calculate_probabilities(this.playerSum, this.houseSum, remainingStages, this.diceSides);
        const entropy = MathLogic.calculate_entropy(probs.win, probs.loss);

        // Snapshot for history (partial)
        this.currentSnapshot = {
            trial_id: this.currentTrial.trial_id,
            stage: this.currentStage,
            p_roll: pRoll,
            h_roll: hRoll,
            p_sum: this.playerSum,
            h_sum: this.houseSum,
            wealth_available: this.wealth,
            current_bet: this.currentBet,
            remaining_stages: remainingStages,
            ground_truth_probs: probs,
            entropy: entropy
        };

        this.state = 'STAGE_INFO';
        UI.render();
    }

    acknowledgeInfo() {
        if (this.currentStage < this.nStages) {
            this.state = 'STAGE_ACTION';
        } else {
            // Final stage, go straight to result
            this.resolveTrial();
            return;
        }
        UI.render();
    }

    handleAction(action) {
        // action: 'retract', 'hold', 'add'
        let actionRecord = 'hold';

        if (action === 'retract') {
            if (this.currentBet >= this.betStep) {
                this.currentBet -= this.betStep;
                this.wealth += this.betStep;
                actionRecord = 'retract';
            }
        } else if (action === 'add') { // Renamed from double
            if (this.wealth >= this.betStep) {
                this.currentBet += this.betStep;
                this.wealth -= this.betStep;
                actionRecord = 'add';
            }
        }

        this.lastAction = actionRecord;
        this.state = 'STAGE_BELIEF';
        UI.render();
    }

    handleBelief(beliefValue) {
        // beliefValue: 0-100
        this.lastBelief = parseFloat(beliefValue) / 100.0;

        // Complete the snapshot
        this.currentSnapshot.action_taken = this.lastAction;
        this.currentSnapshot.belief_reported = this.lastBelief;
        this.currentSnapshot.bet_after_action = this.currentBet;

        this.currentTrial.history.push(this.currentSnapshot);

        // Next stage
        this.nextStage();
    }

    resolveTrial() {
        this.state = 'STAGE_RESULT';

        let outcome = '';
        let payout = 0;

        if (this.playerSum > this.houseSum) {
            outcome = 'WIN';
            payout = this.currentBet * 2;
        } else {
            outcome = 'LOSS';
            payout = 0;
        }

        this.wealth += payout;

        // Log final stage (no action/belief)
        this.currentSnapshot.action_taken = "N/A";
        this.currentSnapshot.belief_reported = "N/A";
        this.currentSnapshot.bet_after_action = this.currentBet;
        this.currentTrial.history.push(this.currentSnapshot);

        // Save Trial Data
        const trialData = {
            participant_number: this.participantId,
            trial_id: this.currentTrial.trial_id,
            outcome: outcome,
            wealth_start: this.currentTrial.history[0].wealth_available + this.ante, // Approx
            wealth_end: this.wealth,
            history: this.currentTrial.history
        };

        Logger.logTrial(trialData);

        this.lastOutcome = outcome;
        this.lastPayout = payout;

        UI.render();
    }

    endTrial() {
        this.currentTrialIndex++;
        this.startTrial();
    }

    endExperiment() {
        this.state = 'END';
        UI.render();
    }
}
