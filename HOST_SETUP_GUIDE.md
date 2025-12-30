# راهنمای اتصال دامنه و SSL وقتی پورت‌های 80/443 مشغول هستند

شما دو راه اصلی دارید. راه دوم (Cloudflare Tunnel) معمولاً وقتی پورت‌ها درگیر هستند بسیار ساده‌تر است.

## روش اول: استفاده از Nginx موجود در سرور (Reverse Proxy)
اگر روی سرور خود Nginx دارید که پورت 80/443 را اشغال کرده، باید یک فایل کانفیگ جدید به آن اضافه کنید تا درخواست‌های `panel.ghostest.sbs` را به پورت `8080` (پورت داکر ما) بفرستد.

### ۱. ساخت کانفیگ در هاست (نه در داکر)
یک فایل در `/etc/nginx/sites-available/ideaflow` بسازید:

```nginx
server {
    server_name panel.ghostest.sbs;

    location / {
        proxy_pass http://127.0.0.1:8080; # پورت کانتینر ما
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # پشتیبانی از وب‌سوکت
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### ۲. فعال‌سازی و SSL
```bash
# لینک کردن
ln -s /etc/nginx/sites-available/ideaflow /etc/nginx/sites-enabled/

# دریافت SSL با Certbot (روی سرور اصلی)
certbot --nginx -d panel.ghostest.sbs
```

---

## روش دوم: کلودفلر تانل (Cloudflare Tunnel) - ✅ پیشنهادی
این روش نیازی به پورت باز ندارد و با Firewall/NAT مشکلی ندارد. SSL هم خودکار است.

1. در پنل Cloudflare به بخش **Zero Trust > Access > Tunnels** بروید.
2. یک تانل جدید بسازید و سیستم عامل (Debian/Ubuntu) را انتخاب کنید.
3. دستور نصب را در سرور کپی و اجرا کنید.
4. در تب **Public Hostname**:
   - **Domain**: `panel.ghostest.sbs`
   - **Service**: `http://localhost:8080`

تمام! سایت شما با SSL قفل سبز بالا می‌آید بدون اینکه پورت ۸۰ سرور را لمس کنید.
