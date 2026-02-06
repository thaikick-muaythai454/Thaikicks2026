import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { Product, CartItem } from '../lib/types';
import { getProducts } from '../services/shopService';

const ShopPage: React.FC = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        loadProducts();
        loadCartFromStorage();
    }, []);

    useEffect(() => {
        // Save cart to localStorage whenever it changes
        localStorage.setItem('thaikick_cart', JSON.stringify(cart));
    }, [cart]);

    const loadProducts = async () => {
        const data = await getProducts();
        setProducts(data.filter(p => p.stockStatus !== 'out_of_stock'));
    };

    const loadCartFromStorage = () => {
        const saved = localStorage.getItem('thaikick_cart');
        if (saved) {
            try {
                setCart(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load cart', e);
            }
        }
    };

    const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

    const filteredProducts = selectedCategory === 'all'
        ? products
        : products.filter(p => p.category === selectedCategory);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = Math.max(0, item.quantity + delta);
                return newQty === 0 ? null : { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean) as CartItem[]);
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="min-h-screen bg-brand-bone">
            {/* Header */}
            <div className="bg-brand-charcoal border-b-4 border-brand-red">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-12">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-mono text-xs text-brand-blue uppercase tracking-widest">E-Commerce</div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase text-white mt-2">
                                Shop
                            </h1>
                            <p className="font-mono text-sm text-gray-400 mt-2">Premium Muay Thai Gear & Equipment</p>
                        </div>
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative bg-brand-red text-white p-4 hover:bg-brand-blue transition-colors"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-white text-brand-charcoal w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white border-b-2 border-brand-charcoal sticky top-[100px] z-30">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-4">
                    <div className="flex gap-2 overflow-x-auto">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 font-mono text-xs uppercase whitespace-nowrap transition-all ${selectedCategory === cat
                                    ? 'bg-brand-charcoal text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-12">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20">
                        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="font-mono text-sm text-gray-400">No products available</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product, index) => (
                            <div
                                key={product.id}
                                className="bg-white border-2 border-brand-charcoal group hover:shadow-[8px_8px_0px_0px_#1A1A1A] transition-all animate-reveal"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {product.imageUrl && (
                                    <div className="aspect-square overflow-hidden border-b-2 border-brand-charcoal">
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                    </div>
                                )}
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-black uppercase text-sm text-brand-charcoal">{product.name}</h3>
                                        {product.isFeatured && (
                                            <span className="bg-brand-red text-white px-2 py-0.5 text-[10px] font-bold uppercase">Hot</span>
                                        )}
                                    </div>
                                    <p className="font-mono text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-black text-brand-charcoal">฿{product.price.toLocaleString()}</div>
                                            <div className={`font-mono text-[10px] uppercase mt-1 ${product.stockStatus === 'in_stock' ? 'text-green-600' :
                                                product.stockStatus === 'low_stock' ? 'text-yellow-600' :
                                                    'text-blue-600'
                                                }`}>
                                                {product.stockStatus.replace('_', ' ')}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="bg-brand-charcoal text-white p-3 hover:bg-brand-blue transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Cart Sidebar */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsCartOpen(false)} />
                    <div className="relative w-full max-w-md bg-white border-l-4 border-brand-red flex flex-col animate-reveal">
                        {/* Cart Header */}
                        <div className="p-6 border-b-2 border-brand-charcoal bg-brand-bone flex items-center justify-between">
                            <h2 className="text-2xl font-black uppercase">Cart ({cartCount})</h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {cart.length === 0 ? (
                                <div className="text-center py-12">
                                    <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    <p className="font-mono text-sm text-gray-400">Your cart is empty</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex gap-4 border-b border-gray-200 pb-4">
                                        {item.imageUrl && (
                                            <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover border border-gray-200" />
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-bold text-sm uppercase">{item.name}</h3>
                                            <p className="font-mono text-xs text-gray-500">฿{item.price.toLocaleString()}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="w-6 h-6 border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="font-mono text-sm font-bold w-8 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="w-6 h-6 border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="ml-auto text-red-500 hover:text-red-700 text-xs font-mono uppercase"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Cart Footer */}
                        {cart.length > 0 && (
                            <div className="p-6 border-t-2 border-brand-charcoal bg-brand-bone">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-mono text-sm uppercase">Total</span>
                                    <span className="text-2xl font-black">฿{cartTotal.toLocaleString()}</span>
                                </div>
                                <button
                                    onClick={() => navigate('/checkout')}
                                    className="w-full bg-brand-charcoal text-white py-4 font-black uppercase hover:bg-brand-blue transition-colors shadow-[4px_4px_0px_0px_#AE3A17]"
                                >
                                    Checkout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopPage;
