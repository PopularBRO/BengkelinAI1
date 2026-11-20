/* BengkelinAI Supabase integration.
 * Browser client uses only the Supabase publishable/anon key.
 * Row Level Security in schema.sql is the real security boundary.
 */
(function () {
  'use strict';

  const CONFIG = window.BENGKELINAI_SUPABASE_CONFIG || {};
  const hasConfig = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(CONFIG.url || '') &&
    typeof CONFIG.publishableKey === 'string' &&
    CONFIG.publishableKey.length > 20 &&
    !CONFIG.publishableKey.includes('YOUR_');

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const showMessage = (message, type = 'success') => {
    const box = $('#authMessage');
    if (box) {
      box.textContent = message;
      box.classList.toggle('error', type === 'error');
      box.hidden = false;
    }
    if (typeof window.showToast === 'function') window.showToast(message);
  };
  const notify = message => {
    if (typeof window.showToast === 'function') window.showToast(message);
    else console.info('[BengkelinAI]', message);
  };
  const formFeedback = (id, message, type = 'success') => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('error', type === 'error');
    el.hidden = false;
  };
  const safeNext = () => {
    const next = new URLSearchParams(location.search).get('next') || 'dashboard.html';
    if (next.startsWith('/') || next.includes('://') || next.startsWith('//')) return 'dashboard.html';
    return /^[a-z0-9-]+\.html(?:\?.*)?$/i.test(next) ? next : 'dashboard.html';
  };
  const redirectToAuth = () => {
    location.href = `auth.html?next=${encodeURIComponent(location.pathname.split('/').pop() || 'dashboard.html')}`;
  };

  if (!hasConfig || !window.supabase?.createClient) {
    console.warn('BengkelinAI Supabase belum dikonfigurasi. Isi static/supabase-config.js.');
    document.addEventListener('DOMContentLoaded', () => {
      const hint = $('#supabaseConfigHint');
      if (hint) hint.textContent = 'Koneksi Supabase belum diatur. Pengelola harus mengisi URL project dan publishable key di supabase-config.js.';
      const authButtons = ['signInForm','signUpForm','googleSignInBtn'].map(id => document.getElementById(id)).filter(Boolean);
      authButtons.forEach(el => el.addEventListener('submit', e => { e.preventDefault(); showMessage('Database belum dikonfigurasi. Hubungkan project Supabase terlebih dahulu.', 'error'); }));
      $('#googleSignInBtn')?.addEventListener('click', () => showMessage('Database belum dikonfigurasi.', 'error'));
    });
    window.BENGKELINAI_DB = { configured: false, client: null };
    return;
  }

  const client = window.supabase.createClient(CONFIG.url, CONFIG.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const BAI = window.BENGKELINAI_DB = {
    configured: true, client, session: null, profile: null,
    async getUser() {
      const { data, error } = await client.auth.getUser();
      if (error) return null;
      return data.user || null;
    },
    async requireUser() {
      const user = await this.getUser();
      if (!user) { notify('Masuk terlebih dahulu untuk menyimpan data ke akun.'); redirectToAuth(); return null; }
      return user;
    }
  };

  function addAuthNav() {
    const actions = $('.nav-actions');
    if (!actions || $('#authNavLink')) return;
    const link = document.createElement('a');
    link.className = 'btn btn-outline btn-small auth-nav-link';
    link.id = 'authNavLink';
    link.href = 'auth.html';
    link.textContent = 'Masuk / Daftar';
    actions.prepend(link);
  }

  async function updateAuthNav(session) {
    BAI.session = session;
    const link = $('#authNavLink');
    const actions = $('.nav-actions');
    if (!link && actions) addAuthNav();
    const navLink = $('#authNavLink');
    let profile = null;
    if (session?.user) {
      const { data } = await client.from('profiles').select('full_name, role').eq('id', session.user.id).maybeSingle();
      profile = data || null;
      BAI.profile = profile;
      if (navLink) {
        navLink.href = 'dashboard.html';
        navLink.textContent = `Halo, ${(profile?.full_name || session.user.email || 'Akun').split(' ')[0]}`;
        navLink.title = `Role: ${profile?.role || 'customer'}`;
      }
      if (actions && !$('#authSignOutBtn')) {
        const btn = document.createElement('button');
        btn.id = 'authSignOutBtn'; btn.className = 'btn btn-ghost btn-small'; btn.type = 'button'; btn.textContent = 'Keluar';
        btn.addEventListener('click', async () => { const { error } = await client.auth.signOut(); if (error) notify(error.message); else location.href = 'index.html'; });
        actions.appendChild(btn);
      }
    } else {
      BAI.profile = null;
      if (navLink) { navLink.href = 'auth.html'; navLink.textContent = 'Masuk / Daftar'; navLink.removeAttribute('title'); }
      $('#authSignOutBtn')?.remove();
    }
  }

  function initAuthPage() {
    const signInForm = $('#signInForm');
    const signUpForm = $('#signUpForm');
    const signInTab = $('#showSignIn');
    const signUpTab = $('#showSignUp');
    const recoveryForm = $('#recoveryForm');
    if (!signInForm || !signUpForm) return;

    const authParams = new URLSearchParams(location.search);
    if (authParams.get('mode') === 'recovery' && recoveryForm) {
      signInForm.hidden = true; signUpForm.hidden = true;
      signInTab.hidden = true; signUpTab.hidden = true;
      recoveryForm.hidden = false;
    }
    client.auth.getSession().then(({ data }) => {
      if (data.session && authParams.has('next') && authParams.get('mode') !== 'recovery') location.replace(safeNext());
    });

    const setTab = mode => {
      const signIn = mode === 'signin';
      signInForm.hidden = !signIn;
      signUpForm.hidden = signIn;
      signInTab.classList.toggle('active', signIn); signInTab.setAttribute('aria-selected', String(signIn));
      signUpTab.classList.toggle('active', !signIn); signUpTab.setAttribute('aria-selected', String(!signIn));
      const msg = $('#authMessage'); if (msg) msg.hidden = true;
    };
    signInTab.addEventListener('click', () => setTab('signin'));
    signUpTab.addEventListener('click', () => setTab('signup'));

    signInForm.addEventListener('submit', async event => {
      event.preventDefault();
      const btn = signInForm.querySelector('[type="submit"]'); btn.disabled = true; btn.textContent = 'Memeriksa akun...';
      const email = $('#signInEmail').value.trim();
      const password = $('#signInPassword').value;
      const { error } = await client.auth.signInWithPassword({ email, password });
      btn.disabled = false; btn.textContent = 'Masuk ke BengkelinAI';
      if (error) { showMessage(error.message, 'error'); return; }
      location.href = safeNext();
    });

    signUpForm.addEventListener('submit', async event => {
      event.preventDefault();
      const btn = signUpForm.querySelector('[type="submit"]'); btn.disabled = true; btn.textContent = 'Membuat akun...';
      const fullName = $('#signUpName').value.trim();
      const phone = $('#signUpPhone').value.trim();
      const email = $('#signUpEmail').value.trim();
      const password = $('#signUpPassword').value;
      const { data, error } = await client.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, phone }, emailRedirectTo: `${location.origin}/auth.html?next=dashboard.html` }
      });
      btn.disabled = false; btn.textContent = 'Daftar akun';
      if (error) { showMessage(error.message, 'error'); return; }
      if (data.session) location.href = safeNext();
      else showMessage('Akun berhasil dibuat. Periksa email untuk verifikasi sebelum masuk.');
    });

    $('#googleSignInBtn')?.addEventListener('click', async () => {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${location.origin}/auth.html?next=${encodeURIComponent(safeNext())}` }
      });
      if (error) showMessage(error.message, 'error');
    });

    $('#forgotPasswordBtn')?.addEventListener('click', async () => {
      const email = $('#signInEmail').value.trim();
      if (!email) { showMessage('Masukkan email terlebih dahulu, lalu pilih Lupa password.', 'error'); return; }
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth.html?mode=recovery` });
      if (error) showMessage(error.message, 'error');
      else showMessage('Jika email terdaftar, tautan pemulihan akan dikirim. Periksa kotak masuk dan spam.');
    });

    recoveryForm?.addEventListener('submit', async event => {
      event.preventDefault();
      const password = $('#newPassword')?.value || '';
      if (password.length < 8) { showMessage('Password baru minimal 8 karakter.', 'error'); return; }
      const { error } = await client.auth.updateUser({ password });
      if (error) showMessage(error.message, 'error');
      else { showMessage('Password berhasil diperbarui. Mengarahkan ke dashboard.'); setTimeout(() => location.replace('dashboard.html'), 900); }
    });
  }

  function requireFormSession(event, form) {
    const user = BAI.session?.user;
    if (!user) {
      event.preventDefault(); event.stopImmediatePropagation();
      formFeedback(form.dataset.feedback || '', 'Masuk dahulu untuk menyimpan data ke akun BengkelinAI.', 'error');
      notify('Silakan masuk untuk menyimpan data secara online.');
      return null;
    }
    event.preventDefault(); event.stopImmediatePropagation();
    return user;
  }

  async function saveVehicle(form, user) {
    const data = Object.fromEntries(new FormData(form));
    const payload = {
      user_id: user.id,
      vehicle_type: data.type === 'Motor' ? 'motorcycle' : 'car',
      brand: data.brand.trim(), model: data.model.trim(),
      production_year: data.year ? Number(data.year) : null,
      license_plate: data.plate.trim() || null,
      odometer_km: data.odometer ? Number(data.odometer) : null
    };
    const { error } = await client.from('vehicles').insert(payload);
    if (error) throw error;
    form.reset(); formFeedback('vehicleFeedback', 'Kendaraan berhasil disimpan ke database akun Kamu.');
    await renderVehiclesFromDb(user);
  }

  async function renderVehiclesFromDb(user) {
    const list = $('#vehicleList'); if (!list) return;
    const { data, error } = await client.from('vehicles').select('id,vehicle_type,brand,model,production_year,license_plate,odometer_km,created_at').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) { list.innerHTML = `<div class="db-empty">${escapeHTML(error.message)}</div>`; return; }
    if (!data?.length) { list.innerHTML = '<div class="db-empty">Belum ada kendaraan di database akun ini.</div>'; return; }
    list.className = 'vehicle-list db-list';
    list.innerHTML = data.map(v => `<article class="db-item"><div><h3>${escapeHTML(v.brand)} ${escapeHTML(v.model)}</h3><p>${v.vehicle_type === 'motorcycle' ? 'Motor' : 'Mobil'} · ${escapeHTML(v.production_year || 'Tahun tidak diisi')}${v.license_plate ? ' · ' + escapeHTML(v.license_plate) : ''}${v.odometer_km ? ' · ' + Number(v.odometer_km).toLocaleString('id-ID') + ' km' : ''}</p></div><button class="btn btn-outline btn-small" type="button" data-db-delete-vehicle="${v.id}">Hapus</button></article>`).join('');
    $$('[data-db-delete-vehicle]').forEach(btn => btn.addEventListener('click', async () => {
      if (!confirm('Hapus kendaraan ini dari database?')) return;
      const { error: deleteError } = await client.from('vehicles').delete().eq('id', btn.dataset.dbDeleteVehicle);
      if (deleteError) notify(deleteError.message); else renderVehiclesFromDb(user);
    }));
  }

  async function saveReminder(form, user) {
    const d = Object.fromEntries(new FormData(form));
    const { error } = await client.from('maintenance_reminders').insert({
      user_id: user.id, task_name: d.task, vehicle_label: d.vehicle.trim(), due_date: d.date, note: d.note?.trim() || null
    });
    if (error) throw error;
    form.reset(); formFeedback('reminderFeedback', 'Pengingat berhasil disimpan ke database akun Kamu.');
    await renderRemindersFromDb(user);
  }

  async function renderRemindersFromDb(user) {
    const list = $('#reminderList'); if (!list) return;
    const { data, error } = await client.from('maintenance_reminders').select('id,task_name,vehicle_label,due_date,note,is_completed').eq('user_id', user.id).order('due_date');
    if (error) { list.innerHTML = `<div class="db-empty">${escapeHTML(error.message)}</div>`; return; }
    if (!data?.length) { list.innerHTML = '<div class="db-empty">Belum ada pengingat tersimpan.</div>'; return; }
    list.innerHTML = data.map(r => `<article class="db-item"><div><h3>${escapeHTML(r.task_name)}</h3><p>${escapeHTML(r.vehicle_label)} · ${new Date(r.due_date + 'T00:00:00').toLocaleDateString('id-ID')}${r.note ? ' · ' + escapeHTML(r.note) : ''}</p></div><button class="btn btn-outline btn-small" type="button" data-db-delete-reminder="${r.id}">Hapus</button></article>`).join('');
    $$('[data-db-delete-reminder]').forEach(btn => btn.addEventListener('click', async () => {
      const { error: deleteError } = await client.from('maintenance_reminders').delete().eq('id', btn.dataset.dbDeleteReminder);
      if (deleteError) notify(deleteError.message); else renderRemindersFromDb(user);
    }));
  }

  async function saveEstimate(form, user) {
    const vehicleType = $('#vehicleType').value;
    const category = $('#problemCategory').value;
    const severity = $('#problemSeverity').value;
    const area = $('#estimateArea').value.trim();
    const bases = {
      motor: { battery:[120000,450000], brake:[80000,380000], tire:[90000,420000], engine:[180000,950000], suspension:[140000,650000], service:[80000,300000] },
      car: { battery:[350000,1500000], brake:[180000,1200000], tire:[450000,1800000], engine:[400000,2800000], suspension:[350000,2200000], service:[250000,1100000] }
    };
    const mult = { unknown:1, light:.8, medium:1.25, heavy:1.7 }[severity] || 1;
    const [bmin,bmax] = bases[vehicleType][category];
    const min = Math.round((bmin * mult) / 10000) * 10000;
    const max = Math.round((bmax * mult) / 10000) * 10000;
    const labor = Math.round(((min + max) * .34 / 2) / 10000) * 10000;
    const parts = Math.max(0, Math.round(((min + max) * .66 / 2) / 10000) * 10000);
    const { error } = await client.from('estimates').insert({
      user_id:user.id, vehicle_type: vehicleType === 'motor' ? 'motorcycle' : 'car', problem_category:category,
      severity, area:area || null, estimated_min:min, estimated_max:max, labor_amount:labor, parts_amount:parts, is_simulated:true
    });
    if (error) throw error;
    notify('Estimasi simulasi dihitung dan disimpan di akun Kamu.');
  }

  async function uploadDiagnosis(user, file, inputType, durationSeconds = null) {
    if (!file) return;
    const maxBytes = inputType === 'photo' ? 8 * 1024 * 1024 : 12 * 1024 * 1024;
    if (file.size > maxBytes) { notify('Ukuran file terlalu besar untuk disimpan.'); return; }
    const safeName = file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_') : `${inputType}-${Date.now()}`;
    const path = `${user.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await client.storage.from('diagnosis-media').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
    if (uploadError) throw uploadError;
    const { error: rowError } = await client.from('diagnoses').insert({
      user_id: user.id, input_type: inputType, status: 'simulated', storage_path: path,
      original_filename: safeName, mime_type: file.type || null, file_size_bytes: file.size,
      duration_seconds: durationSeconds, summary: 'Data tersimpan. Analisis AI masih dalam mode simulasi.',
      result_json: { mode: 'simulation', message: 'File disimpan sebagai riwayat input. Tidak ada model AI yang memproses file ini.' },
      disclaimer: 'Hasil belum merupakan diagnosis teknis. Lakukan pemeriksaan mekanik profesional.'
    });
    if (rowError) {
      await client.storage.from('diagnosis-media').remove([path]);
      throw rowError;
    }
    notify('File dan riwayat simulasi berhasil disimpan secara privat di akun Kamu.');
  }

  async function saveServiceRequest(form, user) {
    const d = Object.fromEntries(new FormData(form));
    const consent = form.querySelector('input[type="checkbox"]')?.checked === true;
    const { data, error } = await client.from('service_requests').insert({
      requested_by:user.id, vehicle_type:d.vehicle === 'Motor' ? 'motorcycle' : 'car',
      vehicle_description:d.vehicle, requested_time:d.time, contact_name:d.name.trim(), contact_phone:d.phone.trim(),
      address:d.location.trim(), problem_description:d.problem.trim(), customer_consent:consent, status:'submitted'
    }).select('id').single();
    if (error) throw error;
    form.reset(); formFeedback('mechanicFeedback', `Permintaan berhasil disimpan. Nomor referensi: ${data.id}. Belum ada mekanik yang ditugaskan.`);
    notify('Permintaan bantuan tercatat di akun Kamu.');
  }

  async function saveContact(form) {
    const d = Object.fromEntries(new FormData(form));
    const { error } = await client.from('contact_messages').insert({
      name:d.contactName.trim(), email:d.contactEmail.trim(), message:d.contactMessage.trim(), subject:'Pesan dari website BengkelinAI'
    });
    if (error) throw error;
    form.reset(); formFeedback('contactFeedback', 'Pesan berhasil dikirim ke database BengkelinAI.');
  }

  async function savePartnerApplication(form, user) {
    const d = Object.fromEntries(new FormData(form));
    const { error } = await client.from('partner_applications').insert({
      user_id:user.id, requested_role:d.requested_role, organization_name:d.organization_name?.trim() || null,
      contact_phone:d.contact_phone.trim(), address:d.address.trim(), city:d.city.trim(), province:d.province.trim(),
      experience_years:d.experience_years ? Number(d.experience_years) : null, message:d.message.trim()
    });
    if (error) throw error;
    form.reset(); formFeedback('partnerApplicationFeedback', 'Pengajuan berhasil dikirim. Role akan ditinjau admin dan tidak berubah otomatis.');
  }

  async function renderHistory(user) {
    const target = $('#activityList'); if (!target) return;
    const [diagnoses, estimates, requests] = await Promise.all([
      client.from('diagnoses').select('id,input_type,status,summary,created_at').eq('user_id', user.id).order('created_at', {ascending:false}).limit(30),
      client.from('estimates').select('id,problem_category,estimated_min,estimated_max,created_at').eq('user_id', user.id).order('created_at', {ascending:false}).limit(30),
      client.from('service_requests').select('id,status,vehicle_description,created_at').eq('requested_by', user.id).order('created_at', {ascending:false}).limit(30)
    ]);
    const rows = [];
    if (!diagnoses.error) (diagnoses.data || []).forEach(x => rows.push({date:x.created_at,title:`Diagnosis ${x.input_type === 'photo' ? 'foto' : 'suara'} · ${x.status}`,detail:x.summary || 'Input tersimpan.'}));
    if (!estimates.error) (estimates.data || []).forEach(x => rows.push({date:x.created_at,title:'Estimasi biaya · simulasi',detail:`${x.problem_category} · Rp${Number(x.estimated_min).toLocaleString('id-ID')}–Rp${Number(x.estimated_max).toLocaleString('id-ID')}`}));
    if (!requests.error) (requests.data || []).forEach(x => rows.push({date:x.created_at,title:'Permintaan mekanik',detail:`${x.vehicle_description} · Status ${x.status}`}));
    rows.sort((a,b) => new Date(b.date) - new Date(a.date));
    if (!rows.length) { target.innerHTML = '<div class="db-empty">Belum ada riwayat tersimpan di database akun ini.</div>'; return; }
    target.innerHTML = rows.slice(0,60).map(x => `<article class="activity-card"><span class="activity-card-icon">↗</span><div><h3>${escapeHTML(x.title)}</h3><p>${escapeHTML(x.detail)}</p><time>${new Date(x.date).toLocaleString('id-ID')}</time></div></article>`).join('');
  }

  async function loadPublicWorkshops() {
    const grid = $('#workshopGrid'); if (!grid) return;
    const { data, error } = await client.from('workshops').select('id,name,description,city,province,vehicle_types,services,contact_phone').eq('is_active', true).eq('verification_status', 'verified').order('name');
    if (error || !data?.length) return; // Keep explicitly-marked demo cards when no verified partners exist.
    grid.innerHTML = data.map(w => `<article class="workshop-card" data-name="${escapeHTML(w.name)}" data-services="${escapeHTML((w.services || []).join(','))}" data-type="${(w.vehicle_types || []).includes('motorcycle') && (w.vehicle_types || []).includes('car') ? 'both' : (w.vehicle_types || [])[0] === 'car' ? 'car' : 'motor'}"><div class="workshop-card-image"><span class="demo-tag">MITRA TERVERIFIKASI</span></div><div class="workshop-card-body"><div class="workshop-meta"><span>${escapeHTML((w.vehicle_types || []).join(' & '))}</span><span class="workshop-distance">${escapeHTML([w.city,w.province].filter(Boolean).join(', '))}</span></div><h3>${escapeHTML(w.name)}</h3><p>${escapeHTML(w.description || 'Informasi layanan bengkel.')}</p><div class="service-tags">${(w.services || []).map(s => `<span>${escapeHTML(s)}</span>`).join('')}</div><a class="btn btn-outline btn-full" href="mekanik.html">Hubungi melalui BengkelinAI</a></div></article>`).join('');
    // Re-bind the existing filters to database-generated cards.
    ['workshopSearch','workshopTypeFilter','workshopServiceFilter'].forEach(id => document.getElementById(id)?.dispatchEvent(new Event(id === 'workshopSearch' ? 'input' : 'change')));
  }

  function installPersonalFormHandlers() {
    document.addEventListener('submit', async event => {
      const form = event.target;
      const ids = ['vehicleForm','reminderForm','mechanicForm','contactForm','estimatorForm','partnerApplicationForm'];
      if (!form || !ids.includes(form.id)) return;
      // Keep the existing calculator's own handler so it can render the demo result.
      // Save the same calculated values to Supabase after that handler completes.
      if (form.id === 'estimatorForm') {
        if (!form.reportValidity()) return;
        const user = BAI.session?.user;
        if (!user) { notify('Estimasi demo ditampilkan. Masuk untuk menyimpan riwayat ke akun.'); return; }
        window.setTimeout(() => saveEstimate(form, user).catch(error => notify(error.message || 'Riwayat estimasi gagal disimpan.')), 50);
        return;
      }
      event.preventDefault(); event.stopImmediatePropagation();
      try {
        if (!form.reportValidity()) return;
        if (form.id === 'contactForm') { await saveContact(form); notify('Pesan berhasil disimpan.'); return; }
        const user = await BAI.requireUser(); if (!user) return;
        if (form.id === 'vehicleForm') await saveVehicle(form, user);
        else if (form.id === 'reminderForm') await saveReminder(form, user);
        else if (form.id === 'mechanicForm') await saveServiceRequest(form, user);
        else if (form.id === 'partnerApplicationForm') await savePartnerApplication(form, user);
      } catch (error) {
        console.error('Supabase form save error:', error);
        const feedbackId = ({vehicleForm:'vehicleFeedback',reminderForm:'reminderFeedback',mechanicForm:'mechanicFeedback',contactForm:'contactFeedback',partnerApplicationForm:'partnerApplicationFeedback'})[form.id];
        if (feedbackId) formFeedback(feedbackId, error.message || 'Data gagal disimpan. Periksa koneksi dan kebijakan database.', 'error');
        else notify(error.message || 'Gagal menyimpan data ke database.');
      }
    }, true);
  }

  function installDiagnosisSaveHandlers() {
    let latestAudio = null;
    window.addEventListener('bai:audio-ready', event => { latestAudio = event.detail?.blob ? { blob:event.detail.blob, duration:event.detail.durationSeconds || null } : null; });
    document.addEventListener('click', async event => {
      const photoButton = event.target.closest('#analyzePhotoBtn');
      const soundButton = event.target.closest('#analyzeSoundBtn');
      if (!photoButton && !soundButton) return;
      const clickedButton = photoButton || soundButton;
      if (clickedButton.dataset.saving === 'true') return;
      const user = BAI.session?.user;
      if (!user) { notify('Mode simulasi aktif. Masuk dan centang persetujuan jika ingin menyimpan file ke akun.'); return; }
      if (!$('#diagnosisSaveConsent')?.checked) { notify('File tidak diunggah. Centang persetujuan penyimpanan privat jika ingin menyimpan riwayat file.'); return; }
      clickedButton.dataset.saving = 'true';
      try {
        if (photoButton) {
          const file = $('#photoInput')?.files?.[0];
          if (file) await uploadDiagnosis(user, file, 'photo');
        }
        if (soundButton && latestAudio?.blob) {
          const ext = latestAudio.blob.type.includes('mp4') ? 'm4a' : latestAudio.blob.type.includes('ogg') ? 'ogg' : 'webm';
          const normalizedMime = (latestAudio.blob.type || 'audio/webm').split(';')[0];
          const file = new File([latestAudio.blob], `rekaman-mesin-${Date.now()}.${ext}`, { type: normalizedMime });
          await uploadDiagnosis(user, file, 'sound', latestAudio.duration);
        }
      } catch (error) {
        console.error('Diagnosis upload error:', error);
        notify(error.message || 'File diagnosis gagal disimpan.');
      } finally {
        clickedButton.dataset.saving = 'false';
      }
    }, true);
  }

  async function renderAccountData() {
    const { data: { session } } = await client.auth.getSession();
    await updateAuthNav(session);
    if (!session?.user) return;
    const user = session.user;
    const page = document.body.dataset.page;
    if (page === 'garasi') await renderVehiclesFromDb(user);
    if (page === 'pengingat') await renderRemindersFromDb(user);
    if (page === 'riwayat') await renderHistory(user);
    if (page === 'bengkel') await loadPublicWorkshops();
    if (page === 'dashboard') {
      const main = $('#main-content');
      if (main && !$('#accountWelcome')) {
        const panel = document.createElement('section');
        panel.className = 'section section-pad'; panel.id = 'accountWelcome';
        panel.innerHTML = `<div class="container"><div class="info-callout"><strong>Akun aktif: ${escapeHTML(BAI.profile?.full_name || user.email)}</strong><p>Role akun: ${escapeHTML(BAI.profile?.role || 'customer')}. Data pribadi pada halaman Garasi, Pengingat, dan Riwayat disimpan ke Supabase.</p><a class="btn btn-outline btn-small" href="auth.html?next=dashboard.html">Kelola sesi akun</a></div></div>`;
        main.prepend(panel);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    addAuthNav();
    initAuthPage();
    installPersonalFormHandlers();
    installDiagnosisSaveHandlers();
    renderAccountData().catch(error => console.error('BengkelinAI account bootstrap:', error));
    client.auth.onAuthStateChange((_event, session) => {
      // Supabase recommends keeping this callback synchronous; no awaited DB call inside it.
      BAI.session = session;
      setTimeout(() => updateAuthNav(session), 0);
    });
  });
})();
