// Hitung mutasi spesifik akun untuk Buku Besar
export function prosesBukuBesar(journals, akunTerpilih) {
    let saldo = 0;
    return journals.filter(j => j.namaAkun === akunTerpilih).map(j => {
        // Aturan saldo normal aset & beban bertambah di debet, akun pasiva & pendapatan di kredit
        const adalahAsetBeban = ["Kas di Tangan", "Persediaan Bunga", "Harga Pokok Penjualan (HPP)", "Prive"].some(a => j.namaAkun.includes(a)) || j.namaAkun.startsWith("Beban");
        if (adalahAsetBeban) {
            saldo += (j.debet - j.kredit);
        } else {
            saldo += (j.kredit - j.debet);
        }
        return { ...j, saldoAkhir: saldo };
    });
}

// Olah Ringkasan data Laba Rugi
export function kalkulasiLabaRugi(journals) {
    let pendapatan = 0;
    let hpp = 0;
    let bebanOperasional = 0;

    journals.forEach(j => {
        if (j.namaAkun === "Pendapatan Penjualan") pendapatan += j.kredit;
        if (j.namaAkun === "Harga Pokok Penjualan (HPP)") hpp += j.debet;
        if (j.namaAkun.startsWith("Beban")) bebanOperasional += j.debet;
    });

    return { pendapatan, hpp, bebanOperasional, labaBersih: pendapatan - hpp - bebanOperasional };
}

// Olah Data Neraca Posisi Keuangan
export function kalkulasiNeraca(journals, totalAsetPersediaan) {
    let kas = 0;
    let modal = 0;
    let prive = 0;

    journals.forEach(j => {
        if (j.namaAkun === "Kas di Tangan") kas += (j.debet - j.kredit);
        if (j.namaAkun === "Modal Pemilik") modal += j.kredit;
        if (j.namaAkun === "Prive") prive += j.debet;
    });

    const { labaBersih } = kalkulasiLabaRugi(journals);
    const totalAset = kas + totalAsetPersediaan;
    const totalPasiva = modal - prive + labaBersih;

    return { kas, modal, prive, labaBersih, totalAset, totalPasiva };
}
