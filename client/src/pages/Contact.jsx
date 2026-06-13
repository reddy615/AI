import React from 'react'
import { ArrowUpRight, Clock3, Headphones, Mail, Phone } from 'lucide-react'

const availability = [
  {
    title: 'Email Requests',
    description: 'Send your support request at any time. Our team reviews incoming messages regularly.',
    icon: Mail,
  },
  {
    title: 'Phone Assistance',
    description: 'Call the support number during standard business hours for direct assistance.',
    icon: Phone,
  },
  {
    title: 'Response Support',
    description: 'Include a short description of your issue so our team can assist you efficiently.',
    icon: Clock3,
  },
]

export default function Contact() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-32 top-72 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <section className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <header className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              <Headphones size={16} aria-hidden="true" />
              Support
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Contact AI Interview Platform
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              Reach our support team for platform assistance, account questions, or general inquiries.
            </p>
          </header>

          <div className="mx-auto mb-16 max-w-4xl overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900/70 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
            <div className="border-b border-slate-800 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 px-6 py-5 sm:px-8">
              <h2 className="text-xl font-semibold text-white sm:text-2xl">Contact Details</h2>
              <p className="mt-1 text-sm text-slate-400">Choose the contact method that works best for you.</p>
            </div>

            <div className="grid gap-px bg-slate-800 md:grid-cols-2">
              <a
                href="mailto:support.aiinterview@gmail.com"
                className="group flex min-h-52 flex-col justify-between bg-slate-900 p-6 transition hover:bg-slate-800/90 sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
                    <Mail size={26} aria-hidden="true" />
                  </span>
                  <ArrowUpRight
                    size={22}
                    className="text-slate-500 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-cyan-300"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium uppercase tracking-wider text-slate-500">Support Email:</p>
                  <span className="break-all text-lg font-semibold text-white transition group-hover:text-cyan-300 sm:text-xl">
                    support.aiinterview@gmail.com
                  </span>
                </div>
              </a>

              <a
                href="tel:+919955575969"
                className="group flex min-h-52 flex-col justify-between bg-slate-900 p-6 transition hover:bg-slate-800/90 sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex rounded-2xl border border-blue-400/20 bg-blue-400/10 p-3 text-blue-300">
                    <Phone size={26} aria-hidden="true" />
                  </span>
                  <ArrowUpRight
                    size={22}
                    className="text-slate-500 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-blue-300"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium uppercase tracking-wider text-slate-500">Phone Number:</p>
                  <span className="text-xl font-semibold text-white transition group-hover:text-blue-300 sm:text-2xl">
                    +91 9955575969
                  </span>
                </div>
              </a>
            </div>
          </div>

          <section aria-labelledby="support-availability">
            <div className="mb-8 text-center">
              <h2 id="support-availability" className="text-3xl font-bold text-white sm:text-4xl">
                Support Availability
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {availability.map(({ title, description, icon: Icon }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-slate-900"
                >
                  <div className="mb-5 inline-flex rounded-xl bg-slate-800 p-3 text-cyan-300">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold text-white">{title}</h3>
                  <p className="text-sm leading-6 text-slate-400">{description}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
