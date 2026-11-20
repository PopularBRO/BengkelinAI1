/* ============================================================
   BENGKELINAI INTERACTIONS
   Vanilla JavaScript. No build tools or framework required.
   Demo-only features are clearly marked in the interface.
   ============================================================ */

'use strict';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const appState = {
  photoFile: null,
  photoPreviewUrl: null,
  mediaRecorder: null,
  audioStream: null,
  audioChunks: [],
  audioBlob: null,
  audioUrl: null,
  recordingStartedAt: null,
  recordingTimer: null,
  recordingElapsed: 0
};

/* -----------------------------
   Utilities
------------------------------ */
function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function showToast(message, duration = 3600) {
  const region = $('#toastRegion');
  if (!region) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  region.appendChild(toast);
  window.setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    window.setTimeout(() => toast.remove(), 240);
  }, duration);
}

function showFormFeedback(element, message, type = 'success') {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('error', type === 'error');
  element.hidden = false;
}

function hideElement(element) {
  if (element) element.hidden = true;
}

function setCurrentYear() {
  const year = $('#currentYear');
  if (year) year.textContent = String(new Date().getFullYear());
}

/* -----------------------------
   Header and mobile navigation
------------------------------ */
function initHeader() {
  const header = $('.site-header');
  const toggle = $('#mobileMenuToggle');
  const nav = $('#primaryNav');
  // Add the dedicated AI Chatbot destination to the shared navigation on every page.
  if (nav && !nav.querySelector('[data-page-key="chatbot"]')) {
    const chatbotLink = document.createElement('a');
    chatbotLink.className = 'nav-link';
    chatbotLink.dataset.pageKey = 'chatbot';
    chatbotLink.href = 'chatbot.html';
    chatbotLink.textContent = 'AI Chatbot';
    const diagnosisLink = nav.querySelector('[data-page-key="diagnosis"]');
    if (diagnosisLink) diagnosisLink.insertAdjacentElement('afterend', chatbotLink);
    else nav.appendChild(chatbotLink);
  }
  const navLinks = $$('.nav-link');
  const currentPage = document.body.dataset.page || 'home';
  const currentGroup = document.body.dataset.navGroup || currentPage;

  const updateHeaderShadow = () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 12);
  };
  updateHeaderShadow();
  window.addEventListener('scroll', updateHeaderShadow, { passive: true });

  navLinks.forEach(link => {
    const key = link.dataset.pageKey;
    const active = key === currentPage || key === currentGroup;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Buka navigasi' : 'Tutup navigasi');
      nav.classList.toggle('open', !isOpen);
    });
    navLinks.forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Buka navigasi');
    }));
    document.addEventListener('click', event => {
      if (!nav.contains(event.target) && !toggle.contains(event.target)) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Buka navigasi');
      }
    });
  }
}

/* -----------------------------
   Simple scroll reveal
------------------------------ */
function initReveal() {
  const revealTargets = $$('.problem-card, .step-card, .feature-detail, .workshop-card, .value-item');
  revealTargets.forEach(element => element.classList.add('js-reveal'));
  if (!('IntersectionObserver' in window)) {
    revealTargets.forEach(element => element.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach(element => observer.observe(element));
}

/* -----------------------------
   Interactive feature selector
------------------------------ */
const featureContent = {
  photo: {
    kicker: '01 / PHOTO DIAGNOSIS',
    title: 'Mulai pemeriksaan dari sebuah foto.',
    description: 'Unggah foto bagian kendaraan yang ingin diperiksa. Dalam demo ini, Kamu dapat melihat alur unggah, pratinjau, dan contoh tampilan hasil analisis.',
    checks: ['Pratinjau foto sebelum dianalisis', 'Contoh indikasi dan rekomendasi awal', 'Alur lanjutan menuju pemeriksaan profesional'],
    image: 'https://images.pexels.com/photos/3806255/pexels-photo-3806255.jpeg?cs=srgb&dl=pexels-olly-3806255.jpg&fm=jpg',
    alt: 'Mekanik sedang memperbaiki ban sepeda motor',
    flow: 'Photo → Insight → Next step',
    href: 'diagnosis-foto.html'
  },
  sound: {
    kicker: '02 / ENGINE SOUND ANALYSIS',
    title: 'Dengarkan gejala yang terasa berbeda.',
    description: 'Rekam suara mesin sebagai informasi tambahan. Demo menyediakan perekaman dan pemutaran audio, sementara analisis suara otomatis belum diaktifkan.',
    checks: ['Perekaman suara melalui mikrofon', 'Pemutaran ulang hasil rekaman', 'Contoh ringkasan dan langkah lanjutan'],
    image: 'https://images.pexels.com/photos/8478265/pexels-photo-8478265.jpeg?cs=srgb&dl=pexels-19x14-8478265.jpg&fm=jpg',
    alt: 'Mekanik memeriksa ruang mesin mobil',
    flow: 'Record → Listen → Next step',
    href: 'analisis-suara.html'
  },
  cost: {
    kicker: '03 / REPAIR COST ESTIMATION',
    title: 'Siapkan gambaran biaya lebih awal.',
    description: 'Pilih jenis kendaraan dan kategori masalah untuk melihat kisaran biaya ilustratif. Angka hanya contoh kalkulator, bukan daftar harga bengkel.',
    checks: ['Pilihan jenis kendaraan dan masalah', 'Perhitungan kisaran biaya demo', 'Rincian ilustrasi jasa dan komponen'],
    image: 'https://images.pexels.com/photos/8478239/pexels-photo-8478239.jpeg?cs=srgb&dl=pexels-19x14-8478239.jpg&fm=jpg',
    alt: 'Mekanik memeriksa ruang mesin kendaraan',
    flow: 'Select → Estimate → Review',
    href: 'estimasi.html'
  },
  workshop: {
    kicker: '04 / WORKSHOP FINDER',
    title: 'Lanjutkan pemeriksaan bersama profesional.',
    description: 'Cari contoh penyedia layanan berdasarkan nama, jenis kendaraan, dan kategori layanan. Ketersediaan bisnis sungguhan memerlukan koneksi ke database mitra.',
    checks: ['Pencarian dan filter bengkel demo', 'Pratinjau informasi layanan', 'Persiapan untuk integrasi mitra bengkel'],
    image: 'https://images.pexels.com/photos/34710439/pexels-photo-34710439.jpeg?cs=srgb&dl=pexels-nguy-n-ti-n-th-nh-2150376175-34710439.jpg&fm=jpg',
    alt: 'Pengendara menggunakan ponsel di dekat sepeda motor',
    flow: 'Search → Compare → Contact',
    href: 'bengkel.html'
  }
};

function initFeatureTabs() {
  const tabs = $$('[data-feature-tab]');
  const detail = $('#featureDetail');
  if (!tabs.length || !detail) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.featureTab;
      const content = featureContent[key];
      if (!content) return;

      tabs.forEach(item => {
        const selected = item === tab;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-selected', String(selected));
      });

      detail.querySelector('.section-kicker').textContent = content.kicker;
      detail.querySelector('h3').textContent = content.title;
      detail.querySelector('.feature-detail-copy > p').textContent = content.description;
      const list = detail.querySelector('.check-list');
      list.replaceChildren();
      content.checks.forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        list.appendChild(li);
      });
      const image = detail.querySelector('.feature-detail-visual img');
      image.src = content.image;
      image.alt = content.alt;
      detail.querySelector('.detail-floating-label strong').textContent = content.flow;
      const featureLink = detail.querySelector('.text-link');
      if (featureLink) featureLink.href = content.href;
    });
  });
}

/* -----------------------------
   Demo workspace navigation
------------------------------ */
function initDemoNavigation() {
  const menuItems = $$('.demo-menu-item');
  const panels = $$('[data-demo-panel]');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.demoTarget;
      menuItems.forEach(menu => menu.classList.toggle('active', menu === item));
      panels.forEach(panel => {
        const active = panel.id === id;
        panel.hidden = !active;
        panel.classList.toggle('active', active);
      });
    });
  });
}

/* -----------------------------
   Photo upload and simulated result
------------------------------ */
function initPhotoDiagnosis() {
  const input = $('#photoInput');
  const zone = $('#uploadZone');
  const chooseButton = $('#choosePhotoBtn');
  const placeholder = $('#uploadPlaceholder');
  const previewWrap = $('#imagePreviewWrap');
  const previewImage = $('#imagePreview');
  const fileName = $('#previewFileName');
  const fileSize = $('#previewFileSize');
  const analyzeButton = $('#analyzePhotoBtn');
  const removeButton = $('#removePhotoBtn');
  const result = $('#photoResult');
  const resetButton = $('#resetPhotoBtn');

  if (!input || !zone) return;

  function clearPhoto() {
    if (appState.photoPreviewUrl) URL.revokeObjectURL(appState.photoPreviewUrl);
    appState.photoPreviewUrl = null;
    appState.photoFile = null;
    input.value = '';
    previewImage.removeAttribute('src');
    previewWrap.hidden = true;
    placeholder.hidden = false;
    analyzeButton.disabled = true;
    result.hidden = true;
  }

  function loadPhoto(file) {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Format belum didukung. Gunakan JPG, PNG, atau WEBP.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('Ukuran foto melebihi 8 MB. Pilih file yang lebih kecil.');
      return;
    }

    clearPhoto();
    appState.photoFile = file;
    appState.photoPreviewUrl = URL.createObjectURL(file);
    previewImage.src = appState.photoPreviewUrl;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    placeholder.hidden = true;
    previewWrap.hidden = false;
    analyzeButton.disabled = false;
    result.hidden = true;
  }

  chooseButton?.addEventListener('click', () => input.click());
  zone.addEventListener('click', event => {
    if (event.target.closest('button') || event.target.closest('.remove-file-btn')) return;
    if (!appState.photoFile) input.click();
  });
  input.addEventListener('change', event => loadPhoto(event.target.files?.[0]));

  ['dragenter', 'dragover'].forEach(eventName => {
    zone.addEventListener(eventName, event => {
      event.preventDefault();
      zone.classList.add('drag-over');
    });
  });
  ['dragleave', 'drop'].forEach(eventName => {
    zone.addEventListener(eventName, event => {
      event.preventDefault();
      zone.classList.remove('drag-over');
    });
  });
  zone.addEventListener('drop', event => loadPhoto(event.dataTransfer?.files?.[0]));
  removeButton?.addEventListener('click', clearPhoto);
  resetButton?.addEventListener('click', clearPhoto);

  analyzeButton?.addEventListener('click', () => {
    if (!appState.photoFile) return;
    analyzeButton.disabled = true;
    analyzeButton.textContent = 'Menyiapkan contoh hasil...';
    result.hidden = true;
    window.setTimeout(() => {
      result.hidden = false;
      analyzeButton.disabled = false;
      analyzeButton.innerHTML = 'Analisis selesai <span class="btn-arrow">✓</span>';
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      recordActivity('Simulasi diagnosis foto', `Contoh analisis untuk file ${appState.photoFile?.name || 'foto kendaraan'}.`);
      showToast('Contoh hasil demo sudah ditampilkan. Foto tidak dianalisis oleh AI.');
    }, 1150);
  });
}

/* -----------------------------
   Microphone recording
------------------------------ */
function initSoundRecorder() {
  const recordButton = $('#recordBtn');
  const stopButton = $('#stopRecordBtn');
  const analyzeButton = $('#analyzeSoundBtn');
  const clearButton = $('#clearSoundBtn');
  const status = $('#recorderStatus');
  const timeDisplay = $('#recordTime');
  const playback = $('#audioPlayback');
  const bars = $('#waveBars');
  const result = $('#soundResult');
  const footnote = $('#recorderFootnote');
  if (!recordButton || !stopButton) return;

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  function updateRecordClock() {
    if (!appState.recordingStartedAt) return;
    const elapsed = Math.floor((Date.now() - appState.recordingStartedAt) / 1000);
    appState.recordingElapsed = elapsed;
    timeDisplay.textContent = formatTime(elapsed);
  }

  function clearAudioState() {
    if (appState.audioUrl) URL.revokeObjectURL(appState.audioUrl);
    appState.audioUrl = null;
    appState.audioBlob = null;
    appState.audioChunks = [];
    playback.removeAttribute('src');
    playback.load();
    playback.hidden = true;
    analyzeButton.disabled = true;
    result.hidden = true;
    timeDisplay.textContent = '00:00';
    status.textContent = 'Siap merekam suara mesin';
    footnote.textContent = 'Browser akan meminta izin mikrofon. Gunakan HTTPS atau localhost agar akses mikrofon berfungsi.';
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      status.textContent = 'Perekaman tidak didukung browser ini.';
      footnote.textContent = 'Coba browser modern melalui HTTPS atau localhost. Kamu juga dapat mengembangkan opsi unggah file audio pada tahap berikutnya.';
      showToast('Browser belum mendukung perekaman audio.');
      return;
    }

    try {
      appState.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) options.mimeType = 'audio/webm;codecs=opus';
      else if (MediaRecorder.isTypeSupported('audio/mp4')) options.mimeType = 'audio/mp4';
      appState.mediaRecorder = new MediaRecorder(appState.audioStream, options);
      appState.audioChunks = [];
      appState.mediaRecorder.addEventListener('dataavailable', event => {
        if (event.data && event.data.size > 0) appState.audioChunks.push(event.data);
      });
      appState.mediaRecorder.addEventListener('stop', () => {
        const mimeType = appState.mediaRecorder?.mimeType || 'audio/webm';
        appState.audioBlob = new Blob(appState.audioChunks, { type: mimeType });
        window.dispatchEvent(new CustomEvent('bai:audio-ready', { detail: { blob: appState.audioBlob, durationSeconds: appState.recordingElapsed } }));
        appState.audioUrl = URL.createObjectURL(appState.audioBlob);
        playback.src = appState.audioUrl;
        playback.hidden = false;
        analyzeButton.disabled = false;
        status.textContent = 'Rekaman siap diputar';
        footnote.textContent = `Rekaman lokal tersedia (${formatFileSize(appState.audioBlob.size)}). Audio tidak diunggah ke server.`;
        appState.audioStream?.getTracks().forEach(track => track.stop());
        appState.audioStream = null;
      });

      appState.mediaRecorder.start();
      appState.recordingStartedAt = Date.now();
      appState.recordingElapsed = 0;
      appState.recordingTimer = window.setInterval(updateRecordClock, 250);
      recordButton.disabled = true;
      stopButton.disabled = false;
      analyzeButton.disabled = true;
      clearButton.disabled = true;
      playback.hidden = true;
      result.hidden = true;
      status.textContent = 'Sedang merekam...';
      footnote.textContent = 'Jaga perangkat dekat sumber suara, tetapi hindari merekam terlalu dekat dengan bagian yang bergerak.';
      bars.classList.add('recording');
    } catch (error) {
      console.error('Microphone permission error:', error);
      status.textContent = 'Mikrofon belum dapat diakses.';
      footnote.textContent = 'Periksa izin mikrofon pada browser dan pastikan halaman dijalankan melalui HTTPS atau localhost.';
      showToast('Akses mikrofon ditolak atau tidak tersedia.');
    }
  }

  function stopRecording() {
    if (appState.recordingTimer) window.clearInterval(appState.recordingTimer);
    appState.recordingTimer = null;
    appState.recordingStartedAt = null;
    if (appState.mediaRecorder && appState.mediaRecorder.state !== 'inactive') appState.mediaRecorder.stop();
    recordButton.disabled = false;
    stopButton.disabled = true;
    clearButton.disabled = false;
    bars.classList.remove('recording');
  }

  recordButton.addEventListener('click', startRecording);
  stopButton.addEventListener('click', stopRecording);
  clearButton.addEventListener('click', () => {
    if (appState.mediaRecorder && appState.mediaRecorder.state !== 'inactive') stopRecording();
    if (appState.audioStream) appState.audioStream.getTracks().forEach(track => track.stop());
    clearAudioState();
    showToast('Rekaman demo telah dihapus dari halaman.');
  });

  analyzeButton.addEventListener('click', () => {
    if (!appState.audioBlob) return;
    analyzeButton.disabled = true;
    analyzeButton.textContent = 'Menyiapkan contoh hasil...';
    window.setTimeout(() => {
      result.hidden = false;
      analyzeButton.disabled = false;
      analyzeButton.textContent = 'Contoh hasil ditampilkan';
      showToast('Ini hanya simulasi. Audio belum diproses oleh model AI.');
    }, 1000);
  });

  window.addEventListener('beforeunload', () => {
    if (appState.recordingTimer) window.clearInterval(appState.recordingTimer);
    appState.audioStream?.getTracks().forEach(track => track.stop());
    if (appState.audioUrl) URL.revokeObjectURL(appState.audioUrl);
  });
}

/* -----------------------------
   Cost estimation calculator
------------------------------ */
function initEstimator() {
  const form = $('#estimatorForm');
  if (!form) return;
  const result = $('#estimateResult');
  const range = $('#estimateRange');
  const explanation = $('#estimateExplanation');
  const laborEl = $('#laborEstimate');
  const partEl = $('#partEstimate');

  // These values are illustrative and intentionally labelled as demo data.
  const baseRanges = {
    motor: {
      battery: [120000, 450000], brake: [80000, 380000], tire: [90000, 420000],
      engine: [180000, 950000], suspension: [140000, 650000], service: [80000, 300000]
    },
    car: {
      battery: [350000, 1500000], brake: [180000, 1200000], tire: [450000, 1800000],
      engine: [400000, 2800000], suspension: [350000, 2200000], service: [250000, 1100000]
    }
  };
  const labels = {
    battery: 'aki atau kelistrikan', brake: 'sistem rem', tire: 'ban',
    engine: 'mesin', suspension: 'suspensi', service: 'servis berkala'
  };
  const severityMultiplier = { unknown: 1, light: .8, medium: 1.25, heavy: 1.7 };
  const severityLabels = { unknown: 'belum diketahui', light: 'ringan', medium: 'sedang', heavy: 'berat' };

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const vehicle = $('#vehicleType').value;
    const category = $('#problemCategory').value;
    const severity = $('#problemSeverity').value;
    const area = $('#estimateArea').value.trim();
    const base = baseRanges[vehicle][category];
    const multiplier = severityMultiplier[severity];
    const min = Math.round((base[0] * multiplier) / 10000) * 10000;
    const max = Math.round((base[1] * multiplier) / 10000) * 10000;
    const labor = Math.round(((min + max) * .34 / 2) / 10000) * 10000;
    const parts = Math.max(0, Math.round(((min + max) * .66 / 2) / 10000) * 10000);

    range.textContent = `${formatRupiah(min)} – ${formatRupiah(max)}`;
    explanation.textContent = `Contoh kisaran untuk ${labels[category]} pada ${vehicle === 'motor' ? 'sepeda motor' : 'mobil'} dengan kondisi ${severityLabels[severity]}${area ? ` di area ${area}` : ''}.`;
    laborEl.textContent = formatRupiah(labor);
    partEl.textContent = formatRupiah(parts);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    recordActivity('Estimasi biaya dihitung', `Kisaran ${formatRupiah(min)} hingga ${formatRupiah(max)} untuk ${labels[category]}.`);
    showToast('Kisaran simulasi berhasil dihitung. Bukan harga resmi bengkel.');
  });
}

/* -----------------------------
   Workshop search and filters
------------------------------ */
function initWorkshopFinder() {
  const search = $('#workshopSearch');
  const typeFilter = $('#workshopTypeFilter');
  const serviceFilter = $('#workshopServiceFilter');
  const cards = $$('.workshop-card');
  const empty = $('#workshopEmpty');
  if (!search || !typeFilter || !serviceFilter) return;

  function filterCards() {
    const term = search.value.toLowerCase().trim();
    const type = typeFilter.value;
    const service = serviceFilter.value;
    let visible = 0;

    cards.forEach(card => {
      const name = card.dataset.name.toLowerCase();
      const text = card.textContent.toLowerCase();
      const types = card.dataset.type;
      const services = card.dataset.services.split(',');
      const matchesText = !term || name.includes(term) || text.includes(term);
      const matchesType = type === 'all' || types === type || types === 'both' || type === 'both' && types === 'both';
      const matchesService = service === 'all' || services.includes(service);
      const show = matchesText && matchesType && matchesService;
      card.hidden = !show;
      if (show) visible += 1;
    });
    empty.hidden = visible > 0;
  }

  [search, typeFilter, serviceFilter].forEach(control => {
    control.addEventListener(control === search ? 'input' : 'change', filterCards);
  });
}

/* -----------------------------
   Modal handling
------------------------------ */
function openModal(modal) {
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add('modal-open');
  const closeButton = $('.modal-close', modal);
  closeButton?.focus();
}

function closeModal(modal) {
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function initModals() {
  const dashboard = $('#dashboardModal');
  const workshopModal = $('#workshopModal');

  $$('[data-open-dashboard]').forEach(button => button.addEventListener('click', () => openModal(dashboard)));
  $$('[data-close-dashboard]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    closeModal(dashboard);
    if (button.tagName === 'A') window.location.hash = button.getAttribute('href');
  }));

  $$('[data-close-workshop]').forEach(button => button.addEventListener('click', () => closeModal(workshopModal)));

  $$('.workshop-detail-btn').forEach(button => {
    button.addEventListener('click', () => {
      const title = button.dataset.workshop || 'Bengkel Demo';
      $('#workshopModalTitle').textContent = title;
      $('#workshopModalDescription').textContent = `${title} merupakan contoh profil bengkel yang dipakai untuk memperagakan tampilan detail layanan. Informasi ini tidak merepresentasikan bisnis nyata.`;
      openModal(workshopModal);
    });
  });

  [dashboard, workshopModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal(modal);
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (dashboard && !dashboard.hidden) closeModal(dashboard);
    if (workshopModal && !workshopModal.hidden) closeModal(workshopModal);
  });
}

/* -----------------------------
   Request form (demo only)
------------------------------ */
function initMechanicForm() {
  const form = $('#mechanicForm');
  const feedback = $('#mechanicFeedback');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const vehicle = String(data.get('vehicle') || '').trim();
    const location = String(data.get('location') || '').trim();
    const message = `Permintaan demo untuk ${vehicle.toLowerCase()} atas nama ${name} telah dibuat secara lokal. Lokasi: ${location}. Tidak ada mekanik yang dihubungi dan data tidak dikirim ke server.`;
    showFormFeedback(feedback, message);
    recordActivity('Permintaan mekanik demo', `Permintaan untuk ${vehicle} di ${location}.`);
    form.reset();
    showToast('Permintaan demo berhasil dibuat di halaman ini.');
  });
}

/* -----------------------------
   Contact form (demo only)
------------------------------ */
function initContactForm() {
  const form = $('#contactForm');
  const feedback = $('#contactFeedback');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const name = String(new FormData(form).get('contactName') || '').trim();
    showFormFeedback(feedback, `Terima kasih, ${name}. Pesan demo berhasil diproses di browser. Belum ada email atau server yang menerima pesan ini.`);
    recordActivity('Formulir kontak dikirim', `Pesan demo dari ${name}.`);
    form.reset();
    showToast('Pesan demo sudah diproses secara lokal.');
  });
}

/* -----------------------------
   Handle missing external images
------------------------------ */
function initImageFallbacks() {
  $$('img').forEach(image => {
    image.addEventListener('error', () => {
      image.classList.add('image-load-error');
      image.alt = image.alt || 'Gambar tidak dapat dimuat';
      const parent = image.parentElement;
      if (parent) parent.classList.add('image-fallback-active');
    }, { once: true });
  });
}

/* -----------------------------
   Initialisation
------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  setCurrentYear();
  initHeader();
  initReveal();
  initFeatureTabs();
  initDemoNavigation();
  initPhotoDiagnosis();
  initSoundRecorder();
  initEstimator();
  initWorkshopFinder();
  initModals();
  initMechanicForm();
  initContactForm();
  initImageFallbacks();
  initGarage();
  initReminders();
  initHistoryPage();
  initPageTransitions();
});

/* -----------------------------
   Persistent demo workspace: garage, reminders and activity history
------------------------------ */
const STORAGE_KEYS = { vehicles: 'bengkelinai_vehicles_v2', reminders: 'bengkelinai_reminders_v2', history: 'bengkelinai_history_v2' };
function readStore(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function writeStore(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { showToast('Penyimpanan browser tidak tersedia.'); return false; } }
function escapeHTML(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function recordActivity(title, description) {
  const history = readStore(STORAGE_KEYS.history);
  history.unshift({ id: Date.now(), title, description, date: new Date().toISOString() });
  writeStore(STORAGE_KEYS.history, history.slice(0, 60));
}
function renderVehicles() {
  const list = $('#vehicleList'); if (!list) return;
  const items = readStore(STORAGE_KEYS.vehicles);
  if (!items.length) { list.innerHTML = '<div class="empty-state"><span>▱</span><h3>Garasi masih kosong</h3><p>Tambahkan kendaraan pertamamu melalui formulir.</p></div>'; return; }
  list.innerHTML = items.map(v => `<article class="vehicle-card"><span class="vehicle-card-icon">${v.type === 'Mobil' ? '▰' : '◉'}</span><div><h3>${escapeHTML(v.brand)} ${escapeHTML(v.model)}</h3><p>${escapeHTML(v.type)} · ${escapeHTML(v.year)}${v.plate ? ' · ' + escapeHTML(v.plate) : ''}</p><span class="card-meta">Odometer: ${v.odometer ? Number(v.odometer).toLocaleString('id-ID') + ' km' : 'Belum diisi'}</span></div><button class="card-remove" type="button" data-remove-vehicle="${v.id}" aria-label="Hapus kendaraan">Hapus</button></article>`).join('');
  $$('[data-remove-vehicle]').forEach(btn => btn.addEventListener('click', () => { writeStore(STORAGE_KEYS.vehicles, readStore(STORAGE_KEYS.vehicles).filter(v => String(v.id) !== btn.dataset.removeVehicle)); renderVehicles(); showToast('Kendaraan dihapus dari garasi.'); }));
}
function initGarage() {
  const form = $('#vehicleForm'); if (!form) return; renderVehicles();
  form.addEventListener('submit', e => { e.preventDefault(); if (!form.reportValidity()) return; const d = Object.fromEntries(new FormData(form)); const items = readStore(STORAGE_KEYS.vehicles); items.push({ ...d, id: Date.now() }); writeStore(STORAGE_KEYS.vehicles, items); recordActivity('Kendaraan ditambahkan', `${d.brand} ${d.model} ditambahkan ke Garasi Saya.`); form.reset(); renderVehicles(); showFormFeedback($('#vehicleFeedback'), 'Kendaraan berhasil disimpan di browser ini.'); showToast('Kendaraan masuk ke Garasi Saya.'); });
}
function renderReminders() {
  const list = $('#reminderList'); if (!list) return; const items = readStore(STORAGE_KEYS.reminders).sort((a,b) => a.date.localeCompare(b.date));
  if (!items.length) { list.innerHTML = '<div class="empty-state"><span>◷</span><h3>Belum ada pengingat</h3><p>Buat jadwal perawatan pertama untuk mulai mengatur kendaraanmu.</p></div>'; return; }
  list.innerHTML = items.map(r => `<article class="reminder-card"><span class="reminder-card-icon">◷</span><div><h3>${escapeHTML(r.task)}</h3><p>${escapeHTML(r.vehicle)}${r.note ? ' · ' + escapeHTML(r.note) : ''}</p><time>${new Date(r.date + 'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</time></div><button class="card-remove" type="button" data-remove-reminder="${r.id}">Hapus</button></article>`).join('');
  $$('[data-remove-reminder]').forEach(btn => btn.addEventListener('click', () => { writeStore(STORAGE_KEYS.reminders, readStore(STORAGE_KEYS.reminders).filter(r => String(r.id) !== btn.dataset.removeReminder)); renderReminders(); showToast('Pengingat dihapus.'); }));
}
function initReminders() {
  const form = $('#reminderForm'); renderReminders(); if (!form) return;
  const dateInput = form.querySelector('[name="date"]'); if (dateInput) dateInput.min = new Date().toISOString().slice(0,10);
  form.addEventListener('submit', e => { e.preventDefault(); if (!form.reportValidity()) return; const d = Object.fromEntries(new FormData(form)); const items = readStore(STORAGE_KEYS.reminders); items.push({...d,id:Date.now()}); writeStore(STORAGE_KEYS.reminders,items); recordActivity('Pengingat servis dibuat', `${d.task} untuk ${d.vehicle}.`); form.reset(); renderReminders(); showFormFeedback($('#reminderFeedback'),'Pengingat tersimpan di browser ini.'); showToast('Pengingat servis berhasil dibuat.'); });
}
function initHistoryPage() {
  const list = $('#activityList'); if (!list) return;
  const render = () => { const items = readStore(STORAGE_KEYS.history); if (!items.length) { list.innerHTML = '<div class="empty-state"><span>◷</span><h3>Belum ada aktivitas</h3><p>Coba fitur estimasi, diagnosis, atau formulir layanan untuk membuat catatan demo.</p><a class="btn btn-primary" href="fitur.html">Jelajahi fitur</a></div>'; return; } list.innerHTML = items.map(a => `<article class="activity-card"><span class="activity-card-icon">↗</span><div><h3>${escapeHTML(a.title)}</h3><p>${escapeHTML(a.description)}</p><time>${new Date(a.date).toLocaleString('id-ID')}</time></div></article>`).join(''); };
  render(); $('#clearHistory')?.addEventListener('click', () => { writeStore(STORAGE_KEYS.history,[]); render(); showToast('Riwayat lokal telah dihapus.'); });
}
function initPageTransitions() {
  // Native cross-document View Transitions are enabled in supporting browsers via CSS.
  // For other browsers, a subtle fade is applied before same-site HTML navigation.
  if (document.startViewTransition) return;
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]'); if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href); if (url.origin !== location.origin || !url.pathname.endsWith('.html') || url.pathname === location.pathname) return;
    event.preventDefault(); document.body.classList.add('page-leaving'); window.setTimeout(() => { location.href = url.href; }, 110);
  });
}
