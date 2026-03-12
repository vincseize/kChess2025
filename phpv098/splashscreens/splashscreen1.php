<div id="splash-screen">
    <canvas id="snow-canvas"></canvas>
    <div id="splash-content">
        <div style="font-size: 5rem; line-height: 1; display: flex; justify-content: center; align-items: center; gap: 20px;">
            <span class="tree-anim">🌲</span>
            <span>🎅</span>
            <span class="tree-anim">🌲</span>
        </div>
        <h1 style="color: white !important;">Laurent</h1>
        <h2 style="color: white !important;">Joyeuses Fêtes</h2>
        
        <div class="mt-5">
            <div class="spinner-border text-light" style="width: 2rem; height: 2rem;" role="status"></div>
            <div style="font-size: 1.5rem; margin-top: 10px;">🎁</div>
        </div>
    </div>
</div>

<script>
    // --- GESTION DE LA NEIGE ---
    const canvas = document.getElementById('snow-canvas');
    const ctx = canvas.getContext('2d');
    let width, height, flakes = [];

    function initSnow() {
        width = window.innerWidth; height = window.innerHeight;
        canvas.width = width; canvas.height = height;
        flakes = [];
        for (let i = 0; i < 85; i++) {
            flakes.push({ 
                x: Math.random() * width, 
                y: Math.random() * height, 
                r: Math.random() * 3 + 1, 
                d: Math.random() * 1 
            });
        }
    }

    function drawSnow() {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "white"; ctx.beginPath();
        for (let i = 0; i < flakes.length; i++) {
            let f = flakes[i]; ctx.moveTo(f.x, f.y); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
        }
        ctx.fill(); updateSnow();
    }

    function updateSnow() {
        for (let i = 0; i < flakes.length; i++) {
            let f = flakes[i]; f.y += Math.pow(f.d, 2) + 0.8; f.x += Math.sin(f.y / 30) * 0.5;
            if (f.y > height) { flakes[i] = { x: Math.random() * width, y: -5, r: f.r, d: f.d }; }
        }
    }

    function animate() { drawSnow(); requestAnimationFrame(animate); }
    
    initSnow(); 
    animate();
    window.addEventListener('resize', initSnow);

    // --- LOGIQUE DE FERMETURE DU SPLASH ---
    window.addEventListener('load', () => {
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            if(splash) {
                splash.style.opacity = '0';
                setTimeout(() => { splash.style.visibility = 'hidden'; }, 800);
            }
        }, 2000);
    });
</script>