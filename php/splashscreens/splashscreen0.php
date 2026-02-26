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
        width: 180px; /* Taille ajustable */
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

    /* Petite lueur derrière le logo */
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

    /* Keyframes */
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }

    @keyframes pulseLogo {
        0%, 100% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.05); opacity: 1; }
    }

    /* Barre de chargement minimaliste */
    .loader-line {
        width: 100px;
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
    </div>
</div>

<script>
    // Pas de script complexe ici pour garder le splash ultra-léger et rapide.
    // La fermeture est gérée par le window.addEventListener('load') dans ton index.php.
</script>