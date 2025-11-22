/**
 * Gambling Experiment Math Logic
 * Ports the Python `calculate_probabilities` and `calculate_entropy` functions.
 */

/**
 * Performs a discrete 1D convolution of two vectors.
 * Equivalent to np.convolve(a, b, mode='full')
 * @param {number[]} vec1 
 * @param {number[]} vec2 
 * @returns {number[]} Convolved vector
 */
function convolve(vec1, vec2) {
    const n = vec1.length;
    const m = vec2.length;
    const result = new Array(n + m - 1).fill(0);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            result[i + j] += vec1[i] * vec2[j];
        }
    }
    return result;
}

/**
 * Calculates the exact Bayesian probability of Win and Loss.
 * @param {number} player_current Current sum of player's dice
 * @param {number} house_current Current sum of house's dice
 * @param {number} remaining_stages Number of stages (dice rolls) remaining
 * @param {number} sides Number of sides on the dice (default 6)
 * @returns {{win: number, loss: number}} Dictionary of probabilities
 */
function calculate_probabilities(player_current, house_current, remaining_stages, sides = 6) {
    // Base case: No stages remaining
    if (remaining_stages === 0) {
        if (player_current > house_current) {
            return { win: 1.0, loss: 0.0 };
        } else {
            // Player <= House is a Loss (Push is Loss)
            return { win: 0.0, loss: 1.0 };
        }
    }

    // 1. Create probability distribution for a single die
    // np.ones(sides) / sides -> [1/6, 1/6, ..., 1/6]
    const single_die_dist = new Array(sides).fill(1 / sides);

    // 2. Convolve to find distribution for 'remaining_stages' dice
    let player_future_dist = [...single_die_dist];
    let house_future_dist = [...single_die_dist];

    // If remaining_stages > 1, convolve repeatedly
    // Note: The loop runs (remaining_stages - 1) times
    for (let i = 0; i < remaining_stages - 1; i++) {
        player_future_dist = convolve(player_future_dist, single_die_dist);
        house_future_dist = convolve(house_future_dist, single_die_dist);
    }

    // 3. Compare all possible future outcomes
    let win_prob = 0.0;
    let loss_prob = 0.0;

    // The distribution arrays start from the minimum possible sum for the remaining dice.
    // Min sum for N dice is N (since min roll is 1).
    // So index 0 corresponds to a sum of `remaining_stages`.
    const min_val = remaining_stages;

    for (let p_idx = 0; p_idx < player_future_dist.length; p_idx++) {
        const p_prob = player_future_dist[p_idx];
        const p_added_val = p_idx + min_val;
        const p_final = player_current + p_added_val;

        for (let h_idx = 0; h_idx < house_future_dist.length; h_idx++) {
            const h_prob = house_future_dist[h_idx];
            const h_added_val = h_idx + min_val;
            const h_final = house_current + h_added_val;

            const joint_prob = p_prob * h_prob;

            if (p_final > h_final) {
                win_prob += joint_prob;
            } else {
                // p_final <= h_final -> Loss
                loss_prob += joint_prob;
            }
        }
    }

    return {
        win: win_prob,
        loss: loss_prob
    };
}

/**
 * Calculates the Shannon entropy for a given set of win and loss probabilities.
 * @param {number} p_win 
 * @param {number} p_loss 
 * @returns {number} Entropy value
 */
function calculate_entropy(p_win, p_loss) {
    let entropy = 0.0;
    if (p_win > 0) {
        entropy -= p_win * Math.log2(p_win);
    }
    if (p_loss > 0) {
        entropy -= p_loss * Math.log2(p_loss);
    }
    return entropy;
}

// Export for Node.js testing environment, or attach to window for browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculate_probabilities, calculate_entropy, convolve };
} else {
    window.MathLogic = { calculate_probabilities, calculate_entropy, convolve };
}
