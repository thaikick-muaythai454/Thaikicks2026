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
                        This page contains the official documentation for our {title}. We take your data security and privacy seriously.
                    </p>
                    
                    {title === 'Privacy Policy' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-black text-brand-charcoal uppercase border-l-4 border-brand-red pl-4">User Data Deletion</h2>
                            <p>
                                At ThaiKicks, we respect your right to privacy and control over your personal data. If you wish to delete your account and all associated data, you can do so by:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Email Request:</strong> Send an email to <a href="mailto:support@thaikicks.com" className="text-brand-blue underline">support@thaikicks.com</a> with the subject "Data Deletion Request". Please include your registered email address.</li>
                                <li><strong>Verification:</strong> For security purposes, we will verify your identity before processing the deletion.</li>
                                <li><strong>Timeframe:</strong> Data deletion requests are typically processed within 7-14 business days. Once deleted, your account history, bookings, and profile information cannot be recovered.</li>
                            </ul>
                        </div>
                    )}

                    <p>
                        Please check back soon for the full terms and conditions governing the use of the THAIKICKS platform and booking system.
                    </p>
                    <p>
                        For any immediate legal inquiries, please contact our support team at <a href="mailto:legal@thaikicks.com" className="text-brand-blue underline">legal@thaikicks.com</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LegalPage;
