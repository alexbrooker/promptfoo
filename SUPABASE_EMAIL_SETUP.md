# Supabase Email Template Setup

## Overview
This guide shows how to configure the custom email verification template in your Supabase project.

## Files Created
- `supabase_email_template.html` - Rich HTML email template
- `supabase_email_template.txt` - Plain text fallback
- `SUPABASE_EMAIL_SETUP.md` - This setup guide

## Setup Instructions

### 1. Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**

### 2. Configure Email Templates
1. Select **Confirm signup** template
2. Replace the default HTML content with the content from `supabase_email_template.html`
3. Update the **Subject** to: `Verify your email - AI Security Platform`

### 3. Customize Branding
Update these elements in the template:

**Company Name & Logo:**
```html
<div class="logo">🛡️ Your Company Name</div>
```

**Support Email:**
```html
<a href="mailto:your-support@domain.com" class="footer-link">your-support@domain.com</a>
```

**Footer Copyright:**
```html
© 2024 Your Company Name. Professional AI Red Teaming Solutions.
```

### 4. Email Settings Configuration

In Supabase Dashboard → Authentication → Settings:

**Site URL:** Set to your production domain
```
https://your-domain.com
```

**Redirect URLs:** Add your domains
```
https://your-domain.com/**
http://localhost:3000/**
```

### 5. SMTP Configuration (Optional)
For custom email delivery:

1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure your SMTP provider (SendGrid, Mailgun, etc.)
3. Test the configuration

### 6. Template Variables Available

Supabase provides these variables you can use:

- `{{ .ConfirmationURL }}` - Email verification link
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - Verification token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .RedirectTo }}` - Redirect URL after verification

### 7. Testing

1. Create a test user account
2. Check email delivery
3. Verify the template renders correctly
4. Test the verification link functionality

## Template Features

✅ **Professional Design**
- Clean, modern layout
- Responsive for mobile devices
- Consistent branding

✅ **Security Focused**
- Clear security notice
- Professional trust indicators
- Expiration warning

✅ **Engaging Content**
- Feature preview grid
- Clear call-to-action
- Value proposition

✅ **Technical Excellence**
- HTML + plain text versions
- Mobile responsive
- Email client compatibility

## Customization Options

### Colors
Update the gradient colors in CSS:
```css
background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
```

### Features Grid
Modify the features in the HTML:
```html
<div class="feature-item">
    <div class="feature-icon">🎯</div>
    <div class="feature-title">Your Feature</div>
    <div class="feature-desc">Feature description</div>
</div>
```

### Call-to-Action
Customize the button text and styling:
```html
<a href="{{ .ConfirmationURL }}" class="verify-button">
    Your CTA Text
</a>
```

## Best Practices

1. **Test thoroughly** across different email clients
2. **Keep it concise** - users scan emails quickly  
3. **Clear CTA** - make the verification button obvious
4. **Security messaging** - build trust with security notices
5. **Mobile first** - most users check email on mobile
6. **Fallback text** - always provide plain text version

## Troubleshooting

**Email not sending:**
- Check SMTP configuration
- Verify domain settings
- Check Supabase logs

**Template not rendering:**
- Validate HTML syntax
- Check for missing variables
- Test with plain text version

**Link not working:**
- Verify redirect URLs are configured
- Check site URL settings
- Test confirmation URL format