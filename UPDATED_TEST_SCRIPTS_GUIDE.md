# Updated Test Scripts Guide

## Key Finding: Email Issue Root Cause

After comprehensive analysis of the codebase, I discovered the root cause of the email confirmation issue:

### The Problem
The test scripts were using the **WRONG checkout URL** that has email sending **DISABLED**.

- ❌ `/checkout` (CheckoutPage.tsx) - Email sending is **DISABLED** (line 1329: "Email sending disabled in CheckoutPage")
- ✅ `/multi-step-checkout` (MultiStepCheckoutPage.tsx) - Email sending is **ENABLED** (lines 628-680)

### The Solution
All updated test scripts now use `/multi-step-checkout` which properly sends confirmation emails.

## Updated Test Scripts

### 1. `email-confirmation-test.js` - Focused Email Test
**Purpose**: Simple, focused test to verify email confirmations are sent
**Features**:
- Uses correct `/multi-step-checkout` URL
- Tests single guest checkout flow
- Monitors console for email-related messages
- Provides clear verification instructions

**Usage**:
```bash
node email-confirmation-test.js
```

**Test Email**: `email.test.001@noexpire.top`

### 2. `comprehensive-checkout-email-test.js` - Complete Test Suite
**Purpose**: Comprehensive testing of the entire checkout flow with email verification
**Features**:
- Tests multiple languages (currently focused on Slovenian)
- Uses correct `/multi-step-checkout` URL
- Detailed logging and reporting
- Tracks all orders created
- Generates JSON report

**Usage**:
```bash
node comprehensive-checkout-email-test.js
```

**Test Emails**: 
- `guest.checkout.001@noexpire.top`
- `guest.checkout.002@noexpire.top`
- `guest.checkout.003@noexpire.top`
- `guest.checkout.004@noexpire.top`

### 3. `guest-vs-registered-email-test.js` - User Type Comparison
**Purpose**: Tests both guest and registered user checkout flows
**Features**:
- Tests guest checkout flow
- Tests registered user checkout flow (with registration)
- Compares email sending for both user types
- Uses correct `/multi-step-checkout` URL

**Usage**:
```bash
node guest-vs-registered-email-test.js
```

**Test Emails**:
- Guest: `guest.email.test@noexpire.top`
- Registered: `registered.email.test@noexpire.top`

### 4. `smart-ghost-buyer.js` - Updated Comprehensive Test
**Purpose**: Updated version of the original comprehensive test
**Features**:
- Now uses correct checkout flow for email testing
- Includes newsletter signup testing
- Multi-language support
- Self-diagnostic capabilities

**Usage**:
```bash
node smart-ghost-buyer.js
```

## Email System Architecture

Based on the codebase analysis, here's how the email system works:

### Email Flow
1. **Order Creation**: MultiStepCheckoutPage creates order in database
2. **Email Trigger**: `sendOrderConfirmationEmail()` is called (lines 658-669)
3. **Edge Function**: Supabase Edge Function `/send-email` is invoked
4. **Google Apps Script**: Edge function calls Google Apps Script
5. **Email Delivery**: Gmail sends emails from `kmetija.marosa.narocila@gmail.com`

### Email Configuration
- **Order Confirmations**: `kmetija.marosa.narocila@gmail.com`
- **Newsletter**: `kmetija.marosa.novice@gmail.com`
- **Google Apps Script URL**: `https://script.google.com/macros/s/AKfycbw2pysAAgrqlkDA85BghF4QM9sCbDjFdogrIHRDA3UDpMo-8SsttlsUXMmATz-kRdSDSg/exec`

## Test Email Setup

All test scripts use the `@noexpire.top` domain for email testing:

### How to Check Emails
1. Go to: https://noexpire.top
2. Enter the email address (e.g., `email.test.001@noexpire.top`)
3. Check for order confirmation emails

### Email Aliases Available
You can create any email alias with `@noexpire.top`:
- `user1@noexpire.top`
- `test.checkout.001@noexpire.top`
- `guest.buyer.123@noexpire.top`
- etc.

## Expected Email Content

When orders are successfully placed, you should receive emails with:

**From**: `kmetija.marosa.narocila@gmail.com`
**Subject**: `Kmetija Maroša - Potrditev naročila #[ORDER_NUMBER]`
**Content**: 
- Order details
- Customer information
- Product list
- Total amount
- Payment method

## Troubleshooting

### If No Emails Are Received

1. **Verify Order Creation**: Check if order appears in success page
2. **Check Console Logs**: Look for email-related error messages
3. **Verify URL**: Ensure test uses `/multi-step-checkout` not `/checkout`
4. **Check Google Apps Script**: Verify script is running properly
5. **Check Supabase Logs**: Look at Edge Function logs

### Common Issues

1. **Using Wrong Checkout URL**: Always use `/multi-step-checkout`
2. **Form Validation Errors**: Ensure all required fields are filled
3. **Payment Method Not Selected**: Select a payment method before submission
4. **Cart Empty**: Verify items are actually added to cart

## Running the Tests

### Prerequisites
```bash
npm install puppeteer
```

### Recommended Test Order
1. Start with `email-confirmation-test.js` (simple, focused)
2. Run `guest-vs-registered-email-test.js` (compares user types)
3. Use `comprehensive-checkout-email-test.js` (full testing)

### After Running Tests
1. Check email inboxes at https://noexpire.top
2. Verify order confirmations were received
3. Check browser console for any error messages
4. Review generated JSON reports (for comprehensive test)

## Key Improvements Made

1. **Correct Checkout URL**: All scripts now use `/multi-step-checkout`
2. **Better Error Handling**: Improved error detection and reporting
3. **Email Monitoring**: Console monitoring for email-related messages
4. **Clear Instructions**: Step-by-step verification instructions
5. **Multiple Test Types**: Different scripts for different testing needs
6. **Proper Email Aliases**: Using `@noexpire.top` domain consistently

## Next Steps

1. Run the updated test scripts
2. Verify emails are received in test inboxes
3. If emails are still not received, investigate:
   - Google Apps Script logs
   - Supabase Edge Function logs
   - Email service configuration

The updated scripts should now properly test the email confirmation system since they use the correct checkout flow that actually sends emails.
