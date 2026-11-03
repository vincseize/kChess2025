// ui/chess-game-ui-styles.js - Version utilisant la configuration JSON comme priorité
class ChessStyleManager {
    
    // Valeur par défaut - sera écrasée par la config JSON si disponible
    static consoleLog = false; // true par défaut pour debug
    
    static init() {
        // Charger la configuration depuis window.appConfig
        this.loadConfig();
        
        // Ne loguer que si consoleLog est true (déterminé par la config)
        if (this.consoleLog) {
            console.log('🎨 ui/chess-game-ui-styles.js chargé');
            console.log(`⚙️ Configuration: console_log = ${this.consoleLog} (${this.getConfigSource()})`);
        } else {
            // Message silencieux si debug désactivé
            console.info('🎨 ChessStyleManager: Mode silencieux activé (debug désactivé dans config)');
        }
    }
    
    // Méthode pour charger la configuration
    static loadConfig() {
        try {
            // Vérifier si la configuration globale existe
            if (window.appConfig && window.appConfig.debug) {
                const configValue = window.appConfig.debug.console_log;
                
                // CONVERSION CORRECTE - Gérer les string "false" et "true"
                if (configValue === "false") {
                    this.consoleLog = false;
                    if (configValue !== "false") {
                        console.info('🔧 ChessStyleManager: console_log désactivé via config JSON');
                    }
                } else if (configValue === false) {
                    this.consoleLog = false;
                } else if (configValue === "true") {
                    this.consoleLog = true;
                } else if (configValue === true) {
                    this.consoleLog = true;
                } else {
                    // Pour toute autre valeur, utiliser Boolean()
                    this.consoleLog = Boolean(configValue);
                }
                
                // Log de confirmation (uniquement en mode debug)
                if (this.consoleLog) {
                    console.log(`⚙️ ChessStyleManager: Configuration chargée - console_log = ${this.consoleLog} (valeur brute: "${configValue}")`);
                }
                return true;
            }
            
            // Si window.appConfig n'existe pas, essayer de le charger via fonction utilitaire
            if (typeof window.getConfig === 'function') {
                const configValue = window.getConfig('debug.console_log', 'true');
                
                if (configValue === "false") {
                    this.consoleLog = false;
                } else if (configValue === false) {
                    this.consoleLog = false;
                } else {
                    this.consoleLog = Boolean(configValue);
                }
                return true;
            }
            
            // Si rien n'est disponible, garder la valeur par défaut
            if (this.consoleLog) {
                console.warn('⚠️ ChessStyleManager: Aucune configuration trouvée, utilisation de la valeur par défaut (true)');
            }
            return false;
            
        } catch (error) {
            console.error('❌ ChessStyleManager: Erreur lors du chargement de la config:', error);
            return false;
        }
    }
    
    // Méthode pour déterminer la source de la configuration
    static getConfigSource() {
        if (window.appConfig) {
            return 'JSON config';
        } else if (typeof window.getConfig === 'function') {
            return 'fonction getConfig';
        } else {
            return 'valeur par défaut';
        }
    }
    
    // Méthode pour vérifier si on est en mode debug
    static isDebugMode() {
        return this.consoleLog;
    }

    constructor(ui) {
        // Vérifier que la configuration est à jour
        this.constructor.loadConfig();
        
        this.ui = ui;
        
        if (this.constructor.consoleLog) {
            console.log('🎨 ChessStyleManager initialisé');
            console.log(`  - UI: ${ui ? '✓' : '✗'}`);
            console.log(`  - Éléments de style à initialiser: 2 (notifications, historique)`);
        }
    }

    initAllStyles() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            try {
                const stylesInitialized = [
                    this.initNotificationStyles(),
                    this.initMoveHistoryStyles()
                ];
                
                return stylesInitialized.filter(Boolean).length === stylesInitialized.length;
            } catch (error) {
                return false;
            }
        }
        
        // Mode debug
        console.log('\n🎨 Initialisation de tous les styles CSS');
        console.log('  📋 Étapes:');
        console.log('    1. Styles des notifications');
        console.log('    2. Styles de l\'historique des coups');
        
        const startTime = performance.now();
        
        const stylesInitialized = [
            this.initNotificationStyles(),
            this.initMoveHistoryStyles()
        ];
        
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        
        const successCount = stylesInitialized.filter(Boolean).length;
        console.log(`\n🎨✅ Initialisation des styles terminée`);
        console.log(`  - Styles initialisés: ${successCount}/${stylesInitialized.length}`);
        console.log(`  - Temps d'exécution: ${duration}ms`);
        
        if (successCount === stylesInitialized.length) {
            console.log(`  ✓ Tous les styles ont été injectés avec succès`);
        } else {
            console.log(`  ⚠️ Certains styles n'ont pas pu être injectés`);
        }
        
        return successCount === stylesInitialized.length;
    }

    initNotificationStyles() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            try {
                // Vérifier si les styles existent déjà
                if (document.getElementById('chess-notification-styles')) {
                    return true;
                }
                
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
                return true;
                
            } catch (error) {
                return false;
            }
        }
        
        // Mode debug
        console.log('\n🎨 Initialisation des styles de notification');
        console.log('  📝 Création des styles pour:');
        console.log('    - .chess-notification (container principal)');
        console.log('    - .success/.error/.info/.warning (variantes)');
        console.log('    - Animation slideIn');
        
        try {
            // Vérifier si les styles existent déjà
            if (document.getElementById('chess-notification-styles')) {
                console.log('  ℹ️ Styles de notification déjà présents');
                return true;
            }
            
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
            
            console.log('  ✅ Styles de notification injectés');
            console.log('    - ID: chess-notification-styles');
            console.log('    - Taille: ' + styleContent.length + ' caractères');
            console.log('    - Selecteurs créés: 5 (.chess-notification + 4 variantes)');
            console.log('    - Propriétés CSS: position, animation, box-shadow, etc.');
            
            return true;
            
        } catch (error) {
            console.error('  ❌ Erreur lors de l\'injection des styles de notification:', error);
            return false;
        }
    }

    initMoveHistoryStyles() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            try {
                // Vérifier si les styles existent déjà
                if (document.getElementById('chess-move-history-styles')) {
                    return true;
                }
                
                const style = document.createElement('style');
                style.id = 'chess-move-history-styles';
                
                const styleContent = `
                    .move-history-container {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        font-size: 14px;
                        line-height: 1.4;
                        max-height: 400px;
                        overflow-y: auto;
                        border: 1px solid var(--site-border);
                        border-radius: 8px;
                        background: var(--site-surface);
                    }
                    
                    .move-row {
                        display: flex;
                        align-items: center;
                        padding: 8px 12px;
                        border-bottom: 1px solid var(--site-border);
                        cursor: pointer;
                        transition: all 0.2s ease;
                        min-height: 36px;
                    }
                    
                    .move-row:hover {
                        background-color: var(--site-surface-alt);
                    }
                    
                    .move-row.selected {
                        background-color: var(--primary-color) !important;
                        color: var(--site-text) !important;
                    }
                    
                    .move-row:last-child {
                        border-bottom: none;
                    }
                    
                    .move-number {
                        color: var(--site-text-muted);
                        font-weight: 600;
                        min-width: 28px;
                        margin-right: 8px;
                        font-size: 13px;
                    }
                    
                    .white-move {
                        color: var(--site-text);
                        font-weight: 600;
                        min-width: 80px;
                        margin-right: 8px;
                    }
                    
                    .black-move {
                        color: var(--site-text-muted);
                        font-weight: 600;
                        min-width: 80px;
                    }
                    
                    .move-row.selected .white-move,
                    .move-row.selected .black-move,
                    .move-row.selected .move-number {
                        color: var(--site-text) !important;
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
                return true;
                
            } catch (error) {
                return false;
            }
        }
        
        // Mode debug
        console.log('\n🎨 Initialisation des styles de l\'historique des coups');
        console.log('  📝 Création des styles pour:');
        console.log('    - .move-history-container (container principal)');
        console.log('    - .move-row (lignes individuelles)');
        console.log('    - .white-move / .black-move (coups)');
        console.log('    - États :hover et .selected');
        console.log('    - Responsive mobile');
        
        try {
            // Vérifier si les styles existent déjà
            if (document.getElementById('chess-move-history-styles')) {
                console.log('  ℹ️ Styles de l\'historique déjà présents');
                return true;
            }
            
            const style = document.createElement('style');
            style.id = 'chess-move-history-styles';
            
            const styleContent = `
                .move-history-container {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 14px;
                    line-height: 1.4;
                    max-height: 400px;
                    overflow-y: auto;
                    border: 1px solid var(--site-border);
                    border-radius: 8px;
                    background: var(--site-surface);
                }
                
                .move-row {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    border-bottom: 1px solid var(--site-border);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-height: 36px;
                }
                
                .move-row:hover {
                    background-color: var(--site-surface-alt);
                }
                
                .move-row.selected {
                    background-color: var(--primary-color) !important;
                    color: var(--site-text) !important;
                }
                
                .move-row:last-child {
                    border-bottom: none;
                }
                
                .move-number {
                    color: var(--site-text-muted);
                    font-weight: 600;
                    min-width: 28px;
                    margin-right: 8px;
                    font-size: 13px;
                }
                
                .white-move {
                    color: var(--site-text);
                    font-weight: 600;
                    min-width: 80px;
                    margin-right: 8px;
                }
                
                .black-move {
                    color: var(--site-text-muted);
                    font-weight: 600;
                    min-width: 80px;
                }
                
                .move-row.selected .white-move,
                .move-row.selected .black-move,
                .move-row.selected .move-number {
                    color: var(--site-text) !important;
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
            
            return true;
            
        } catch (error) {
            console.error('  ❌ Erreur lors de l\'injection des styles de l\'historique:', error);
            return false;
        }
    }

    // Méthode utilitaire pour vérifier si les styles sont présents
    verifyStyles() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            const styles = [
                { id: 'chess-notification-styles' },
                { id: 'chess-move-history-styles' }
            ];
            
            let foundCount = 0;
            
            styles.forEach(style => {
                if (document.getElementById(style.id)) {
                    foundCount++;
                }
            });
            
            return foundCount === styles.length;
        }
        
        // Mode debug
        console.log('\n🎨 Vérification des styles injectés');
        
        const styles = [
            { id: 'chess-notification-styles', name: 'Notifications' },
            { id: 'chess-move-history-styles', name: 'Historique des coups' }
        ];
        
        let foundCount = 0;
        
        styles.forEach(style => {
            const element = document.getElementById(style.id);
            const isPresent = !!element;
            
            const status = isPresent ? '✓' : '✗';
            console.log(`  ${status} ${style.name}: ${isPresent ? 'Présent' : 'Manquant'}`);
            
            if (isPresent && element.textContent) {
                const lines = element.textContent.split('\n').length;
                console.log(`      Lignes CSS: ${lines}, Caractères: ${element.textContent.length}`);
            }
            
            if (isPresent) foundCount++;
        });
        
        console.log(`\n  📊 Résultat: ${foundCount}/${styles.length} styles trouvés`);
        
        if (foundCount === styles.length) {
            console.log('  ✅ Tous les styles sont correctement injectés');
        } else if (foundCount === 0) {
            console.log('  ⚠️ Aucun style trouvé - injection nécessaire');
        } else {
            console.log('  ⚠️ Certains styles sont manquants');
        }
        
        return foundCount === styles.length;
    }
    
    // NOUVELLE MÉTHODE : Obtenir des statistiques détaillées sur les styles
    getStyleStats() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            const stats = {
                notificationStyles: false,
                moveHistoryStyles: false,
                totalStyles: 0,
                allPresent: false
            };
            
            stats.notificationStyles = !!document.getElementById('chess-notification-styles');
            stats.moveHistoryStyles = !!document.getElementById('chess-move-history-styles');
            stats.totalStyles = (stats.notificationStyles ? 1 : 0) + (stats.moveHistoryStyles ? 1 : 0);
            stats.allPresent = stats.totalStyles === 2;
            
            return stats;
        }
        
        // Mode debug
        console.group('📊 Statistiques des styles CSS');
        
        const stats = {
            notificationStyles: {
                id: 'chess-notification-styles',
                present: false,
                lines: 0,
                characters: 0,
                selectors: []
            },
            moveHistoryStyles: {
                id: 'chess-move-history-styles',
                present: false,
                lines: 0,
                characters: 0,
                selectors: []
            },
            totals: {
                stylesPresent: 0,
                totalLines: 0,
                totalCharacters: 0
            }
        };
        
        // Notification styles
        const notificationStyle = document.getElementById('chess-notification-styles');
        if (notificationStyle) {
            stats.notificationStyles.present = true;
            if (notificationStyle.textContent) {
                stats.notificationStyles.lines = notificationStyle.textContent.split('\n').length;
                stats.notificationStyles.characters = notificationStyle.textContent.length;
                
                // Compter les sélecteurs
                const selectorCount = (notificationStyle.textContent.match(/\.([a-zA-Z0-9_-]+)\s*\{/g) || []).length;
                stats.notificationStyles.selectors = selectorCount;
            }
        }
        
        // Move history styles
        const moveHistoryStyle = document.getElementById('chess-move-history-styles');
        if (moveHistoryStyle) {
            stats.moveHistoryStyles.present = true;
            if (moveHistoryStyle.textContent) {
                stats.moveHistoryStyles.lines = moveHistoryStyle.textContent.split('\n').length;
                stats.moveHistoryStyles.characters = moveHistoryStyle.textContent.length;
                
                // Compter les sélecteurs
                const selectorCount = (moveHistoryStyle.textContent.match(/\.([a-zA-Z0-9_-]+)\s*\{/g) || []).length;
                stats.moveHistoryStyles.selectors = selectorCount;
            }
        }
        
        // Totaux
        stats.totals.stylesPresent = (stats.notificationStyles.present ? 1 : 0) + 
                                     (stats.moveHistoryStyles.present ? 1 : 0);
        stats.totals.totalLines = stats.notificationStyles.lines + stats.moveHistoryStyles.lines;
        stats.totals.totalCharacters = stats.notificationStyles.characters + stats.moveHistoryStyles.characters;
        
        console.log('Notifications:', stats.notificationStyles);
        console.log('Historique:', stats.moveHistoryStyles);
        console.log('Totaux:', stats.totals);
        
        console.groupEnd();
        
        return stats;
    }
    
    // NOUVELLE MÉTHODE : Réinjecter les styles manquants
    repairStyles() {
        // Mode silencieux
        if (!this.constructor.consoleLog) {
            const stylesToRepair = [];
            
            if (!document.getElementById('chess-notification-styles')) {
                stylesToRepair.push('notification');
                this.initNotificationStyles();
            }
            
            if (!document.getElementById('chess-move-history-styles')) {
                stylesToRepair.push('moveHistory');
                this.initMoveHistoryStyles();
            }
            
            return stylesToRepair;
        }
        
        // Mode debug
        console.log('\n🔧 Réparation des styles CSS');
        console.log('Vérification des styles manquants...');
        
        const stylesToRepair = [];
        
        if (!document.getElementById('chess-notification-styles')) {
            console.log('  ⚠️ Styles de notification manquants - réinjection...');
            stylesToRepair.push('notification');
            this.initNotificationStyles();
        }
        
        if (!document.getElementById('chess-move-history-styles')) {
            console.log('  ⚠️ Styles de l\'historique manquants - réinjection...');
            stylesToRepair.push('moveHistory');
            this.initMoveHistoryStyles();
        }
        
        if (stylesToRepair.length === 0) {
            console.log('  ✅ Aucune réparation nécessaire - tous les styles sont présents');
        } else {
            console.log(`  ✅ Réparation terminée - ${stylesToRepair.length} style(s) réinjecté(s)`);
            console.log('  Styles réparés:', stylesToRepair);
        }
        
        return stylesToRepair;
    }
}

// Initialisation statique
ChessStyleManager.init();

// Exposer la classe globalement
window.ChessStyleManager = ChessStyleManager;

// Ajouter des fonctions utilitaires globales
window.StyleManagerUtils = {
    // Forcer le rechargement de la config
    reloadConfig: () => ChessStyleManager.reloadConfig(),
    
    // Obtenir l'état actuel
    getState: () => ({
        consoleLog: ChessStyleManager.consoleLog,
        source: ChessStyleManager.getConfigSource(),
        debugMode: ChessStyleManager.isDebugMode(),
        configValue: window.appConfig?.debug?.console_log
    }),
    
    // Activer/désactiver manuellement (temporaire)
    setConsoleLog: (value) => {
        const oldValue = ChessStyleManager.consoleLog;
        ChessStyleManager.consoleLog = Boolean(value);
        console.log(`🔧 ChessStyleManager: consoleLog changé manuellement: ${oldValue} → ${ChessStyleManager.consoleLog}`);
        return ChessStyleManager.consoleLog;
    },
    
    // Tester la création d'un StyleManager
    testStyleManager: (ui) => {
        console.group('🧪 Test ChessStyleManager');
        const styleManager = new ChessStyleManager(ui);
        console.log('StyleManager créé:', styleManager);
        console.log('Vérification styles:', styleManager.verifyStyles());
        console.log('Statistiques:', styleManager.getStyleStats());
        console.log('Statut config:', ChessStyleManager.getConfigStatus());
        console.groupEnd();
        return styleManager;
    },
    
    // Vérifier manuellement les styles
    checkStyles: () => {
        console.group('🔍 Vérification manuelle des styles');
        
        const notificationStyle = document.getElementById('chess-notification-styles');
        const moveHistoryStyle = document.getElementById('chess-move-history-styles');
        
        console.log('Styles de notification:', notificationStyle ? '✅ PRÉSENT' : '❌ MANQUANT');
        console.log('Styles de l\'historique:', moveHistoryStyle ? '✅ PRÉSENT' : '❌ MANQUANT');
        
        if (notificationStyle) {
            console.log('Contenu notification:', notificationStyle.textContent.substring(0, 100) + '...');
        }
        
        if (moveHistoryStyle) {
            console.log('Contenu historique:', moveHistoryStyle.textContent.substring(0, 100) + '...');
        }
        
        console.groupEnd();
        
        return {
            notification: !!notificationStyle,
            moveHistory: !!moveHistoryStyle
        };
    },
    
    // Réparer les styles manquants
    repairMissingStyles: (styleManager) => {
        if (!styleManager || !styleManager.repairStyles) {
            console.log('❌ StyleManager ou méthode repairStyles non disponible');
            return [];
        }
        
        console.group('🔧 Réparation manuelle des styles');
        const repaired = styleManager.repairStyles();
        console.log('Styles réparés:', repaired);
        console.groupEnd();
        
        return repaired;
    }
};

// Méthode statique pour obtenir le statut de la configuration
ChessStyleManager.getConfigStatus = function() {
    return {
        consoleLog: this.consoleLog,
        source: this.getConfigSource(),
        debugMode: this.isDebugMode(),
        appConfigAvailable: !!window.appConfig,
        configValue: window.appConfig?.debug?.console_log
    };
};

// Méthode statique pour forcer la mise à jour de la configuration
ChessStyleManager.reloadConfig = function() {
    const oldValue = this.consoleLog;
    this.loadConfig();
    
    if (this.consoleLog && oldValue !== this.consoleLog) {
        console.log(`🔄 ChessStyleManager: Configuration rechargée: ${oldValue} → ${this.consoleLog}`);
    }
    return this.consoleLog;
};

// Vérifier la configuration après le chargement complet de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            ChessStyleManager.loadConfig();
            if (ChessStyleManager.consoleLog) {
                console.log('✅ ChessStyleManager: Configuration vérifiée après chargement du DOM');
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        ChessStyleManager.loadConfig();
    }, 100);
}

// Message final basé sur la configuration
if (ChessStyleManager.consoleLog) {
    console.log('✅ ChessStyleManager prêt (mode debug activé)');
} else {
    console.info('✅ ChessStyleManager prêt (mode silencieux)');
}