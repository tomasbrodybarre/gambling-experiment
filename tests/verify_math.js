const fs = require('fs');
const path = require('path');
const { calculate_probabilities, calculate_entropy } = require('../js/math.js');

const truthPath = path.join(__dirname, 'ground_truth.json');

if (!fs.existsSync(truthPath)) {
    console.error("Ground truth file not found. Run generate_truth.py first.");
    process.exit(1);
}

const testCases = JSON.parse(fs.readFileSync(truthPath, 'utf8'));
let passed = 0;
let failed = 0;

const EPSILON = 1e-9;

function almostEqual(a, b) {
    return Math.abs(a - b) < EPSILON;
}

console.log("Running Math Verification Tests...\n");

testCases.forEach((testCase, index) => {
    const [p_curr, h_curr, stages, sides] = testCase.input;

    const jsProbs = calculate_probabilities(p_curr, h_curr, stages, sides);
    // JS version only returns win/loss, Python returns win/loss/push (push is 0)
    // We need to adapt the check.

    const pyProbs = testCase.expected_probs;

    let casePassed = true;

    if (!almostEqual(jsProbs.win, pyProbs.win)) {
        console.error(`Case ${index + 1} Failed: Win Prob mismatch. JS: ${jsProbs.win}, PY: ${pyProbs.win}`);
        casePassed = false;
    }

    if (!almostEqual(jsProbs.loss, pyProbs.loss + pyProbs.push)) {
        // In JS, loss includes push. In Python, they are separate but push is 0.0 anyway.
        // But wait, the python code says "Push is now a loss for the player" and returns loss=1.0, push=0.0 in base case.
        // In the loop, it says "No else for push_prob, as it's now handled by loss_prob".
        // So pyProbs.push should be 0.0.
        console.error(`Case ${index + 1} Failed: Loss Prob mismatch. JS: ${jsProbs.loss}, PY: ${pyProbs.loss}`);
        casePassed = false;
    }

    const jsEntropy = calculate_entropy(jsProbs.win, jsProbs.loss);
    const pyEntropy = testCase.expected_entropy;

    if (!almostEqual(jsEntropy, pyEntropy)) {
        console.error(`Case ${index + 1} Failed: Entropy mismatch. JS: ${jsEntropy}, PY: ${pyEntropy}`);
        casePassed = false;
    }

    if (casePassed) {
        passed++;
        console.log(`Case ${index + 1} Passed.`);
    } else {
        failed++;
    }
});

console.log(`\nResults: ${passed} Passed, ${failed} Failed.`);

if (failed > 0) process.exit(1);
