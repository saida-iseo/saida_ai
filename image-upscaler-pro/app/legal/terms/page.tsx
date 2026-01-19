export default function TermsPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-background px-6 py-16">
            <div className="mx-auto max-w-4xl">
                <h1 className="text-4xl font-black text-text-primary mb-4">이용약관</h1>
                <p className="text-sm text-text-tertiary mb-12">최종 업데이트: 2026년 1월</p>

                <div className="space-y-8 text-text-secondary leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">제1조 (목적)</h2>
                        <p>
                            본 약관은 Saida Image Maker(이하 "서비스")가 제공하는 이미지 편집 및 변환 서비스의 이용과 관련하여
                            회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">제2조 (정의)</h2>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>"서비스"란 이용자가 이미지 편집, 변환, 압축 등의 작업을 브라우저에서 수행할 수 있도록 제공하는 온라인 도구를 의미합니다.</li>
                            <li>"이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
                            <li>"콘텐츠"란 이용자가 서비스를 이용하면서 업로드하거나 생성하는 이미지, 파일 및 기타 정보를 의미합니다.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">제3조 (서비스의 제공)</h2>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>회사는 이용자에게 다음과 같은 서비스를 제공합니다:
                                <ul className="list-disc list-inside ml-6 mt-2">
                                    <li>이미지 업스케일링 및 화질 개선</li>
                                    <li>이미지 포맷 변환 (PNG, JPG, WebP 등)</li>
                                    <li>이미지 압축 및 최적화</li>
                                    <li>이미지 편집 도구 (크롭, 회전, 블러, 모자이크 등)</li>
                                    <li>AI 기반 이미지 처리 (배경 제거, 노이즈 제거 등)</li>
                                </ul>
                            </li>
                            <li>서비스는 연중무휴 24시간 제공됨을 원칙으로 하나, 시스템 점검, 유지보수 등의 사유로 일시 중단될 수 있습니다.</li>
                            <li>모든 이미지 처리는 이용자의 브라우저에서 로컬로 수행되며, 서버로 업로드되지 않습니다.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">제4조 (이용자의 의무)</h2>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>이용자는 다음 행위를 하여서는 안 됩니다:
                                <ul className="list-disc list-inside ml-6 mt-2">
                                    <li>타인의 저작권, 초상권 등 지적재산권을 침해하는 콘텐츠 업로드</li>
                                    <li>불법적이거나 유해한 콘텐츠의 생성 및 배포</li>
                                    <li>서비스의 정상적인 운영을 방해하는 행위</li>
                                    <li>서비스를 상업적 목적으로 무단 사용하는 행위</li>
                                </ul>
                            </li>
                            <li>이용자는 관련 법령, 본 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항 등을 준수해야 합니다.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">제5조 (저작권 및 소유권)</h2>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>이용자가 업로드한 콘텐츠에 대한 저작권은 이용자에게 있습니다.</li>
                            <li>서비스를 통해 생성된 결과물의 저작권 역시 이용자에게 귀속됩니다.</li>
                            <li>회사는 이용자의 콘텐츠를 저장하지 않으며, 브라우저 내에서만 처리됩니다.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">제6조 (책임의 제한)</h2>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
                            <li>회사는 이용자의 브라우저 환경, 네트워크 상태 등으로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
                            <li>회사는 이용자가 생성한 콘텐츠의 법적 문제에 대해 책임을 지지 않습니다.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">제7조 (분쟁 해결)</h2>
                        <p>
                            본 약관과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 상호 협의하여 원만하게 해결하도록 노력해야 하며,
                            협의가 이루어지지 않을 경우 대한민국 법률에 따라 관할 법원에서 해결합니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">제8조 (약관의 개정)</h2>
                        <p>
                            회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며,
                            약관이 개정되는 경우 적용일자 및 개정사유를 명시하여 서비스 내에 공지합니다.
                        </p>
                    </section>

                    <section className="pt-8 border-t border-card-border">
                        <p className="text-sm text-text-tertiary">
                            본 약관은 2026년 1월 1일부터 시행됩니다.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
