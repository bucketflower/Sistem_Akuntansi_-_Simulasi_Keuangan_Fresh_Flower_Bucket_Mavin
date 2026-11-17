import { db } from "./js/config.js";
import { collection, onSnapshot, query, orderBy } from "https://gstatic.com";
import { dbTambahBunga, dbSimpanTransaksi } from "./js/db.js";
import { kalkulasiLabaRugi, kalkulasiNeraca, prosesBukuBesar } from "./js/accounting.js";
import { renderTabelStok, renderJurnalUmum, renderBukuBesar, formatRupiah } from "./js/ui.js";

// State Data Global Sementara
let globalFlowers = [];
let globalJournals = [];

// -------------------------------------------------------------
// REAL-TIME DATABASE LISTENERS
// -------------------------------------------------------------
onSnapshot(collection(db, "flowers"), (snapshot) => {
    globalFlowers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderTabelStok(globalFlowers);
    updateDropdownBungaOptions();
    refreshSemuaLaporan();
});

const qJournals = query(collection(db, "journals"), orderBy("tanggal", "asc"));
onSnapshot(qJournals, (snapshot) => {
    globalJournals = snapshot.docs.map(doc => doc.data());
    renderJurnalUmum(globalJournals);
    refreshSemuaLaporan();
    triggerBukuBesarFilter();
});

// -------------------------------------------------------------
// UPDATE KONDISI LAPORAN & DASHBOARD
// -------------------------------------------------------------
function refreshSemuaLaporan() {
    let totalAsetPersediaan = globalFlowers.reduce((acc, f) => acc + (f.hargaBeli * f.stok), 0);
    
    const lr = kalkulasiLabaRugi(globalJournals);
    const neraca = kalkulasiNeraca(globalJournals, totalAsetPersediaan);

    // Dashboard & Laba Rugi Widgets
    document.getElementById("db-kas").innerText = formatRupiah(neraca.kas);
    document.getElementById("db-pendapatan").innerText = formatRupiah(lr.pendapatan);
    document.getElementById("db-beban").innerText = formatRupiah(lr.bebanOperasional + lr.hpp);
    document.getElementById("db-laba").innerText = formatRupiah(lr.labaBersih);

    // Laporan Keuangan Detail View
    document.getElementById("lr-pendapatan").innerText = formatRupiah(lr.pendapatan);
    document.getElementById("lr-hpp").innerText = formatRupiah(lr.hpp);
    document.getElementById("lr-beban-total").innerText = formatRupiah(lr.bebanOperasional);
    document.getElementById("lr-laba-bersih").innerText = formatRupiah(lr.labaBersih);

    // Neraca Detail View
    document.getElementById("n-kas").innerText = formatRupiah(neraca.kas);
    document.getElementById("n-persediaan").innerText = formatRupiah(totalAsetPersediaan);
    document.getElementById("n-total-aset").innerText = formatRupiah(neraca.totalAset);
    document.getElementById("n-modal").innerText = formatRupiah(neraca.modal);
    document.getElementById("n-prive").innerText = `(${formatRupiah(neraca.prive)})`;
    document.getElementById("n-laba-berjalan").innerText = formatRupiah(neraca.labaBersih);
    document.getElementById("n-total-pasiva").innerText = formatRupiah(neraca.totalPasiva);
}

// -------------------------------------------------------------
// EVENT HANDLERS & BINDING INTERFACE
// -------------------------------------------------------------

// Form: Tambah Bunga Baru
window.handleTambahBungaSubmit = async function(e) {
    e.preventDefault();
    const kode = document.getElementById("bf-kode").value;
    const data = {
        nama: document.getElementById("bf-nama").value,
        kategori: document.getElementById("bf-kategori").value,
        hargaBeli: Number(document.getElementById("bf-hbeli").value),
        hargaJual: Number(document.getElementById("bf-hjual").value),
        stok: Number(document.getElementById("bf-stok").value)
    };

    try {
        await dbTambahBunga(kode, data);
        alert("Bunga Berhasil Ditambahkan ke Database!");
        document.getElementById("form-tambah-bunga").reset();
    } catch (err) {
        alert("Gagal: " + err.message);
    }
};

// Form: Simpan Transaksi Keuangan
window.handleTransaksiSubmit = async function(e) {
    e.preventDefault();
    
    // Logika mengambil array komposisi buket dari UI dinamis Anda
    const rincianBuket = collectKomposisiBuket(); 
    
    const dataTransaksi = {
        tanggal: document.getElementById("tx-tanggal").value,
        kategori: document.getElementById("tx-kategori").value,
        keterangan: document.getElementById("tx-keterangan").value,
        nominal: Number(document.getElementById("tx-nominal").value),
        jenisBeban: document.getElementById("tx-jenis-beban")?.value || "",
        rincianBuket: rincianBuket
    };

    try {
        await dbSimpanTransaksi(dataTransaksi);
        alert("Posting Transaksi dan Jurnal Berhasil Balance!");
        document.getElementById("form-transaksi").reset();
    } catch (err) {
        alert("Posting Gagal: " + err.message);
    }
};

// Fungsi dinamis pembantu mencari data input item komposisi buket
function collectKomposisiBuket() {
    const items = [];
    const rows = document.querySelectorAll(".komposisi-item-row");
    rows.forEach(row => {
        const flowerId = row.querySelector(".select-bunga-item").value;
        const jumlah = Number(row.querySelector(".input-jumlah-item").value);
        if (flowerId && jumlah > 0) items.push({ flowerId, jumlah });
    });
    return items;
}

function updateDropdownBungaOptions() {
    const dropdowns = document.querySelectorAll(".select-bunga-item");
    dropdowns.forEach(dd => {
        const valSementara = dd.value;
        dd.innerHTML = `<option value="">-- Pilih Bunga --</option>` + 
            globalFlowers.map(f => `<option value="${f.id}">${f.nama} (${f.stok} pcs)</option>`).join("");
        dd.value = valSementara;
    });
}

// Filter Dropdown Buku Besar
function triggerBukuBesarFilter() {
    const akun = document.getElementById("filter-akun-bukubesar").value;
    if(!akun) return;
    const filteredEntries = prosesBukuBesar(globalJournals, akun);
    renderBukuBesar(filteredEntries);
}
window.onAkunBukuBesarChange = triggerBukuBesarFilter;

// Cetak Laporan PDF
window.printLaporan = function() {
    window.print();
};
