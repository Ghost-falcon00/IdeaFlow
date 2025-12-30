# IdeaFlow 💡🚀
> **AI-Powered Startup Idea Validator & Marketplace**

![IdeaFlow Banner](https://via.placeholder.com/1200x400?text=IdeaFlow+Platform)

**IdeaFlow** is a comprehensive platform designed for entrepreneurs to validate, refine, and trade startup ideas. Powered by Advanced AI (Groq/GPT), it analyzes business concepts, provides actionable feedback, and connects idea owners with potential investors.

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
- [Redis](https://redis.io/) (Optional) - Caching and real-time features.
- [Docker](https://www.docker.com/) - Containerization for consistent environments.

**Frontend:**
- [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/) - Lightning fast UI.
- [Tailwind CSS](https://tailwindcss.com/) (or Custom CSS) - Modern styling.
- [Axios](https://axios-http.com/) - API integration.

**DevOps:**
- [Nginx](https://nginx.org/) - Reverse proxy and web server.
- [Docker Compose](https://docs.docker.com/compose/) - Multi-container orchestration.
- [Certbot](https://certbot.eff.org/) - Automated SSL management.

---

## 🚀 Getting Started (Local Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ghost-falcon00/IdeaFlow.git
   cd IdeaFlow
   ```

2. **Setup Environment**
   Create a `.env` file in the root directory:
   ```env
   DEBUG=True
   SECRET_KEY=your_secret_key
   DB_NAME=ideaflow_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   GROQ_API_KEY=your_api_key
   ```

3. **Run Backend**
   ```bash
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

4. **Run Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🌐 Deployment (Production)

This project supports **One-Click Docker Deployment**.

1. **Clone on VPS**
   ```bash
   git clone https://github.com/Ghost-falcon00/IdeaFlow.git /opt/ideaflow
   cd /opt/ideaflow
   ```

2. **Configure Production Env**
   Update `.env` with `DEBUG=False` and production database credentials.

3. **Deploy**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   # This script builds Docker containers, migrates DB, and sets up Nginx.
   ```

4. **SSL Setup (Auto)**
   ```bash
   chmod +x get_cert.sh
   ./get_cert.sh
   # Automatically stops web server, gets Certbot certificate, and restarts.
   ```

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ by Ghost-falcon00</sub>
</div>
