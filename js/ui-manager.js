/**
 * UI Manager
 * Centralized controller for all game UI elements
 */

class UIManager {
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.theme = options.theme || 'default';
        this.screens = {};
        this.currentScreen = null;
        this.notifications = [];
        this.modals = [];

        this.init();
    }

    /**
     * Initialize UI system
     */
    init() {
        // Create UI container
        this.uiContainer = document.createElement('div');
        this.uiContainer.id = 'ui-container';
        this.uiContainer.className = 'ui-container';
        this.container.appendChild(this.uiContainer);

        // Create notification container
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'notification-container';
        this.notificationContainer.className = 'notification-container';
        this.container.appendChild(this.notificationContainer);

        // Create modal container
        this.modalContainer = document.createElement('div');
        this.modalContainer.id = 'modal-container';
        this.modalContainer.className = 'modal-container';
        this.container.appendChild(this.modalContainer);

        // Load UI styles
        this.loadStyles();

        console.info('✅ UI Manager initialized');
    }

    /**
     * Load UI styles
     */
    loadStyles() {
        if (document.getElementById('ui-manager-styles')) {
            return; // Already loaded
        }

        const link = document.createElement('link');
        link.id = 'ui-manager-styles';
        link.rel = 'stylesheet';
        link.href = '/css/ui-manager.css';
        document.head.appendChild(link);
    }

    /**
     * Register a screen
     */
    registerScreen(screenId, screenClass) {
        this.screens[screenId] = new screenClass(this);
        console.info(`📺 Registered screen: ${screenId}`);
    }

    /**
     * Show screen
     */
    showScreen(screenId, options = {}) {
        // Hide current screen
        if (this.currentScreen) {
            this.hideScreen(this.currentScreen);
        }

        const screen = this.screens[screenId];
        if (!screen) {
            console.error(`Screen not found: ${screenId}`);
            return;
        }

        // Show new screen
        screen.show(options);
        this.currentScreen = screenId;

        console.info(`📺 Showing screen: ${screenId}`);
    }

    /**
     * Hide screen
     */
    hideScreen(screenId) {
        const screen = this.screens[screenId];
        if (screen) {
            screen.hide();
        }
    }

    /**
     * Show notification
     */
    showNotification(notification) {
        const notif = new Notification(notification, this.notificationContainer);
        this.notifications.push(notif);
        notif.show();

        // Auto-remove after duration
        setTimeout(() => {
            notif.hide();
            const index = this.notifications.indexOf(notif);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, notification.duration || 5000);

        return notif;
    }

    /**
     * Show achievement notification
     */
    showAchievement(achievement) {
        return this.showNotification({
            type: 'achievement',
            title: achievement.name,
            message: achievement.description,
            icon: achievement.icon,
            points: achievement.points,
            duration: 6000,
        });
    }

    /**
     * Show modal
     */
    showModal(modalConfig) {
        const modal = new Modal(modalConfig, this.modalContainer);
        this.modals.push(modal);
        modal.show();
        return modal;
    }

    /**
     * Show confirm dialog
     */
    confirm(message, options = {}) {
        return new Promise((resolve) => {
            const modal = this.showModal({
                title: options.title || 'Confirm',
                content: message,
                buttons: [
                    {
                        text: options.cancelText || 'Cancel',
                        class: 'btn-secondary',
                        onClick: () => {
                            modal.hide();
                            resolve(false);
                        },
                    },
                    {
                        text: options.confirmText || 'Confirm',
                        class: 'btn-primary',
                        onClick: () => {
                            modal.hide();
                            resolve(true);
                        },
                    },
                ],
            });
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        return this.showNotification({
            type: 'error',
            title: 'Error',
            message: message,
            duration: 5000,
        });
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        return this.showNotification({
            type: 'success',
            title: 'Success',
            message: message,
            duration: 3000,
        });
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'Loading...') {
        const loading = document.createElement('div');
        loading.id = 'loading-overlay';
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-message">${message}</div>
            </div>
        `;
        this.container.appendChild(loading);
        return loading;
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const loading = document.getElementById('loading-overlay');
        if (loading) {
            loading.remove();
        }
    }

    /**
     * Create button
     */
    createButton(config) {
        const button = document.createElement('button');
        button.className = `btn ${config.class || 'btn-primary'}`;
        button.textContent = config.text;

        if (config.icon) {
            button.innerHTML = `<span class="btn-icon">${config.icon}</span> ${config.text}`;
        }

        if (config.onClick) {
            button.addEventListener('click', config.onClick);
        }

        if (config.disabled) {
            button.disabled = true;
        }

        return button;
    }

    /**
     * Sanitize HTML
     */
    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

/**
 * Notification class
 */
class Notification {
    constructor(config, container) {
        this.config = config;
        this.container = container;
        this.element = this.create();
    }

    create() {
        const notif = document.createElement('div');
        notif.className = `notification notification-${this.config.type || 'info'}`;

        let content = '';

        if (this.config.type === 'achievement') {
            content = `
                <div class="notification-achievement">
                    <div class="achievement-header">
                        <span class="achievement-sparkle">✨</span>
                        ACHIEVEMENT UNLOCKED!
                        <span class="achievement-sparkle">✨</span>
                    </div>
                    <div class="achievement-content">
                        <div class="achievement-icon">${this.config.icon}</div>
                        <div class="achievement-details">
                            <div class="achievement-title">${this.config.title}</div>
                            <div class="achievement-description">${this.config.message}</div>
                            <div class="achievement-points">+${this.config.points} Points</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            content = `
                <div class="notification-content">
                    ${this.config.icon ? `<div class="notification-icon">${this.config.icon}</div>` : ''}
                    <div class="notification-text">
                        ${this.config.title ? `<div class="notification-title">${this.config.title}</div>` : ''}
                        <div class="notification-message">${this.config.message}</div>
                    </div>
                    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;
        }

        notif.innerHTML = content;
        return notif;
    }

    show() {
        this.container.appendChild(this.element);

        // Trigger animation
        setTimeout(() => {
            this.element.classList.add('notification-show');
        }, 10);
    }

    hide() {
        this.element.classList.remove('notification-show');
        setTimeout(() => {
            if (this.element.parentElement) {
                this.element.remove();
            }
        }, 300);
    }
}

/**
 * Modal class
 */
class Modal {
    constructor(config, container) {
        this.config = config;
        this.container = container;
        this.element = this.create();
    }

    create() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'modal-dialog';

        let html = `
            <div class="modal-header">
                <h2 class="modal-title">${this.config.title || ''}</h2>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                ${this.config.content || ''}
            </div>
        `;

        if (this.config.buttons && this.config.buttons.length > 0) {
            html += `<div class="modal-footer">`;
            this.config.buttons.forEach((btn, index) => {
                html += `<button class="btn ${btn.class || 'btn-primary'}" data-index="${index}">${btn.text}</button>`;
            });
            html += `</div>`;
        }

        dialog.innerHTML = html;
        modal.appendChild(dialog);

        // Add button event listeners
        if (this.config.buttons) {
            this.config.buttons.forEach((btn, index) => {
                const buttonEl = dialog.querySelector(`[data-index="${index}"]`);
                if (buttonEl && btn.onClick) {
                    buttonEl.addEventListener('click', btn.onClick);
                }
            });
        }

        return modal;
    }

    show() {
        this.container.appendChild(this.element);
        setTimeout(() => {
            this.element.classList.add('modal-show');
        }, 10);
    }

    hide() {
        this.element.classList.remove('modal-show');
        setTimeout(() => {
            if (this.element.parentElement) {
                this.element.remove();
            }
        }, 300);
    }
}

/**
 * Base Screen class
 */
class BaseScreen {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.element = null;
        this.visible = false;
    }

    create() {
        // Override in subclass
        return document.createElement('div');
    }

    show(options = {}) {
        if (!this.element) {
            this.element = this.create();
            this.uiManager.uiContainer.appendChild(this.element);
        }

        this.element.style.display = 'block';
        this.visible = true;
        this.onShow(options);
    }

    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
        this.visible = false;
        this.onHide();
    }

    onShow(options) {
        // Override in subclass
    }

    onHide() {
        // Override in subclass
    }

    destroy() {
        if (this.element && this.element.parentElement) {
            this.element.remove();
        }
        this.element = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager, BaseScreen, Notification, Modal };
}
