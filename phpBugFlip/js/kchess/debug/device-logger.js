// device-logger.js - Mutualisation des logs
class DeviceLogger {
    static log(message, data = null) {
        const isMobile = 'ontouchstart' in window;
        const prefix = isMobile ? '📱' : '🖥️';
        
        console.log(`${prefix} ${message}`);
        if (data) console.log(`${prefix} Data:`, data);
    }

    static error(message, error = null) {
        const isMobile = 'ontouchstart' in window;
        const prefix = isMobile ? '❌📱' : '❌🖥️';
        
        console.error(`${prefix} ${message}`);
        if (error) console.error(`${prefix} Error:`, error);
    }

    static debug(context, data) {
        const isMobile = 'ontouchstart' in window;
        const prefix = isMobile ? '🐛📱' : '🐛🖥️';
        
        console.log(`${prefix} [${context}]`, data);
    }
}

window.DeviceLogger = DeviceLogger;