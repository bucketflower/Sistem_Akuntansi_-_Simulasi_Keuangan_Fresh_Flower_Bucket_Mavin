import { db } from "./config.js";
import { collection, doc, runTransaction, setDoc } from "https://gstatic.com";

// CRUD: Tambah / Edit Jenis Bunga Baru
export async function dbTambahBunga(kode, data) {
    if (!kode || !data.nama || data.hargaBeli < 0 || data.hargaJual < 0 || data.stok < 0) {
        throw new Error("Input data bunga tidak valid atau bernilai negatif!");
    }
    const flowerRef = doc(db, "flowers", kode);
    await setDoc(flowerRef, data);
}

// TRANSACTION: Simpan Transaksi Utama & Posting Jurnal Otomatis
export async function dbSimpanTransaksi(dataTransaksi) {
    const { tanggal, kategori, keterangan, nominal, rincianBuket, jenisBeban } = dataTransaksi;

    await runTransaction(db, async (transaction) => {
        // 1. Catat Log Transaksi Utama
        const txId = doc(collection(db, "transactions")).id;
        const txRef = doc(db, "transactions", txId);
        transaction.set(txRef, dataTransaksi);

        // Fungsi pembantu untuk membuat baris entri jurnal di DB
        const postJurnal = (akun, debet, kredit, memo) => {
            const cleanAkun = akun.replace(/[^a-zA-Z0-9]/g, "");
            const jRef = doc(db, "journals", `${txId}_${cleanAkun}`);
            transaction.set(jRef, { tanggal, namaAkun: akun, keterangan: memo || keterangan, debet, kredit });
        };

        // 2. Logika Akuntansi & Manajemen Stok Berdasarkan Kategori
        if (kategori === "Penjualan Buket / Bunga") {
            let totalHPP = 0;
            
            for (const item of rincianBuket) {
                const fRef = doc(db, "flowers", item.flowerId);
                const fDoc = await transaction.get(fRef);
                if (!fDoc.exists()) throw new Error(`Bunga dengan ID ${item.flowerId} tidak terdaftar!`);
                
                const stokSekarang = fDoc.data().stok;
                const stokBaru = stokSekarang - item.jumlah;
                if (stokBaru < 0) throw new Error(`Stok bunga '${fDoc.data().nama}' kurang! Sisa stok: ${stokSekarang}`);
                
                transaction.update(fRef, { stok: stokBaru });
                totalHPP += (fDoc.data().hargaBeli * item.jumlah);
            }

            // Jurnal Penjualan
            postJurnal("Kas di Tangan", nominal, 0);
            postJurnal("Pendapatan Penjualan", 0, nominal);

            // Jurnal Harga Pokok Penjualan (HPP)
            if (totalHPP > 0) {
                postJurnal("Harga Pokok Penjualan (HPP)", totalHPP, 0, `HPP atas Penjualan: ${keterangan}`);
                postJurnal("Persediaan Bunga", 0, totalHPP, `HPP atas Penjualan: ${keterangan}`);
            }
        } 
        
        else if (kategori === "Pembelian Stok Bunga Baru") {
            for (const item of rincianBuket) {
                const fRef = doc(db, "flowers", item.flowerId);
                const fDoc = await transaction.get(fRef);
                if (!fDoc.exists()) throw new Error(`Bunga dengan ID ${item.flowerId} tidak ditemukan!`);
                
                const stokBaru = fDoc.data().stok + item.jumlah;
                transaction.update(fRef, { stok: stokBaru });
            }
            // Jurnal Pembelian Stok
            postJurnal("Persediaan Bunga", nominal, 0);
            postJurnal("Kas di Tangan", 0, nominal);
        } 
        
        else if (kategori === "Penyetoran Modal Awal Pemilik") {
            postJurnal("Kas di Tangan", nominal, 0);
            postJurnal("Modal Pemilik", 0, nominal);
        } 
        
        else if (kategori === "Beban Operasional (Sewa, Listrik, Pita, dll)") {
            const akunBeban = jenisBeban || "Beban Lain-Lain";
            postJurnal(akunBeban, nominal, 0);
            postJurnal("Kas di Tangan", 0, nominal);
        } 
        
        else if (kategori === "Pengambilan Pribadi (Prive)") {
            postJurnal("Prive", nominal, 0);
            postJurnal("Kas di Tangan", 0, nominal);
        }
    });
}
