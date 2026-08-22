"use client"

import { ArrowRight } from "lucide-react"
import { useState } from "react"

const findings = [
  {
    clause: "Pasal 02",
    title: "Pembayaran menunggu pihak ketiga.",
    source: "Pembayaran baru diterima setelah pihak lain menerima pembayaran dari klien utama.",
    note: "Pembayaran Anda bergantung pada proses yang tidak Anda kendalikan dan belum memiliki batas waktu.",
  },
  {
    clause: "Pasal 03",
    title: "Hak karya perlu memiliki batas yang jelas.",
    source: "Hak atas hasil pekerjaan berpindah seluruhnya kepada pihak pertama setelah pekerjaan diserahkan.",
    note: "Ruang lingkup hak yang berpindah perlu dijelaskan agar kedua pihak memahami batas penggunaannya.",
  },
]

export function HomeWorkspacePreview() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeFinding = findings[activeIndex]

  return (
    <div className="landing-workspace" aria-label="Contoh workspace Klarisa">
      <div className="landing-workspace-document">
        <div className="landing-workspace-bar"><span>REVIEW KONTRAK</span><b>3 bagian perlu diperiksa</b></div>
        <div className="p-6">
          <p className="landing-eyebrow">DOKUMEN / 01</p>
          <h3 className="mt-4 text-2xl font-semibold leading-tight">Perjanjian Kerja Sama Jasa Digital</h3>
          <p className="mt-6 text-sm leading-6 text-slate-600">{activeFinding.clause}: {activeFinding.title}</p>
          <p className="landing-flagged-line mt-3 text-sm leading-6">{activeFinding.source}</p>
          <p className="mt-5 text-xs leading-5 text-slate-500">{activeFinding.note}</p>
        </div>
      </div>
      <div className="landing-workspace-findings">
        <div className="landing-workspace-bar"><span>TEMUAN DALAM KONTEKS</span></div>
        <div className="p-5">
          <h3 className="text-xl font-semibold">Bagian yang perlu Anda pahami.</h3>
          <p className="mt-2 text-xs leading-5 text-slate-500">Pilih temuan untuk melihat penjelasan dan bagian dokumennya.</p>
          {findings.map((finding, index) => (
            <button className={"landing-finding" + (index === activeIndex ? " active" : "")} type="button" onClick={() => setActiveIndex(index)} key={finding.clause}>
              <span>{finding.clause}</span><b>{finding.title}</b><ArrowRight />
            </button>
          ))}
        </div>
      </div>
      <div className="landing-workspace-discussion">
        <p className="landing-eyebrow">DISKUSI DOKUMEN</p>
        <p className="mt-3 text-xs leading-5 text-slate-500">Tanyakan isi pasal atau diskusikan dengan pihak terkait.</p>
        <div className="landing-workspace-input mt-5"><span>Tulis pertanyaan Anda...</span><button type="button" aria-label="Kirim pertanyaan"><ArrowRight /></button></div>
      </div>
    </div>
  )
}
