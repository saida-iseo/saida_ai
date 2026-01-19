export default function PrivacyPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-background px-6 py-16">
            <div className="mx-auto max-w-4xl">
                <h1 className="text-4xl font-black text-text-primary mb-4">개인정보처리방침</h1>
                <p className="text-sm text-text-tertiary mb-12">최종 업데이트: 2026년 1월</p>

                <div className="space-y-8 text-text-secondary leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">1. 개인정보의 처리 목적</h2>
                        <p>
                            Saida Image Maker(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다.
                            처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며,
                            이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                        </p>
                        <ul className="list-disc list-inside ml-6 mt-4 space-y-2">
                            <li>회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공, 본인 식별·인증</li>
                            <li>서비스 제공: 콘텐츠 제공, 맞춤 서비스 제공, 본인인증</li>
                            <li>서비스 개선: 신규 서비스 개발, 통계학적 특성에 따른 서비스 제공 및 광고 게재</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">2. 처리하는 개인정보 항목</h2>
                        <p className="mb-4">회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
                        <div className="bg-card-bg p-6 rounded-xl border border-card-border">
                            <h3 className="font-bold text-text-primary mb-3">필수항목</h3>
                            <ul className="list-disc list-inside space-y-1">
                                <li>이메일 주소</li>
                                <li>비밀번호 (암호화 저장)</li>
                                <li>이름 또는 닉네임</li>
                            </ul>
                            <h3 className="font-bold text-text-primary mt-4 mb-3">자동 수집 항목</h3>
                            <ul className="list-disc list-inside space-y-1">
                                <li>서비스 이용 기록, 접속 로그, 쿠키</li>
                                <li>접속 IP 정보, 브라우저 정보</li>
                            </ul>
                        </div>
                        <p className="mt-4 text-sm font-bold text-accent">
                            ⚠️ 중요: 이미지 파일은 서버에 업로드되지 않으며, 브라우저 내에서만 처리됩니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">3. 개인정보의 처리 및 보유 기간</h2>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</li>
                            <li>각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:
                                <ul className="list-disc list-inside ml-6 mt-2">
                                    <li>회원 가입 및 관리: 회원 탈퇴 시까지</li>
                                    <li>서비스 이용 기록: 3개월</li>
                                    <li>법령에 따른 보존: 관련 법령에 따른 보존기간</li>
                                </ul>
                            </li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">4. 개인정보의 제3자 제공</h2>
                        <p className="font-bold text-accent mb-2">
                            회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
                        </p>
                        <p>
                            다만, 다음의 경우에는 예외로 합니다:
                        </p>
                        <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li>이용자가 사전에 동의한 경우</li>
                            <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">5. 개인정보의 파기</h2>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</li>
                            <li>파기 절차 및 방법:
                                <ul className="list-disc list-inside ml-6 mt-2">
                                    <li>전자적 파일: 복구 및 재생되지 않도록 안전하게 삭제</li>
                                    <li>기록물, 인쇄물, 서면 등: 분쇄하거나 소각</li>
                                </ul>
                            </li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">6. 정보주체의 권리·의무 및 행사방법</h2>
                        <p>이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다:</p>
                        <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                            <li>개인정보 열람 요구</li>
                            <li>오류 등이 있을 경우 정정 요구</li>
                            <li>삭제 요구</li>
                            <li>처리 정지 요구</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">7. 개인정보 보호책임자</h2>
                        <div className="bg-card-bg p-6 rounded-xl border border-card-border">
                            <p className="font-bold text-text-primary mb-2">개인정보 보호책임자</p>
                            <ul className="space-y-1 text-sm">
                                <li>성명: Saida 개인정보보호팀</li>
                                <li>이메일: privacy@saida-imagemaker.com</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">8. 개인정보 처리방침 변경</h2>
                        <p>
                            본 개인정보 처리방침은 법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 경우
                            변경사항의 시행 7일 전부터 서비스 내 공지사항을 통해 고지할 것입니다.
                        </p>
                    </section>

                    <section className="pt-8 border-t border-card-border">
                        <p className="text-sm text-text-tertiary">
                            본 방침은 2026년 1월 1일부터 시행됩니다.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
