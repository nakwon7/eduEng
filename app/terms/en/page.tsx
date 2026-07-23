export default function TermsEnPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-12">
        <div>
          <a href="/landing/ko" className="text-blue-400 text-sm hover:text-blue-300">← Home</a>
          <h1 className="text-2xl font-bold mt-4 mb-1">Terms of Service & Privacy Policy</h1>
          <p className="text-gray-500 text-xs">Last updated: July 13, 2026 · Effective: July 13, 2026</p>
        </div>

        {/* Terms of Service */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-blue-400 border-b border-gray-800 pb-2">Terms of Service</h2>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">Article 1 (Purpose)</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              These Terms govern the conditions of use, procedures, and the rights and responsibilities between
              SongLab ("Company") and members of the AI Korean tutoring service <strong className="text-white">TuringCall</strong> ("Service").
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">Article 2 (Definitions)</h3>
            <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li>"Member" refers to a person who has agreed to these Terms and completed registration.</li>
              <li>"Service" refers to the AI-based voice Korean learning service provided by the Company.</li>
              <li>"Free Trial" refers to 3 free sessions (up to 30 minutes each) provided upon sign-up.</li>
              <li>"Membership" refers to a paid subscription granting unlimited access during the subscription period.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">Article 3 (Effectiveness & Changes)</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              These Terms take effect upon posting on the Service or notifying members by other means.
              The Company may amend these Terms with at least 7 days' prior notice.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">Article 4 (Registration)</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Registration is completed when a user agrees to these Terms and submits the sign-up form.
              The Company may operate an administrator approval process as needed.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">Article 5 (Service & Pricing)</h3>
            <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li>Free Trial: 2 sessions upon sign-up (up to 5 minutes each), no payment required</li>
              <li>Membership: $3/week (beta pricing), paid via bank transfer or PayPal</li>
              <li>Bank transfer: KB Kookmin Bank 758637-00-012739 (SongLab)</li>
              <li>Access is activated manually by the administrator after payment confirmation.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">Article 6 (Refund Policy)</h3>
            <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li>As 2 free trial sessions are provided immediately upon sign-up, refunds are not available after membership payment.</li>
              <li>However, if cancellation is requested before service activation, a full refund will be issued.</li>
              <li>Refund requests: contact us via KakaoTalk channel</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">Article 7 (Service Restrictions)</h3>
            <p className="text-gray-400 text-sm leading-relaxed">The Company may restrict access in the following cases:</p>
            <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li>Using the Service to defame others or generate illegal content</li>
              <li>Sharing accounts or attempting simultaneous logins</li>
              <li>Interfering with the normal operation of the Service</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">Article 8 (Disclaimers)</h3>
            <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li>AI tutor responses are for learning assistance only and do not guarantee complete accuracy.</li>
              <li>The Company is not liable for service interruptions due to force majeure (natural disasters, system failures, etc.).</li>
              <li>The Company is not liable for damages caused by the member&apos;s own actions.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">Article 9 (Dispute Resolution)</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Disputes related to these Terms shall be subject to the exclusive jurisdiction of the court having jurisdiction over the Company&apos;s location.
            </p>
          </div>
        </section>

        {/* Privacy Policy */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-blue-400 border-b border-gray-800 pb-2">Privacy Policy</h2>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">1. Information We Collect</h3>
            <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li><strong className="text-gray-300">Required:</strong> Email, password (encrypted), username, name</li>
              <li><strong className="text-gray-300">Optional:</strong> Korean level</li>
              <li><strong className="text-gray-300">Auto-collected:</strong> Usage time, call records (count & duration)</li>
              <li><strong className="text-gray-300">Voice data:</strong> Audio is converted to text in real time — voice files are never stored.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">2. Purpose of Collection</h3>
            <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li>Member identification and service delivery</li>
              <li>Subscription period management</li>
              <li>Service quality improvement</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">3. Retention Period</h3>
            <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li>Retained until account deletion, then immediately removed</li>
              <li>Retained for the legally required period when applicable</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">4. Third-Party Sharing</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              We do not share your personal information with third parties as a general rule.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">5. Your Rights</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              You may request access, correction, deletion, or suspension of processing of your personal data at any time.
              Contact us via KakaoTalk and we will respond promptly.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">6. Privacy Officer</h3>
            <div className="bg-gray-900 rounded-xl p-3 text-sm text-gray-400 space-y-1">
              <p>Company: SongLab</p>
              <p>Contact: <a href="https://open.kakao.com/o/sPanl0Ci" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">KakaoTalk Channel</a></p>
            </div>
          </div>
        </section>

        {/* Business Info */}
        <section className="border-t border-gray-800 pt-6 text-xs text-gray-600 space-y-1">
          <p className="font-medium text-gray-500">Business Information</p>
          <p>Company: SongLab | Business Registration No.: 857-28-01961</p>
          <p>Service: TuringCall (turingcall-ten.vercel.app)</p>
          <p>Contact: <a href="https://open.kakao.com/o/sPanl0Ci" className="text-blue-400" target="_blank" rel="noopener noreferrer">KakaoTalk Channel</a></p>
        </section>
      </div>
    </main>
  );
}
