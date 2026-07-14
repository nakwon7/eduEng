"use client";

interface TermsModalProps {
  onClose: () => void;
}

export default function TermsModal({ onClose }: TermsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h1 className="text-white text-sm font-bold">이용약관 및 개인정보처리방침</h1>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1">✕ 닫기</button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-10 text-sm">

        {/* 이용약관 */}
        <section className="space-y-5">
          <h2 className="text-base font-bold text-green-400 border-b border-gray-800 pb-2">이용약관</h2>

          {[
            { title: "제1조 (목적)", content: "본 약관은 송랩(이하 '회사')이 운영하는 AI 전화영어 서비스 튜링콜(이하 '서비스')의 이용 조건 및 절차, 회사와 회원 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다." },
            { title: "제3조 (약관의 효력 및 변경)", content: "본 약관은 서비스 화면에 게시하거나 기타 방법으로 회원에게 공지함으로써 효력이 발생합니다. 회사는 필요한 경우 약관을 변경할 수 있으며, 변경 시 최소 7일 전에 공지합니다." },
            { title: "제4조 (회원가입)", content: "회원가입은 이용자가 본 약관에 동의하고 회원가입 양식을 작성하여 신청함으로써 완료됩니다. 회사는 필요에 따라 관리자 승인 절차를 운영할 수 있습니다." },
            { title: "제8조 (면책 사항)", content: "AI 튜터의 응답은 학습 보조 목적이며, 완벽한 정확성을 보장하지 않습니다. 천재지변, 시스템 장애 등 불가항력에 의한 서비스 중단에 대해 책임을 지지 않습니다." },
            { title: "제9조 (분쟁 해결)", content: "본 약관과 관련한 분쟁은 회사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다." },
          ].map((item) => (
            <div key={item.title} className="space-y-1">
              <h3 className="font-semibold text-gray-200 text-xs">{item.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{item.content}</p>
            </div>
          ))}

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-200 text-xs">제2조 (정의)</h3>
            <ul className="text-gray-400 text-xs leading-relaxed space-y-1 list-disc list-inside">
              <li>&apos;회원&apos;이란 본 약관에 동의하고 회원가입을 완료한 자를 말합니다.</li>
              <li>&apos;무료 체험&apos;이란 회원 가입 후 제공되는 3회(회당 최대 30분)의 무료 이용 기회를 말합니다.</li>
              <li>&apos;멤버십&apos;이란 유료 결제 후 사용 기간 동안 서비스를 무제한 이용할 수 있는 이용권을 말합니다.</li>
            </ul>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-200 text-xs">제5조 (서비스 이용 및 요금)</h3>
            <ul className="text-gray-400 text-xs leading-relaxed space-y-1 list-disc list-inside">
              <li>무료 체험: 가입 후 3회 제공 (회당 최대 30분), 별도 결제 불필요</li>
              <li>멤버십: 월 9,900원 (베타 기간 기준), 계좌이체로 결제</li>
              <li>결제 계좌: 토스뱅크 1000-4983-0654 — 사업자계좌 발급 전 임시 운영</li>
              <li>이용 기간은 입금 확인 후 관리자가 수동으로 활성화합니다.</li>
            </ul>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-200 text-xs">제6조 (환불 정책)</h3>
            <ul className="text-gray-400 text-xs leading-relaxed space-y-1 list-disc list-inside">
              <li>가입 즉시 3회(회당 최대 30분) 무료 체험이 제공되므로, 멤버십 결제 후에는 환불이 불가합니다.</li>
              <li>단, 결제 후 서비스 활성화 전에 취소를 요청한 경우 전액 환불합니다.</li>
              <li>환불 요청: 카카오톡 채널로 문의</li>
            </ul>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-200 text-xs">제7조 (서비스 제한)</h3>
            <ul className="text-gray-400 text-xs leading-relaxed space-y-1 list-disc list-inside">
              <li>서비스를 통해 타인을 비방하거나 불법적인 내용을 생성하는 경우</li>
              <li>계정을 타인과 공유하거나 동시 접속을 시도하는 경우</li>
              <li>서비스의 정상적인 운영을 방해하는 경우</li>
            </ul>
          </div>
        </section>

        {/* 개인정보처리방침 */}
        <section className="space-y-5">
          <h2 className="text-base font-bold text-green-400 border-b border-gray-800 pb-2">개인정보처리방침</h2>

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-200 text-xs">1. 수집하는 개인정보 항목</h3>
            <ul className="text-gray-400 text-xs leading-relaxed space-y-1 list-disc list-inside">
              <li>필수: 이메일, 비밀번호(암호화 저장), 아이디(username), 이름</li>
              <li>자동 수집: 서비스 이용 시간, 통화 기록(횟수·시간)</li>
              <li>음성 데이터: 대화 중 음성은 실시간 변환 후 텍스트만 처리되며 음성 파일은 저장되지 않습니다.</li>
            </ul>
          </div>

          {[
            { title: "2. 수집 목적", items: ["회원 식별 및 서비스 제공", "이용 기간 관리 및 멤버십 운영", "서비스 품질 개선"] },
            { title: "3. 보유 및 이용 기간", items: ["회원 탈퇴 시까지 보유 후 즉시 삭제", "관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보유"] },
          ].map((item) => (
            <div key={item.title} className="space-y-1">
              <h3 className="font-semibold text-gray-200 text-xs">{item.title}</h3>
              <ul className="text-gray-400 text-xs leading-relaxed space-y-1 list-disc list-inside">
                {item.items.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </div>
          ))}

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-200 text-xs">4. 제3자 제공</h3>
            <p className="text-gray-400 text-xs">수집한 개인정보는 원칙적으로 외부에 제공하지 않습니다.</p>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-200 text-xs">5. 이용자 권리</h3>
            <p className="text-gray-400 text-xs leading-relaxed">회원은 언제든지 개인정보 조회, 수정, 삭제 및 처리 정지를 요청할 수 있습니다. 카카오톡 채널을 통해 요청하시면 지체 없이 처리합니다.</p>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-200 text-xs">6. 개인정보 보호책임자</h3>
            <div className="bg-gray-900 rounded-xl p-3 text-xs text-gray-400 space-y-1">
              <p>소속: 송랩</p>
              <p>문의: <a href="https://open.kakao.com/o/sPanl0Ci" className="text-green-400" target="_blank" rel="noopener noreferrer">카카오톡 채널</a></p>
            </div>
          </div>
        </section>

        {/* 사업자 정보 */}
        <section className="border-t border-gray-800 pt-4 text-xs text-gray-600 space-y-1">
          <p className="font-medium text-gray-500">사업자 정보</p>
          <p>상호: 송랩 | 사업자등록번호: 857-28-01961</p>
          <p>서비스명: 튜링콜 (turingcall.vercel.app)</p>
          <p>문의: <a href="https://open.kakao.com/o/sPanl0Ci" className="text-green-400" target="_blank" rel="noopener noreferrer">카카오톡 채널</a></p>
        </section>
      </div>
    </div>
  );
}
