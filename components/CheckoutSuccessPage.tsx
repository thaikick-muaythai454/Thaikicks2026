import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Home, ShoppingBag, Download } from 'lucide-react';

// Shared Utilities
const Mono: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <span className={`font-mono text-xs tracking-widest uppercase ${className}`}>
        {children}
    </span>
);

interface OrderItem {
    productName: string;
    quantity: number;
    priceAtPurchase: number;
}

interface ReceiptData {
    id: string;
    date: string;
    items: OrderItem[];
    totalAmount: number;
    customerEmail: string;
}

// Receipt Component
const Receipt: React.FC<{ order: ReceiptData; isVisible: boolean }> = ({ order, isVisible }) => {
    return (
        <div className="relative w-full max-w-sm mx-auto perspective-1000">
            {/* The "Machine Slot" visual - A dark bar the receipt comes out of */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-brand-charcoal z-20 rounded-t-sm shadow-md"></div>
            <div className="absolute -top-2 left-2 right-2 h-2 bg-gray-800 z-10 rounded-t-sm"></div>

            {/* The Receipt Paper */}
            <div
                className={`
          relative z-0 bg-white shadow-xl transform transition-all duration-[2500ms] ease-out origin-top
          ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
        `}
                style={{
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                }}
            >
                {/* Receipt Header */}
                <div className="p-8 pb-4 text-center border-b-2 border-dashed border-gray-200 pt-10">
                    <div className="mb-2 flex justify-center">
                        <img src="/logo.png" alt="Thaikick" className="h-8 w-auto object-contain" />
                    </div>
                    <Mono className="text-gray-400 block mb-1">TERMINAL 01</Mono>
                    <Mono className="text-gray-400 block">{order.date}</Mono>
                </div>

                {/* Receipt Body */}
                <div className="p-8 space-y-4">

                    <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                        <span className="font-mono text-xs font-bold text-gray-500">ORDER ID</span>
                        <span className="font-mono text-sm font-bold text-brand-charcoal">#{order.id.slice(0, 8)}</span>
                    </div>

                    <div className="py-2 space-y-3">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-sm">
                                <div className="flex gap-2">
                                    <span className="font-mono text-gray-400">{item.quantity}x</span>
                                    <span className="uppercase font-bold text-brand-charcoal text-xs leading-5 max-w-[160px]">{item.productName}</span>
                                </div>
                                <span className="font-mono text-brand-charcoal">฿{(item.priceAtPurchase * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t-2 border-dashed border-gray-200 pt-4 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="font-mono text-gray-500">SUBTOTAL</span>
                            <span className="font-mono">฿{order.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="font-mono text-gray-500">TAX (7%)</span>
                            <span className="font-mono">INCL</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="font-black uppercase text-brand-charcoal">TOTAL PAID</span>
                            <span className="font-black text-xl text-brand-charcoal">฿{order.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Receipt Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <div className="flex justify-center items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <Mono className="text-green-700 font-bold">TRANSACTION APPROVED</Mono>
                    </div>
                    <div className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                        ORDER CONFIRMED • {new Date().toLocaleTimeString()}
                    </div>
                    <div className="mt-4 mb-2">
                        {/* Fake Barcode */}
                        <div className="h-8 w-3/4 mx-auto bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAABCAYAAAD5PA/NAAAAFklEQVR42mN88f/rf0VFRQZ84P///wMAnisQ0p5uXy4AAAAASUVORK5CYII=')] bg-repeat-x opacity-60"></div>
                    </div>
                    <Mono className="text-[10px] text-gray-300">THANK YOU FOR YOUR SUPPORT</Mono>
                </div>
            </div>
        </div>
    );
};

// Page Component
const CheckoutSuccessPage: React.FC = () => {
    const navigate = useNavigate();
    const [startAnimation, setStartAnimation] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [orderData, setOrderData] = useState<ReceiptData | null>(null);

    useEffect(() => {
        // Get order data from localStorage (saved during checkout)
        const savedOrder = localStorage.getItem('thaikick_last_order');
        if (savedOrder) {
            try {
                const order = JSON.parse(savedOrder);
                setOrderData(order);
            } catch (e) {
                console.error('Failed to parse order data', e);
            }
        }

        // 1. Start the printing animation shortly after mount
        const t1 = setTimeout(() => {
            setStartAnimation(true);
        }, 100);

        // 2. Reveal controls after the "printing" duration (2.5s)
        const t2 = setTimeout(() => {
            setShowControls(true);
        }, 2600);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, []);

    if (!orderData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-brand-charcoal text-white">
                <Mono>NO ORDER FOUND</Mono>
                <button onClick={() => navigate('/shop')} className="mt-4 underline">Return to Shop</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-charcoal relative overflow-hidden flex flex-col items-center pt-20 pb-20 px-4">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-lg flex flex-col items-center">

                {/* Status Indicator (Appears with receipt) */}
                <div className={`mb-8 text-center transition-all duration-1000 delay-500 ${startAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500 text-brand-charcoal mb-4 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                        <Check className="w-8 h-8" strokeWidth={3} />
                    </div>
                    <h1 className="text-white font-black uppercase text-2xl tracking-wide">Payment Successful</h1>
                    <Mono className="text-gray-400 mt-2">Confirmation email sent to {orderData.customerEmail}</Mono>
                </div>

                {/* The Receipt Animation Container */}
                <div className="w-full relative mb-12">
                    <Receipt order={orderData} isVisible={startAnimation} />
                </div>

                {/* Action Buttons (Fade in after print) */}
                <div className={`w-full grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-700 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-brand-bone text-brand-charcoal font-black uppercase py-4 flex items-center justify-center gap-2 hover:bg-white hover:scale-[1.02] transition-all shadow-lg"
                    >
                        <ShoppingBag className="w-4 h-4" /> View Dashboard
                    </button>
                    <button
                        onClick={() => navigate('/shop')}
                        className="border-2 border-brand-bone text-brand-bone font-mono text-xs font-bold uppercase py-4 flex items-center justify-center gap-2 hover:bg-brand-bone/10 transition-colors"
                    >
                        <Home className="w-4 h-4" /> Continue Shopping
                    </button>
                </div>

                {/* Footer Link */}
                <div className={`mt-8 transition-all duration-700 delay-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                    <button className="text-gray-500 hover:text-white font-mono text-[10px] uppercase flex items-center gap-2 transition-colors">
                        <Download className="w-3 h-3" /> Download PDF Receipt
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CheckoutSuccessPage;
