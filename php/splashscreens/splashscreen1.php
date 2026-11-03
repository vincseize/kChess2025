<style>
    #splash-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100dvh;
        background: linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%);
        z-index: 1000000;
        color: white;
        text-align: center;
        
        /* CENTRAGE MAGIQUE ICI */
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        
        overflow: hidden;
        transition: opacity 0.8s ease;
    }

    #snow-canvas {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none; /* Pour ne pas bloquer les clics si besoin */
    }

    #splash-content {
        position: relative; /* Pour passer au dessus du canvas */
        z-index: 2;
    }

    .tree-anim {
        animation: swing 2s ease-in-out infinite alternate;
        display: inline-block;
    }

    @keyframes swing {
        from { transform: rotate(-10deg); }
        to { transform: rotate(10deg); }
    }
</style>

<div id="splash-screen">
    <canvas id="snow-canvas"></canvas>
    
    <div id="splash-content">
        <div style="font-size: 5rem; line-height: 1; display: flex; justify-content: center; align-items: center; gap: 20px;">
            <span class="tree-anim">🌲</span>
            <span>🎅</span>
            <span class="tree-anim">🌲</span>
        </div>
        <h1 style="color: white !important; font-weight: bold; margin-top: 20px;">Laurent</h1>
        <h2 style="color: white !important; opacity: 0.9;">Joyeuses Fêtes</h2>
        
        <div class="mt-5">
            <div class="spinner-border text-light" style="width: 2rem; height: 2rem;" role="status"></div>
            <div style="font-size: 1.5rem; margin-top: 10px;">🎁</div>
        </div>
    </div>
</div>

<script>
    (function() {
        // --- GESTION DE LA NEIGE ---
        const canvas = document.getElementById('snow-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        let width, height, flakes = [];

        function initSnow() {
            width = window.innerWidth; 
            height = window.innerHeight;
            canvas.width = width; 
            canvas.height = height;
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
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; 
            ctx.beginPath();
            for (let i = 0; i < flakes.length; i++) {
                let f = flakes[i]; 
                ctx.moveTo(f.x, f.y); 
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
            }
            ctx.fill(); 
            updateSnow();
        }

        function updateSnow() {
            for (let i = 0; i < flakes.length; i++) {
                let f = flakes[i]; 
                f.y += Math.pow(f.d, 2) + 0.8; 
                f.x += Math.sin(f.y / 30) * 0.5;
                if (f.y > height) { 
                    flakes[i] = { x: Math.random() * width, y: -5, r: f.r, d: f.d }; 
                }
            }
        }

        function animate() { 
            drawSnow(); 
            requestAnimationFrame(animate); 
        }
        
        initSnow(); 
        animate();
        window.addEventListener('resize', initSnow);
    })();
</script>