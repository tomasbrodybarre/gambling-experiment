/**
 * Data Logger
 * Handles data storage and CSV export.
 */

const Logger = {
    trials: [],

    logTrial(trialData) {
        this.trials.push(trialData);
    },

    exportToCSV() {
        if (this.trials.length === 0) return;

        // Flatten data
        const rows = [];

        this.trials.forEach(trial => {
            trial.history.forEach(step => {
                const row = {
                    participant_number: trial.participant_number,
                    trial_id: trial.trial_id,
                    stage: step.stage,
                    outcome: trial.outcome,
                    wealth_start: trial.wealth_start,
                    wealth_end: trial.wealth_end,

                    p_roll: step.p_roll,
                    h_roll: step.h_roll,
                    p_sum: step.p_sum,
                    h_sum: step.h_sum,
                    wealth_available: step.wealth_available,
                    current_bet: step.current_bet,
                    remaining_stages: step.remaining_stages,

                    win_prob: step.ground_truth_probs.win,
                    loss_prob: step.ground_truth_probs.loss,
                    entropy: step.entropy,

                    action_taken: step.action_taken,
                    belief_reported: step.belief_reported,
                    bet_after_action: step.bet_after_action,

                    brier_score: step.brier_score,
                    accuracy_score: step.accuracy_score,

                    // Final stats (will be undefined until the end, or we can just append them to every row if available)
                    // For simplicity, we'll leave them blank or add them if we pass the game object.
                    // Actually, the prompt implies adding them to the CSV. 
                    // Let's add them to the row if they exist on the trial object (which we might need to attach).
                    // A better approach: The user wants these values in the output. 
                    // Since Logger.trials is just a list of trial data, we don't have global stats here easily unless we pass them.
                    // However, we can calculate the mean accuracy from the rows if needed.
                    // But the request says "Store these values in the csv output".
                    // I'll add columns for them.
                    performance_reward: trial.performance_reward, // We need to add this to trialData in game.js
                    total_payment: trial.total_payment // We need to add this to trialData in game.js
                };
                rows.push(row);
            });
        });

        // Generate CSV
        const headers = Object.keys(rows[0]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `experiment_data_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
