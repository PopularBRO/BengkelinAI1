/* ============================================================
   BENGKELINAI STANDALONE CHAT ASSISTANT
   Current mode: structured simulation (no generative AI API).
   Signed-in conversations: Supabase tables via RLS.
   Guest conversations: browser localStorage.
   ============================================================ */
(function () {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const STORAGE_KEY = 'bengkelinai_assistant_chats_v1';
  const CONTEXT_KEY = 'bengkelinai_assistant_vehicle_context_v1';
  const MAX_LOCAL_CONVERSATIONS = 30;
  const MAX_MESSAGES = 160;

  const state = {
    client: null,
    user: null,
    activeId: null,
    activeSource: 'local',
    conversations: [],
    messages: [],
    context: {},
    sending: false,
    cloudReady: false
  };

  function readLocal() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.warn('Chat local history could not be read:', error);
      return [];
    }
  }

  function writeLocal(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_LOCAL_CONVERSATIONS)));
      return true;
    } catch (error) {
      setStatus('Penyimpanan browser penuh atau tidak tersedia. Riwayat lokal tidak dapat disimpan.', 'warning');
      return false;
    }
  }

  function readContext() {
    try {
      return JSON.parse(localStorage.getItem(CONTEXT_KEY) || '{}') || {};
    } catch { return {}; }
  }

  function saveContextLocal() {
    state.context = {
      vehicle_type: $('#contextVehicleType')?.value || 'motorcycle',
      brand: $('#contextBrand')?.value.trim() || '',
      model: $('#contextModel')?.value.trim() || '',
      year: $('#contextYear')?.value ? Number($('#contextYear').value) : null,
      odometer_km: $('#contextOdometer')?.value ? Number($('#contextOdometer').value) : null
    };
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(state.context));
  }

  function loadContextIntoForm() {
    state.context = readContext();
    if ($('#contextVehicleType')) $('#contextVehicleType').value = state.context.vehicle_type || 'motorcycle';
    if ($('#contextBrand')) $('#contextBrand').value = state.context.brand || '';
    if ($('#contextModel')) $('#contextModel').value = state.context.model || '';
    if ($('#contextYear')) $('#contextYear').value = state.context.year || '';
    if ($('#contextOdometer')) $('#contextOdometer').value = state.context.odometer_km || '';
  }

  function setStatus(message, tone = 'normal') {
    const status = $('#contextSaveNote');
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function escapeText(text) {
    return String(text ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function nowIso() { return new Date().toISOString(); }
  function makeId() {
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  function shortTitle(text) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    return clean.length > 42 ? `${clean.slice(0, 42)}…` : (clean || 'Percakapan baru');
  }
  function formatTime(value) {
    try { return new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  }

  function contextSummary(context = state.context) {
    const type = context.vehicle_type === 'car' ? 'Mobil' : 'Sepeda motor';
    const vehicle = [context.brand, context.model].filter(Boolean).join(' ');
    const year = context.year ? `tahun ${context.year}` : '';
    const odo = context.odometer_km ? `${Number(context.odometer_km).toLocaleString('id-ID')} km` : '';
    const details = [vehicle, year, odo].filter(Boolean).join(', ');
    return details ? `${type}: ${details}` : type;
  }

  function createMessageElement(message) {
    const wrapper = document.createElement('article');
    wrapper.className = `assistant-message ${message.role === 'user' ? 'user' : 'bot'}`;
    const avatar = document.createElement('span');
    avatar.className = 'assistant-message-avatar';
    if (message.role === 'user') {
      avatar.textContent = 'K';
      avatar.setAttribute('aria-label', 'Kamu');
    } else {
      const img = document.createElement('img');
      img.src = 'assets/logo-bengkelinai.png';
      img.alt = '';
      avatar.appendChild(img);
    }
    const content = document.createElement('div');
    content.className = 'assistant-message-content';
    const meta = document.createElement('div');
    meta.className = 'assistant-message-meta';
    const name = document.createElement('strong');
    name.textContent = message.role === 'user' ? 'Kamu' : 'Asisten BengkelinAI';
    const time = document.createElement('time');
    time.textContent = formatTime(message.created_at || nowIso());
    meta.append(name, time);
    const bubble = document.createElement('div');
    bubble.className = 'assistant-message-bubble';
    bubble.textContent = message.content || '';
    content.append(meta, bubble);
    if (message.role === 'assistant') {
      const actions = document.createElement('div');
      actions.className = 'assistant-message-actions';
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.textContent = 'Salin jawaban';
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(message.content || '');
          setStatus('Jawaban berhasil disalin.');
        } catch { setStatus('Browser tidak mengizinkan salin otomatis.'); }
      });
      actions.appendChild(copy);
      content.appendChild(actions);
    }
    wrapper.append(avatar, content);
    return wrapper;
  }

  function scrollMessages() {
    const area = $('#chatMessages');
    if (area) area.scrollTop = area.scrollHeight;
  }

  function renderMessages() {
    const area = $('#chatMessages');
    if (!area) return;
    area.innerHTML = '';
    if (!state.messages.length) {
      area.innerHTML = `
        <div class="assistant-welcome" id="chatWelcome">
          <span class="assistant-welcome-mark">✳</span>
          <span class="assistant-overline">SELAMAT DATANG DI BENGKELINAI</span>
          <h3>Ada yang terasa berbeda pada kendaraanmu?</h3>
          <p>Ceritakan gejalanya dengan bahasa sehari-hari. Tidak perlu tahu nama komponen atau istilah teknisnya.</p>
          <div class="assistant-prompt-grid">
            <button type="button" class="assistant-prompt-card" data-prompt="Mesin kendaraan saya sulit dinyalakan, terutama saat pagi hari."><span>◉</span><strong>Mesin sulit dinyalakan</strong><small>Starter, aki, atau pengapian</small></button>
            <button type="button" class="assistant-prompt-card" data-prompt="Rem terasa kurang pakem dan jarak pengereman lebih panjang."><span>⌁</span><strong>Rem terasa kurang pakem</strong><small>Pedal, kampas, atau sistem hidrolik</small></button>
            <button type="button" class="assistant-prompt-card" data-prompt="Ada suara berdecit atau bunyi aneh saat kendaraan berjalan."><span>♫</span><strong>Muncul suara aneh</strong><small>Lokasi dan kondisi saat bunyi muncul</small></button>
            <button type="button" class="assistant-prompt-card" data-prompt="Suhu mesin naik lebih tinggi dari biasanya."><span>♨</span><strong>Suhu mesin meningkat</strong><small>Sistem pendingin dan tanda bahaya</small></button>
          </div>
        </div>`;
    } else {
      state.messages.forEach(message => area.appendChild(createMessageElement(message)));
    }
    scrollMessages();
  }

  function renderHistory() {
    const list = $('#chatHistoryList');
    if (!list) return;
    list.innerHTML = '';
    if (!state.conversations.length) {
      const empty = document.createElement('div');
      empty.className = 'assistant-history-empty';
      empty.textContent = 'Belum ada percakapan. Mulai chat pertamamu.';
      list.appendChild(empty);
      return;
    }
    state.conversations.forEach(conversation => {
      const row = document.createElement('div');
      row.className = `assistant-history-item${conversation.id === state.activeId ? ' active' : ''}`;
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'assistant-history-open';
      const title = document.createElement('strong');
      title.textContent = conversation.title || 'Percakapan baru';
      const stamp = document.createElement('small');
      stamp.textContent = formatTime(conversation.updated_at || conversation.created_at);
      open.append(title, stamp);
      open.addEventListener('click', () => openConversation(conversation.id));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'assistant-history-delete';
      remove.title = 'Hapus percakapan';
      remove.setAttribute('aria-label', `Hapus ${conversation.title || 'percakapan'}`);
      remove.textContent = '×';
      remove.addEventListener('click', event => {
        event.stopPropagation();
        deleteConversation(conversation.id);
      });
      row.append(open, remove);
      list.appendChild(row);
    });
  }

  function renderTyping() {
    removeTyping();
    const area = $('#chatMessages');
    if (!area) return;
    const row = document.createElement('article');
    row.id = 'assistantTypingRow';
    row.className = 'assistant-message bot';
    const avatar = document.createElement('span');
    avatar.className = 'assistant-message-avatar';
    const img = document.createElement('img'); img.src = 'assets/logo-bengkelinai.png'; img.alt = '';
    avatar.appendChild(img);
    const content = document.createElement('div'); content.className = 'assistant-message-content';
    const meta = document.createElement('div'); meta.className = 'assistant-message-meta'; meta.textContent = 'Asisten BengkelinAI sedang menyusun panduan';
    const bubble = document.createElement('div'); bubble.className = 'assistant-message-bubble';
    bubble.innerHTML = '<span class="assistant-typing" aria-label="Sedang mengetik"><span></span><span></span><span></span></span>';
    content.append(meta, bubble); row.append(avatar, content); area.appendChild(row); scrollMessages();
  }
  function removeTyping() { $('#assistantTypingRow')?.remove(); }

  function createLocalConversation() {
    const conversation = {
      id: makeId(), title: 'Percakapan baru', created_at: nowIso(), updated_at: nowIso(),
      vehicle_context: { ...state.context }, messages: []
    };
    const items = readLocal();
    items.unshift(conversation);
    writeLocal(items);
    state.conversations = readLocal();
    state.activeId = conversation.id;
    state.activeSource = 'local';
    state.messages = [];
    renderHistory(); renderMessages();
    return conversation;
  }

  async function createCloudConversation(firstMessage = '') {
    const { data, error } = await state.client.from('chat_conversations').insert({
      user_id: state.user.id,
      title: shortTitle(firstMessage),
      vehicle_context: { ...state.context }
    }).select('id,title,vehicle_context,created_at,updated_at').single();
    if (error) throw error;
    state.activeId = data.id;
    state.activeSource = 'cloud';
    state.conversations.unshift(data);
    renderHistory();
    return data;
  }

  async function ensureActiveConversation(firstMessage = '') {
    if (state.activeId) return state.activeId;
    if (state.user && state.client && state.cloudReady) {
      await createCloudConversation(firstMessage);
      return state.activeId;
    }
    createLocalConversation();
    return state.activeId;
  }

  async function persistMessage(role, content) {
    const createdAt = nowIso();
    const message = { id: makeId(), role, content, created_at: createdAt };
    if (state.user && state.client && state.cloudReady) {
      try {
        await ensureActiveConversation(role === 'user' ? content : '');
        const { error } = await state.client.from('chat_messages').insert({
          conversation_id: state.activeId,
          user_id: state.user.id,
          role,
          content,
          mode: 'simulation'
        });
        if (error) throw error;
        if (role === 'user') {
          const title = shortTitle(content);
          await state.client.from('chat_conversations').update({ title, vehicle_context: { ...state.context } }).eq('id', state.activeId).eq('user_id', state.user.id);
          const current = state.conversations.find(item => item.id === state.activeId);
          if (current) { current.title = title; current.updated_at = createdAt; }
          renderHistory();
        }
        state.messages.push(message);
        return message;
      } catch (error) {
        console.warn('Cloud chat persistence unavailable:', error);
        state.cloudReady = false;
        setStatus('Riwayat cloud belum tersedia. Percakapan ini sementara disimpan di browser. Jalankan migration chatbot di Supabase untuk sinkronisasi akun.', 'warning');
        state.activeId = null;
        state.activeSource = 'local';
      }
    }
    if (!state.activeId || state.activeSource !== 'local') createLocalConversation();
    const items = readLocal();
    let conversation = items.find(item => item.id === state.activeId);
    if (!conversation) {
      conversation = { id: state.activeId || makeId(), title: 'Percakapan baru', created_at: createdAt, updated_at: createdAt, vehicle_context: { ...state.context }, messages: [] };
      state.activeId = conversation.id;
      items.unshift(conversation);
    }
    conversation.messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    conversation.messages.push(message);
    conversation.updated_at = createdAt;
    if (role === 'user' && conversation.title === 'Percakapan baru') conversation.title = shortTitle(content);
    conversation.vehicle_context = { ...state.context };
    writeLocal(items);
    state.messages.push(message);
    state.conversations = readLocal();
    renderHistory();
    return message;
  }

  async function loadCloudConversations() {
    const { data, error } = await state.client.from('chat_conversations')
      .select('id,title,vehicle_context,created_at,updated_at')
      .eq('user_id', state.user.id)
      .order('updated_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    state.conversations = data || [];
    state.activeId = state.conversations[0]?.id || null;
    state.activeSource = 'cloud';
    renderHistory();
    if (state.activeId) await openCloudConversation(state.activeId);
    else { state.messages = []; renderMessages(); }
  }

  async function openCloudConversation(id) {
    const { data, error } = await state.client.from('chat_messages')
      .select('id,role,content,created_at')
      .eq('conversation_id', id)
      .eq('user_id', state.user.id)
      .order('created_at', { ascending: true })
      .limit(MAX_MESSAGES);
    if (error) throw error;
    state.activeId = id;
    state.activeSource = 'cloud';
    state.messages = data || [];
    const selected = state.conversations.find(item => item.id === id);
    if (selected?.vehicle_context) {
      state.context = { ...state.context, ...selected.vehicle_context };
      applyContextToControls();
    }
    renderHistory(); renderMessages();
  }

  async function openConversation(id) {
    const conversation = state.conversations.find(item => item.id === id);
    if (!conversation) return;
    try {
      if (state.activeSource === 'cloud' || (state.user && state.client && state.cloudReady && !String(id).startsWith('local-'))) {
        await openCloudConversation(id);
      } else {
        const localConversation = readLocal().find(item => item.id === id);
        if (!localConversation) return;
        state.activeId = id;
        state.activeSource = 'local';
        state.messages = localConversation.messages || [];
        state.context = { ...state.context, ...(localConversation.vehicle_context || {}) };
        applyContextToControls();
        renderHistory(); renderMessages();
      }
    } catch (error) {
      console.error('Could not open conversation:', error);
      setStatus('Percakapan gagal dibuka. Periksa koneksi database.', 'warning');
    }
  }

  async function deleteConversation(id) {
    if (!window.confirm('Hapus percakapan ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      const isCloud = state.user && state.client && !String(id).startsWith('local-') && state.conversations.some(item => item.id === id);
      if (isCloud) {
        const { error } = await state.client.from('chat_conversations').delete().eq('id', id).eq('user_id', state.user.id);
        if (error) throw error;
      } else {
        writeLocal(readLocal().filter(item => item.id !== id));
      }
      if (state.activeId === id) { state.activeId = null; state.messages = []; }
      await reloadHistory();
      renderMessages();
    } catch (error) {
      console.error('Delete conversation:', error);
      setStatus(error.message || 'Percakapan gagal dihapus.', 'warning');
    }
  }

  async function reloadHistory() {
    if (state.user && state.client && state.cloudReady) {
      await loadCloudConversations();
    } else {
      state.conversations = readLocal();
      if (state.activeId) {
        const current = state.conversations.find(item => item.id === state.activeId);
        if (current) state.messages = current.messages || [];
      }
      renderHistory(); renderMessages();
    }
  }

  function applyContextToControls() {
    if ($('#contextVehicleType')) $('#contextVehicleType').value = state.context.vehicle_type || 'motorcycle';
    if ($('#contextBrand')) $('#contextBrand').value = state.context.brand || '';
    if ($('#contextModel')) $('#contextModel').value = state.context.model || '';
    if ($('#contextYear')) $('#contextYear').value = state.context.year || '';
    if ($('#contextOdometer')) $('#contextOdometer').value = state.context.odometer_km || '';
  }

  function classifyIssue(text) {
    const value = text.toLowerCase();
    const has = pattern => pattern.test(value);
    if (has(/rem|kampas|pedal rem|minyak rem|cakram|disc brake|abs|ngerem/)) return 'brake';
    if (has(/overheat|panas|suhu mesin|radiator|coolant|air radiator|temperatur mesin/)) return 'cooling';
    if (has(/ban|roda|velg|pelek|bocor|benjol|kempes|getar.*setir/)) return 'tyre';
    if (has(/aki|accu|baterai|starter|kelistrikan|lampu redup|tidak bisa hidup|susah hidup|sulit dinyalakan|sulit distarter/)) return 'electrical';
    if (has(/oli|asap knalpot|mesin kasar|ketukan mesin|ngelitik|brebet|tenaga turun|tenaga hilang|mesin mati|suara mesin/)) return 'engine';
    if (has(/transmisi|kopling|gigi|cvt|v-belt|belt cvt|roller|selip/)) return 'transmission';
    if (has(/suspensi|shock|shockbreaker|bunyi kaki|kaki-kaki|setir|kemudi/)) return 'suspension';
    if (has(/ac | ac\b|air conditioner|pendingin kabin|blower|freon/)) return 'ac';
    if (has(/servis|service|oli rutin|perawatan|berkala/)) return 'maintenance';
    return 'general';
  }

  function generateSimulatedReply(text) {
    const category = classifyIssue(text);
    const context = contextSummary();
    const safety = /asap tebal|bau bensin|bau bahan bakar|api|terbakar|rem blong|pedal rem amblas|setir tidak stabil|ban benjol|ban pecah|lampu oli menyala|tekanan oli|overheat parah|mesin sangat panas/i.test(text);

    const replies = {
      brake: `Dari ceritamu, area yang perlu diprioritaskan adalah sistem pengereman. Ini belum memastikan komponen tertentu rusak.\n\nArea pemeriksaan yang relevan:\n• Kampas rem depan dan belakang: ketebalan, keausan tidak merata, atau kontaminasi.\n• Cakram atau tromol: permukaan, ketebalan, dan kemungkinan perubahan bentuk.\n• Kaliper, piston, dan pin geser: gerak macet atau kebocoran.\n• Minyak rem dan selang: level, kondisi cairan, serta kebocoran.\n• Master silinder dan booster (untuk mobil): tekanan dan respons pedal.\n\nPertanyaan klarifikasi:\n1. Rem terasa kurang pakem di roda depan, belakang, atau keduanya?\n2. Pedal atau tuas terasa amblas, terlalu dalam, bergetar, atau hanya perlu ditekan lebih kuat?\n3. Apakah ada bunyi gesekan atau lampu ABS menyala?\n\nKarena ini menyangkut keselamatan, hentikan penggunaan kendaraan bila pengereman menurun, pedal amblas, atau ada kebocoran. Minta bantuan bengkel atau towing; jangan menguji rem dengan berkendara di jalan.`,
      cooling: `Gejala yang Kamu ceritakan mengarah ke area sistem pendingin yang perlu diperiksa. Penyebab pastinya belum bisa dipastikan dari chat.\n\nArea pemeriksaan:\n• Level dan kondisi coolant atau cairan radiator.\n• Kipas radiator dan sekring/relay kipas.\n• Radiator, selang, dan sambungan untuk kebocoran atau sumbatan.\n• Thermostat dan water pump.\n• Tutup radiator atau reservoir sesuai spesifikasi kendaraan.\n\nPertanyaan klarifikasi:\n1. Indikator suhu naik saat macet, jalan jauh, atau setiap saat?\n2. Ada cairan menetes atau uap dari ruang mesin?\n3. Kipas radiator terdengar menyala?\n\nJika suhu sudah melewati batas normal atau muncul peringatan overheat, berhenti di tempat aman dan matikan mesin. Jangan membuka tutup radiator saat panas karena cairan bertekanan dapat menyembur dan menyebabkan luka bakar.`,
      tyre: `Kita perlu memperhatikan ban, roda, dan komponen yang berkaitan. Kondisi ban dapat memengaruhi kendali kendaraan.\n\nArea pemeriksaan:\n• Tekanan ban saat dingin sesuai rekomendasi pabrikan.\n• Tapak ban: kedalaman, benda asing, retak, atau aus tidak merata.\n• Dinding samping ban: benjolan, sobekan, atau kerusakan.\n• Velg, bearing roda, dan baut roda.\n• Spooring dan balancing bila ada getaran atau kendaraan menarik ke satu sisi.\n\nPertanyaan klarifikasi:\n1. Getaran terasa pada setir, jok, atau seluruh kendaraan?\n2. Muncul pada kecepatan tertentu atau sejak mulai berjalan?\n3. Ada benjolan, sobekan, atau tekanan ban cepat berkurang?\n\nJika ban benjol, sobek, kempis berat, atau kendaraan sulit dikendalikan, jangan lanjut berkendara. Gunakan ban cadangan sesuai prosedur atau hubungi bantuan.`,
      electrical: `Gejala tersebut dapat berkaitan dengan suplai listrik, sistem starter, atau pengisian daya. Belum tentu aki yang menjadi penyebabnya.\n\nArea pemeriksaan:\n• Kondisi aki: usia, terminal, korosi, dan tegangan saat diam.\n• Sistem pengisian: alternator/regulator dan tegangan saat mesin hidup.\n• Rangkaian starter: relay, motor starter, kabel, dan konektor.\n• Sekring, ground, dan sambungan kabel.\n• Sistem pengapian atau sensor bila mesin berputar tetapi tidak menyala.\n\nPertanyaan klarifikasi:\n1. Saat tombol starter ditekan, apakah terdengar klik, starter berputar lambat, atau tidak ada respons?\n2. Lampu panel meredup ketika starter ditekan?\n3. Masalah muncul setelah kendaraan lama tidak dipakai atau setelah hujan?\n\nHindari menjumper aki jika Kamu tidak memahami polaritas dan prosedur kendaraan. Pemeriksaan tegangan dan sistem pengisian sebaiknya dilakukan dengan alat yang sesuai.`,
      engine: `Ada beberapa area mesin yang bisa berkaitan dengan gejala tersebut. Chat ini belum dapat menentukan komponen yang rusak.\n\nArea pemeriksaan awal:\n• Pelumasan: level oli, kebocoran, dan lampu tekanan oli.\n• Pengapian: busi, koil, kabel, dan kondisi percikan sesuai prosedur bengkel.\n• Suplai udara dan bahan bakar: filter udara, throttle body, injektor, dan tekanan bahan bakar.\n• Sistem mekanis: kompresi, suara komponen internal, dan dudukan mesin.\n• Sensor dan kontrol mesin: kode gangguan melalui alat scan bila tersedia.\n\nPertanyaan klarifikasi:\n1. Gejala muncul saat mesin dingin, setelah panas, saat langsam, atau ketika digas?\n2. Ada lampu check engine atau lampu oli menyala?\n3. Apakah tenaga turun, mesin bergetar, atau konsumsi bahan bakar berubah?\n\nJika terdengar ketukan keras, lampu tekanan oli menyala, mesin kehilangan tenaga secara mendadak, atau muncul asap tebal, hentikan kendaraan di tempat aman dan minta pemeriksaan profesional.`,
      transmission: `Gejala tersebut mungkin berkaitan dengan transmisi atau sistem pemindah tenaga. Komponen yang diperiksa berbeda antara motor CVT, motor manual, dan mobil otomatis/manual.\n\nArea pemeriksaan yang mungkin relevan:\n• Motor CVT: kondisi V-belt, roller, rumah roller, kampas ganda, dan pulley.\n• Motor manual: setelan dan keausan kopling, rantai, serta sprocket.\n• Mobil otomatis: kondisi dan spesifikasi fluida transmisi, kebocoran, serta kode gangguan.\n• Mobil manual: kopling, release bearing, linkage, dan kebocoran.\n\nPertanyaan klarifikasi:\n1. Kendaraan menggunakan CVT, manual, atau otomatis?\n2. Gejala berupa selip, hentakan, suara, atau sulit masuk gigi?\n3. Muncul saat mulai berjalan, akselerasi, atau ketika perpindahan gigi?\n\nJangan memaksa kendaraan bila transmisi kehilangan penggerak, muncul hentakan keras, atau tercium bau terbakar.`,
      suspension: `Kita perlu memeriksa area suspensi, kemudi, dan sambungan kaki-kaki. Bunyi saja belum cukup untuk memastikan part tertentu rusak.\n\nArea pemeriksaan:\n• Shock absorber atau fork: kebocoran dan redaman.\n• Bushing, ball joint, link stabilizer, dan mounting.\n• Bearing roda dan sambungan kemudi.\n• Tekanan serta kondisi ban.\n• Pada motor, periksa juga komstir dan keselarasan roda.\n\nPertanyaan klarifikasi:\n1. Bunyi muncul saat melewati jalan berlubang, saat belok, atau saat mengerem?\n2. Bunyi berasal dari depan atau belakang?\n3. Kendaraan terasa limbung, menarik ke satu sisi, atau setir bergetar?\n\nJika kemudi terasa tidak stabil atau ada kelonggaran besar pada roda, jangan lanjutkan perjalanan sebelum diperiksa.`,
      ac: `Keluhan AC atau pendingin kabin dapat berasal dari beberapa sistem. Jangan langsung menyimpulkan bahwa freon harus ditambah.\n\nArea pemeriksaan:\n• Filter kabin dan aliran udara.\n• Blower, resistor, dan kelistrikan kontrol.\n• Kondensor dan kipas kondensor.\n• Kompresor, belt, kopling kompresor (jika ada).\n• Kebocoran refrigeran dan performa sistem oleh teknisi AC.\n\nPertanyaan klarifikasi:\n1. AC tidak dingin sama sekali atau dingin hanya saat kendaraan melaju?\n2. Hembusan udara lemah atau tetap kuat tetapi tidak dingin?\n3. Ada suara saat AC dinyalakan?\n\nPemeriksaan refrigeran dan tekanan sistem sebaiknya dilakukan teknisi dengan alat khusus.`,
      maintenance: `Untuk menyusun rencana servis, kita perlu menyesuaikan jadwal dengan buku manual kendaraan, jenis oli/fluida, kondisi pemakaian, dan odometer.\n\nKomponen yang umumnya ditinjau saat servis berkala:\n• Oli mesin dan filter oli sesuai interval pabrikan.\n• Filter udara dan filter kabin (jika ada).\n• Busi atau sistem pengapian sesuai jadwal.\n• Kampas rem, cakram/tromol, dan minyak rem.\n• Ban, tekanan, tapak, dan kondisi roda.\n• Aki, lampu, wiper, coolant, serta kebocoran.\n• Untuk motor matic, jadwal pemeriksaan CVT sesuai buku manual.\n\nBeri tahu saya merek, model, tahun, odometer, dan kapan terakhir servis agar saya bisa bantu membuat checklist pertanyaan untuk bengkel.`,
      general: `Saya bisa bantu mengurai gejalanya. Supaya arah pemeriksaan lebih relevan, ceritakan beberapa hal berikut:\n\n1. Kendaraan motor atau mobil? Sebutkan merek dan model jika tahu.\n2. Apa yang Kamu rasakan atau dengar? Gunakan bahasa sehari-hari saja.\n3. Kapan gejala muncul: saat mesin dingin, langsam, akselerasi, pengereman, belok, atau setelah perjalanan jauh?\n4. Ada lampu peringatan di panel instrumen?\n5. Sejak kapan masalah mulai terasa?\n\nSaya akan bantu menyusun kemungkinan area pemeriksaan, bukan menebak satu part secara pasti.`
    };

    let reply = replies[category] || replies.general;
    let prefix = `Konteks kendaraan: ${context}.\n\n`;
    if (safety || category === 'brake') {
      prefix += `PRIORITAS KESELAMATAN: ${category === 'brake' ? 'Masalah rem dapat mengurangi kemampuan menghentikan kendaraan.' : 'Gejala yang disebutkan dapat berkaitan dengan kondisi berisiko.'} Utamakan berhenti di tempat aman dan minta bantuan bila kendali atau keselamatan terganggu.\n\n`;
    }
    if (category === 'general' && !state.context.brand && !state.context.model) {
      prefix = '';
    }
    return prefix + reply + `\n\nCatatan: Ini adalah panduan simulasi berdasarkan kata kunci dan belum menggunakan model AI generatif. Pemeriksaan langsung oleh mekanik diperlukan untuk memastikan penyebab dan menentukan penggantian komponen.`;
  }

  async function sendMessage(text) {
    const cleaned = String(text || '').trim();
    if (!cleaned || state.sending) return;
    if (cleaned.length > 1600) { setStatus('Pesan terlalu panjang. Maksimal 1.600 karakter.', 'warning'); return; }
    state.sending = true;
    $('#sendMessageBtn').disabled = true;
    $('#chatInput').value = '';
    updateCounter();
    resizeInput();
    $('#chatWelcome')?.remove();
    await persistMessage('user', cleaned);
    renderMessages();
    renderTyping();
    await new Promise(resolve => setTimeout(resolve, 650 + Math.min(cleaned.length * 3, 600)));
    removeTyping();
    const answer = generateSimulatedReply(cleaned);
    await persistMessage('assistant', answer);
    renderMessages();
    state.sending = false;
    $('#sendMessageBtn').disabled = false;
    $('#chatInput').focus();
  }

  function updateCounter() {
    const input = $('#chatInput');
    const count = $('#chatCharCount');
    if (input && count) count.textContent = `${input.value.length}/1600`;
  }
  function resizeInput() {
    const input = $('#chatInput');
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 135)}px`;
  }

  function bindEvents() {
    $('#chatForm')?.addEventListener('submit', event => {
      event.preventDefault();
      sendMessage($('#chatInput').value);
    });
    $('#chatInput')?.addEventListener('input', () => { updateCounter(); resizeInput(); });
    $('#chatInput')?.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage($('#chatInput').value);
      }
    });
    $('#newChatBtn')?.addEventListener('click', () => {
      state.activeId = null;
      state.messages = [];
      state.activeSource = state.user && state.cloudReady ? 'cloud' : 'local';
      renderMessages(); renderHistory();
      $('#chatInput')?.focus();
    });
    $('#saveVehicleContextBtn')?.addEventListener('click', async () => {
      saveContextLocal();
      if (state.user && state.activeId && state.activeSource === 'cloud' && state.cloudReady) {
        const { error } = await state.client.from('chat_conversations')
          .update({ vehicle_context: { ...state.context } })
          .eq('id', state.activeId).eq('user_id', state.user.id);
        if (error) { setStatus('Konteks disimpan di browser, tetapi gagal diperbarui ke cloud.', 'warning'); return; }
      }
      setStatus('Konteks kendaraan disimpan. Pesan berikutnya akan menggunakan informasi ini.');
    });
    $('#chatMessages')?.addEventListener('click', event => {
      const button = event.target.closest('[data-prompt]');
      if (button) sendMessage(button.dataset.prompt || '');
    });
    $('.assistant-suggestion-row')?.addEventListener('click', event => {
      const button = event.target.closest('[data-prompt]');
      if (button) sendMessage(button.dataset.prompt || '');
    });
    $('#clearLocalHistoryBtn')?.addEventListener('click', async () => {
      if (!window.confirm('Bersihkan seluruh riwayat percakapan? Tindakan ini tidak dapat dibatalkan.')) return;
      try {
        if (state.user && state.client && state.cloudReady) {
          const { error } = await state.client.from('chat_conversations').delete().eq('user_id', state.user.id);
          if (error) throw error;
        }
        writeLocal([]);
        state.conversations = [];
        state.activeId = null;
        state.messages = [];
        renderHistory(); renderMessages();
        setStatus('Seluruh riwayat percakapan berhasil dibersihkan.');
      } catch (error) {
        console.error('Clear conversation history:', error);
        setStatus(error.message || 'Riwayat gagal dibersihkan.', 'warning');
      }
    });
    $('#exportChatBtn')?.addEventListener('click', async () => {
      const text = state.messages.map(item => `${item.role === 'user' ? 'Kamu' : 'Asisten BengkelinAI'}:\n${item.content}`).join('\n\n');
      if (!text) { setStatus('Belum ada pesan untuk disalin.'); return; }
      try { await navigator.clipboard.writeText(text); setStatus('Percakapan berhasil disalin.'); }
      catch { setStatus('Browser tidak mengizinkan penyalinan otomatis.', 'warning'); }
    });
  }

  async function initialize() {
    loadContextIntoForm();
    bindEvents();
    const integration = window.BENGKELINAI_DB;
    state.client = integration?.client || null;
    if (state.client) {
      try {
        const { data, error } = await state.client.auth.getSession();
        if (error) throw error;
        state.user = data.session?.user || null;
        if (state.user) {
          try {
            await loadCloudConversations();
            state.cloudReady = true;
            setStatus('Riwayat percakapan akun terhubung ke Supabase.');
          } catch (error) {
            console.warn('Chat tables not available yet:', error);
            state.cloudReady = false;
            state.conversations = readLocal();
            state.activeId = state.conversations[0]?.id || null;
            if (state.activeId) {
              const current = state.conversations[0];
              state.messages = current.messages || [];
            }
            renderHistory(); renderMessages();
            setStatus('Chatbot siap dalam mode lokal. Jalankan migration SQL chatbot untuk menyimpan riwayat ke akun Supabase.', 'warning');
          }
        } else {
          state.conversations = readLocal();
          state.activeId = state.conversations[0]?.id || null;
          if (state.activeId) state.messages = state.conversations[0].messages || [];
          renderHistory(); renderMessages();
          setStatus('Kamu belum masuk. Riwayat chat disimpan di browser ini saja.');
        }
        state.client.auth.onAuthStateChange((event, session) => {
          window.setTimeout(async () => {
            const wasUser = state.user?.id || null;
            state.user = session?.user || null;
            if (state.user && state.user.id !== wasUser) {
              try {
                await loadCloudConversations();
                state.cloudReady = true;
                setStatus('Akun terhubung. Riwayat chat tersimpan di Supabase.');
              } catch (error) {
                state.cloudReady = false;
                setStatus('Tabel percakapan belum tersedia. Riwayat sementara disimpan di browser.', 'warning');
              }
            } else if (!state.user && wasUser) {
              state.cloudReady = false;
              state.activeId = null;
              state.messages = [];
              state.conversations = readLocal();
              renderHistory(); renderMessages();
              setStatus('Sesi berakhir. Chat baru akan disimpan di browser ini.');
            }
          }, 0);
        });
      } catch (error) {
        console.warn('Chat session initialization:', error);
        state.conversations = readLocal();
        renderHistory(); renderMessages();
        setStatus('Koneksi akun belum tersedia. Mode lokal tetap dapat digunakan.', 'warning');
      }
    } else {
      state.conversations = readLocal();
      state.activeId = state.conversations[0]?.id || null;
      if (state.activeId) state.messages = state.conversations[0].messages || [];
      renderHistory(); renderMessages();
      setStatus('Chatbot berjalan dalam mode lokal. Login dan konfigurasi database diperlukan untuk sinkronisasi cloud.');
    }
  }

  document.addEventListener('DOMContentLoaded', initialize);
})();
