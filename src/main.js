/**
 * Sinfonia da Mariposa - Simulação Interativa (Vanilla JS)
 * Efeitos climáticos, cinemática suave d'asa, física de polinização e sons acústicos Web Audio.
 */

// Configurações Globais / Estados da Simulação
const state = {
  // Coordenadas da Mariposa (%)
  currentX: 50,
  currentY: 40,
  targetX: 50,
  targetY: 40,
  
  // Velocidades e Física
  lerpFactor: 0.08, // Suavidade da perseguição (alterado pela Gui)
  flightTilt: 0,
  lastX: 50,
  shadowScale: 1.0,
  
  // Climática e Tempo de Dia
  timeOfDay: 'day', // 'day', 'sunset', 'night'
  windSpeed: 40,    // Intensidade da brisa (0 a 100)
  
  // Status de Áudio
  audioActive: true,
  
  // Banco de Dados Local de Flores
  flowers: [],
  flowersCount: 0
};

// Gerenciador de Áudio com Sintetizador Integrado
let audioCtx = null;
const pentatonicScale = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00  // A5
];

// Inicialização completa do sistema
document.addEventListener('DOMContentLoaded', () => {
  initAtmosphericPollen();
  initDynamicMeadow();
  setupGuiToggle();
  setupSimulationListeners();
  runPhysicsLoop();
});

// 1. Inicializar Pólen e Vaga-lumes Drifting na Atmosfera
function initAtmosphericPollen() {
  const container = document.getElementById('pollen-atmosphere');
  container.innerHTML = '';
  
  // Cria 20 partículas flutuantes permanentes que renascem infinitamente
  for (let i = 0; i < 22; i++) {
    createAtmoPollen(container);
  }
}

function createAtmoPollen(parent) {
  const particle = document.createElement('div');
  particle.className = 'pollen-particle';
  
  const leftPos = Math.random() * 110 - 5; // % horizontal
  const animDuration = 12 + Math.random() * 20; // segundos
  const animDelay = Math.random() * -20; // delay negativo para começar já disperso
  const size = 3 + Math.random() * 6; // px
  
  // Cores divertidas e alegres para as partículas de polinização
  const colors = ['#ffe66d', '#06d6a0', '#ff007f', '#4cc9f0', '#ffb703', '#ffffff'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  particle.style.left = `${leftPos}%`;
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.backgroundColor = color;
  particle.style.boxShadow = `0 0 10px ${color}, 0 0 3px #ffffff`;
  particle.style.animationDuration = `${animDuration}s`;
  particle.style.animationDelay = `${animDelay}s`;
  
  // Configura variáveis customizadas no CSS para desvio em X e escala
  particle.style.setProperty('--drift-w', `${-50 + Math.random() * 150}px`);
  particle.style.setProperty('--bloom-sz', `${0.6 + Math.random() * 1.2}`);
  
  parent.appendChild(particle);
}

// 2. Gerar Campo Florido Inicial
function initDynamicMeadow() {
  const flowersContainer = document.getElementById('flowers-container');
  flowersContainer.innerHTML = '';
  state.flowers = [];

  // Determinando número de flores iniciais pelo tamanho da tela
  const density = window.innerWidth < 768 ? 14 : 28;
  
  for (let i = 0; i < density; i++) {
    const screenPercentX = 5 + (i * (90 / density)) + (Math.random() * 4 - 2);
    spawnFlower(screenPercentX, Math.random() * 30 + 10, false); // Altura e posição randômicas
  }
  
  updateFlowerUI();
}

// Criar elemento flor no DOM
function spawnFlower(posX, stemHeight, interactive = true) {
  const container = document.getElementById('flowers-container');
  const flowerDiv = document.createElement('div');
  flowerDiv.className = 'flower';
  if (interactive) {
    flowerDiv.classList.add('flower-bloom-init');
  }

  // Definindo ID único do elemento
  const flId = `flower-${Date.now()}-${Math.floor(Math.random()*1000)}`;
  flowerDiv.id = flId;

  // Parâmetros visuais
  const flowerSize = 26 + Math.random() * 22; // diâmetro em px
  const rotationAngle = -6 + Math.random() * 12; // inclinação inicial
  
  const petalColors = [
    '#ef476f', '#f72585', '#ffd166', '#06d6a0', '#118ab2', 
    '#ff70a6', '#ff9770', '#ffd670', '#e9ff70', '#8338ec'
  ];
  const coreColors = ['#ffb703', '#fc5a5a', '#ffffff', '#7209b7', '#ffbe0b'];
  
  const petalColor = petalColors[Math.floor(Math.random() * petalColors.length)];
  const coreColor = coreColors[Math.floor(Math.random() * coreColors.length)];
  
  // Determinando o tipo estrutural da flor (Daisy, Bell, Orchid)
  const types = ['daisy', 'daisy', 'bell', 'orchid'];
  const type = types[Math.floor(Math.random() * types.length)];
  flowerDiv.classList.add(`flower-type-${type}`);

  // Configurações por CSS Var
  flowerDiv.style.left = `${posX}%`;
  flowerDiv.style.zIndex = Math.floor(100 - stemHeight);
  flowerDiv.style.setProperty('--stem-height', `${stemHeight}vh`);
  flowerDiv.style.setProperty('--flower-size', `${flowerSize}px`);
  
  // Criação da Haste
  const stem = document.createElement('div');
  stem.className = 'flower-stem';
  
  // Adiciona folhas na haste
  const leaf1 = document.createElement('div');
  leaf1.className = 'stem-leaf';
  stem.appendChild(leaf1);
  if (Math.random() > 0.4) {
    const leaf2 = document.createElement('div');
    leaf2.className = 'stem-leaf right';
    stem.appendChild(leaf2);
  }
  
  // Cabeça da Flor
  const head = document.createElement('div');
  head.className = 'flower-head';
  head.style.setProperty('--petal-color', petalColor);
  head.style.setProperty('--core-color', coreColor);

  // Pétalas agrupadas
  const numPetals = type === 'bell' ? 3 : (type === 'orchid' ? 5 : 8);
  for (let p = 0; p < numPetals; p++) {
    const petal = document.createElement('div');
    petal.className = `flower-petal pet-${p}`;
    
    // Deixar formato alternado
    if (type === 'orchid') {
      petal.style.transform = `rotate(${p * 72}deg) scaleY(${p%2 === 0 ? 1.2 : 0.9})`;
    } else if (type === 'bell') {
      petal.style.transform = `rotate(${(p - 1) * 30}deg)`;
    } else {
      petal.style.transform = `rotate(${p * 45}deg)`;
    }
    
    head.appendChild(petal);
  }

  // Miolo
  const core = document.createElement('div');
  core.className = 'flower-core';
  head.appendChild(core);

  // Montagem da Flor
  flowerDiv.appendChild(stem);
  flowerDiv.appendChild(head);
  container.appendChild(flowerDiv);

  // Salvar no estado geométrico para detecção de colisão de voo
  const flowerNode = {
    id: flId,
    dom: flowerDiv,
    posX: posX, // horizontal %
    posY: 100 - stemHeight, // vertical aproximada do topo da flor %
    chimeFreq: pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)],
    pollinated: false,
    cooldown: 0
  };
  
  state.flowers.push(flowerNode);
  state.flowersCount++;
}

function setupGuiToggle() {
  const guiContainer = document.getElementById('gui-container');
  const guiToggle = document.getElementById('btn-gui-toggle');

  if (!guiContainer || !guiToggle) return;

  const guiLabel = guiToggle.querySelector('.gui-toggle-label');
  const guiIcon = guiToggle.querySelector('.gui-toggle-icon');

  const applyGuiState = (collapsed) => {
    guiContainer.classList.toggle('is-collapsed', collapsed);
    guiToggle.setAttribute('aria-expanded', String(!collapsed));
    guiToggle.title = collapsed ? 'Abrir controles' : 'Recolher controles';

    if (guiLabel) {
      guiLabel.textContent = collapsed ? 'Abrir controles' : 'Recolher';
    }

    if (guiIcon) {
      guiIcon.textContent = collapsed ? '+' : '−';
    }
  };

  applyGuiState(localStorage.getItem('gui-collapsed') === 'true');

  guiToggle.addEventListener('click', () => {
    const collapsed = !guiContainer.classList.contains('is-collapsed');
    applyGuiState(collapsed);
    localStorage.setItem('gui-collapsed', String(collapsed));
  });
}

function updateFlowerUI() {
  document.getElementById('val-flowers').textContent = state.flowersCount;
}

// 3. Configurar Ouvintes e Gatilhos de Controle (Sliders, Cliques, etc)
function setupSimulationListeners() {
  const canvas = document.getElementById('landscape-canvas');
  
  // Seguir Mouse
  canvas.addEventListener('mousemove', (e) => {
    updateMariposaTarget(e.clientX, e.clientY);
  });

  // Touch para dispositivos móveis
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 0) {
      updateMariposaTarget(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  // Plantar Flor ao Clicar no Campo
  canvas.addEventListener('mousedown', (e) => {
    // Garantir ativação de áudio na primeira interação do usuário (Regra de Segurança do Browser)
    tryResumeAudio();

    // Evitar plantar se clicou em cima da GUI
    if (e.target.closest('#gui-container')) return;

    // Calcular coordenada proporcional do clique
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Plantar se clicou na metade inferior (onde fica o meadow campo)
    if (clickY > 64) {
      const stemLength = 100 - clickY; // altura proporcional da haste
      if (stemLength > 5 && stemLength < 32) {
        spawnFlower(clickX, stemLength, true);
        updateFlowerUI();
        triggerChimeSynth(pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)], 0.3);
      }
    } else {
      // Se clicou no céu, a mariposa voa em voo rápido direto ao ponto
      updateMariposaTarget(e.clientX, e.clientY);
    }
  });

  // Listener para Clima / Tempo de Dia
  document.getElementById('btn-day').addEventListener('click', () => changeTimeOfDay('day'));
  document.getElementById('btn-sunset').addEventListener('click', () => changeTimeOfDay('sunset'));
  document.getElementById('btn-night').addEventListener('click', () => changeTimeOfDay('night'));

  // Slider de Velocidade de Voo
  const sliderSpeed = document.getElementById('slider-flyspeed');
  sliderSpeed.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    let label = 'Normal';
    
    if (val < 30) {
      state.lerpFactor = 0.03;
      document.documentElement.style.setProperty('--flight-speed', '0.62s'); // Batida lenta d'asa
      label = 'Câmera Lenta (Slo-mo)';
    } else if (val > 75) {
      state.lerpFactor = 0.15;
      document.documentElement.style.setProperty('--flight-speed', '0.14s'); // Batida ágil e rápida
      label = 'Voo Ágil / Turbo';
    } else {
      state.lerpFactor = 0.08;
      document.documentElement.style.setProperty('--flight-speed', '0.28s'); // Batida padrão
      label = 'Normal';
    }
    document.getElementById('val-speed').textContent = `Velocidade de Voo: ${label}`;
  });

  // Slider de vento
  const sliderWind = document.getElementById('slider-windspeed');
  sliderWind.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    state.windSpeed = val;
    
    // Definição do vento fator multiplicativo no CSS
    const windFactor = (val / 40);
    document.documentElement.style.setProperty('--wind-factor', windFactor.toFixed(2));
    
    let windText = 'Brisa Suave';
    if (val === 0) windText = 'Ar Parado';
    else if (val < 25) windText = 'Sopro Mínimo';
    else if (val > 80) windText = 'Ventania de Tempestade';
    else if (val > 55) windText = 'Vento Alegre';

    document.getElementById('val-wind').textContent = `Vento d'Ar: ${windText} (${val}%)`;
  });

  // Gerenciador de Ativação do Som
  const btnAudio = document.getElementById('btn-audio');
  btnAudio.addEventListener('click', () => {
    state.audioActive = !state.audioActive;
    if (state.audioActive) {
      btnAudio.className = 'audio-active';
      document.getElementById('txt-audio').textContent = 'Mapeamento de Áudio Ativo';
      tryResumeAudio();
    } else {
      btnAudio.className = 'audio-muted';
      document.getElementById('txt-audio').textContent = 'Som Mutado';
    }
  });

  // Tratar Redimensionamento d'Tela
  window.addEventListener('resize', () => {
    // Redefine flores para não sumirem no corte se a largura alterou muito
    initDynamicMeadow();
  });
}

function updateMariposaTarget(clientX, clientY) {
  const canvas = document.getElementById('landscape-canvas');
  const rect = canvas.getBoundingClientRect();
  
  // Transforma coordenadas em porcentagem %
  state.targetX = ((clientX - rect.left) / rect.width) * 100;
  state.targetY = ((clientY - rect.top) / rect.height) * 100;
  
  // Limita margens para não transbordar o céu ou sumir no chão
  if (state.targetX < 1) state.targetX = 1;
  if (state.targetX > 99) state.targetX = 99;
  if (state.targetY < 2) state.targetY = 2;
  if (state.targetY > 92) state.targetY = 92;
}

// 4. Mudar Tema de Clima e Ambiente Visual
function changeTimeOfDay(time) {
  state.timeOfDay = time;
  
  // Atualiza classes do botão
  const buttons = ['btn-day', 'btn-sunset', 'btn-night'];
  buttons.forEach(id => {
    const btn = document.getElementById(id);
    if (id === `btn-${time}`) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Muda atmosfera
  const atmo = document.getElementById('atmosphere');
  atmo.className = `atmosphere-${time}`;

  // Muda o astro principal (Sol/Lua)
  const astro = document.getElementById('celestial-body');
  if (time === 'day') {
    astro.className = 'sun';
  } else if (time === 'sunset') {
    astro.className = 'golden-sun';
  } else {
    astro.className = 'moon';
  }

  // Lida com estrelas à noite
  const stars = document.getElementById('stars-field');
  if (time === 'night') {
    generateStars();
    stars.classList.add('stars-visible');
  } else {
    stars.classList.remove('stars-visible');
  }
}

// Cria pontos luminosos de constelação fantásticas
function generateStars() {
  const starsField = document.getElementById('stars-field');
  starsField.innerHTML = '';
  const starCount = window.innerWidth < 768 ? 40 : 100;
  
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    
    const size = Math.random() * 2 + 0.8;
    const top = Math.random() * 65; // somente no céu superior
    const left = Math.random() * 100;
    const delay = Math.random() * 4;
    
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.top = `${top}%`;
    star.style.left = `${left}%`;
    star.style.animationDelay = `${delay}s`;
    
    starsField.appendChild(star);
  }
}

// 5. Sintetizador de Áudio Procedural (Web Audio API)
function tryResumeAudio() {
  if (state.audioActive && !audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function triggerChimeSynth(frequency, customVolume = 0.12) {
  if (!state.audioActive) return;
  tryResumeAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  
  // 1. Oscilador Principal (ONDA SINE para timbre de cristal macio)
  const osc = audioCtx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequency, now);

  // Adicionar um leve vibrato para soar orgânico
  const vibrato = audioCtx.createOscillator();
  const vibratoGain = audioCtx.createGain();
  vibrato.frequency.setValueAtTime(6, now); // 6Hz
  vibratoGain.gain.setValueAtTime(3, now); // desvio de frequência
  vibrato.connect(vibratoGain);
  vibratoGain.connect(osc.frequency);
  vibrato.start(now);

  // 2. Oscilador Secundário / Harmônico (Frequência oitavada para o tom soar brilhante)
  const oscHarmonic = audioCtx.createOscillator();
  oscHarmonic.type = 'sine';
  oscHarmonic.frequency.setValueAtTime(frequency * 2, now);

  // 3. Nó de Ganho com Envelope de Decaimento Exponencial
  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0.001, now);
  // Ataque rápido para efeito de sino mecânico
  gainNode.gain.linearRampToValueAtTime(customVolume, now + 0.04);
  // Decay longo e agradável
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

  // Nó Filtro Passa-Baixa para amenizar imperfeições agudas
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1400, now);

  // Linha de Eco de Atraso
  const delay = audioCtx.createDelay();
  delay.delayTime.setValueAtTime(0.35, now);
  
  const delayGain = audioCtx.createGain();
  delayGain.gain.setValueAtTime(0.25, now); // Feedback de volume do eco

  // Conexões
  osc.connect(filter);
  oscHarmonic.connect(filter);
  
  filter.connect(gainNode);

  // Roteamento do Delay
  gainNode.connect(audioCtx.destination); // Som direto
  gainNode.connect(delay);                // Rota atraso
  delay.connect(delayGain);
  delayGain.connect(delay);               // Loop feedback
  delayGain.connect(audioCtx.destination); // Som eco gerado

  // Iniciar e encerrar osciladores
  osc.start(now);
  oscHarmonic.start(now);
  
  osc.stop(now + 2.0);
  oscHarmonic.stop(now + 2.0);
  vibrato.stop(now + 2.0);
}

// 6. Loop Principal de Física e cinemática (60 fps)
function runPhysicsLoop() {
  // Lerp de Posição da Mariposa (Seguição suave)
  const diffX = state.targetX - state.currentX;
  const diffY = state.targetY - state.currentY;
  
  state.currentX += diffX * state.lerpFactor;
  state.currentY += diffY * state.lerpFactor;
  
  // Calcular inclinação lateral (tilt) com base na velocidade horizontal
  const targetTilt = diffX * 0.75;
  state.flightTilt += (targetTilt - state.flightTilt) * 0.15;
  // Limitação de rotação lateral
  if (state.flightTilt < -45) state.flightTilt = -45;
  if (state.flightTilt > 45) state.flightTilt = 45;

  // Atualizar variáveis de estilo no wrapper da mariposa
  const wrapper = document.getElementById('mariposa-wrapper');
  if (wrapper) {
    wrapper.style.left = `${state.currentX}%`;
    wrapper.style.top = `${state.currentY}%`;
    wrapper.style.setProperty('--tilt', `${state.flightTilt}deg`);
  }

  // Atualizar Sombra da Mariposa
  const shadow = document.getElementById('mariposa-shadow');
  if (shadow) {
    shadow.style.left = `${state.currentX}%`;
    // Escalar baseado na altura Y (quanto mais alta, menor e mais clara a sombra)
    // Sendo que Y do chão é tipicamente > 68%
    const altitude = 68 - state.currentY;
    if (altitude > 0) {
      state.shadowScale = Math.max(0.3, 1.0 - (altitude * 0.015));
      shadow.style.opacity = Math.max(0.1, 0.65 - (altitude * 0.01));
    } else {
      state.shadowScale = 1.0;
      shadow.style.opacity = 0.65;
    }
    shadow.style.setProperty('--sh-scale', state.shadowScale.toFixed(2));
  }

  // HUD Coordenadas
  const coordsTxt = document.getElementById('tracker-coords');
  if (coordsTxt) {
    coordsTxt.textContent = `X: ${Math.round(state.currentX)}% | Y: ${Math.round(state.currentY)}%`;
  }

  // Emitir partícula de Rastro das asas
  if (Math.abs(diffX) > 0.4 || Math.abs(diffY) > 0.4) {
    if (Math.random() > 0.65) {
      spawnTrailGold(state.currentX, state.currentY);
    }
  }

  // Detecção de Colisão e Polinização das Flores no Prado
  checkFlowerKiss();

  // Loop recursivo estável de frames do navegador
  requestAnimationFrame(runPhysicsLoop);
}

// Emite pequenas faíscas brilhantes coloridas
function spawnTrailGold(posXPercent, posYPercent) {
  const container = document.getElementById('pollen-atmosphere');
  if (!container) return;

  const spark = document.createElement('div');
  spark.className = 'trail-particle';
  
  // Pequena margem de erro aleatória para parecer emanado das pontas das asas
  const dX = -5 + Math.random() * 10;
  const dY = -2 + Math.random() * 10;
  
  spark.style.left = `calc(${posXPercent}% + ${dX}px)`;
  spark.style.top = `calc(${posYPercent}% + ${dY}px)`;
  
  // Cores brilhantes e divertidas
  const colors = ['#ffe66d', '#00f5d4', '#f72585', '#ff9770', '#ffffff'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  spark.style.backgroundColor = color;
  spark.style.boxShadow = `0 0 8px ${color}, 0 0 2px #fff`;
  
  const size = 4 + Math.random() * 5;
  spark.style.width = `${size}px`;
  spark.style.height = `${size}px`;

  container.appendChild(spark);
  
  // Remove após terminar animação de fade no css (900ms)
  setTimeout(() => {
    spark.remove();
  }, 900);
}

// Checa de forma geométrica proximidade da mariposa com as cabeças das flores
function checkFlowerKiss() {
  state.flowers.forEach(fl => {
    // Reduz resfriador
    if (fl.cooldown > 0) {
      fl.cooldown--;
      return;
    }

    const distH = Math.abs(state.currentX - fl.posX);
    //posY coincide com topo do stem/haste aproximado da flor
    const distV = Math.abs(state.currentY - fl.posY);

    // Se estiver perto o bastante da cabeça da flor
    if (distH < 2.5 && distV < 5.0) {
      // Floresce flor com brilho e efeito
      fl.pollinated = true;
      fl.cooldown = 120; // Silêncio de 2 segundos para evitar loops de som chiando

      const petal = fl.dom.querySelector('.flower-core');
      if (petal) {
        // Impacto visual temporário de vibração
        petal.style.transform = 'scale(1.4)';
        petal.style.filter = 'brightness(1.5)';
        fl.dom.style.animation = 'none';
        
        // Disparar uma rajada de 6 faíscas de pólen na cabeça da flor
        for (let s = 0; s < 6; s++) {
          setTimeout(() => {
            spawnTrailGold(fl.posX, fl.posY);
          }, s * 50);
        }

        // Tocar som pentatônico suave correspondente à flor beijada
        triggerChimeSynth(fl.chimeFreq, 0.16);

        // Retorna balanço após breve tempo
        setTimeout(() => {
          petal.style.transform = 'none';
          petal.style.filter = 'none';
          fl.dom.style.animation = 'flower-sway 4s infinite ease-in-out';
        }, 1000);
      }
    }
  });
}
