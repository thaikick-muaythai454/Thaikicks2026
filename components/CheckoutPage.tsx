import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, CreditCard } from 'lucide-react';
import { CartItem } from '../lib/types';
import { createShopOrder } from '../services/shopService';
import { User } from '../lib/types';
import { supabase } from '../lib/supabaseClient';

interface CheckoutPageProps {
    user: User | null;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ user }) => {
    const navigate = useNavigate();
    const [cart, setCart] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem('thaikick_cart');
        return saved ? JSON.parse(saved) : [];
    });

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        address: '',
        paymentMethod: 'promptpay'
    });

    const [isProcessing, setIsProcessing] = useState(false);

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            alert('Please login to complete your order');
            return;
        }

        if (cart.length === 0) {
            alert('Your cart is empty');
            return;
        }

        setIsProcessing(true);

        try {
            const orderData = {
                userId: user.id,
                totalAmount: cartTotal,
                shippingAddress: formData.address,
                contactDetails: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone
                }),
                paymentMethod: formData.paymentMethod,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    priceAtPurchase: item.price
                }))
            };

            const createdOrder = await createShopOrder(orderData);

            // Save order data for receipt display (temporary)
            const receiptData = {
                id: createdOrder?.id || `ORDER_${Date.now()}`,
                date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                items: cart.map(item => ({
                    productName: item.name,
                    quantity: item.quantity,
                    priceAtPurchase: item.price
                })),
                totalAmount: cartTotal,
                customerEmail: formData.email
            };
            localStorage.setItem('thaikick_last_order', JSON.stringify(receiptData));

            // Call Stripe Checkout Edge Function
            const { data: { sessionUrl }, error: stripeError } = await supabase.functions.invoke('stripe-checkout', {
                body: {
                    orderId: createdOrder.id,
                    successUrl: `${window.location.origin}/#/checkout-success`,
                    cancelUrl: `${window.location.origin}/#/checkout`
                }
            });

            if (stripeError) throw stripeError;

            // Clear cart
            localStorage.removeItem('thaikick_cart');
            setCart([]);

            // Redirect to Stripe Checkout
            if (sessionUrl) {
                window.location.href = sessionUrl;
            } else {
                navigate('/checkout-success');
            }
        } catch (error) {
            console.error('Order failed:', error);
            alert('Failed to create order or initialize payment. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-brand-bone flex items-center justify-center">
                <div className="text-center">
                    <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-2xl font-black uppercase mb-2">Cart is Empty</h2>
                    <p className="font-mono text-sm text-gray-500 mb-6">Add some products to checkout</p>
                    <button
                        onClick={() => navigate('/shop')}
                        className="bg-brand-charcoal text-white px-6 py-3 font-black uppercase hover:bg-brand-blue transition-colors"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-bone">
            {/* Header */}
            <div className="bg-brand-charcoal border-b-4 border-brand-red">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-8">
                    <button
                        onClick={() => navigate('/shop')}
                        className="text-white hover:text-brand-blue transition-colors flex items-center gap-2 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-mono text-xs uppercase">Back to Shop</span>
                    </button>
                    <h1 className="text-4xl font-black uppercase text-white">Checkout</h1>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 sm:px-10 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Checkout Form */}
                    <div className="lg:col-span-2 animate-reveal">
                        <form onSubmit={handleSubmit} className="bg-white border-2 border-brand-charcoal p-6 space-y-6 shadow-[8px_8px_0px_0px_#1A1A1A]">
                            <div className="border-b-2 border-brand-charcoal pb-4">
                                <h2 className="text-2xl font-black uppercase">Shipping Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-mono text-xs uppercase font-bold mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-brand-blue outline-none"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block font-mono text-xs uppercase font-bold mb-2">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-brand-blue outline-none"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-mono text-xs uppercase font-bold mb-2">Phone Number *</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-brand-blue outline-none"
                                    placeholder="08X-XXX-XXXX"
                                />
                            </div>

                            <div>
                                <label className="block font-mono text-xs uppercase font-bold mb-2">Shipping Address *</label>
                                <textarea
                                    required
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full border-2 border-gray-300 p-3 font-mono text-sm focus:border-brand-blue outline-none h-24"
                                    placeholder="123 Street Name, City, Province, Postal Code"
                                />
                            </div>

                            <div className="border-t-2 border-brand-charcoal pt-6">
                                <h3 className="text-xl font-black uppercase mb-4">Payment Method</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-4 border-2 border-gray-300 cursor-pointer hover:border-brand-blue transition-colors">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="promptpay"
                                            checked={formData.paymentMethod === 'promptpay'}
                                            onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                                            className="w-4 h-4"
                                        />
                                        <div className="flex-1">
                                            <div className="font-bold text-sm uppercase">PromptPay</div>
                                            <div className="font-mono text-xs text-gray-500">Scan QR Code to pay</div>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 border-2 border-gray-300 cursor-pointer hover:border-brand-blue transition-colors">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="bank_transfer"
                                            checked={formData.paymentMethod === 'bank_transfer'}
                                            onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                                            className="w-4 h-4"
                                        />
                                        <div className="flex-1">
                                            <div className="font-bold text-sm uppercase">Bank Transfer</div>
                                            <div className="font-mono text-xs text-gray-500">Transfer to our bank account</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="w-full bg-brand-charcoal text-white py-4 font-black uppercase hover:bg-brand-blue transition-colors shadow-[4px_4px_0px_0px_#AE3A17] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <CreditCard className="w-5 h-5" />
                                {isProcessing ? 'Processing...' : 'Place Order'}
                            </button>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1 animate-reveal" style={{ animationDelay: '0.1s' }}>
                        <div className="bg-white border-2 border-brand-charcoal p-6 sticky top-[120px] shadow-[8px_8px_0px_0px_#1A1A1A]">
                            <h2 className="text-xl font-black uppercase mb-4 border-b-2 border-brand-charcoal pb-3">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                {cart.map(item => (
                                    <div key={item.id} className="flex gap-3 text-sm">
                                        {item.imageUrl && (
                                            <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover border border-gray-200" />
                                        )}
                                        <div className="flex-1">
                                            <div className="font-bold uppercase text-xs">{item.name}</div>
                                            <div className="font-mono text-xs text-gray-500">
                                                ฿{item.price.toLocaleString()} × {item.quantity}
                                            </div>
                                        </div>
                                        <div className="font-bold">
                                            ฿{(item.price * item.quantity).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t-2 border-brand-charcoal pt-4 space-y-2">
                                <div className="flex justify-between font-mono text-sm">
                                    <span>Subtotal</span>
                                    <span>฿{cartTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-mono text-sm">
                                    <span>Shipping</span>
                                    <span className="text-green-600">FREE</span>
                                </div>
                                <div className="flex justify-between text-xl font-black border-t-2 border-brand-charcoal pt-3 mt-3">
                                    <span>TOTAL</span>
                                    <span>฿{cartTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
