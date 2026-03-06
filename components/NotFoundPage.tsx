import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#F9F9F9] px-4 text-center">
            <div className="font-black text-6xl text-brand-red mb-4 font-mono">404</div>
            <h1 className="text-4xl font-black uppercase text-brand-charcoal mb-4">PAGE NOT FOUND</h1>
            <p className="font-mono text-sm text-gray-500 mb-8 max-w-md">
                The fighting ring you are looking for has been relocated or doesn't exist.
            </p>
            <Link to="/" className="bg-brand-charcoal text-white font-mono text-sm font-bold uppercase px-8 py-4 hover:bg-brand-blue transition-colors">
                Return to Camp
            </Link>
        </div>
    );
};

export default NotFoundPage;
