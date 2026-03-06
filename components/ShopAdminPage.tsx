import React, { useState, useEffect } from 'react';
import { ShoppingBag, Package, ArrowLeft, CheckCircle, Truck, X } from 'lucide-react';
import ProductManagement from './ProductManagement';
import { ShopOrder } from '../lib/types';
import { getShopOrders, updateShopOrderStatus } from '../services/shopService';

const ShopAdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
    const [orders, setOrders] = useState<ShopOrder[]>([]);

    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        if (activeTab === 'orders') {
            loadOrders();
        }
    }, [activeTab]);

    const loadOrders = async () => {
        const data = await getShopOrders();
        setOrders(data);
    };

    const handleStatusUpdate = async (orderId: string, status: ShopOrder['status']) => {
        try {
            await updateShopOrderStatus(orderId, status);
            await loadOrders();
        } catch (error) {
            console.error('Failed to update order status', error);
            alert('Failed to update order status');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'paid': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'shipped': return 'bg-purple-100 text-purple-700 border-purple-300';
            case 'delivered': return 'bg-green-100 text-green-700 border-green-300';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-300';
            default: return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    return (
        <div className="min-h-screen bg-brand-bone">
            {/* Header */}
            <div className="bg-brand-charcoal border-b-4 border-brand-red">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <a
                                href="#/admin"
                                className="text-white hover:text-brand-blue transition-colors"
                                title="Back to Admin Dashboard"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </a>
                            <div>
                                <div className="font-mono text-xs text-brand-blue uppercase tracking-widest">Admin Panel</div>
                                <h1 className="text-3xl md:text-4xl font-black uppercase text-white mt-1">
                                    Shop Management
                                </h1>
                            </div>
                        </div>
                        <ShoppingBag className="w-12 h-12 text-brand-red" />
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b-2 border-brand-charcoal">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-10 flex border-l-2 border-r-2 border-brand-charcoal">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-6 py-4 font-black uppercase text-sm border-r-2 border-brand-charcoal transition-all ${activeTab === 'products'
                            ? 'bg-brand-red text-white'
                            : 'bg-brand-bone text-brand-charcoal hover:bg-gray-200'
                            }`}
                    >
                        <Package className="w-4 h-4 inline-block mr-2" />
                        Products
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-6 py-4 font-black uppercase text-sm border-r-2 border-brand-charcoal transition-all ${activeTab === 'orders'
                            ? 'bg-brand-red text-white'
                            : 'bg-brand-bone text-brand-charcoal hover:bg-gray-200'
                            }`}
                    >
                        <ShoppingBag className="w-4 h-4 inline-block mr-2" />
                        Orders
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-12">
                {activeTab === 'products' && (
                    <div className="animate-reveal">
                        <ProductManagement />
                    </div>
                )}

                {activeTab === 'orders' && (() => {
                    const filteredOrders = orders.filter(order => {
                        const matchStatus = filterStatus === 'all' || order.status === filterStatus;
                        const contactDetails = order.contactDetails ? JSON.parse(order.contactDetails) : {};
                        const searchString = `${order.id} ${contactDetails.name || ''} ${contactDetails.email || ''}`.toLowerCase();
                        const matchSearch = searchString.includes(searchQuery.toLowerCase());
                        return matchStatus && matchSearch;
                    });

                    return (
                        <div className="animate-reveal">
                            <div className="border-2 border-brand-charcoal bg-white">
                                <div className="p-4 border-b-2 border-brand-charcoal bg-brand-bone flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <h3 className="font-black uppercase tracking-wide text-sm flex items-center gap-2">
                                        <ShoppingBag className="w-4 h-4" />
                                        Shop Orders ({filteredOrders.length} / {orders.length})
                                    </h3>
                                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                        <input
                                            type="text"
                                            placeholder="SEARCH ID, NAME, EMAIL"
                                            className="border-2 border-brand-charcoal px-3 py-2 font-mono text-xs w-full sm:w-64 focus:outline-none focus:border-brand-charcoal focus:ring-1 focus:ring-brand-charcoal"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <select
                                            className="border-2 border-brand-charcoal px-3 py-2 font-mono text-xs focus:outline-none focus:border-brand-charcoal focus:ring-1 focus:ring-brand-charcoal uppercase bg-white cursor-pointer"
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                        >
                                            <option value="all">ALL STATUS</option>
                                            <option value="pending">PENDING</option>
                                            <option value="paid">PAID</option>
                                            <option value="shipped">SHIPPED</option>
                                            <option value="delivered">DELIVERED</option>
                                            <option value="cancelled">CANCELLED</option>
                                        </select>
                                    </div>
                                </div>
                                {filteredOrders.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                        <p className="font-mono text-sm text-gray-400">No orders yet</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-brand-charcoal">
                                        {filteredOrders.map(order => {
                                            const contactDetails = order.contactDetails ? JSON.parse(order.contactDetails) : {};
                                            return (
                                                <div key={order.id} className="p-6 hover:bg-gray-50">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <div className="font-mono text-xs text-gray-400">Order #{order.id.slice(0, 8)}</div>
                                                            <div className="font-bold text-sm mt-1">{contactDetails.name || 'N/A'}</div>
                                                            <div className="font-mono text-xs text-gray-500">{contactDetails.email}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xl font-black">฿{order.totalAmount.toLocaleString()}</div>
                                                            <div className="font-mono text-xs text-gray-400 mt-1">
                                                                {new Date(order.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {order.items && order.items.length > 0 && (
                                                        <div className="bg-gray-50 p-3 mb-3 space-y-2">
                                                            {order.items.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between font-mono text-xs">
                                                                    <span>{item.quantity}x Product</span>
                                                                    <span>฿{item.priceAtPurchase.toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {order.shippingAddress && (
                                                        <div className="mb-3">
                                                            <div className="font-mono text-xs font-bold text-gray-600 uppercase mb-1">Shipping Address</div>
                                                            <div className="font-mono text-xs text-gray-500">{order.shippingAddress}</div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 text-xs font-bold uppercase border ${getStatusColor(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => handleStatusUpdate(order.id, e.target.value as ShopOrder['status'])}
                                                            className="border border-gray-300 px-3 py-1 text-xs font-mono uppercase focus:outline-none focus:border-brand-blue"
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="paid">Paid</option>
                                                            <option value="shipped">Shipped</option>
                                                            <option value="delivered">Delivered</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

export default ShopAdminPage;
