export const generateBookingEmailHTML = (params: {
    gymName: string;
    bookingDate: string;
    bookingType: string;
    bookingId: string;
    customerName: string;
    amount: number;
    currency: string;
}) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmed - ThaiKicks</title>
    <style>
        body { font-family: 'Courier New', Courier, monospace; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 40px; border: 2px solid #1a1a1a; box-shadow: 8px 8px 0px 0px #AE3A17; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px dashed #e5e7eb; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: 900; color: #1a1a1a; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
        .title { font-size: 14px; color: #22c55e; font-weight: bold; text-transform: uppercase; }
        .receipt-body { margin-bottom: 30px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px; }
        .label { color: #6b7280; font-weight: bold; }
        .value { color: #1a1a1a; font-weight: bold; text-transform: uppercase; }
        .total-row { border-top: 2px dashed #e5e7eb; padding-top: 15px; margin-top: 15px; align-items: center; }
        .total-label { font-size: 16px; font-weight: 900; color: #1a1a1a; text-transform: uppercase; }
        .total-value { font-size: 24px; font-weight: 900; color: #3471AE; }
        .footer { text-align: center; border-top: 2px solid #1a1a1a; padding-top: 20px; margin-top: 30px; }
        .footer p { font-size: 12px; color: #6b7280; margin: 5px 0; }
        .support { background-color: #3471AE; color: #ffffff; text-decoration: none; padding: 10px 20px; display: inline-block; font-weight: bold; text-transform: uppercase; margin-top: 15px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">THAIKICKS RECORD</div>
            <div class="title">✓ TRANSACTION APPROVED</div>
        </div>
        
        <div class="receipt-body">
            <p style="font-size: 14px; margin-bottom: 25px;">Hello ${params.customerName}, your booking is confirmed. Please show this receipt at the gym.</p>
            
            <div class="row">
                <span class="label">ORDER ID</span>
                <span class="value">#${params.bookingId.slice(0, 8)}</span>
            </div>
            
            <div class="row">
                <span class="label">GYM</span>
                <span class="value">${params.gymName}</span>
            </div>
            
            <div class="row">
                <span class="label">DATE/TIME</span>
                <span class="value">${params.bookingDate}</span>
            </div>
            
            <div class="row">
                <span class="label">TYPE</span>
                <span class="value">${params.bookingType}</span>
            </div>
            
            <div class="row total-row">
                <span class="total-label">TOTAL PAID</span>
                <span class="total-value">${params.currency} ${params.amount.toLocaleString()}</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>TERMINAL 01 • SYSTEM GENERATED</strong></p>
            <p>If you have any questions, please contact our support team.</p>
            <a href="mailto:support@thaikicks.com" class="support">CONTACT SUPPORT</a>
        </div>
}
    </div>
</body>
</html>
    `;
};

export const generateShopEmailHTML = (params: {
    orderId: string;
    customerName: string;
    amount: number;
    currency: string;
    items: any[];
    shippingAddress: string;
}) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmed - ThaiKicks</title>
    <style>
        body { font-family: 'Courier New', Courier, monospace; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 40px; border: 2px solid #1a1a1a; box-shadow: 8px 8px 0px 0px #AE3A17; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px dashed #e5e7eb; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: 900; color: #1a1a1a; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
        .title { font-size: 14px; color: #22c55e; font-weight: bold; text-transform: uppercase; }
        .receipt-body { margin-bottom: 30px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px; }
        .label { color: #6b7280; font-weight: bold; }
        .value { color: #1a1a1a; font-weight: bold; text-transform: uppercase; }
        .total-row { border-top: 2px dashed #e5e7eb; padding-top: 15px; margin-top: 15px; align-items: center; }
        .total-label { font-size: 16px; font-weight: 900; color: #1a1a1a; text-transform: uppercase; }
        .total-value { font-size: 24px; font-weight: 900; color: #3471AE; }
        .footer { text-align: center; border-top: 2px solid #1a1a1a; padding-top: 20px; margin-top: 30px; }
        .footer p { font-size: 12px; color: #6b7280; margin: 5px 0; }
        .support { background-color: #3471AE; color: #ffffff; text-decoration: none; padding: 10px 20px; display: inline-block; font-weight: bold; text-transform: uppercase; margin-top: 15px; font-size: 12px; }
        .items-list { border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px; }
        .item-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; color: #4b5563; }
        .address-box { p-4 background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; margin-top: 20px; font-size: 13px; color: #4b5563; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">THAIKICKS RECORD</div>
            <div class="title">✓ ORDER APPROVED</div>
        </div>
        
        <div class="receipt-body">
            <p style="font-size: 14px; margin-bottom: 25px;">Hello ${params.customerName}, your shop order is confirmed and will be processed soon.</p>
            
            <div class="row">
                <span class="label">ORDER ID</span>
                <span class="value">#${params.orderId.slice(0, 8)}</span>
            </div>
            
            <div class="items-list">
                <div style="font-weight: bold; margin-bottom: 10px; color: #1a1a1a; text-transform: uppercase; font-size: 14px;">Items</div>
                ${params.items.map(item => `
                    <div class="item-row">
                        <span>${item.quantity}x ${item.product_id ? 'Product' : 'Item'}</span>
                        <span>${params.currency} ${(item.priceAtPurchase || 0).toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>

            <div class="address-box">
                <div style="font-weight: bold; margin-bottom: 5px; color: #1a1a1a; text-transform: uppercase;">SHIPPING ADDRESS</div>
                <div>${params.shippingAddress}</div>
            </div>
            
            <div class="row total-row">
                <span class="total-label">TOTAL PAID</span>
                <span class="total-value">${params.currency} ${params.amount.toLocaleString()}</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>TERMINAL 01 • SYSTEM GENERATED</strong></p>
            <p>If you have any questions, please contact our support team.</p>
            <a href="mailto:support@thaikicks.com" class="support">CONTACT SUPPORT</a>
        </div>
    </div>
</body>
</html>
    `;
};
