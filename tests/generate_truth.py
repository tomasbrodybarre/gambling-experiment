import json
import math

# --- Pure Python Implementation of Convolution and Entropy ---

def convolve(vec1, vec2):
    n = len(vec1)
    m = len(vec2)
    result = [0.0] * (n + m - 1)
    for i in range(n):
        for j in range(m):
            result[i + j] += vec1[i] * vec2[j]
    return result

def calculate_probabilities(
    player_current: int,
    house_current: int,
    remaining_stages: int,
    sides: int
):
    if remaining_stages == 0:
        if player_current > house_current:
            return {'win': 1.0, 'loss': 0.0, 'push': 0.0}
        if player_current <= house_current:
            return {'win': 0.0, 'loss': 1.0, 'push': 0.0}

    # 1. Create the probability distribution for a single die
    single_die_dist = [1.0 / sides] * sides

    # 2. Convolve to find distribution for 'remaining_stages' dice
    player_future_dist = list(single_die_dist)
    house_future_dist = list(single_die_dist)

    for _ in range(remaining_stages - 1):
        player_future_dist = convolve(player_future_dist, single_die_dist)
        house_future_dist = convolve(house_future_dist, single_die_dist)

    # 3. Compare all possible future outcomes
    win_prob = 0.0
    loss_prob = 0.0
    push_prob = 0.0 

    min_val = remaining_stages

    for p_idx, p_prob in enumerate(player_future_dist):
        p_added_val = p_idx + min_val
        p_final = player_current + p_added_val

        for h_idx, h_prob in enumerate(house_future_dist):
            h_added_val = h_idx + min_val
            h_final = house_current + h_added_val

            joint_prob = p_prob * h_prob

            if p_final > h_final:
                win_prob += joint_prob
            elif p_final <= h_final:
                loss_prob += joint_prob

    return {
        'win': win_prob,
        'loss': loss_prob,
        'push': push_prob
    }

def calculate_entropy(p_win: float, p_loss: float, p_push: float) -> float:
    entropy = 0.0
    if p_win > 0:
        entropy -= p_win * math.log2(p_win)
    if p_loss > 0:
        entropy -= p_loss * math.log2(p_loss)
    if p_push > 0:
        entropy -= p_push * math.log2(p_push)
    return entropy

# --- Test Case Generation ---

def generate_test_cases():
    cases = []
    
    # Case 1: Simple start
    probs = calculate_probabilities(0, 0, 3, 6)
    ent = calculate_entropy(probs['win'], probs['loss'], probs['push'])
    cases.append({
        "input": [0, 0, 3, 6],
        "expected_probs": probs,
        "expected_entropy": ent
    })

    # Case 2: Player ahead
    probs = calculate_probabilities(10, 5, 1, 6)
    ent = calculate_entropy(probs['win'], probs['loss'], probs['push'])
    cases.append({
        "input": [10, 5, 1, 6],
        "expected_probs": probs,
        "expected_entropy": ent
    })

    # Case 3: House ahead
    probs = calculate_probabilities(5, 10, 1, 6)
    ent = calculate_entropy(probs['win'], probs['loss'], probs['push'])
    cases.append({
        "input": [5, 10, 1, 6],
        "expected_probs": probs,
        "expected_entropy": ent
    })

    # Case 4: Mid game
    probs = calculate_probabilities(7, 7, 2, 6)
    ent = calculate_entropy(probs['win'], probs['loss'], probs['push'])
    cases.append({
        "input": [7, 7, 2, 6],
        "expected_probs": probs,
        "expected_entropy": ent
    })

    with open('tests/ground_truth.json', 'w') as f:
        json.dump(cases, f, indent=2)

if __name__ == "__main__":
    generate_test_cases()
    print("Ground truth generated.")
