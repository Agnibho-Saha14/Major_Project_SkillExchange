
# 🌟 Skill Exchange

Skill Exchange is a modern web platform that allows users to **share, discover, and exchange skills**.
It provides an interactive dashboard where learners and teachers can connect, post skills, and collaborate.

Built with **React 19, Vite, TailwindCSS v4, Radix UI, and Clerk Authentication**.

---

## 🚀 Features

* 🔑 **User Authentication** with [Clerk](https://clerk.com)
* 📝 **Publish Skills** – Share your expertise by posting new skills
* 🔍 **Browse Skills** – Explore skills posted by other users
* 📊 **Dashboard** – Manage your posted and acquired skills
* 🎨 **Modern UI/UX** using TailwindCSS, Radix UI, and ShadCN utilities
* 🖼️ **Lucide Icons** for a sleek interface
* ⚡ **Fast and optimized development** with Vite

---

## 🛠️ Tech Stack

* **Frontend:** [React 19](https://react.dev/) + [React Router 7](https://reactrouter.com/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Styling:** [TailwindCSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), ShadCN utilities
* **Auth:** [Clerk](https://clerk.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Linting:** ESLint with React plugins

---

## 📦 Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/Agnibho-Saha14/Major_Project_SkillExchange.git
   cd Major_Project_SkillExchange
   cd client
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory and add your Clerk keys:

   ```env
   VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The app will be available at 👉 [http://localhost:5173](http://localhost:5173)


---

## 📂 Project Structure

```
client
src/
├── components/        # Reusable UI components (ShadCN + Radix)
│   └── ui/            # Button, Card, Tabs, etc.
├── pages/             # Application pages
│   ├── Homepage.jsx
│   ├── BrowseSkillsPage.jsx
│   ├── PublishSkillPage.jsx
│   ├── DashboardPage.jsx
│   └── SkillDetailPage.jsx
├── App.jsx            # App routes
├── main.jsx           # React entry point
└── index.css          # Tailwind styles
```

---

## 🧑‍💻 Scripts

* `npm run dev` → Start dev server
* `npm run build` → Build for production
* `npm run preview` → Preview production build
* `npm run lint` → Run ESLint

---

## 🤝 Contributing

Contributions are welcome!
To contribute:

1. Fork the repo
2. Create your feature branch (`git checkout -b feature-name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to your branch (`git push origin feature-name`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the **MIT License**.
You’re free to use, modify, and distribute this project.

---


