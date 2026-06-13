import React from 'react'
import {
  BarChart3,
  Brain,
  Check,
  Code,
  FileText,
  GraduationCap,
  Target,
} from 'lucide-react'

const offerings = [
  {
    title: 'AI-Powered Mock Interviews',
    description:
      'Practice real-world interview scenarios with AI-generated questions and interactive interview simulations designed to improve confidence and communication skills.',
    icon: Brain,
  },
  {
    title: 'Resume Management & Analysis',
    description:
      'Upload resumes securely and receive insights that help improve resume quality, structure, and interview readiness.',
    icon: FileText,
  },
  {
    title: 'Coding Practice Environment',
    description:
      'Solve coding problems, practice programming concepts, and improve problem-solving skills through the integrated coding lab.',
    icon: Code,
  },
  {
    title: 'Personalized Dashboard',
    description:
      'Track progress, monitor activities, and analyze performance through a clean and user-friendly dashboard experience.',
    icon: BarChart3,
  },
  {
    title: 'Placement Preparation Support',
    description:
      'Prepare for technical interviews, HR interviews, and aptitude rounds using structured learning resources and practical exercises.',
    icon: GraduationCap,
  },
]

const reasons = [
  'Modern and interactive user experience',
  'AI-enhanced preparation workflow',
  'Real-time progress tracking',
  'Secure resume management',
  'Beginner-friendly and scalable',
  'Professional dashboard system',
]

export default function About() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-12 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-32 top-80 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <section className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <header className="mx-auto mb-12 max-w-4xl text-center sm:mb-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              <Target size={16} aria-hidden="true" />
              Our purpose
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              About AI Interview Platform
            </h1>
          </header>

          <div className="mb-16 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-10">
            <div className="space-y-5 text-base leading-8 text-slate-300 sm:text-lg">
              <p>
                AI Interview Platform is an intelligent career preparation and interview practice platform designed to help students and job seekers improve their technical and professional skills through AI-powered tools and interactive learning experiences.
              </p>
              <p>
                Our mission is to simplify interview preparation by providing a centralized platform where users can practice coding challenges, attend mock interviews, improve resumes, and track their overall placement readiness.
              </p>
              <p>
                The platform combines modern web technologies with artificial intelligence to create a personalized and engaging interview preparation experience for learners across different domains and skill levels.
              </p>
            </div>
          </div>

          <section className="mb-16" aria-labelledby="what-we-offer">
            <div className="mb-8 flex items-end justify-between gap-6">
              <h2 id="what-we-offer" className="text-3xl font-bold text-white sm:text-4xl">
                What We Offer
              </h2>
              <div className="hidden h-px flex-1 bg-gradient-to-r from-cyan-400/40 to-transparent sm:block" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {offerings.map(({ title, description, icon: Icon }, index) => (
                <article
                  key={title}
                  className={`group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-slate-900 ${
                    index === offerings.length - 1 ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="mb-5 inline-flex rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
                    <Icon size={24} aria-hidden="true" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
                  <p className="leading-7 text-slate-400">{description}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="mb-16 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section
              aria-labelledby="our-vision"
              className="rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-6 sm:p-8"
            >
              <h2 id="our-vision" className="mb-6 text-3xl font-bold text-white">
                Our Vision
              </h2>
              <div className="space-y-4 leading-7 text-slate-300">
                <p>
                  We aim to empower students and aspiring professionals by making high-quality interview preparation accessible, intelligent, and career-focused.
                </p>
                <p>
                  Our goal is to bridge the gap between academic learning and industry expectations using modern AI-driven solutions.
                </p>
              </div>
            </section>

            <section
              aria-labelledby="why-choose-us"
              className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8"
            >
              <h2 id="why-choose-us" className="mb-6 text-2xl font-bold text-white">
                Why Choose AI Interview Platform?
              </h2>
              <ul className="space-y-4">
                {reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-3 text-slate-300">
                    <span className="mt-0.5 inline-flex flex-none rounded-full bg-cyan-400/10 p-1 text-cyan-300">
                      <Check size={16} aria-hidden="true" />
                    </span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-slate-900/70 to-blue-500/10 p-7 text-center sm:p-10">
            <p className="mx-auto max-w-4xl text-lg font-medium leading-8 text-slate-200 sm:text-xl">
              AI Interview Platform is continuously evolving to provide smarter tools, better interview simulations, and enhanced learning experiences for future professionals.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
