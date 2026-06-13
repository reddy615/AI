import React from 'react'
import { Key, Lock, Server, Shield, UserCheck, FileText } from 'lucide-react'
import LegalPageLayout from '../components/LegalPageLayout'

const sections = [
  {
    title: 'Secure Authentication',
    description:
      'Account access is protected through authenticated sign-in flows and authorization checks. Sensitive platform areas are restricted to users with the appropriate identity and permissions.',
    icon: Lock,
  },
  {
    title: 'JWT Protection',
    description:
      'The platform uses JSON Web Tokens to support authenticated sessions. Tokens are validated by the server, have controlled lifetimes, and should never be shared or exposed in public environments.',
    icon: Key,
  },
  {
    title: 'Encrypted Communication',
    description:
      'Production communication is designed to use HTTPS so information exchanged between your browser and platform services is protected while in transit.',
    icon: Shield,
  },
  {
    title: 'Resume Access Control',
    description:
      'Resume operations are tied to authenticated accounts and authorization rules. Users can access their own resume information while administrative access is limited to approved operational needs.',
    icon: FileText,
  },
  {
    title: 'Admin Moderation',
    description:
      'Administrative capabilities are restricted and used for platform support, safety, moderation, and service management. Privileged actions should be performed only by authorized administrators.',
    icon: UserCheck,
  },
  {
    title: 'Infrastructure Reliability',
    description:
      'We use monitoring, error handling, controlled deployments, and service safeguards to improve availability and resilience. No system is risk-free, so security practices are reviewed as the platform develops.',
    icon: Server,
  },
]

export default function Security() {
  return (
    <LegalPageLayout
      badge="Security"
      title="Platform Security"
      subtitle="The safeguards used to protect accounts, resumes, and platform services."
      introduction="Security is built into the way AI Interview Platform manages authentication, authorization, data access, and production infrastructure. We continually work to strengthen these protections as the service evolves."
      icon={Shield}
      sections={sections}
    />
  )
}
