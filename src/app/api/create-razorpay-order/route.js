import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const { amount, currency, receipt, notes } = await request.json();

    // Validate input
    if (!amount || amount < 100) {
      return NextResponse.json(
        { success: false, message: 'Amount must be at least ₹1 (100 paise)' },
        { status: 400 }
      );
    }

    const options = {
      amount: parseInt(amount), // amount in paise
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.error?.description || 'Failed to create order' 
      },
      { status: 500 }
    );
  }
}