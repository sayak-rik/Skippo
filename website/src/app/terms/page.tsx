import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — Skippo",
  description: "Terms and conditions governing the use of the Skippo school operations platform.",
};

const EFFECTIVE_DATE = "1 April 2025";
const COMPANY = "Skippo Technologies Private Limited";
const EMAIL = "legal@skippo.co.in";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of terms",
    body: `By accessing or using the Skippo platform — including any web application, mobile application, API, or related service (collectively, the "Platform") — you agree to be bound by these Terms and Conditions ("Terms"). If you are accepting on behalf of a school or organisation, you represent that you have authority to bind that organisation.

If you do not agree to these Terms, you must not use the Platform. These Terms apply alongside our Privacy Policy, which is incorporated by reference.

${COMPANY} ("Skippo", "we", "our", or "us") reserves the right to update these Terms at any time. Material changes will be notified at least 14 days in advance. Continued use after the effective date constitutes acceptance.`,
  },
  {
    id: "platform",
    title: "2. The Platform",
    body: `Skippo is an AI-first school operations platform offering:

**Transport management** — live GPS tracking, route planning, boarding/drop confirmation, SOS emergency alerts.

**Academic tools** — AI lesson plan generation, class summaries, student progress notes, voice observations.

**Fee management** — fee structure configuration, payment collection via Razorpay, receipt generation.

**Parent communication** — real-time push notifications, AI voice calls, weekly student digest reports.

**Administration** — student, teacher, and driver management; compliance tracking; analytics.

The Platform is provided as a software-as-a-service subscription. Features available to each user depend on their role and their school's subscription plan.`,
  },
  {
    id: "accounts",
    title: "3. Accounts and access",
    body: `**School accounts** — schools subscribe directly with Skippo. A designated administrator creates and manages the school account.

**Teacher and driver accounts** — created by school administrators. Users receive an invite link to set up their access.

**Parent accounts** — created independently via the parent mobile app using OTP-based phone verification, then linked to a student record by the school.

You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorised access.

Skippo uses OTP-based authentication; no passwords are stored. You must provide accurate, current, and complete information when registering.

We may suspend or terminate accounts that violate these Terms, are inactive for more than 12 months on a free tier, or are associated with fraudulent activity.`,
  },
  {
    id: "school-obligations",
    title: "4. School obligations",
    body: `Schools subscribing to Skippo agree to:

- Provide accurate school, student, teacher, and driver information.
- Obtain all necessary consents from parents and guardians for the processing of student data, including location data, as required under the Digital Personal Data Protection Act, 2023 (DPDPA) and any applicable state regulations.
- Ensure that all users (teachers, drivers, admins) comply with these Terms.
- Use the Platform only for lawful purposes related to school operations.
- Not use the Platform to harass, discriminate against, or harm any person.
- Maintain accurate student-route assignments to ensure accurate boarding and drop-off tracking.

Schools act as the Data Fiduciary for student data under the DPDPA 2023. Skippo acts as a Data Processor on behalf of schools.`,
  },
  {
    id: "ai-features",
    title: "5. AI features and limitations",
    body: `Skippo uses Google Gemini AI to power features including lesson plan generation, class summaries, voice observations, and student digest reports.

**Accuracy** — AI-generated content is produced by a language model and may contain errors, inaccuracies, or omissions. All AI-generated content must be reviewed by a qualified teacher or administrator before being acted upon or shared.

**Not professional advice** — AI-generated lesson plans, student assessments, and progress notes are tools to assist educators. They do not constitute professional educational, medical, or psychological advice.

**Token limits** — AI features are subject to a daily usage limit (tokens) configured by the school. Limits are set to ensure fair usage across all teachers.

**Data use** — content you submit to AI features (lesson topics, class notes, student observations) is processed by Google Gemini under Google's API terms. Skippo does not use this content to train its own models.

Skippo is not liable for decisions made based on AI-generated content.`,
  },
  {
    id: "payment",
    title: "6. Payments and subscriptions",
    body: `**Platform subscription** — schools pay a subscription fee agreed at the time of onboarding. Fees are billed annually or monthly as agreed. Subscriptions auto-renew unless cancelled with 30 days' notice before the renewal date.

**Fee collection via Razorpay** — the Platform facilitates collection of student fees on behalf of schools. Skippo is not a payment aggregator; Razorpay processes all transactions. The school is responsible for the accuracy of fee structures and compliance with applicable financial regulations.

**Refunds** — Platform subscription fees are non-refundable except as required by law or as agreed in writing. Student fee refunds processed through the Platform are governed by the school's own refund policy; Skippo has no liability for disputes between schools and parents regarding fees.

**Late payment** — failure to pay subscription fees may result in account suspension after a 14-day grace period.`,
  },
  {
    id: "location",
    title: "7. Location data and tracking",
    body: `**Driver consent** — drivers must actively start a trip in the app for location tracking to begin. Continuous background tracking is limited to active trips only.

**Parent visibility** — parents can see the real-time position of their child's assigned school vehicle during active trips. They cannot see the driver's personal location outside of trips.

**Storage** — raw GPS coordinates are stored for 30 days for incident review, then anonymised. Schools may access logs for specific incidents within the retention window.

**Accuracy** — GPS accuracy depends on the driver's device and network conditions. ETAs are estimates. Skippo is not liable for delays or inaccuracies in live tracking data.

**SOS** — the SOS feature notifies school administrators and parents of an emergency and shares the driver's last known location. It is not a substitute for emergency services. Drivers and schools should always call emergency services (112) in a life-threatening situation.`,
  },
  {
    id: "communications",
    title: "8. Communications and calls",
    body: `**AI voice calls** — schools may use the Platform to initiate automated AI voice calls to parents. Schools are responsible for ensuring that recipients have consented to receive such calls as required by TRAI regulations and applicable law.

**SMS and push notifications** — Skippo sends operational notifications (boarding alerts, fee receipts, SOS) on behalf of schools. Marketing communications require separate consent.

**Message content** — schools and teachers are solely responsible for the content of messages, broadcasts, and communications sent through the Platform. Skippo does not review message content in advance.

**Anti-spam** — you must not use the communication features to send unsolicited commercial messages, spam, or content that violates applicable law.`,
  },
  {
    id: "intellectual-property",
    title: "9. Intellectual property",
    body: `**Skippo IP** — the Platform, including its code, design, trademarks, and documentation, is owned by ${COMPANY} or its licensors. You are granted a limited, non-exclusive, non-transferable licence to use the Platform during your subscription term, solely for internal school operations.

**Your content** — you retain ownership of data you upload (student records, lesson topics, school information). By uploading content, you grant Skippo a limited licence to process it solely to provide the Platform services.

**AI outputs** — AI-generated content (lesson plans, summaries, reports) produced using your inputs is owned by your school. Skippo claims no intellectual property rights over AI outputs.

**Feedback** — if you provide feedback or suggestions about the Platform, you grant Skippo the right to use such feedback without restriction or compensation.

You must not reverse-engineer, decompile, or attempt to extract the source code of the Platform.`,
  },
  {
    id: "data-protection",
    title: "10. Data protection",
    body: `Both parties agree to comply with the Digital Personal Data Protection Act, 2023 (DPDPA) and any regulations made thereunder.

Schools (as Data Fiduciaries) are responsible for:
- Obtaining and maintaining valid consent for the processing of personal data, including data relating to minors.
- Ensuring accuracy of personal data submitted to the Platform.
- Honouring data subject rights requests directed to the school.

Skippo (as Data Processor) agrees to:
- Process personal data only on documented instructions from the school.
- Implement appropriate technical and organisational security measures.
- Notify the school without undue delay upon becoming aware of a personal data breach.
- Delete or return personal data upon termination of the school's subscription.

Full details of our data practices are set out in the Privacy Policy at skippo.co.in/privacy.`,
  },
  {
    id: "prohibited",
    title: "11. Prohibited uses",
    body: `You must not use the Platform to:

- Violate any applicable Indian or international law or regulation.
- Harass, abuse, threaten, or harm any person.
- Submit false, misleading, or fraudulent information.
- Access data of students or users not associated with your school.
- Attempt to breach, test, or probe the security of the Platform without written authorisation.
- Scrape, crawl, or systematically extract data from the Platform.
- Use the Platform for commercial purposes beyond school operations without prior written consent.
- Impersonate any person or organisation.
- Upload malicious code, viruses, or harmful content.

Violation of these prohibitions may result in immediate account suspension and may be reported to law enforcement.`,
  },
  {
    id: "availability",
    title: "12. Availability and support",
    body: `Skippo will use commercially reasonable efforts to maintain Platform availability. We target 99.5% uptime, excluding scheduled maintenance (notified 48 hours in advance) and circumstances beyond our control.

We do not guarantee uninterrupted service. The Platform depends on third-party infrastructure (cloud providers, telecom networks, GPS networks) that may experience outages independent of Skippo's control.

Support is provided via email at support@skippo.co.in during business hours (Monday–Friday, 9 AM–6 PM IST). Priority support may be available on higher-tier plans.

Skippo may update, modify, or discontinue features of the Platform at any time. Material feature removals will be notified 30 days in advance.`,
  },
  {
    id: "liability",
    title: "13. Limitation of liability",
    body: `To the maximum extent permitted by applicable law:

**Disclaimer of warranties** — the Platform is provided "as is" and "as available". Skippo makes no warranty that the Platform will be error-free, uninterrupted, or meet your specific requirements.

**Limitation of damages** — in no event will Skippo be liable for indirect, incidental, special, consequential, or punitive damages, including loss of profits, loss of data, or loss of goodwill, arising from your use of the Platform.

**Cap on liability** — Skippo's total liability to you for any claim arising under these Terms shall not exceed the subscription fees paid by your school to Skippo in the 3 months preceding the claim.

**Essential allocations** — these limitations reflect a fair allocation of risk between the parties and are essential to the basis on which Skippo makes the Platform available.

Nothing in these Terms limits liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law.`,
  },
  {
    id: "indemnity",
    title: "14. Indemnification",
    body: `You agree to indemnify, defend, and hold harmless ${COMPANY}, its officers, employees, and agents from and against any claims, liabilities, damages, losses, and costs (including reasonable legal fees) arising from:

- Your use of the Platform in violation of these Terms.
- Your violation of any applicable law or third-party right.
- Content or data you submit to the Platform that infringes any third-party intellectual property or privacy right.
- Any dispute between your school and a parent, driver, or student relating to fees, transport, or communications.`,
  },
  {
    id: "termination",
    title: "15. Termination",
    body: `**By you** — schools may terminate their subscription by providing 30 days' written notice. Access continues until the end of the current billing period; no refund is provided for unused time.

**By Skippo** — we may suspend or terminate your access immediately if you breach these Terms, fail to pay subscription fees after the grace period, engage in fraudulent activity, or if required by law.

**Effect of termination** — upon termination, your right to use the Platform ceases. School data will be available for export for 90 days post-termination, after which it will be deleted per our Privacy Policy.

**Survival** — provisions relating to intellectual property, limitation of liability, indemnification, and governing law survive termination.`,
  },
  {
    id: "governing-law",
    title: "16. Governing law and disputes",
    body: `These Terms are governed by the laws of India, without regard to conflict of law principles.

**Escalation** — both parties agree to attempt to resolve disputes informally before initiating formal proceedings. Please contact us at ${EMAIL} with a description of your dispute. We will respond within 10 business days.

**Arbitration** — if informal resolution fails, disputes shall be referred to arbitration under the Arbitration and Conciliation Act, 1996, with a single arbitrator mutually agreed upon. The seat of arbitration shall be Bangalore, Karnataka, India. The language of arbitration shall be English.

**Courts** — for urgent interim relief, or if arbitration is inapplicable, disputes shall be subject to the exclusive jurisdiction of courts in Bangalore, Karnataka, India.`,
  },
  {
    id: "general",
    title: "17. General provisions",
    body: `**Entire agreement** — these Terms, together with the Privacy Policy and any subscription order form, constitute the entire agreement between you and Skippo regarding the Platform.

**Severability** — if any provision of these Terms is found unenforceable, the remaining provisions continue in full force.

**Waiver** — failure to enforce any right does not constitute a waiver of that right.

**Assignment** — you may not assign your rights or obligations under these Terms without Skippo's prior written consent. Skippo may assign its rights in connection with a merger, acquisition, or sale of assets.

**Force majeure** — neither party is liable for failure to perform obligations caused by events beyond reasonable control, including natural disasters, government actions, internet disruptions, or acts of third parties.

**Notices** — legal notices to Skippo must be sent to ${EMAIL}. Notices to you will be sent to your registered email address.`,
  },
  {
    id: "contact",
    title: "18. Contact",
    body: `For questions about these Terms:

**${COMPANY}**
Email: ${EMAIL}
Address: Bangalore, Karnataka, India

For privacy matters: privacy@skippo.co.in
For support: support@skippo.co.in`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="h-[68px] border-b border-surface-border flex items-center justify-between px-6 sticky top-0 bg-white/95 backdrop-blur z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Skippo" className="w-8 h-8" />
          <span className="font-black text-ink text-lg">Skippo</span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-ink-muted">
          <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
          <Link href="/signup"  className="px-4 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors text-xs">
            Get Started
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
        {/* Header */}
        <div className="mb-14">
          <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl lg:text-5xl font-black text-ink tracking-tight mb-4">Terms &amp; Conditions</h1>
          <p className="text-ink-muted">
            Effective date: <span className="font-semibold text-ink">{EFFECTIVE_DATE}</span>
          </p>
          <p className="text-sm text-ink-muted mt-2 max-w-xl leading-relaxed">
            These Terms govern your use of the Skippo platform. Please read them carefully. By using Skippo, you agree to be bound by these Terms.
          </p>
        </div>

        {/* Table of contents */}
        <div className="bg-surface-soft border border-surface-border rounded-2xl p-6 mb-14">
          <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">Contents</p>
          <ol className="space-y-2 columns-1 sm:columns-2 gap-x-8">
            {sections.map((s) => (
              <li key={s.id} className="break-inside-avoid">
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
              <div>
                {s.body.split("\n\n").map((para, i) => {
                  if (para.startsWith("**") && para.endsWith("**")) {
                    return (
                      <p key={i} className="font-black text-ink text-sm mt-5 mb-1">
                        {para.replace(/\*\*/g, "")}
                      </p>
                    );
                  }
                  if (para.startsWith("- ")) {
                    const items = para.split("\n").filter((l) => l.startsWith("- "));
                    return (
                      <ul key={i} className="space-y-1.5 mb-3 ml-4">
                        {items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-ink-muted">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                            <span dangerouslySetInnerHTML={{ __html: item.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
                          </li>
                        ))}
                      </ul>
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
            These Terms and Conditions are governed by the laws of India. Disputes are subject to arbitration in Bangalore, Karnataka. For urgent legal matters, the courts of Bangalore have exclusive jurisdiction.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-xs text-ink-muted">
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-ink transition-colors">Contact Us</Link>
            <Link href="/"        className="hover:text-ink transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
