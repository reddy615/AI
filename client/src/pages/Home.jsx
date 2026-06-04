import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Zap, Brain, Code, BarChart3, Shield, Users, Trophy } from 'lucide-react'

// Floating Particles Component
function FloatingParticles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
    left: Math.random() * 100,
    opacity: Math.random() * 0.5 + 0.1,
  }))

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-br from-cyan-500 to-blue-600"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.left}%`,
            top: '-10px',
            opacity: particle.opacity,
          }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 20 : 900,
            opacity: [particle.opacity, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="group relative rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-8 backdrop-blur-xl transition-all"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 opacity-0 transition group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-4 inline-flex rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-3">
          <Icon className="text-cyan-400" size={28} />
        </div>
        <h3 className="mb-3 text-lg font-bold text-white">{title}</h3>
        <p className="text-slate-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

// Showcase Card Component
function ShowcaseCard({ title, description, features, icon: Icon, gradient, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className={`group rounded-3xl border border-white/10 bg-gradient-to-br ${gradient} p-8 backdrop-blur-xl overflow-hidden relative`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-4 inline-flex rounded-xl bg-white/10 p-3">
          <Icon className="text-white" size={32} />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-white">{title}</h3>
        <p className="mb-6 text-slate-300">{description}</p>
        <ul className="space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-slate-400">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

// Testimonial Card Component
function TestimonialCard({ name, role, company, content, avatar, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-6 backdrop-blur-xl"
    >
      <div className="mb-4 flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="text-yellow-400">★</div>
        ))}
      </div>
      <p className="mb-6 text-slate-300 leading-relaxed italic">&quot;{content}&quot;</p>
      <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold">
            {avatar}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-slate-400">{role} at {company}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function Home() {
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 300], [0, 100])

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -top-40 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <FloatingParticles />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        <motion.div style={{ y: heroY }} className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950" />
        </motion.div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2"
          >
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              AI-Powered Interview Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 text-5xl sm:text-7xl font-bold leading-tight"
          >
            Master Your{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 bg-clip-text text-transparent">
              Interview Game
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto"
          >
            Prepare for your dream job with AI-powered mock interviews, coding assessments, and comprehensive analytics. Practice smarter, not harder.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 font-semibold shadow-lg shadow-cyan-500/30 transition hover:shadow-cyan-500/50"
              >
                Start For Free
                <ArrowRight size={20} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/50 px-8 py-4 font-semibold transition hover:border-cyan-400/50 hover:bg-slate-800"
              >
                Sign In
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 grid grid-cols-3 gap-8 border-t border-slate-800 pt-8 max-w-xl mx-auto"
          >
            {[
              { label: 'Active Users', value: '10K+' },
              { label: 'Interviews', value: '50K+' },
              { label: 'Success Rate', value: '94%' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-cyan-400">{stat.value}</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-2">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.7, type: 'spring' }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 pointer-events-none"
        >
          <div className="rounded-t-3xl border border-slate-700/50 bg-gradient-to-b from-slate-900/50 to-slate-950/50 backdrop-blur-xl overflow-hidden shadow-2xl shadow-cyan-500/20">
            <div className="aspect-video bg-gradient-to-br from-slate-800/50 to-slate-900/50 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex rounded-lg bg-cyan-500/20 p-3 mb-4">
                  <BarChart3 className="text-cyan-400" size={32} />
                </div>
                <p className="text-slate-400">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to ace your interviews and advance your career</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: 'AI Mock Interviews',
                description: 'Practice with realistic AI-powered interviews that adapt to your skill level',
              },
              {
                icon: Code,
                title: 'Coding Assessments',
                description: 'Solve real interview problems with advanced IDE and instant feedback',
              },
              {
                icon: BarChart3,
                title: 'Analytics & Insights',
                description: 'Track your progress with detailed analytics and personalized recommendations',
              },
              {
                icon: Shield,
                title: 'Resume Management',
                description: 'Upload and manage your resume securely in our cloud vault',
              },
              {
                icon: Zap,
                title: 'Gamification',
                description: 'Earn badges, streaks, and compete on leaderboards to stay motivated',
              },
              {
                icon: Users,
                title: 'Community Support',
                description: 'Connect with other users, share tips, and learn from real experiences',
              },
            ].map((feature, idx) => (
              <FeatureCard key={idx} {...feature} delay={idx * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Sections */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* AI Mock Interview Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-3xl sm:text-4xl font-bold mb-4"
              >
                AI-Powered Mock Interviews
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
                className="text-slate-400 mb-6 leading-relaxed"
              >
                Our advanced AI conducts realistic mock interviews that adapt to your responses, providing real-time feedback and comprehensive evaluations.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Link
                  to="/interview"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-semibold transition hover:shadow-lg hover:shadow-cyan-500/30"
                >
                  Start Interviewing <ArrowRight size={18} />
                </Link>
              </motion.div>
            </div>
            <ShowcaseCard
              title="Practice Mode"
              description="Unlimited mock interview sessions"
              features={['Real-time feedback', 'Performance metrics', 'Question bank with 1000+ questions']}
              icon={Brain}
              gradient="from-blue-900/30 to-cyan-900/30"
              delay={0.2}
            />
          </motion.div>

          {/* Coding Assessment Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:grid-flow-col-dense"
          >
            <ShowcaseCard
              title="Code Editor"
              description="Professional IDE experience"
              features={['Multiple languages', 'Syntax highlighting', 'Real-time execution']}
              icon={Code}
              gradient="from-purple-900/30 to-pink-900/30"
              delay={0.2}
            />
            <div>
              <motion.h2
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-3xl sm:text-4xl font-bold mb-4"
              >
                Coding Assessments
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
                className="text-slate-400 mb-6 leading-relaxed"
              >
                Practice coding problems in a professional environment with real-time testing and detailed performance metrics.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Link
                  to="/coding"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-semibold transition hover:shadow-lg hover:shadow-cyan-500/30"
                >
                  Start Coding <ArrowRight size={18} />
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Analytics Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-3xl sm:text-4xl font-bold mb-4"
              >
                Comprehensive Analytics
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
                className="text-slate-400 mb-6 leading-relaxed"
              >
                Track your progress with detailed analytics dashboards, identify weak areas, and get personalized recommendations for improvement.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Link
                  to="/analytics"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-semibold transition hover:shadow-lg hover:shadow-cyan-500/30"
                >
                  View Analytics <ArrowRight size={18} />
                </Link>
              </motion.div>
            </div>
            <ShowcaseCard
              title="Dashboard"
              description="Track your growth journey"
              features={['Progress charts', 'Performance trends', 'Personalized insights']}
              icon={BarChart3}
              gradient="from-green-900/30 to-emerald-900/30"
              delay={0.2}
            />
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Loved by Users</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">See what our users have to say about their interview preparation journey</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Sarah Chen',
                role: 'Software Engineer',
                company: 'Google',
                content: 'This platform helped me ace my FAANG interviews. The AI feedback was incredibly accurate and helped me improve my communication skills.',
                avatar: 'SC',
              },
              {
                name: 'Alex Rodriguez',
                role: 'Product Manager',
                company: 'Microsoft',
                content: 'The coding assessments are exactly like real interviews. I practiced for 3 weeks and got the job I wanted. Highly recommend!',
                avatar: 'AR',
              },
              {
                name: 'Emma Thompson',
                role: 'Data Scientist',
                company: 'Meta',
                content: 'Outstanding platform. The analytics dashboard helped me track my weak areas and the AI interviews feel surprisingly real.',
                avatar: 'ET',
              },
            ].map((testimonial, idx) => (
              <TestimonialCard key={idx} {...testimonial} delay={idx * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 p-12 sm:p-16 text-center backdrop-blur-xl"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-bold mb-6"
            >
              Ready to Land Your Dream Job?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto"
            >
              Join thousands of successful candidates who've used our platform to ace their interviews and land incredible opportunities.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 font-semibold text-lg shadow-lg shadow-cyan-500/40 transition hover:shadow-cyan-500/60"
                >
                  Start Your Free Trial
                  <ArrowRight size={22} />
                </Link>
              </motion.div>
            </motion.div>
            <p className="text-slate-400 text-sm mt-4">No credit card required. Get started in seconds.</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4 text-xl font-bold">
                <div className="rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 p-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/>
                  </svg>
                </div>
                <span>AI Interview</span>
              </div>
              <p className="text-slate-400 text-sm">Master your interview game with AI-powered practice.</p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/interview" className="hover:text-cyan-400 transition">Mock Interview</Link></li>
                <li><Link to="/coding" className="hover:text-cyan-400 transition">Coding Lab</Link></li>
                <li><Link to="/analytics" className="hover:text-cyan-400 transition">Analytics</Link></li>
                <li><Link to="/resume" className="hover:text-cyan-400 transition">Resume Vault</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-cyan-400 transition">About</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Careers</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-cyan-400 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Terms</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Security</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <p className="text-slate-400 text-sm">© 2024 AI Interview Platform. All rights reserved.</p>
              <div className="flex gap-4 mt-4 sm:mt-0">
                {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
                  <a key={social} href="#" className="text-slate-400 hover:text-cyan-400 transition text-sm">
                    {social}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
