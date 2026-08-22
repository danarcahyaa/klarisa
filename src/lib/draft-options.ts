export const draftCategories = [
  {
    id: "creative_services",
    label: "Jasa & Layanan Kreatif",
    description: "Kontrak untuk pekerjaan kreatif, digital, dan pengembangan produk.",
    subtypes: [
      "Pengembangan Website / Web App",
      "Pengembangan Aplikasi Mobile (Android/iOS)",
      "Desain Grafis, Branding, & UI/UX",
      "Produksi Video, Foto, & Animasi",
      "Penulisan Konten, Copywriting, & Penerjemahan",
      "Lainnya",
    ],
  },
  {
    id: "property_rental",
    label: "Sewa Tempat & Properti Usaha",
    description: "Kontrak penggunaan tempat, lahan, studio, atau peralatan kerja.",
    subtypes: [
      "Sewa Ruko / Kios / Ruang Usaha",
      "Sewa Lahan / Tanah Jangka Panjang",
      "Sewa Co-Working Space / Studio",
      "Sewa Alat Berat / Peralatan Kerja",
      "Lainnya",
    ],
  },
  {
    id: "business_partnership",
    label: "Kemitraan Bisnis & Bagi Hasil",
    description: "Kontrak kemitraan, lisensi, pemasok, dan pembagian keuntungan.",
    subtypes: [
      "Kemitraan Usaha & Bagi Hasil (Profit Sharing)",
      "Lisensi Waralaba (Franchise)",
      "Pasokan Barang / Vendor Pengadaan",
      "Titip Jual",
      "Lainnya",
    ],
  },
  {
    id: "other",
    label: "Lainnya",
    description: "Gunakan kebutuhan kontrak lain yang belum tersedia di daftar.",
    subtypes: ["Lainnya"],
  },
] as const;

export type DraftCategoryId = (typeof draftCategories)[number]["id"];
