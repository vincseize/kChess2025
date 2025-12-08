// ui/chess-game-ui-styles.js - Gestion des styles CSS
class ChessStyleManager {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('ui/chess-game-ui-styles.js loaded');
        }
    }

    constructor(ui) {
        this.ui = ui;
        
        if (this.constructor.consoleLog) {
            console.log('🎨 ChessStyleManager initialisé');
            console.log(`  - UI: ${ui ? '✓' : '✗'}`);
            console.log(`  - Éléments de style à initialiser: 2 (notifications, historique)`);
        }
    }

    initAllStyles() {
        if (this.constructor.consoleLog) {
            console.log('\n🎨 Initialisation de tous les styles CSS');
            console.log('  📋 Étapes:');
            console.log('    1. Styles des notifications');
            console.log('    2. Styles de l\'historique des coups');
        }
        
        const startTime = performance.now();
        
        const stylesInitialized = [
            this.initNotificationStyles(),
            this.initMoveHistoryStyles()
        ];
        
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        
        if (this.constructor.consoleLog) {
            const successCount = stylesInitialized.filter(Boolean).length;
            console.log(`\n🎨✅ Initialisation des styles terminée`);
            console.log(`  - Styles initialisés: ${successCount}/${stylesInitialized.length}`);
            console.log(`  - Temps d'exécution: ${duration}ms`);
            
            if (successCount === stylesInitialized.length) {
                console.log(`  ✓ Tous les styles ont été injectés avec succès`);
            } else {
                console.log(`  ⚠️ Certains styles n'ont pas pu être injectés`);
            }
        }
    }

    initNotificationStyles() {
        if (this.constructor.consoleLog) {
            console.log('\n🎨 Initialisation des styles de notification');
            console.log('  📝 Création des styles pour:');
            console.log('    - .chess-notification (container principal)');
            console.log('    - .success/.error/.info/.warning (variantes)');
            console.log('    - Animation slideIn');
        }
        
        try {
            const style = document.createElement('style');
            style.id = 'chess-notification-styles';
            
            const styleContent = `
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
            
            style.textContent = styleContent;
            document.head.appendChild(style);
            
            if (this.constructor.consoleLog) {
                console.log('  ✅ Styles de notification injectés');
                console.log('    - ID: chess-notification-styles');
                console.log('    - Taille: ' + styleContent.length + ' caractères');
                console.log('    - Selecteurs créés: 5 (.chess-notification + 4 variantes)');
                console.log('    - Propriétés CSS: position, animation, box-shadow, etc.');
            }
            
            return true;
            
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.error('  ❌ Erreur lors de l\'injection des styles de notification:', error);
            }
            return false;
        }
    }

    initMoveHistoryStyles() {
        if (this.constructor.consoleLog) {
            console.log('\n🎨 Initialisation des styles de l\'historique des coups');
            console.log('  📝 Création des styles pour:');
            console.log('    - .move-history-container (container principal)');
            console.log('    - .move-row (lignes individuelles)');
            console.log('    - .white-move / .black-move (coups)');
            console.log('    - États :hover et .selected');
            console.log('    - Responsive mobile');
        }
        
        try {
            const style = document.createElement('style');
            style.id = 'chess-move-history-styles';
            
            const styleContent = `
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
            
            style.textContent = styleContent;
            document.head.appendChild(style);
            
            if (this.constructor.consoleLog) {
                console.log('  ✅ Styles de l\'historique injectés');
                console.log('    - ID: chess-move-history-styles');
                console.log('    - Taille: ' + styleContent.length + ' caractères');
                console.log('    - Selecteurs créés: 8 principaux');
                console.log('    - Breakpoint mobile: 768px');
                console.log('    - Couleurs:');
                console.log('      * Blanc: #2c3e50');
                console.log('      * Noir: #7f8c8d');
                console.log('      * Sélection: #007bff');
                console.log('    - Propriétés: flexbox, transitions, responsive');
            }
            
            return true;
            
        } catch (error) {
            if (this.constructor.consoleLog) {
                console.error('  ❌ Erreur lors de l\'injection des styles de l\'historique:', error);
            }
            return false;
        }
    }

    // Méthode utilitaire pour vérifier si les styles sont présents
    verifyStyles() {
        if (this.constructor.consoleLog) {
            console.log('\n🎨 Vérification des styles injectés');
        }
        
        const styles = [
            { id: 'chess-notification-styles', name: 'Notifications' },
            { id: 'chess-move-history-styles', name: 'Historique des coups' }
        ];
        
        let foundCount = 0;
        
        styles.forEach(style => {
            const element = document.getElementById(style.id);
            const isPresent = !!element;
            
            if (this.constructor.consoleLog) {
                const status = isPresent ? '✓' : '✗';
                console.log(`  ${status} ${style.name}: ${isPresent ? 'Présent' : 'Manquant'}`);
                
                if (isPresent && element.textContent) {
                    const lines = element.textContent.split('\n').length;
                    console.log(`      Lignes CSS: ${lines}, Caractères: ${element.textContent.length}`);
                }
            }
            
            if (isPresent) foundCount++;
        });
        
        if (this.constructor.consoleLog) {
            console.log(`\n  📊 Résultat: ${foundCount}/${styles.length} styles trouvés`);
            
            if (foundCount === styles.length) {
                console.log('  ✅ Tous les styles sont correctement injectés');
            } else if (foundCount === 0) {
                console.log('  ⚠️ Aucun style trouvé - injection nécessaire');
            } else {
                console.log('  ⚠️ Certains styles sont manquants');
            }
        }
        
        return foundCount === styles.length;
    }
}

// Initialisation statique
ChessStyleManager.init();

window.ChessStyleManager = ChessStyleManager;