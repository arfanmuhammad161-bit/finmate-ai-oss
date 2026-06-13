# FinMate AI 🚀

![FinMate AI Banner](https://via.placeholder.com/1200x400.png?text=FinMate+AI+-+Personal+Finance+Assistant)

FinMate AI is a modern, AI-powered personal finance management dashboard built with **Next.js**, **Supabase**, and **Tailwind CSS**. It helps users track expenses, set budgets, and generate intelligent financial insights through an integrated AI assistant and Telegram Bot integration.

## ✨ Features

- **Dashboard & Analytics:** Beautiful charts for Cashflow, Income vs Expense, and Spending Categories.
- **AI Assistant Integration:** Interactive AI chat to extract transactions from text or receipts.
- **Telegram Bot Automation:** Daily and weekly financial summaries delivered directly to Telegram.
- **Multi-Tier Subscriptions:** Free, Monthly, and Yearly subscription models with secure checkout.
- **Admin Panel:** Complete control over users, transactions, revenues, coupons, and broadcast notifications.
- **Broadcast System with AI:** Compose and polish global announcements automatically using AI.

---

## 🤖 Claude AI Integration Roadmap
*This project is actively participating in the "Claude for Open Source" initiative.*

**Current Status:** We are migrating our core Natural Language Processing and Financial Data Reasoning engines to **Claude 3.5 Sonnet**.

**Why Claude?**
Handling complex financial logic from unstructured data (like messy receipts or voice notes) requires deep reasoning capabilities. Claude's superior context window and precise JSON extraction make it the perfect candidate to replace our current fallback models. We plan to utilize Claude for:
1. **Advanced Receipt Parsing:** Accurately mapping blurry or multilingual receipts to specific budget categories.
2. **Proactive Financial Coaching:** Generating personalized, deeply reasoned weekly financial advice based on a user's spending habits.
3. **Admin Insight Generation:** Summarizing thousands of system logs and revenue trends into readable weekly reports for the administrator.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS, Lucide Icons, Recharts
- **Backend:** Next.js API Routes, Supabase (PostgreSQL)
- **AI Provider:** Currently migrating to Anthropic Claude API
- **Deployment:** Vercel

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Project
- Telegram Bot Token (Optional)
- Anthropic / Gemini API Keys

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/finmate-ai-oss.git
   cd finmate-ai-oss
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Copy `.env.example` to `.env.local` and fill in the required keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role
   GEMINI_API_KEY=your_ai_key
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](#).
