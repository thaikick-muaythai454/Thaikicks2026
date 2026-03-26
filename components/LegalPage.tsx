import React, { useState, useEffect } from 'react';
import { getSystemSetting } from '../services/dataService';

const parseContent = (text: string) => {
    const blocks = text.trim().split(/\n\s*\n/);
    
    const parseInline = (inlineText: string) => {
        const parts = inlineText.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.substring(2, part.length - 2)}</strong>;
            }
            return part;
        });
    };

    return blocks.map((block, i) => {
        const trimmedBlock = block.trim();
        
        if (trimmedBlock.startsWith('## ')) {
            return (
                <h2 key={i} className="text-xl font-black text-brand-charcoal uppercase border-l-4 border-brand-red pl-4 pt-4 mt-4 mb-4">
                    {trimmedBlock.substring(3)}
                </h2>
            );
        }
        
        if (trimmedBlock.split('\n').every(line => line.trim().startsWith('- '))) {
            const items = trimmedBlock.split('\n');
            return (
                <ul key={i} className="list-disc pl-6 space-y-2 mb-4">
                    {items.map((item, j) => {
                        let textContent = item.trim().substring(2);
                        return <li key={j}>{parseInline(textContent)}</li>;
                    })}
                </ul>
            );
        }
        
        return (
            <p key={i} className="mb-4">
                {parseInline(trimmedBlock)}
            </p>
        );
    });
};

const LegalPage: React.FC<{ title: string }> = ({ title }) => {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            let key = '';
            if (title === 'Privacy Policy') key = 'legal_privacy_policy';
            else if (title === 'Terms of Service') key = 'legal_terms_of_service';
            else if (title === 'Refund Policy') key = 'legal_refund_policy';
            else if (title === 'Cancellation Policy') key = 'legal_cancellation_policy';
            else if (title === 'Contact') key = 'legal_contact';
            
            if (key) {
                const data = await getSystemSetting(key);
                if (data) setContent(data);
            }
            setLoading(false);
        };
        fetchContent();
    }, [title]);

    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-20 pb-40 min-h-[70vh]">
            <div className="max-w-3xl mx-auto bg-white border-2 border-brand-charcoal p-10 shadow-[8px_8px_0px_0px_#1A1A1A]">
                <h1 className="text-4xl font-black uppercase text-brand-charcoal mb-6 border-b-2 border-brand-charcoal pb-4">{title}</h1>
                <div className="font-mono text-sm text-gray-600 leading-relaxed space-y-6">
                    {loading ? (
                       <p className="animate-pulse">Loading {title}...</p>
                    ) : content ? (
                       <div className="space-y-4">{parseContent(content)}</div>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LegalPage;
