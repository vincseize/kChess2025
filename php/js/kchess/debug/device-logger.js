// debug/device-logger.js - Centralisation et enrichissement des logs par appareil
class DeviceLogger {
    
    static consoleLog = true;
    static VERSION = '1.2.0';
    
    /**
     * Initialisation avec récupération de la config globale
     */
    static init() {
        this.loadConfig();
        if (this.consoleLog) {
            console.log(`🚀 [DeviceLogger] v${this.VERSION} initialisé (Source: ${window.appConfig ? 'JSON' : 'Default'})`);
        }
    }

    /**
     * Charge la configuration depuis window.appConfig
     */
    static loadConfig() {
        try {
            if (window.appConfig && window.appConfig.debug) {
                const configValue = window.appConfig.debug.console_log;
                // Gestion robuste du type (string "false" vs boolean false)
                this.consoleLog = configValue === 'false' ? false : Boolean(configValue);
            }
        } catch (error) {
            this.consoleLog = true; // Repli sécurisé
        }
    }

    /**
     * Analyse complète de l'appareil
     */
    static getDeviceInfo() {
        const isMobile = 'ontouchstart' in window || window.innerWidth <= 768;
        const ua = navigator.userAgent;
        
        return {
            isMobile: isMobile,
            icon: isMobile ? '📱' : '🖥️',
            errorIcon: isMobile ? '❌📱' : '❌🖥️',
            warnIcon: isMobile ? '⚠️📱' : '⚠️🖥️',
            debugIcon: isMobile ? '🐛📱' : '🐛🖥️',
            infoIcon: isMobile ? 'ℹ️📱' : 'ℹ️🖥️',
            perfIcon: isMobile ? '⚡📱' : '⚡🖥️',
            memoryIcon: isMobile ? '💾📱' : '💾🖥️',
            deviceType: isMobile ? 'Mobile' : 'Desktop',
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            os: this.getOS(ua)
        };
    }

    static getOS(ua) {
        if (ua.indexOf("Win") !== -1) return "Windows";
        if (ua.indexOf("Mac") !== -1) return "MacOS";
        if (ua.indexOf("Linux") !== -1) return "Linux";
        if (ua.indexOf("Android") !== -1) return "Android";
        if (ua.indexOf("like Mac") !== -1) return "iOS";
        return "Inconnu";
    }

    // --- Méthodes de Log Standardisées ---

    static log(message, data = null) {
        if (!this.consoleLog) return;
        const info = this.getDeviceInfo();
        console.log(`${info.icon} [Log] ${message}`, data || '');
    }

    static error(message, error = null) {
        if (!this.consoleLog) return;
        const info = this.getDeviceInfo();
        console.error(`${info.errorIcon} [Error] ${message}`, error || '');
    }

    static warn(message, data = null) {
        if (!this.consoleLog) return;
        const info = this.getDeviceInfo();
        console.warn(`${info.warnIcon} [Warn] ${message}`, data || '');
    }

    static debug(context, data) {
        if (!this.consoleLog) return;
        const info = this.getDeviceInfo();
        console.log(`${info.debugIcon} [Debug][${context}]`, data);
    }

    static performance(marker, startTime = null) {
        if (!this.consoleLog) return;
        const info = this.getDeviceInfo();
        if (startTime) {
            const duration = (performance.now() - startTime).toFixed(2);
            console.log(`${info.perfIcon} [Perf] ${marker}: ${duration}ms`);
            return duration;
        }
        return performance.now();
    }

    /**
     * Affiche l'état de la mémoire (Chrome/Edge uniquement)
     */
    static memoryUsage() {
        if (!this.consoleLog || !performance.memory) return;
        const info = this.getDeviceInfo();
        const mem = performance.memory;
        const used = (mem.usedJSHeapSize / 1048576).toFixed(2);
        console.log(`${info.memoryIcon} [Memory] ${used}MB utilisés sur ${(mem.jsHeapSizeLimit / 1048576).toFixed(0)}MB`);
    }

    // --- Rapports Groupés ---

    static logSystemInfo() {
        if (!this.consoleLog) return;
        const info = this.getDeviceInfo();
        
        console.groupCollapsed(`${info.icon} [DeviceLogger] Système & Environnement`);
        console.log(`Type: ${info.deviceType} (${info.os})`);
        console.log(`Écran: ${info.screenSize} (DPR: ${window.devicePixelRatio})`);
        console.log(`Mapsur: ${navigator.userAgent}`);
        console.log(`Connexion: ${navigator.onLine ? '✅ En ligne' : '❌ Hors ligne'}`);
        console.log(`URL: ${window.location.href}`);
        console.groupEnd();
    }
}

// Initialisation immédiate
DeviceLogger.init();

// Injection globale
window.DeviceLogger = DeviceLogger;

// Rapports automatiques au chargement
document.addEventListener('DOMContentLoaded', () => {
    // Petit délai pour laisser les autres scripts se stabiliser
    setTimeout(() => {
        DeviceLogger.logSystemInfo();
        DeviceLogger.memoryUsage();
        
        // Surveillance intelligente du redimensionnement
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                DeviceLogger.debug('Resolution', `${window.innerWidth}x${window.innerHeight}`);
            }, 250);
        });
    }, 1200);
});