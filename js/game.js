/**
 * Game Logic
 * Manages the state of the experiment.
 */

class GameSession {
    constructor(config) {
        this.participantId = config.participantId || this.generateParticipantId();
        this.startWealth = config.startWealth || 500;
        this.ante = config.ante || 15;
        this.betStep = config.betStep || 5;
        this.nTrials = config.nTrials || 10;
        this.nStages = config.nStages || 3;
        this.diceSides = config.diceSides || 6;
        this.startingBias = config.startingBias || 0;
        this.blockSize = 100;

        this.trials = [];
        this.currentTrialIndex = 0;
        this.wealth = this.startWealth;

        // State
        this.state = 'WELCOME';
        // Possible States:
        // WELCOME, QUESTIONNAIRE, INSTRUCTIONS, TRIAL_START, STAGE_INFO, STAGE_ACTION, STAGE_BELIEF, STAGE_RESULT, TRIAL_END, BLOCK_BREAK, END

        // Questionnaire Data
        this.questionnaireData = {
            answers: [],
            totalScore: 0
        };
        this.currentQuestionIndex = 0;
        this.questions = [
            "Have you bet more than you could really afford to lose?",
            "Have you needed to gamble with larger amounts to get the same feeling of excitement?",
            "When you gambled, did you go back another day to try to win back the money you lost?",
            "Have you borrowed money or sold anything to get money to gamble?",
            "Have you felt you might have a problem with gambling?",
            "Has gambling caused you any health problems, including stess or anxiety?",
            "Have people criticised your betting or told you that you had a gambling problem, regardless of whether or not you thought it was true?",
            "Has your gambling caused any financial problems for you or your household?",
            "Have you felt guilty about the way you gamble or what happens when you gamble?"
        ];

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

        // Scoring
        this.accuracyScores = [];
        this.finalStats = {};
    }

    generateParticipantId() {
        return 'P-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    start() {
        this.state = 'WELCOME';
        UI.render();
    }

    startQuestionnaire() {
        this.state = 'QUESTIONNAIRE';
        this.currentQuestionIndex = 0;
        UI.render();
    }

    handleQuestionnaireAnswer(answerValue) {
        // answerValue is 0, 1, 2, 3
        const val = parseInt(answerValue);
        this.questionnaireData.answers.push(val);
        this.questionnaireData.totalScore += val;

        this.currentQuestionIndex++;

        if (this.currentQuestionIndex >= this.questions.length) {
            // Questionnaire complete
            this.state = 'INSTRUCTIONS';
        }
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

        this.state = 'TRIAL_START';
        this.currentStage = 0;

        // Start with initial bet of 15 points
        this.currentBet = this.ante;
        // Deduct ante immediately
        this.wealth -= this.currentBet;

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

        // Move to first betting decision (Stage 1) after short delay
        setTimeout(() => {
            this.currentStage = 1;
            this.state = 'STAGE_ACTION';
            UI.render();
        }, 100);
    }

    resumeFromBlockBreak() {
        this.state = 'TRIAL_START'; // Reset state to avoid loop
        this.startTrial();
    }

    nextStage() {
        // Roll Dice
        const pRoll = Math.floor(Math.random() * this.diceSides) + 1;
        const hRoll = Math.floor(Math.random() * this.diceSides) + 1;

        this.playerRolls.push(pRoll);
        this.houseRolls.push(hRoll);
        this.playerSum += pRoll;
        this.houseSum += hRoll;

        // Update the current snapshot with the dice rolls
        const lastSnapshot = this.currentTrial.history[this.currentTrial.history.length - 1];
        if (lastSnapshot) {
            lastSnapshot.p_roll = pRoll;
            lastSnapshot.h_roll = hRoll;
            // Update sums after the roll
            lastSnapshot.p_sum_after_roll = this.playerSum;
            lastSnapshot.h_sum_after_roll = this.houseSum;
        }

        this.state = 'STAGE_INFO';
        UI.render();
    }

    acknowledgeInfo() {
        if (this.currentStage < this.nStages) {
            // Move to next stage
            this.currentStage++;
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
                // Refund wealth immediately
                this.wealth += this.betStep;
                actionRecord = 'retract';
            }
        } else if (action === 'add') {
            // Check if we have enough wealth to add to the bet
            if (this.wealth >= this.betStep) {
                this.currentBet += this.betStep;
                // Deduct wealth immediately
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

        // Calculate probabilities before rolling
        const remainingStages = this.nStages - this.currentStage + 1;
        const probs = MathLogic.calculate_probabilities(this.playerSum, this.houseSum, remainingStages, this.diceSides);
        const entropy = MathLogic.calculate_entropy(probs.win, probs.loss);

        // Create snapshot for this stage
        this.currentSnapshot = {
            trial_id: this.currentTrial.trial_id,
            stage: this.currentStage,
            p_roll: null, // Will be filled after dice roll
            h_roll: null,
            p_sum: this.playerSum,
            h_sum: this.houseSum,
            wealth_available: this.wealth,
            current_bet: this.currentBet,
            remaining_stages: remainingStages,
            ground_truth_probs: probs,
            entropy: entropy,
            action_taken: this.lastAction,
            belief_reported: this.lastBelief,
            bet_after_action: this.currentBet
        };

        this.currentTrial.history.push(this.currentSnapshot);

        // Deduct the bet from wealth (this happens after confidence is reported)
        // NOTE: Wealth is now deducted immediately at startTrial and updated in handleAction
        // So we just check for bankruptcy here if needed, but technically we shouldn't be able to bet if we don't have funds.
        if (this.wealth < 0) {
            alert("Bankrupt! Game Over.");
            this.endExperiment();
            return;
        }

        // Now roll the dice
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

        // Calculate Brier Scores for this trial
        const outcomeValue = outcome === 'WIN' ? 1 : 0;
        this.currentTrial.history.forEach(step => {
            if (step.belief_reported !== null && step.belief_reported !== "N/A") {
                const brier = MathLogic.calculate_brier_score(step.belief_reported, outcomeValue);
                const accuracy = 1 - brier;

                step.brier_score = brier;
                step.accuracy_score = accuracy;

                this.accuracyScores.push(accuracy);
            } else {
                step.brier_score = null;
                step.accuracy_score = null;
            }
        });

        // Save Trial Data
        const trialData = {
            participant_number: this.participantId,
            trial_id: this.currentTrial.trial_id,
            outcome: outcome,
            wealth_start: this.currentTrial.history[0].wealth_available + this.ante, // Approx
            wealth_end: this.wealth,
            history: this.currentTrial.history,
            questionnaire: this.questionnaireData // Attach questionnaire data
        };

        Logger.logTrial(trialData);

        if (this.currentTrialIndex >= this.nTrials) {
            this.endExperiment();
            return;
        }

        this.state = 'TRIAL_START';
        this.currentStage = 0;

        // Start with initial bet of 15 points
        this.currentBet = this.ante;
        // Deduct ante immediately
        this.wealth -= this.currentBet;

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

        // Move to first betting decision (Stage 1) after short delay
        setTimeout(() => {
            this.currentStage = 1;
            this.state = 'STAGE_ACTION';
            UI.render();
        }, 100);
    }

    resumeFromBlockBreak() {
        this.state = 'TRIAL_START'; // Reset state to avoid loop
        this.startTrial();
    }

    nextStage() {
        // Roll Dice
        const pRoll = Math.floor(Math.random() * this.diceSides) + 1;
        const hRoll = Math.floor(Math.random() * this.diceSides) + 1;

        this.playerRolls.push(pRoll);
        this.houseRolls.push(hRoll);
        this.playerSum += pRoll;
        this.houseSum += hRoll;

        // Update the current snapshot with the dice rolls
        const lastSnapshot = this.currentTrial.history[this.currentTrial.history.length - 1];
        if (lastSnapshot) {
            lastSnapshot.p_roll = pRoll;
            lastSnapshot.h_roll = hRoll;
            // Update sums after the roll
            lastSnapshot.p_sum_after_roll = this.playerSum;
            lastSnapshot.h_sum_after_roll = this.houseSum;
        }

        this.state = 'STAGE_INFO';
        UI.render();
    }

    acknowledgeInfo() {
        if (this.currentStage < this.nStages) {
            // Move to next stage
            this.currentStage++;
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
                // Refund wealth immediately
                this.wealth += this.betStep;
                actionRecord = 'retract';
            }
        } else if (action === 'add') {
            // Check if we have enough wealth to add to the bet
            if (this.wealth >= this.betStep) {
                this.currentBet += this.betStep;
                // Deduct wealth immediately
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

        // Calculate probabilities before rolling
        const remainingStages = this.nStages - this.currentStage + 1;
        const probs = MathLogic.calculate_probabilities(this.playerSum, this.houseSum, remainingStages, this.diceSides);
        const entropy = MathLogic.calculate_entropy(probs.win, probs.loss);

        // Create snapshot for this stage
        this.currentSnapshot = {
            trial_id: this.currentTrial.trial_id,
            stage: this.currentStage,
            p_roll: null, // Will be filled after dice roll
            h_roll: null,
            p_sum: this.playerSum,
            h_sum: this.houseSum,
            wealth_available: this.wealth,
            current_bet: this.currentBet,
            remaining_stages: remainingStages,
            ground_truth_probs: probs,
            entropy: entropy,
            action_taken: this.lastAction,
            belief_reported: this.lastBelief,
            bet_after_action: this.currentBet
        };

        this.currentTrial.history.push(this.currentSnapshot);

        // Deduct the bet from wealth (this happens after confidence is reported)
        // NOTE: Wealth is now deducted immediately at startTrial and updated in handleAction
        // So we just check for bankruptcy here if needed, but technically we shouldn't be able to bet if we don't have funds.
        if (this.wealth < 0) {
            alert("Bankrupt! Game Over.");
            this.endExperiment();
            return;
        }

        // Now roll the dice
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

        // Calculate Brier Scores for this trial
        const outcomeValue = outcome === 'WIN' ? 1 : 0;
        this.currentTrial.history.forEach(step => {
            if (step.belief_reported !== null && step.belief_reported !== "N/A") {
                const brier = MathLogic.calculate_brier_score(step.belief_reported, outcomeValue);
                const accuracy = 1 - brier;

                step.brier_score = brier;
                step.accuracy_score = accuracy;

                this.accuracyScores.push(accuracy);
            } else {
                step.brier_score = null;
                step.accuracy_score = null;
            }
        });

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

        // Calculate Final Stats
        const totalAccuracy = this.accuracyScores.reduce((a, b) => a + b, 0);
        const meanAccuracy = this.accuracyScores.length > 0 ? totalAccuracy / this.accuracyScores.length : 0;

        // Payout Calculation: ((Wealth x Accuracy) / 100) = Performance Reward
        const finalWealth = Math.max(0, this.wealth);
        const performanceReward = (finalWealth * meanAccuracy) / 100;
        const basePay = 3.00;
        const totalPayment = performanceReward + basePay;

        this.finalStats = {
            finalWealth: finalWealth,
            meanAccuracy: meanAccuracy,
            performanceReward: performanceReward,
            basePay: basePay,
            totalPayment: totalPayment
        };

        // Update all logged trials with the final stats so they appear in the CSV
        // This is a bit of a hack but ensures the data is in every row/trial as requested
        Logger.trials.forEach(t => {
            t.performance_reward = performanceReward;
            t.total_payment = totalPayment;
            t.mean_accuracy = meanAccuracy;
        });

        UI.render();
    }
}
