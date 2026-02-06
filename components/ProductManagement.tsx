import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Edit, Trash2 } from 'lucide-react';
import { Product } from '../lib/types';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/shopService';

const ProductManagement: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        const data = await getProducts();
        setProducts(data);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        try {
            if (editingProduct.id) {
                await updateProduct(editingProduct.id, editingProduct);
            } else {
                await createProduct(editingProduct as Omit<Product, 'id' | 'createdAt'>);
            }
            await loadProducts();
            setIsFormOpen(false);
            setEditingProduct(null);
        } catch (err) {
            console.error(err);
            alert("Failed to save product");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this product?")) return;
        try {
            await deleteProduct(id);
            await loadProducts();
        } catch (err) {
            console.error(err);
            alert("Failed to delete product");
        }
    };

    return (
        <div className="border-2 border-brand-charcoal bg-white">
            <div className="p-4 border-b-2 border-brand-charcoal bg-brand-bone flex justify-between items-center">
                <h3 className="font-black uppercase tracking-wide text-sm flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Product Catalog
                </h3>
                <button
                    onClick={() => { setEditingProduct({ stockStatus: 'in_stock', isFeatured: false }); setIsFormOpen(true); }}
                    className="bg-brand-charcoal text-white px-3 py-1 font-mono text-xs font-bold uppercase flex items-center gap-2 hover:bg-brand-blue"
                >
                    <Plus className="w-3 h-3" /> New Product
                </button>
            </div>

            {isFormOpen && (
                <div className="p-6 bg-brand-bone border-b-2 border-brand-charcoal animate-reveal">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="flex justify-between items-center mb-2 border-b border-gray-300 pb-2">
                            <h4 className="font-black uppercase text-sm">Product Details</h4>
                            <button type="button" onClick={() => setIsFormOpen(false)} className="text-xs font-mono underline hover:text-brand-red">Close</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold mb-1">Product Name</label>
                                <input className="w-full border p-2 font-mono text-xs" value={editingProduct?.name || ''} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} placeholder="e.g. Boxing Gloves" required />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold mb-1">Category</label>
                                <input className="w-full border p-2 font-mono text-xs" value={editingProduct?.category || ''} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} placeholder="e.g. Equipment" required />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold mb-1">Price (THB)</label>
                                <input type="number" className="w-full border p-2 font-mono text-xs" value={editingProduct?.price || ''} onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} required />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold mb-1">Stock Status</label>
                                <select className="w-full border p-2 font-mono text-xs" value={editingProduct?.stockStatus || 'in_stock'} onChange={e => setEditingProduct({ ...editingProduct, stockStatus: e.target.value as any })}>
                                    <option value="in_stock">In Stock</option>
                                    <option value="low_stock">Low Stock</option>
                                    <option value="out_of_stock">Out of Stock</option>
                                    <option value="pre_order">Pre-Order</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase font-bold mb-1">Description</label>
                            <textarea className="w-full border p-2 font-mono text-xs h-20" value={editingProduct?.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} placeholder="Product description..." />
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase font-bold mb-1">Image URL</label>
                            <input className="w-full border p-2 font-mono text-xs" value={editingProduct?.imageUrl || ''} onChange={e => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })} placeholder="https://..." />
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="featured" checked={editingProduct?.isFeatured || false} onChange={e => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })} />
                            <label htmlFor="featured" className="text-xs font-mono font-bold uppercase">Featured Product</label>
                        </div>

                        <div className="flex justify-end pt-4 gap-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 font-mono text-xs font-bold uppercase hover:bg-gray-200">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-brand-charcoal text-white font-mono text-xs font-bold uppercase hover:bg-green-600 shadow-[4px_4px_0px_0px_#1A1A1A]">Save Product</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
                {products.length === 0 ? (
                    <div className="p-8 text-center font-mono text-xs text-gray-400">No products yet</div>
                ) : (
                    products.map(product => (
                        <div key={product.id} className="p-4 bg-white hover:bg-gray-50 flex items-center gap-4">
                            {product.imageUrl && (
                                <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover border border-gray-200" />
                            )}
                            <div className="flex-1">
                                <div className="font-bold text-sm uppercase text-brand-charcoal">{product.name}</div>
                                <div className="font-mono text-xs text-gray-500">{product.category} • ฿{product.price.toLocaleString()}</div>
                                <div className="flex gap-2 mt-1">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${product.stockStatus === 'in_stock' ? 'bg-green-100 text-green-700' :
                                            product.stockStatus === 'low_stock' ? 'bg-yellow-100 text-yellow-700' :
                                                product.stockStatus === 'out_of_stock' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                        }`}>
                                        {product.stockStatus.replace('_', ' ')}
                                    </span>
                                    {product.isFeatured && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-purple-100 text-purple-700">Featured</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingProduct(product); setIsFormOpen(true); }} className="text-brand-blue hover:text-brand-charcoal">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProductManagement;
