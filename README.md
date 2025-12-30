# IdeaFlow 💡🚀
> **AI-Powered Startup Idea Validator & Marketplace**

![IdeaFlow Banner](https://via.placeholder.com/1200x400?text=IdeaFlow+Platform)

**IdeaFlow** is a comprehensive platform designed for entrepreneurs to validate, refine, and trade startup ideas. Powered by Advanced AI (Groq/GPT), it analyzes business concepts, provides actionable feedback, and connects idea owners with potential investors.

[🇮🇷 فارسی (Persian Version)](#-ideaflow---پلتفرم-هوشمند-اعتبارسنجی-ایده)

---

## ✨ Key Features

### 🧠 AI Core
- **Smart Scoring:** Instant AI analysis of ideas based on Market Potential, Feasibility, and Innovation.
- **Deep Feedback:** Detailed breakdown of strengths, weaknesses, and improved execution steps.
- **AI Chat Advisor:** Real-time chat with an AI consultant context-aware of your specific idea.

### 💼 Marketplace & Investment
- **Idea Marketplace:** Explore vetted startup ideas.
- **Investment Requests:** Investors can send equity/funding proposals directly.
- **Unified Messaging:** Real-time negotiation chat between Owners and Investors.

### 📊 User Experience
- **Interactive Dashboard:** Track your ideas, rank, and recent activities.
- **Leaderboard:** Compete with other creators for the top spot.
- **Subscription System:** Free, Pro, and Enterprise tiers with varying limits.

---

## 🛠️ Tech Stack

**Backend:**
- [Django REST Framework](https://www.django-rest-framework.org/) - Robust API architecture.
- [PostgreSQL](https://www.postgresql.org/) - High-performance relational database.
- [Docker](https://www.docker.com/) - Containerization for consistent environments.

**Frontend:**
- [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/) - Lightning fast UI.
- [Tailwind CSS](https://tailwindcss.com/) - Modern styling.

**DevOps:**
- [Nginx](https://nginx.org/) & [Docker Compose](https://docs.docker.com/compose/) - Production orchestration.
- [Certbot](https://certbot.eff.org/) - Automated SSL.

---

## 🚀 Getting Started (English)

1. **Clone & Setup:**
   ```bash
   git clone https://github.com/Ghost-falcon00/IdeaFlow.git
   cd IdeaFlow
   cp .env.example .env
   ```
2. **Run (Docker):**
   ```bash
   docker-compose up --build
   ```

---

<br>
<div dir="rtl">

# 🇮🇷 IdeaFlow - پلتفرم هوشمند اعتبارسنجی ایده
> **دستیار هوش مصنوعی برای استارتاپ‌ها و کارآفرینان**

**آیدیا فللو (IdeaFlow)** یک پلتفرم جامع است که به کارآفرینان کمک می‌کند قبل از هزینه کردن، ایده‌های خود را با هوش مصنوعی (AI) اعتبارسنجی کنند و اگر ایده خوبی بود، سرمایه‌گذار جذب کنند.

## 💡 داستان و ایده پروژه
بسیاری از استارتاپ‌ها شکست می‌خورند چون روی ایده‌ای کار می‌کنند که نیاز بازار نیست یا اجرای آن ممکن نیست.
**هدف IdeaFlow این است:**
1.  **جلوگیری از شکست:** هوش مصنوعی ایده شما را بی‌رحمانه نقد می‌کند و امتیاز می‌دهد.
2.  **رشد:** به شما می‌گوید چطور ایده را بهتر کنید (Pivot).
3.  **سرمایه:** وقتی ایده پخته شد، آن را در مارکت‌پلیس به سرمایه‌گذاران نشان می‌دهد.

## 🏗️ مراحل ساخت و توسعه
این پروژه در ۷ فاز اصلی توسعه داده شده است:

1.  **فاز پایه (MVP):** راه‌اندازی جنگو و ری‌اکت، سیستم احراز هویت و دیتابیس.
2.  **هوش مصنوعی:** اتصال به مدل‌های زبانی (LLM) برای تحلیل و امتیازدهی به ایده‌ها.
3.  **چت هوشمند:** ساخت مشاور AI که مثل یک منتور با کاربر چت می‌کند.
4.  **مارکت‌پلیس:** ساخت فضای خرید و فروش ایده و ارسال درخواست سرمایه‌گذاری.
5.  **گیمیفیکیشن:** لیدربورد و سیستم رتبه‌بندی کاربران برتر.
6.  **پیام‌رسان:** سیستم چت ریل‌تایم بین سرمایه‌گذار و صاحب ایده.
7.  **دیپلوی:** داکرایز کردن و راه‌اندازی امن روی سرور VPS.

## 🚀 راهنمای نصب و اجرا

### 1. دانلود پروژه
```bash
git clone https://github.com/Ghost-falcon00/IdeaFlow.git
cd IdeaFlow
```

### 2. اجرا روی سیستم خودتان (Local)
کافیست فایل `.env` را بسازید و سپس:
```bash
# اجرای سریع با داکر
docker-compose up --build
```
سایت روی آدرس `http://localhost:5173` بالا می‌آید.

### 3. اجرا روی سرور (VPS)
ما اسکریپت‌های خودکار برای دیپلوی نوشته‌ایم. در سرور لینوکس خود وارد پوشه شوید و بزنید:
```bash
# دریافت گواهی SSL و دیپلوی خودکار
chmod +x get_cert.sh && ./get_cert.sh
```

</div>

---

<div align="center">
  <sub>Built with ❤️ by Ghost-falcon00</sub>
</div>
