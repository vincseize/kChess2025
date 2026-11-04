// check_device.js

// Variable pour contrôler les console.log - mettre à false pour désactiver
const DEBUG_MODE = false;

document.addEventListener("DOMContentLoaded", function() {


    // Gérer les deux boutons "Nouvelle Partie"
    document.getElementById('newGame')?.addEventListener('click', () => game.newGame());
    document.getElementById('newGameMobile')?.addEventListener('click', () => game.newGame());
    
    // Gérer les deux boutons "Tourner"
    document.getElementById('flipBoard')?.addEventListener('click', () => game.flipBoard());
    document.getElementById('flipBoardMobile')?.addEventListener('click', () => game.flipBoard());

    // Déplacer ces fonctions utilitaires en haut
    function getScreenOrientation() {
        if (screen.orientation) {
            return screen.orientation.type;
        } else if (window.orientation !== undefined) {
            return Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait';
        } else {
            return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        }
    }
    
    function getViewportOrientation() {
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }
    
    function getBrowserName() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
        if (userAgent.includes('Edg')) return 'Edge';
        if (userAgent.includes('Opera') || userAgent.includes('OPR/')) return 'Opera';
        return 'Unknown';
    }
    
    function getBrowserVersion() {
        const userAgent = navigator.userAgent;
        const browser = getBrowserName();
        
        switch(browser) {
            case 'Chrome':
                return userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'unknown';
            case 'Firefox':
                return userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || 'unknown';
            case 'Safari':
                return userAgent.match(/Version\/([0-9.]+)/)?.[1] || 'unknown';
            case 'Edge':
                return userAgent.match(/Edg\/([0-9.]+)/)?.[1] || 'unknown';
            case 'Opera':
                return userAgent.match(/(Opera|OPR)\/([0-9.]+)/)?.[2] || 'unknown';
            default:
                return 'unknown';
        }
    }
    
    function getOS() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac')) return 'macOS';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
        return 'Unknown';
    }
    
    function getNetworkInfo() {
        if (navigator.connection) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
        return 'unknown';
    }
    
    function getMemoryInfo() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB',
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB'
            };
        }
        return 'unknown';
    }
    
    function getPerformanceTiming() {
        if (performance.timing) {
            const timing = performance.timing;
            return {
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                readyStart: timing.fetchStart - timing.navigationStart,
                redirectTime: timing.redirectEnd - timing.redirectStart,
                appcacheTime: timing.domainLookupStart - timing.fetchStart,
                unloadEventTime: timing.unloadEventEnd - timing.unloadEventStart,
                lookupDomainTime: timing.domainLookupEnd - timing.domainLookupStart,
                connectTime: timing.connectEnd - timing.connectStart,
                requestTime: timing.responseEnd - timing.requestStart,
                initDomTreeTime: timing.domInteractive - timing.responseEnd,
                loadEventTime: timing.loadEventEnd - timing.loadEventStart
            };
        }
        return 'unknown';
    }
    
    function checkWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                     (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    // Fonction pour logger conditionnel
    function debugLog(...args) {
        if (DEBUG_MODE) {
            console.log(...args);
        }
    }

    // Fonction principale pour récupérer toutes les infos
    function checkDevice() {
        const deviceInfo = {
            // Informations écran
            screen: {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                orientation: getScreenOrientation()
            },
            
            // Informations navigateur
            browser: {
                name: getBrowserName(),
                version: getBrowserVersion(),
                userAgent: navigator.userAgent,
                language: navigator.language,
                languages: navigator.languages,
                cookieEnabled: navigator.cookieEnabled,
                javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
                pdfViewerEnabled: navigator.pdfViewerEnabled || false,
                onLine: navigator.onLine
            },
            
            // Informations système
            system: {
                platform: navigator.platform,
                os: getOS(),
                cpuCores: navigator.hardwareConcurrency || 'unknown',
                deviceMemory: navigator.deviceMemory || 'unknown',
                maxTouchPoints: navigator.maxTouchPoints || 0
            },
            
            // Informations réseau
            network: {
                connection: getNetworkInfo(),
                downlink: navigator.connection ? navigator.connection.downlink : 'unknown',
                effectiveType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
                saveData: navigator.connection ? navigator.connection.saveData : false
            },
            
            // Informations géographiques (si disponibles)
            location: {
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                locale: Intl.DateTimeFormat().resolvedOptions().locale
            },
            
            // Informations de performance
            performance: {
                memory: getMemoryInfo(),
                timing: getPerformanceTiming()
            },
            
            // Informations sur les fonctionnalités supportées
            features: {
                touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
                serviceWorker: 'serviceWorker' in navigator,
                webGL: checkWebGL(),
                webRTC: !!window.RTCPeerConnection,
                webAudio: !!window.AudioContext || !!window.webkitAudioContext,
                geolocation: 'geolocation' in navigator,
                notifications: 'Notification' in window,
                localStorage: !!window.localStorage,
                sessionStorage: !!window.sessionStorage,
                indexedDB: !!window.indexedDB,
                webAssembly: !!window.WebAssembly
            },
            
            // Informations sur la vue courante
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio,
                orientation: getViewportOrientation()
            },
            
            // Date et heure
            timestamp: {
                current: new Date().toISOString(),
                timezoneOffset: new Date().getTimezoneOffset(),
                localeTime: new Date().toLocaleString()
            }
        };
        
        return deviceInfo;
    }
    
    // Fonction pour afficher les résultats (optionnel - pour debug)
    function displayDeviceInfo(info) {
        if (!DEBUG_MODE) return;
        
        debugLog('=== INFORMATIONS COMPLÈTES DE L\'APPAREIL ===');
        debugLog('📱 ÉCRAN:', info.screen);
        debugLog('🌐 NAVIGATEUR:', info.browser);
        debugLog('💻 SYSTÈME:', info.system);
        debugLog('📶 RÉSEAU:', info.network);
        debugLog('📍 LOCALISATION:', info.location);
        debugLog('⚡ PERFORMANCE:', info.performance);
        debugLog('🔧 FONCTIONNALITÉS:', info.features);
        debugLog('👀 VIEWPORT:', info.viewport);
        debugLog('🕒 TIMESTAMP:', info.timestamp);
    }
    
    // Fonction pour détecter les changements d'orientation
    function setupOrientationListener() {
        window.addEventListener('resize', function() {
            const orientation = getViewportOrientation();
            debugLog(`🔄 Changement d'orientation: ${orientation}`);
            
            // Déclencher un événement personnalisé
            window.dispatchEvent(new CustomEvent('orientationChange', {
                detail: { orientation: orientation }
            }));
        });
        
        if (screen.orientation) {
            screen.orientation.addEventListener('change', function() {
                debugLog(`🔄 Orientation écran changée: ${screen.orientation.type}`);
            });
        }
    }
    
    // Fonction pour surveiller la connexion réseau
    function setupNetworkListener() {
        if (navigator.connection) {
            navigator.connection.addEventListener('change', function() {
                debugLog('📶 Changement de connexion:', getNetworkInfo());
            });
        }
        
        window.addEventListener('online', function() {
            debugLog('✅ Connexion rétablie');
        });
        
        window.addEventListener('offline', function() {
            debugLog('❌ Hors ligne');
        });
    }
    
    // Initialisation
    const deviceInfo = checkDevice();
    
    // Afficher les informations
    displayDeviceInfo(deviceInfo);
    
    // Configurer les écouteurs d'événements
    setupOrientationListener();
    setupNetworkListener();
    
    // Exposer les fonctions globalement si nécessaire
    window.getDeviceInfo = checkDevice;
    window.getCurrentOrientation = getViewportOrientation;
    
    if (DEBUG_MODE) {
        debugLog('✅ check_device.js chargé avec succès');
    }
});

// Fonction pour obtenir un résumé rapide
function getQuickDeviceSummary() {
    function getBrowserName() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
        if (userAgent.includes('Edg')) return 'Edge';
        if (userAgent.includes('Opera') || userAgent.includes('OPR/')) return 'Opera';
        return 'Unknown';
    }
    
    function getBrowserVersion() {
        const userAgent = navigator.userAgent;
        const browser = getBrowserName();
        
        switch(browser) {
            case 'Chrome':
                return userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'unknown';
            case 'Firefox':
                return userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || 'unknown';
            case 'Safari':
                return userAgent.match(/Version\/([0-9.]+)/)?.[1] || 'unknown';
            case 'Edge':
                return userAgent.match(/Edg\/([0-9.]+)/)?.[1] || 'unknown';
            case 'Opera':
                return userAgent.match(/(Opera|OPR)\/([0-9.]+)/)?.[2] || 'unknown';
            default:
                return 'unknown';
        }
    }
    
    function getOS() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac')) return 'macOS';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
        return 'Unknown';
    }
    
    function getViewportOrientation() {
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }
    
    return {
        browser: getBrowserName() + ' ' + getBrowserVersion(),
        os: getOS(),
        screen: screen.width + 'x' + screen.height,
        orientation: getViewportOrientation(),
        touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        connection: navigator.connection ? navigator.connection.effectiveType : 'unknown'
    };
}