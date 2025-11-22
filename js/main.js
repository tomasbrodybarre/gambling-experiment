/**
 * Main Entry Point
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("App Initialized");

    // Initialize Game
    const game = new GameSession({
        nTrials: 10, // 10 trials total
        startWealth: 500
    });

    // Initialize UI with game instance
    UI.init(game);
});
