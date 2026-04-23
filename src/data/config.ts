const config = {
  title: "Duong Thanh Tai | Full-Stack Developer",
  description: {
    long: "Explore the portfolio of Duong Thanh Tai, a full-stack developer focused on performant web experiences, modern UI, and practical digital products.",
    short:
      "Discover the portfolio of Duong Thanh Tai, a full-stack developer creating fast, modern web experiences.",
  },
  keywords: [
    "Duong Thanh Tai",
    "portfolio",
    "full-stack developer",
    "web development",
    "frontend developer",
    "backend developer",
    "performance optimization",
    "web design",
    "React",
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
  ],
  author: "Duong Thanh Tai",
  firstName: "Dương",
  lastName: "Thành Tài",
  role: "Full Stack Web Developer",
  email: "duongthanhtai1308@gmail.com",
  site: "https://nareshkhatri.site",

  // for github stars button
  githubUsername: "naresh-khatri",
  githubRepo: "3d-portfolio",

  get ogImg() {
    return this.site + "/assets/seo/og-image.png";
  },
  social: {
    twitter: "https://x.com/nothotchaddi",
    linkedin: "https://www.linkedin.com/in/naresh-khatri/",
    instagram: "https://www.instagram.com/hotchaddi",
    facebook: "https://www.facebook.com/HotChaddi/",
    github: "https://github.com/Naresh-Khatri",
  },
};
export { config };
