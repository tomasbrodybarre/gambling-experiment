/**
 * UI Manager
 * Handles DOM updates and User Input.
 */

const UI = {
    game: null, // Reference to GameSession

    init(gameSession) {
        this.game = gameSession;
        this.cacheDOM();
        this.bindEvents();
        this.render();
    },

    cacheDOM() {
        this.views = {
            setup: document.getElementById('setup-view'),
            instructions: document.getElementById('instructions-view'),
            game: document.getElementById('game-view'),
            result: document.getElementById('result-view'),
            blockBreak: document.getElementById('block-break-view'),
            end: document.getElementById('end-view')
        };

        // Game Elements
        this.el = {
            trialNum: document.getElementById('trial-num'),
            stageNum: document.getElementById('stage-num'),
            wealth: document.getElementById('wealth-display'),
            bet: document.getElementById('bet-display'),
            playerDice: document.getElementById('player-dice-container'),
            houseDice: document.getElementById('house-dice-container'),
            playerSum: document.getElementById('player-sum'),
            houseSum: document.getElementById('house-sum'),

            // Panels
            infoPanel: document.getElementById('info-controls'),
            actionPanel: document.getElementById('action-controls'),
            beliefPanel: document.getElementById('belief-controls'),

            // Inputs
            beliefSlider: document.getElementById('belief-slider'),
            beliefValue: document.getElementById('belief-value'),

            // Result
            resultTitle: document.getElementById('result-title'),
            resultMessage: document.getElementById('result-message')
        };
    },

    bindEvents() {
        // Setup
        document.getElementById('btn-start-exp').addEventListener('click', () => this.game.start());

        // Instructions
        document.getElementById('btn-start-first-trial').addEventListener('click', () => this.game.proceedToFirstTrial());

        // Info Ack (Removed - Auto Advance)
        // document.getElementById('btn-ack-info').addEventListener('click', () => this.game.acknowledgeInfo());

        // Actions
        document.getElementById('btn-retract').addEventListener('click', () => this.game.handleAction('retract'));
        document.getElementById('btn-hold').addEventListener('click', () => this.game.handleAction('hold'));
        document.getElementById('btn-add').addEventListener('click', () => this.game.handleAction('add'));

        // Belief
        this.el.beliefSlider.addEventListener('input', (e) => {
            this.el.beliefValue.textContent = e.target.value + '%';
        });
        document.getElementById('btn-submit-belief').addEventListener('click', () => {
            this.game.handleBelief(this.el.beliefSlider.value);
        });

        // Result / Next Trial
        document.getElementById('btn-next-trial').addEventListener('click', () => this.game.endTrial());

        // Block Break
        document.getElementById('btn-resume-block').addEventListener('click', () => this.game.resumeFromBlockBreak());

        // End / Download
        // End / Download
        document.getElementById('btn-download-data').addEventListener('click', () => {
            Logger.exportToCSV();
            window.close();
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.game.state === 'STAGE_ACTION') {
                switch (e.key.toLowerCase()) {
                    case 'a': // Retract
                        this.game.handleAction('retract');
                        break;
                    case 's': // Hold
                        this.game.handleAction('hold');
                        break;
                    case 'd': // Add
                        this.game.handleAction('add');
                        break;
                }
            } else if (this.game.state === 'STAGE_BELIEF') {
                const currentVal = parseInt(this.el.beliefSlider.value);
                switch (e.key.toLowerCase()) {
                    case 'a': // Decrease 5%
                        const newValDec = Math.max(0, currentVal - 5);
                        this.el.beliefSlider.value = newValDec;
                        this.el.beliefValue.textContent = newValDec + '%';
                        break;
                    case 'd': // Increase 5%
                        const newValInc = Math.min(100, currentVal + 5);
                        this.el.beliefSlider.value = newValInc;
                        this.el.beliefValue.textContent = newValInc + '%';
                        break;
                    case 's': // Submit
                        this.game.handleBelief(this.el.beliefSlider.value);
                        break;
                }
            } else if (this.game.state === 'INSTRUCTIONS') {
                if (e.key === ' ') {
                    this.game.proceedToFirstTrial();
                }
            } else if (this.game.state === 'STAGE_RESULT') {
                if (e.key === ' ' || e.key.toLowerCase() === 's') {
                    this.game.endTrial();
                }
            }
        });
    },

    render() {
        // Hide all views
        Object.values(this.views).forEach(el => el.classList.remove('active'));

        // Show current view based on game state
        switch (this.game.state) {
            case 'SETUP':
                this.views.setup.classList.add('active');
                break;
            case 'INSTRUCTIONS':
                this.views.instructions.classList.add('active');
                break;
            case 'TRIAL_START':
            case 'STAGE_INFO':
            case 'STAGE_ACTION':
            case 'STAGE_BELIEF':
                this.views.game.classList.add('active');
                this.renderGame();
                break;
            case 'STAGE_RESULT':
                this.views.result.classList.add('active');
                this.renderResult();
                break;
            case 'BLOCK_BREAK':
                this.views.blockBreak.classList.add('active');
                break;
            case 'END':
                this.views.end.classList.add('active');
                break;
        }
    },

    renderGame() {
        // Header Stats
        this.el.trialNum.textContent = this.game.currentTrial.trial_id;
        this.el.stageNum.textContent = this.game.currentStage;
        this.el.wealth.textContent = this.game.wealth;
        this.el.bet.textContent = this.game.currentBet;

        // Dice & Sums
        // Only render dice if we are NOT animating (i.e. not in STAGE_INFO initially)
        // Actually, STAGE_INFO is where we animate.

        if (this.game.state === 'STAGE_INFO') {
            this.el.infoPanel.classList.remove('hidden');
            this.animateDice(this.game.playerRolls[this.game.playerRolls.length - 1],
                this.game.houseRolls[this.game.houseRolls.length - 1]);
        } else {
            // Static Render
            this.renderDice(this.el.playerDice, this.game.playerRolls, 'player');
            this.renderDice(this.el.houseDice, this.game.houseRolls, 'house');
            this.el.playerSum.textContent = this.game.playerSum;
            this.el.houseSum.textContent = this.game.houseSum;
        }

        // Panels
        this.el.infoPanel.classList.add('hidden');
        this.el.actionPanel.classList.add('hidden');
        this.el.beliefPanel.classList.add('hidden');

        if (this.game.state === 'STAGE_INFO') {
            this.el.infoPanel.classList.remove('hidden');
            // Animation handles transition
        } else if (this.game.state === 'STAGE_ACTION') {
            this.el.actionPanel.classList.remove('hidden');
        } else if (this.game.state === 'STAGE_BELIEF') {
            this.el.beliefPanel.classList.remove('hidden');
            // Reset slider
            this.el.beliefSlider.value = 50;
            this.el.beliefValue.textContent = '50%';
        }
    },

    animateDice(pTarget, hTarget) {
        // Clear current dice containers to show animation placeholders
        // We want to keep history? 
        // "Dice History: Keep previous dice from the current trial on screen."
        // So we should append a new animating die.

        // Render existing history first (minus the last one which is animating)
        const pHistory = this.game.playerRolls.slice(0, -1);
        const hHistory = this.game.houseRolls.slice(0, -1);

        this.renderDice(this.el.playerDice, pHistory, 'player');
        this.renderDice(this.el.houseDice, hHistory, 'house');

        // Create animating dice elements
        const pDie = document.createElement('div');
        pDie.className = 'die animating';
        this.el.playerDice.appendChild(pDie);

        const hDie = document.createElement('div');
        hDie.className = 'die animating';
        this.el.houseDice.appendChild(hDie);

        let frames = 0;
        const maxFrames = 5; // 5 * 150ms = 750ms (0.75 seconds) - Halved again
        const intervalTime = 150;

        // Click to skip
        let skipped = false;
        const skipHandler = () => {
            skipped = true;
        };
        document.body.addEventListener('click', skipHandler, { once: true });

        const interval = setInterval(() => {
            if (skipped || frames >= maxFrames) {
                clearInterval(interval);
                document.body.removeEventListener('click', skipHandler);

                // Finalize
                pDie.textContent = pTarget;
                hDie.textContent = hTarget;
                pDie.classList.remove('animating');
                hDie.classList.remove('animating');

                // Update Sums
                this.el.playerSum.textContent = this.game.playerSum;
                this.el.houseSum.textContent = this.game.houseSum;

                // Auto-advance after short delay
                setTimeout(() => {
                    this.game.acknowledgeInfo();
                }, 500);
                return;
            }

            // Random numbers
            pDie.textContent = Math.floor(Math.random() * 6) + 1;
            hDie.textContent = Math.floor(Math.random() * 6) + 1;
            frames++;
        }, intervalTime);
    },

    renderDice(container, rolls, type) {
        container.innerHTML = '';
        rolls.forEach(roll => {
            const die = document.createElement('div');
            die.className = 'die';
            die.textContent = roll;
            container.appendChild(die);
        });
    },

    renderResult() {
        this.el.resultTitle.textContent = this.game.lastOutcome;
        if (this.game.lastOutcome === 'WIN') {
            this.el.resultTitle.style.color = '#28a745';
            this.el.resultMessage.innerHTML = `You won ${this.game.lastPayout}!<br>Your total is now ${this.game.wealth}.`;
        } else {
            this.el.resultTitle.style.color = '#dc3545';
            this.el.resultMessage.innerHTML = `You lost ${this.game.currentBet}.<br>Your total is now ${this.game.wealth}.`;
        }
    }
};
