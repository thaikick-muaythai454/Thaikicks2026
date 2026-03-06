import React from 'react';

const LegalPage: React.FC<{ title: string }> = ({ title }) => {
    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-20 pb-40">
            <div className="max-w-3xl mx-auto bg-white border-2 border-brand-charcoal p-10 shadow-[8px_8px_0px_0px_#1A1A1A]">
                <h1 className="text-4xl font-black uppercase text-brand-charcoal mb-6 border-b-2 border-brand-charcoal pb-4">{title}</h1>
                <div className="font-mono text-sm text-gray-600 leading-relaxed space-y-6">
                    <p>
                        <strong>Effective Date:</strong> January 1, 2026
                    </p>
                    <p>
                        This page contains placeholder content for the {title}. This content is currently under review by our legal team and will be updated shortly prior to the platform's official launch.
                    </p>
                    <p>
                        Please check back soon for the full terms and conditions governing the use of the THAIKICKS platform and booking system.
                    </p>
                    <p>
                        For any immediate legal inquiries, please contact our support team at legal@thaikicks.com.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LegalPage;
