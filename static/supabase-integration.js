
/* ============================================================
   BENGKELINAI - SUPABASE INTEGRATION
   Authentication, Navbar, Logout, Database & Storage
   Frontend: HTML + CSS + JavaScript
   Backend: Supabase
   ============================================================ */

(function () {
  'use strict';

  /* ==========================================================
     1. CONFIGURATION
     ========================================================== */

  const CONFIG = window.BENGKELINAI_SUPABASE_CONFIG || {};

  const hasConfig =
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(CONFIG.url || '') &&
    typeof CONFIG.publishableKey === 'string' &&
    CONFIG.publishableKey.length > 20 &&
    !CONFIG.publishableKey.includes('YOUR_');

  const $ = (selector, scope = document) =>
    scope.querySelector(selector);

  const $$ = (selector, scope = document) =>
    [...scope.querySelectorAll(selector)];

  const escapeHTML = value =>
    String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);

  const notify = message => {
    if (typeof window.showToast === 'function') {
      window.showToast(message);
    } else {
      console.info('[BengkelinAI]', message);
    }
  };

  const showMessage = (message, type = 'success') => {
    const element = $('#authMessage');

    if (element) {
      element.textContent = message;
      element.classList.toggle('error', type === 'error');
      element.hidden = false;
    }

    notify(message);
  };

  const formFeedback = (id, message, type = 'success') => {
    const element = document.getElementById(id);

    if (!element) return;

    element.textContent = message;
    element.classList.toggle('error', type === 'error');
    element.hidden = false;
  };

  /* ==========================================================
     2. SAFE REDIRECT
     ========================================================== */

  function safeNext() {
    const params = new URLSearchParams(location.search);
    const next = params.get('next') || 'dashboard.html';

    if (
      next.startsWith('/') ||
      next.startsWith('//') ||
      next.includes('://')
    ) {
      return 'dashboard.html';
    }

    return /^[a-z0-9-]+\.html(?:\?.*)?$/i.test(next)
      ? next
      : 'dashboard.html';
  }

  function redirectToAuth() {
    const currentPage =
      location.pathname.split('/').pop() || 'dashboard.html';

    const allowedPages = /^[a-z0-9-]+\.html$/i.test(currentPage)
      ? currentPage
      : 'dashboard.html';

    location.href =
      `auth.html?next=${encodeURIComponent(allowedPages)}`;
  }

  /* ==========================================================
     3. CHECK SUPABASE CONFIGURATION
     ========================================================== */

  if (!hasConfig || !window.supabase?.createClient) {
    console.error(
      'BengkelinAI: Supabase belum dikonfigurasi.'
    );

    document.addEventListener('DOMContentLoaded', () => {
      const hint = $('#supabaseConfigHint');

      if (hint) {
        hint.textContent =
          'Koneksi database belum dikonfigurasi. Hubungi pengelola website.';
      }

      ['signInForm', 'signUpForm'].forEach(id => {
        const form = document.getElementById(id);

        form?.addEventListener('submit', event => {
          event.preventDefault();

          showMessage(
            'Database belum dikonfigurasi.',
            'error'
          );
        });
      });

      $('#googleSignInBtn')?.addEventListener('click', () => {
        showMessage(
          'Database belum dikonfigurasi.',
          'error'
        );
      });
    });

    window.BENGKELINAI_DB = {
      configured: false,
      client: null,
      session: null,
      profile: null
    };

    return;
  }

  /* ==========================================================
     4. CREATE SUPABASE CLIENT
     ========================================================== */

  const client = window.supabase.createClient(
    CONFIG.url,
    CONFIG.publishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    }
  );

  const BAI = window.BENGKELINAI_DB = {
    configured: true,
    client,
    session: null,
    profile: null,

    async getUser() {
      const { data, error } = await client.auth.getUser();

      if (error) {
        console.warn('Get user:', error.message);
        return null;
      }

      return data.user || null;
    },

    async requireUser() {
      const user = await this.getUser();

      if (!user) {
        notify(
          'Silakan masuk untuk menggunakan fitur akun BengkelinAI.'
        );

        redirectToAuth();
        return null;
      }

      return user;
    }
  };

  /* ==========================================================
     5. NAVIGATION HELPERS
     ========================================================== */

  function getNavActions() {
    return $('.nav-actions');
  }

  function getAuthNavLink() {
    const actions = getNavActions();

    if (!actions) return null;

    return (
      $('#authNavLink', actions) ||
      $('.auth-nav-link', actions)
    );
  }

  function getDashboardNavLink() {
    const actions = getNavActions();

    if (!actions) return null;

    return $$('a', actions).find(link => {
      const href = (
        link.getAttribute('href') || ''
      ).split('?')[0].split('#')[0];

      return (
        href === 'dashboard.html' ||
        href.endsWith('/dashboard.html')
      );
    }) || null;
  }

  function getFirstName(user) {
    const metadata = user?.user_metadata || {};

    const fullName =
      metadata.full_name ||
      metadata.name ||
      metadata.user_name ||
      metadata.fullName ||
      user?.email?.split('@')[0] ||
      'Pengguna';

    return String(fullName).trim().split(/\s+/)[0] || 'Pengguna';
  }

  function ensureAuthNav() {
    const actions = getNavActions();

    if (!actions) return null;

    let link = getAuthNavLink();

    if (!link) {
      link = document.createElement('a');

      link.className =
        'btn btn-outline btn-small auth-nav-link';

      link.id = 'authNavLink';
      link.href = 'auth.html';
      link.textContent = 'Masuk / Daftar';

      actions.prepend(link);
    }

    link.id = 'authNavLink';

    return link;
  }

  /* ==========================================================
     6. NAVBAR AUTHENTICATION STATE
     ========================================================== */

  async function updateAuthNav(session) {
    BAI.session = session || null;

    const actions = getNavActions();

    if (!actions) return;

    const navLink = ensureAuthNav();

    if (!navLink) return;

    const dashboardLink = getDashboardNavLink();

    const logoutButton = document.getElementById(
      'authSignOutBtn'
    );

    /* --------------------------------------------------------
       A. USER NOT LOGGED IN
       -------------------------------------------------------- */

    if (!session?.user) {
      BAI.profile = null;

      navLink.href = 'auth.html';
      navLink.textContent = 'Masuk / Daftar';
      navLink.title = 'Masuk atau daftar BengkelinAI';

      navLink.setAttribute(
        'aria-label',
        'Masuk atau daftar BengkelinAI'
      );

      if (dashboardLink) {
        dashboardLink.textContent = 'Dashboard Demo ↗';
      }

      logoutButton?.remove();

      return;
    }

    /* --------------------------------------------------------
       B. USER LOGGED IN
       -------------------------------------------------------- */

    const user = session.user;

    const firstName = getFirstName(user);

    navLink.href = 'dashboard.html';

    navLink.textContent = `Halo, ${firstName}`;

    navLink.title =
      'Buka dashboard akun BengkelinAI';

    navLink.setAttribute(
      'aria-label',
      `Dashboard akun ${firstName}`
    );

    if (dashboardLink) {
      dashboardLink.textContent = 'Dashboard';

      dashboardLink.setAttribute(
        'aria-label',
        'Buka dashboard'
      );
    }

    /* --------------------------------------------------------
       C. CREATE LOGOUT BUTTON
       -------------------------------------------------------- */

    let button = document.getElementById(
      'authSignOutBtn'
    );

    if (!button) {
      button = document.createElement('button');

      button.id = 'authSignOutBtn';
      button.type = 'button';

      button.className =
        'btn btn-ghost btn-small';

      button.textContent = 'Keluar';

      button.setAttribute(
        'aria-label',
        'Keluar dari akun BengkelinAI'
      );

      actions.appendChild(button);
    }

    /* --------------------------------------------------------
       D. LOGOUT EVENT
       -------------------------------------------------------- */

    if (button.dataset.bound !== 'true') {
      button.dataset.bound = 'true';

      button.addEventListener('click', async () => {
        if (button.disabled) return;

        button.disabled = true;

        const previousText = button.textContent;

        button.textContent = 'Keluar...';

        try {
          const { error } = await client.auth.signOut({
            scope: 'local'
          });

          if (error) throw error;

          BAI.session = null;
          BAI.profile = null;

          await updateAuthNav(null);

          notify(
            'Kamu berhasil keluar dari BengkelinAI.'
          );

          window.location.replace('index.html');

        } catch (error) {
          console.error('Logout error:', error);

          button.disabled = false;

          button.textContent =
            previousText || 'Keluar';

          notify(
            error.message ||
            'Gagal logout. Periksa koneksi internet.'
          );
        }
      });
    }

    /* --------------------------------------------------------
       E. FETCH USER PROFILE
       -------------------------------------------------------- */

    try {
      const { data, error } = await client
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.warn(
          'Profile lookup:',
          error.message
        );

        return;
      }

      if (
        BAI.session?.user?.id !== user.id ||
        !data
      ) {
        return;
      }

      BAI.profile = data;

      const profileName =
        data.full_name || firstName;

      const displayName = String(profileName)
        .trim()
        .split(/\s+/)[0];

      navLink.textContent =
        `Halo, ${displayName}`;

      navLink.title =
        `Role: ${data.role || 'customer'}`;

    } catch (error) {
      console.warn(
        'Profile lookup failed:',
        error
      );
    }
  }

  /* ==========================================================
     7. AUTHENTICATION PAGE
     ========================================================== */

  function initAuthPage() {
    const signInForm = $('#signInForm');
    const signUpForm = $('#signUpForm');

    const signInTab = $('#showSignIn');
    const signUpTab = $('#showSignUp');

    const recoveryForm = $('#recoveryForm');

    if (!signInForm || !signUpForm) return;

    const params = new URLSearchParams(location.search);

    /* Handle OAuth errors */

    const oauthError =
      params.get('error_description') ||
      params.get('error');

    if (oauthError) {
      showMessage(
        oauthError.replace(/\+/g, ' '),
        'error'
      );
    }

    /* Password recovery mode */

    if (
      params.get('mode') === 'recovery' &&
      recoveryForm
    ) {
      signInForm.hidden = true;
      signUpForm.hidden = true;

      signInTab.hidden = true;
      signUpTab.hidden = true;

      recoveryForm.hidden = false;
    }

    /* Redirect already logged-in users */

    client.auth.getSession().then(({ data }) => {
      if (
        data.session &&
        params.has('next') &&
        params.get('mode') !== 'recovery'
      ) {
        location.replace(safeNext());
      }
    }).catch(error => {
      console.warn('Auth page session:', error);
    });

    /* Switch login / registration tabs */

    const setTab = mode => {
      const signIn = mode === 'signin';

      signInForm.hidden = !signIn;
      signUpForm.hidden = signIn;

      signInTab.classList.toggle(
        'active',
        signIn
      );

      signInTab.setAttribute(
        'aria-selected',
        String(signIn)
      );

      signUpTab.classList.toggle(
        'active',
        !signIn
      );

      signUpTab.setAttribute(
        'aria-selected',
        String(!signIn)
      );

      const message = $('#authMessage');

      if (message) {
        message.hidden = true;
      }
    };

    signInTab.addEventListener(
      'click',
      () => setTab('signin')
    );

    signUpTab.addEventListener(
      'click',
      () => setTab('signup')
    );

    /* --------------------------------------------------------
       EMAIL LOGIN
       -------------------------------------------------------- */

    signInForm.addEventListener(
      'submit',
      async event => {
        event.preventDefault();

        const button = signInForm.querySelector(
          '[type="submit"]'
        );

        button.disabled = true;
        button.textContent = 'Memeriksa akun...';

        const email = $('#signInEmail').value.trim();

        const password =
          $('#signInPassword').value;

        try {
          const { error } = await client.auth
            .signInWithPassword({
              email,
              password
            });

          if (error) throw error;

          location.replace(safeNext());

        } catch (error) {
          showMessage(
            error.message ||
            'Login gagal. Periksa email dan password.',
            'error'
          );

          button.disabled = false;
          button.textContent = 'Masuk ke BengkelinAI';
        }
      }
    );

    /* --------------------------------------------------------
       EMAIL REGISTRATION
       -------------------------------------------------------- */

    signUpForm.addEventListener(
      'submit',
      async event => {
        event.preventDefault();

        const button = signUpForm.querySelector(
          '[type="submit"]'
        );

        button.disabled = true;
        button.textContent = 'Membuat akun...';

        const fullName =
          $('#signUpName').value.trim();

        const phone =
          $('#signUpPhone').value.trim();

        const email =
          $('#signUpEmail').value.trim();

        const password =
          $('#signUpPassword').value;

        try {
          const { data, error } =
            await client.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: fullName,
                  phone
                },
                emailRedirectTo:
                  `${location.origin}/auth.html?next=dashboard.html`
              }
            });

          if (error) throw error;

          if (data.session) {
            location.replace('dashboard.html');
          } else {
            showMessage(
              'Akun berhasil dibuat. Periksa email untuk verifikasi sebelum masuk.'
            );
          }

        } catch (error) {
          showMessage(
            error.message ||
            'Pendaftaran gagal. Coba kembali.',
            'error'
          );

        } finally {
          button.disabled = false;
          button.textContent = 'Daftar akun';
        }
      }
    );

    /* --------------------------------------------------------
       GOOGLE LOGIN
       -------------------------------------------------------- */

    $('#googleSignInBtn')?.addEventListener(
      'click',
      async event => {
        const button = event.currentTarget;

        button.disabled = true;

        const originalText = button.textContent;

        button.textContent =
          'Menghubungkan ke Google...';

        try {
          const redirectTo = new URL(
            `auth.html?next=${encodeURIComponent(safeNext())}`,
            window.location.origin + '/'
          ).toString();

          const { error } = await client.auth
            .signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo
              }
            });

          if (error) throw error;

        } catch (error) {
          showMessage(
            error.message ||
            'Login Google gagal dimulai.',
            'error'
          );

          button.disabled = false;
          button.textContent = originalText;
        }
      }
    );

    /* --------------------------------------------------------
       FORGOT PASSWORD
       -------------------------------------------------------- */

    $('#forgotPasswordBtn')?.addEventListener(
      'click',
      async () => {
        const email =
          $('#signInEmail').value.trim();

        if (!email) {
          showMessage(
            'Masukkan email terlebih dahulu.',
            'error'
          );

          return;
        }

        try {
          const { error } = await client.auth
            .resetPasswordForEmail(email, {
              redirectTo:
                `${location.origin}/auth.html?mode=recovery`
            });

          if (error) throw error;

          showMessage(
            'Jika email terdaftar, tautan pemulihan akan dikirim. Periksa inbox dan spam.'
          );

        } catch (error) {
          showMessage(error.message, 'error');
        }
      }
    );

    /* --------------------------------------------------------
       PASSWORD RECOVERY
       -------------------------------------------------------- */

    recoveryForm?.addEventListener(
      'submit',
      async event => {
        event.preventDefault();

        const password =
          $('#newPassword')?.value || '';

        if (password.length < 8) {
          showMessage(
            'Password minimal 8 karakter.',
            'error'
          );

          return;
        }

        try {
          const { error } = await client.auth
            .updateUser({ password });

          if (error) throw error;

          showMessage(
            'Password berhasil diperbarui.'
          );

          setTimeout(() => {
            location.replace('dashboard.html');
          }, 1000);

        } catch (error) {
          showMessage(error.message, 'error');
        }
      }
    );
  }

  /* ==========================================================
     8. USER AUTHORIZATION
     ========================================================== */

  async function saveVehicle(form, user) {
    const data = Object.fromEntries(
      new FormData(form)
    );

    const payload = {
      user_id: user.id,
      vehicle_type:
        data.type === 'Motor'
          ? 'motorcycle'
          : 'car',
      brand: data.brand.trim(),
      model: data.model.trim(),
      production_year:
        data.year ? Number(data.year) : null,
      license_plate:
        data.plate.trim() || null,
      odometer_km:
        data.odometer ? Number(data.odometer) : null
    };

    const { error } = await client
      .from('vehicles')
      .insert(payload);

    if (error) throw error;

    form.reset();

    formFeedback(
      'vehicleFeedback',
      'Kendaraan berhasil disimpan ke akun Kamu.'
    );

    await renderVehiclesFromDb(user);
  }

  /* ==========================================================
     9. GARAGE - LOAD VEHICLES
     ========================================================== */

  async function renderVehiclesFromDb(user) {
    const list = $('#vehicleList');

    if (!list) return;

    const { data, error } = await client
      .from('vehicles')
      .select(
        'id,vehicle_type,brand,model,production_year,license_plate,odometer_km,created_at'
      )
      .eq('user_id', user.id)
      .order('created_at', {
        ascending: false
      });

    if (error) {
      list.innerHTML =
        `<div class="db-empty">${escapeHTML(error.message)}</div>`;

      return;
    }

    if (!data?.length) {
      list.innerHTML =
        '<div class="db-empty">Belum ada kendaraan tersimpan.</div>';

      return;
    }

    list.className = 'vehicle-list db-list';

    list.innerHTML = data.map(vehicle => `
      <article class="db-item">
        <div>
          <h3>
            ${escapeHTML(vehicle.brand)}
            ${escapeHTML(vehicle.model)}
          </h3>

          <p>
            ${vehicle.vehicle_type === 'motorcycle' ? 'Motor' : 'Mobil'}
            · ${escapeHTML(vehicle.production_year || 'Tahun tidak diisi')}
            ${vehicle.license_plate ? ' · ' + escapeHTML(vehicle.license_plate) : ''}
            ${vehicle.odometer_km ? ' · ' + Number(vehicle.odometer_km).toLocaleString('id-ID') + ' km' : ''}
          </p>
        </div>

        <button
          class="btn btn-outline btn-small"
          type="button"
          data-db-delete-vehicle="${vehicle.id}">
          Hapus
        </button>
      </article>
    `).join('');

    $$('[data-db-delete-vehicle]').forEach(button => {
      button.addEventListener('click', async () => {
        if (!confirm('Hapus kendaraan ini?')) return;

        const { error: deleteError } = await client
          .from('vehicles')
          .delete()
          .eq('id', button.dataset.dbDeleteVehicle);

        if (deleteError) {
          notify(deleteError.message);
        } else {
          await renderVehiclesFromDb(user);
        }
      });
    });
  }

  /* ==========================================================
     10. MAINTENANCE REMINDERS
     ========================================================== */

  async function saveReminder(form, user) {
    const data = Object.fromEntries(
      new FormData(form)
    );

    const { error } = await client
      .from('maintenance_reminders')
      .insert({
        user_id: user.id,
        task_name: data.task,
        vehicle_label: data.vehicle.trim(),
        due_date: data.date,
        note: data.note?.trim() || null
      });

    if (error) throw error;

    form.reset();

    formFeedback(
      'reminderFeedback',
      'Pengingat servis berhasil disimpan.'
    );

    await renderRemindersFromDb(user);
  }

  async function renderRemindersFromDb(user) {
    const list = $('#reminderList');

    if (!list) return;

    const { data, error } = await client
      .from('maintenance_reminders')
      .select(
        'id,task_name,vehicle_label,due_date,note,is_completed'
      )
      .eq('user_id', user.id)
      .order('due_date');

    if (error) {
      list.innerHTML =
        `<div class="db-empty">${escapeHTML(error.message)}</div>`;

      return;
    }

    if (!data?.length) {
      list.innerHTML =
        '<div class="db-empty">Belum ada pengingat tersimpan.</div>';

      return;
    }

    list.innerHTML = data.map(reminder => `
      <article class="db-item">
        <div>
          <h3>${escapeHTML(reminder.task_name)}</h3>
          <p>
            ${escapeHTML(reminder.vehicle_label)}
            · ${new Date(reminder.due_date + 'T00:00:00').toLocaleDateString('id-ID')}
            ${reminder.note ? ' · ' + escapeHTML(reminder.note) : ''}
          </p>
        </div>

        <button
          class="btn btn-outline btn-small"
          type="button"
          data-db-delete-reminder="${reminder.id}">
          Hapus
        </button>
      </article>
    `).join('');

    $$('[data-db-delete-reminder]').forEach(button => {
      button.addEventListener('click', async () => {
        if (!confirm('Hapus pengingat ini?')) return;

        const { error: deleteError } = await client
          .from('maintenance_reminders')
          .delete()
          .eq('id', button.dataset.dbDeleteReminder);

        if (deleteError) {
          notify(deleteError.message);
        } else {
          await renderRemindersFromDb(user);
        }
      });
    });
  }

  /* ==========================================================
     11. COST ESTIMATION
     ========================================================== */

  async function saveEstimate(user) {
    const vehicleType = $('#vehicleType')?.value;
    const category = $('#problemCategory')?.value;
    const severity = $('#problemSeverity')?.value;
    const area = $('#estimateArea')?.value?.trim() || '';

    const bases = {
      motor: {
        battery: [120000, 450000],
        brake: [80000, 380000],
        tire: [90000, 420000],
        engine: [180000, 950000],
        suspension: [140000, 650000],
        service: [80000, 300000]
      },
      car: {
        battery: [350000, 1500000],
        brake: [180000, 1200000],
        tire: [450000, 1800000],
        engine: [400000, 2800000],
        suspension: [350000, 2200000],
        service: [250000, 1100000]
      }
    };

    if (!bases[vehicleType]?.[category]) {
      throw new Error(
        'Pilihan kendaraan atau kategori masalah tidak valid.'
      );
    }

    const multiplier = {
      unknown: 1,
      light: 0.8,
      medium: 1.25,
      heavy: 1.7
    }[severity] || 1;

    const [baseMin, baseMax] =
      bases[vehicleType][category];

    const minimum =
      Math.round((baseMin * multiplier) / 10000) * 10000;

    const maximum =
      Math.round((baseMax * multiplier) / 10000) * 10000;

    const labor = Math.round(
      ((minimum + maximum) * 0.34 / 2) / 10000
    ) * 10000;

    const parts = Math.round(
      ((minimum + maximum) * 0.66 / 2) / 10000
    ) * 10000;

    const { error } = await client
      .from('estimates')
      .insert({
        user_id: user.id,
        vehicle_type:
          vehicleType === 'motor'
            ? 'motorcycle'
            : 'car',
        problem_category: category,
        severity,
        area: area || null,
        estimated_min: minimum,
        estimated_max: maximum,
        labor_amount: labor,
        parts_amount: parts,
        is_simulated: true
      });

    if (error) throw error;

    notify(
      'Estimasi simulasi berhasil disimpan ke akun Kamu.'
    );
  }

  /* ==========================================================
     12. DIAGNOSIS FILE STORAGE
     ========================================================== */

  async function uploadDiagnosis(
    user,
    file,
    inputType,
    durationSeconds = null
  ) {
    if (!file) return;

    const maximumSize =
      inputType === 'photo'
        ? 8 * 1024 * 1024
        : 12 * 1024 * 1024;

    if (file.size > maximumSize) {
      throw new Error(
        'Ukuran file terlalu besar.'
      );
    }

    const safeName = file.name
      ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      : `${inputType}-${Date.now()}`;

    const storagePath =
      `${user.id}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await client
      .storage
      .from('diagnosis-media')
      .upload(storagePath, file, {
        contentType:
          file.type || 'application/octet-stream',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { error: rowError } = await client
      .from('diagnoses')
      .insert({
        user_id: user.id,
        input_type: inputType,
        status: 'simulated',
        storage_path: storagePath,
        original_filename: safeName,
        mime_type: file.type || null,
        file_size_bytes: file.size,
        duration_seconds: durationSeconds,
        summary:
          'File tersimpan. Analisis AI masih dalam mode simulasi.',
        result_json: {
          mode: 'simulation',
          message:
            'File disimpan sebagai riwayat input. Belum diproses model AI.'
        },
        disclaimer:
          'Hasil belum merupakan diagnosis teknis. Lakukan pemeriksaan mekanik profesional.'
      });

    if (rowError) {
      await client.storage
        .from('diagnosis-media')
        .remove([storagePath]);

      throw rowError;
    }

    notify(
      'File dan riwayat berhasil disimpan secara privat.'
    );
  }

  /* ==========================================================
     13. MECHANIC SERVICE REQUEST
     ========================================================== */

  async function saveServiceRequest(form, user) {
    const data = Object.fromEntries(
      new FormData(form)
    );

    const consent =
      form.querySelector('input[type="checkbox"]')?.checked === true;

    const { data: result, error } = await client
      .from('service_requests')
      .insert({
        requested_by: user.id,
        vehicle_type:
          data.vehicle === 'Motor'
            ? 'motorcycle'
            : 'car',
        vehicle_description: data.vehicle,
        requested_time: data.time,
        contact_name: data.name.trim(),
        contact_phone: data.phone.trim(),
        address: data.location.trim(),
        problem_description: data.problem.trim(),
        customer_consent: consent,
        status: 'submitted'
      })
      .select('id')
      .single();

    if (error) throw error;

    form.reset();

    formFeedback(
      'mechanicFeedback',
      `Permintaan tersimpan. Nomor referensi: ${result.id}. Belum ada mekanik yang ditugaskan.`
    );

    notify(
      'Permintaan bantuan berhasil dicatat.'
    );
  }

  /* ==========================================================
     14. CONTACT FORM
     ========================================================== */

  async function saveContact(form) {
    const data = Object.fromEntries(
      new FormData(form)
    );

    const { error } = await client
      .from('contact_messages')
      .insert({
        name: data.contactName.trim(),
        email: data.contactEmail.trim(),
        message: data.contactMessage.trim(),
        subject: 'Pesan dari website BengkelinAI'
      });

    if (error) throw error;

    form.reset();

    formFeedback(
      'contactFeedback',
      'Pesan berhasil dikirim.'
    );
  }

  /* ==========================================================
     15. PARTNER APPLICATION
     ========================================================== */

  async function savePartnerApplication(form, user) {
    const data = Object.fromEntries(
      new FormData(form)
    );

    const { error } = await client
      .from('partner_applications')
      .insert({
        user_id: user.id,
        requested_role: data.requested_role,
        organization_name:
          data.organization_name?.trim() || null,
        contact_phone: data.contact_phone.trim(),
        address: data.address.trim(),
        city: data.city.trim(),
        province: data.province.trim(),
        experience_years:
          data.experience_years
            ? Number(data.experience_years)
            : null,
        message: data.message.trim()
      });

    if (error) throw error;

    form.reset();

    formFeedback(
      'partnerApplicationFeedback',
      'Pengajuan berhasil dikirim. Role akan ditinjau admin.'
    );
  }

  /* ==========================================================
     16. ACTIVITY HISTORY
     ========================================================== */

  async function renderHistory(user) {
    const target = $('#activityList');

    if (!target) return;

    const [
      diagnoses,
      estimates,
      requests
    ] = await Promise.all([
      client.from('diagnoses')
        .select('id,input_type,status,summary,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30),

      client.from('estimates')
        .select('id,problem_category,estimated_min,estimated_max,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30),

      client.from('service_requests')
        .select('id,status,vehicle_description,created_at')
        .eq('requested_by', user.id)
        .order('created_at', { ascending: false })
        .limit(30)
    ]);

    const rows = [];

    if (!diagnoses.error) {
      (diagnoses.data || []).forEach(item => {
        rows.push({
          date: item.created_at,
          title:
            `Diagnosis ${item.input_type === 'photo' ? 'foto' : 'suara'} · ${item.status}`,
          detail:
            item.summary || 'Input tersimpan.'
        });
      });
    }

    if (!estimates.error) {
      (estimates.data || []).forEach(item => {
        rows.push({
          date: item.created_at,
          title: 'Estimasi biaya · simulasi',
          detail:
            `${item.problem_category} · Rp${Number(item.estimated_min).toLocaleString('id-ID')}–Rp${Number(item.estimated_max).toLocaleString('id-ID')}`
        });
      });
    }

    if (!requests.error) {
      (requests.data || []).forEach(item => {
        rows.push({
          date: item.created_at,
          title: 'Permintaan mekanik',
          detail:
            `${item.vehicle_description} · Status ${item.status}`
        });
      });
    }

    rows.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    if (!rows.length) {
      target.innerHTML =
        '<div class="db-empty">Belum ada riwayat tersimpan.</div>';

      return;
    }

    target.innerHTML = rows.slice(0, 60).map(item => `
      <article class="activity-card">
        <span class="activity-card-icon">↗</span>
        <div>
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.detail)}</p>
          <time>${new Date(item.date).toLocaleString('id-ID')}</time>
        </div>
      </article>
    `).join('');
  }

  /* ==========================================================
     17. PUBLIC WORKSHOP LIST
     ========================================================== */

  async function loadPublicWorkshops() {
    const grid = $('#workshopGrid');

    if (!grid) return;

    const { data, error } = await client
      .from('workshops')
      .select(
        'id,name,description,city,province,vehicle_types,services,contact_phone'
      )
      .eq('is_active', true)
      .eq('verification_status', 'verified')
      .order('name');

    if (error || !data?.length) {
      return;
    }

    grid.innerHTML = data.map(workshop => `
      <article
        class="workshop-card"
        data-name="${escapeHTML(workshop.name)}"
        data-services="${escapeHTML((workshop.services || []).join(','))}"
        data-type="${
          (workshop.vehicle_types || []).includes('motorcycle') &&
          (workshop.vehicle_types || []).includes('car')
            ? 'both'
            : (workshop.vehicle_types || [])[0] === 'car'
              ? 'car'
              : 'motor'
        }">

        <div class="workshop-card-image">
          <span class="demo-tag">MITRA TERVERIFIKASI</span>
        </div>

        <div class="workshop-card-body">
          <div class="workshop-meta">
            <span>${escapeHTML((workshop.vehicle_types || []).join(' & '))}</span>

            <span class="workshop-distance">
              ${escapeHTML([workshop.city, workshop.province].filter(Boolean).join(', '))}
            </span>
          </div>

          <h3>${escapeHTML(workshop.name)}</h3>

          <p>
            ${escapeHTML(workshop.description || 'Informasi layanan bengkel.')}
          </p>

          <div class="service-tags">
            ${(workshop.services || []).map(service =>
              `<span>${escapeHTML(service)}</span>`
            ).join('')}
          </div>

          <a
            class="btn btn-outline btn-full"
            href="mekanik.html">
            Hubungi melalui BengkelinAI
          </a>
        </div>
      </article>
    `).join('');

    [
      'workshopSearch',
      'workshopTypeFilter',
      'workshopServiceFilter'
    ].forEach(id => {
      const element = document.getElementById(id);

      if (element) {
        element.dispatchEvent(
          new Event(
            id === 'workshopSearch' ? 'input' : 'change'
          )
        );
      }
    });
  }

  /* ==========================================================
     18. DATABASE FORM HANDLERS
     ========================================================== */

  function installPersonalFormHandlers() {
    document.addEventListener(
      'submit',
      async event => {
        const form = event.target;

        const supportedForms = [
          'vehicleForm',
          'reminderForm',
          'mechanicForm',
          'contactForm',
          'estimatorForm',
          'partnerApplicationForm'
        ];

        if (
          !form ||
          !supportedForms.includes(form.id)
        ) {
          return;
        }

        /* Cost estimator keeps its original demo calculation. */

        if (form.id === 'estimatorForm') {
          if (!form.reportValidity()) return;

          const user = BAI.session?.user;

          if (!user) {
            notify(
              'Estimasi demo ditampilkan. Masuk untuk menyimpan riwayat.'
            );

            return;
          }

          window.setTimeout(() => {
            saveEstimate(user).catch(error => {
              notify(
                error.message ||
                'Riwayat estimasi gagal disimpan.'
              );
            });
          }, 50);

          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        try {
          if (!form.reportValidity()) return;

          if (form.id === 'contactForm') {
            await saveContact(form);

            notify('Pesan berhasil disimpan.');

            return;
          }

          const user = await BAI.requireUser();

          if (!user) return;

          if (form.id === 'vehicleForm') {
            await saveVehicle(form, user);

          } else if (form.id === 'reminderForm') {
            await saveReminder(form, user);

          } else if (form.id === 'mechanicForm') {
            await saveServiceRequest(form, user);

          } else if (form.id === 'partnerApplicationForm') {
            await savePartnerApplication(form, user);
          }

        } catch (error) {
          console.error(
            'Supabase form save error:',
            error
          );

          const feedbackMap = {
            vehicleForm: 'vehicleFeedback',
            reminderForm: 'reminderFeedback',
            mechanicForm: 'mechanicFeedback',
            contactForm: 'contactFeedback',
            partnerApplicationForm: 'partnerApplicationFeedback'
          };

          const feedbackId = feedbackMap[form.id];

          if (feedbackId) {
            formFeedback(
              feedbackId,
              error.message ||
              'Data gagal disimpan. Periksa koneksi dan kebijakan database.',
              'error'
            );
          } else {
            notify(
              error.message ||
              'Gagal menyimpan data.'
            );
          }
        }
      },
      true
    );
  }

  /* ==========================================================
     19. PHOTO AND SOUND DIAGNOSIS STORAGE
     ========================================================== */

  function installDiagnosisSaveHandlers() {
    let latestAudio = null;

    window.addEventListener(
      'bai:audio-ready',
      event => {
        latestAudio = event.detail?.blob
          ? {
              blob: event.detail.blob,
              duration:
                event.detail.durationSeconds || null
            }
          : null;
      }
    );

    document.addEventListener(
      'click',
      async event => {
        if (!(event.target instanceof Element)) return;

        const photoButton =
          event.target.closest('#analyzePhotoBtn');

        const soundButton =
          event.target.closest('#analyzeSoundBtn');

        if (!photoButton && !soundButton) return;

        const clickedButton =
          photoButton || soundButton;

        if (clickedButton.dataset.saving === 'true') {
          return;
        }

        const user = BAI.session?.user;

        if (!user) {
          notify(
            'Mode simulasi aktif. Masuk dan berikan persetujuan untuk menyimpan file.'
          );

          return;
        }

        if (!$('#diagnosisSaveConsent')?.checked) {
          notify(
            'Centang persetujuan penyimpanan privat terlebih dahulu.'
          );

          return;
        }

        clickedButton.dataset.saving = 'true';

        try {
          if (photoButton) {
            const file = $('#photoInput')?.files?.[0];

            if (file) {
              await uploadDiagnosis(
                user,
                file,
                'photo'
              );
            }
          }

          if (soundButton && latestAudio?.blob) {
            const mime = latestAudio.blob.type || 'audio/webm';

            const extension =
              mime.includes('mp4') ? 'm4a' :
              mime.includes('ogg') ? 'ogg' :
              'webm';

            const normalizedMime =
              mime.split(';')[0];

            const file = new File(
              [latestAudio.blob],
              `rekaman-mesin-${Date.now()}.${extension}`,
              { type: normalizedMime }
            );

            await uploadDiagnosis(
              user,
              file,
              'sound',
              latestAudio.duration
            );
          }

        } catch (error) {
          console.error(
            'Diagnosis upload error:',
            error
          );

          notify(
            error.message ||
            'File diagnosis gagal disimpan.'
          );

        } finally {
          clickedButton.dataset.saving = 'false';
        }
      },
      true
    );
  }

  /* ==========================================================
     20. LOAD ACCOUNT DATA
     ========================================================== */

  async function renderAccountData() {
    const { data, error } =
      await client.auth.getSession();

    if (error) throw error;

    const session = data?.session || null;

    BAI.session = session;

    await updateAuthNav(session);

    if (!session?.user) return;

    const user = session.user;
    const page = document.body.dataset.page;

    if (page === 'garasi') {
      await renderVehiclesFromDb(user);
    }

    if (page === 'pengingat') {
      await renderRemindersFromDb(user);
    }

    if (page === 'riwayat') {
      await renderHistory(user);
    }

    if (page === 'bengkel') {
      await loadPublicWorkshops();
    }

    if (page === 'dashboard') {
      const main = $('#main-content');

      if (main && !$('#accountWelcome')) {
        const panel = document.createElement('section');

        panel.className = 'section section-pad';
        panel.id = 'accountWelcome';

        panel.innerHTML = `
          <div class="container">
            <div class="info-callout">
              <strong>
                Akun aktif: ${escapeHTML(
                  BAI.profile?.full_name || user.email
                )}
              </strong>

              <p>
                Role akun: ${escapeHTML(
                  BAI.profile?.role || 'customer'
                )}.
                Data pribadi pada halaman Garasi,
                Pengingat, dan Riwayat disimpan ke Supabase.
              </p>

              <button
                class="btn btn-outline btn-small"
                type="button"
                id="dashboardLogoutShortcut">
                Keluar dari akun
              </button>
            </div>
          </div>
        `;

        main.prepend(panel);

        $('#dashboardLogoutShortcut')?.addEventListener(
          'click',
          async () => {
            const { error } = await client.auth.signOut({
              scope: 'local'
            });

            if (error) {
              notify(error.message);
              return;
            }

            BAI.session = null;
            BAI.profile = null;

            location.replace('index.html');
          }
        );
      }
    }
  }

  /* ==========================================================
     21. AUTH STATE LISTENER
     ========================================================== */

  function installAuthStateListener() {
    client.auth.onAuthStateChange(
      (event, session) => {
        /*
          Keep this callback synchronous.

          DOM updates and database profile lookups run after
          Supabase releases its internal auth lock.
        */

        BAI.session = session || null;

        if (event === 'SIGNED_OUT') {
          BAI.profile = null;
        }

        window.setTimeout(() => {
          updateAuthNav(session).catch(error => {
            console.warn(
              'BengkelinAI navbar update:',
              error
            );
          });
        }, 0);
      }
    );
  }

  /* ==========================================================
     22. RESTORE SESSION ON PAGE LOAD
     ========================================================== */

  function installSessionRefresh() {
    const refresh = async () => {
      try {
        const { data, error } =
          await client.auth.getSession();

        if (error) throw error;

        await updateAuthNav(
          data?.session || null
        );

      } catch (error) {
        console.warn(
          'BengkelinAI session refresh:',
          error
        );
      }
    };

    window.addEventListener('pageshow', refresh);

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'visible') {
          refresh();
        }
      }
    );
  }

  /* ==========================================================
     23. APPLICATION INITIALIZATION
     ========================================================== */

  document.addEventListener(
    'DOMContentLoaded',
    () => {
      ensureAuthNav();

      initAuthPage();

      installPersonalFormHandlers();

      installDiagnosisSaveHandlers();

      installAuthStateListener();

      installSessionRefresh();

      renderAccountData().catch(error => {
        console.error(
          'BengkelinAI initialization error:',
          error
        );
      });
    }
  );

})();
