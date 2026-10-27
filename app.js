/**
 * ROMANTIC BIRTHDAY STORYBOOK
 * Interactive Engine: Dynamic Content Sync, Audio Player, 3D Page Flip for Desktop & Mobile
 */

document.addEventListener('DOMContentLoaded', () => {
  let isMobile = window.innerWidth <= 860;
  let currentSpread = 0;       // Desktop: 0 to 4
  const totalSpreads = 5;
  let currentMobilePage = 0;   // Mobile: 0 to 8
  const totalMobilePages = 9;
  let isAnimatingFlip = false;
  let storyContent = null;

  // DOM Elements
  const spreadSections = document.querySelectorAll('.spread-section');
  const prevSpreadBtn = document.getElementById('prevSpreadBtn');
  const nextSpreadBtn = document.getElementById('nextSpreadBtn');
  const dotBtns = document.querySelectorAll('.dot-btn');
  const openStoryBtn = document.getElementById('openStoryBtn');
  const readAgainBtn = document.getElementById('readAgainBtn');
  const zoneTurnLeft = document.getElementById('zoneTurnLeft');
  const zoneTurnRight = document.getElementById('zoneTurnRight');
  const flipperLeaf = document.getElementById('flipperLeaf');
  const mobileCards = document.querySelectorAll('[data-mobile-page]');

  // Interactive Birthday Cake
  const blowBtn = document.getElementById('blowBtn');
  const blowBtnLabel = document.getElementById('blowBtnLabel');
  const birthdayCake = document.getElementById('birthdayCake');
  const flames = [
    document.getElementById('flame-1'),
    document.getElementById('flame-2'),
    document.getElementById('flame-3')
  ];
  const candles = document.querySelectorAll('.single-candle');
  const wishBox = document.getElementById('wishBox');
  const cakeInstruction = document.getElementById('cakeInstruction');
  let isCandleBlown = false;

  // Envelope & Letter
  const vintageEnvelope = document.getElementById('vintageEnvelope');
  const waxSeal = document.getElementById('waxSeal');
  const envelopeHelpText = document.getElementById('envelopeHelpText');
  let isEnvelopeOpen = false;

  // Surprise Gift Box
  const giftBox = document.getElementById('giftBox');
  const giftMsgBox = document.getElementById('giftMsgBox');
  const giftPrompt = document.getElementById('giftPrompt');
  const rainLoveBtn = document.getElementById('rainLoveBtn');
  let isGiftOpen = false;

  // Audio Player
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const musicLabel = document.getElementById('musicLabel');
  const audioPlayer = document.getElementById('audioPlayer');
  let isMusicPlaying = false;
  let audioCtx = null;

  // =========================================================
  // 1. DYNAMIC CONTENT INJECTION FROM BACKEND / CONTENT.JSON
  // =========================================================
  async function fetchStoryContent() {
    // Render preloaded content instantly if available to prevent any photo flicker
    if (window.__PRELOADED_STORY__) {
      storyContent = window.__PRELOADED_STORY__;
      renderContent(storyContent);
    }

    try {
      const res = await fetch('/api/content?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        storyContent = await res.json();
        renderContent(storyContent);
        return;
      }
    } catch (e) {}

    // Fallback directly to content.json (for static CDN / Vercel)
    try {
      const resStatic = await fetch('content.json?t=' + Date.now(), { cache: 'no-store' });
      if (resStatic.ok) {
        storyContent = await resStatic.json();
        renderContent(storyContent);
      }
    } catch (err) {
      console.warn('Using inline default content');
    }
  }

  function renderContent(data) {
    if (!data) return;

    // Music
    if (data.music && data.music.src) {
      audioPlayer.src = data.music.src;
    }

    // Cover
    if (data.cover) {
      if (data.cover.badge) document.getElementById('coverBadge').textContent = data.cover.badge;
      if (data.cover.edition) document.getElementById('coverEdition').textContent = data.cover.edition;
      if (data.cover.tagline) document.getElementById('coverTagline').textContent = data.cover.tagline;
      if (data.cover.recipientName) document.getElementById('displayCoverName').textContent = data.cover.recipientName;
      if (data.cover.subtext) document.getElementById('coverSubtext').textContent = data.cover.subtext;
      if (data.cover.photo) document.getElementById('coverImagePreview').src = data.cover.photo;
    }

    // Spread 1
    if (data.spread1) {
      if (data.spread1.prologueTitle) document.getElementById('prologueTitle').textContent = data.spread1.prologueTitle;
      if (data.spread1.prologueP1) document.getElementById('prologueP1').textContent = data.spread1.prologueP1;
      if (data.spread1.prologueQuote) document.getElementById('prologueQuote').textContent = data.spread1.prologueQuote;
      if (data.spread1.prologueP2) document.getElementById('prologueP2').textContent = data.spread1.prologueP2;
      if (data.spread1.chapter1Title) document.getElementById('chapter1Title').textContent = data.spread1.chapter1Title;
      if (data.spread1.memory1Photo) document.getElementById('memory1Img').src = data.spread1.memory1Photo;
      if (data.spread1.memory1Caption) document.getElementById('memory1Caption').textContent = data.spread1.memory1Caption;
      if (data.spread1.memory1Date) document.getElementById('memory1Date').textContent = data.spread1.memory1Date;
      if (data.spread1.memory1Text) document.getElementById('memory1Text').textContent = data.spread1.memory1Text;
    }

    // Spread 2
    if (data.spread2) {
      if (data.spread2.chapter2Title) document.getElementById('chapter2Title').textContent = data.spread2.chapter2Title;
      if (data.spread2.reasons) {
        data.spread2.reasons.forEach((r, idx) => {
          const tEl = document.getElementById(`reasonTitle${idx}`);
          const dEl = document.getElementById(`reasonDesc${idx}`);
          if (tEl) tEl.textContent = r.title;
          if (dEl) dEl.textContent = r.desc;
        });
      }
      if (data.spread2.chapter3Title) document.getElementById('chapter3Title').textContent = data.spread2.chapter3Title;
      if (data.spread2.memory2Photo) document.getElementById('memory2Img').src = data.spread2.memory2Photo;
      if (data.spread2.memory2Caption) document.getElementById('memory2Caption').textContent = data.spread2.memory2Caption;
      if (data.spread2.memory2Date) document.getElementById('memory2Date').textContent = data.spread2.memory2Date;
      if (data.spread2.memory2Text) document.getElementById('memory2Text').textContent = data.spread2.memory2Text;
    }

    // Spread 3
    if (data.spread3) {
      if (data.spread3.cakeTitle) document.getElementById('cakeTitle').textContent = data.spread3.cakeTitle;
      if (data.spread3.wishMessage) document.getElementById('wishMessage').textContent = data.spread3.wishMessage;
      if (data.spread3.letterTitle) document.getElementById('letterTitle').textContent = data.spread3.letterTitle;
      if (data.spread3.letterDate) document.getElementById('displayLetterDate').textContent = data.spread3.letterDate;
      if (data.spread3.letterRecipient) document.getElementById('displayLetterTo').textContent = data.spread3.letterRecipient;
      if (data.spread3.letterContent) document.getElementById('displayLetterMsg').textContent = data.spread3.letterContent;
      if (data.spread3.letterSender) document.getElementById('displayLetterFrom').textContent = data.spread3.letterSender;
    }

    // Spread 4
    if (data.spread4) {
      if (data.spread4.giftTitle) document.getElementById('giftTitle').textContent = data.spread4.giftTitle;
      if (data.spread4.giftSecretMessage) document.getElementById('giftSecretMessage').textContent = data.spread4.giftSecretMessage;
      if (data.spread4.endingTitle) document.getElementById('endingTitle').textContent = data.spread4.endingTitle;
      if (data.spread4.endingQuote) document.getElementById('endingQuote').textContent = data.spread4.endingQuote;
    }

    // Persist in localStorage for 0ms instant load on refresh without photo flicker
    try {
      localStorage.setItem('jamet_story_content', JSON.stringify(data));
    } catch (e) {}
  }

  // =========================================================
  // 2. DESKTOP DUAL-PAGE SPREAD LOGIC
  // =========================================================
  function goToDesktopSpread(index, direction = 'next') {
    if (index < 0 || index >= totalSpreads || isAnimatingFlip) return;
    
    const previousIndex = currentSpread;
    currentSpread = index;
    isAnimatingFlip = true;

    // Trigger 3D flipper leaf animation
    if (flipperLeaf && previousIndex !== currentSpread) {
      flipperLeaf.className = 'page-flipper-leaf';
      void flipperLeaf.offsetWidth;
      if (direction === 'next') {
        flipperLeaf.classList.add('flipping-next');
      } else {
        flipperLeaf.classList.add('flipping-prev');
      }
    }

    spreadSections.forEach((section, idx) => {
      section.classList.remove('turn-in-next', 'turn-in-prev');
      const isTarget = idx === currentSpread;
      
      if (isTarget) {
        section.classList.add('active');
        if (direction === 'next') {
          section.classList.add('turn-in-next');
        } else {
          section.classList.add('turn-in-prev');
        }
        const pageContent = section.querySelectorAll('.page-content');
        pageContent.forEach(p => p.scrollTop = 0);
      } else {
        section.classList.remove('active');
      }
    });

    prevSpreadBtn.disabled = currentSpread === 0;
    nextSpreadBtn.disabled = currentSpread === totalSpreads - 1;

    dotBtns.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSpread);
    });

    if (zoneTurnLeft) zoneTurnLeft.style.display = currentSpread === 0 ? 'none' : 'flex';
    if (zoneTurnRight) zoneTurnRight.style.display = currentSpread >= totalSpreads - 1 ? 'none' : 'flex';

    playPageTurnSound();

    setTimeout(() => {
      isAnimatingFlip = false;
      if (flipperLeaf) flipperLeaf.className = 'page-flipper-leaf';
    }, 750);

    if (currentSpread === totalSpreads - 1) {
      triggerConfettiBurst();
    }
  }

  // =========================================================
  // 3. SPECIAL MOBILE 3D SINGLE-PAGE FLIP ENGINE
  // =========================================================
  function goToMobilePage(targetIdx, direction = 'next') {
    if (targetIdx < 0 || targetIdx >= totalMobilePages || isAnimatingFlip) return;

    const prevIdx = currentMobilePage;
    currentMobilePage = targetIdx;
    isAnimatingFlip = true;

    // Automatically trigger romantic music when opening book from cover (Page 0)
    if (prevIdx === 0 && targetIdx > 0 && !isMusicPlaying) {
      startMusic();
    }

    playPageTurnSound();

    const prevCard = document.querySelector(`[data-mobile-page="${prevIdx}"]`);
    const nextCard = document.querySelector(`[data-mobile-page="${targetIdx}"]`);

    const prevSpread = prevCard ? prevCard.closest('.spread-section') : null;
    const nextSpread = nextCard ? nextCard.closest('.spread-section') : null;

    // Keep both spreads visible during transition so flip animation is visible
    if (prevSpread) prevSpread.classList.add('active');
    if (nextSpread) nextSpread.classList.add('active');

    // 3D Flip Animation Classes
    if (prevCard && nextCard && prevIdx !== targetIdx) {
      // Clear previous classes
      mobileCards.forEach(c => {
        c.classList.remove('flip-out-next', 'flip-in-next', 'flip-out-prev', 'flip-in-prev');
      });

      if (direction === 'next') {
        prevCard.classList.add('flip-out-next');
        nextCard.classList.add('flip-in-next');
      } else {
        prevCard.classList.add('flip-out-prev');
        nextCard.classList.add('flip-in-prev');
      }

      // Reset scroll on target page
      const content = nextCard.querySelector('.page-content');
      if (content) content.scrollTop = 0;

      setTimeout(() => {
        mobileCards.forEach((c, idx) => {
          c.classList.remove('flip-out-next', 'flip-in-next', 'flip-out-prev', 'flip-in-prev');
          c.classList.toggle('mobile-active', idx === currentMobilePage);
        });

        // Clean up inactive spreads
        spreadSections.forEach(sec => {
          if (!sec.contains(nextCard)) {
            sec.classList.remove('active');
          }
        });

        isAnimatingFlip = false;
      }, 650);
    } else {
      mobileCards.forEach((c, idx) => {
        c.classList.toggle('mobile-active', idx === currentMobilePage);
      });
      spreadSections.forEach(sec => {
        if (!sec.contains(nextCard)) {
          sec.classList.remove('active');
        }
      });
      isAnimatingFlip = false;
    }

    // Controls update
    prevSpreadBtn.disabled = currentMobilePage === 0;
    nextSpreadBtn.disabled = currentMobilePage === totalMobilePages - 1;

    // Dot mapping (9 pages map proportionally to 5 dots)
    const activeDotIdx = Math.min(4, Math.floor(currentMobilePage / 2));
    dotBtns.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === activeDotIdx);
    });

    if (currentMobilePage === totalMobilePages - 1) {
      triggerConfettiBurst();
    }
  }

  // Unified Page Turning
  function turnNext() {
    if (isMobile) {
      if (currentMobilePage === 0 && !isMusicPlaying) {
        startMusic();
      }
      if (currentMobilePage < totalMobilePages - 1) {
        goToMobilePage(currentMobilePage + 1, 'next');
      }
    } else {
      if (currentSpread === 0 && !isMusicPlaying) {
        startMusic();
      }
      if (currentSpread < totalSpreads - 1) {
        goToDesktopSpread(currentSpread + 1, 'next');
      }
    }
  }

  function turnPrev() {
    if (isMobile) {
      if (currentMobilePage > 0) {
        goToMobilePage(currentMobilePage - 1, 'prev');
      }
    } else {
      if (currentSpread > 0) {
        goToDesktopSpread(currentSpread - 1, 'prev');
      }
    }
  }

  // Button Listeners
  nextSpreadBtn.addEventListener('click', turnNext);
  prevSpreadBtn.addEventListener('click', turnPrev);

  if (zoneTurnLeft) zoneTurnLeft.addEventListener('click', turnPrev);
  if (zoneTurnRight) zoneTurnRight.addEventListener('click', turnNext);

  if (openStoryBtn) {
    openStoryBtn.addEventListener('click', () => {
      if (!isMusicPlaying) {
        startMusic();
      }
      if (isMobile) {
        goToMobilePage(1, 'next');
      } else {
        goToDesktopSpread(1, 'next');
      }
    });
  }

  if (readAgainBtn) {
    readAgainBtn.addEventListener('click', () => {
      if (isMobile) {
        goToMobilePage(0, 'prev');
      } else {
        goToDesktopSpread(0, 'prev');
      }
    });
  }

  dotBtns.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetIdx = parseInt(dot.dataset.spreadIdx, 10);
      if (isMobile) {
        const targetMobileIdx = targetIdx * 2;
        const dir = targetMobileIdx > currentMobilePage ? 'next' : 'prev';
        goToMobilePage(Math.min(targetMobileIdx, totalMobilePages - 1), dir);
      } else {
        const dir = targetIdx > currentSpread ? 'next' : 'prev';
        goToDesktopSpread(targetIdx, dir);
      }
    });
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      turnNext();
    } else if (e.key === 'ArrowLeft') {
      turnPrev();
    }
  });

  // Touch Swipe for Mobile HP with High Responsiveness
  let touchStartX = 0;
  let touchStartY = 0;
  const stage = document.getElementById('storybookWrapper');

  stage.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  stage.addEventListener('touchmove', (e) => {
    if (!e.touches || !e.touches[0]) return;
    const currentX = e.touches[0].screenX;
    const currentY = e.touches[0].screenY;
    const dx = Math.abs(currentX - touchStartX);
    const dy = Math.abs(currentY - touchStartY);

    // Lock horizontal dragging so book stays 100% solid and never shifts horizontally
    if (dx > dy && dx > 8) {
      if (e.cancelable) e.preventDefault();
    }
  }, { passive: false });

  stage.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // Minimum swipe threshold 30px
    if (Math.abs(diffX) > 30 && Math.abs(diffX) > Math.abs(diffY)) {
      // Trigger music on cover swipe
      if (isMobile && currentMobilePage === 0 && !isMusicPlaying) {
        startMusic();
      } else if (!isMobile && currentSpread === 0 && !isMusicPlaying) {
        startMusic();
      }

      // On cover page (Page 0): ANY horizontal swipe opens the book!
      if ((isMobile && currentMobilePage === 0) || (!isMobile && currentSpread === 0)) {
        turnNext();
        return;
      }

      // GESER KE KANAN (diffX > 0): MEMBUKA HALAMAN BERIKUTNYA
      if (diffX > 0) {
        turnNext();
      } else if (diffX < -30) {
        // GESER KE KIRI (diffX < -30): MENUTUP / KEMBALI KE DEPAN
        turnPrev();
      }
    }
  }, { passive: true });

  // Handle Resize between Mobile and Desktop
  window.addEventListener('resize', () => {
    const newIsMobile = window.innerWidth <= 860;
    if (newIsMobile !== isMobile) {
      isMobile = newIsMobile;
      if (isMobile) {
        // Sync spread to mobile page
        currentMobilePage = currentSpread * 2;
        goToMobilePage(Math.min(currentMobilePage, totalMobilePages - 1));
      } else {
        // Sync mobile page to spread
        currentSpread = Math.min(4, Math.floor(currentMobilePage / 2));
        goToDesktopSpread(currentSpread);
      }
    }
  });

  // Init initial state
  if (isMobile) {
    goToMobilePage(0);
  } else {
    goToDesktopSpread(0);
  }

  // =========================================================
  // 4. INTERACTIVE BIRTHDAY CAKE & TIUP LILIN
  // =========================================================
  function handleBlowCandle() {
    if (isCandleBlown) {
      flames.forEach(flame => flame.classList.remove('out'));
      candles.forEach(candle => candle.classList.remove('blown'));
      wishBox.classList.add('hidden');
      blowBtnLabel.textContent = 'Tiup Lilin Sekarang';
      cakeInstruction.textContent = 'Pejamkan mata, panjatkan harapan terbaikmu, lalu klik tombol atau lilin di atas!';
      isCandleBlown = false;
      return;
    }

    flames.forEach(flame => flame.classList.add('out'));
    candles.forEach(candle => candle.classList.add('blown'));
    playBlowSound();

    setTimeout(() => {
      isCandleBlown = true;
      blowBtnLabel.textContent = 'Nyalakan Kembali Lilin 🕯️';
      cakeInstruction.textContent = 'Lilin berhasil ditiup! Harapanmu melayang ke angkasa ✨';
      wishBox.classList.remove('hidden');

      triggerConfettiBurst();
      playChimeSound();
    }, 350);
  }

  if (blowBtn) blowBtn.addEventListener('click', handleBlowCandle);
  if (birthdayCake) birthdayCake.addEventListener('click', handleBlowCandle);

  function triggerConfettiBurst() {
    if (typeof confetti !== 'function') return;
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff7675', '#d4af37', '#fd79a8', '#ffffff', '#e84393']
    });

    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#d4af37', '#f8a5c2', '#a29bfe']
      });
    }, 250);
  }

  // =========================================================
  // 5. WAX SEAL & LOVE LETTER
  // =========================================================
  function toggleEnvelope() {
    isEnvelopeOpen = !isEnvelopeOpen;
    if (isEnvelopeOpen) {
      vintageEnvelope.classList.add('opened');
      envelopeHelpText.textContent = 'Surat cinta telah terbuka dengan indah 💌';
      playChimeSound();
    } else {
      vintageEnvelope.classList.remove('opened');
      envelopeHelpText.textContent = 'Klik segel lilin merah di atas untuk membuka surat 💌';
    }
  }

  if (waxSeal) {
    waxSeal.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleEnvelope();
    });
  }
  if (vintageEnvelope) vintageEnvelope.addEventListener('click', toggleEnvelope);

  // =========================================================
  // 6. SURPRISE GIFT BOX
  // =========================================================
  if (giftBox) {
    giftBox.addEventListener('click', () => {
      isGiftOpen = !isGiftOpen;
      if (isGiftOpen) {
        giftBox.classList.add('opened');
        giftPrompt.textContent = 'Kado cintaku selalu untukmu! 💖✨';
        giftMsgBox.classList.remove('hidden');
        triggerConfettiBurst();
        playChimeSound();
      } else {
        giftBox.classList.remove('opened');
        giftPrompt.textContent = 'Sentuh kotak kado ini untuk membukanya! 🎁';
        giftMsgBox.classList.add('hidden');
      }
    });
  }

  if (rainLoveBtn) {
    rainLoveBtn.addEventListener('click', () => {
      triggerConfettiBurst();
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          createFloatingHeart(
            Math.random() * window.innerWidth,
            window.innerHeight - 50
          );
        }, i * 70);
      }
    });
  }

  // =========================================================
  // 7. AMBIENT PETALS & CANVAS
  // =========================================================
  const canvas = document.getElementById('ambientCanvas');
  const ctx = canvas.getContext('2d');
  let petals = [];
  let stars = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
  }

  function initStars() {
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 8500);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        speed: Math.random() * 0.02 + 0.005
      });
    }
  }

  class RosePetal {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * canvas.width;
      this.y = initial ? Math.random() * canvas.height : -20;
      this.size = Math.random() * 12 + 10;
      this.speedY = Math.random() * 1.2 + 0.7;
      this.speedX = Math.sin(Math.random() * Math.PI) * 0.8 + 0.2;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 2;
      this.color = Math.random() > 0.4 ? '#f8a5c2' : '#ff7675';
      this.opacity = Math.random() * 0.5 + 0.35;
      this.wobble = 0;
      this.wobbleSpeed = Math.random() * 0.05 + 0.02;
    }

    update() {
      this.wobble += this.wobbleSpeed;
      this.y += this.speedY;
      this.x += Math.sin(this.wobble) * 1.5 + this.speedX;
      this.rotation += this.rotationSpeed;

      if (this.y > canvas.height + 20 || this.x > canvas.width + 20) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(this.size / 2, -this.size / 2, this.size, 0, this.size / 2, this.size);
      ctx.bezierCurveTo(0, this.size / 1.5, -this.size / 2, this.size / 2, 0, 0);
      ctx.fill();
      ctx.restore();
    }
  }

  function initPetals() {
    petals = [];
    const count = window.innerWidth <= 860 ? 25 : 45;
    for (let i = 0; i < count; i++) {
      petals.push(new RosePetal());
    }
  }

  function animateAmbient() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach(star => {
      star.alpha += star.speed;
      if (star.alpha > 1 || star.alpha < 0.2) star.speed = -star.speed;
      ctx.fillStyle = `rgba(255, 235, 180, ${Math.abs(star.alpha)})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    petals.forEach(petal => {
      petal.update();
      petal.draw();
    });

    requestAnimationFrame(animateAmbient);
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    initPetals();
  });

  resizeCanvas();
  initPetals();
  animateAmbient();

  // Floating heart tap
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
    createFloatingHeart(e.clientX, e.clientY);
  });

  function createFloatingHeart(x, y) {
    const heart = document.createElement('div');
    const icons = ['💖', '💕', '✨', '🌸', '❤️', '🌹'];
    heart.textContent = icons[Math.floor(Math.random() * icons.length)];
    heart.style.position = 'fixed';
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.style.fontSize = `${Math.random() * 12 + 18}px`;
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = '9999';
    heart.style.transform = 'translate(-50%, -50%) scale(0.5)';
    heart.style.transition = 'all 1.1s cubic-bezier(0.2, 0.8, 0.3, 1)';
    heart.style.opacity = '1';
    document.body.appendChild(heart);

    const randomAngle = (Math.random() - 0.5) * 80;
    const randomDistance = Math.random() * 80 + 50;

    requestAnimationFrame(() => {
      heart.style.transform = `translate(calc(-50% + ${randomAngle}px), calc(-50% - ${randomDistance}px)) scale(1.3)`;
      heart.style.opacity = '0';
    });

    setTimeout(() => {
      heart.remove();
    }, 1100);
  }

  // =========================================================
  // 8. AUDIO ENGINE (JAZ - BERSAMAMU & SOUND EFFECTS)
  // =========================================================
  function initAudioContext() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtxClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playPageTurnSound() {
    try {
      initAudioContext();
      if (!audioCtx || audioCtx.state !== 'running') return;
      const bufferSize = audioCtx.sampleRate * 0.16;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 850;
      const gain = audioCtx.createGain();
      gain.gain.value = 0.1;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start();
    } catch (e) {}
  }

  function playBlowSound() {
    try {
      initAudioContext();
      if (!audioCtx || audioCtx.state !== 'running') return;
      const bufferSize = audioCtx.sampleRate * 0.35;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 450;
      const gain = audioCtx.createGain();
      gain.gain.value = 0.12;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start();
    } catch (e) {}
  }

  function playChimeSound() {
    try {
      initAudioContext();
      if (!audioCtx || audioCtx.state !== 'running') return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.07);
        gain.gain.setValueAtTime(0.0001, audioCtx.currentTime + i * 0.07);
        gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + i * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + i * 0.07 + 1.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.07);
        osc.stop(audioCtx.currentTime + i * 0.07 + 1.1);
      });
    } catch (e) {}
  }

  function startMusic() {
    audioPlayer.play().then(() => {
      isMusicPlaying = true;
      musicToggleBtn.classList.add('playing');
      musicLabel.textContent = 'Musik: Hidup';
    }).catch(err => {
      console.warn('Audio play waiting for gesture:', err);
    });
  }

  function stopMusic() {
    audioPlayer.pause();
    isMusicPlaying = false;
    musicToggleBtn.classList.remove('playing');
    musicLabel.textContent = 'Musik: Mati';
  }

  musicToggleBtn.addEventListener('click', () => {
    if (isMusicPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  });

  fetchStoryContent();
});
