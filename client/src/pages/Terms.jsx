import React from 'react'
import { AlertTriangle, CheckCircle, FileText, Gavel, Scale, UserCheck } from 'lucide-react'
import LegalPageLayout from '../components/LegalPageLayout'

const sections = [
  {
    title: 'Responsible Platform Usage',
    description:
      'Users must access AI Interview Platform lawfully and respectfully. Platform tools should be used for genuine interview preparation, learning, skill development, and other authorized career-focused activities.',
    icon: CheckCircle,
  },
  {
    title: 'Account Responsibilities',
    description:
      'You are responsible for providing accurate account information, protecting your credentials, and all activity performed through your account. Suspected unauthorized access should be reported promptly.',
    icon: UserCheck,
  },
  {
    title: 'Resume Upload Guidelines',
    description:
      'Upload only resumes and documents that you own or are authorized to use. Files must not contain malicious code, unlawful material, or personal information belonging to others without permission.',
    icon: FileText,
  },
  {
    title: 'Prohibited Misuse',
    description:
      'Users may not attempt to disrupt the service, bypass security, access another user’s data, automate abusive requests, reverse engineer protected systems, or use platform content for unlawful purposes.',
    icon: AlertTriangle,
  },
  {
    title: 'Platform Limitations',
    description:
      'Features may change, experience interruptions, or produce incomplete results. AI-generated feedback and analytics are informational and cannot guarantee employment, interview performance, or hiring outcomes.',
    icon: Scale,
  },
  {
    title: 'Educational Purpose',
    description:
      'AI Interview Platform is an educational career-preparation service. Its exercises, recommendations, simulations, and generated content do not replace professional, legal, academic, or recruitment advice.',
    icon: Gavel,
  },
]

export default function Terms() {
  return (
    <LegalPageLayout
      badge="Terms"
      title="Terms of Use"
      subtitle="Clear expectations for using AI Interview Platform responsibly and effectively."
      introduction="These terms describe the standards that help keep the platform useful, secure, and fair for every learner. By using the service, you agree to follow these responsibilities and applicable laws."
      icon={Scale}
      sections={sections}
    />
  )
}
