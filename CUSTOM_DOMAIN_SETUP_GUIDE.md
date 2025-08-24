# 🌐 Custom Domain Setup Guide - blaze-intelligence.com

## **IMMEDIATE ACTION REQUIRED**

### **Step 1: Cloudflare Pages Dashboard Setup**

**URL**: https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/pages/view/blaze-intelligence

1. **Navigate to Custom Domains**:
   - In the dashboard, scroll down to find "Custom domains" section
   - Click "Set up a custom domain" or "Add domain"

2. **Enter Domain**:
   - Domain name: `blaze-intelligence.com`
   - Click "Continue" or "Add"

3. **DNS Configuration**:
   - Cloudflare will provide DNS instructions
   - If domain is in Cloudflare: DNS will auto-configure
   - If domain is external: Add CNAME record

### **Step 2: DNS Configuration (If External)**

If your domain `blaze-intelligence.com` is NOT managed by Cloudflare:

**DNS Records to Add:**
```
Type: CNAME
Name: @ (or blank for root)
Target: blaze-intelligence.pages.dev
TTL: 300 (or Auto)
```

**Alternative A Record Setup:**
```
Type: A
Name: @ (or blank for root)  
Target: [IP provided by Cloudflare]
TTL: 300
```

### **Step 3: SSL Certificate**
- Cloudflare will automatically provision SSL certificate
- Status will show "Pending" → "Active" 
- Usually takes 2-15 minutes

---

## **AUTOMATED VERIFICATION**

Once you complete the dashboard setup, I can run automated tests to verify the domain activation.

### **Quick Test Commands:**

```bash
# Test basic connectivity
curl -I https://blaze-intelligence.com

# Test content delivery  
curl -s https://blaze-intelligence.com | grep "Blaze Intelligence"

# Test redirect functionality
curl -I https://blaze-intelligence.com/game.html
```

---

## **EXPECTED RESULTS**

### **When Working Correctly:**
- ✅ https://blaze-intelligence.com loads the homepage
- ✅ SSL certificate shows as valid
- ✅ All navigation links work properly
- ✅ Legacy URLs redirect to new structure

### **Common Issues:**
- ⏳ **DNS Propagation**: May take up to 48 hours globally
- ⏳ **SSL Provisioning**: Usually 2-15 minutes
- ⚠️ **Cache Issues**: Clear browser cache if needed

---

## **POST-ACTIVATION CHECKLIST**

### **Immediate (Next Hour):**
1. ✅ Verify https://blaze-intelligence.com loads
2. ✅ Test main navigation sections
3. ✅ Check SSL certificate in browser
4. ✅ Test redirect functionality

### **Within 24 Hours:**
1. 📊 Update Google Analytics property
2. 🔍 Submit domain to Google Search Console  
3. 📋 Update sitemap: https://blaze-intelligence.com/sitemap.xml
4. 📈 Monitor DNS propagation globally

### **Within Week:**
1. 📊 Track organic traffic changes
2. 🔗 Update external backlinks where possible
3. 📧 Update email signatures and marketing materials
4. 📱 Test mobile experience thoroughly

---

## **TROUBLESHOOTING**

### **Issue: Domain not responding**
- **Cause**: DNS propagation delay
- **Solution**: Wait 24-48 hours, test from different networks

### **Issue: SSL certificate pending**
- **Cause**: Certificate provisioning in progress
- **Solution**: Wait 15-30 minutes, refresh Cloudflare dashboard

### **Issue: Redirects not working**
- **Cause**: Client-side redirects need custom domain
- **Solution**: Test after DNS propagation completes

### **Issue: Content not updating**
- **Cause**: Browser/CDN cache
- **Solution**: Hard refresh (Ctrl/Cmd + Shift + R)

---

## **SUCCESS METRICS**

### **Technical Validation:**
- ✅ HTTP/2 200 response from https://blaze-intelligence.com
- ✅ Valid SSL certificate (green lock icon)
- ✅ Page load time <2 seconds
- ✅ All assets loading properly

### **SEO Validation:**
- ✅ Canonical URLs pointing to new domain
- ✅ XML sitemap accessible
- ✅ robots.txt properly configured
- ✅ Schema markup intact

### **Business Validation:**
- ✅ Professional domain appearance
- ✅ Consistent brand presentation
- ✅ Fast, reliable user experience
- ✅ Mobile responsiveness maintained

---

## **NEXT PHASE: SEO Migration**

Once domain is active, complete SEO migration:

1. **Google Search Console**:
   - Add https://blaze-intelligence.com as new property
   - Submit change of address from old domains
   - Upload sitemap: https://blaze-intelligence.com/sitemap.xml

2. **Google Analytics**:
   - Update property settings for new domain
   - Configure cross-domain tracking if needed
   - Set up conversion goals for new URLs

3. **External References**:
   - Update social media profiles
   - Update email signatures  
   - Contact sites with backlinks for URL updates
   - Update any advertising campaigns

---

**🎯 CURRENT STATUS**: Ready for custom domain activation
**⏳ ESTIMATED TIME**: 15 minutes setup + 24-48 hours propagation
**🚀 RESULT**: Professional domain with full functionality

*Complete the Cloudflare dashboard setup above, then we can run automated verification tests!*