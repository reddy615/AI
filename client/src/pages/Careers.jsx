import React from 'react'
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  Mail,
  Sparkles,
  Users,
} from 'lucide-react'

const interestAreas = [
  'Artificial Intelligence',
  'Full Stack Development',
  'UI/UX Design',
  'Cloud Technologies',
  'Career Technology Solutions',
]

const futureRoles = [
  'Frontend Developers',
  'Backend Developers',
  'AI/ML Engineers',
  'Product Designers',
  'Technical Content Creators',
]

function ProfessionalList({ items }) {
  return (
    <ul className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <li
          key={item}
          className={`flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-left text-slate-200 ${
            index === items.length - 1 && items.length % 2 !== 0 ? 'sm:col-span-2 sm:mx-auto sm:w-1/2' : ''
          }`}
        >
          <span className="inline-flex flex-none rounded-full bg-cyan-400/10 p-1 text-cyan-300">
            <Check size={16} aria-hidden="true" />
          </span>
          <span className="font-medium">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function Careers() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -left-40 top-96 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -right-40 bottom-32 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <section className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <header className="mx-auto mb-12 max-w-4xl text-center sm:mb-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              <BriefcaseBusiness size={16} aria-hidden="true" />
              Careers
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Careers at AI Interview Platform
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              Join us in building the future of AI-powered interview preparation and career development.
            </p>
          </header>

          <section
            aria-labelledby="career-introduction"
            className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-center shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-10"
          >
            <div className="mx-auto mb-6 inline-flex rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-cyan-300">
              <Sparkles size={28} aria-hidden="true" />
            </div>
            <h2 id="career-introduction" className="sr-only">About Careers</h2>
            <div className="mx-auto max-w-4xl space-y-5 text-base leading-8 text-slate-300 sm:text-lg">
              <p>
                At AI Interview Platform, we are passionate about creating intelligent tools that help students and professionals prepare for successful careers.
              </p>
              <p>
                We are continuously exploring innovative ideas in artificial intelligence, technical education, resume analysis, coding practice, and interview simulation technologies.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="talent-interests"
            className="mb-8 rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-6 text-center sm:p-10"
          >
            <div className="mx-auto mb-6 inline-flex rounded-2xl bg-blue-400/10 p-4 text-blue-300">
              <Users size={28} aria-hidden="true" />
            </div>
            <h2 id="talent-interests" className="sr-only">Talent Interests</h2>
            <p className="mx-auto mb-8 max-w-3xl text-lg leading-8 text-slate-200">
              Although we are not actively hiring at the moment, we are always interested in connecting with talented individuals who are passionate about:
            </p>
            <ProfessionalList items={interestAreas} />
          </section>

          <section
            aria-labelledby="future-opportunities"
            className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-center sm:p-10"
          >
            <div className="mx-auto mb-5 h-px w-20 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            <h2 id="future-opportunities" className="text-3xl font-bold text-white sm:text-4xl">
              Future Opportunities
            </h2>
            <p className="mx-auto mb-8 mt-4 max-w-2xl text-lg text-slate-400">
              We may open positions in the future for:
            </p>
            <ProfessionalList items={futureRoles} />
          </section>

          <section
            aria-labelledby="stay-connected"
            className="rounded-3xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-slate-900/80 to-blue-500/10 p-6 text-center sm:p-10"
          >
            <h2 id="stay-connected" className="text-3xl font-bold text-white sm:text-4xl">
              Stay Connected
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              If you are interested in future opportunities or collaborations, feel free to reach out to us at:
            </p>
            <a
              href="mailto:support.aiinterview@gmail.com"
              className="group mx-auto mt-7 inline-flex max-w-full items-center gap-3 rounded-xl border border-cyan-400/30 bg-slate-950/70 px-5 py-4 font-semibold text-cyan-300 transition hover:border-cyan-300 hover:bg-slate-900 hover:text-cyan-200"
            >
              <Mail size={20} className="flex-none" aria-hidden="true" />
              <span className="break-all">support.aiinterview@gmail.com</span>
              <ArrowUpRight
                size={18}
                className="hidden flex-none transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block"
                aria-hidden="true"
              />
            </a>
          </section>
        </div>
      </section>
    </div>
  )
}
