import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Minus, Plus, AlertCircle } from 'lucide-react';
import { Product, CartItem, User } from '../lib/types';
import { getProductById } from '../services/shopService';

interface ProductDetailsPageProps {
    user?: User | null;
}

const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({ user }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    
    useEffect(() => {
        if (id) {
            loadProduct(id);
        }
    }, [id]);
    
    const loadProduct = async (productId: string) => {
        setLoading(true);
        try {
            const data = await getProductById(productId);
            setProduct(data);
            if (data?.sizes && data.sizes.length > 0) {
                setSelectedSize(data.sizes[0]);
            }
            if (data?.colors && data.colors.length > 0) {
                setSelectedColor(data.colors[0]);
            }
        } catch (error) {
            console.error('Failed to load product', error);
        } finally {
            setLoading(false);
        }
    };
    
    const incrementQuantity = () => {
        if (product?.stockQuantity && quantity >= product.stockQuantity) return;
        setQuantity(prev => prev + 1);
    };
    
    const decrementQuantity = () => {
        setQuantity(prev => Math.max(1, prev - 1));
    };

    const handleAddToCart = () => {
        if (!product) return;
        
        // Validation
        if (product.sizes && product.sizes.length > 0 && !selectedSize) {
            alert('Please select a size');
            return;
        }
        if (product.colors && product.colors.length > 0 && !selectedColor) {
            alert('Please select a color');
            return;
        }

        const saved = localStorage.getItem('thaikick_cart');
        let cart: CartItem[] = [];
        if (saved) {
            try { cart = JSON.parse(saved); } catch(e) {}
        }
        
        // Check if same item with same option exists
        const existingIndex = cart.findIndex(item => 
            item.id === product.id && 
            item.selectedSize === selectedSize && 
            item.selectedColor === selectedColor
        );

        if (existingIndex >= 0) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push({
                ...product,
                quantity,
                selectedSize,
                selectedColor
            });
        }
        
        localStorage.setItem('thaikick_cart', JSON.stringify(cart));
        
        // Navigate to shop and trigger cart to open
        navigate('/shop', { state: { openCart: true } });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-bone flex items-center justify-center">
                <div className="font-mono text-sm tracking-widest uppercase animate-pulse">Loading Product...</div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-brand-bone flex flex-col items-center justify-center p-4 text-center">
                <AlertCircle className="w-16 h-16 text-brand-red mb-4" />
                <h2 className="text-2xl font-black uppercase mb-2">Product Not Found</h2>
                <button onClick={() => navigate('/shop')} className="text-brand-blue font-mono text-sm underline uppercase">Return to Shop</button>
            </div>
        );
    }

    const isOutOfStock = product.stockStatus === 'out_of_stock' || (product.stockQuantity !== undefined && product.stockQuantity <= 0);

    return (
        <div className="min-h-screen bg-brand-bone pb-20">
            {/* Nav Header small */}
            <div className="bg-white border-b-2 border-brand-charcoal p-4 sticky top-[100px] z-30">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-10 flex items-center">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-mono text-xs uppercase font-bold hover:text-brand-blue transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Shop
                    </button>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                    
                    {/* Left Column: Image & Desc */}
                    <div className="space-y-8">
                        <div className="bg-white border-2 border-brand-charcoal overflow-hidden aspect-square flex items-center justify-center w-full shadow-[8px_8px_0px_#1A1A1A]">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="font-mono text-gray-400">NO IMAGE</div>
                            )}
                        </div>
                        
                        <div className="hidden md:block">
                            <h2 className="text-2xl font-black uppercase mb-4 border-b-2 border-brand-charcoal pb-2">Description</h2>
                            <p className="font-mono text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {product.description}
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Pricing & Options */}
                    <div className="flex flex-col">
                        <div className="mb-2 flex items-center gap-3">
                            <span className="font-mono text-xs text-brand-blue font-bold uppercase tracking-widest">{product.category}</span>
                            {product.isFeatured && <span className="bg-brand-red text-white px-2 py-0.5 text-[10px] font-bold uppercase">Featured</span>}
                        </div>
                        
                        <h1 className="text-4xl lg:text-5xl font-black uppercase text-brand-charcoal mb-4 leading-tight">{product.name}</h1>
                        
                        <div className="text-3xl font-black mb-6">฿{product.price.toLocaleString()}</div>
                        
                        {/* Options */}
                        <div className="space-y-6 mb-8 flex-1">
                            
                            {/* Sizes */}
                            {product.sizes && product.sizes.length > 0 && (
                                <div>
                                    <label className="block font-mono text-xs font-bold uppercase mb-3">Select Size</label>
                                    <div className="flex flex-wrap gap-3">
                                        {product.sizes.map(size => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`min-w-[3rem] px-4 py-3 border-2 font-mono text-sm font-bold uppercase transition-all ${
                                                    selectedSize === size 
                                                    ? 'border-brand-charcoal bg-brand-charcoal text-white shadow-[4px_4px_0px_#AE3A17]' 
                                                    : 'border-brand-charcoal bg-white text-brand-charcoal hover:bg-gray-100'
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Colors */}
                            {product.colors && product.colors.length > 0 && (
                                <div>
                                    <label className="block font-mono text-xs font-bold uppercase mb-3">Primary Color</label>
                                    <div className="flex flex-wrap gap-3">
                                        {product.colors.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setSelectedColor(color)}
                                                className={`px-5 py-3 border-2 font-mono text-sm font-bold uppercase transition-all ${
                                                    selectedColor === color 
                                                    ? 'border-brand-charcoal bg-brand-charcoal text-white shadow-[4px_4px_0px_#AE3A17]' 
                                                    : 'border-brand-charcoal bg-white text-brand-charcoal hover:bg-gray-100'
                                                }`}
                                            >
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div>
                                <label className="block font-mono text-xs font-bold uppercase mb-3">Quantity</label>
                                <div className="flex items-center">
                                    <div className="flex items-center border-2 border-brand-charcoal bg-white">
                                        <button onClick={decrementQuantity} className="p-3 hover:bg-gray-100 disabled:opacity-50" disabled={quantity <= 1}>
                                            <Minus className="w-5 h-5" />
                                        </button>
                                        <div className="w-16 text-center font-mono text-lg font-bold border-l-2 border-r-2 border-brand-charcoal py-2">
                                            {quantity}
                                        </div>
                                        <button onClick={incrementQuantity} className="p-3 hover:bg-gray-100 disabled:opacity-50" disabled={!!(product.stockQuantity && quantity >= product.stockQuantity)}>
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {product.stockQuantity !== undefined && product.stockQuantity > 0 && (
                                        <span className="ml-4 font-mono text-xs text-gray-500 uppercase">{product.stockQuantity} available</span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Stock Status Indicator */}
                            <div className={`inline-block px-3 py-1 font-mono text-xs font-bold uppercase border-l-4 ${
                                isOutOfStock ? 'bg-red-50 text-brand-red border-brand-red' : 
                                product.stockStatus === 'low_stock' ? 'bg-yellow-50 text-yellow-700 border-yellow-500' :
                                'bg-green-50 text-green-700 border-green-500'
                            }`}>
                                {isOutOfStock ? 'Out of Stock' : product.stockStatus.replace('_', ' ')}
                            </div>
                        </div>
                        
                        {/* Mobile Description */}
                        <div className="md:hidden mb-8 border-t-2 border-dashed border-gray-300 pt-6">
                            <h2 className="text-xl font-black uppercase mb-4">Description</h2>
                            <p className="font-mono text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {product.description}
                            </p>
                        </div>
                        
                        {/* Add to Cart Actions */}
                        <div className="pt-6 border-t-2 border-brand-charcoal">
                            <button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                                className="w-full flex items-center justify-center gap-3 bg-brand-red text-white py-5 font-black uppercase text-xl hover:bg-brand-charcoal transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-[6px_6px_0px_#1A1A1A]"
                            >
                                <ShoppingCart className="w-6 h-6" /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsPage;
