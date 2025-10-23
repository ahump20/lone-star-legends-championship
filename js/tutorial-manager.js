/**
 * Tutorial Manager
 * Handles onboarding and interactive tutorials
 */

class TutorialManager {
    constructor() {
        this.tutorialSteps = this.initializeTutorials();
        this.currentTutorial = null;
        this.currentStep = 0;
        this.completed = this.loadCompletedTutorials();
        this.overlay = null;
    }

    initializeTutorials() {
        return {
            basics: {
                id: 'basics',
                name: 'Baseball Basics',
                steps: [
                    {
                        title: 'Welcome to Sandlot Superstars!',
                        content: 'Let\'s learn how to play. Press SPACE or click the SWING button to continue.',
                        highlight: null,
                        action: 'swing',
                    },
                    {
                        title: 'Pitching',
                        content: 'Press P or click PITCH to throw the ball. Try it now!',
                        highlight: '.control-btn:nth-child(2)',
                        action: 'pitch',
                    },
                    {
                        title: 'Hitting',
                        content: 'Watch the ball and press SPACE to swing. Timing is everything!',
                        highlight: '.control-btn:nth-child(1)',
                        action: 'hit',
                    },
                    {
                        title: 'Scoring',
                        content: 'Hit home runs to score! The scoreboard shows your progress.',
                        highlight: '.score-board',
                        action: 'view',
                    },
                    {
                        title: 'Movement',
                        content: 'Use arrow keys or A/D to move your batter left and right.',
                        highlight: null,
                        action: 'move',
                    },
                ],
            },
            abilities: {
                id: 'abilities',
                name: 'Special Abilities',
                steps: [
                    {
                        title: 'Special Abilities',
                        content: 'Each character has a unique special ability!',
                        highlight: null,
                        action: 'view',
                    },
                    {
                        title: 'Using Abilities',
                        content: 'Abilities activate automatically or can be triggered during key moments.',
                        highlight: null,
                        action: 'view',
                    },
                    {
                        title: 'Cooldowns',
                        content: 'Abilities have cooldowns - use them strategically!',
                        highlight: null,
                        action: 'view',
                    },
                ],
            },
            stadiums: {
                id: 'stadiums',
                name: 'Stadium Effects',
                steps: [
                    {
                        title: 'Different Stadiums',
                        content: 'Each stadium has unique characteristics that affect gameplay.',
                        highlight: null,
                        action: 'view',
                    },
                    {
                        title: 'Wind and Weather',
                        content: 'Watch out for wind that can help or hinder your hits!',
                        highlight: null,
                        action: 'view',
                    },
                ],
            },
        };
    }

    /**
     * Start tutorial
     */
    startTutorial(tutorialId) {
        if (this.completed[tutorialId]) {
            return false; // Already completed
        }

        const tutorial = this.tutorialSteps[tutorialId];
        if (!tutorial) {
            console.error('Tutorial not found:', tutorialId);
            return false;
        }

        this.currentTutorial = tutorialId;
        this.currentStep = 0;
        this.showStep(tutorial.steps[0]);
        return true;
    }

    /**
     * Show tutorial step
     */
    showStep(step) {
        // Create overlay if doesn't exist
        if (!this.overlay) {
            this.createOverlay();
        }

        // Update overlay content
        const titleEl = this.overlay.querySelector('.tutorial-title');
        const contentEl = this.overlay.querySelector('.tutorial-content');
        const progressEl = this.overlay.querySelector('.tutorial-progress');

        if (titleEl) {
            titleEl.textContent = step.title;
        }
        if (contentEl) {
            contentEl.textContent = step.content;
        }
        if (progressEl) {
            const tutorial = this.tutorialSteps[this.currentTutorial];
            progressEl.textContent = `Step ${this.currentStep + 1} of ${tutorial.steps.length}`;
        }

        // Highlight element if specified
        this.clearHighlights();
        if (step.highlight) {
            this.highlightElement(step.highlight);
        }

        this.overlay.style.display = 'flex';
    }

    /**
     * Next step
     */
    nextStep() {
        const tutorial = this.tutorialSteps[this.currentTutorial];
        this.currentStep++;

        if (this.currentStep >= tutorial.steps.length) {
            this.completeTutorial();
        } else {
            this.showStep(tutorial.steps[this.currentStep]);
        }
    }

    /**
     * Complete tutorial
     */
    completeTutorial() {
        this.completed[this.currentTutorial] = true;
        this.saveCompletedTutorials();

        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        this.clearHighlights();
        this.currentTutorial = null;
        this.currentStep = 0;

        console.info('✅ Tutorial completed!');
    }

    /**
     * Skip tutorial
     */
    skipTutorial() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        this.clearHighlights();
        this.currentTutorial = null;
        this.currentStep = 0;
    }

    /**
     * Create overlay UI
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-box">
                <h2 class="tutorial-title"></h2>
                <p class="tutorial-content"></p>
                <div class="tutorial-progress"></div>
                <div class="tutorial-buttons">
                    <button class="tutorial-btn tutorial-skip" onclick="tutorialManager.skipTutorial()">Skip</button>
                    <button class="tutorial-btn tutorial-next" onclick="tutorialManager.nextStep()">Next</button>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .tutorial-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .tutorial-box {
                background: #1a1a1a;
                border: 2px solid #FF6B35;
                border-radius: 15px;
                padding: 30px;
                max-width: 500px;
                color: white;
                box-shadow: 0 10px 40px rgba(255, 107, 53, 0.3);
            }
            .tutorial-title {
                color: #FF6B35;
                margin: 0 0 15px 0;
                font-size: 24px;
            }
            .tutorial-content {
                font-size: 16px;
                line-height: 1.5;
                margin: 0 0 20px 0;
            }
            .tutorial-progress {
                color: #888;
                font-size: 14px;
                margin-bottom: 20px;
            }
            .tutorial-buttons {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            .tutorial-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.3s;
            }
            .tutorial-skip {
                background: #666;
                color: white;
            }
            .tutorial-next {
                background: linear-gradient(135deg, #FF6B35, #CC5500);
                color: white;
            }
            .tutorial-btn:hover {
                transform: translateY(-2px);
            }
            .tutorial-highlight {
                position: relative;
                box-shadow: 0 0 0 3px #FF6B35, 0 0 20px rgba(255, 107, 53, 0.6);
                z-index: 9999;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(this.overlay);
    }

    /**
     * Highlight element
     */
    highlightElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('tutorial-highlight');
        }
    }

    /**
     * Clear highlights
     */
    clearHighlights() {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    }

    /**
     * Load completed tutorials
     */
    loadCompletedTutorials() {
        try {
            const saved = localStorage.getItem('sandlot_tutorials_completed');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Failed to load tutorials:', error);
            return {};
        }
    }

    /**
     * Save completed tutorials
     */
    saveCompletedTutorials() {
        localStorage.setItem('sandlot_tutorials_completed', JSON.stringify(this.completed));
    }

    /**
     * Check if should show tutorial
     */
    shouldShowTutorial(tutorialId) {
        return !this.completed[tutorialId];
    }

    /**
     * Reset all tutorials
     */
    resetTutorials() {
        this.completed = {};
        this.saveCompletedTutorials();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TutorialManager;
}
