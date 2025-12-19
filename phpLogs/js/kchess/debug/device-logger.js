// debug/device-logger.js - Mutualisation des logs
class DeviceLogger {
    
    static consoleLog = true; // false pour production, true pour debug
    
    static init() {
        if (this.consoleLog) {
            console.log('debug/device-logger.js loaded');
        }
    }

    static detectDevice() {
        const isMobile = 'ontouchstart' in window;
        const userAgent = navigator.userAgent.toLowerCase();
        
        const deviceInfo = {
            isMobile: isMobile,
            isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            userAgent: userAgent.substring(0, 50) + '...',
            screenSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            platform: navigator.platform,
            deviceType: isMobile ? '📱 Mobile' : '🖥️ Desktop'
        };
        
        if (this.consoleLog) {
            console.log('\n📊 [DeviceLogger] === DÉTECTION DE L\'APPAREIL ===');
            console.log('📊 [DeviceLogger] Informations détectées:', deviceInfo);
            console.log('📊 [DeviceLogger] === FIN DÉTECTION ===\n');
        }
        
        return deviceInfo;
    }

    static log(message, data = null) {
        if (!this.consoleLog) return;
        
        const deviceInfo = this.getDeviceInfo();
        
        console.log(`${deviceInfo.icon} [DeviceLogger] ${message}`);
        if (data) {
            console.log(`${deviceInfo.icon} [DeviceLogger] Détails:`, data);
        }
    }

    static error(message, error = null) {
        if (!this.consoleLog) return;
        
        const deviceInfo = this.getDeviceInfo();
        
        console.error(`${deviceInfo.errorIcon} [DeviceLogger] ${message}`);
        if (error) {
            console.error(`${deviceInfo.errorIcon} [DeviceLogger] Erreur:`, error);
            if (error.stack) {
                console.error(`${deviceInfo.errorIcon} [DeviceLogger] Stack trace:`, error.stack);
            }
        }
    }

    static warn(message, data = null) {
        if (!this.consoleLog) return;
        
        const deviceInfo = this.getDeviceInfo();
        
        console.warn(`${deviceInfo.warnIcon} [DeviceLogger] ${message}`);
        if (data) {
            console.warn(`${deviceInfo.warnIcon} [DeviceLogger] Avertissement:`, data);
        }
    }

    static debug(context, data) {
        if (!this.consoleLog) return;
        
        const deviceInfo = this.getDeviceInfo();
        
        console.log(`${deviceInfo.debugIcon} [DeviceLogger] [${context}]`, data);
    }

    static info(message, data = null) {
        if (!this.consoleLog) return;
        
        const deviceInfo = this.getDeviceInfo();
        
        console.info(`${deviceInfo.infoIcon} [DeviceLogger] ${message}`);
        if (data) {
            console.info(`${deviceInfo.infoIcon} [DeviceLogger] Infos:`, data);
        }
    }

    static group(title) {
        if (!this.consoleLog) return;
        
        const deviceInfo = this.getDeviceInfo();
        
        console.group(`${deviceIcon} [DeviceLogger] ${title}`);
    }

    static groupEnd() {
        if (!this.consoleLog) return;
        
        console.groupEnd();
    }

    static performance(marker, startTime = null) {
        if (!this.consoleLog) return;
        
        const deviceInfo = this.getDeviceInfo();
        
        if (startTime) {
            const duration = performance.now() - startTime;
            console.log(`${deviceInfo.perfIcon} [DeviceLogger] Performance ${marker}: ${duration.toFixed(2)}ms`);
            return duration;
        } else {
            const time = performance.now();
            console.log(`${deviceInfo.perfIcon} [DeviceLogger] Performance marker: ${marker}`);
            return time;
        }
    }

    static memoryUsage() {
        if (!this.consoleLog) return;
        
        if (performance.memory) {
            const memory = performance.memory;
            const deviceInfo = this.getDeviceInfo();
            
            console.log(`${deviceInfo.memoryIcon} [DeviceLogger] Usage mémoire:`);
            console.log(`  • Utilisée: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
            console.log(`  • Totale: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`);
            console.log(`  • Limite: ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`);
            console.log(`  • Pourcentage: ${((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100).toFixed(1)}%`);
        }
    }

    static getDeviceInfo() {
        const isMobile = 'ontouchstart' in window || window.innerWidth <= 768;
        
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
            screenSize: `${window.innerWidth}x${window.innerHeight}`
        };
    }
    
    static logSystemInfo() {
        if (!this.consoleLog) return;
        
        const deviceInfo = this.getDeviceInfo();
        
        console.log('\n📋 [DeviceLogger] === INFORMATIONS SYSTÈME ===');
        console.log(`${deviceInfo.icon} [DeviceLogger] Appareil: ${deviceInfo.deviceType}`);
        console.log(`${deviceInfo.icon} [DeviceLogger] Écran: ${deviceInfo.screenSize}`);
        console.log(`${deviceInfo.icon} [DeviceLogger] Navigateur: ${navigator.userAgent.substring(0, 80)}...`);
        console.log(`${deviceInfo.icon} [DeviceLogger] Langue: ${navigator.language}`);
        console.log(`${deviceInfo.icon} [DeviceLogger] En ligne: ${navigator.onLine ? '✅ OUI' : '❌ NON'}`);
        console.log(`${deviceInfo.icon} [DeviceLogger] Cores CPU: ${navigator.hardwareConcurrency || 'Inconnu'}`);
        console.log('📋 [DeviceLogger] === FIN INFORMATIONS ===\n');
    }
    
    static logEnvironment() {
        if (!this.consoleLog) return;
        
        console.log('\n🌍 [DeviceLogger] === ENVIRONNEMENT ===');
        console.log(`🌍 [DeviceLogger] URL: ${window.location.href}`);
        console.log(`🌍 [DeviceLogger] Protocole: ${window.location.protocol}`);
        console.log(`🌍 [DeviceLogger] Hostname: ${window.location.hostname}`);
        console.log(`🌍 [DeviceLogger] Port: ${window.location.port || '80/443'}`);
        console.log(`🌍 [DeviceLogger] Chemin: ${window.location.pathname}`);
        console.log('🌍 [DeviceLogger] === FIN ENVIRONNEMENT ===\n');
    }
}

// Initialisation statique
DeviceLogger.init();

// Détection automatique au chargement
if (DeviceLogger.consoleLog) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            DeviceLogger.logSystemInfo();
            DeviceLogger.logEnvironment();
            
            // Log initial
            const deviceInfo = DeviceLogger.getDeviceInfo();
            DeviceLogger.log(`Logger initialisé sur ${deviceInfo.deviceType} (${deviceInfo.screenSize})`);
            
            // Monitorer les changements de taille
            window.addEventListener('resize', () => {
                DeviceLogger.debug('Resize', `${window.innerWidth}x${window.innerHeight}`);
            });
        }, 1000);
    });
}

window.DeviceLogger = DeviceLogger;