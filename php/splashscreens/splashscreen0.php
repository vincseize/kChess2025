<style>
    #splash-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100dvh;
        background: #000000; /* Fond noir pur */
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
        /* Animation d'entrée globale */
        animation: fadeIn 1s ease-out forwards;
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
        /* Animation de pulsation douce */
        animation: pulseLogo 3s ease-in-out infinite;
        filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.1));
    }

    .logo-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 120%;
        height: 120%;
        background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 70%);
        z-index: -1;
    }

    /* Barre de chargement minimaliste */
    .loader-line {
        width: 120px;
        height: 2px;
        background: rgba(255, 255, 255, 0.1);
        position: relative;
        overflow: hidden;
        border-radius: 2px;
        margin-top: 10px;
    }

    .loader-line::after {
        content: '';
        position: absolute;
        left: -100%;
        width: 100%;
        height: 100%;
        background: white;
        animation: loadingSlide 1.5s infinite linear;
    }

    /* --- INFOS DE L'APP (JSON) --- */
    .app-info {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
    }

    .app-name {
        color: #ffffff;
        font-size: 1.4rem;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
        opacity: 0.9;
    }

    .app-version {
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.8rem;
        font-family: 'Courier New', Courier, monospace;
    }

    /* Keyframes */
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }

    @keyframes pulseLogo {
        0%, 100% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.05); opacity: 1; }
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
            <img src="img/icon-512x512.png" alt="Logo" class="logo-main">
        </div>
        
        <div class="loader-line"></div>

        <div class="app-info">
            <div class="app-name"><?php echo $config['app_name']; ?></div>
            <div class="app-version">Version <?php echo $config['version']; ?></div>
        </div>
    </div>
</div>