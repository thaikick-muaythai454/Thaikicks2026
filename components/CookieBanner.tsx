import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CookieBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already consented
        const hasConsented = localStorage.getItem('tk_cookie_consent');
        if (!hasConsented) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('tk_cookie_consent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full bg-brand-charcoal border-t-4 border-brand-red z-50 p-4 md:p-6 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.1)] animate-reveal">
            <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-white">
                    <h3 className="font-black uppercase text-lg mb-1 flex items-center gap-2">
                        <span className="w-2 h-2 bg-brand-red inline-block"></span>
                        Website Cookies
                    </h3>
                    <p className="font-mono text-xs opacity-70 leading-relaxed max-w-2xl">
                        THAIKICKS uses cookies to ensure you get the best browsing experience, analyze site traffic, and personalize content. By continuing to use our site, you agree to our <Link to="/privacy-policy" className="underline hover:text-brand-red">Privacy Policy</Link> and cookie usage.
                    </p>
                </div>
                <div className="flex w-full md:w-auto gap-4 shrink-0">
                    <button
                        onClick={handleAccept}
                        className="w-full md:w-auto bg-brand-red text-white font-mono text-xs font-bold uppercase px-8 py-3 hover:bg-white hover:text-brand-charcoal transition-colors whitespace-nowrap"
                    >
                        Acknowledge
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieBanner;
