/* BengkelinAI Detailed Cost Estimator
 * All prices are illustrative demo ranges, not market quotations.
 */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const rupiah = value => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(Math.round(value || 0));
  const round = value => Math.round(value / 1000) * 1000;
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  const CATALOG = {
    motor: {
      categories: {
        engine: {
          label: 'Mesin & pelumasan',
          description: 'Pembakaran, pelumasan, kompresi, dan kebocoran mesin.',
          symptoms: [
            { id:'hard_start', label:'Mesin sulit dihidupkan', help:'Starter panjang, mesin perlu beberapa kali percobaan.', parts:['spark','air_filter','fuel_clean'], labor:['inspection','tune_up'], checks:['Kondisi busi dan percikan api','Filter udara dan saluran masuk','Tekanan bahan bakar dan injektor'] },
            { id:'low_power', label:'Tenaga menurun / brebet', help:'Akselerasi tersendat atau tenaga terasa berat.', parts:['air_filter','spark','fuel_clean','oil'], labor:['inspection','tune_up'], checks:['Filter udara dan throttle body','Busi, koil, dan suplai bahan bakar','Kondisi oli dan kompresi mesin'] },
            { id:'smoke', label:'Asap knalpot tidak normal', help:'Asap putih/biru/hitam lebih banyak dari biasanya.', parts:['oil','gasket','piston_ring'], labor:['inspection','top_overhaul'], checks:['Warna dan sumber asap','Kebocoran oli dan gasket','Kompresi, ring piston, dan dinding silinder'] },
            { id:'rough_noise', label:'Suara mesin kasar / berisik', help:'Muncul bunyi ketukan, gesekan, atau getaran mesin.', parts:['oil','spark','piston_ring'], labor:['inspection','top_overhaul'], checks:['Level dan spesifikasi oli','Sumber suara pada kepala/silinder mesin','Kelonggaran komponen dan kompresi'] },
            { id:'oil_leak', label:'Oli merembes / berkurang', help:'Ada noda oli atau level oli turun tidak wajar.', parts:['oil','gasket'], labor:['inspection','gasket_job'], checks:['Titik rembesan pada gasket dan seal','Kondisi baut tap oli','Level oli setelah pemeriksaan'] }
          ],
          parts: [
            ['oil','Oli mesin','Oli pengganti; jenis dan volume harus mengikuti spesifikasi model.',45000,110000,'botol / paket'],
            ['spark','Busi','Perlu dicocokkan dengan tipe mesin dan kode busi.',18000,85000,'buah'],
            ['air_filter','Filter udara','Elemen filter; bisa dibersihkan atau diganti sesuai kondisi.',25000,95000,'buah'],
            ['fuel_clean','Pembersihan injektor / throttle body','Bahan pembersih dan proses pembersihan, bukan penggantian injektor.',45000,160000,'paket'],
            ['gasket','Gasket / seal terkait','Tergantung titik kebocoran dan tipe mesin.',25000,180000,'set'],
            ['piston_ring','Ring piston / komponen top-end','Hanya dipertimbangkan setelah tes kompresi dan bongkar pemeriksaan.',95000,380000,'set']
          ],
          labor: [
            ['inspection','Pemeriksaan awal mesin','Pemeriksaan visual, suara, kebocoran, dan uji dasar.',30000,85000],
            ['tune_up','Tune-up / penyetelan','Pembersihan dan penyetelan sesuai tipe sistem bahan bakar.',50000,150000],
            ['gasket_job','Pekerjaan gasket / seal','Pembongkaran area terkait dan pemasangan ulang.',80000,250000],
            ['top_overhaul','Pemeriksaan top-end / kompresi lanjutan','Pekerjaan bongkar hanya jika hasil pemeriksaan mendukung.',250000,750000]
          ]
        },
        brake: {
          label:'Sistem pengereman', description:'Kampas, cakram, kaliper, master rem, dan minyak rem.',
          symptoms:[
            {id:'brake_noise',label:'Rem berdecit / berisik',help:'Bunyi saat tuas atau pedal rem digunakan.',parts:['pad_front','pad_rear','disc'],labor:['inspection','pad_replace'],checks:['Ketebalan kampas rem depan dan belakang','Permukaan cakram dan kemungkinan glazing','Kaliper dan pin slider']},
            {id:'brake_weak',label:'Rem kurang menggigit',help:'Jarak pengereman terasa lebih panjang.',parts:['pad_front','brake_fluid','caliper'],labor:['inspection','bleeding','pad_replace'],checks:['Ketebalan kampas','Kondisi minyak rem dan kemungkinan udara','Kaliper, piston, dan selang rem']},
            {id:'lever_soft',label:'Tuas rem terasa dalam / empuk',help:'Tuas perlu ditekan lebih jauh dari biasanya.',parts:['brake_fluid','caliper'],labor:['inspection','bleeding'],checks:['Kebocoran sistem hidrolik','Kualitas dan usia minyak rem','Proses bleeding dan master rem']},
            {id:'brake_vibration',label:'Rem bergetar',help:'Getaran terasa saat mengerem.',parts:['disc','pad_front'],labor:['inspection','disc_job'],checks:['Kerataan dan ketebalan cakram','Keausan kampas tidak merata','Bearing roda dan pemasangan roda']}
          ],
          parts:[['pad_front','Kampas rem depan', 'Kompatibilitas mengikuti tipe kaliper.',45000,145000,'set'],['pad_rear','Kampas rem belakang','Untuk cakram atau tromol sesuai model.',35000,125000,'set'],['brake_fluid','Minyak rem','Spesifikasi DOT mengikuti rekomendasi pabrikan.',20000,65000,'botol'],['disc','Cakram rem','Penggantian hanya jika ketebalan/permukaan tidak layak.',160000,520000,'buah'],['caliper','Seal / kit kaliper','Komponen karet dan seal sesuai jenis kaliper.',35000,160000,'kit']],
          labor:[['inspection','Pemeriksaan sistem rem','Cek kampas, cakram, kaliper, selang, dan kebocoran.',25000,75000],['pad_replace','Jasa penggantian kampas','Bongkar pasang, pembersihan dudukan, dan uji fungsi.',35000,100000],['bleeding','Bleeding / penggantian minyak rem','Termasuk pembuangan udara dari sistem hidrolik.',35000,90000],['disc_job','Jasa penggantian cakram','Bongkar pasang dan pemeriksaan run-out dasar.',45000,120000]]
        },
        electrical: {
          label:'Aki & kelistrikan', description:'Aki, pengisian, starter, relay, sekring, dan kabel.',
          symptoms:[
            {id:'weak_battery',label:'Starter elektrik lemah',help:'Dinamo starter berputar lambat atau hanya berbunyi klik.',parts:['battery','relay','wiring'],labor:['electrical_test','battery_replace'],checks:['Tegangan aki saat diam dan saat starter','Relay starter dan terminal aki','Arus bocor dan kondisi kabel massa']},
            {id:'charging',label:'Aki sering tekor',help:'Aki baru cepat habis atau kendaraan sulit hidup setelah didiamkan.',parts:['battery','regulator','stator'],labor:['electrical_test','charging_test'],checks:['Tegangan pengisian saat langsam dan rpm menengah','Regulator/rectifier dan spul pengisian','Kebocoran arus ketika kontak mati']},
            {id:'lights',label:'Lampu / kelistrikan tidak stabil',help:'Lampu redup, berkedip, atau komponen mati sesekali.',parts:['fuse','wiring','regulator'],labor:['electrical_test','wiring_repair'],checks:['Sekring, soket, dan konektor','Titik massa dan kabel terkelupas','Regulator dan tegangan output']},
            {id:'starter_dead',label:'Starter tidak merespons',help:'Tombol starter ditekan tetapi mesin tidak berputar.',parts:['relay','battery','wiring'],labor:['electrical_test','starter_test'],checks:['Switch rem / standar samping / engine stop','Relay starter dan tegangan aki','Motor starter dan kabel utama']}
          ],
          parts:[['battery','Aki motor','Kapasitas dan tipe aki mengikuti model.',180000,520000,'unit'],['relay','Relay starter','Kompatibilitas konektor harus dicek.',35000,130000,'unit'],['regulator','Regulator / rectifier','Komponen pengisian; perlu pengukuran sebelum ganti.',120000,420000,'unit'],['stator','Spul / stator pengisian','Perlu tes tahanan dan output sebelum penggantian.',180000,720000,'unit'],['fuse','Sekring dan konektor','Harga tergantung jumlah dan jenis konektor.',5000,55000,'paket'],['wiring','Perbaikan kabel / soket','Nilai tergantung panjang kabel dan tingkat kerusakan.',25000,180000,'paket']],
          labor:[['electrical_test','Pemeriksaan kelistrikan','Pengukuran aki, pengisian, kontinuitas, dan massa.',30000,100000],['battery_replace','Jasa ganti aki','Pemasangan dan pengecekan tegangan.',15000,40000],['charging_test','Tes sistem pengisian','Pengukuran output pengisian pada beberapa rpm.',25000,80000],['wiring_repair','Jasa perbaikan kabel','Pencarian titik masalah dan perbaikan sambungan.',50000,200000],['starter_test','Pemeriksaan rangkaian starter','Tes switch, relay, motor starter, dan kabel.',30000,110000]]
        },
        cvt: {
          label:'CVT & transmisi motor matic', description:'V-belt, roller, kampas ganda, rumah kopling, dan CVT.',
          symptoms:[
            {id:'cvt_vibration',label:'Getar saat awal jalan',help:'Getaran muncul ketika motor mulai bergerak.',parts:['clutch_shoe','clutch_bell','cvt_cleaner'],labor:['cvt_clean','clutch_service'],checks:['Kampas ganda dan permukaan rumah kopling','Debu dan kontaminasi pada ruang CVT','Engine mounting jika getaran tidak berasal dari CVT']},
            {id:'cvt_noise',label:'Bunyi dari area CVT',help:'Dengung, gesekan, atau suara berderit dari sisi transmisi.',parts:['belt','roller','clutch_bell'],labor:['cvt_clean','belt_service'],checks:['Retak, lebar, dan kondisi V-belt','Keausan roller dan rumah roller','Bearing dan rumah kopling']},
            {id:'cvt_slow',label:'Akselerasi lambat / rpm tinggi',help:'Mesin meraung tetapi laju kendaraan tidak sebanding.',parts:['belt','roller','clutch_shoe'],labor:['cvt_clean','belt_service'],checks:['Lebar V-belt dan retakan','Berat dan bentuk roller','Kampas ganda dan pegas CVT']},
            {id:'cvt_service',label:'CVT belum pernah dibersihkan',help:'Perawatan berkala ruang CVT sudah waktunya.',parts:['cvt_cleaner','cvt_filter'],labor:['cvt_clean'],checks:['Kebersihan rumah CVT','Kondisi belt, roller, dan kampas','Filter udara CVT']}
          ],
          parts:[['belt','V-belt','Pastikan kode part cocok dengan model dan tahun.',95000,280000,'buah'],['roller','Roller set','Berat roller mengikuti spesifikasi dan karakter standar.',35000,130000,'set'],['clutch_shoe','Kampas ganda','Penggantian berdasarkan ketebalan dan kondisi permukaan.',90000,290000,'set'],['clutch_bell','Rumah kopling','Periksa keovalan, goresan, dan panas berlebih.',95000,330000,'buah'],['cvt_filter','Filter CVT','Filter/elemen udara CVT bila tersedia pada model.',15000,65000,'buah'],['cvt_cleaner','Cleaner dan grease CVT','Bahan habis pakai pembersihan ruang CVT.',15000,55000,'paket']],
          labor:[['cvt_clean','Jasa bongkar dan bersihkan CVT','Pembersihan rumah CVT dan pemeriksaan komponen.',40000,110000],['belt_service','Jasa ganti belt dan roller','Termasuk bongkar pasang dan pemeriksaan pulley.',65000,180000],['clutch_service','Jasa servis kampas ganda','Pembersihan dan pemeriksaan rumah kopling.',65000,190000]]
        },
        tire: {
          label:'Ban & roda', description:'Ban, pentil, tambal, balancing, dan bearing roda.',
          symptoms:[
            {id:'tire_flat',label:'Ban sering kempis',help:'Tekanan turun berulang meski sudah diisi angin.',parts:['tire_patch','valve','tire_front'],labor:['tire_check','tire_install'],checks:['Paku/benda asing dan kebocoran tapak','Pentil dan bead ban','Retak pada dinding samping ban']},
            {id:'tire_worn',label:'Tapak ban aus / botak',help:'Alur ban menipis atau aus tidak merata.',parts:['tire_front','tire_rear'],labor:['tire_install','wheel_check'],checks:['Kedalaman alur dan usia ban','Tekanan angin dan pola keausan','Bearing dan kelurusan roda']},
            {id:'wheel_vibration',label:'Roda terasa bergetar',help:'Getaran muncul pada kecepatan tertentu.',parts:['valve','tire_front'],labor:['wheel_check','tire_install'],checks:['Keseimbangan dan kondisi ban','Velg peyang dan bearing roda','Tekanan angin sesuai beban']}
          ],
          parts:[['tire_front','Ban depan','Harga sangat dipengaruhi ukuran dan merek.',180000,520000,'buah'],['tire_rear','Ban belakang','Harga sangat dipengaruhi ukuran dan merek.',220000,650000,'buah'],['valve','Pentil ban','Ganti bila getas atau bocor.',8000,30000,'buah'],['tire_patch','Tambal ban','Hanya jika lokasi dan jenis kerusakan masih aman ditambal.',10000,45000,'tindakan']],
          labor:[['tire_check','Pemeriksaan ban dan roda','Cek tekanan, alur, dinding samping, dan kebocoran.',15000,50000],['tire_install','Jasa bongkar pasang ban','Termasuk pemasangan dan set tekanan dasar.',25000,85000],['wheel_check','Pemeriksaan velg dan bearing','Cek kelurusan velg dan kelonggaran bearing.',20000,70000]]
        },
        suspension: {
          label:'Suspensi & kemudi', description:'Shock depan/belakang, seal, bearing komstir, dan bushing.',
          symptoms:[
            {id:'fork_leak',label:'Shock depan bocor',help:'Ada oli pada tabung shock atau suspensi terlalu memantul.',parts:['fork_seal','fork_oil'],labor:['fork_service','suspension_check'],checks:['Seal debu dan seal oli','Kondisi as shock dari goresan','Volume dan kondisi oli shock']},
            {id:'rear_bounce',label:'Shock belakang lemah',help:'Bagian belakang memantul berlebihan atau terasa keras.',parts:['rear_shock','mounting'],labor:['shock_replace','suspension_check'],checks:['Kebocoran dan redaman shock','Bushing dan baut dudukan','Keseimbangan kiri/kanan bila sepasang']},
            {id:'steering_play',label:'Setang oblak / kemudi tidak stabil',help:'Ada bunyi atau rasa longgar saat melewati jalan tidak rata.',parts:['steering_bearing','bushing'],labor:['steering_service','suspension_check'],checks:['Bearing komstir dan preload','Bushing, baut, serta dudukan','Kelurusan fork dan roda']}
          ],
          parts:[['fork_seal','Seal shock depan','Kompatibilitas mengikuti diameter dan tipe fork.',25000,95000,'set'],['fork_oil','Oli shock depan','Volume dan viskositas mengikuti spesifikasi.',25000,80000,'botol'],['rear_shock','Shock belakang','Harga berbeda untuk standar, aftermarket, dan model.',180000,750000,'buah'],['steering_bearing','Bearing komstir','Jenis tapered atau ball mengikuti model.',45000,180000,'set'],['bushing','Bushing / karet dudukan','Ganti sesuai lokasi komponen yang aus.',20000,110000,'set'],['mounting','Baut dan dudukan terkait','Hanya bila ulir atau dudukan rusak.',10000,65000,'paket']],
          labor:[['fork_service','Jasa servis shock depan','Bongkar fork, ganti seal, isi oli, dan setel.',85000,240000],['shock_replace','Jasa ganti shock belakang','Bongkar pasang dan cek dudukan.',30000,85000],['steering_service','Jasa servis komstir','Bongkar, bersihkan, setel, atau ganti bearing.',70000,190000],['suspension_check','Pemeriksaan suspensi','Cek kebocoran, kelonggaran, dan redaman.',25000,80000]]
        },
        service: {
          label:'Servis berkala', description:'Oli, filter, busi, pemeriksaan rem, ban, dan rantai.',
          symptoms:[
            {id:'service_due',label:'Jadwal servis sudah tiba',help:'Mendekati interval kilometer atau waktu servis.',parts:['oil','spark','air_filter'],labor:['periodic_service'],checks:['Kondisi oli dan kebocoran','Busi dan filter udara','Rem, ban, rantai, lampu, dan aki']},
            {id:'after_long_trip',label:'Pemeriksaan setelah perjalanan jauh',help:'Ingin mengecek komponen sebelum digunakan rutin kembali.',parts:['oil','air_filter'],labor:['inspection','periodic_service'],checks:['Oli dan sistem pendinginan udara','Rem dan kondisi ban','Rantai, baut, dan kelistrikan']}
          ],
          parts:[['oil','Oli mesin','Volume mengikuti kapasitas mesin.',45000,110000,'paket'],['spark','Busi','Penggantian berdasarkan kondisi dan interval.',18000,85000,'buah'],['air_filter','Filter udara','Dibersihkan atau diganti menurut kondisi.',25000,95000,'buah'],['chain_lube','Pelumas rantai','Untuk motor dengan rantai penggerak.',15000,45000,'paket']],
          labor:[['periodic_service','Jasa servis berkala','Pemeriksaan dan pekerjaan servis ringan.',50000,140000],['inspection','Pemeriksaan umum kendaraan','Pemeriksaan visual multi titik.',25000,70000]]
        }
      }
    },
    car: {
      categories: {
        engine: {
          label:'Mesin & pelumasan',description:'Oli, filter, pembakaran, injeksi, kompresi, dan kebocoran mesin.',
          symptoms:[
            {id:'hard_start',label:'Mesin sulit dihidupkan',help:'Starter normal tetapi mesin lama menyala atau gagal hidup.',parts:['spark','air_filter','coil','fuel_clean'],labor:['inspection','tune_up'],checks:['Busi dan ignition coil','Tekanan bahan bakar dan injektor','Sensor dasar dan pembacaan kode kerusakan']},
            {id:'low_power',label:'Tenaga menurun / brebet',help:'Akselerasi tidak responsif atau mesin tersendat.',parts:['air_filter','spark','coil','fuel_clean'],labor:['inspection','tune_up'],checks:['Filter udara dan throttle body','Busi, coil, dan injektor','Scan kode kerusakan dan uji jalan']},
            {id:'smoke',label:'Asap knalpot tidak normal',help:'Asap putih, biru, atau hitam berlebihan.',parts:['oil','gasket','piston_ring'],labor:['inspection','compression_test','top_overhaul'],checks:['Warna asap dan kondisi cairan','Kebocoran gasket/seal','Tes kompresi dan leak-down jika tersedia']},
            {id:'rough_noise',label:'Suara mesin kasar / berisik',help:'Bunyi ketukan, knocking, atau getaran tidak biasa.',parts:['oil','engine_mount','belt'],labor:['inspection','tune_up'],checks:['Level oli dan tekanan pelumasan','Engine mounting dan belt penggerak','Sumber bunyi saat idle dan akselerasi']},
            {id:'oil_leak',label:'Oli merembes / berkurang',help:'Ada rembesan di area mesin atau level oli turun.',parts:['oil','gasket','oil_filter'],labor:['inspection','gasket_job'],checks:['Area cover valve, oil pan, dan seal','Filter oli dan baut pembuangan','Level oli setelah area dibersihkan']}
          ],
          parts:[['oil','Oli mesin mobil','Jenis dan kapasitas mengikuti kode mesin.',250000,850000,'paket'],['oil_filter','Filter oli','Filter OEM/equivalent sesuai mesin.',35000,150000,'buah'],['air_filter','Filter udara mesin','Elemen filter sesuai model kendaraan.',50000,220000,'buah'],['spark','Busi','Jumlah dan tipe bergantung konfigurasi mesin.',80000,520000,'set'],['coil','Ignition coil','Harga per unit; jumlah yang perlu diganti harus diuji.',220000,850000,'buah'],['fuel_clean','Pembersihan injektor / throttle body','Paket pembersihan; bukan penggantian komponen.',150000,550000,'paket'],['gasket','Gasket / seal terkait','Harga berubah sesuai titik kebocoran dan mesin.',80000,480000,'set'],['piston_ring','Ring piston / komponen internal','Hanya estimasi skenario overhaul setelah pemeriksaan.',650000,3200000,'set'],['engine_mount','Engine mounting','Harga per titik; kebutuhan aktual setelah pemeriksaan.',250000,950000,'buah'],['belt','Drive belt / tensioner terkait','Periksa kode part dan konfigurasi mesin.',180000,850000,'paket']],
          labor:[['inspection','Pemeriksaan awal mesin','Visual, kebocoran, scan dasar, dan uji jalan singkat.',75000,200000],['tune_up','Tune-up / pembersihan sistem udara','Pekerjaan sesuai teknologi mesin.',150000,450000],['compression_test','Tes kompresi lanjutan','Pengukuran kompresi tiap silinder.',150000,400000],['top_overhaul','Pekerjaan bongkar mesin lanjutan','Estimasi jasa skenario; bukan rekomendasi otomatis.',900000,3500000],['gasket_job','Jasa perbaikan gasket / seal','Bongkar pasang area yang terindikasi bocor.',250000,950000]]
        },
        brake: {
          label:'Sistem pengereman',description:'Kampas, cakram, kaliper, minyak rem, master, dan selang.',
          symptoms:[
            {id:'brake_noise',label:'Rem berdecit / berisik',help:'Bunyi saat pedal diinjak atau roda berputar.',parts:['pad_front','pad_rear','disc'],labor:['inspection','pad_replace'],checks:['Ketebalan kampas depan dan belakang','Permukaan cakram dan run-out','Kaliper dan pin slider']},
            {id:'brake_weak',label:'Rem kurang pakem',help:'Pedal terasa normal tetapi daya pengereman menurun.',parts:['pad_front','brake_fluid','disc'],labor:['inspection','pad_replace','brake_flush'],checks:['Ketebalan kampas dan cakram','Kualitas minyak rem','Kaliper dan sistem ABS bila ada']},
            {id:'pedal_soft',label:'Pedal rem terasa dalam / empuk',help:'Pedal turun lebih jauh dari biasanya.',parts:['brake_fluid','master_cylinder','caliper'],labor:['inspection','brake_flush'],checks:['Kebocoran master, kaliper, dan selang','Udara pada sistem hidrolik','Kondisi booster dan vacuum line']},
            {id:'brake_vibration',label:'Setir / bodi bergetar saat rem',help:'Getaran terasa saat deselerasi.',parts:['disc','pad_front'],labor:['inspection','disc_job'],checks:['Ketebalan dan variasi ketebalan cakram','Keausan kampas','Kaki-kaki dan bearing roda']}
          ],
          parts:[['pad_front','Kampas rem depan','Umumnya satu axle set; pastikan tipe kaliper.',220000,850000,'set'],['pad_rear','Kampas rem belakang','Pad atau shoe mengikuti sistem rem kendaraan.',180000,720000,'set'],['brake_fluid','Minyak rem','Spesifikasi DOT mengikuti buku manual.',75000,240000,'paket'],['disc','Cakram rem','Rentang ilustrasi per axle, bukan per satu keping.',550000,2100000,'pasang'],['master_cylinder','Master cylinder / repair kit','Penggantian hanya setelah tes kebocoran dan tekanan.',180000,950000,'unit/kit'],['caliper','Seal / kit kaliper','Tergantung tipe dan jumlah kaliper yang dikerjakan.',100000,480000,'kit']],
          labor:[['inspection','Pemeriksaan sistem rem','Pemeriksaan pad, disc, caliper, selang, dan ABS.',80000,220000],['pad_replace','Jasa ganti kampas rem','Bongkar pasang dan pembersihan komponen.',120000,350000],['brake_flush','Flush / bleeding minyak rem','Penggantian dan pembuangan udara sistem.',100000,320000],['disc_job','Jasa ganti cakram','Bongkar pasang, pengukuran, dan uji jalan.',180000,480000]]
        },
        electrical: {
          label:'Aki & kelistrikan',description:'Aki, alternator, starter, relay, sekring, dan sistem kabel.',
          symptoms:[
            {id:'weak_battery',label:'Starter lemah / aki tekor',help:'Mesin sulit distarter atau aki cepat habis.',parts:['battery','alternator','terminal'],labor:['electrical_test','battery_replace'],checks:['Kapasitas dan tegangan aki','Output alternator dan voltage drop','Terminal, kabel massa, dan arus bocor']},
            {id:'charging',label:'Lampu redup / pengisian bermasalah',help:'Tegangan tidak stabil atau indikator aki menyala.',parts:['alternator','battery','regulator'],labor:['electrical_test','charging_test'],checks:['Output alternator dan regulator','Kabel pengisian dan konektor','Aki dengan load tester']},
            {id:'starter_dead',label:'Starter tidak merespons',help:'Terdengar klik atau motor starter tidak berputar.',parts:['starter','relay','battery'],labor:['electrical_test','starter_test'],checks:['Aki dan sambungan terminal','Relay, solenoid, dan kabel starter','Motor starter dan sinyal ignition']},
            {id:'electrical_random',label:'Kelistrikan mati-hidup',help:'Perangkat listrik bekerja tidak konsisten.',parts:['fuse','wiring','relay'],labor:['electrical_test','wiring_repair'],checks:['Sekring dan relay','Grounding dan sambungan kabel','Alternator dan beban kelistrikan']}
          ],
          parts:[['battery','Aki mobil','Kapasitas Ah dan CCA mengikuti mesin dan fitur kendaraan.',850000,2600000,'unit'],['alternator','Alternator / komponen pengisian','Bisa berupa regulator, pulley, atau unit alternator.',850000,4200000,'unit/paket'],['starter','Motor starter / solenoid','Komponen diuji sebelum diputuskan untuk diganti.',650000,3200000,'unit'],['relay','Relay dan sekring','Harga tergantung jenis dan jumlah komponen.',25000,260000,'paket'],['terminal','Terminal aki dan konektor','Termasuk terminal atau konektor yang perlu diganti.',25000,180000,'paket'],['regulator','Regulator pengisian','Untuk kendaraan dengan regulator terpisah.',250000,950000,'unit'],['wiring','Perbaikan kabel utama','Nilai tergantung titik dan panjang kabel.',120000,650000,'paket'],['fuse','Fuse / fuse link','Jenis dan rating harus sesuai spesifikasi.',10000,120000,'paket']],
          labor:[['electrical_test','Pemeriksaan kelistrikan','Pengukuran aki, alternator, starter, dan rangkaian.',80000,250000],['battery_replace','Jasa penggantian aki','Pemasangan dan reset sederhana bila diperlukan.',50000,150000],['charging_test','Tes sistem pengisian','Pemeriksaan output dan voltage drop.',80000,220000],['starter_test','Pemeriksaan starter','Bongkar pemeriksaan solenoid dan motor starter.',120000,450000],['wiring_repair','Jasa perbaikan kabel','Pencarian gangguan dan perbaikan sambungan.',150000,650000]]
        },
        cooling: {
          label:'Sistem pendingin mesin',description:'Radiator, coolant, thermostat, kipas, selang, dan water pump.',
          symptoms:[
            {id:'overheat',label:'Mesin cepat panas / overheat',help:'Indikator suhu naik atau coolant berkurang.',parts:['coolant','thermostat','radiator_cap','hose','water_pump'],labor:['cooling_test','cooling_flush'],checks:['Kebocoran radiator, selang, dan reservoir','Kerja kipas, thermostat, dan tutup radiator','Water pump dan kemungkinan gas pembakaran di coolant']},
            {id:'coolant_leak',label:'Air radiator / coolant berkurang',help:'Sering menambah coolant atau melihat genangan.',parts:['coolant','hose','radiator_cap','water_pump'],labor:['cooling_test'],checks:['Pressure test sistem pendingin','Selang, clamp, radiator, dan reservoir','Water pump serta area gasket']},
            {id:'fan_issue',label:'Kipas radiator tidak normal',help:'Kipas tidak menyala, terlambat, atau terus menyala.',parts:['fan_motor','relay','coolant'],labor:['cooling_test','electrical_test'],checks:['Motor kipas dan relay','Sensor suhu dan jalur kelistrikan','Sirkulasi coolant']}
          ],
          parts:[['coolant','Coolant radiator','Jenis coolant dan kapasitas mengikuti spesifikasi.',120000,420000,'paket'],['thermostat','Thermostat','Kompatibilitas mengikuti kode mesin.',180000,750000,'unit'],['radiator_cap','Tutup radiator','Tekanan rating harus sesuai kendaraan.',50000,180000,'unit'],['hose','Selang radiator dan clamp','Harga tergantung jumlah selang yang diganti.',100000,650000,'paket'],['water_pump','Water pump','Pekerjaan dapat terkait timing belt pada model tertentu.',450000,2200000,'unit'],['fan_motor','Motor kipas radiator','Periksa motor, resistor, dan modul kontrol.',350000,1800000,'unit'],['relay','Relay kipas','Komponen diuji sebelum diganti.',25000,180000,'unit']],
          labor:[['cooling_test','Pressure test dan pemeriksaan pendingin','Pemeriksaan kebocoran dan kerja sistem.',100000,300000],['cooling_flush','Flush sistem pendingin','Pembuangan coolant lama dan pengisian ulang.',150000,420000],['electrical_test','Pemeriksaan kelistrikan kipas','Tes relay, sensor, motor, dan kabel.',80000,220000]]
        },
        transmission: {
          label:'Transmisi & kopling',description:'Oli transmisi, filter, mounting, kopling, dan pemindah gigi.',
          symptoms:[
            {id:'gear_slip',label:'Transmisi selip / rpm naik',help:'Putaran mesin naik tetapi laju kendaraan tidak sebanding.',parts:['atf','trans_filter','clutch_kit'],labor:['trans_inspect','fluid_service'],checks:['Level, warna, dan kondisi ATF/oli transmisi','Kode kerusakan transmisi bila tersedia','Kopling dan mounting sesuai jenis transmisi']},
            {id:'gear_hard',label:'Perpindahan gigi kasar',help:'Pindah gigi terasa menghentak atau sulit.',parts:['atf','trans_filter','mounting'],labor:['trans_inspect','fluid_service'],checks:['Kondisi fluida dan filter transmisi','Adaptasi/kalibrasi jika didukung kendaraan','Engine/transmission mounting']},
            {id:'clutch_noise',label:'Kopling berisik / selip',help:'Pedal atau perpindahan tenaga terasa tidak normal.',parts:['clutch_kit','clutch_bearing','gear_oil'],labor:['trans_inspect','clutch_job'],checks:['Ketebalan kampas dan pressure plate','Release bearing dan flywheel','Kebocoran sistem hidrolik kopling']}
          ],
          parts:[['atf','ATF / oli transmisi otomatis','Jenis fluida harus sesuai kode transmisi.',250000,1200000,'paket'],['trans_filter','Filter transmisi dan gasket pan','Untuk transmisi yang memiliki filter servis.',180000,950000,'paket'],['clutch_kit','Clutch kit','Rentang ilustrasi untuk komponen kopling, bergantung model.',850000,4200000,'set'],['clutch_bearing','Release bearing','Perlu pemeriksaan saat transmisi dibongkar.',250000,1200000,'buah'],['gear_oil','Oli transmisi manual','Spesifikasi dan kapasitas mengikuti manual.',150000,550000,'paket'],['mounting','Transmission / engine mounting','Penggantian berdasarkan hasil pemeriksaan.',350000,1800000,'buah']],
          labor:[['trans_inspect','Pemeriksaan transmisi','Pemeriksaan gejala, kebocoran, fluida, dan scan dasar.',150000,450000],['fluid_service','Jasa penggantian fluida transmisi','Metode drain/refill atau prosedur sesuai model.',150000,500000],['clutch_job','Jasa pekerjaan kopling','Bongkar pasang transmisi dan pemeriksaan komponen.',1200000,3800000]]
        },
        tire: {
          label:'Ban, velg & roda',description:'Ban, pentil, balancing, spooring, bearing, dan velg.',
          symptoms:[
            {id:'tire_worn',label:'Ban aus / botak',help:'Tapak menipis atau aus tidak merata.',parts:['tire_front','tire_rear','valve'],labor:['tire_install','alignment'],checks:['Kedalaman alur dan usia ban','Pola keausan untuk mendeteksi toe/camber','Tekanan, velg, dan bearing roda']},
            {id:'tire_vibration',label:'Setir bergetar saat jalan',help:'Getaran muncul pada kecepatan tertentu.',parts:['tire_front','valve'],labor:['balancing','alignment'],checks:['Balancing roda','Kondisi ban dan velg','Bearing, tie rod, dan kaki-kaki']},
            {id:'tire_flat',label:'Ban sering kempis',help:'Tekanan berkurang tanpa sebab yang jelas.',parts:['tire_patch','valve','tire_front'],labor:['tire_check','tire_install'],checks:['Kebocoran tapak dan dinding samping','Pentil dan bead ban','Retak/benjol pada ban']},
            {id:'pulling',label:'Mobil menarik ke satu sisi',help:'Arah kendaraan cenderung menyimpang di jalan rata.',parts:['valve','tire_front'],labor:['alignment'],checks:['Tekanan ban kiri dan kanan','Spooring, tie rod, ball joint, dan bushing','Riwayat benturan velg atau suspensi']}
          ],
          parts:[['tire_front','Ban depan','Harga per ban; ukuran dan merek sangat menentukan.',650000,2200000,'buah'],['tire_rear','Ban belakang','Harga per ban; ukuran dan merek sangat menentukan.',650000,2400000,'buah'],['valve','Pentil ban','Pentil karet atau TPMS sesuai kendaraan.',15000,180000,'buah'],['tire_patch','Tambal ban','Dilakukan hanya bila jenis/lokasi bocor masih aman.',25000,100000,'tindakan']],
          labor:[['tire_check','Pemeriksaan ban dan roda','Cek tekanan, tapak, dinding, dan kebocoran.',35000,100000],['tire_install','Jasa bongkar pasang ban','Harga per roda atau paket sesuai bengkel.',50000,180000],['balancing','Balancing roda','Harga per roda atau satu set.',30000,140000],['alignment','Spooring / wheel alignment','Pengecekan dan penyetelan geometri roda.',150000,450000]]
        },
        suspension: {
          label:'Suspensi & kemudi',description:'Shock absorber, bushing, ball joint, tie rod, dan bearing.',
          symptoms:[
            {id:'susp_noise',label:'Kaki-kaki bunyi gluduk',help:'Bunyi muncul saat melewati jalan tidak rata.',parts:['shock','bushing','ball_joint','tie_rod'],labor:['susp_inspect','susp_replace'],checks:['Shock absorber dan mounting','Bushing arm dan stabilizer link','Ball joint, tie rod, dan rack end']},
            {id:'susp_bounce',label:'Mobil limbung / memantul',help:'Bodi terasa mengayun berlebihan setelah melewati gelombang.',parts:['shock','mounting'],labor:['susp_inspect','susp_replace'],checks:['Redaman shock absorber','Mounting atas dan karet dudukan','Kondisi ban dan pegas']},
            {id:'steering_play',label:'Setir oblak / tidak presisi',help:'Ada kelonggaran atau arah kemudi terasa tidak stabil.',parts:['tie_rod','ball_joint','bushing'],labor:['susp_inspect','alignment'],checks:['Tie rod end dan rack end','Ball joint dan bushing arm','Spooring setelah penggantian komponen']}
          ],
          parts:[['shock','Shock absorber','Harga per unit; penggantian sepasang sering direkomendasikan setelah pemeriksaan.',450000,2200000,'buah'],['mounting','Shock mounting / support','Termasuk bearing atau karet dudukan sesuai desain.',180000,950000,'buah'],['bushing','Bushing arm / stabilizer','Harga tergantung posisi dan material.',80000,550000,'buah/set'],['ball_joint','Ball joint','Periksa apakah dapat diganti terpisah atau menyatu dengan arm.',180000,950000,'buah'],['tie_rod','Tie rod end / rack end','Komponen kemudi; perlu spooring setelah pekerjaan.',150000,750000,'buah']],
          labor:[['susp_inspect','Pemeriksaan kaki-kaki','Inspeksi di lift dan pemeriksaan kelonggaran.',80000,250000],['susp_replace','Jasa penggantian komponen kaki-kaki','Harga tergantung posisi dan tingkat pembongkaran.',150000,850000],['alignment','Spooring setelah pekerjaan','Penyetelan geometri roda.',150000,450000]]
        },
        ac: {
          label:'AC & kabin',description:'Filter kabin, refrigeran, kebocoran, blower, dan kompresor.',
          symptoms:[
            {id:'ac_not_cold',label:'AC kurang dingin',help:'Udara keluar tetapi suhu tidak cukup dingin.',parts:['cabin_filter','refrigerant','expansion'],labor:['ac_check','ac_service'],checks:['Tekanan high/low dan temperatur outlet','Kebersihan kondensor dan evaporator','Kebocoran refrigeran']},
            {id:'ac_noise',label:'AC berisik',help:'Ada bunyi saat AC dinyalakan.',parts:['compressor_clutch','belt','cabin_filter'],labor:['ac_check'],checks:['Bearing pulley dan magnetic clutch','Drive belt dan tensioner','Blower motor dan filter kabin']},
            {id:'ac_smell',label:'AC bau / aliran lemah',help:'Udara berbau atau hembusan terasa kecil.',parts:['cabin_filter'],labor:['ac_clean'],checks:['Filter kabin','Evaporator dan saluran drain','Blower dan ventilasi']},
            {id:'ac_leak',label:'Diduga ada kebocoran freon',help:'AC dingin sebentar lalu tidak dingin.',parts:['refrigerant','expansion','ac_hose'],labor:['ac_leak_test','ac_service'],checks:['Leak test pada sambungan dan kondensor','O-ring dan selang AC','Kondisi evaporator dan kompresor']}
          ],
          parts:[['cabin_filter','Filter kabin','Tipe filter dan ukuran mengikuti model.',45000,220000,'buah'],['refrigerant','Refrigeran dan oli AC','Jenis refrigeran wajib sesuai label kendaraan.',120000,450000,'paket'],['expansion','Expansion valve / O-ring','Penggantian setelah kebocoran atau sumbatan dipastikan.',180000,950000,'paket'],['compressor_clutch','Magnetic clutch / bearing kompresor','Perlu dibedakan dengan kerusakan internal kompresor.',350000,1800000,'paket'],['belt','Drive belt AC','Jika menggunakan belt terpisah dan kondisinya tidak layak.',150000,650000,'buah'],['ac_hose','Selang / sambungan AC','Harga tergantung lokasi dan jenis selang.',180000,950000,'paket']],
          labor:[['ac_check','Pemeriksaan performa AC','Cek tekanan, temperatur, airflow, dan kebocoran awal.',100000,280000],['ac_service','Servis sistem AC','Prosedur servis dan pengisian sesuai hasil pemeriksaan.',180000,550000],['ac_clean','Pembersihan filter/evaporator','Lingkup pembersihan bergantung akses dan kondisi.',150000,550000],['ac_leak_test','Leak test AC','Pemeriksaan kebocoran menggunakan metode sesuai bengkel.',100000,350000]]
        },
        service: {
          label:'Servis berkala',description:'Oli, filter, busi, fluida, rem, ban, dan pemeriksaan multi titik.',
          symptoms:[
            {id:'service_due',label:'Jadwal servis sudah tiba',help:'Kilometer atau waktu servis mendekati interval.',parts:['oil','oil_filter','air_filter','spark'],labor:['periodic_service'],checks:['Oli mesin dan filter','Filter udara dan busi sesuai interval','Rem, ban, coolant, aki, dan kebocoran']},
            {id:'long_trip',label:'Pemeriksaan sebelum/sesudah perjalanan jauh',help:'Mau memastikan kendaraan siap digunakan.',parts:['oil','oil_filter','air_filter'],labor:['inspection','periodic_service'],checks:['Oli dan coolant','Rem, ban, tekanan, dan ban serep','Aki, lampu, wiper, dan kebocoran']}
          ],
          parts:[['oil','Oli mesin','Jenis dan kapasitas mengikuti kode mesin.',250000,850000,'paket'],['oil_filter','Filter oli','Tipe filter mengikuti mesin.',35000,180000,'buah'],['air_filter','Filter udara','Elemen filter sesuai model kendaraan.',50000,220000,'buah'],['spark','Busi','Jumlah dan tipe mengikuti mesin.',80000,520000,'set']],
          labor:[['periodic_service','Jasa servis berkala','Pemeriksaan dan pekerjaan servis ringan.',180000,550000],['inspection','Pemeriksaan multi titik','Pemeriksaan visual sebelum/sesudah perjalanan.',75000,220000]]
        }
      }
    }
  };

  const SEVERITY = {
    unknown:{label:'Belum diketahui',labor:1.00,note:'Kondisi belum dapat dinilai dari informasi pengguna.'},
    light:{label:'Ringan',labor:.95,note:'Asumsi pekerjaan relatif sederhana dan akses komponen normal.'},
    medium:{label:'Sedang',labor:1.15,note:'Asumsi perlu pembongkaran atau pemeriksaan tambahan.'},
    heavy:{label:'Berat',labor:1.35,note:'Asumsi pekerjaan lebih kompleks; pemeriksaan langsung wajib dilakukan.'}
  };
  const SEGMENTS = {
    motor:[['standard','Motor harian ≤150 cc',1],['medium','Motor 150–250 cc',1.12],['large','Motor >250 cc / premium',1.3]],
    car:[['lcgc','LCGC / city car',1],['medium','Sedan / MPV kompak',1.12],['large','SUV / MPV besar / premium',1.28]]
  };
  const EXTRA = {
    motor:{inspection:[20000,60000],consumable:[10000,35000]},
    car:{inspection:[50000,150000],consumable:[25000,90000]}
  };

  function init() {
    const form = $('#detailedEstimatorForm');
    if (!form) return;

    const vehicleType = $('#detailVehicleType');
    const category = $('#detailCategory');
    const segment = $('#detailSegment');
    const symptomsBox = $('#detailSymptoms');
    const resultBox = $('#detailEstimateResult');
    const errorBox = $('#detailEstimateError');
    const saveButton = $('#saveDetailedEstimate');
    const historyBox = $('#estimateHistoryList');
    let latestResult = null;

    function setSegments() {
      const kind = vehicleType.value;
      segment.innerHTML = SEGMENTS[kind].map(([value,label]) =>
        `<option value="${value}">${label}</option>`).join('');
    }

    function setCategories() {
      const kind = vehicleType.value;
      const current = category.value;
      const entries = Object.entries(CATALOG[kind].categories);
      category.innerHTML = entries.map(([value,item]) =>
        `<option value="${value}">${escapeHTML(item.label)}</option>`).join('');
      if (CATALOG[kind].categories[current]) category.value = current;
      renderSymptoms();
    }

    function renderSymptoms() {
      const spec = CATALOG[vehicleType.value].categories[category.value];
      symptomsBox.innerHTML = spec.symptoms.map(item => `
        <label class="estimate-symptom">
          <input type="checkbox" name="symptoms" value="${item.id}">
          <span><strong>${escapeHTML(item.label)}</strong><small>${escapeHTML(item.help)}</small></span>
        </label>
      `).join('');
      $('#detailCategoryHelp').textContent = spec.description;
    }

    vehicleType.addEventListener('change', () => {
      setSegments();
      setCategories();
      resultBox.hidden = true;
      latestResult = null;
    });
    category.addEventListener('change', () => {
      renderSymptoms();
      resultBox.hidden = true;
      latestResult = null;
    });
    setSegments();
    setCategories();

    function calculate() {
      const kind = vehicleType.value;
      const categoryId = category.value;
      const severityId = $('#detailSeverity').value;
      const vehicleSegment = segment.value;
      const spec = CATALOG[kind].categories[categoryId];
      const symptomIds = $$('input[name="symptoms"]:checked', symptomsBox).map(input => input.value);
      if (!symptomIds.length) {
        throw new Error('Pilih minimal satu gejala agar daftar komponen yang diperiksa lebih relevan.');
      }
      const chosenSymptoms = spec.symptoms.filter(item => symptomIds.includes(item.id));
      const selectedPartCodes = [...new Set(chosenSymptoms.flatMap(item => item.parts))];
      const selectedLaborCodes = [...new Set(chosenSymptoms.flatMap(item => item.labor))];
      const segmentFactor = (SEGMENTS[kind].find(item => item[0] === vehicleSegment) || [null,null,1])[2];
      const severity = SEVERITY[severityId] || SEVERITY.unknown;
      const year = Number($('#detailYear').value || new Date().getFullYear());
      const odo = Number($('#detailOdometer').value || 0);
      const parts = spec.parts.filter(item => selectedPartCodes.includes(item[0])).map(item => ({
        type:'part', code:item[0], name:item[1], note:item[2], unit:item[5], qty:1,
        min:round(item[3] * segmentFactor), max:round(item[4] * segmentFactor)
      }));
      const labor = spec.labor.filter(item => selectedLaborCodes.includes(item[0])).map(item => ({
        type:'labor', code:item[0], name:item[1], note:item[2], unit:'jasa', qty:1,
        min:round(item[3] * segmentFactor * severity.labor),
        max:round(item[4] * segmentFactor * severity.labor)
      }));
      const includeInspection = $('#includeInspection').checked;
      const includeConsumables = $('#includeConsumables').checked;
      const extras = [];
      if (includeInspection) extras.push({type:'inspection',code:'general_inspection',name:'Pemeriksaan awal dan pencatatan kondisi',note:'Biaya ilustratif untuk inspeksi awal; dapat digabung dengan jasa bengkel.',unit:'paket',qty:1,min:round(EXTRA[kind].inspection[0] * segmentFactor),max:round(EXTRA[kind].inspection[1] * segmentFactor)});
      if (includeConsumables) extras.push({type:'consumable',code:'shop_consumables',name:'Bahan pendukung dan consumables',note:'Cleaner, grease, lap, cable ties, atau bahan kecil sesuai pekerjaan.',unit:'paket',qty:1,min:round(EXTRA[kind].consumable[0] * segmentFactor),max:round(EXTRA[kind].consumable[1] * segmentFactor)});
      const sum = rows => rows.reduce((acc,item) => ({min:acc.min + item.min * item.qty,max:acc.max + item.max * item.qty}),{min:0,max:0});
      const partSum = sum(parts);
      const laborSum = sum(labor);
      const extraSum = sum(extras);
      const total = {min:partSum.min + laborSum.min + extraSum.min,max:partSum.max + laborSum.max + extraSum.max};
      const city = $('#detailArea').value.trim();
      const vehicle = {
        type:kind === 'motor' ? 'Sepeda motor' : 'Mobil',
        dbType:kind === 'motor' ? 'motorcycle' : 'car',
        brand:$('#detailBrand').value.trim(), model:$('#detailModel').value.trim(),
        year, odometer:odo || null, segment:vehicleSegment,
        transmission:$('#detailTransmission').value || null
      };
      const checks = [...new Set(chosenSymptoms.flatMap(item => item.checks))];
      const notes = $('#detailNotes').value.trim();
      return {
        version:1, mode:'simulation', currency:'IDR', createdAt:new Date().toISOString(),
        vehicle, category:categoryId, categoryLabel:spec.label,
        severity:severityId, severityLabel:severity.label, severityNote:severity.note,
        symptoms:chosenSymptoms.map(item => ({id:item.id,label:item.label,help:item.help})),
        symptomCodes:symptomIds, area:city, customerNotes:notes,
        items:{parts,labor,extras},
        subtotals:{parts:partSum,labor:laborSum,extras:extraSum},
        total, checks,
        assumptions:[
          'Harga komponen menggunakan rentang simulasi generik, bukan penawaran dari toko atau bengkel tertentu.',
          'Merek, model, tahun, varian, ukuran, kode part, dan ketersediaan dapat mengubah harga aktual.',
          severity.note,
          'Komponen yang tercantum adalah kandidat pemeriksaan, bukan konfirmasi bahwa komponen tersebut rusak.'
        ]
      };
    }

    function renderRows(rows) {
      if (!rows.length) return '<div class="estimate-empty-lines">Tidak ada item pada kelompok ini berdasarkan gejala yang dipilih.</div>';
      return `<table class="estimate-line-table"><thead><tr><th>Komponen / pekerjaan</th><th>Qty</th><th>Rentang simulasi</th></tr></thead><tbody>${rows.map(item => `
        <tr><td><span class="estimate-line-name">${escapeHTML(item.name)}</span><span class="estimate-line-note">${escapeHTML(item.note)}</span><span class="estimate-line-sub">${escapeHTML(item.unit)}</span></td><td>${item.qty}</td><td>${rupiah(item.min)} – ${rupiah(item.max)}</td></tr>
      `).join('')}</tbody></table>`;
    }

    function renderResult(data) {
      const vehicleName = `${data.vehicle.brand || 'Kendaraan'} ${data.vehicle.model || ''}`.trim();
      $('#detailResultVehicle').textContent = `${vehicleName} · ${data.vehicle.year} · ${data.vehicle.type}`;
      $('#detailTotalRange').textContent = `${rupiah(data.total.min)} – ${rupiah(data.total.max)}`;
      $('#detailResultSummary').textContent = `${data.categoryLabel}; ${data.symptoms.map(item => item.label.toLowerCase()).join(', ')}.`;
      $('#detailPartSubtotal').textContent = `${rupiah(data.subtotals.parts.min)} – ${rupiah(data.subtotals.parts.max)}`;
      $('#detailLaborSubtotal').textContent = `${rupiah(data.subtotals.labor.min)} – ${rupiah(data.subtotals.labor.max)}`;
      $('#detailExtraSubtotal').textContent = `${rupiah(data.subtotals.extras.min)} – ${rupiah(data.subtotals.extras.max)}`;
      $('#detailTotalCard').textContent = `${rupiah(data.total.min)} – ${rupiah(data.total.max)}`;
      $('#detailItemCount').textContent = `${data.items.parts.length} kandidat part · ${data.items.labor.length} pekerjaan jasa`;
      $('#detailPartsRows').innerHTML = renderRows(data.items.parts);
      $('#detailLaborRows').innerHTML = renderRows(data.items.labor);
      $('#detailExtrasRows').innerHTML = renderRows(data.items.extras);
      $('#detailChecks').innerHTML = data.checks.map(text => `<div class="estimate-inspection-item">${escapeHTML(text)}</div>`).join('');
      $('#detailAssumptions').innerHTML = data.assumptions.map(text => `<li>${escapeHTML(text)}</li>`).join('');
      const recommendation = data.severity === 'heavy'
        ? 'Hentikan penggunaan bila kendaraan menunjukkan gejala berisiko, seperti rem gagal, temperatur berlebih, kebocoran bahan bakar, atau suara mesin keras. Minta pemeriksaan langsung sebelum melanjutkan perjalanan.'
        : data.severity === 'medium'
          ? 'Jadwalkan pemeriksaan bengkel dalam waktu dekat. Minta mekanik mengonfirmasi sumber gejala dan menunjukkan kondisi part sebelum penggantian.'
          : 'Gunakan rincian ini sebagai daftar pertanyaan saat pemeriksaan. Minta mekanik memeriksa komponen terkait sebelum menyetujui penggantian.';
      $('#detailRecommendation').textContent = recommendation;
      $('#detailSaveStatus').textContent = 'Belum disimpan ke akun.';
      saveButton.disabled = false;
      saveButton.textContent = 'Simpan ke riwayat akun';
      resultBox.hidden = false;
      resultBox.scrollIntoView({behavior:'smooth',block:'start'});
    }

    form.addEventListener('submit', event => {
      event.preventDefault();
      errorBox.hidden = true;
      if (!form.reportValidity()) return;
      try {
        latestResult = calculate();
        window.BENGKELINAI_LAST_ESTIMATE = latestResult;
        renderResult(latestResult);
        const total = latestResult.total;
        if (typeof window.showToast === 'function') {
          window.showToast(`Rincian simulasi dibuat: ${rupiah(total.min)} – ${rupiah(total.max)}.`);
        }
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.hidden = false;
      }
    });

    saveButton.addEventListener('click', async () => {
      if (!latestResult) return;
      const db = window.BENGKELINAI_DB;
      const client = db?.client;
      if (!client || !db.configured) {
        $('#detailSaveStatus').textContent = 'Koneksi Supabase belum tersedia.';
        return;
      }
      saveButton.disabled = true;
      saveButton.textContent = 'Menyimpan...';
      try {
        const {data:{user},error:userError} = await client.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          $('#detailSaveStatus').textContent = 'Masuk dahulu untuk menyimpan estimasi.';
          saveButton.disabled = false;
          saveButton.textContent = 'Masuk untuk menyimpan';
          location.href = 'auth.html?next=estimasi.html';
          return;
        }
        const r = latestResult;
        const mid = obj => Math.round((obj.min + obj.max) / 2);
        const payload = {
          user_id:user.id,
          vehicle_type:r.vehicle.dbType,
          problem_category:r.category,
          severity:r.severity,
          area:r.area || null,
          estimated_min:r.total.min,
          estimated_max:r.total.max,
          labor_amount:mid(r.subtotals.labor),
          parts_amount:mid(r.subtotals.parts),
          is_simulated:true,
          vehicle_brand:r.vehicle.brand || null,
          vehicle_model:r.vehicle.model || null,
          vehicle_year:r.vehicle.year || null,
          odometer_km:r.vehicle.odometer || null,
          vehicle_segment:r.vehicle.segment || null,
          symptoms:r.symptomCodes,
          customer_notes:r.customerNotes || null,
          details_json:r
        };
        const {data:row,error} = await client.from('estimates').insert(payload).select('id').single();
        if (error) throw error;
        $('#detailSaveStatus').textContent = `Tersimpan ke riwayat akun. ID: ${row.id.slice(0,8).toUpperCase()}`;
        saveButton.textContent = 'Tersimpan';
        saveButton.disabled = true;
        if (typeof window.showToast === 'function') window.showToast('Rincian estimasi berhasil disimpan ke akun Kamu.');
        loadHistory();
      } catch (error) {
        console.error('Save detailed estimate:',error);
        $('#detailSaveStatus').textContent = error.message || 'Gagal menyimpan estimasi. Jalankan migration SQL terlebih dahulu.';
        saveButton.disabled = false;
        saveButton.textContent = 'Coba simpan lagi';
      }
    });

    $('#copyDetailedEstimate')?.addEventListener('click', async () => {
      if (!latestResult) return;
      const r = latestResult;
      const lines = [
        'BENGKELINAI — ESTIMASI BIAYA SIMULASI',
        `${r.vehicle.brand} ${r.vehicle.model} (${r.vehicle.year})`,
        `${r.vehicle.type} · ${r.categoryLabel}`,
        `Gejala: ${r.symptoms.map(x => x.label).join(', ')}`,
        '', 'PART / KOMPONEN',
        ...r.items.parts.map(x => `- ${x.name}: ${rupiah(x.min)}–${rupiah(x.max)}`),
        '', 'JASA',
        ...r.items.labor.map(x => `- ${x.name}: ${rupiah(x.min)}–${rupiah(x.max)}`),
        '', 'TAMBAHAN',
        ...r.items.extras.map(x => `- ${x.name}: ${rupiah(x.min)}–${rupiah(x.max)}`),
        '', `TOTAL: ${rupiah(r.total.min)}–${rupiah(r.total.max)}`,
        '', 'Seluruh angka adalah simulasi, bukan penawaran harga resmi.'
      ];
      try {
        await navigator.clipboard.writeText(lines.join('\n'));
        if (typeof window.showToast === 'function') window.showToast('Ringkasan estimasi disalin.');
      } catch {
        $('#detailSaveStatus').textContent = 'Clipboard tidak diizinkan oleh browser.';
      }
    });

    $('#printDetailedEstimate')?.addEventListener('click', () => {
      if (latestResult) window.print();
    });

    async function loadHistory() {
      if (!historyBox) return;
      const client = window.BENGKELINAI_DB?.client;
      if (!client) return;
      const {data:{user}} = await client.auth.getUser();
      if (!user) {
        historyBox.innerHTML = '<div class="estimate-empty-lines">Masuk untuk melihat estimasi yang pernah disimpan.</div>';
        return;
      }
      const {data,error} = await client.from('estimates')
        .select('id,created_at,estimated_min,estimated_max,problem_category,vehicle_brand,vehicle_model')
        .eq('user_id',user.id).order('created_at',{ascending:false}).limit(5);
      if (error) {
        historyBox.innerHTML = '<div class="estimate-empty-lines">Riwayat belum tersedia. Pastikan migration detail estimasi sudah dijalankan.</div>';
        return;
      }
      if (!data?.length) {
        historyBox.innerHTML = '<div class="estimate-empty-lines">Belum ada estimasi tersimpan pada akun ini.</div>';
        return;
      }
      historyBox.innerHTML = data.map(row => `
        <article class="estimate-history-item">
          <div><strong>${escapeHTML([row.vehicle_brand,row.vehicle_model].filter(Boolean).join(' ') || 'Kendaraan')} · ${escapeHTML(row.problem_category)}</strong><small>${new Date(row.created_at).toLocaleString('id-ID')}</small></div>
          <b>${rupiah(row.estimated_min)} – ${rupiah(row.estimated_max)}</b>
        </article>
      `).join('');
    }

    window.addEventListener('bai:auth-ready', loadHistory);
    window.addEventListener('pageshow', loadHistory);
    window.setTimeout(loadHistory, 800);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
