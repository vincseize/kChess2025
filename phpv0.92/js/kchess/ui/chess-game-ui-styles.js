// chess-game-ui-styles.js - Gestion des styles CSS
class ChessStyleManager {
    constructor(ui) {
        this.ui = ui;
    }

    initAllStyles() {
        this.initNotificationStyles();
        this.initMoveHistoryStyles();
    }

    initNotificationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .chess-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            .chess-notification.success {
                background: #28a745;
            }
            
            .chess-notification.error {
                background: #dc3545;
            }
            
            .chess-notification.info {
                background: #17a2b8;
            }
            
            .chess-notification.warning {
                background: #ffc107;
                color: #212529;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    initMoveHistoryStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .move-history-container {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 14px;
                line-height: 1.4;
                max-height: 400px;
                overflow-y: auto;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                background: #fafafa;
            }
            
            .move-row {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                border-bottom: 1px solid #e8e8e8;
                cursor: pointer;
                transition: all 0.2s ease;
                min-height: 36px;
            }
            
            .move-row:hover {
                background-color: #f0f8ff;
            }
            
            .move-row.selected {
                background-color: #007bff !important;
                color: white !important;
            }
            
            .move-row:last-child {
                border-bottom: none;
            }
            
            .move-number {
                color: #666;
                font-weight: 600;
                min-width: 28px;
                margin-right: 8px;
                font-size: 13px;
            }
            
            .white-move {
                color: #2c3e50;
                font-weight: 600;
                min-width: 80px;
                margin-right: 8px;
            }
            
            .black-move {
                color: #7f8c8d;
                font-weight: 600;
                min-width: 80px;
            }
            
            .move-row.selected .white-move,
            .move-row.selected .black-move,
            .move-row.selected .move-number {
                color: white !important;
            }
            
            @media (max-width: 768px) {
                .move-history-container {
                    font-size: 13px;
                    max-height: 300px;
                }
                
                .move-row {
                    padding: 6px 8px;
                    min-height: 32px;
                }
                
                .move-number {
                    min-width: 24px;
                    margin-right: 6px;
                }
                
                .white-move,
                .black-move {
                    min-width: 70px;
                    margin-right: 6px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}