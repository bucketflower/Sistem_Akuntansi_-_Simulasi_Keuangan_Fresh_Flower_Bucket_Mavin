export function formatRupiah(angka) {
    return "Rp " + new Intl.NumberFormat("id-ID").format(angka);
}

export function renderTabelStok(flowers) {
    const container = document.getElementById("tabel-stok-body"); // Sesuaikan ID di HTML anda
    if (!container) return;
    if (flowers.length === 0) {
        container.innerHTML = `<tr><td colspan="6" style="text-align:center;">Belum ada jenis bunga diset. Silakan tambah jenis bunga.</td></tr>`;
        return;
    }
    container.innerHTML = flowers.map(f => `
        <tr>
            <td><strong>${f.id}</strong></td>
            <td>${f.nama}</td>
            <td>${f.kategori}</td>
            <td>${formatRupiah(f.hargaBeli)}</td>
            <td>${formatRupiah(f.hargaJual)}</td>
            <td>${f.stok} Tangkai</td>
        </tr>
    `).join("");
}

export function renderJurnalUmum(journals) {
    const container = document.getElementById("jurnal-body"); // Sesuaikan ID di HTML anda
    const totalDebetEl = document.getElementById("jurnal-total-debet");
    const totalKreditEl = document.getElementById("jurnal-total-kredit");
    
    if (!container) return;
    
    let totalDebet = 0, totalKredit = 0;
    
    container.innerHTML = journals.map(j => {
        totalDebet += j.debet;
        totalKredit += j.kredit;
        const isKreditRow = j.kredit > 0;
        return `
            <tr>
                <td>${j.tanggal}</td>
                <td class="${isKreditRow ? 'kredit-row' : ''}">${j.namaAkun}<br><small style="color:gray;">${j.keterangan}</small></td>
                <td>${j.debet > 0 ? formatRupiah(j.debet) : '-'}</td>
                <td>${j.kredit > 0 ? formatRupiah(j.kredit) : '-'}</td>
            </tr>
        `;
    }).join("");

    if(totalDebetEl) totalDebetEl.innerText = formatRupiah(totalDebet);
    if(totalKreditEl) totalKreditEl.innerText = formatRupiah(totalKredit);
}

export function renderBukuBesar(entries) {
    const container = document.getElementById("bukubesar-body"); // Sesuaikan ID di HTML anda
    if (!container) return;
    container.innerHTML = entries.map(e => `
        <tr>
            <td>${e.tanggal}</td>
            <td>${e.keterangan}</td>
            <td>${e.debet > 0 ? formatRupiah(e.debet) : '-'}</td>
            <td>${e.kredit > 0 ? formatRupiah(e.kredit) : '-'}</td>
            <td><strong>${formatRupiah(e.saldoAkhir)}</strong></td>
        </tr>
    `).join("");
}
