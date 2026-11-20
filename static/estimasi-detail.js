/* ================================================================
   BENGKELINAI — DETAILED COST ESTIMATOR + CHAT ASSISTANT
   Frontend: HTML / CSS / JavaScript
   Prices: illustrative simulation only, not market quotations.
   Supabase: uses window.BENGKELINAI_DB.client when configured.
   ================================================================ */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', maximumFractionDigits:0}).format(Math.round(Number(n) || 0));
  const round = n => Math.round(Number(n) / 1000) * 1000;
  const toast = msg => typeof window.showToast === 'function' ? window.showToast(msg) : console.info('[BengkelinAI]', msg);

  /* ----------------------------------------------------------------
     1. PRICE CATALOG
     All figures are illustrative ranges in IDR. They must be replaced
     with verified supplier/workshop data before public commercial use.
     ---------------------------------------------------------------- */
  const PARTS = {
    oil:{name:'Oli mesin',note:'Jenis, viskositas, standar API/JASO dan volume wajib mengikuti buku manual kendaraan.',unit:'paket',motor:[45000,180000],car:[220000,950000]},
    oilFilter:{name:'Filter oli',note:'Cocokkan nomor komponen dan tipe filter dengan kode mesin.',unit:'buah',motor:[18000,85000],car:[35000,220000]},
    airFilter:{name:'Filter udara mesin',note:'Dapat dibersihkan atau diganti. Keputusan mengikuti kondisi elemen filter.',unit:'buah',motor:[25000,150000],car:[65000,420000]},
    spark:{name:'Busi',note:'Tipe, heat range, panjang ulir dan jumlah busi mengikuti spesifikasi mesin.',unit:'buah / set',motor:[18000,110000],car:[45000,950000]},
    coil:{name:'Koil pengapian',note:'Ukur percikan dan periksa konektor sebelum mengganti koil.',unit:'buah',motor:[70000,320000],car:[180000,1250000]},
    injectorClean:{name:'Pembersihan injektor',note:'Jasa pembersihan; bukan penggantian injektor baru.',unit:'paket',motor:[45000,180000],car:[150000,650000]},
    throttleClean:{name:'Pembersihan throttle body',note:'Pembersihan mengikuti prosedur sistem injeksi dan kalibrasi jika diperlukan.',unit:'paket',motor:[35000,140000],car:[100000,480000]},
    fuelFilter:{name:'Filter bahan bakar',note:'Posisi dan interval penggantian berbeda menurut model kendaraan.',unit:'buah',motor:[25000,180000],car:[85000,650000]},
    fuelPump:{name:'Pompa bahan bakar',note:'Tekanan dan debit perlu diukur sebelum memutuskan penggantian.',unit:'unit',motor:[180000,850000],car:[450000,3200000]},
    gasket:{name:'Gasket / seal mesin',note:'Daftar aktual ditentukan berdasarkan titik kebocoran yang ditemukan.',unit:'set',motor:[25000,380000],car:[80000,1450000]},
    pistonRing:{name:'Ring piston / komponen top-end',note:'Kandidat pemeriksaan lanjutan. Penggantian perlu didukung hasil tes kompresi/bongkar.',unit:'set',motor:[95000,650000],car:[350000,2800000]},
    timingSet:{name:'Timing belt / chain set',note:'Khusus mesin yang memakai sistem terkait; interval dan kode part wajib diverifikasi.',unit:'set',motor:[120000,650000],car:[650000,6500000]},
    engineMount:{name:'Engine mounting',note:'Periksa retak, ambles, dan getaran sebelum penggantian.',unit:'buah',motor:[0,0],car:[250000,1850000]},
    valveAdjust:{name:'Shim / seal / komponen klep',note:'Kebutuhan baru dapat diketahui setelah pengukuran celah dan inspeksi.',unit:'paket',motor:[30000,280000],car:[120000,1250000]},
    brakePadFront:{name:'Kampas rem depan',note:'Material dan bentuk harus sesuai kaliper serta tipe kendaraan.',unit:'set',motor:[45000,250000],car:[180000,1250000]},
    brakePadRear:{name:'Kampas rem belakang',note:'Untuk cakram atau tromol; pastikan tipe rem kendaraan.',unit:'set',motor:[35000,190000],car:[150000,1100000]},
    brakeShoe:{name:'Kampas rem tromol',note:'Periksa diameter tromol dan kondisi permukaan rumah rem.',unit:'set',motor:[35000,180000],car:[180000,950000]},
    brakeFluid:{name:'Minyak rem',note:'Gunakan DOT sesuai rekomendasi pabrikan; jangan mencampur spesifikasi sembarangan.',unit:'botol / paket',motor:[20000,95000],car:[55000,280000]},
    brakeDisc:{name:'Cakram rem',note:'Ukur ketebalan minimum dan run-out. Tidak otomatis harus diganti karena bergetar.',unit:'buah',motor:[150000,900000],car:[450000,3800000]},
    caliperKit:{name:'Seal / repair kit kaliper',note:'Periksa piston, seal, pin slider, dan korosi kaliper.',unit:'kit',motor:[35000,260000],car:[120000,850000]},
    masterBrake:{name:'Master rem / repair kit',note:'Periksa kebocoran dan tekanan hidrolik sebelum penggantian.',unit:'unit / kit',motor:[65000,550000],car:[250000,1850000]},
    brakeHose:{name:'Selang rem',note:'Periksa retak, menggelembung, rembes, dan koneksi fitting.',unit:'buah / set',motor:[45000,350000],car:[180000,1450000]},
    battery:{name:'Aki / baterai',note:'Kapasitas Ah, CCA, dimensi dan tipe terminal harus sesuai kendaraan.',unit:'unit',motor:[180000,850000],car:[650000,3500000]},
    relay:{name:'Relay / solenoid starter',note:'Uji input, output dan kondisi kontak relay sebelum penggantian.',unit:'unit',motor:[35000,260000],car:[85000,850000]},
    regulator:{name:'Regulator / rectifier',note:'Ukur tegangan pengisian pada kondisi yang ditentukan pabrikan.',unit:'unit',motor:[120000,650000],car:[0,0]},
    stator:{name:'Spul / stator pengisian',note:'Ukur tahanan dan output. Jangan mengganti hanya berdasarkan gejala aki tekor.',unit:'unit',motor:[180000,950000],car:[0,0]},
    starterMotor:{name:'Motor starter',note:'Periksa brush, armature, bearing, kabel massa dan suplai arus.',unit:'unit',motor:[180000,850000],car:[550000,3200000]},
    alternator:{name:'Alternator / dinamo ampere',note:'Periksa output pengisian, belt, pulley, regulator dan koneksi.',unit:'unit',motor:[0,0],car:[750000,5500000]},
    fuseWiring:{name:'Sekring, soket dan kabel',note:'Biaya bergantung panjang kabel, konektor, titik kerusakan dan waktu penelusuran.',unit:'paket',motor:[5000,250000],car:[15000,850000]},
    bulb:{name:'Bohlam / lampu',note:'Tipe bohlam, LED module dan housing harus cocok dengan kendaraan.',unit:'buah / set',motor:[10000,250000],car:[25000,950000]},
    sensor:{name:'Sensor / switch',note:'Lakukan pemeriksaan kelistrikan dan scan jika sistem mendukung.',unit:'buah',motor:[35000,650000],car:[120000,2800000]},
    cvtBelt:{name:'V-belt CVT',note:'Periksa retak, lebar dan batas servis sesuai manual kendaraan.',unit:'buah',motor:[85000,480000],car:[0,0]},
    cvtRoller:{name:'Roller / slider CVT',note:'Berat dan ukuran harus sesuai spesifikasi CVT.',unit:'set',motor:[35000,250000],car:[0,0]},
    clutchShoe:{name:'Kampas ganda / clutch shoe',note:'Periksa ketebalan, kontaminasi dan kondisi pegas.',unit:'set',motor:[85000,520000],car:[0,0]},
    clutchBell:{name:'Rumah kopling CVT',note:'Periksa glazing, ovalitas dan permukaan kerja.',unit:'buah',motor:[150000,850000],car:[0,0]},
    cvtFilter:{name:'Filter / saringan CVT',note:'Tergantung desain model; tidak semua motor memiliki filter terpisah.',unit:'buah',motor:[15000,120000],car:[0,0]},
    clutchKit:{name:'Clutch kit / kampas kopling',note:'Komponen dipilih berdasarkan kode transmisi dan mesin.',unit:'set',motor:[120000,750000],car:[850000,6500000]},
    clutchCable:{name:'Kabel kopling / adjuster',note:'Untuk sistem kopling mekanis; sistem hidrolik memerlukan pemeriksaan berbeda.',unit:'buah',motor:[25000,180000],car:[80000,550000]},
    clutchBearing:{name:'Release bearing',note:'Pemeriksaan biasanya dilakukan ketika transmisi dibongkar.',unit:'buah',motor:[0,0],car:[220000,1500000]},
    chain:{name:'Rantai penggerak',note:'Panjang, pitch dan tipe seal harus cocok dengan sprocket.',unit:'buah',motor:[65000,450000],car:[0,0]},
    sprocket:{name:'Gear set / sprocket',note:'Periksa keausan gigi depan dan belakang sebagai satu sistem.',unit:'set',motor:[85000,650000],car:[0,0]},
    gearOil:{name:'Oli gardan / transmisi',note:'Jenis dan volume mengikuti spesifikasi model.',unit:'botol / paket',motor:[25000,160000],car:[120000,650000]},
    atf:{name:'ATF / fluida transmisi otomatis',note:'Jenis fluida harus sesuai kode transmisi. Prosedur penggantian bisa berbeda.',unit:'paket',motor:[0,0],car:[250000,1800000]},
    transFilter:{name:'Filter transmisi dan gasket pan',note:'Tidak semua transmisi memiliki filter yang diservis terpisah.',unit:'paket',motor:[0,0],car:[180000,1350000]},
    transMount:{name:'Transmission mounting',note:'Periksa retak, ambles dan gejala hentakan.',unit:'buah',motor:[0,0],car:[250000,1850000]},
    tireFront:{name:'Ban depan',note:'Ukuran, indeks beban/kecepatan dan pola tapak harus sesuai.',unit:'buah',motor:[120000,950000],car:[550000,3500000]},
    tireRear:{name:'Ban belakang',note:'Harga per ban. Pastikan ukuran serta indeks sesuai kendaraan.',unit:'buah',motor:[140000,1200000],car:[550000,3800000]},
    valve:{name:'Pentil / valve ban',note:'Untuk TPMS, sensor dan valve khusus memerlukan part yang sesuai.',unit:'buah',motor:[8000,180000],car:[15000,650000]},
    wheelBearing:{name:'Bearing roda',note:'Periksa kelonggaran, suara dan kondisi dudukan bearing.',unit:'buah',motor:[25000,220000],car:[120000,950000]},
    shock:{name:'Shock absorber',note:'Harga per unit. Pemeriksaan kebocoran dan redaman diperlukan.',unit:'buah',motor:[180000,1500000],car:[450000,4200000]},
    forkSeal:{name:'Seal shock depan',note:'Cek as shock dari goresan dan kelurusan.',unit:'set',motor:[35000,220000],car:[0,0]},
    forkOil:{name:'Oli shock',note:'Kekentalan dan volume harus mengikuti model.',unit:'paket',motor:[25000,140000],car:[0,0]},
    bushing:{name:'Bushing arm / stabilizer',note:'Posisi dan material karet memengaruhi harga.',unit:'buah / set',motor:[35000,240000],car:[80000,950000]},
    ballJoint:{name:'Ball joint',note:'Periksa kelonggaran dan apakah menyatu dengan control arm.',unit:'buah',motor:[0,0],car:[180000,1450000]},
    tieRod:{name:'Tie rod end / rack end',note:'Periksa kelonggaran; spooring biasanya diperlukan setelah pekerjaan.',unit:'buah',motor:[0,0],car:[150000,1150000]},
    stabilizerLink:{name:'Stabilizer link',note:'Periksa karet dan ball joint link.',unit:'buah / pasang',motor:[0,0],car:[180000,1250000]},
    coolant:{name:'Coolant radiator',note:'Jenis coolant dan kapasitas mengikuti spesifikasi kendaraan.',unit:'paket',motor:[45000,280000],car:[120000,650000]},
    thermostat:{name:'Thermostat',note:'Pastikan suhu kerja dan kode part cocok.',unit:'unit',motor:[120000,550000],car:[180000,1250000]},
    radiatorCap:{name:'Tutup radiator',note:'Rating tekanan harus sesuai sistem pendingin.',unit:'buah',motor:[35000,180000],car:[50000,280000]},
    radiatorHose:{name:'Selang radiator dan clamp',note:'Ganti berdasarkan retak, mengeras atau kebocoran.',unit:'paket',motor:[45000,350000],car:[100000,950000]},
    waterPump:{name:'Water pump',note:'Periksa kebocoran dan sirkulasi. Pada beberapa model terkait timing set.',unit:'unit',motor:[180000,850000],car:[450000,3200000]},
    fanMotor:{name:'Motor kipas radiator',note:'Uji motor, relay, resistor dan perintah sensor.',unit:'unit',motor:[150000,850000],car:[350000,2600000]},
    cabinFilter:{name:'Filter kabin',note:'Ukuran dan tipe mengikuti model; dapat memengaruhi aliran udara AC.',unit:'buah',motor:[0,0],car:[45000,350000]},
    refrigerant:{name:'Refrigeran dan oli AC',note:'Jenis refrigeran wajib sesuai label kendaraan; tidak boleh dicampur.',unit:'paket',motor:[0,0],car:[120000,850000]},
    expansionValve:{name:'Expansion valve / O-ring',note:'Penggantian setelah uji tekanan dan kebocoran mendukung.',unit:'paket',motor:[0,0],car:[180000,1350000]},
    acClutch:{name:'Magnetic clutch / bearing kompresor',note:'Bedakan kerusakan clutch dari kerusakan internal kompresor.',unit:'paket',motor:[0,0],car:[350000,2200000]},
    acHose:{name:'Selang / sambungan AC',note:'Harga tergantung posisi, panjang dan jenis selang.',unit:'paket',motor:[0,0],car:[180000,1450000]},
    muffler:{name:'Knalpot / muffler',note:'Periksa kebocoran, bracket, korosi dan standar emisi.',unit:'unit / paket',motor:[120000,950000],car:[350000,4200000]},
    oxygenSensor:{name:'Oxygen sensor',note:'Perlu pemeriksaan kode kerusakan dan data sensor sebelum mengganti.',unit:'buah',motor:[150000,850000],car:[350000,2800000]},
    catalytic:{name:'Pemeriksaan / komponen katalis',note:'Pemeriksaan aliran dan emisi; penggantian mengikuti hasil uji.',unit:'paket',motor:[0,0],car:[350000,6500000]},
    acBelt:{name:'Drive belt / tensioner AC',note:'Bergantung konfigurasi belt dan mesin.',unit:'buah / paket',motor:[0,0],car:[150000,1350000]}
  };

  const LABOR = {
    inspection:{name:'Pemeriksaan awal dan pencatatan keluhan',note:'Inspeksi visual, wawancara gejala dan pemeriksaan dasar.',motor:[25000,90000],car:[50000,180000]},
    scan:{name:'Scan ECU / OBD dan pembacaan data',note:'Ketersediaan bergantung tahun dan protokol kendaraan; kode harus ditafsirkan, bukan langsung mengganti part.',motor:[35000,180000],car:[75000,350000]},
    tune:{name:'Tune-up / penyetelan dasar',note:'Pekerjaan disesuaikan sistem karburator atau injeksi.',motor:[50000,220000],car:[180000,750000]},
    fuelService:{name:'Pemeriksaan sistem bahan bakar',note:'Pemeriksaan suplai, tekanan dan kebocoran.',motor:[35000,180000],car:[100000,450000]},
    leakTest:{name:'Pemeriksaan kebocoran',note:'Metode pemeriksaan dipilih sesuai cairan dan area yang dicurigai.',motor:[25000,120000],car:[75000,350000]},
    topEnd:{name:'Pemeriksaan kompresi / top-end',note:'Tes kompresi dan pemeriksaan lanjutan sebelum pembongkaran besar.',motor:[100000,450000],car:[180000,850000]},
    brakeCheck:{name:'Pemeriksaan sistem pengereman',note:'Kampas, cakram/tromol, kaliper, selang dan kebocoran.',motor:[25000,100000],car:[75000,250000]},
    padReplace:{name:'Jasa penggantian kampas rem',note:'Bongkar pasang, pembersihan dudukan dan uji fungsi.',motor:[35000,140000],car:[100000,450000]},
    bleed:{name:'Bleeding / penggantian minyak rem',note:'Pembuangan udara dan pengisian sesuai prosedur.',motor:[35000,130000],car:[100000,450000]},
    discJob:{name:'Jasa pekerjaan cakram rem',note:'Bongkar pasang dan pemeriksaan run-out dasar.',motor:[45000,180000],car:[120000,550000]},
    electrical:{name:'Pemeriksaan kelistrikan',note:'Pengukuran aki, pengisian, kontinuitas, kabel massa dan konektor.',motor:[30000,140000],car:[85000,350000]},
    batteryReplace:{name:'Jasa penggantian aki',note:'Pemasangan, pengamanan terminal dan pemeriksaan tegangan.',motor:[15000,60000],car:[50000,180000]},
    starterJob:{name:'Pemeriksaan rangkaian starter',note:'Switch, relay, motor starter, kabel dan arus.',motor:[30000,140000],car:[100000,450000]},
    cvtClean:{name:'Servis dan pembersihan CVT',note:'Bongkar cover, pembersihan dan pemeriksaan komponen CVT.',motor:[50000,180000],car:[0,0]},
    cvtReplace:{name:'Jasa penggantian komponen CVT',note:'Bongkar pasang dan pemeriksaan rumah CVT.',motor:[45000,250000],car:[0,0]},
    clutchJob:{name:'Jasa pekerjaan kopling / transmisi',note:'Waktu kerja bergantung konstruksi dan akses komponen.',motor:[80000,450000],car:[850000,4500000]},
    chainJob:{name:'Setel dan servis rantai penggerak',note:'Setel kekencangan, pelumasan dan pemeriksaan alignment roda.',motor:[15000,90000],car:[0,0]},
    tireCheck:{name:'Pemeriksaan ban dan roda',note:'Tekanan, tapak, dinding ban, pentil dan bearing.',motor:[15000,75000],car:[45000,180000]},
    tireFit:{name:'Jasa bongkar pasang ban',note:'Harga tergantung ukuran, jenis pelek dan alat yang digunakan.',motor:[25000,120000],car:[50000,250000]},
    balance:{name:'Balancing roda',note:'Penyetelan keseimbangan roda sesuai prosedur bengkel.',motor:[0,0],car:[30000,150000]},
    alignment:{name:'Spooring / wheel alignment',note:'Geometri roda diperiksa dan disetel setelah kondisi kaki-kaki layak.',motor:[0,0],car:[150000,550000]},
    suspension:{name:'Pemeriksaan suspensi dan kemudi',note:'Pemeriksaan kelonggaran, kebocoran, redaman dan dudukan.',motor:[30000,150000],car:[85000,350000]},
    suspensionJob:{name:'Jasa penggantian suspensi / kaki-kaki',note:'Bergantung posisi, jumlah komponen dan tingkat pembongkaran.',motor:[75000,450000],car:[180000,1250000]},
    cooling:{name:'Pressure test dan pemeriksaan pendingin',note:'Pemeriksaan kebocoran, kipas, thermostat dan sirkulasi.',motor:[35000,150000],car:[100000,450000]},
    coolantFlush:{name:'Flush dan pengisian coolant',note:'Pengurasan serta pengisian sesuai kapasitas dan prosedur.',motor:[35000,160000],car:[150000,550000]},
    transCheck:{name:'Pemeriksaan transmisi',note:'Pemeriksaan fluida, kebocoran, gejala dan scan dasar.',motor:[35000,180000],car:[150000,650000]},
    fluidService:{name:'Jasa penggantian fluida transmisi',note:'Metode drain/refill atau prosedur spesifik kendaraan.',motor:[25000,120000],car:[150000,650000]},
    acCheck:{name:'Pemeriksaan performa AC',note:'Tekanan, temperatur outlet, airflow dan kebocoran awal.',motor:[0,0],car:[100000,350000]},
    acService:{name:'Servis sistem AC',note:'Prosedur servis sesuai hasil pemeriksaan dan spesifikasi refrigeran.',motor:[0,0],car:[180000,750000]},
    exhaustCheck:{name:'Pemeriksaan knalpot dan emisi',note:'Kebocoran, dudukan, suara dan pembacaan emisi bila tersedia.',motor:[25000,120000],car:[85000,350000]},
    periodic:{name:'Jasa servis berkala / multi-point inspection',note:'Daftar pekerjaan akhir disesuaikan jadwal pabrikan dan kondisi aktual.',motor:[60000,250000],car:[180000,850000]}
  };

  /* ----------------------------------------------------------------
     2. ISSUE CATALOG — VEHICLE-SPECIFIC SYSTEM > SUBSYSTEM > SYMPTOM
     ---------------------------------------------------------------- */
  const S = (id,label,help,parts,labor,checks,urgency='normal') => ({id,label,help,parts,labor,checks,urgency});
  const SUB = (id,label,description,symptoms) => ({id,label,description,symptoms});
  const CAT = (id,label,description,subcategories) => ({id,label,description,subcategories});

  const CATALOG = {
    motor: [
      CAT('engine','Mesin & pelumasan','Pembakaran, pengapian, kompresi, pelumasan, kebocoran dan suara mesin.',[
        SUB('starting','Starter, pengapian & langsam','Sistem starter, busi, koil, idle dan kemampuan mesin menyala.',[
          S('m_hard_start','Mesin sulit dihidupkan','Perlu starter lama atau beberapa kali percobaan.',['spark','coil','airFilter','battery'],['inspection','electrical','tune'],['Tegangan aki dan putaran starter','Busi, celah dan percikan api','Koil, soket dan kabel massa','Sistem idle saat mesin dingin dan panas']),
          S('m_no_start','Mesin tidak mau hidup','Starter berputar tetapi mesin tidak menyala, atau starter tidak berputar.',['spark','coil','fuelPump','relay'],['inspection','electrical','fuelService'],['Pisahkan masalah starter dari masalah pembakaran','Pastikan suplai bahan bakar dan percikan','Periksa sakelar pengaman dan konektor'],'urgent'),
          S('m_idle','Langsam tidak stabil / mesin mudah mati','Putaran idle naik turun atau mesin mati saat berhenti.',['airFilter','throttleClean','injectorClean','sensor'],['inspection','tune','scan'],['Throttle body dan saluran udara','Injektor dan kualitas bahan bakar','Sensor yang relevan dan kode kerusakan'])
        ]),
        SUB('combustion','Pembakaran, injeksi & tenaga','Gejala brebet, kehilangan tenaga, boros bahan bakar atau respons gas lambat.',[
          S('m_brebet','Mesin brebet saat akselerasi','Tarikan tersendat terutama saat gas dibuka.',['airFilter','spark','coil','injectorClean'],['inspection','tune','fuelService'],['Filter udara dan saluran masuk','Busi, koil dan pengapian','Injektor, tekanan bahan bakar dan throttle']),
          S('m_power','Tenaga mesin menurun','Akselerasi terasa berat dan respons gas lambat.',['airFilter','fuelFilter','injectorClean','oil'],['inspection','fuelService','scan'],['Filter udara dan filter bahan bakar','Tekanan suplai dan pola semprotan injektor','Kompresi dan kondisi mekanis bila diperlukan']),
          S('m_fuel_use','Konsumsi BBM terasa lebih boros','Jarak tempuh per liter menurun dibanding kebiasaan.',['airFilter','spark','injectorClean','sensor'],['inspection','tune','scan'],['Tekanan ban dan gaya berkendara sebagai faktor eksternal','Filter, busi dan injeksi','Sensor dan kode kerusakan jika tersedia'])
        ]),
        SUB('lubrication','Pelumasan, kebocoran & kompresi','Oli berkurang, rembesan, asap dan kemungkinan keausan internal.',[
          S('m_oil_leak','Oli merembes / bocor','Ada noda oli pada mesin atau lantai parkir.',['oil','gasket'],['inspection','leakTest'],['Lokasi sumber kebocoran','Gasket, seal dan baut pembuangan','Level oli dan risiko oli mengenai ban/rem'],'caution'),
          S('m_blue_smoke','Asap knalpot kebiruan','Asap biru dapat mengindikasikan oli ikut terbakar.',['oil','gasket','pistonRing','valveAdjust'],['inspection','topEnd'],['Konsumsi oli dan kondisi busi','Tes kompresi dan kebocoran silinder','Seal klep dan ring piston sebelum memutuskan bongkar'],'caution'),
          S('m_knock','Suara ketukan / mesin kasar','Bunyi baru dari area mesin, terutama saat rpm berubah.',['oil','valveAdjust','timingSet'],['inspection','topEnd'],['Level, spesifikasi dan tekanan oli jika tersedia','Sumber bunyi dari kepala atau bawah mesin','Timing dan celah klep'],'urgent')
        ])
      ]),
      CAT('brake','Sistem pengereman','Kampas, cakram, tromol, kaliper, master rem, selang dan minyak rem.',[
        SUB('front_brake','Rem depan','Keluhan tuas rem depan, cakram, kampas dan kaliper.',[
          S('m_front_noise','Rem depan berdecit / berisik','Suara muncul saat tuas rem depan ditekan.',['brakePadFront','brakeDisc','caliperKit'],['brakeCheck','padReplace'],['Ketebalan kampas dan permukaan cakram','Kontaminasi, glazing dan pin kaliper','Kondisi bearing dan pemasangan roda']),
          S('m_front_weak','Rem depan kurang menggigit','Daya pengereman terasa menurun.',['brakePadFront','brakeFluid','caliperKit','brakeHose'],['brakeCheck','padReplace','bleed'],['Kampas dan cakram','Minyak rem dan kemungkinan udara','Kaliper, master dan selang'],'urgent'),
          S('m_front_lever','Tuas rem depan terlalu dalam / empuk','Tuas terasa kosong atau perlu ditekan jauh.',['brakeFluid','masterBrake','brakeHose','caliperKit'],['brakeCheck','bleed'],['Kebocoran pada master, selang dan kaliper','Kondisi minyak rem','Proses bleeding dan tekanan sistem'],'urgent')
        ]),
        SUB('rear_brake','Rem belakang','Rem cakram atau tromol belakang.',[
          S('m_rear_noise','Rem belakang berdecit','Bunyi saat rem belakang digunakan.',['brakePadRear','brakeShoe','brakeDisc'],['brakeCheck','padReplace'],['Jenis rem belakang: cakram atau tromol','Ketebalan kampas dan permukaan bidang gesek','Periksa debu atau kontaminasi']),
          S('m_rear_weak','Rem belakang kurang pakem','Pengereman belakang terasa tidak efektif.',['brakePadRear','brakeShoe','brakeFluid'],['brakeCheck','padReplace','bleed'],['Mekanisme penyetel tromol atau kaliper','Ketebalan kampas','Kebocoran sistem jika hidrolik'],'urgent')
        ]),
        SUB('brake_hydraulic','Hidrolik & getaran rem','Tuas, minyak rem, kebocoran dan getaran saat pengereman.',[
          S('m_brake_leak','Ada rembesan minyak rem','Cairan terlihat di kaliper, master atau selang.',['brakeFluid','masterBrake','brakeHose','caliperKit'],['brakeCheck','bleed'],['Sumber kebocoran','Kondisi seal dan selang','Fungsi rem setelah perbaikan'],'urgent'),
          S('m_brake_vibration','Rem bergetar saat digunakan','Tuas atau setang bergetar ketika mengerem.',['brakeDisc','brakePadFront','wheelBearing'],['brakeCheck','discJob'],['Ketebalan dan run-out cakram','Keausan kampas tidak merata','Bearing dan kelurusan roda'],'caution')
        ])
      ]),
      CAT('electrical','Aki & kelistrikan','Aki, sistem pengisian, starter, lampu, sekring, kabel dan sensor.',[
        SUB('battery','Aki & suplai listrik','Daya aki, terminal, arus bocor dan kelistrikan dasar.',[
          S('m_battery_weak','Aki lemah / starter lambat','Starter berputar lambat atau panel meredup.',['battery','fuseWiring'],['electrical','batteryReplace'],['Tegangan aki sebelum dan saat starter','Terminal, kabel massa dan konektor','Usia serta kapasitas aki']),
          S('m_battery_drain','Aki cepat tekor','Aki sering habis meski baru diganti atau digunakan normal.',['battery','regulator','stator','fuseWiring'],['electrical','scan'],['Tegangan pengisian pada rpm yang ditentukan','Arus bocor ketika kontak mati','Regulator dan spul pengisian'])
        ]),
        SUB('starter','Rangkaian starter','Tombol starter, relay, motor starter dan sakelar pengaman.',[
          S('m_starter_click','Hanya terdengar bunyi klik','Tombol starter ditekan, tetapi mesin tidak berputar.',['battery','relay','starterMotor','fuseWiring'],['electrical','starterJob'],['Tegangan aki saat dibebani','Relay, switch rem dan standar samping','Motor starter serta jalur kabel'],'caution'),
          S('m_starter_button','Tombol starter tidak merespons','Tidak ada reaksi saat tombol ditekan.',['relay','fuseWiring','battery','sensor'],['electrical','starterJob'],['Sekring dan switch pengaman','Konektor tombol dan relay','Tegangan suplai'])
        ]),
        SUB('lighting','Lampu, panel & sensor','Lampu redup, panel mati atau indikator menyala.',[
          S('m_light','Lampu redup / mati','Lampu utama atau lampu sinyal tidak normal.',['bulb','fuseWiring','regulator'],['electrical'],['Bohlam atau modul LED','Sekring, konektor dan massa','Output pengisian']),
          S('m_warning','Indikator panel menyala','Lampu indikator peringatan menyala atau berkedip.',['sensor','fuseWiring'],['electrical','scan'],['Jenis indikator dan pola kedip','Kode kerusakan jika sistem mendukung','Kondisi kabel dan sensor'])
        ])
      ]),
      CAT('cvt','CVT motor matic','V-belt, roller, rumah roller, kampas ganda, rumah kopling dan bearing.',[
        SUB('belt_roller','V-belt & roller','Akselerasi, getaran, suara dan usia komponen CVT.',[
          S('m_cvt_slow','Akselerasi lambat / rpm tinggi','Mesin meraung tetapi laju tidak sebanding.',['cvtBelt','cvtRoller'],['cvtClean','cvtReplace'],['Lebar dan retak V-belt','Bentuk dan berat roller','Kondisi pulley primer dan sekunder']),
          S('m_cvt_noise','Bunyi dari area CVT','Dengung, gesekan atau derit dari rumah CVT.',['cvtBelt','cvtRoller','wheelBearing'],['cvtClean','cvtReplace'],['V-belt, roller dan bearing','Dudukan pulley','Sumber suara saat roda berputar'])
        ]),
        SUB('clutch_cvt','Kampas ganda & rumah kopling','Getaran saat awal jalan dan kopling sentrifugal.',[
          S('m_cvt_vibrate','Getar saat awal jalan','Getaran terasa ketika motor mulai bergerak.',['clutchShoe','clutchBell'],['cvtClean','cvtReplace'],['Ketebalan kampas ganda','Permukaan rumah kopling','Pegas dan kontaminasi']),
          S('m_cvt_slip','Tenaga terasa selip','Putaran mesin naik tetapi akselerasi tertahan.',['cvtBelt','clutchShoe','clutchBell'],['cvtClean','cvtReplace'],['V-belt dan kampas ganda','Permukaan pulley','Beban dan kondisi mesin'])
        ]),
        SUB('cvt_service','Servis rutin CVT','Pembersihan dan inspeksi komponen berdasarkan interval.',[
          S('m_cvt_service','CVT belum pernah diservis','Debu menumpuk atau jadwal perawatan sudah tiba.',['cvtBelt','cvtRoller','cvtFilter'],['cvtClean'],['Kondisi belt dan roller','Filter CVT jika tersedia','Kebersihan rumah CVT'])
        ])
      ]),
      CAT('manual_trans','Kopling & transmisi manual','Kampas kopling, kabel, perpindahan gigi dan oli transmisi.',[
        SUB('clutch','Kampas dan mekanisme kopling','Kopling selip, berat atau tidak memutus tenaga.',[
          S('m_clutch_slip','Kopling selip','Rpm naik tetapi kecepatan tidak bertambah sebanding.',['clutchKit','gearOil'],['transCheck','clutchJob'],['Setelan kabel dan free play','Kampas kopling dan pegas','Kondisi oli transmisi']),
          S('m_clutch_hard','Tuas kopling berat','Tuas terasa keras atau tidak kembali lancar.',['clutchCable','clutchKit'],['transCheck','clutchJob'],['Kabel dan jalur kabel','Mekanisme tuas dan arm','Kondisi kopling internal'])
        ]),
        SUB('gearshift','Perpindahan gigi','Gigi sulit masuk, loncat atau bunyi saat perpindahan.',[
          S('m_gear_hard','Gigi sulit masuk','Perpindahan gigi terasa keras atau tidak presisi.',['gearOil','clutchKit'],['transCheck'],['Level dan spesifikasi oli transmisi','Setelan kopling','Mekanisme pemindah gigi']),
          S('m_gear_noise','Bunyi saat perpindahan gigi','Muncul bunyi atau hentakan yang tidak biasa.',['gearOil','clutchKit'],['transCheck','clutchJob'],['Rantai dan sprocket sebagai kemungkinan sumber','Kopling dan oli transmisi','Komponen internal bila dibutuhkan'])
        ])
      ]),
      CAT('chain','Rantai & penggerak akhir','Rantai, gear depan-belakang, ketegangan dan alignment roda.',[
        SUB('chain_condition','Rantai kendur / berisik','Rantai berisik, terlalu kendur atau kaku.',[
          S('m_chain_loose','Rantai sering kendur','Ketegangan berubah atau penyetelan tidak bertahan.',['chain','sprocket'],['chainJob','inspection'],['Keausan rantai dan gigi sprocket','Alignment roda belakang','Kondisi adjuster dan dudukan']),
          S('m_chain_noise','Rantai berisik / kaku','Bunyi berulang atau ada mata rantai macet.',['chain','sprocket'],['chainJob'],['Pelumasan dan karat','Keausan sprocket','Titik rantai kaku'])
        ]),
        SUB('final_drive','Gear set / sprocket','Gigi sprocket tajam, aus atau penggerak menghentak.',[
          S('m_sprocket_worn','Gigi gear set aus','Ujung gigi menajam atau bentuk tidak rata.',['chain','sprocket'],['chainJob'],['Keausan gear depan dan belakang','Panjang rantai','Kondisi seal dan pelumasan'])
        ])
      ]),
      CAT('tire','Ban, velg & roda','Ban bocor, tekanan, tapak, velg, pentil dan bearing roda.',[
        SUB('tire_condition','Kondisi ban','Ban aus, benjol, retak atau sering kehilangan tekanan.',[
          S('m_tire_flat','Ban sering kempis','Tekanan berkurang berulang kali.',['tireFront','tireRear','valve'],['tireCheck','tireFit'],['Benda asing dan kebocoran tapak','Pentil dan bead ban','Retak atau benjol pada dinding ban'],'caution'),
          S('m_tire_worn','Ban aus / botak','Alur tapak menipis atau aus tidak merata.',['tireFront','tireRear'],['tireCheck','tireFit'],['Kedalaman alur dan usia ban','Tekanan angin dan pola aus','Suspensi dan alignment']),
          S('m_tire_bulge','Ban benjol / dinding rusak','Ada benjolan atau kerusakan dinding ban.',['tireFront','tireRear'],['tireCheck','tireFit'],['Kerusakan struktur ban dan velg','Ukuran dan indeks beban','Pemeriksaan roda sebelum berkendara'],'urgent')
        ]),
        SUB('wheel_bearing','Velg & bearing roda','Getaran, bunyi dengung atau roda terasa oblak.',[
          S('m_wheel_vibrate','Roda bergetar','Getaran terasa pada kecepatan tertentu.',['tireFront','tireRear','wheelBearing'],['tireCheck','balance'],['Keseimbangan dan kondisi ban','Velg peyang','Bearing dan pemasangan roda']),
          S('m_wheel_play','Roda terasa oblak','Ada kelonggaran ketika roda digoyang.',['wheelBearing'],['tireCheck','suspension'],['Bearing roda','As dan dudukan roda','Baut dan spacer'],'caution')
        ])
      ]),
      CAT('suspension','Suspensi & kemudi','Shock depan/belakang, seal, bearing komstir dan kestabilan kemudi.',[
        SUB('front_suspension','Suspensi depan','Shock depan bocor, keras atau tidak stabil.',[
          S('m_fork_leak','Shock depan bocor','Ada oli pada tabung shock depan.',['forkSeal','forkOil'],['suspension','suspensionJob'],['Seal oli dan seal debu','As shock dari goresan','Volume dan kondisi oli shock']),
          S('m_front_hard','Suspensi depan terasa keras','Redaman tidak nyaman atau ada bunyi benturan.',['forkSeal','forkOil'],['suspension'],['Kebocoran dan kelurusan fork','Oli shock dan bushing','Tekanan ban'])
        ]),
        SUB('rear_suspension','Suspensi belakang','Shock belakang lemah, keras atau memantul.',[
          S('m_rear_shock','Shock belakang lemah','Bagian belakang memantul berlebihan.',['shock','bushing'],['suspension','suspensionJob'],['Kebocoran dan redaman shock','Bushing dan baut dudukan','Beban dan kondisi pegas'])
        ]),
        SUB('steering','Kemudi & komstir','Setang oblak, berat atau tidak lurus.',[
          S('m_steering_play','Setang oblak / kemudi tidak stabil','Ada kelonggaran atau setang terasa tidak presisi.',['wheelBearing','bushing'],['suspension'],['Bearing komstir dan preload','Bushing, baut dan dudukan','Kelurusan fork dan roda'],'caution')
        ])
      ]),
      CAT('cooling','Sistem pendingin mesin','Khusus motor berpendingin cairan: radiator, kipas, coolant dan selang.',[
        SUB('coolant_leak','Coolant & kebocoran','Level coolant turun atau ada rembesan.',[
          S('m_coolant_leak','Coolant berkurang / bocor','Reservoir sering kosong atau ada cairan menetes.',['coolant','radiatorHose','radiatorCap'],['cooling','leakTest'],['Selang, clamp, radiator dan tutup','Water pump dan seal','Level coolant saat mesin dingin'],'caution'),
          S('m_overheat','Indikasi mesin terlalu panas','Indikator suhu naik atau tenaga turun karena panas.',['coolant','thermostat','fanMotor'],['cooling','coolantFlush'],['Level coolant saat aman dan mesin dingin','Kipas, thermostat dan radiator','Sirkulasi serta kebocoran'],'urgent')
        ]),
        SUB('fan_radiator','Kipas & sirkulasi radiator','Kipas tidak aktif atau suhu naik saat macet.',[
          S('m_fan_issue','Kipas radiator tidak normal','Kipas tidak menyala atau terus menyala.',['fanMotor','relay','sensor'],['cooling','electrical'],['Motor kipas dan relay','Sensor suhu dan jalur kelistrikan','Sirkulasi coolant'],'caution')
        ])
      ]),
      CAT('periodic','Servis berkala','Oli, filter, busi, rem, ban, rantai dan pemeriksaan multi-titik.',[
        SUB('routine_service','Servis rutin','Jadwal servis berdasarkan waktu atau kilometer.',[
          S('m_service_due','Jadwal servis sudah tiba','Kilometer atau waktu servis mendekati interval.',['oil','spark','airFilter','oilFilter'],['periodic'],['Oli dan filter sesuai jadwal','Rem, ban, rantai dan kelistrikan','Kebocoran dan fastener penting']),
          S('m_pretrip','Pemeriksaan sebelum perjalanan jauh','Ingin memastikan kendaraan siap digunakan.',['oil','tireFront','tireRear'],['periodic','inspection'],['Ban, tekanan dan rem','Oli dan kebocoran','Lampu, aki dan rantai'])
        ])
      ])
    ],
    car: [
      CAT('engine','Mesin & pelumasan','Pembakaran, timing, kompresi, oli, mounting dan kebocoran mesin.',[
        SUB('starting','Starter & pengapian','Mesin sulit hidup, starter lambat dan pengapian.',[
          S('c_hard_start','Mesin sulit dihidupkan','Starter panjang atau mesin gagal menyala.',['battery','spark','coil','fuelPump'],['inspection','electrical','fuelService'],['Aki dan putaran starter','Busi, koil dan pengapian','Tekanan bahan bakar dan sensor']),
          S('c_no_start','Mesin tidak mau hidup','Starter tidak berputar atau mesin berputar tanpa menyala.',['battery','relay','starterMotor','fuelPump'],['inspection','electrical','fuelService'],['Pisahkan starter dan pembakaran','Relay, motor starter dan kabel','Suplai bahan bakar'],'urgent')
        ]),
        SUB('combustion','Pembakaran, intake & tenaga','Brebet, tenaga turun, idle tidak stabil dan konsumsi BBM.',[
          S('c_brebet','Mesin brebet / tersendat','Akselerasi tidak halus atau mesin tersendat.',['airFilter','spark','coil','injectorClean'],['inspection','tune','scan'],['Filter udara dan throttle body','Busi, koil dan injektor','Data sensor dan kode kerusakan']),
          S('c_power','Tenaga mesin menurun','Mobil terasa berat atau tidak responsif.',['airFilter','fuelFilter','injectorClean','sensor'],['inspection','scan','fuelService'],['Sistem intake dan suplai bahan bakar','Sensor dan kode kerusakan','Kompresi serta sistem exhaust bila perlu']),
          S('c_idle','Idle tidak stabil / mesin mati','Putaran mesin naik turun saat berhenti.',['throttleClean','airFilter','sensor'],['inspection','tune','scan'],['Throttle body dan saluran vakum','Sensor terkait idle','Kode kerusakan dan data live'])
        ]),
        SUB('lubrication','Oli, kebocoran & internal mesin','Oli berkurang, asap, ketukan atau temperatur oli.',[
          S('c_oil_leak','Oli mesin bocor','Ada noda oli atau area mesin basah.',['oil','gasket'],['inspection','leakTest'],['Titik kebocoran dan seal','Filter, baut tap dan oil pan','Level oli dan kemungkinan menetes ke exhaust'],'caution'),
          S('c_smoke','Asap knalpot tidak normal','Asap biru, putih atau hitam terlihat berlebihan.',['oil','gasket','pistonRing','oxygenSensor'],['inspection','topEnd','scan'],['Warna asap dan kondisi cairan','Kompresi dan kebocoran silinder','Sensor dan emisi bila relevan'],'caution'),
          S('c_knock','Suara ketukan / knocking','Bunyi logam atau getaran tidak biasa dari mesin.',['oil','timingSet','engineMount','valveAdjust'],['inspection','topEnd','scan'],['Tekanan dan level oli','Timing dan celah klep','Engine mounting dan sumber bunyi'],'urgent')
        ])
      ]),
      CAT('brake','Sistem pengereman','Kampas, cakram, kaliper, master, booster, ABS dan minyak rem.',[
        SUB('front_rear_brake','Kampas & cakram depan/belakang','Keausan kampas, bunyi dan jarak pengereman.',[
          S('c_brake_noise','Rem berdecit / berisik','Bunyi saat pedal rem diinjak.',['brakePadFront','brakePadRear','brakeDisc'],['brakeCheck','padReplace'],['Ketebalan kampas setiap roda','Cakram dan permukaan gesek','Kaliper dan pin slider']),
          S('c_brake_weak','Rem kurang pakem','Jarak pengereman terasa lebih panjang.',['brakePadFront','brakePadRear','brakeFluid','brakeHose'],['brakeCheck','padReplace','bleed'],['Kampas, cakram dan tromol','Minyak rem dan kebocoran','Booster dan selang vakum bila relevan'],'urgent'),
          S('c_brake_vibrate','Pedal / setir bergetar saat rem','Getaran muncul saat pengereman.',['brakeDisc','brakePadFront'],['brakeCheck','discJob'],['Ketebalan dan run-out cakram','Keausan kampas','Bearing dan hub roda'])
        ]),
        SUB('hydraulic_abs','Hidrolik, booster & ABS','Pedal empuk, rem bocor atau lampu ABS menyala.',[
          S('c_pedal_soft','Pedal rem terlalu dalam / empuk','Pedal turun lebih jauh atau terasa kosong.',['brakeFluid','masterBrake','brakeHose'],['brakeCheck','bleed'],['Kebocoran master dan selang','Minyak rem dan udara di jalur','Booster dan master cylinder'],'urgent'),
          S('c_abs_light','Lampu ABS menyala','Indikator ABS tetap menyala setelah kendaraan berjalan.',['sensor','fuseWiring'],['brakeCheck','scan'],['Sensor kecepatan roda dan kabel','Tone ring / reluctor','Kode ABS dari alat scan'],'caution')
        ])
      ]),
      CAT('electrical','Aki, starter & kelistrikan','Aki, alternator, starter, lampu, sekring, kabel dan modul.',[
        SUB('battery_charge','Aki & sistem pengisian','Aki tekor, alternator tidak mengisi atau tegangan tidak stabil.',[
          S('c_battery_weak','Aki lemah / tekor','Starter berat atau kendaraan sulit hidup.',['battery','alternator','fuseWiring'],['electrical','batteryReplace'],['Tegangan aki saat diam dan cranking','Output alternator dan belt','Kebocoran arus dan terminal']),
          S('c_charge_fault','Sistem pengisian bermasalah','Lampu indikator aki menyala atau aki tidak terisi.',['alternator','battery','fuseWiring'],['electrical','scan'],['Output alternator dan regulator','Drive belt dan konektor','Tegangan saat beban listrik aktif'],'caution')
        ]),
        SUB('starter','Motor starter & ignition switch','Starter tidak merespons atau hanya terdengar klik.',[
          S('c_starter_click','Starter hanya bunyi klik','Mesin tidak berputar meski tombol/start ditekan.',['battery','relay','starterMotor'],['electrical','starterJob'],['Aki dan voltage drop','Relay serta kabel utama','Motor starter dan ground']),
          S('c_starter_dead','Starter tidak merespons','Tidak ada reaksi saat kunci atau tombol start digunakan.',['relay','fuseWiring','sensor'],['electrical','starterJob','scan'],['Fuse, ignition switch dan interlock','Relay dan kabel','Kode sistem immobilizer jika tersedia'])
        ]),
        SUB('lighting_module','Lampu, panel & elektronik','Lampu mati, panel error atau komponen listrik intermiten.',[
          S('c_lighting','Lampu / panel tidak normal','Lampu redup, mati atau indikator berkedip.',['bulb','fuseWiring','sensor'],['electrical','scan'],['Sekring, konektor dan ground','Bohlam/modul lampu','Modul kontrol jika diperlukan']),
          S('c_warning','Lampu peringatan menyala','Lampu check engine atau indikator lain menyala.',['sensor','fuseWiring'],['scan','inspection'],['Identifikasi indikator yang menyala','Scan DTC dan freeze-frame','Pemeriksaan fisik sebelum penggantian part'],'caution')
        ])
      ]),
      CAT('cooling','Sistem pendingin mesin','Radiator, coolant, thermostat, water pump, kipas dan selang.',[
        SUB('coolant_leak','Coolant bocor / berkurang','Level coolant turun atau cairan terlihat di ruang mesin.',[
          S('c_coolant_leak','Coolant berkurang / bocor','Reservoir sering kosong atau ada tetesan.',['coolant','radiatorHose','radiatorCap','waterPump'],['cooling','leakTest'],['Pressure test sistem pendingin','Selang, clamp, radiator dan water pump','Tutup radiator dan reservoir'],'caution'),
          S('c_overheat','Mesin overheat / suhu naik','Indikator suhu tinggi atau ada uap dari ruang mesin.',['coolant','thermostat','fanMotor','waterPump'],['cooling','coolantFlush','scan'],['Jangan membuka tutup radiator saat panas','Kipas, thermostat dan sirkulasi','Kebocoran dan kondisi coolant'],'urgent')
        ]),
        SUB('fan_thermostat','Kipas, thermostat & sirkulasi','Kipas tidak menyala atau suhu tidak stabil.',[
          S('c_fan_issue','Kipas radiator tidak normal','Kipas tidak hidup atau terus menyala.',['fanMotor','relay','sensor'],['cooling','electrical','scan'],['Motor kipas, relay dan fuse','Sensor suhu dan kabel','Perintah kipas dari ECU'])
        ])
      ]),
      CAT('transmission','Transmisi & kopling','AT/CVT/DCT/manual, fluida, filter, kopling dan mounting.',[
        SUB('automatic_trans','Transmisi otomatis / CVT','Perpindahan gigi menghentak, selip atau terlambat.',[
          S('c_gear_slip','Transmisi selip / rpm naik','Rpm naik tetapi laju kendaraan tidak sebanding.',['atf','transFilter','transMount'],['transCheck','fluidService','scan'],['Level dan spesifikasi fluida','DTC transmisi dan data temperatur','Mounting dan kebocoran'],'caution'),
          S('c_gear_harsh','Perpindahan gigi menghentak','Perpindahan terasa kasar atau terlambat.',['atf','transFilter','transMount'],['transCheck','scan','fluidService'],['Kondisi fluida dan filter','DTC dan adaptasi jika didukung','Mounting serta kondisi mekanis'])
        ]),
        SUB('manual_clutch','Manual & kopling','Kopling selip, pedal berat atau gigi sulit masuk.',[
          S('c_clutch_slip','Kopling selip','Rpm naik tanpa peningkatan laju yang sebanding.',['clutchKit','clutchBearing','gearOil'],['transCheck','clutchJob'],['Free play dan sistem hidrolik','Kampas, pressure plate dan flywheel','Release bearing']),
          S('c_clutch_hard','Pedal kopling berat','Pedal berat atau tidak kembali normal.',['clutchKit','clutchCable'],['transCheck'],['Kabel atau master/slave kopling','Free play dan release mechanism','Kondisi kopling internal'])
        ])
      ]),
      CAT('fuel','Sistem bahan bakar & intake','Pompa, filter, injektor, throttle body dan saluran bahan bakar.',[
        SUB('fuel_supply','Suplai bahan bakar','Sulit hidup, tenaga putus atau tekanan bahan bakar bermasalah.',[
          S('c_fuel_pressure','Suplai bahan bakar tidak stabil','Mesin tersendat terutama saat beban.',['fuelPump','fuelFilter','injectorClean'],['fuelService','scan'],['Tekanan dan debit bahan bakar','Filter, pompa dan relay','Injektor dan konektor']),
          S('c_fuel_smell','Tercium bau bensin','Bau bahan bakar kuat di sekitar kendaraan.',['fuelFilter','fuelPump','fuseWiring'],['leakTest','fuelService'],['Kebocoran selang, rail dan sambungan','Area tangki dan tutup','Jangan menyalakan sumber api atau mengemudi bila ada kebocoran'],'urgent')
        ]),
        SUB('intake_injection','Injeksi & saluran udara','Filter, throttle body, injektor dan sensor udara.',[
          S('c_throttle','Respons gas lambat','Pedal gas terasa tidak responsif atau tersendat.',['airFilter','throttleClean','sensor'],['inspection','tune','scan'],['Filter udara dan saluran intake','Throttle body dan aktuator','Sensor posisi throttle dan data live']),
          S('c_injector','Injektor diduga kotor','Idle tidak stabil atau konsumsi bahan bakar berubah.',['injectorClean','fuelFilter'],['fuelService','scan'],['Tekanan bahan bakar','Pola semprotan/imbalance injektor','Kode error sebelum membersihkan'])
        ])
      ]),
      CAT('tire','Ban, velg & roda','Ban, pentil, TPMS, bearing, balancing dan spooring.',[
        SUB('tire_condition','Kondisi ban & tekanan','Ban aus, bocor, benjol atau tekanan tidak stabil.',[
          S('c_tire_flat','Ban sering kempis','Tekanan turun berulang.',['tireFront','tireRear','valve'],['tireCheck','tireFit'],['Kebocoran tapak dan bead','Pentil atau TPMS','Kondisi dinding samping'],'caution'),
          S('c_tire_worn','Ban aus / botak','Alur menipis atau aus sebelah.',['tireFront','tireRear','valve'],['tireCheck','tireFit','alignment'],['Kedalaman alur dan usia ban','Tekanan dan pola keausan','Geometri roda']),
          S('c_tire_bulge','Ban benjol / sobek','Ada benjolan atau struktur ban rusak.',['tireFront','tireRear'],['tireCheck','tireFit'],['Kerusakan dinding dan struktur ban','Velg dan tekanan','Jangan lanjut berkendara dengan ban rusak'],'urgent')
        ]),
        SUB('wheel_balance','Velg, bearing & keseimbangan','Getaran, suara dengung atau roda tidak seimbang.',[
          S('c_wheel_vibration','Setir bergetar pada kecepatan tertentu','Getaran muncul saat rentang kecepatan tertentu.',['tireFront','tireRear','wheelBearing'],['tireCheck','balance'],['Balancing roda','Kondisi ban dan velg','Bearing dan hub']),
          S('c_wheel_noise','Bunyi dengung dari roda','Suara meningkat mengikuti kecepatan kendaraan.',['wheelBearing'],['tireCheck','suspension'],['Bearing roda dan hub','Tapak ban dan pola keausan','Rem yang menempel'])
        ])
      ]),
      CAT('suspension','Suspensi & kaki-kaki','Shock absorber, bushing, ball joint, stabilizer dan dudukan.',[
        SUB('shock_absorber','Shock absorber & mounting','Bunyi, limbung atau redaman lemah.',[
          S('c_shock_noise','Kaki-kaki bunyi gluduk','Bunyi saat melewati jalan tidak rata.',['shock','bushing','stabilizerLink'],['suspension','suspensionJob'],['Shock dan mounting','Bushing arm dan stabilizer link','Baut serta dudukan']),
          S('c_shock_bounce','Mobil limbung / memantul','Bodi mengayun berlebihan setelah melewati gelombang.',['shock','bushing'],['suspension','suspensionJob'],['Redaman shock dan kebocoran','Pegas dan mounting','Kondisi ban'])
        ]),
        SUB('joint_bushing','Ball joint, bushing & link','Keausan komponen sambungan dan karet kaki-kaki.',[
          S('c_joint_play','Ada kelonggaran kaki-kaki','Roda atau arm terasa oblak saat pemeriksaan.',['ballJoint','tieRod','bushing','stabilizerLink'],['suspension','suspensionJob','alignment'],['Ball joint, tie rod dan rack end','Bushing arm dan stabilizer link','Spooring setelah pekerjaan'],'caution')
        ])
      ]),
      CAT('steering','Sistem kemudi','Steering rack, tie rod, rack end, power steering dan setir.',[
        SUB('steering_play','Kelonggaran & bunyi kemudi','Setir oblak atau muncul bunyi ketika diputar.',[
          S('c_steering_play','Setir oblak / tidak presisi','Arah kemudi terasa longgar atau tidak akurat.',['tieRod','ballJoint','bushing'],['suspension','suspensionJob','alignment'],['Tie rod end dan rack end','Ball joint dan bushing','Steering rack dan alignment'],'caution'),
          S('c_steering_noise','Bunyi saat setir diputar','Bunyi berdecit atau ketukan ketika kemudi diputar.',['tieRod','bushing'],['suspension','inspection'],['Tie rod, ball joint dan bushing','Dudukan strut dan steering column','Sistem power steering'])
        ]),
        SUB('power_steering','Power steering','Setir berat atau bantuan kemudi tidak normal.',[
          S('c_steering_heavy','Setir terasa berat','Kemudi lebih berat dari biasanya.',['sensor','fuseWiring','acBelt'],['electrical','scan','inspection'],['Tekanan ban dan alignment','Fluida/belt untuk sistem hidrolik','Motor dan sensor untuk EPS'],'caution')
        ])
      ]),
      CAT('ac','AC & kabin','Filter kabin, refrigeran, blower, evaporator, kompresor dan kontrol AC.',[
        SUB('cooling_performance','Performa pendinginan','AC tidak dingin atau dingin tidak merata.',[
          S('c_ac_not_cold','AC kurang dingin','Udara keluar tetapi suhu tidak cukup dingin.',['cabinFilter','refrigerant','expansionValve'],['acCheck','acService'],['Tekanan high/low dan temperatur outlet','Filter, kondensor dan evaporator','Kebocoran refrigeran']),
          S('c_ac_leak','AC diduga bocor refrigeran','AC dingin sebentar lalu kembali hangat.',['refrigerant','expansionValve','acHose'],['acCheck','leakTest','acService'],['Leak test sambungan dan kondensor','O-ring, selang dan evaporator','Jenis refrigeran sesuai label'])
        ]),
        SUB('blower_airflow','Blower, filter & bau kabin','Aliran lemah, suara blower atau bau tidak sedap.',[
          S('c_ac_airflow','Hembusan AC lemah','Aliran udara kecil meski blower menyala.',['cabinFilter','sensor'],['acCheck','acService'],['Filter kabin','Blower motor dan resistor','Pintu pengarah udara']),
          S('c_ac_smell','AC bau tidak sedap','Bau muncul saat AC atau ventilasi dinyalakan.',['cabinFilter'],['acService'],['Filter kabin','Evaporator dan saluran drain','Kelembapan pada karpet/kabin'])
        ])
      ]),
      CAT('exhaust','Knalpot & emisi','Kebocoran exhaust, suara, sensor oksigen dan katalis.',[
        SUB('exhaust_noise','Knalpot berisik / bocor','Suara exhaust lebih keras atau ada bau gas buang.',[
          S('c_exhaust_noise','Knalpot berisik / bocor','Ada suara mendesis atau getaran dari jalur exhaust.',['muffler'],['exhaustCheck','leakTest'],['Pipa, gasket dan sambungan','Bracket dan karet dudukan','Kebocoran sebelum sensor']),
          S('c_emission','Emisi / check engine terkait exhaust','Indikator menyala atau hasil emisi tidak sesuai.',['oxygenSensor','catalytic'],['exhaustCheck','scan'],['Kode DTC dan data oxygen sensor','Kebocoran exhaust','Katalis dan kondisi pembakaran'])
        ])
      ]),
      CAT('periodic','Servis berkala','Oli, filter, fluida, rem, ban, AC dan pemeriksaan multi-titik.',[
        SUB('routine_service','Servis rutin','Perawatan sesuai kilometer dan waktu.',[
          S('c_service_due','Jadwal servis berkala sudah tiba','Kilometer atau waktu servis mendekati interval.',['oil','oilFilter','airFilter','spark'],['periodic'],['Oli dan filter','Rem, ban dan fluida','Belt, aki, wiper, lampu dan kebocoran']),
          S('c_pretrip','Pemeriksaan sebelum perjalanan jauh','Ingin memeriksa kondisi kendaraan sebelum perjalanan.',['oil','coolant','tireFront','tireRear'],['periodic','inspection'],['Ban dan tekanan serta ban serep','Rem, coolant dan oli','Aki, lampu, wiper dan kebocoran'])
        ])
      ])
    ]
  };

  const SEVERITY = {
    unknown:{label:'Belum diketahui',labor:1,note:'Tingkat kondisi belum dapat dipastikan dari deskripsi pengguna.'},
    light:{label:'Ringan',labor:.95,note:'Asumsi pekerjaan relatif sederhana dan akses komponen normal.'},
    medium:{label:'Sedang',labor:1.15,note:'Asumsi mungkin membutuhkan pembongkaran atau pemeriksaan tambahan.'},
    heavy:{label:'Berat',labor:1.35,note:'Asumsi pekerjaan lebih kompleks. Pemeriksaan langsung sangat disarankan.'}
  };
  const SEGMENTS = {
    motor:[['under150','Motor harian sampai 150 cc',1],['150to250','Motor 150–250 cc',1.12],['above250','Motor di atas 250 cc / premium',1.32]],
    car:[['lcgc','LCGC / city car',1],['compact','Sedan / hatchback / MPV kompak',1.12],['large','SUV / MPV besar / premium',1.3]]
  };
  const PART_TIERS = {economy:{label:'Aftermarket ekonomis',factor:.88},oem:{label:'OEM-equivalent',factor:1},original:{label:'Original / genuine',factor:1.38}};
  const EXTRAS = {
    motor:{inspection:[25000,85000],scanner:[0,0],roadTest:[15000,60000],consumables:[10000,45000]},
    car:{inspection:[65000,180000],scanner:[75000,300000],roadTest:[30000,110000],consumables:[25000,95000]}
  };

  function initEstimator() {
    const form = $('#detailedEstimatorForm');
    if (!form) return;
    const typeEl = $('#detailVehicleType');
    const categoryEl = $('#detailCategory');
    const subcategoryEl = $('#detailSubcategory');
    const symptomBox = $('#detailSymptoms');
    const resultBox = $('#detailEstimateResult');
    const errorBox = $('#detailEstimateError');
    const saveButton = $('#saveDetailedEstimate');
    const historyBox = $('#estimateHistoryList');
    let latestResult = null;
    let currentRows = {parts:[],labor:[],extras:[]};

    function currentSystem() {
      return (CATALOG[typeEl.value] || []).find(c => c.id === categoryEl.value) || CATALOG[typeEl.value][0];
    }
    function currentSub() {
      const system = currentSystem();
      return system.subcategories.find(s => s.id === subcategoryEl.value) || system.subcategories[0];
    }
    function renderSegments() {
      const kind = typeEl.value;
      $('#detailSegment').innerHTML = SEGMENTS[kind].map(([id,label]) => `<option value="${id}">${esc(label)}</option>`).join('');
      const transmission = $('#detailTransmission');
      transmission.innerHTML = kind === 'motor'
        ? '<option value="matic">Matic / CVT</option><option value="manual">Manual / kopling</option><option value="other">Lainnya / tidak tahu</option>'
        : '<option value="automatic">Automatic / AT / CVT</option><option value="manual">Manual</option><option value="dct">DCT / AMT</option><option value="other">Lainnya / tidak tahu</option>';
      $('#detailFuel').innerHTML = kind === 'motor'
        ? '<option value="petrol">Bensin</option><option value="electric">Listrik</option><option value="other">Lainnya / tidak tahu</option>'
        : '<option value="petrol">Bensin</option><option value="diesel">Diesel</option><option value="hybrid">Hybrid</option><option value="electric">Listrik</option><option value="other">Lainnya / tidak tahu</option>';
    }
    function renderCategories() {
      const categories = CATALOG[typeEl.value] || [];
      const previous = categoryEl.value;
      categoryEl.innerHTML = categories.map(c => `<option value="${c.id}">${esc(c.label)}</option>`).join('');
      if (categories.some(c => c.id === previous)) categoryEl.value = previous;
      renderSubcategories();
    }
    function renderSubcategories() {
      const system = currentSystem();
      const previous = subcategoryEl.value;
      subcategoryEl.innerHTML = system.subcategories.map(s => `<option value="${s.id}">${esc(s.label)}</option>`).join('');
      if (system.subcategories.some(s => s.id === previous)) subcategoryEl.value = previous;
      renderSymptoms();
      $('#detailCategoryHelp').textContent = system.description;
    }
    function renderSymptoms() {
      const sub = currentSub();
      symptomBox.innerHTML = sub.symptoms.map(item => `
        <label class="estimate-symptom">
          <input type="checkbox" name="symptoms" value="${item.id}">
          <span><strong>${esc(item.label)}</strong><small>${esc(item.help)}</small>${item.urgency === 'urgent' ? '<em class="symptom-risk risk-urgent">Perlu perhatian segera</em>' : item.urgency === 'caution' ? '<em class="symptom-risk">Periksa dalam waktu dekat</em>' : ''}</span>
        </label>`).join('');
      $('#detailSubcategoryHelp').textContent = sub.description;
      $('#symptomCounter').textContent = `0 dari ${sub.symptoms.length} gejala dipilih`;
      $$('input[name="symptoms"]', symptomBox).forEach(input => input.addEventListener('change', updateSymptomCounter));
    }
    function updateSymptomCounter() {
      const count = $$('input[name="symptoms"]:checked', symptomBox).length;
      $('#symptomCounter').textContent = `${count} gejala dipilih`;
    }
    function clearOldResult() {
      resultBox.hidden = true;
      latestResult = null;
      currentRows = {parts:[],labor:[],extras:[]};
    }
    typeEl.addEventListener('change', () => { renderSegments(); renderCategories(); clearOldResult(); });
    categoryEl.addEventListener('change', () => { renderSubcategories(); clearOldResult(); });
    subcategoryEl.addEventListener('change', () => { renderSymptoms(); clearOldResult(); });
    renderSegments();
    renderCategories();

    const selectedSymptoms = () => $$('input[name="symptoms"]:checked', symptomBox).map(x => x.value);
    const sumRows = rows => rows.filter(x => x.included !== false).reduce((a,x) => ({min:a.min + x.min * x.qty,max:a.max + x.max * x.qty}),{min:0,max:0});
    function createRows(kind, symptomList, partFactor, segmentFactor, laborFactor) {
      const partIds = [...new Set(symptomList.flatMap(s => s.parts))];
      const laborIds = [...new Set(symptomList.flatMap(s => s.labor))];
      const parts = partIds.map(id => {
        const p = PARTS[id]; if (!p || !p[kind] || p[kind][1] === 0) return null;
        return {id,name:p.name,note:p.note,unit:p.unit,qty:1,included:true,min:round(p[kind][0] * partFactor * segmentFactor),max:round(p[kind][1] * partFactor * segmentFactor)};
      }).filter(Boolean);
      const labor = laborIds.map(id => {
        const p = LABOR[id]; if (!p || !p[kind] || p[kind][1] === 0) return null;
        return {id,name:p.name,note:p.note,unit:'jasa',qty:1,included:true,min:round(p[kind][0] * segmentFactor * laborFactor),max:round(p[kind][1] * segmentFactor * laborFactor)};
      }).filter(Boolean);
      return {parts,labor};
    }
    function calculate() {
      const kind = typeEl.value;
      const system = currentSystem();
      const sub = currentSub();
      const symptomIds = selectedSymptoms();
      if (!symptomIds.length) throw new Error('Pilih minimal satu gejala agar rincian komponen sesuai dengan keluhan.');
      const symptoms = sub.symptoms.filter(s => symptomIds.includes(s.id));
      const severityId = $('#detailSeverity').value;
      const severity = SEVERITY[severityId] || SEVERITY.unknown;
      const segmentId = $('#detailSegment').value;
      const segmentFactor = (SEGMENTS[kind].find(s => s[0] === segmentId) || [null,null,1])[2];
      const partTier = PART_TIERS[$('#detailPartTier').value] || PART_TIERS.oem;
      const {parts,labor} = createRows(kind,symptoms,partTier.factor,segmentFactor,severity.labor);
      const extraCatalog = EXTRAS[kind];
      const extras = [];
      if ($('#includeInspection').checked) extras.push({id:'inspection_extra',name:'Pemeriksaan awal dan dokumentasi kondisi',note:'Inspeksi awal; beberapa bengkel dapat menggabungkannya dengan jasa utama.',unit:'paket',qty:1,included:true,min:round(extraCatalog.inspection[0]*segmentFactor),max:round(extraCatalog.inspection[1]*segmentFactor)});
      if ($('#includeScanner').checked && extraCatalog.scanner[1] > 0) extras.push({id:'scanner_extra',name:'Scan ECU / OBD (bila kendaraan mendukung)',note:'Hasil scan perlu ditafsirkan bersama pemeriksaan fisik.',unit:'paket',qty:1,included:true,min:round(extraCatalog.scanner[0]*segmentFactor),max:round(extraCatalog.scanner[1]*segmentFactor)});
      if ($('#includeRoadTest').checked) extras.push({id:'road_test',name:'Uji jalan terkontrol setelah pekerjaan',note:'Dilakukan hanya bila kendaraan aman untuk diuji.',unit:'paket',qty:1,included:true,min:round(extraCatalog.roadTest[0]*segmentFactor),max:round(extraCatalog.roadTest[1]*segmentFactor)});
      if ($('#includeConsumables').checked) extras.push({id:'consumables',name:'Bahan pendukung / consumables',note:'Cleaner, grease, washer, cable ties atau bahan kecil sesuai pekerjaan.',unit:'paket',qty:1,included:true,min:round(extraCatalog.consumables[0]*segmentFactor),max:round(extraCatalog.consumables[1]*segmentFactor)});
      const year = Number($('#detailYear').value);
      const odometer = Number($('#detailOdometer').value || 0) || null;
      const brand = $('#detailBrand').value.trim();
      const model = $('#detailModel').value.trim();
      if (!brand || !model) throw new Error('Isi merek dan model kendaraan agar estimasi memiliki konteks yang cukup.');
      if (year < 1980 || year > new Date().getFullYear()+1) throw new Error('Tahun kendaraan tidak valid.');
      const warnings = $$('input[name="warningFlags"]:checked').map(x => x.value);
      const timing = $('#detailTiming').value;
      const frequency = $('#detailFrequency').value;
      const checks = [...new Set(symptoms.flatMap(s => s.checks))];
      const urgent = symptoms.some(s => s.urgency === 'urgent') || warnings.includes('brake') || warnings.includes('overheat') || warnings.includes('fuel') || warnings.includes('tire');
      const vehicle = {
        type:kind === 'motor' ? 'Sepeda motor' : 'Mobil', dbType:kind === 'motor' ? 'motorcycle' : 'car',
        brand,model,year,odometer,segment:segmentId,
        transmission:$('#detailTransmission').value,fuel:$('#detailFuel').value
      };
      return {
        version:2,mode:'simulation',currency:'IDR',createdAt:new Date().toISOString(),vehicle,
        category:system.id,categoryLabel:system.label,subcategory:sub.id,subcategoryLabel:sub.label,
        severity:severityId,severityLabel:severity.label,severityNote:severity.note,
        symptoms:symptoms.map(s => ({id:s.id,label:s.label,help:s.help,urgency:s.urgency})),symptomCodes:symptomIds,
        timing,frequency,warnings,area:$('#detailArea').value.trim(),customerNotes:$('#detailNotes').value.trim(),partTier:partTier.label,
        items:{parts,labor,extras},checks,urgent,
        assumptions:[
          'Semua angka merupakan rentang simulasi internal antarmuka, bukan harga pasar terverifikasi, daftar harga toko atau penawaran bengkel.',
          'Kecocokan part belum diverifikasi melalui VIN, nomor rangka, kode mesin atau katalog resmi kendaraan.',
          'Part yang tampil adalah kandidat pemeriksaan. Tidak berarti semua part harus diganti.',
          'Biaya aktual dapat berbeda karena merek part, kualitas OEM/aftermarket, wilayah, tarif bengkel, pajak, stok dan hasil pemeriksaan fisik.',
          severity.note,
          'Biaya towing, pekerjaan lanjutan, pajak dan kerusakan tambahan belum termasuk kecuali ditampilkan sebagai item.'
        ]
      };
    }
    function rowTable(rows, group) {
      if (!rows.length) return '<div class="estimate-empty-lines">Tidak ada item yang disarankan dari pilihan gejala ini.</div>';
      return `<div class="estimate-item-table-wrap"><table class="estimate-line-table"><thead><tr><th>Masukkan</th><th>Komponen / pekerjaan</th><th>Qty</th><th>Rentang simulasi</th></tr></thead><tbody>${rows.map((item,index)=>`
        <tr data-group="${group}" data-index="${index}">
          <td><input class="estimate-line-include" type="checkbox" data-line-toggle="${group}" data-line-index="${index}" ${item.included?'checked':''} aria-label="Masukkan ${esc(item.name)} ke total"></td>
          <td><span class="estimate-line-name">${esc(item.name)}</span><span class="estimate-line-note">${esc(item.note)}</span><span class="estimate-line-sub">Satuan: ${esc(item.unit)}</span></td>
          <td><input class="estimate-qty" type="number" min="1" max="20" step="1" value="${item.qty}" data-line-qty="${group}" data-line-index="${index}" aria-label="Jumlah ${esc(item.name)}"></td>
          <td class="estimate-line-price">${money(item.min)} – ${money(item.max)}</td>
        </tr>`).join('')}</tbody></table></div>`;
    }
    function currentTotals() {
      const a=sumRows(currentRows.parts), b=sumRows(currentRows.labor), c=sumRows(currentRows.extras);
      return {parts:a,labor:b,extras:c,total:{min:a.min+b.min+c.min,max:a.max+b.max+c.max}};
    }
    function renderBreakdown() {
      const t = currentTotals();
      $('#detailPartSubtotal').textContent = `${money(t.parts.min)} – ${money(t.parts.max)}`;
      $('#detailLaborSubtotal').textContent = `${money(t.labor.min)} – ${money(t.labor.max)}`;
      $('#detailExtraSubtotal').textContent = `${money(t.extras.min)} – ${money(t.extras.max)}`;
      $('#detailTotalRange').textContent = `${money(t.total.min)} – ${money(t.total.max)}`;
      $('#detailTotalCard').textContent = `${money(t.total.min)} – ${money(t.total.max)}`;
      $('#detailItemCount').textContent = `${currentRows.parts.filter(x=>x.included).length} part dihitung · ${currentRows.labor.filter(x=>x.included).length} jasa dihitung · ${currentRows.extras.filter(x=>x.included).length} biaya tambahan`;
      if (latestResult) {
        latestResult.items = currentRows;
        latestResult.subtotals = t;
        latestResult.total = t.total;
      }
    }
    function renderResult(data) {
      const t = currentTotals();
      $('#detailResultVehicle').textContent = `${data.vehicle.brand} ${data.vehicle.model} · ${data.vehicle.year} · ${data.vehicle.type} · ${Number(data.vehicle.odometer || 0).toLocaleString('id-ID')} km`;
      $('#detailResultSummary').textContent = `${data.categoryLabel} / ${data.subcategoryLabel}. Gejala: ${data.symptoms.map(s=>s.label).join('; ')}.`;
      $('#detailPartsRows').innerHTML = rowTable(currentRows.parts,'parts');
      $('#detailLaborRows').innerHTML = rowTable(currentRows.labor,'labor');
      $('#detailExtrasRows').innerHTML = rowTable(currentRows.extras,'extras');
      $('#detailChecks').innerHTML = data.checks.map(c=>`<div class="estimate-inspection-item">${esc(c)}</div>`).join('');
      $('#detailAssumptions').innerHTML = data.assumptions.map(a=>`<li>${esc(a)}</li>`).join('');
      $('#detailUrgency').innerHTML = data.urgent
        ? '<span class="urgency-pill urgency-high">Perlu pemeriksaan segera</span><p>Jika gejala berkaitan rem gagal, ban rusak, mesin overheat, kebocoran bahan bakar atau kendali kendaraan, hentikan penggunaan di tempat aman dan minta bantuan profesional.</p>'
        : '<span class="urgency-pill">Perlu verifikasi bengkel</span><p>Gunakan daftar ini sebagai panduan diskusi. Jadwalkan inspeksi dan minta penjelasan sebelum menyetujui penggantian part.</p>';
      $('#detailRecommendation').textContent = data.urgent
        ? 'Utamakan keselamatan. Jangan lanjut berkendara jika gejala memengaruhi rem, ban, kemudi, kebocoran bahan bakar atau temperatur mesin. Pindahkan kendaraan ke tempat aman dan minta bantuan mekanik/towing.'
        : data.severity === 'heavy'
          ? 'Jadwalkan pemeriksaan langsung secepatnya. Minta mekanik memeriksa item pada checklist, menunjukkan hasil ukur dan mengonfirmasi kode part sebelum membuat penawaran final.'
          : data.severity === 'medium'
            ? 'Buat janji pemeriksaan dalam waktu dekat. Tanyakan mana item inspeksi, mana kandidat part, dan mana pekerjaan yang baru perlu dilakukan jika hasil pemeriksaan mendukung.'
            : 'Gunakan daftar ini sebagai panduan awal. Minta mekanik memverifikasi komponen dan interval perawatan sebelum menyetujui pekerjaan.';
      $('#detailSaveStatus').textContent = 'Belum disimpan ke akun.';
      saveButton.disabled = false;
      saveButton.textContent = 'Simpan ke riwayat akun';
      resultBox.hidden = false;
      renderBreakdown();
      resultBox.scrollIntoView({behavior:'smooth',block:'start'});
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      errorBox.hidden = true;
      if (!form.reportValidity()) return;
      try {
        const data = calculate();
        const computed = createRows(typeEl.value,data.symptoms,PART_TIERS[$('#detailPartTier').value].factor,(SEGMENTS[typeEl.value].find(s=>s[0] === $('#detailSegment').value)||[null,null,1])[2],SEVERITY[data.severity].labor);
        currentRows = {parts:computed.parts,labor:computed.labor,extras:[]};
        const kind = typeEl.value, factor=(SEGMENTS[kind].find(s=>s[0]===data.vehicle.segment)||[null,null,1])[2], ex=EXTRAS[kind];
        if ($('#includeInspection').checked) currentRows.extras.push({id:'inspection_extra',name:'Pemeriksaan awal dan dokumentasi kondisi',note:'Inspeksi awal; dapat digabung dengan jasa utama.',unit:'paket',qty:1,included:true,min:round(ex.inspection[0]*factor),max:round(ex.inspection[1]*factor)});
        if ($('#includeScanner').checked && ex.scanner[1]) currentRows.extras.push({id:'scanner_extra',name:'Scan ECU / OBD',note:'Bila kendaraan mendukung; kode harus ditafsirkan bersama pemeriksaan fisik.',unit:'paket',qty:1,included:true,min:round(ex.scanner[0]*factor),max:round(ex.scanner[1]*factor)});
        if ($('#includeRoadTest').checked) currentRows.extras.push({id:'road_test',name:'Uji jalan terkontrol',note:'Hanya dilakukan jika kendaraan dinilai aman.',unit:'paket',qty:1,included:true,min:round(ex.roadTest[0]*factor),max:round(ex.roadTest[1]*factor)});
        if ($('#includeConsumables').checked) currentRows.extras.push({id:'consumables',name:'Bahan pendukung / consumables',note:'Cleaner, grease, washer atau bahan kecil sesuai pekerjaan.',unit:'paket',qty:1,included:true,min:round(ex.consumables[0]*factor),max:round(ex.consumables[1]*factor)});
        latestResult = data;
        latestResult.items = currentRows;
        latestResult.subtotals = currentTotals();
        latestResult.total = latestResult.subtotals.total;
        window.BENGKELINAI_LAST_ESTIMATE = latestResult;
        renderResult(latestResult);
        toast(`Rincian simulasi dibuat: ${money(latestResult.total.min)} – ${money(latestResult.total.max)}`);
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.hidden = false;
      }
    });
    resultBox.addEventListener('change', event => {
      const target = event.target;
      const group = target.dataset.lineToggle || target.dataset.lineQty;
      if (!group) return;
      const index = Number(target.dataset.lineIndex);
      const row = currentRows[group]?.[index];
      if (!row) return;
      if (target.dataset.lineToggle) row.included = target.checked;
      if (target.dataset.lineQty) row.qty = Math.min(20,Math.max(1,Number(target.value)||1));
      renderBreakdown();
    });

    saveButton.addEventListener('click', async () => {
      if (!latestResult) return;
      const client = window.BENGKELINAI_DB?.client;
      if (!client) { $('#detailSaveStatus').textContent='Koneksi Supabase belum tersedia.'; return; }
      saveButton.disabled=true; saveButton.textContent='Menyimpan...';
      try {
        const {data:{user},error:userError}=await client.auth.getUser();
        if(userError) throw userError;
        if(!user){$('#detailSaveStatus').textContent='Masuk dahulu untuk menyimpan estimasi.';location.href='auth.html?next=estimasi.html';return;}
        const r=latestResult, mid=x=>Math.round((x.min+x.max)/2);
        const payload={user_id:user.id,vehicle_type:r.vehicle.dbType,problem_category:`${r.categoryLabel} / ${r.subcategoryLabel}`,severity:r.severity,area:r.area||null,estimated_min:r.total.min,estimated_max:r.total.max,labor_amount:mid(r.subtotals.labor),parts_amount:mid(r.subtotals.parts),is_simulated:true,vehicle_brand:r.vehicle.brand,vehicle_model:r.vehicle.model,vehicle_year:r.vehicle.year,odometer_km:r.vehicle.odometer,vehicle_segment:r.vehicle.segment,symptoms:r.symptomCodes,customer_notes:r.customerNotes||null,details_json:r};
        const {data:row,error}=await client.from('estimates').insert(payload).select('id').single();
        if(error) throw error;
        $('#detailSaveStatus').textContent=`Tersimpan. ID: ${row.id.slice(0,8).toUpperCase()}`;
        saveButton.textContent='Tersimpan'; saveButton.disabled=true; toast('Estimasi berhasil disimpan.'); loadHistory();
      } catch(error) {
        console.error('Save estimate:',error);
        $('#detailSaveStatus').textContent=error.message||'Gagal menyimpan. Pastikan migration SQL sudah dijalankan.';
        saveButton.disabled=false; saveButton.textContent='Coba simpan lagi';
      }
    });
    $('#copyDetailedEstimate')?.addEventListener('click', async () => {
      if(!latestResult) return;
      const r=latestResult, rows=[...currentRows.parts,...currentRows.labor,...currentRows.extras].filter(x=>x.included);
      const text=['BENGKELINAI — RINCIAN ESTIMASI SIMULASI',`${r.vehicle.brand} ${r.vehicle.model} ${r.vehicle.year} · ${r.vehicle.type}`,`${r.categoryLabel} / ${r.subcategoryLabel}`,`Gejala: ${r.symptoms.map(x=>x.label).join(', ')}`,'',...rows.map(x=>`- ${x.name} (${x.qty} ${x.unit}): ${money(x.min*x.qty)} – ${money(x.max*x.qty)}`),'',`TOTAL: ${money(r.total.min)} – ${money(r.total.max)}`,'','Harga simulasi, bukan penawaran resmi. Kandidat part harus diverifikasi mekanik.'].join('\n');
      try { await navigator.clipboard.writeText(text); toast('Rincian berhasil disalin.'); }
      catch { $('#detailSaveStatus').textContent='Browser tidak mengizinkan clipboard. Gunakan fitur cetak/PDF.'; }
    });
    $('#printDetailedEstimate')?.addEventListener('click',()=>{if(latestResult) window.print();});
    async function loadHistory(){
      if(!historyBox) return;
      const client=window.BENGKELINAI_DB?.client;
      if(!client){historyBox.innerHTML='<div class="estimate-empty-lines">Supabase belum dikonfigurasi.</div>';return;}
      try {
        const {data:{user},error:userError}=await client.auth.getUser();
        if(userError) throw userError;
        if(!user){historyBox.innerHTML='<div class="estimate-empty-lines">Masuk untuk melihat estimasi yang tersimpan di akun ini.</div>';return;}
        const {data,error}=await client.from('estimates').select('id,created_at,estimated_min,estimated_max,problem_category,vehicle_brand,vehicle_model').eq('user_id',user.id).order('created_at',{ascending:false}).limit(8);
        if(error) throw error;
        if(!data?.length){historyBox.innerHTML='<div class="estimate-empty-lines">Belum ada estimasi tersimpan.</div>';return;}
        historyBox.innerHTML=data.map(row=>`<article class="estimate-history-item"><div><strong>${esc([row.vehicle_brand,row.vehicle_model].filter(Boolean).join(' ')||'Kendaraan')} · ${esc(row.problem_category)}</strong><small>${new Date(row.created_at).toLocaleString('id-ID')}</small></div><b>${money(row.estimated_min)} – ${money(row.estimated_max)}</b></article>`).join('');
      } catch(error){historyBox.innerHTML=`<div class="estimate-empty-lines">Riwayat belum dapat dimuat: ${esc(error.message)}</div>`;}
    }
    window.addEventListener('bai:auth-ready',loadHistory);
    window.addEventListener('pageshow',loadHistory);
    window.setTimeout(loadHistory,900);
    window.BENGKELINAI_ESTIMATOR={getCurrent:()=>latestResult,selectCategory:(categoryId,subId)=>{if(!CATALOG[typeEl.value].some(c=>c.id===categoryId)) return false;categoryEl.value=categoryId;renderSubcategories();if(subId){subcategoryEl.value=subId;renderSymptoms();}clearOldResult();return true;}};
  }

  /* ----------------------------------------------------------------
     3. BENGKELINAI CHAT ASSISTANT — SIMULATED LOCAL KNOWLEDGE MODE
     This is intentionally not presented as a live LLM/API connection.
     ---------------------------------------------------------------- */
  function initChatAssistant(){
    const root=$('#baiChatWidget');
    if(!root) return;
    const toggle=$('#baiChatToggle'), panel=$('#baiChatPanel'), close=$('#baiChatClose'), form=$('#baiChatForm'), input=$('#baiChatInput'), messages=$('#baiChatMessages');
    if(!toggle||!panel||!form||!input||!messages) return;
    const addMessage=(text,role='assistant',actions=[])=>{
      const item=document.createElement('div'); item.className=`bai-chat-message ${role}`;
      const bubble=document.createElement('div'); bubble.className='bai-chat-bubble'; bubble.textContent=text; item.appendChild(bubble);
      if(actions.length){const actionWrap=document.createElement('div');actionWrap.className='bai-chat-actions';actions.forEach(a=>{const b=document.createElement('button');b.type='button';b.className='bai-chat-action';b.textContent=a.label;b.addEventListener('click',a.run);actionWrap.appendChild(b);});item.appendChild(actionWrap);}
      messages.appendChild(item); messages.scrollTop=messages.scrollHeight; return item;
    };
    const selectedContext=()=>{
      const type=$('#detailVehicleType')?.value==='car'?'mobil':'motor';
      const cat=$('#detailCategory'); const sub=$('#detailSubcategory');
      const symptoms=$$('input[name="symptoms"]:checked').map(x=>x.closest('label')?.querySelector('strong')?.textContent).filter(Boolean);
      return {type,category:cat?.selectedOptions[0]?.textContent||'',subcategory:sub?.selectedOptions[0]?.textContent||'',symptoms};
    };
    const categoryHints=[
      {words:['rem','kampas','pedal','cakram','brake'],category:'brake',sub:'front_brake',label:'Sistem pengereman'},
      {words:['aki','baterai','starter','kelistrikan','lampu','alternator'],category:'electrical',sub:'battery',label:'Aki & kelistrikan'},
      {words:['cvt','roller','belt','getar awal'],category:'cvt',sub:'belt_roller',label:'CVT motor matic'},
      {words:['rantai','gear set','sprocket'],category:'chain',sub:'chain_condition',label:'Rantai & penggerak akhir'},
      {words:['ban','kempis','velg','roda','pentil'],category:'tire',sub:'tire_condition',label:'Ban & roda'},
      {words:['shock','suspensi','gluduk','kaki kaki','setang','setir'],category:'suspension',sub:'front_suspension',label:'Suspensi & kemudi'},
      {words:['panas','overheat','radiator','coolant','suhu'],category:'cooling',sub:'coolant_leak',label:'Sistem pendingin'},
      {words:['kopling','transmisi','gigi','matic','atf','selip'],category:'transmission',sub:'automatic_trans',label:'Transmisi & kopling'},
      {words:['ac','freon','blower','dingin','evaporator'],category:'ac',sub:'cooling_performance',label:'AC & kabin'},
      {words:['knalpot','asap','emisi'],category:'exhaust',sub:'exhaust_noise',label:'Knalpot & emisi'},
      {words:['servis','service','oli','perawatan'],category:'periodic',sub:'routine_service',label:'Servis berkala'},
      {words:['mesin','brebet','tenaga','oli bocor','susah hidup','sulit hidup'],category:'engine',sub:'starting',label:'Mesin & pelumasan'},
      {words:['bensin','bbm','injektor','fuel pump','bau bensin'],category:'fuel',sub:'fuel_supply',label:'Sistem bahan bakar'}
    ];
    function responseFor(raw){
      const q=raw.toLowerCase();
      const ctx=selectedContext();
      const estimate=window.BENGKELINAI_ESTIMATOR?.getCurrent?.();
      const safetyWords=['rem blong','rem gagal','ban benjol','ban sobek','bau bensin','bensin bocor','overheat','mesin sangat panas','asap tebal','setir macet','setir tidak bisa'];
      if(safetyWords.some(w=>q.includes(w))) return {text:'Ini bisa berkaitan dengan keselamatan. Menepi di tempat yang aman, matikan mesin bila ada panas berlebih atau kebocoran bahan bakar, dan jangan lanjutkan perjalanan bila rem, ban, kemudi atau temperatur mesin tidak normal. Minta bantuan mekanik atau towing. Jangan mencoba membuka sistem pendingin saat mesin panas.'};
      if(/halo|hai|hi|pagi|siang|sore|malam/.test(q)) return {text:'Halo! Saya Asisten BengkelinAI. Saya dapat membantu menjelaskan kategori masalah, gejala, kandidat komponen, dan cara membaca estimasi. Saat ini saya berjalan dalam mode panduan simulasi, belum terhubung ke model AI eksternal.',actions:[{label:'Bantu pilih kategori masalah',run:()=>input.value='Saya bingung memilih kategori masalah.'},{label:'Jelaskan estimasi',run:()=>input.value='Bagaimana cara membaca rincian estimasi?'}]};
      if(/pasti|akurasi|ai sungguhan|apakah diagnosis|diagnosa/.test(q)) return {text:'Estimasi dan panduan saat ini bersifat simulasi berbasis aturan. Hasilnya bukan diagnosis pasti dan tidak dapat memastikan komponen rusak. Mekanik perlu memeriksa kendaraan, mengukur komponen, serta mencocokkan nomor part sebelum penggantian.'};
      if(/semua part|harus ganti|wajib ganti|ganti semuanya/.test(q)) return {text:'Tidak. Daftar komponen pada hasil adalah kandidat pemeriksaan berdasarkan gejala, bukan daftar part yang otomatis harus diganti. Minta mekanik menunjukkan hasil ukur, kondisi part lama, kode part pengganti, dan alasan penggantian.'};
      if(/harga|mahal|murah|biaya|total|estimasi/.test(q)) {
        if(estimate) return {text:`Estimasi terakhir untuk ${estimate.vehicle.brand} ${estimate.vehicle.model}: ${money(estimate.total.min)} sampai ${money(estimate.total.max)}. Rincian dibagi menjadi komponen, jasa dan biaya tambahan. Semua angka masih simulasi, bukan harga resmi bengkel atau penawaran supplier.`};
        return {text:'Untuk melihat kisaran, pilih jenis kendaraan, sistem masalah, subkategori dan gejala, lalu tekan “Buat rincian estimasi”. Hasil akan memisahkan kandidat part, jasa, pemeriksaan, bahan pendukung dan total.'};
      }
      if(/cara pilih|bingung memilih|kategori|masalah saya|keluhan saya/.test(q)) return {text:`Kamu sedang memilih ${ctx.type}. Sistem yang saat ini dipilih: ${ctx.category || 'belum dipilih'}; sub-sistem: ${ctx.subcategory || 'belum dipilih'}. Pilih kategori berdasarkan lokasi/gejala paling dekat, lalu pilih subkategori. Kalau ragu, ceritakan gejalanya, kapan muncul, dan apakah ada lampu peringatan.`};
      if(/gejala|komponen|part|diperiksa|cek apa/.test(q)) {
        if(estimate) return {text:`Untuk pilihan saat ini, kandidat pemeriksaan mencakup: ${estimate.items.parts.map(x=>x.name).join(', ') || 'belum ada part yang terpilih'}. Ini hanya daftar pemeriksaan. Minta mekanik memverifikasi kondisi dan kecocokan part terlebih dahulu.`};
        return {text:`Kendaraan yang dipilih: ${ctx.type}. Kategori: ${ctx.category || 'belum dipilih'}. Gejala terpilih: ${ctx.symptoms.join(', ') || 'belum ada'}. Pilih satu atau lebih gejala agar saya bisa membantu mengarahkan daftar pemeriksaan.`};
      }
      const hint=categoryHints.find(h=>h.words.some(w=>q.includes(w)));
      if(hint){
        const currentType=$('#detailVehicleType')?.value||'motor';
        const available=(window.BENGKELINAI_ESTIMATOR && window.BENGKELINAI_ESTIMATOR.selectCategory(hint.category,hint.sub));
        return {text:`Dari kata-kata yang Kamu tulis, kategori yang paling dekat untuk diperiksa adalah “${hint.label}”. Ini hanya saran awal, bukan diagnosis. Saya sudah memilih kategori tersebut di formulir bila tersedia. Pilih gejala yang paling sesuai dan lengkapi detail kendaraan.`,actions:[{label:'Lihat formulir estimasi',run:()=>document.querySelector('#detailedEstimatorForm')?.scrollIntoView({behavior:'smooth',block:'start'})}]};
      }
      return {text:'Saya belum menemukan kecocokan yang cukup dari pesan itu. Coba ceritakan: kendaraan motor atau mobil, merek/model, gejala yang muncul, kapan gejala terjadi (saat start, langsam, akselerasi, mengerem, berbelok), dan apakah ada lampu indikator. Saya akan bantu memilih kategori pemeriksaan yang paling mendekati.'};
    }
    function send(text){
      const value=String(text||'').trim(); if(!value) return;
      addMessage(value,'user'); input.value='';
      const typing=document.createElement('div');typing.className='bai-chat-message assistant bai-chat-typing';typing.innerHTML='<div class="bai-chat-bubble"><span></span><span></span><span></span></div>';messages.appendChild(typing);messages.scrollTop=messages.scrollHeight;
      window.setTimeout(()=>{typing.remove();const result=responseFor(value);addMessage(result.text,'assistant',result.actions||[]);},420);
    }
    toggle.addEventListener('click',()=>{const open=panel.hidden;panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open)input.focus();});
    close.addEventListener('click',()=>{panel.hidden=true;toggle.setAttribute('aria-expanded','false');});
    form.addEventListener('submit',e=>{e.preventDefault();send(input.value);});
    $$('.bai-chat-quick').forEach(button=>button.addEventListener('click',()=>send(button.dataset.message||button.textContent)));
    $('#baiChatClear')?.addEventListener('click',()=>{messages.innerHTML='';addMessage('Percakapan demo direset. Apa yang ingin Kamu tanyakan tentang kendaraan atau estimasi biaya?');});
    if(!messages.children.length)addMessage('Halo! Saya Asisten BengkelinAI. Ceritakan gejala kendaraan atau tanyakan cara membaca estimasi. Jawaban saat ini berbasis panduan simulasi, belum tersambung ke model AI eksternal.');
  }

  document.addEventListener('DOMContentLoaded',()=>{
    initEstimator();
    initChatAssistant();
  });
})();
