"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, ArrowUp } from "lucide-react";

/** List of example prompts that animate in sequence */
const PROMPTS = [
  "Buatkan perjanjian kerja sama antara PT Maju Berdikari dan Rian Pratama untuk jasa pengembangan sistem informasi selama 3 bulan.",
  "Draft kontrak freelance desainer grafis antara studio kreatif dan individu, durasi proyek 6 minggu dengan pembayaran bertahap.",
  "Buat kontrak PKWT untuk calon karyawan tetap.",
];

const TYPING_SPEED = 38;
const PAUSE_AFTER  = 2400;
const DELETE_SPEED = 18;

export function AnimatedChatPreview() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayed, setDisplayed]     = useState("");
  const [phase, setPhase]             = useState<"typing" | "pausing" | "deleting">("typing");

  useEffect(() => {
    const current = PROMPTS[promptIndex];

    if (phase === "typing") {
      if (displayed.length < current.length) {
        const t = setTimeout(
          () => setDisplayed(current.slice(0, displayed.length + 1)),
          TYPING_SPEED
        );
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase("pausing"), PAUSE_AFTER);
        return () => clearTimeout(t);
      }
    }

    if (phase === "pausing") {
      setPhase("deleting");
    }

    if (phase === "deleting") {
      if (displayed.length > 0) {
        const t = setTimeout(
          () => setDisplayed((d) => d.slice(0, -1)),
          DELETE_SPEED
        );
        return () => clearTimeout(t);
      } else {
        setPromptIndex((i) => (i + 1) % PROMPTS.length);
        setPhase("typing");
      }
    }
  }, [displayed, phase, promptIndex]);

  return (
    <div className="relative w-full rounded-2xl border border-slate-700/60 bg-slate-800/60 backdrop-blur-sm shadow-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-slate-700/50 px-5 py-3.5">
        <Image
          src="/klarisa/logo-ai.svg"
          alt="Klarisa AI"
          width={20}
          height={20}
          className="size-5 object-contain opacity-90"
        />
        <span className="text-xs font-medium tracking-wide text-slate-300">
          Klarisa
        </span>
       
      </div>

      <div className="min-h-36 px-5 pt-5 pb-3">
        <p className="text-sm leading-7 text-slate-100">
          {displayed}
          <span className="ml-px inline-block w-[2px] h-[1.1em] align-middle bg-klarisa-secondary animate-[blink_1s_step-end_infinite]" />
        </p>
      </div>

      

      <div className="flex items-center justify-between border-t border-slate-700/50 px-5 py-3">
        <span className="text-[10px] text-slate-400">
          Tekan Enter untuk membuat draft
        </span>
        <button
          type="button"
          aria-label="Kirim"
          className="grid size-7 place-items-center rounded-md bg-klarisa-secondary text-white shadow-md transition-transform hover:scale-110"
        >
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
