"use client";

interface TermsModalEnProps {
  onClose: () => void;
}

export default function TermsModalEn({ onClose }: TermsModalEnProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h1 className="text-white text-sm font-bold">Terms of Service & Privacy Policy</h1>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1">✕ Close</button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-10 text-sm">

        {/* Terms of Service */}
        <section className="space-y-5">
          <h2 className="text-base font-bold text-blue-400 border-b border-gray-800 pb-2">Terms of Service</h2>

          {[
            { title: "Article 1 (Purpose)", content: "These Terms govern the conditions of use, procedures, and the rights and responsibilities between SongLab ('Company') and members of the AI Korean tutoring service TuringCall ('Service')." },
            { title: "Article 3 (Effectiveness & Changes)", content: "These Terms take effect upon posting on the Service or notifying members by other means. The Company may amend these Terms with at least 7 days' prior notice." },
            { title: "Article 4 (Registration)", content: "Registration is completed when a user agrees to these Terms and submits the sign-up form. The Company may operate an administrator approval process as needed." },
            { title: "Article 8 (Disclaimers)", content: "AI tutor responses are for learning assistance only and do not guarantee complete accuracy. The Company is not liable for service interruptions due to force majeure." },
            { title: "Article 9 (Dispute Resolution)", content: "Disputes related to these Terms shall be subject to the exclusive jurisdiction of the court having jurisdiction over the Company's location." },
          ].map((item) => (
            <div key={item.title} className="space-y-1">
              <h3 className="font-semibold text-gray-200 text-xs">{item.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{item.content}</p>
            </div>
          ))}

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-200 text-xs">Article 2 (Definitions)</h3>
            <ul className="text-gray-400 text-xs leading-relaxed space-y-1 list-disc list-inside">
              <li>&quot;Member&quot; refers to a person who has agreed to these Terms and completed registration.</li>
              <li>&quot;Free Trial&quot; refers to 3 free sessions (up to 30 minutes each) provided upon sign-up.</li>
              <li>&quot;Membership&quot; refers to a paid subscription granting unlimited access during the subscription period.</li>
            </ul>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-200 text-xs">Article 5 (Service & Pricing)</h3>
            <ul className="text-gray-400 text-xs leading-relaxed space-y-1 list-disc list-inside">
              <li>Free Trial: 3 sessions upon sign-up (up to 30 minutes each), no payment required</li>
              <li>Membership: ₩9,900/month (beta pricing), paid via bank transfer</li>
              <li>Bank transfer: KB Kookmin Bank 758637-00-012739 (SongLab)</li>
              <li>Access is activated manually by the administrator after payment confirmation.</li>
            </ul>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-200 text-xs">Article 6 (Refund Policy)</h3>
            <ul className="text-gray-400 text-xs leading-relaxed space-y-1 list-disc list-inside">
              <li>As 5 free trial sessions are provided immediately upon sign-up, refunds are not available after membership payment.</li>
              <li>However, if cancellation is requested before service activation, a full refund will be issued.</li>
              <li>Refund requests: contact us via KakaoTalk channel</li>
            </ul>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-200 text-xs">Article 7 (Service Restrictions)</h3>
            <ul className="text-gray-400 text-xs leading-relaxed space-y-1 list-disc list-inside">
              <li>Using the Service to defame others or generate illegal content</li>
              <li>Sharing accounts or attempting simultaneous logins</li>
              <li>Interfering with the normal operation of the Service</li>
            </ul>
          </div>
        </section>

        {/* Privacy Policy */}
        <section className="space-y-5">
          <h2 className="text-base font-bold text-blue-400 border-b border-gray-800 pb-2">Privacy Policy</h2>

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-200 text-xs">1. Information We Collect</h3>
            <ul className="text-gray-400 text-xs leading-relaxed space-y-1 list-disc list-inside">
              <li>Required: Email, password (encrypted), username, name</li>
              <li>Auto-collected: Usage time, call records (count & duration)</li>
              <li>Voice data: Audio is converted to text in real time — voice files are never stored.</li>
            </ul>
          </div>

          {[
            { title: "2. Purpose of Collection", items: ["Member identification and service delivery", "Subscription period management", "Service quality improvement"] },
            { title: "3. Retention Period", items: ["Retained until account deletion, then immediately removed", "Retained for the legally required period when applicable"] },
          ].map((item) => (
            <div key={item.title} className="space-y-1">
              <h3 className="font-semibold text-gray-200 text-xs">{item.title}</h3>
              <ul className="text-gray-400 text-xs leading-relaxed space-y-1 list-disc list-inside">
                {item.items.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </div>
          ))}

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-200 text-xs">4. Third-Party Sharing</h3>
            <p className="text-gray-400 text-xs">We do not share your personal information with third parties as a general rule.</p>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-200 text-xs">5. Your Rights</h3>
            <p className="text-gray-400 text-xs leading-relaxed">You may request access, correction, deletion, or suspension of processing of your personal data at any time. Contact us via KakaoTalk and we will respond promptly.</p>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-200 text-xs">6. Privacy Officer</h3>
            <div className="bg-gray-900 rounded-xl p-3 text-xs text-gray-400 space-y-1">
              <p>Company: SongLab</p>
              <p>Contact: <a href="https://open.kakao.com/o/sPanl0Ci" className="text-blue-400" target="_blank" rel="noopener noreferrer">KakaoTalk Channel</a></p>
            </div>
          </div>
        </section>

        {/* Business Info */}
        <section className="border-t border-gray-800 pt-4 text-xs text-gray-600 space-y-1">
          <p className="font-medium text-gray-500">Business Information</p>
          <p>Company: SongLab | Business Registration No.: 857-28-01961</p>
          <p>Service: TuringCall (turingcall-ten.vercel.app)</p>
          <p>Contact: <a href="https://open.kakao.com/o/sPanl0Ci" className="text-blue-400" target="_blank" rel="noopener noreferrer">KakaoTalk Channel</a></p>
        </section>
      </div>
    </div>
  );
}
