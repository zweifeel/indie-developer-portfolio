import React from 'react';
import {
  Terminal,
  Mail,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';
import { developerProfile } from '../data/developer';
import { id } from '../locales/id';

export const AboutPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Hero Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-stone-800 bg-stone-900/80 text-xs font-mono text-[#A8A29E]">
          <Terminal className="w-3.5 h-3.5 text-stone-400" />
          <span>{developerProfile.role}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#F5F5F4] tracking-tight">
          {id.about.title}
        </h1>
        <p className="text-base sm:text-lg text-[#A8A29E] max-w-2xl leading-relaxed">
          {id.about.subtitle}
        </p>
      </div>

      {/* Bio Card */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/40 p-6 sm:p-10 shadow-sm">
        <h2 className="text-lg font-bold text-[#F5F5F4] mb-3">Tentang Studio & Visi Pembuatan</h2>
        <p className="text-sm sm:text-base text-[#D6D3D1] leading-relaxed">
          {developerProfile.bio}
        </p>
        <div className="mt-6 pt-6 border-t border-stone-800 flex flex-wrap items-center gap-4 text-xs font-mono text-[#8A8580]">
          <span>Lokasi: {developerProfile.location}</span>
          <span>•</span>
          <span>Platform: Google Play Console (Android)</span>
          <span>•</span>
          <span>Closed Testing Standard: 14 Days</span>
        </div>
      </div>

      {/* Philosophy Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5">
          <Zap className="w-5 h-5 text-stone-400" />
          <h2 className="text-2xl font-bold text-[#F5F5F4] tracking-tight">
            {id.about.philosophyTitle}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {developerProfile.philosophy.map((item, idx) => {
            const [title, desc] = item.split(': ');
            return (
              <div
                key={idx}
                className="rounded-xl border border-stone-800 bg-stone-900/40 p-6 space-y-2 hover:border-stone-700 transition-colors"
              >
                <div className="flex items-center gap-2 text-[#E7E5E4] font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>{title}</span>
                </div>
                <p className="text-xs text-[#A8A29E] leading-relaxed pl-6">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Technical Stack Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-stone-400" />
          <h2 className="text-2xl font-bold text-[#F5F5F4] tracking-tight">
            {id.about.techStackTitle}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {developerProfile.techStack.map((group, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-stone-800 bg-stone-900/40 p-6 space-y-3"
            >
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#A8A29E]">
                {group.category}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="px-2.5 py-1 rounded-lg bg-stone-900/80 border border-stone-800 text-xs font-mono text-[#D6D3D1]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Interests */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-stone-400" />
          <h2 className="text-2xl font-bold text-[#F5F5F4] tracking-tight">
            {id.about.interestsTitle}
          </h2>
        </div>
        <div className="rounded-xl border border-stone-800 bg-stone-900/40 p-6">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#D6D3D1]">
            {developerProfile.coreInterests.map((interest, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                <span>{interest}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contact Section */}
      <section className="rounded-2xl border border-stone-800 bg-stone-900/40 p-6 sm:p-10 space-y-6">
        <div className="flex items-center gap-2 text-[#E7E5E4]">
          <HeartHandshake className="w-5 h-5 text-stone-400" />
          <h2 className="text-xl font-bold text-[#F5F5F4] tracking-tight">{id.about.contactTitle}</h2>
        </div>
        <p className="text-sm text-[#D6D3D1] max-w-xl leading-relaxed">
          {id.about.contactDesc}
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <a
            href={`mailto:${developerProfile.email}`}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-stone-100 hover:bg-white text-stone-950 font-semibold text-sm shadow-sm transition-all hover:scale-[1.02]"
          >
            <Mail className="w-4 h-4" />
            <span>Kirim Email: {developerProfile.email}</span>
          </a>
          <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-xs font-mono text-[#A8A29E]">
            <ShieldCheck className="w-4 h-4 text-stone-400" />
            <span>Respon Cepat untuk Pendaftar Tester</span>
          </div>
        </div>
      </section>
    </div>
  );
};
