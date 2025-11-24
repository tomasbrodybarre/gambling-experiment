/**
 * Main Entry Point
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("App Initialized");

    // Initialize Game
    const game = new GameSession({
        nTrials: 10, // 10 trials total
        startWealth: 300
    });

    // Initialize UI with game instance
    try {
        UI.init(game);
        console.log("UI Initialized");
    } catch (e) {
        console.error("UI Initialization Failed:", e);
    }
});
