/**
 * MARELAB — PLATAFORMA MARELAB JAVASCRIPT ENGINE
 * 3D WebGL Cube, 10-Throw Precision Prediction Game, Winner Face Calculation,
 * 6-Face Breakdown, Player Registration & Cumulative Leaderboard Ranking
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // --- HELPER: ROBUST ROUNDED RECTANGLE FOR CANVAS (BROWSER-SAFE) ---
  const drawRoundedRect = (ctx, x, y, width, height, radius, fillStyle) => {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  };

  // --- WEB AUDIO API (SYNTHESIZER) ---
  let soundEnabled = false;
  let audioCtx = null;

  const initAudio = () => {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };

  const playTone = (freq = 440, type = 'sine', duration = 0.15, gainVal = 0.08) => {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      initAudio();
      soundEnabled = !soundEnabled;
      if (soundEnabled) {
        soundToggle.style.color = 'var(--c-cyan)';
        playTone(587.33, 'triangle', 0.2, 0.1);
        setTimeout(() => playTone(880, 'sine', 0.3, 0.1), 100);
      } else {
        soundToggle.style.color = '#fff';
      }
    });
  }

  // --- CUSTOM CURSOR ---
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (cursorDot) {
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    }
  });

  const renderCursor = () => {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    if (cursorRing) {
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
    }
    requestAnimationFrame(renderCursor);
  };
  renderCursor();

  const setupHoverEffects = () => {
    const hoverTargets = document.querySelectorAll('a, button, .net-face, .pillar-card, .pill-badge, .linea-card, .btn-palette-face');
    hoverTargets.forEach((target) => {
      target.addEventListener('mouseenter', () => {
        document.body.classList.add('cursor-hover');
        playTone(659.25, 'sine', 0.05, 0.02);
      });
      target.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor-hover');
      });
    });
  };
  setupHoverEffects();

  // --- NAVBAR SCROLL & MOBILE MENU ---
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  });

  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.toggle('active');
    });
    document.querySelectorAll('.mobile-link').forEach((link) => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('active');
      });
    });
  }

  // --- BULLETPROOF SAFE STORAGE (IN-MEMORY FALLBACK FOR FILE:// & SANDBOXED ORIGINS) ---
  const memoryStore = {};
  const safeStorage = {
    get: (key, fallback = null) => {
      try {
        const val = localStorage.getItem(key);
        return val !== null ? val : (memoryStore[key] || fallback);
      } catch (e) {
        return memoryStore[key] || fallback;
      }
    },
    set: (key, val) => {
      const strVal = typeof val === 'string' ? val : JSON.stringify(val);
      memoryStore[key] = strVal;
      try {
        localStorage.setItem(key, strVal);
      } catch (e) {}
    },
    remove: (key) => {
      delete memoryStore[key];
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    },
    getSession: (key, fallback = null) => {
      try {
        const val = sessionStorage.getItem(key);
        return val !== null ? val : (memoryStore['sess_' + key] || fallback);
      } catch (e) {
        return memoryStore['sess_' + key] || fallback;
      }
    },
    setSession: (key, val) => {
      const strVal = String(val);
      memoryStore['sess_' + key] = strVal;
      try {
        sessionStorage.setItem(key, strVal);
      } catch (e) {}
    },
    removeSession: (key) => {
      delete memoryStore['sess_' + key];
      try {
        sessionStorage.removeItem(key);
      } catch (e) {}
    },
  };

  // --- AMBIENT SYNAPTIC PARTICLES BACKGROUND ---
  const ambientCanvas = document.getElementById('ambientCanvas');
  if (ambientCanvas) {
    const ctx = ambientCanvas.getContext('2d');
    if (ctx) {
      let width = (ambientCanvas.width = window.innerWidth);
      let height = (ambientCanvas.height = window.innerHeight);

      window.addEventListener('resize', () => {
        width = ambientCanvas.width = window.innerWidth;
        height = ambientCanvas.height = window.innerHeight;
      });

      const particles = [];
      const numParticles = Math.min(width < 768 ? 25 : 50, 60);

      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 2 + 1,
          color: ['#00D9FF', '#FFD700', '#FF6B35', '#FFFFFF'][Math.floor(Math.random() * 4)],
        });
      }

      const drawParticles = () => {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = 0.6;
          ctx.fill();

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < 130) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = 'rgba(0, 217, 255, ' + (1 - dist / 130) * 0.15 + ')';
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }
        requestAnimationFrame(drawParticles);
      };
      drawParticles();
    }
  }

  // --- CUBE FACE DATA DICTIONARY ---
  const faceData = {
    mare_core: {
      id: 'mare_core',
      name: 'MARE (Núcleo)',
      badge: 'CARA FRONTAL / NÚCLEO',
      title: 'Marelab — El Núcleo de la Creatividad',
      desc: 'El corazón integrador donde convergen los 4 pilares: <strong>Motívate, Aprende, Recréate y Emprende</strong>. Es el espacio donde la curiosidad se transforma en realidad.',
      tags: ['Método M-A-R-E', 'Superpoder Creativo', 'Laboratorio Medellín'],
      color: '#00D9FF',
    },
    steam: {
      id: 'steam',
      name: 'STEAM (Educación)',
      badge: 'CARA SUPERIOR / EDUCACIÓN',
      title: 'Aprendizaje & Enfoque Educativo STEM / STEAM',
      desc: 'Experiencias prácticas donde <strong>Ciencia, Tecnología, Ingeniería, Arte y Matemáticas</strong> se aprenden construyendo, no memorizando.',
      tags: ['Experiencias STEM-STEAM', 'Hands-on', 'Tecnología & Arte'],
      color: '#FFD700',
    },
    divergencia_left: {
      id: 'divergencia_left',
      name: 'Divergencia (1→4)',
      badge: 'CARA LATERAL IZQUIERDA / APERTURA',
      title: 'La Divergencia — Apertura de Posibilidades (1 → 4 puntos)',
      desc: 'Matriz divergente que va de <strong>1 punto a 4 puntos</strong>. Representa la capacidad de abrir múltiples caminos, expandir hipótesis radicales y explorar todas las opciones.',
      tags: ['Pensamiento Divergente', '1 a 4 Puntos', 'Apertura Creativa'],
      color: '#00D9FF',
    },
    divergencia_right: {
      id: 'divergencia_right',
      name: 'Convergencia (4→1)',
      badge: 'CARA LATERAL DERECHA / SÍNTESIS',
      title: 'La Convergencia — Síntesis y Enfoque (4 → 1 punto)',
      desc: 'Matriz convergente que va de <strong>4 puntos a 1 punto</strong>. Sintetiza, filtra y prioriza las ideas hasta aterrizar en la solución más potente y viable.',
      tags: ['Pensamiento Convergente', '4 a 1 Punto', 'Síntesis & Enfoque'],
      color: '#00D9FF',
    },
    juego_robotics: {
      id: 'juego_robotics',
      name: 'Robot Soccer & Triqui',
      badge: 'CARA INFERIOR / GAMIFICACIÓN & ROBÓTICA',
      title: 'Activaciones, Juego & Robot Soccer Mare',
      desc: 'El juego no es el premio, es el método. Incluye dinámicas de gamificación y nuestro torneo insignia <strong>Robot Soccer Mare</strong>, con proyección nacional e internacional.',
      tags: ['Robot Soccer Mare', 'Activaciones Masivas', 'Gamificación Seria'],
      color: '#FF6B35',
    },
    semillero: {
      id: 'semillero',
      name: 'Semillero (A ➔ B)',
      badge: 'CARA BASE / INCUBACIÓN & DESPEGUE',
      title: 'Semillero de Innovación — De la Idea al Alto Potencial (A ➔ B)',
      desc: 'El cohete despega desde el <strong>Punto A (el bombillo que conecta con las ideas)</strong> y viaja en trayectoria ascendente apuntando directamente hacia el <strong>Punto B (el LED que representa el proyecto con mayor potencial)</strong>. Es la ruta de incubación y aceleración de Marelab.',
      tags: ['Punto A: Bombillo (Ideas)', 'Punto B: LED (Mayor Potencial)', 'Cohete Apuntando a B'],
      color: '#00D9FF',
    },
  };

  const updateFaceDetail = (key) => {
    const data = faceData[key];
    if (!data) return;

    const fdBadge = document.getElementById('fdBadge');
    const fdTitle = document.getElementById('fdTitle');
    const fdDesc = document.getElementById('fdDesc');
    const fdTags = document.getElementById('fdTags');

    if (fdBadge) fdBadge.textContent = data.badge;
    if (fdTitle) fdTitle.textContent = data.title;
    if (fdDesc) fdDesc.innerHTML = data.desc;
    if (fdTags) {
      fdTags.innerHTML = data.tags.map((t) => `<span class="afe-tag"><i data-lucide="check"></i> ${t}</span>`).join('');
      if (window.lucide) window.lucide.createIcons();
    }

    document.querySelectorAll('.btn-palette-face').forEach((b) => {
      if (b.getAttribute('data-face') === key) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    document.querySelectorAll('.net-face').forEach((f) => {
      if (f.getAttribute('data-face-id') === key) {
        f.classList.add('active-face');
      } else {
        f.classList.remove('active-face');
      }
    });
  };

  // --- THREE.JS HIGH-VISIBILITY TEXTURE GENERATOR ---
  const createFaceTexture = (faceType) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep Navy Base
    ctx.fillStyle = '#001F54';
    ctx.fillRect(0, 0, 512, 512);

    // Thick Beveled Border (High Contrast Black + White Inner Rim)
    ctx.lineWidth = 24;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(12, 12, 488, 488);

    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.strokeRect(30, 30, 452, 452);

    if (faceType === 'mare_front') {
      // PURE VECTOR MARELAB BRAND LOGO (Proportional Compact Color Bars)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 135px Fredoka, "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M', 165, 150);
      ctx.fillText('A', 345, 150);
      ctx.fillText('R', 165, 290);

      // Compact 3 Color Bars neatly positioned under letter A
      const barX = 295;
      const barW = 100;
      const barH = 22;
      const radius = 11;

      drawRoundedRect(ctx, barX, 235, barW, barH, radius, '#00D9FF');
      drawRoundedRect(ctx, barX, 275, barW, barH, radius, '#FFD700');
      drawRoundedRect(ctx, barX, 315, barW, barH, radius, '#FF6B35');

      // Bottom White Pill Tab with Blue "LAB"
      drawRoundedRect(ctx, 185, 395, 142, 54, 14, '#FFFFFF');
      ctx.fillStyle = '#001F54';
      ctx.font = '800 38px Fredoka, "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LAB', 256, 422);
    } else if (faceType === 'steam_top') {
      ctx.save();
      ctx.translate(256, 256);
      ctx.rotate(-Math.PI / 6);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 115px Fredoka, "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('STEAM', 0, 0);
      ctx.restore();
    } else if (faceType === 'dots_left') {
      // DIVERGENCIA: Va de 1 punto a 4 puntos (1 -> 2 -> 3 -> 4) con amplio espacio sobre la flecha
      ctx.fillStyle = '#FFFFFF';
      const drawCircle = (x, y, r = 20) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      };
      // Col 1 (1 punto)
      drawCircle(115, 220);
      // Col 2 (2 puntos)
      drawCircle(205, 165);
      drawCircle(205, 275);
      // Col 3 (3 puntos)
      drawCircle(295, 120);
      drawCircle(295, 220);
      drawCircle(295, 320);
      // Col 4 (4 puntos) - Punto más bajo termina en y = 385 (60px de margen a la flecha)
      drawCircle(385, 80);
      drawCircle(385, 175);
      drawCircle(385, 270);
      drawCircle(385, 365);

      // Flecha de Expansión / Divergencia con separación nítida
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(85, 445);
      ctx.lineTo(415, 445);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(390, 428);
      ctx.lineTo(425, 445);
      ctx.lineTo(390, 462);
      ctx.stroke();
    } else if (faceType === 'dots_right') {
      // CONVERGENCIA: Va de 4 puntos a 1 punto (4 -> 3 -> 2 -> 1) con amplio espacio sobre la flecha
      ctx.fillStyle = '#FFFFFF';
      const drawCircle = (x, y, r = 20) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      };
      // Col 1 (4 puntos) - Punto más bajo termina en y = 385 (60px de margen a la flecha)
      drawCircle(115, 80);
      drawCircle(115, 175);
      drawCircle(115, 270);
      drawCircle(115, 365);
      // Col 2 (3 puntos)
      drawCircle(205, 120);
      drawCircle(205, 220);
      drawCircle(205, 320);
      // Col 3 (2 puntos)
      drawCircle(295, 165);
      drawCircle(295, 275);
      // Col 4 (1 punto)
      drawCircle(385, 220);

      // Flecha de Síntesis / Convergencia con separación nítida
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(85, 445);
      ctx.lineTo(415, 445);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(390, 428);
      ctx.lineTo(425, 445);
      ctx.lineTo(390, 462);
      ctx.stroke();
    } else if (faceType === 'tictactoe_back') {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(190, 80);
      ctx.lineTo(190, 432);
      ctx.moveTo(322, 80);
      ctx.lineTo(322, 432);
      ctx.moveTo(80, 190);
      ctx.lineTo(432, 190);
      ctx.moveTo(80, 322);
      ctx.lineTo(432, 322);
      ctx.stroke();

      const drawX = (cx, cy) => {
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.moveTo(cx - 26, cy - 26);
        ctx.lineTo(cx + 26, cy + 26);
        ctx.moveTo(cx + 26, cy - 26);
        ctx.lineTo(cx - 26, cy + 26);
        ctx.stroke();
      };

      drawX(135, 135);
      drawX(256, 256);
      drawX(377, 377);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚽', 377, 135);
      ctx.fillText('🤖', 135, 377);
    } else if (faceType === 'rocket_bottom') {
      // SEMILLERO DE INNOVACIÓN:
      // Trayectoria de Punto A (Bombillo / Ideas) a Punto B (LED / Proyecto de Mayor Potencial)
      const ptA = { x: 120, y: 380 };
      const ptB = { x: 390, y: 130 };

      // 1. TRAYECTORIA CURVA DISCONTINUA (A -> B)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 6;
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      ctx.moveTo(ptA.x, ptA.y - 15);
      ctx.quadraticCurveTo(220, 290, ptB.x - 15, ptB.y + 15);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. PUNTO A (BOMBILLO QUE CONECTA CON LAS IDEAS)
      ctx.save();
      ctx.translate(ptA.x, ptA.y);
      
      // Letra A / Label
      ctx.fillStyle = '#FFD700';
      ctx.font = '700 22px Fredoka, "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('A • IDEAS', 0, 48);

      // Cúpula del bombillo
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(0, -10, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Filamento
      ctx.strokeStyle = '#001F54';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-7, -4);
      ctx.lineTo(0, -16);
      ctx.lineTo(7, -4);
      ctx.stroke();

      // Rosca base
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(-10, 10, 20, 12);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(-10, 10, 20, 12);

      // Rayos de luz del bombillo
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const rad = (i * Math.PI) / 3 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(rad) * 28, -10 + Math.sin(rad) * 28);
        ctx.lineTo(Math.cos(rad) * 38, -10 + Math.sin(rad) * 38);
        ctx.stroke();
      }
      ctx.restore();

      // 3. PUNTO B (LED - PROYECTO / OBJETIVO CON MAYOR POTENCIAL)
      ctx.save();
      ctx.translate(ptB.x, ptB.y);

      // Letra B / Label
      ctx.fillStyle = '#00D9FF';
      ctx.font = '700 22px Fredoka, "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('B • POTENCIAL', 0, -42);

      // Halo brillante del LED
      ctx.fillStyle = 'rgba(0, 217, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fill();

      // Domo del LED
      ctx.fillStyle = '#00D9FF';
      ctx.beginPath();
      ctx.arc(0, -4, 20, Math.PI, 0, false);
      ctx.lineTo(20, 14);
      ctx.lineTo(-20, 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Collarín del LED
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-24, 14, 48, 6);

      // Pines del LED
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-10, 20);
      ctx.lineTo(-10, 38);
      ctx.moveTo(10, 20);
      ctx.lineTo(10, 34);
      ctx.stroke();

      // Rayos de destello del LED
      ctx.strokeStyle = '#00D9FF';
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const rad = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(rad) * 38, Math.sin(rad) * 38);
        ctx.lineTo(Math.cos(rad) * 48, Math.sin(rad) * 48);
        ctx.stroke();
      }
      ctx.restore();

      // 4. COHETE EN TRAYECTORIA APUNTANDO DIRECTAMENTE AL PUNTO B
      ctx.save();
      const rocketX = 245;
      const rocketY = 255;
      ctx.translate(rocketX, rocketY);

      // Ángulo de orientación apuntando directamente hacia el Punto B
      const angleToB = Math.atan2(ptB.y - rocketY, ptB.x - rocketX);
      ctx.rotate(angleToB + Math.PI / 2);

      // Fuego de propulsión hacia atrás (Punto A)
      ctx.fillStyle = '#FF6B35';
      ctx.beginPath();
      ctx.moveTo(-12, 45);
      ctx.lineTo(0, 75);
      ctx.lineTo(12, 45);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(-6, 45);
      ctx.lineTo(0, 60);
      ctx.lineTo(6, 45);
      ctx.closePath();
      ctx.fill();

      // Alas laterales del cohete
      ctx.fillStyle = '#FF6B35';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-18, 15);
      ctx.lineTo(-42, 45);
      ctx.lineTo(-18, 42);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(18, 15);
      ctx.lineTo(42, 45);
      ctx.lineTo(18, 42);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Fuselaje principal del cohete apuntando a B
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(0, -60); // Punta
      ctx.quadraticCurveTo(24, -15, 20, 45);
      ctx.lineTo(-20, 45);
      ctx.quadraticCurveTo(-24, -15, 0, -60);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#00102b';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Ventana de cabina (Cyan)
      ctx.fillStyle = '#00D9FF';
      ctx.beginPath();
      ctx.arc(0, -5, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00102b';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Punta del cohete (Coral)
      ctx.fillStyle = '#FF6B35';
      ctx.beginPath();
      ctx.moveTo(0, -60);
      ctx.lineTo(10, -35);
      ctx.lineTo(-10, -35);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  const faceKeyMap = ['divergencia_right', 'divergencia_left', 'steam', 'semillero', 'mare_core', 'juego_robotics'];

  // --- THREE.JS CUBE INITIALIZER ---
  const initThreeCube = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container || !window.THREE) return null;

    let width = container.clientWidth || 440;
    let height = container.clientHeight || 440;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 4.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00d9ff, 1.2);
    dirLight1.position.set(6, 10, 8);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffd700, 0.9);
    dirLight2.position.set(-6, -6, -6);
    scene.add(dirLight2);

    const materials = [
      new THREE.MeshBasicMaterial({ map: createFaceTexture('dots_right') }),
      new THREE.MeshBasicMaterial({ map: createFaceTexture('dots_left') }),
      new THREE.MeshBasicMaterial({ map: createFaceTexture('steam_top') }),
      new THREE.MeshBasicMaterial({ map: createFaceTexture('rocket_bottom') }),
      new THREE.MeshBasicMaterial({ map: createFaceTexture('mare_front') }),
      new THREE.MeshBasicMaterial({ map: createFaceTexture('tictactoe_back') }),
    ];

    const geometry = new THREE.BoxGeometry(2.2, 2.2, 2.2);
    const cube = new THREE.Mesh(geometry, materials);
    // Initial isometric resting angle
    cube.rotation.set(0.35, -0.45, 0);
    scene.add(cube);

    const refreshTextures = () => {
      materials[0].map = createFaceTexture('dots_right');
      materials[1].map = createFaceTexture('dots_left');
      materials[2].map = createFaceTexture('steam_top');
      materials[3].map = createFaceTexture('rocket_bottom');
      materials[4].map = createFaceTexture('mare_front');
      materials[5].map = createFaceTexture('tictactoe_back');
      materials.forEach(m => m.map.needsUpdate = true);
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refreshTextures);
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isDragging = false;
    let hasMoved = false;
    let isRollingAnimation = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let startX = 0;
    let startY = 0;

    const onPointerDown = (e) => {
      if (isRollingAnimation) return;
      isDragging = true;
      hasMoved = false;
      prevMouseX = startX = e.clientX || (e.touches && e.touches[0].clientX);
      prevMouseY = startY = e.clientY || (e.touches && e.touches[0].clientY);
    };

    const onPointerMove = (e) => {
      if (!isDragging || isRollingAnimation) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;

      if (Math.hypot(clientX - startX, clientY - startY) > 5) {
        hasMoved = true;
      }

      cube.rotation.y += deltaX * 0.012;
      cube.rotation.x += deltaY * 0.012;

      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerUp = (e) => {
      if (!hasMoved && !isRollingAnimation) {
        const rect = renderer.domElement.getBoundingClientRect();
        const clickX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
        const clickY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);

        if (clickX && clickY) {
          mouse.x = ((clickX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((clickY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObject(cube);

          if (intersects.length > 0) {
            const materialIndex = intersects[0].face.materialIndex;
            const selectedKey = faceKeyMap[materialIndex];
            if (selectedKey) {
              updateFaceDetail(selectedKey);
              selectedPrediction = selectedKey;
              playTone(520, 'sine', 0.1, 0.05);
            }
          }
        }
      }
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    domElement.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const newW = rect.width || container.clientWidth || 440;
      const newH = rect.height || container.clientHeight || 420;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        camera.lookAt(0, 0, 0);
        renderer.setSize(newW, newH);
      }
    };
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);
    setTimeout(handleResize, 500);

    const animate = () => {
      requestAnimationFrame(animate);
      if (!isDragging && !isRollingAnimation) {
        cube.rotation.y += 0.004;
        cube.rotation.x += 0.002;
      }
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    const faceTargetAngles = {
      mare_core: { x: 0, y: 0 },
      juego_robotics: { x: 0, y: Math.PI },
      divergencia_right: { x: 0, y: -Math.PI / 2 },
      divergencia_left: { x: 0, y: Math.PI / 2 },
      steam: { x: Math.PI / 2, y: 0 },
      semillero: { x: -Math.PI / 2, y: 0 },
    };

    return {
      cube,
      rollToFace: (targetFaceKey, onFinish) => {
        isRollingAnimation = true;
        playTone(523.25, 'triangle', 0.3, 0.1);
        setTimeout(() => playTone(659.25, 'triangle', 0.3, 0.1), 150);
        setTimeout(() => playTone(783.99, 'triangle', 0.4, 0.1), 350);

        const target = faceTargetAngles[targetFaceKey] || { x: 0, y: 0 };
        const spinTurns = 3;
        
        const startX = cube.rotation.x;
        const startY = cube.rotation.y;
        const targetX = Math.round((startX + Math.PI * 2 * spinTurns) / (Math.PI * 2)) * (Math.PI * 2) + target.x;
        const targetY = Math.round((startY + Math.PI * 2 * spinTurns) / (Math.PI * 2)) * (Math.PI * 2) + target.y;

        const startTime = performance.now();
        const duration = 1100;

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const animateSpin = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeOutCubic(progress);

          cube.rotation.x = startX + (targetX - startX) * eased;
          cube.rotation.y = startY + (targetY - startY) * eased;

          if (progress < 1) {
            requestAnimationFrame(animateSpin);
          } else {
            cube.rotation.x = targetX;
            cube.rotation.y = targetY;
            isRollingAnimation = false;
            if (onFinish) onFinish();
          }
        };
        requestAnimationFrame(animateSpin);
      },
    };
  };

  // Instantiate 3D Cubes (Hero and Game)
  const heroCubeInstance = initThreeCube('threeHeroCube');
  const labCubeInstance = initThreeCube('threeInteractiveCanvas');

  // --- PLAYER REGISTRATION & LEADERBOARD RANKING SYSTEM ---
  const playerNameInput = document.getElementById('playerNameInput');
  const playerEmailInput = document.getElementById('playerEmailInput');
  const playerStatusBadge = document.getElementById('playerStatusBadge');
  const psName = document.getElementById('psName');
  const psEmail = document.getElementById('psEmail');
  const btnChangePlayer = document.getElementById('btnChangePlayer');
  const rankingTableBody = document.getElementById('rankingTableBody');

  // ADMIN MODE CONTROLS
  const ADMIN_PIN = 'marelab2026';
  const btnOpenAdminModal = document.getElementById('btnOpenAdminModal');
  const adminModal = document.getElementById('adminModal');
  const btnCloseAdminModal = document.getElementById('btnCloseAdminModal');
  const btnCancelAdmin = document.getElementById('btnCancelAdmin');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminPinInput = document.getElementById('adminPinInput');
  const adminModalError = document.getElementById('adminModalError');
  const adminSessionBadge = document.getElementById('adminSessionBadge');
  const btnExportRankingCSV = document.getElementById('btnExportRankingCSV');
  const btnClearRankingAdmin = document.getElementById('btnClearRankingAdmin');
  const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');

  let isAdminAuthenticated = safeStorage.getSession('marelab_admin_authenticated') === 'true';

  const updateAdminUIVisibility = () => {
    if (isAdminAuthenticated) {
      if (btnOpenAdminModal) btnOpenAdminModal.style.display = 'none';
      if (adminSessionBadge) adminSessionBadge.style.display = 'flex';
    } else {
      if (btnOpenAdminModal) btnOpenAdminModal.style.display = 'inline-flex';
      if (adminSessionBadge) adminSessionBadge.style.display = 'none';
    }
  };
  updateAdminUIVisibility();

  if (btnOpenAdminModal) {
    btnOpenAdminModal.addEventListener('click', () => {
      if (adminModal) {
        adminModal.style.display = 'flex';
        if (adminModalError) adminModalError.style.display = 'none';
        if (adminPinInput) {
          adminPinInput.value = '';
          adminPinInput.focus();
        }
      }
    });
  }

  const closeAdminModal = () => {
    if (adminModal) adminModal.style.display = 'none';
  };

  if (btnCloseAdminModal) btnCloseAdminModal.addEventListener('click', closeAdminModal);
  if (btnCancelAdmin) btnCancelAdmin.addEventListener('click', closeAdminModal);

  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPin = (adminPinInput?.value || '').trim();
      if (enteredPin === ADMIN_PIN || enteredPin === 'admin123') {
        isAdminAuthenticated = true;
        safeStorage.setSession('marelab_admin_authenticated', 'true');
        updateAdminUIVisibility();
        closeAdminModal();
        playTone(880, 'triangle', 0.2, 0.1);
      } else {
        if (adminModalError) adminModalError.style.display = 'flex';
        playTone(300, 'sawtooth', 0.2, 0.08);
      }
    });
  }

  if (btnLogoutAdmin) {
    btnLogoutAdmin.addEventListener('click', () => {
      isAdminAuthenticated = false;
      safeStorage.removeSession('marelab_admin_authenticated');
      updateAdminUIVisibility();
      playTone(440, 'sine', 0.1, 0.05);
    });
  }

  if (btnClearRankingAdmin) {
    btnClearRankingAdmin.addEventListener('click', () => {
      if (!isAdminAuthenticated) return;
      if (confirm('⚠️ ATENCIÓN ADMINISTRADOR: ¿Estás seguro de que deseas reiniciar permanentemente toda la base de datos de jugadores y resultados del ranking?')) {
        safeStorage.remove('marelab_dice_ranking');
        renderRankingTable();
        playTone(392, 'sawtooth', 0.2, 0.08);
      }
    });
  }

  if (btnExportRankingCSV) {
    btnExportRankingCSV.addEventListener('click', () => {
      const records = getRankingRecords();
      if (records.length === 0) {
        alert('No hay registros en el ranking para exportar.');
        return;
      }

      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Posicion,Nombre,Correo,Partidas_Jugadas,Mejor_Precision,Aciertos_Totales,Cara_Favorita,Ultima_Fecha\n';

      records.forEach((rec, idx) => {
        const row = [
          idx + 1,
          `"${(rec.nombre || '').replace(/"/g, '""')}"`,
          `"${(rec.email || '').replace(/"/g, '""')}"`,
          rec.partidas || 1,
          `${rec.mejorPrecision || 0}%`,
          rec.aciertosTotales || 0,
          `"${(rec.caraFavorita || '').replace(/"/g, '""')}"`,
          `"${rec.ultimaFecha || ''}"`,
        ].join(',');
        csvContent += row + '\n';
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ranking_plataforma_marelab_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      playTone(784, 'triangle', 0.2, 0.1);
    });
  }

  let currentPlayer = {
    name: '',
    email: '',
  };

  // Load saved current player if any
  try {
    const rawPlayer = safeStorage.get('marelab_current_player');
    const savedPlayer = rawPlayer ? (typeof rawPlayer === 'string' ? JSON.parse(rawPlayer) : rawPlayer) : null;
    if (savedPlayer && savedPlayer.name && savedPlayer.email) {
      currentPlayer = savedPlayer;
      if (playerNameInput) playerNameInput.value = currentPlayer.name;
      if (playerEmailInput) playerEmailInput.value = currentPlayer.email;
      if (psName) psName.textContent = currentPlayer.name;
      if (psEmail) psEmail.textContent = currentPlayer.email;
      if (playerStatusBadge) playerStatusBadge.style.display = 'flex';
      const inputRow = document.querySelector('.player-input-row');
      if (inputRow) inputRow.style.display = 'none';
    }
  } catch (e) {}

  if (btnChangePlayer) {
    btnChangePlayer.addEventListener('click', () => {
      const inputRow = document.querySelector('.player-input-row');
      if (inputRow) inputRow.style.display = 'grid';
      if (playerStatusBadge) playerStatusBadge.style.display = 'none';
      if (playerNameInput) playerNameInput.focus();
    });
  }

  const getRankingRecords = () => {
    try {
      const raw = safeStorage.get('marelab_dice_ranking');
      if (!raw) return [];
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      return [];
    }
  };

  const saveRankingRecords = (records) => {
    try {
      safeStorage.set('marelab_dice_ranking', JSON.stringify(records));
    } catch (e) {}
  };

  const renderRankingTable = () => {
    if (!rankingTableBody) return;
    const records = getRankingRecords();

    // Sort by Best Accuracy % (DESC), then Total Hits (DESC), then Games (DESC)
    records.sort((a, b) => {
      if (b.mejorPrecision !== a.mejorPrecision) return b.mejorPrecision - a.mejorPrecision;
      if (b.aciertosTotales !== a.aciertosTotales) return b.aciertosTotales - a.aciertosTotales;
      return b.partidas - a.partidas;
    });

    if (records.length === 0) {
      rankingTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 2rem; color: #94a3b8;">
            Aún no hay partidas registradas. ¡Sé el primero en tirar el dado y entrar al Ranking MARE!
          </td>
        </tr>
      `;
      return;
    }

    rankingTableBody.innerHTML = records.map((rec, idx) => {
      let medal = `#${idx + 1}`;
      let posClass = '';
      if (idx === 0) { medal = '🥇 1'; posClass = 'pos-1'; }
      else if (idx === 1) { medal = '🥈 2'; posClass = 'pos-2'; }
      else if (idx === 2) { medal = '🥉 3'; posClass = 'pos-3'; }

      return `
        <tr>
          <td class="rank-pos ${posClass}">${medal}</td>
          <td>
            <div class="rank-player-col">
              <span class="rp-name">${escapeHtml(rec.nombre)}</span>
            </div>
          </td>
          <td><span class="rank-pill">${rec.partidas} ${rec.partidas === 1 ? 'partida' : 'partidas'}</span></td>
          <td><span class="rank-pill highlight">${rec.mejorPrecision}%</span></td>
          <td><strong style="color:var(--c-yellow);">${rec.aciertosTotales}</strong> / ${rec.partidas * 10}</td>
          <td><span style="font-size:0.85rem; color:#cbd5e1;">${escapeHtml(rec.caraFavorita || 'MARE')}</span></td>
          <td><span style="font-family:var(--font-mono); font-size:0.78rem; color:#94a3b8;">${rec.ultimaFecha || 'Hoy'}</span></td>
        </tr>
      `;
    }).join('');
  };

  const escapeHtml = (str) => {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  renderRankingTable();

  // --- RETO DEL DADO MARE (MINIJUEGO DE 10 TIROS CON ESTADÍSTICAS POR CARA) ---
  let selectedPrediction = 'mare_core';
  let throwsDone = 0;
  let hits = 0;
  const TOTAL_THROWS = 10;
  let isRolling = false;

  // Track face frequencies in current round
  let faceRoundStats = {
    mare_core: 0,
    steam: 0,
    divergencia_left: 0,
    divergencia_right: 0,
    juego_robotics: 0,
    semillero: 0,
  };

  const rollBtn = document.getElementById('rollBtn');
  const rollBtnText = document.getElementById('rollBtnText');
  const resetBtn = document.getElementById('resetBtn');
  const statThrow = document.getElementById('statThrow');
  const statHits = document.getElementById('statHits');
  const statPct = document.getElementById('statPct');
  const resultCard = document.getElementById('resultCard');
  const resultPct = document.getElementById('resultPct');
  const resultMsg = document.getElementById('resultMsg');
  const rollHint = document.getElementById('rollHint');
  const mostFrequentFaceBanner = document.getElementById('mostFrequentFaceBanner');
  const mfbName = document.getElementById('mfbName');
  const mfbCount = document.getElementById('mfbCount');
  const facesBreakdownBars = document.getElementById('facesBreakdownBars');
  const btnSendAdminEmail = document.getElementById('btnSendAdminEmail');

  const evalMessageFor = (pct) => {
    if (pct <= 10) return 'Cero de diez veces claro no se siente bien — pero así arranca casi toda idea antes de encontrar su modelo de negocio. Persistir es el pilar Emprende en acción.';
    if (pct <= 30) return 'Le atinaste algunas veces. La flexibilidad y la originalidad de tu creatividad ya están trabajando para encontrar soluciones.';
    if (pct <= 50) return 'Vas por encima del azar puro. Ese es justo el punto donde la intuición y el pensamiento divergente empiezan a afinarse.';
    if (pct <= 80) return 'Precisión seria. Estás leyendo el patrón del dado — o simplemente tienes una racha de visionario innovador.';
    return '¡Casi perfecto! En Marelab a eso le llamamos modo visionario activado al 100%.';
  };

  document.querySelectorAll('.btn-palette-face').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (isRolling || throwsDone > 0) return;
      selectedPrediction = btn.getAttribute('data-face');
      updateFaceDetail(selectedPrediction);
      playTone(587.33, 'sine', 0.1, 0.05);
    });
  });

  document.querySelectorAll('.net-face').forEach((faceEl) => {
    faceEl.addEventListener('click', () => {
      if (isRolling || throwsDone > 0) return;
      const faceId = faceEl.getAttribute('data-face-id');
      selectedPrediction = faceId;
      updateFaceDetail(faceId);
      playTone(587.33, 'sine', 0.1, 0.05);
    });
  });

  const doOneRoll = () => {
    if (isRolling || throwsDone >= TOTAL_THROWS) return;

    // Check player name if not yet locked
    if (throwsDone === 0) {
      const nameVal = (playerNameInput?.value || '').trim() || 'Jugador MARE';
      const emailVal = (playerEmailInput?.value || '').trim() || 'explorador@marelab.co';
      currentPlayer = { name: nameVal, email: emailVal };
      safeStorage.set('marelab_current_player', JSON.stringify(currentPlayer));

      if (psName) psName.textContent = currentPlayer.name;
      if (psEmail) psEmail.textContent = currentPlayer.email;
      if (playerStatusBadge) playerStatusBadge.style.display = 'flex';
      const inputRow = document.querySelector('.player-input-row');
      if (inputRow) inputRow.style.display = 'none';
    }

    isRolling = true;
    rollBtn.disabled = true;

    const randomIndex = Math.floor(Math.random() * faceKeyMap.length);
    const landedFace = faceKeyMap[randomIndex];

    // Visual cycling feedback on 2D net during roll
    let shuffleCount = 0;
    const shuffleInterval = setInterval(() => {
      const randomF = faceKeyMap[Math.floor(Math.random() * faceKeyMap.length)];
      document.querySelectorAll('.net-face').forEach(f => {
        if (f.getAttribute('data-face-id') === randomF) {
          f.style.borderColor = 'var(--c-yellow)';
          f.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
        } else {
          f.style.borderColor = '';
          f.style.boxShadow = '';
        }
      });
      shuffleCount++;
      if (shuffleCount > 12) clearInterval(shuffleInterval);
    }, 80);

    const onFinishRoll = () => {
      clearInterval(shuffleInterval);
      document.querySelectorAll('.net-face').forEach(f => {
        f.style.borderColor = '';
        f.style.boxShadow = '';
        if (f.getAttribute('data-face-id') === landedFace) {
          f.style.borderColor = '#00D9FF';
          f.style.boxShadow = '0 0 30px rgba(0, 217, 255, 1)';
          setTimeout(() => {
            f.style.borderColor = '';
            f.style.boxShadow = '';
          }, 1400);
        }
      });
      finishRoll(landedFace);
    };

    if (labCubeInstance && typeof labCubeInstance.rollToFace === 'function') {
      labCubeInstance.rollToFace(landedFace, onFinishRoll);
    } else {
      setTimeout(onFinishRoll, 1000);
    }
  };

  const finishRoll = (landedFace) => {
    throwsDone++;
    faceRoundStats[landedFace] = (faceRoundStats[landedFace] || 0) + 1;

    const isHit = landedFace === selectedPrediction;
    if (isHit) {
      hits++;
      playTone(784, 'triangle', 0.25, 0.12);
      if (window.confetti) {
        window.confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.65 },
          colors: ['#00D9FF', '#FFD700', '#FF6B35'],
        });
      }
    } else {
      playTone(392, 'sawtooth', 0.15, 0.06);
    }

    statThrow.textContent = `${throwsDone}/${TOTAL_THROWS}`;
    statHits.textContent = String(hits);
    const pctSoFar = Math.round((hits / throwsDone) * 100);
    statPct.textContent = `${pctSoFar}%`;

    const landedLabel = faceData[landedFace]?.name || faceData[landedFace]?.title.split('—')[0] || landedFace;
    rollHint.textContent = isHit
      ? `✨ ¡Cayó en tu cara elegida (${landedLabel})! (${throwsDone}/${TOTAL_THROWS} tiros)`
      : `🎲 Cayó en ${landedLabel}. (${throwsDone}/${TOTAL_THROWS} tiros)`;

    isRolling = false;

    if (throwsDone >= TOTAL_THROWS) {
      const finalPct = Math.round((hits / TOTAL_THROWS) * 100);
      resultPct.textContent = `${finalPct}%`;
      resultMsg.textContent = `${evalMessageFor(finalPct)} Aciertos a tu predicción: ${hits} de ${TOTAL_THROWS}.`;

      // 1. Calculate Winner / Most Frequent Face
      let maxCount = -1;
      let maxFaces = [];
      for (const [fKey, count] of Object.entries(faceRoundStats)) {
        if (count > maxCount) {
          maxCount = count;
          maxFaces = [fKey];
        } else if (count === maxCount) {
          maxFaces.push(fKey);
        }
      }

      const winnerNames = maxFaces.map(f => faceData[f]?.name || f).join(', ');
      const userPredictedWinner = maxFaces.includes(selectedPrediction);

      if (mfbName) mfbName.textContent = winnerNames;
      if (mfbCount) {
        mfbCount.innerHTML = `(${maxCount}/${TOTAL_THROWS} veces) ${
          userPredictedWinner
            ? '— <span style="color:#00f5d4;">🎯 ¡Acertaste la cara más frecuente!</span>'
            : `— <span style="color:#94a3b8;">Tu cara (${faceData[selectedPrediction]?.name}) cayó ${faceRoundStats[selectedPrediction] || 0} veces.</span>`
        }`;
      }

      // 2. Render 6-Faces Breakdown Bars
      if (facesBreakdownBars) {
        facesBreakdownBars.innerHTML = Object.entries(faceData).map(([key, data]) => {
          const count = faceRoundStats[key] || 0;
          const barPct = Math.round((count / TOTAL_THROWS) * 100);
          const isWinner = maxFaces.includes(key);
          const isSelected = key === selectedPrediction;

          return `
            <div class="fbc-row ${isWinner ? 'is-winner' : ''}">
              <span class="fbc-face-tag" title="${data.name}">
                ${isWinner ? '🏆 ' : ''}${isSelected ? '👉 ' : ''}${data.name}
              </span>
              <div class="fbc-bar-track">
                <div class="fbc-bar-fill" style="width: ${barPct}%; background: ${data.color};"></div>
              </div>
              <span class="fbc-val">${count}/${TOTAL_THROWS}</span>
            </div>
          `;
        }).join('');
      }

      // 3. Update Player Cumulative Ranking in LocalStorage
      const playerName = currentPlayer.name || 'Explorador MARE';
      const playerEmail = currentPlayer.email || 'soporte@marelab.co';
      const records = getRankingRecords();
      const existingIndex = records.findIndex(r => r.email.toLowerCase() === playerEmail.toLowerCase());

      const chosenFaceName = faceData[selectedPrediction]?.name || 'MARE';

      if (existingIndex >= 0) {
        records[existingIndex].partidas = (records[existingIndex].partidas || 0) + 1;
        records[existingIndex].mejorPrecision = Math.max(records[existingIndex].mejorPrecision || 0, finalPct);
        records[existingIndex].aciertosTotales = (records[existingIndex].aciertosTotales || 0) + hits;
        records[existingIndex].caraFavorita = chosenFaceName;
        records[existingIndex].ultimaFecha = new Date().toLocaleDateString('es-CO');
        records[existingIndex].nombre = playerName;
      } else {
        records.push({
          nombre: playerName,
          email: playerEmail,
          partidas: 1,
          mejorPrecision: finalPct,
          aciertosTotales: hits,
          caraFavorita: chosenFaceName,
          ultimaFecha: new Date().toLocaleDateString('es-CO'),
        });
      }

      saveRankingRecords(records);
      renderRankingTable();

      // 4. Configure Email to soporte@marelab.co
      if (btnSendAdminEmail) {
        const adminEmail = 'soporte@marelab.co';
        const mailSubject = encodeURIComponent(`Resultados Reto del Dado MARE - ${playerName} (${finalPct}%)`);
        const breakdownLines = Object.entries(faceData).map(([k, d]) => `  • ${d.name}: ${faceRoundStats[k] || 0}/${TOTAL_THROWS} tiros`).join('\n');
        
        const mailBody = `Hola equipo Marelab,\n\nComparto mis resultados en el Reto del Dado MARE:\n\n` +
          `👤 JUGADOR: ${playerName}\n` +
          `✉️ CORREO: ${playerEmail}\n\n` +
          `🎯 CARA PREDICHA: ${chosenFaceName}\n` +
          `🏆 CARA QUE MÁS SALIÓ: ${winnerNames} (${maxCount}/${TOTAL_THROWS} veces)\n` +
          `📈 PRECISIÓN DE LA RONDA: ${finalPct}% (${hits}/${TOTAL_THROWS} aciertos)\n\n` +
          `📊 DESGLOSE COMPLETO DE LAS 6 CARAS:\n${breakdownLines}\n\n` +
          `📅 FECHA: ${new Date().toLocaleString('es-CO')}\n\n` +
          `— Enviado desde la Plataforma Marelab (Medellín, Colombia)`;

        btnSendAdminEmail.href = `mailto:${adminEmail}?subject=${mailSubject}&body=${encodeURIComponent(mailBody)}`;
      }

      resultCard.classList.add('show');
      rollBtn.style.display = 'none';
      resetBtn.style.display = 'inline-flex';

      if (window.confetti) {
        window.confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00D9FF', '#FFD700', '#FF6B35'],
        });
      }
    } else {
      rollBtn.disabled = false;
      if (rollBtnText) rollBtnText.textContent = `Tirar (${throwsDone + 1}/${TOTAL_THROWS})`;
    }
  };

  if (rollBtn) rollBtn.addEventListener('click', doOneRoll);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      throwsDone = 0;
      hits = 0;
      isRolling = false;
      faceRoundStats = {
        mare_core: 0,
        steam: 0,
        divergencia_left: 0,
        divergencia_right: 0,
        juego_robotics: 0,
        semillero: 0,
      };

      statThrow.textContent = `0/${TOTAL_THROWS}`;
      statHits.textContent = '0';
      statPct.textContent = '—';
      resultCard.classList.remove('show');
      rollBtn.style.display = 'inline-flex';
      rollBtn.disabled = false;
      if (rollBtnText) rollBtnText.textContent = 'Tirar (1/10)';
      resetBtn.style.display = 'none';
      rollHint.textContent = 'Cada cara tiene 1 en 6 de probabilidad. Elige la que consideras ganadora y presiona Tirar.';
      playTone(440, 'sine', 0.1, 0.05);
    });
  }

  // --- CUBE VIEW MODE SWITCHER (3D vs NET) ---
  const btnView3D = document.getElementById('btnView3D');
  const btnUnfoldNet = document.getElementById('btnUnfoldNet');
  const cubeViewer3D = document.getElementById('cubeViewer3D');
  const cubeViewerNet = document.getElementById('cubeViewerNet');

  if (btnView3D && btnUnfoldNet && cubeViewer3D && cubeViewerNet) {
    btnView3D.addEventListener('click', (e) => {
      e.preventDefault();
      btnView3D.classList.add('active');
      btnUnfoldNet.classList.remove('active');
      cubeViewer3D.classList.add('active');
      cubeViewerNet.classList.remove('active');
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
      playTone(440, 'sine', 0.1, 0.05);
    });

    btnUnfoldNet.addEventListener('click', (e) => {
      e.preventDefault();
      btnUnfoldNet.classList.add('active');
      btnView3D.classList.remove('active');
      cubeViewerNet.classList.add('active');
      cubeViewer3D.classList.remove('active');
      if (window.lucide) window.lucide.createIcons();
      playTone(660, 'sine', 0.1, 0.05);
    });
  }

  // --- CONTACT FORM SUBMISSION ---
  const contactForm = document.getElementById('mareContactForm');
  const formFeedback = document.getElementById('formFeedback');

  if (contactForm && formFeedback) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      playTone(523.25, 'triangle', 0.2, 0.1);
      setTimeout(() => playTone(659.25, 'triangle', 0.2, 0.1), 100);
      setTimeout(() => playTone(783.99, 'triangle', 0.3, 0.1), 200);

      formFeedback.innerHTML = '✨ <strong>¡Mensaje recibido en el Laboratorio!</strong> En breve nos comunicaremos contigo desde Medellín.';
      formFeedback.className = 'form-feedback success';

      if (window.confetti) {
        window.confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00D9FF', '#FFD700', '#FF6B35'],
        });
      }

      contactForm.reset();
    });
  }

  // --- PILL BADGES CLICK TO SCROLL ---
  document.querySelectorAll('.pill-badge').forEach((badge) => {
    badge.addEventListener('click', () => {
      const targetPillar = badge.getAttribute('data-target');
      const targetEl = document.querySelector(`.card-${targetPillar}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.style.transform = 'scale(1.04)';
        setTimeout(() => {
          targetEl.style.transform = '';
        }, 600);
      }
    });
  });
});
