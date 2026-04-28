import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Skippo",
  description: "How Skippo collects, uses, and protects the personal data of schools, parents, teachers, and drivers.",
};

const EFFECTIVE_DATE = "1 April 2025";
const COMPANY = "Skippo Technologies Private Limited";
const EMAIL = "privacy@skippo.co.in";
const ADDRESS = "Bangalore, Karnataka, India";

const sections = [
  {
    id: "overview",
    title: "1. Overview",
    body: `${COMPANY} ("Skippo", "we", "our", or "us") operates an AI-first school operations platform accessible via web applications and mobile apps (collectively, the "Platform"). This Privacy Policy explains what personal data we collect, how we use it, who we share it with, and the rights you have over it.

By using the Platform you agree to the collection and use of information described in this policy. If you do not agree, please do not use the Platform.`,
  },
  {
    id: "who-we-collect-from",
    title: "2. Who we collect data from",
    body: `We collect personal data from the following categories of users:

**School Administrators** — staff who manage the school account, configure routes, fees, and users.

**Teachers** — staff who use the teacher application for lesson planning, class management, and student communication.

**Parents and Guardians** — individuals who track their child's transport and receive school communications via the parent app.

**Drivers** — staff who use the driver application to manage routes and student boarding.

**Students** — minors whose academic and transport data is processed on behalf of their school. We do not collect data directly from students; schools and teachers submit this data.

**Website Visitors** — individuals who visit skippo.co.in without creating an account.`,
  },
  {
    id: "data-collected",
    title: "3. What data we collect",
    body: `**Account and identity data**
Name, email address, phone number, role (admin, teacher, parent, driver), and school affiliation. Collected when you register or are invited to the Platform.

**Student data**
Student name, class, section, enrolled routes, attendance records, fee payment status, academic progress notes, and teacher observations. Submitted by the school or its staff.

**Location data**
GPS coordinates of school vehicles, collected from the driver's device while a trip is active. Parents see a derived map view; raw coordinates are stored for compliance and incident review only.

**Communication data**
Messages, broadcast content, and AI voice call recordings sent through the Platform. Voice call transcripts may be generated and stored for quality and compliance purposes.

**Payment data**
Fee payment transactions processed via Razorpay. We store transaction IDs, amounts, and timestamps. Full card or bank account details are processed by Razorpay and not stored by Skippo.

**AI-generated content**
Lesson plans, class summaries, voice observations, and weekly digest reports generated using Google Gemini AI on behalf of teachers and schools.

**Usage data**
Log files, IP addresses, browser type, pages visited, and feature interactions. Used to operate and improve the Platform.

**Device data**
Device model, operating system version, and push notification tokens, collected from mobile app users.`,
  },
  {
    id: "how-we-use",
    title: "4. How we use your data",
    body: `We use the personal data we collect to:

- Provide, operate, and maintain the Platform and its features.
- Track school vehicles and notify parents of boarding, drop-off, and emergency events.
- Process fee payments and issue receipts.
- Generate AI-assisted lesson plans, class summaries, and student progress digests.
- Send automated and manually-triggered communications (SMS, push notifications, AI voice calls) on behalf of schools.
- Authenticate users and enforce role-based access controls.
- Respond to support requests and resolve disputes.
- Monitor Platform performance, detect fraud, and fix security issues.
- Comply with applicable Indian law, including the Digital Personal Data Protection Act, 2023 (DPDPA).

We do not sell your personal data to third parties. We do not use student data to build advertising profiles.`,
  },
  {
    id: "legal-basis",
    title: "5. Legal basis for processing",
    body: `Under the DPDPA 2023 and applicable Indian regulations, we process personal data on the following grounds:

**Consent** — for non-essential communications and optional AI features where we seek explicit agreement.

**Contract** — processing necessary to deliver the service under your school's subscription agreement.

**Legitimate interests** — security monitoring, fraud prevention, and service improvement, provided these do not override your rights.

**Legal obligation** — compliance with Indian law, court orders, or regulatory requirements.

For data relating to minors (students), the school acts as the Data Fiduciary and is responsible for ensuring that appropriate parental consent has been obtained under applicable law. Skippo acts as a Data Processor on behalf of the school.`,
  },
  {
    id: "data-sharing",
    title: "6. Who we share data with",
    body: `We share data only with the following categories of recipients, and only to the extent necessary:

**Within your school** — administrators, teachers, and authorised staff see data relevant to their role. Parents see only their own child's data.

**Service providers** — third-party processors who help us operate the Platform, including:
- Google Cloud Platform (infrastructure and storage)
- Google Gemini API (AI content generation)
- Razorpay (payment processing)
- Plivo / telephony providers (voice calls and SMS)
- Firebase (push notifications)

All processors are bound by data processing agreements and are prohibited from using school or student data for their own purposes.

**Law enforcement and regulators** — when required by a court order, government directive, or applicable Indian law.

**Business transfers** — if Skippo is acquired or merges with another entity, data will be transferred subject to the same privacy protections. We will notify affected schools before transfer.

We do not share data with advertising networks, data brokers, or any party not listed above.`,
  },
  {
    id: "data-retention",
    title: "7. Data retention",
    body: `We retain personal data only for as long as necessary for the purposes described in this policy or as required by law.

- **Account data** is retained for the duration of the school's active subscription, plus 90 days after termination to allow for data export.
- **Student academic and transport records** are retained for 3 years from the date of creation, in line with typical regulatory requirements.
- **Payment records** are retained for 7 years for tax and audit compliance.
- **Location logs** (raw GPS data) are retained for 30 days, then anonymised for aggregate analytics.
- **AI-generated content** (lesson plans, class summaries, digests) is retained for the duration of the school's subscription.
- **Communication logs** are retained for 12 months.

You may request earlier deletion in accordance with Section 9 below.`,
  },
  {
    id: "data-security",
    title: "8. Data security",
    body: `We implement technical and organisational measures to protect your data, including:

- Encryption in transit (TLS 1.2+) and at rest (AES-256).
- Role-based access control — users can only access data relevant to their role and school.
- Multi-tenant isolation — each school's data is logically separated.
- OTP-based authentication — no passwords stored.
- Regular security reviews and penetration testing.
- Incident response procedures compliant with DPDPA 2023 breach notification requirements.

No system is completely secure. If you believe your account has been compromised, please contact us immediately at ${EMAIL}.`,
  },
  {
    id: "your-rights",
    title: "9. Your rights",
    body: `Under the DPDPA 2023 and applicable law, you have the following rights:

**Right to access** — request a copy of the personal data we hold about you.

**Right to correction** — request correction of inaccurate or incomplete data.

**Right to erasure** — request deletion of your personal data. Requests relating to student data must be submitted by the school (as Data Fiduciary).

**Right to withdraw consent** — where processing is based on consent, you may withdraw it at any time. Withdrawal does not affect the lawfulness of prior processing.

**Right to grievance redressal** — raise a complaint with our Data Protection Officer (DPO) or with the Data Protection Board of India once established.

To exercise any of these rights, email us at ${EMAIL} with the subject line "Data Rights Request". We will respond within 30 days. Requests from parents relating to student data will be coordinated with the relevant school.`,
  },
  {
    id: "children",
    title: "10. Children's data",
    body: `The Platform processes data relating to minors (students) on behalf of schools. Schools are responsible for obtaining and maintaining appropriate consent from parents or guardians as required under applicable law, including the DPDPA 2023.

Skippo does not knowingly collect personal data directly from children under 18. If you believe we have inadvertently collected such data without appropriate authorisation, please contact us at ${EMAIL} and we will delete it promptly.

The parent app is for use by adults (parents and guardians) only.`,
  },
  {
    id: "cookies",
    title: "11. Cookies and tracking",
    body: `Our web applications use the following:

**Essential cookies** — session tokens and authentication state. Required for the Platform to function. Cannot be disabled.

**Analytics** — anonymised usage data to understand feature adoption and performance. No cross-site tracking or advertising cookies are used.

**Local storage** — app preferences and cached data stored on your device for performance.

We do not use third-party advertising trackers or share cookie data with ad networks.`,
  },
  {
    id: "international",
    title: "12. International data transfers",
    body: `Skippo is an Indian company and processes most data within India. Some of our service providers (including Google Cloud and Gemini API) may process data in data centres located outside India.

Where data is transferred internationally, we ensure adequate safeguards are in place through contractual terms consistent with applicable Indian law, including DPDPA 2023 cross-border transfer provisions.`,
  },
  {
    id: "changes",
    title: "13. Changes to this policy",
    body: `We may update this Privacy Policy from time to time. Material changes will be notified to school administrators via email or in-app notice at least 14 days before they take effect. Continued use of the Platform after the effective date constitutes acceptance of the updated policy.

The current version is always available at skippo.co.in/privacy.`,
  },
  {
    id: "contact",
    title: "14. Contact us",
    body: `For privacy-related queries, data rights requests, or complaints:

**${COMPANY}**
Email: ${EMAIL}
Address: ${ADDRESS}

We aim to respond to all enquiries within 5 business days.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="h-[68px] border-b border-surface-border flex items-center justify-between px-6 sticky top-0 bg-white/95 backdrop-blur z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Skippo" className="w-8 h-8" />
          <span className="font-black text-ink text-lg">Skippo</span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-ink-muted">
          <Link href="/terms"  className="hover:text-ink transition-colors">Terms</Link>
          <Link href="/signup" className="px-4 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors text-xs">
            Get Started
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
        {/* Header */}
        <div className="mb-14">
          <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl lg:text-5xl font-black text-ink tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-ink-muted">
            Effective date: <span className="font-semibold text-ink">{EFFECTIVE_DATE}</span>
          </p>
          <p className="text-sm text-ink-muted mt-2 max-w-xl leading-relaxed">
            This policy explains how Skippo collects, uses, stores, and protects personal data of schools, parents, teachers, drivers, and students. Please read it carefully.
          </p>
        </div>

        {/* Table of contents */}
        <div className="bg-surface-soft border border-surface-border rounded-2xl p-6 mb-14">
          <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">Contents</p>
          <ol className="space-y-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        <div className="space-y-14">
          {sections.map((s) => (
            <section key={s.id} id={s.id}>
              <h2 className="text-xl font-black text-ink mb-4 scroll-mt-24">{s.title}</h2>
              <div className="prose-skippo">
                {s.body.split("\n\n").map((para, i) => {
                  if (para.startsWith("**") && para.endsWith("**")) {
                    return (
                      <p key={i} className="font-black text-ink text-sm mt-5 mb-1">
                        {para.replace(/\*\*/g, "")}
                      </p>
                    );
                  }
                  const rendered = para.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
                  return (
                    <p
                      key={i}
                      className="text-sm text-ink-muted leading-relaxed mb-3"
                      dangerouslySetInnerHTML={{ __html: rendered }}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-20 pt-10 border-t border-surface-border">
          <p className="text-xs text-ink-faint leading-relaxed max-w-xl">
            This Privacy Policy is governed by the laws of India. Any disputes arising under this policy will be subject to the exclusive jurisdiction of courts in Bangalore, Karnataka.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-xs text-ink-muted">
            <Link href="/terms"   className="hover:text-ink transition-colors">Terms &amp; Conditions</Link>
            <Link href="/contact" className="hover:text-ink transition-colors">Contact Us</Link>
            <Link href="/"        className="hover:text-ink transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
