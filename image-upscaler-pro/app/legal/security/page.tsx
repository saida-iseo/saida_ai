export default function SecurityPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-background px-6 py-16">
            <div className="mx-auto max-w-4xl">
                <h1 className="text-4xl font-black text-text-primary mb-4">데이터 보안 정책</h1>
                <p className="text-sm text-text-tertiary mb-12">최종 업데이트: 2026년 1월</p>

                <div className="space-y-8 text-text-secondary leading-relaxed">
                    <section className="bg-accent/10 border border-accent/20 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-accent mb-3">🔒 핵심 보안 원칙</h2>
                        <p className="font-bold">
                            Saida Image Maker는 이용자의 이미지를 서버로 업로드하지 않으며,
                            모든 처리는 브라우저 내에서 로컬로 수행됩니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">1. 클라이언트 사이드 처리</h2>
                        <div className="space-y-4">
                            <p>
                                Saida Image Maker는 완전한 클라이언트 사이드 애플리케이션으로 설계되었습니다.
                                이는 다음을 의미합니다:
                            </p>
                            <ul className="list-disc list-inside ml-6 space-y-2">
                                <li className="font-bold text-accent">이미지 파일은 절대 서버로 전송되지 않습니다</li>
                                <li>모든 이미지 처리는 이용자의 브라우저에서 JavaScript로 실행됩니다</li>
                                <li>처리된 결과물은 이용자의 로컬 디바이스에만 저장됩니다</li>
                                <li>인터넷 연결 없이도 대부분의 기능을 사용할 수 있습니다</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">2. 데이터 저장 및 관리</h2>
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-text-primary">2.1 이미지 데이터</h3>
                            <ul className="list-disc list-inside ml-6 space-y-2">
                                <li>업로드된 이미지는 브라우저의 임시 메모리에만 저장됩니다</li>
                                <li>처리가 완료되면 즉시 메모리에서 해제됩니다</li>
                                <li>브라우저를 닫으면 모든 데이터가 자동으로 삭제됩니다</li>
                            </ul>

                            <h3 className="text-lg font-bold text-text-primary mt-6">2.2 사용 기록</h3>
                            <ul className="list-disc list-inside ml-6 space-y-2">
                                <li>최근 작업 목록은 브라우저의 IndexedDB에 로컬로 저장됩니다</li>
                                <li>썸네일 이미지만 저장되며, 원본 이미지는 저장되지 않습니다</li>
                                <li>이용자가 언제든지 삭제할 수 있습니다</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">3. 보안 기술</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-card-bg p-5 rounded-xl border border-card-border">
                                <h3 className="font-bold text-text-primary mb-2">HTTPS 암호화</h3>
                                <p className="text-sm">모든 통신은 HTTPS로 암호화되어 전송됩니다.</p>
                            </div>
                            <div className="bg-card-bg p-5 rounded-xl border border-card-border">
                                <h3 className="font-bold text-text-primary mb-2">WebAssembly</h3>
                                <p className="text-sm">고성능 이미지 처리를 위해 안전한 WebAssembly를 사용합니다.</p>
                            </div>
                            <div className="bg-card-bg p-5 rounded-xl border border-card-border">
                                <h3 className="font-bold text-text-primary mb-2">CSP (Content Security Policy)</h3>
                                <p className="text-sm">XSS 공격을 방지하기 위한 엄격한 보안 정책을 적용합니다.</p>
                            </div>
                            <div className="bg-card-bg p-5 rounded-xl border border-card-border">
                                <h3 className="font-bold text-text-primary mb-2">Same-Origin Policy</h3>
                                <p className="text-sm">동일 출처 정책으로 외부 접근을 차단합니다.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">4. 사용자 계정 보안</h2>
                        <ul className="list-disc list-inside ml-6 space-y-2">
                            <li>비밀번호는 bcrypt 알고리즘으로 해시화되어 저장됩니다</li>
                            <li>평문 비밀번호는 절대 저장하지 않습니다</li>
                            <li>2단계 인증(2FA) 옵션 제공 (준비 중)</li>
                            <li>소셜 로그인 시 OAuth 2.0 표준 프로토콜 사용</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">5. 외부 서비스 연동</h2>
                        <p className="mb-4">Google Drive 및 Dropbox 연동 시:</p>
                        <ul className="list-disc list-inside ml-6 space-y-2">
                            <li>OAuth 2.0 인증으로 안전하게 접근 권한을 관리합니다</li>
                            <li>필요한 최소한의 권한만 요청합니다 (읽기 전용)</li>
                            <li>액세스 토큰은 암호화되어 브라우저에 저장됩니다</li>
                            <li>언제든지 연동을 해제할 수 있습니다</li>
                        </ul>
                        <p className="mt-4 text-sm text-accent font-bold">
                            참고: 외부 서비스에서 가져온 이미지도 서버로 전송되지 않으며, 브라우저에서만 처리됩니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">6. 쿠키 및 추적</h2>
                        <div className="space-y-3">
                            <p className="font-bold">우리가 사용하는 쿠키:</p>
                            <div className="bg-card-bg p-5 rounded-xl border border-card-border">
                                <ul className="space-y-2">
                                    <li><span className="font-bold">필수 쿠키:</span> 로그인 세션 유지용 (암호화됨)</li>
                                    <li><span className="font-bold">설정 쿠키:</span> 테마, 언어 등 사용자 설정 저장</li>
                                    <li><span className="font-bold">분석 쿠키:</span> 익명화된 사용 통계 (옵트아웃 가능)</li>
                                </ul>
                            </div>
                            <p className="text-sm">우리는 광고 추적 쿠키를 사용하지 않습니다.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">7. 보안 사고 대응</h2>
                        <p>보안 취약점을 발견하신 경우:</p>
                        <div className="bg-card-bg p-6 rounded-xl border border-card-border mt-4">
                            <p className="font-bold text-text-primary mb-2">보안팀 연락처</p>
                            <p className="text-sm">이메일: security@saida-imagemaker.com</p>
                            <p className="text-sm text-text-tertiary mt-2">
                                책임있는 공개(Responsible Disclosure)를 원칙으로 하며,
                                발견된 취약점은 48시간 내에 검토하여 대응합니다.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">8. 규정 준수</h2>
                        <ul className="list-disc list-inside ml-6 space-y-2">
                            <li>GDPR (유럽 일반 데이터 보호 규정) 준수</li>
                            <li>CCPA (캘리포니아 소비자 개인정보 보호법) 준수</li>
                            <li>개인정보보호법 (대한민국) 준수</li>
                        </ul>
                    </section>

                    <section className="pt-8 border-t border-card-border">
                        <p className="text-sm text-text-tertiary">
                            본 보안 정책은 2026년 1월 1일부터 시행됩니다.<br/>
                            보안 정책은 기술 발전에 따라 정기적으로 업데이트됩니다.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
