<?php
/**
 * Splash Screen Version 0 - Premium Dark Edition
 * Animation : Fast Pop-in SVG
 */
?>
<style>
    #splash-screen {
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100dvh;
        background: #000000;
        z-index: 1000000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        transition: opacity 0.8s ease-in-out;
    }

    #splash-content {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        /* Entrée globale plus nerveuse */
        animation: fadeInGlobal 0.4s ease-out forwards;
    }

    .logo-container {
        position: relative;
        width: 180px; 
        height: 180px;
        margin-bottom: 20px;
    }

    .logo-main {
        width: 100%;
        height: 100%;
        object-fit: contain;
        /* Animation dédiée au logo : très rapide (0.3s) */
        animation: logoPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, 
                   pulseLogo 3s ease-in-out infinite 0.3s;
        filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.1));
        opacity: 0;
    }

    .logo-glow {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 140%; height: 140%;
        background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 70%);
        z-index: -1;
        opacity: 0;
        animation: fadeInGlobal 0.8s ease-out forwards 0.2s;
    }

    .loader-line {
        width: 140px;
        height: 2px;
        background: rgba(255, 255, 255, 0.1);
        position: relative;
        overflow: hidden;
        border-radius: 2px;
        margin-top: 15px;
    }

    .loader-line::after {
        content: '';
        position: absolute;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, #ffffff, transparent);
        animation: loadingSlide 1.2s infinite linear;
    }

    .app-info {
        margin-top: 25px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
    }

    .app-name {
        color: #ffffff;
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: 4px;
        text-transform: uppercase;
        opacity: 0.95;
    }

    .app-version {
        color: rgba(255, 255, 255, 0.35);
        font-size: 0.75rem;
        font-family: 'Courier New', Courier, monospace;
    }

    /* KEYFRAMES NERVEUX */
    @keyframes fadeInGlobal {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes logoPop {
        0% { opacity: 0; transform: scale(0.5); }
        100% { opacity: 1; transform: scale(1); }
    }

    @keyframes pulseLogo {
        0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.1)); }
        50% { transform: scale(1.03); filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.2)); }
    }

    @keyframes loadingSlide {
        0% { left: -100%; }
        100% { left: 100%; }
    }
</style>

<div id="splash-screen">
    <div id="splash-content">
        <div class="logo-container">
            <div class="logo-glow"></div>
            <img src="img/icon.svg" alt="Logo" class="logo-main">
        </div>
        
        <div class="loader-line"></div>

        <div class="app-info">
            <div class="app-name"><?php echo htmlspecialchars($config['app_name'] ?? 'K-CHESS'); ?></div>
            <div class="app-version">BUILD <?php echo htmlspecialchars($config['version'] ?? '1.0'); ?></div>
        </div>
    </div>
</div>