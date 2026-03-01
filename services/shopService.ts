import { supabase } from '../lib/supabaseClient';
import { Product, ShopOrder, ShopOrderItem } from '../lib/types';

// --- Product Services ---

export const getProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        imageUrl: p.image_url,
        stockStatus: p.stock_status,
        isFeatured: p.is_featured,
        createdAt: p.created_at
    }));
};

export const createProduct = async (product: Omit<Product, 'id' | 'createdAt'>) => {
    const dbProduct = {
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image_url: product.imageUrl,
        stock_status: product.stockStatus,
        is_featured: product.isFeatured
    };

    const { data, error } = await supabase
        .from('products')
        .insert(dbProduct)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateProduct = async (id: string, product: Partial<Product>) => {
    const dbProduct: any = {};
    if (product.name) dbProduct.name = product.name;
    if (product.description) dbProduct.description = product.description;
    if (product.price !== undefined) dbProduct.price = product.price;
    if (product.category) dbProduct.category = product.category;
    if (product.imageUrl !== undefined) dbProduct.image_url = product.imageUrl;
    if (product.stockStatus) dbProduct.stock_status = product.stockStatus;
    if (product.isFeatured !== undefined) dbProduct.is_featured = product.isFeatured;

    const { data, error } = await supabase
        .from('products')
        .update(dbProduct)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteProduct = async (id: string) => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        // 23503 is PostgreSQL code for foreign key constraint violation
        if (error.code === '23503') {
            const { error: softDeleteError } = await supabase
                .from('products')
                .update({ is_active: false })
                .eq('id', id);

            if (softDeleteError) throw softDeleteError;
        } else {
            throw error;
        }
    }
};

// --- Shop Order Services ---

export const getShopOrders = async (): Promise<ShopOrder[]> => {
    const { data, error } = await supabase
        .from('shop_orders')
        .select(`
            *,
            items:shop_order_items(*)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching shop orders:', error);
        return [];
    }

    return data.map((o: any) => ({
        id: o.id,
        userId: o.user_id,
        totalAmount: o.total_amount,
        status: o.status,
        shippingAddress: o.shipping_address,
        contactDetails: o.contact_details,
        paymentMethod: o.payment_method,
        stripeSessionId: o.stripe_session_id,
        stripePaymentIntentId: o.stripe_payment_intent_id,
        paymentStatus: o.payment_status,
        paymentVerifiedAt: o.payment_verified_at,
        adminNotes: o.admin_notes,
        createdAt: o.created_at,
        items: o.items?.map((item: any) => ({
            id: item.id,
            orderId: item.order_id,
            productId: item.product_id,
            quantity: item.quantity,
            priceAtPurchase: item.price_at_purchase
        }))
    }));
};

export const getUserShopOrders = async (userId: string): Promise<ShopOrder[]> => {
    const { data, error } = await supabase
        .from('shop_orders')
        .select(`
            *,
            items:shop_order_items(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user shop orders:', error);
        return [];
    }

    return data.map((o: any) => ({
        id: o.id,
        userId: o.user_id,
        totalAmount: o.total_amount,
        status: o.status,
        shippingAddress: o.shipping_address,
        contactDetails: o.contact_details,
        paymentMethod: o.payment_method,
        stripeSessionId: o.stripe_session_id,
        stripePaymentIntentId: o.stripe_payment_intent_id,
        paymentStatus: o.payment_status,
        paymentVerifiedAt: o.payment_verified_at,
        adminNotes: o.admin_notes,
        createdAt: o.created_at,
        items: o.items?.map((item: any) => ({
            id: item.id,
            orderId: item.order_id,
            productId: item.product_id,
            quantity: item.quantity,
            priceAtPurchase: item.price_at_purchase
        }))
    }));
};

export const createShopOrder = async (order: {
    userId: string;
    totalAmount: number;
    shippingAddress?: string;
    contactDetails?: string;
    paymentMethod?: string;
    items: { productId: string; quantity: number; priceAtPurchase: number }[];
}) => {
    // Create order
    const { data: orderData, error: orderError } = await supabase
        .from('shop_orders')
        .insert({
            user_id: order.userId,
            total_amount: order.totalAmount,
            shipping_address: order.shippingAddress,
            contact_details: order.contactDetails,
            payment_method: order.paymentMethod,
            status: 'pending'
        })
        .select()
        .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = order.items.map(item => ({
        order_id: orderData.id,
        product_id: item.productId,
        quantity: item.quantity,
        price_at_purchase: item.priceAtPurchase
    }));

    const { error: itemsError } = await supabase
        .from('shop_order_items')
        .insert(orderItems);

    if (itemsError) throw itemsError;

    return orderData;
};

export const updateShopOrderStatus = async (id: string, status: ShopOrder['status']) => {
    const { error } = await supabase
        .from('shop_orders')
        .update({ status })
        .eq('id', id);

    if (error) throw error;
};

// Export alias for consistency
export const getShopOrdersByUser = getUserShopOrders;
