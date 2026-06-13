import React from 'react'
import { Database, Eye, FileText, Lock, Shield, UserCheck } from 'lucide-react'
import LegalPageLayout from '../components/LegalPageLayout'

const sections = [
  {
    title: 'User Data Protection',
    description:
      'We collect and process only the information needed to provide, maintain, and improve the platform. Personal data is handled with appropriate safeguards and access is limited to legitimate operational purposes.',
    icon: Shield,
  },
  {
    title: 'Resume Privacy',
    description:
      'Uploaded resumes may contain sensitive career and contact information. Resume files are treated as private user content and are used only to provide resume management, analysis, and related platform features.',
    icon: FileText,
  },
  {
    title: 'Authentication Security',
    description:
      'Account information is protected through authentication controls designed to prevent unauthorized access. Users should maintain a strong password and keep their login credentials confidential.',
    icon: Lock,
  },
  {
    title: 'Platform Confidentiality',
    description:
      'Interview responses, progress data, assessment results, and account activity are treated as confidential platform information and are available only through authorized access.',
    icon: Eye,
  },
  {
    title: 'No Unauthorized Sharing',
    description:
      'We do not sell personal information or intentionally share user data with unauthorized parties. Information may be disclosed only when required to operate the service, comply with law, or protect platform users.',
    icon: UserCheck,
  },
  {
    title: 'Responsible Data Handling',
    description:
      'Data is retained only as reasonably necessary for platform operations, security, and legal obligations. We review our practices as the platform evolves and work to reduce unnecessary collection.',
    icon: Database,
  },
]

export default function Privacy() {
  return (
    <LegalPageLayout
      badge="Privacy"
      title="Privacy Policy"
      subtitle="How AI Interview Platform protects and responsibly handles your information."
      introduction="Your trust matters to us. This policy explains our approach to personal information, resume data, account activity, and the confidentiality of your experience on AI Interview Platform."
      icon={Shield}
      sections={sections}
    />
  )
}
