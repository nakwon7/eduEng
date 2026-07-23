import CopyButton from "@/components/CopyButton";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-12">
        <div>
          <a href="/" className="text-green-400 text-sm hover:text-green-300">← 홈으로</a>
          <h1 className="text-2xl font-bold mt-4 mb-1">이용약관 및 개인정보처리방침</h1>
          <p className="text-gray-500 text-xs">최종 수정일: 2026년 7월 13일 · 시행일: 2026년 7월 13일</p>
        </div>

        {/* ───── 이용약관 ───── */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-green-400 border-b border-gray-800 pb-2">이용약관</h2>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">제1조 (목적)</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              본 약관은 송랩(이하 "회사")이 운영하는 AI 전화영어 서비스 <strong className="text-white">튜링콜</strong>(이하 "서비스")의
              이용 조건 및 절차, 회사와 회원 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">제2조 (정의)</h3>
            <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li>"회원"이란 본 약관에 동의하고 회원가입을 완료한 자를 말합니다.</li>
              <li>"서비스"란 회사가 제공하는 AI 기반 음성 영어 학습 서비스를 말합니다.</li>
              <li>"무료 체험"이란 회원 가입 후 제공되는 2회(회당 최대 5분)의 무료 이용 기회를 말합니다.</li>
              <li>"멤버십"이란 유료 결제 후 사용 기간 동안 서비스를 무제한 이용할 수 있는 이용권을 말합니다.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">제3조 (약관의 효력 및 변경)</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              본 약관은 서비스 화면에 게시하거나 기타 방법으로 회원에게 공지함으로써 효력이 발생합니다.
              회사는 필요한 경우 약관을 변경할 수 있으며, 변경 시 최소 7일 전에 공지합니다.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">제4조 (회원가입)</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              회원가입은 이용자가 본 약관에 동의하고 회원가입 양식을 작성하여 신청함으로써 완료됩니다.
              회사는 필요에 따라 관리자 승인 절차를 운영할 수 있습니다.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">제5조 (서비스 이용 및 요금)</h3>
            <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li>무료 체험: 가입 후 2회 제공 (회당 최대 5분), 별도 결제 불필요</li>
              <li>멤버십: 월 9,900원 (베타 기간 기준), 계좌이체로 결제</li>
              <li className="flex items-center gap-1">
                KB국민은행 758637-00-012739
                <CopyButton text="758637-00-012739" />
                (예금주: 송랩)
              </li>
              <li>이용 기간은 입금 확인 후 관리자가 수동으로 활성화합니다.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">제6조 (환불 정책)</h3>
            <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li>가입 즉시 2회(회당 최대 5분) 무료 체험이 제공되므로, 멤버십 결제 후에는 환불이 불가합니다.</li>
              <li>단, 결제 후 서비스 활성화 전에 취소를 요청한 경우 전액 환불합니다.</li>
              <li>환불 요청: 카카오톡 채널로 문의</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">제7조 (서비스 제한)</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              회사는 다음의 경우 서비스 이용을 제한할 수 있습니다.
            </p>
            <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li>서비스를 통해 타인을 비방하거나 불법적인 내용을 생성하는 경우</li>
              <li>계정을 타인과 공유하거나 동시 접속을 시도하는 경우</li>
              <li>서비스의 정상적인 운영을 방해하는 경우</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">제8조 (면책 사항)</h3>
            <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li>AI 튜터의 응답은 학습 보조 목적이며, 완벽한 정확성을 보장하지 않습니다.</li>
              <li>천재지변, 시스템 장애 등 불가항력에 의한 서비스 중단에 대해 책임을 지지 않습니다.</li>
              <li>회원의 귀책 사유로 발생한 손해에 대해 회사는 책임을 지지 않습니다.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">제9조 (분쟁 해결)</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              본 약관과 관련한 분쟁은 회사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.
            </p>
          </div>
        </section>

        {/* ───── 개인정보처리방침 ───── */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-green-400 border-b border-gray-800 pb-2">개인정보처리방침</h2>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">1. 수집하는 개인정보 항목</h3>
            <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li><strong className="text-gray-300">필수:</strong> 이메일, 비밀번호(암호화 저장), 아이디(username), 이름</li>
              <li><strong className="text-gray-300">선택:</strong> 영어 레벨</li>
              <li><strong className="text-gray-300">자동 수집:</strong> 서비스 이용 시간, 통화 기록(횟수·시간)</li>
              <li><strong className="text-gray-300">음성 데이터:</strong> 대화 중 음성은 실시간 변환 후 텍스트만 처리되며 음성 파일은 저장되지 않습니다.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">2. 수집 목적</h3>
            <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li>회원 식별 및 서비스 제공</li>
              <li>이용 기간 관리 및 멤버십 운영</li>
              <li>서비스 품질 개선</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">3. 보유 및 이용 기간</h3>
            <ul className="text-gray-400 text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li>회원 탈퇴 시까지 보유 후 즉시 삭제</li>
              <li>관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보유</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">4. 제3자 제공</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              수집한 개인정보는 원칙적으로 외부에 제공하지 않습니다.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">5. 이용자 권리</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              회원은 언제든지 개인정보 조회, 수정, 삭제 및 처리 정지를 요청할 수 있습니다.
              카카오톡 채널을 통해 요청하시면 지체 없이 처리합니다.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-200">6. 개인정보 보호책임자</h3>
            <div className="bg-gray-900 rounded-xl p-3 text-sm text-gray-400 space-y-1">
              <p>소속: 송랩</p>
              <p>문의: <a href="https://open.kakao.com/o/sPanl0Ci" className="text-green-400 hover:text-green-300" target="_blank" rel="noopener noreferrer">카카오톡 채널</a></p>
            </div>
          </div>
        </section>

        {/* ───── 사업자 정보 ───── */}
        <section className="border-t border-gray-800 pt-6 text-xs text-gray-600 space-y-1">
          <p className="font-medium text-gray-500">사업자 정보</p>
          <p>상호: 송랩 | 사업자등록번호: 857-28-01961</p>
          <p>서비스명: 튜링콜 (turingcall.vercel.app)</p>
          <p>문의: <a href="https://open.kakao.com/o/sPanl0Ci" className="text-green-400" target="_blank" rel="noopener noreferrer">카카오톡 채널</a></p>
        </section>
      </div>
    </main>
  );
}
