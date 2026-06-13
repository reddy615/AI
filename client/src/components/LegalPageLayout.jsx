import React from 'react'

export default function LegalPageLayout({
  badge,
  title,
  subtitle,
  introduction,
  icon: PageIcon,
  sections,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -left-40 top-96 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -right-40 bottom-32 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <section className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <header className="mx-auto mb-12 max-w-4xl text-center sm:mb-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              <PageIcon size={16} aria-hidden="true" />
              {badge}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              {subtitle}
            </p>
            <p className="mt-4 text-sm text-slate-500">Last updated: June 13, 2026</p>
          </header>

          <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-center shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-10">
            <p className="mx-auto max-w-4xl text-base leading-8 text-slate-300 sm:text-lg">
              {introduction}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {sections.map(({ title: sectionTitle, description, icon: SectionIcon }) => (
              <article
                key={sectionTitle}
                className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/35 hover:bg-slate-900 sm:p-7"
              >
                <div className="mb-5 inline-flex rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
                  <SectionIcon size={23} aria-hidden="true" />
                </div>
                <h2 className="mb-3 text-xl font-semibold text-white">{sectionTitle}</h2>
                <p className="leading-7 text-slate-400">{description}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-slate-900/80 to-blue-500/10 p-6 text-center sm:p-8">
            <p className="text-sm leading-6 text-slate-400 sm:text-base">
              Questions about this policy can be sent to{' '}
              <a
                href="mailto:support.aiinterview@gmail.com"
                className="font-semibold text-cyan-300 transition hover:text-cyan-200"
              >
                support.aiinterview@gmail.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
