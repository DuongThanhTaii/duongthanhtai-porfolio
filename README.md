# 🚀 Duong Thanh Tai | Full-Stack Developer Portfolio

A dynamic, fully manageable developer portfolio packed with interactive 3D animations, buttery smooth transitions, and a custom built-in Content Management System (CMS). 

This portfolio isn't just a static site — it includes a private Admin Dashboard to easily update profile details, manage resumes, and build project showcases using a Notion-like block builder!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DuongThanhTaii/duongthanhtai-porfolio)

![Portfolio Preview](https://res.cloudinary.com/dz5oyhmq2/image/upload/v1778842078/portfolio/projects/hlc0p4jz0iluxdoovsvx.png)

## ✨ Features

- **Custom Admin Panel & CMS** — Log in to your private dashboard to seamlessly manage your portfolio content.
- **Dynamic Project Builder** — Build detailed project pages using a dynamic block system (Title, Content, Images) similar to Notion or Colab.
- **Interactive 3D Keyboard** — Custom Spline keyboard where each keycap represents a skill, revealing titles and descriptions on hover/press.
- **Cloudinary Integration** — Direct image uploads from the Admin panel to Cloudinary.
- **Buttery Animations** — GSAP + Framer Motion powered scroll, hover, and reveal animations.
- **Light & Dark Mode** — Full theme support with cheeky disclaimer toasts.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, Shadcn UI, Aceternity UI |
| **Database & ORM**| PostgreSQL, Drizzle ORM |
| **Storage** | Cloudinary |
| **Animation** | GSAP, Framer Motion |
| **3D** | Spline Runtime |
| **Misc** | Zod (Validation), next-themes |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm (recommended), npm, or yarn
- A PostgreSQL database (e.g., Supabase, Neon)
- A Cloudinary account

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/DuongThanhTaii/duongthanhtai-porfolio.git
    cd duongthanhtai-porfolio
    ```

2. **Install dependencies:**

    ```bash
    pnpm install
    ```

3. **Set up environment variables:**

    Copy `.env.example` to `.env` and fill in your connection strings and keys:

    ```bash
    cp .env.example .env
    ```

4. **Initialize Database:**

    Push the Drizzle schema to your PostgreSQL database:

    ```bash
    pnpm run db:push
    ```

5. **Run the development server:**

    ```bash
    pnpm dev
    ```

6. Open [http://localhost:3000](http://localhost:3000) and explore your portfolio!

---

## 🔑 Admin Dashboard

To access the CMS and manage your portfolio content:
1. Navigate to `/admin`
2. Log in using your configured Admin credentials.
3. Use the dashboard to update your `Profile`, `Social Links`, `Resume`, and to create or edit `Projects` using the dynamic block builder.

---

## 🎨 Personalization

While the Admin panel handles all the dynamic content (Projects, About, Resume), the core configuration is located in [`src/data/config.ts`](src/data/config.ts). Edit this file to update the site metadata, title, and default social links:

```ts
const config = {
  title: "Duong Thanh Tai | Full-Stack Developer",
  description: {
    long: "Explore the portfolio of Duong Thanh Tai...",
    short: "Discover the portfolio of Duong Thanh Tai...",
  },
  // ...
};
```

---

## 🤝 Contributing

If you'd like to contribute or suggest improvements, feel free to open an issue or submit a pull request. All contributions are welcome!

---

## 📄 License & Credits

This project is open source and available under the [MIT License](LICENSE).

*Based on the original 3D Portfolio template by Naresh-Khatri, heavily modified with a custom database-driven CMS and dynamic routing.*
