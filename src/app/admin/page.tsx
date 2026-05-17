"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ProfileDTO,
  ProjectDTO,
  ProjectImageDTO,
  ProjectSection,
  SocialLinkDTO,
} from "@/types/admin";

const emptyProfile: ProfileDTO = {
  author: "",
  role: "",
  email: "",
  about: "",
  resumeUrl: null,
  resumePublicId: null,
  resumeUrlSecondary: null,
  resumePublicIdSecondary: null,
  socialLinks: [],
};

const emptyProject: ProjectDTO = {
  slug: "",
  title: "",
  category: "",
  shortDescription: "",
  longDescription: "",
  coverImageUrl: null,
  coverImagePublicId: null,
  liveUrl: "",
  githubUrl: null,
  frontendTech: [],
  backendTech: [],
  isPublished: true,
  sortOrder: 0,
  images: [],
};

const TECH_OPTIONS = [
  "PyTorch",
  "ViT",
  "BiFPN",
  "Qwen-3",
  "JavaScript",
  "TypeScript",
  "Python",
  "SQL",
  "HTML",
  "CSS",
  "React",
  "Next.js",
  "Node.js (Express, NestJS)",
  "FastAPI",
  "REST API",
  "PostgreSQL",
  "Redis",
  "Git",
  "Docker",
  "Linux",
  "CI/CD",
  "LaTeX",
  "OOP",
  "DSA",
  "Database Design",
  "Query Optimization",
  "API Integration",
  "Prompt Engineering",
  "LoRA Fine-tuning",
  "VLM/LLM",
  "Self-Supervised Learning (I-JEPA)",
  "Computer Vision",
  "C/C++",
  "CUDA",
];

const mergeUnique = (base: string[], extra: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];
  const add = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    result.push(trimmed);
  };
  base.forEach(add);
  extra.forEach(add);
  return result;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profile, setProfile] = useState<ProfileDTO>(emptyProfile);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | "new">(
    "new",
  );
  const [projectForm, setProjectForm] = useState<ProjectDTO>(emptyProject);
  const [savingProject, setSavingProject] = useState(false);
  const [sections, setSections] = useState<ProjectSection[]>([]);
  const [status, setStatus] = useState("");
  const [customFrontend, setCustomFrontend] = useState("");
  const [customBackend, setCustomBackend] = useState("");
  const hasLiveUrl = Boolean(projectForm.liveUrl.trim());
  const hasSourceUrl = Boolean((projectForm.githubUrl ?? "").trim());
  const frontendOptions = useMemo(
    () => mergeUnique(TECH_OPTIONS, projectForm.frontendTech),
    [projectForm.frontendTech],
  );
  const backendOptions = useMemo(
    () => mergeUnique(TECH_OPTIONS, projectForm.backendTech),
    [projectForm.backendTech],
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      setStatus("");
      try {
        const [profileRes, projectsRes] = await Promise.all([
          fetch("/api/admin/profile", { cache: "no-store" }),
          fetch("/api/admin/projects", { cache: "no-store" }),
        ]);

        if (!profileRes.ok || !projectsRes.ok) {
          setStatus("Failed to load admin data.");
          return;
        }

        const profileData = (await profileRes.json()) as ProfileDTO;
        const projectsData = (await projectsRes.json()) as ProjectDTO[];
        setProfile(profileData);
        setProjects(projectsData);
        setProjectForm(emptyProject);
        setSections([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const selectedProject = useMemo(() => {
    if (selectedProjectId === "new") return null;
    return projects.find((project) => project.id === selectedProjectId) ?? null;
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (!selectedProject) {
      setProjectForm(emptyProject);
      setSections([]);
      return;
    }
    setProjectForm(selectedProject);
    try {
      const parsed = JSON.parse(selectedProject.longDescription);
      if (Array.isArray(parsed)) {
        setSections(parsed);
      } else {
        setSections([{ id: "legacy", title: "Details", content: selectedProject.longDescription, images: [] }]);
      }
    } catch {
      if (selectedProject.longDescription) {
        setSections([{ id: "legacy", title: "Details", content: selectedProject.longDescription, images: [] }]);
      } else {
        setSections([]);
      }
    }
  }, [selectedProject]);

  function updateProfileField<K extends keyof ProfileDTO>(
    key: K,
    value: ProfileDTO[K],
  ) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function updateSocialLink(index: number, patch: Partial<SocialLinkDTO>) {
    setProfile((prev) => {
      const nextLinks = [...prev.socialLinks];
      nextLinks[index] = { ...nextLinks[index], ...patch };
      return { ...prev, socialLinks: nextLinks };
    });
  }

  function addSocialLink() {
    setProfile((prev) => ({
      ...prev,
      socialLinks: [
        ...prev.socialLinks,
        {
          platform: "github",
          url: "https://",
          isActive: true,
          sortOrder: prev.socialLinks.length,
        },
      ],
    }));
  }

  function removeSocialLink(index: number) {
    setProfile((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  }

  async function onUploadResume(file: File, slot: "primary" | "secondary") {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/upload/resume", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Resume upload failed.");
    }

    setProfile((prev) =>
      slot === "primary"
        ? {
            ...prev,
            resumeUrl: data.secure_url,
            resumePublicId: data.public_id,
          }
        : {
            ...prev,
            resumeUrlSecondary: data.secure_url,
            resumePublicIdSecondary: data.public_id,
          },
    );
  }

  async function saveProfile() {
    setSavingProfile(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save profile.");
      }
      setProfile(data);
      setStatus("Profile updated.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to save profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  function updateProjectField<K extends keyof ProjectDTO>(
    key: K,
    value: ProjectDTO[K],
  ) {
    setProjectForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleTech(
    field: "frontendTech" | "backendTech",
    value: string,
  ) {
    setProjectForm((prev) => {
      const next = new Set(prev[field]);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return { ...prev, [field]: Array.from(next) };
    });
  }

  function addCustomTech(
    field: "frontendTech" | "backendTech",
    value: string,
    reset: () => void,
  ) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setProjectForm((prev) => {
      const next = new Set(prev[field]);
      next.add(trimmed);
      return { ...prev, [field]: Array.from(next) };
    });
    reset();
  }

  function updateProjectImage(index: number, patch: Partial<ProjectImageDTO>) {
    setProjectForm((prev) => {
      const next = [...prev.images];
      next[index] = { ...next[index], ...patch };
      return { ...prev, images: next };
    });
  }

  function addProjectImage(url = "") {
    setProjectForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        { imageUrl: url, imagePublicId: null, sortOrder: prev.images.length },
      ],
    }));
  }

  function removeProjectImage(index: number) {
    setProjectForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  function addSection() {
    setSections((prev) => [
      ...prev,
      { id: Date.now().toString(), title: "", content: "", images: [], buttonText: "", buttonUrl: "" },
    ]);
  }

  function updateSection(index: number, patch: Partial<ProjectSection>) {
    setSections((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  function addSectionImage(sectionIndex: number, url: string) {
    setSections((prev) => {
      const next = [...prev];
      next[sectionIndex] = {
        ...next[sectionIndex],
        images: [...next[sectionIndex].images, url],
      };
      return next;
    });
  }

  function removeSectionImage(sectionIndex: number, imageIndex: number) {
    setSections((prev) => {
      const next = [...prev];
      next[sectionIndex] = {
        ...next[sectionIndex],
        images: next[sectionIndex].images.filter((_, i) => i !== imageIndex),
      };
      return next;
    });
  }

  async function uploadSectionImage(file: File, sectionIndex: number) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload/image", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Image upload failed.");
    }

    addSectionImage(sectionIndex, data.secure_url);
  }

  async function uploadProjectImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload/image", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Image upload failed.");
    }

    addProjectImage(data.secure_url);
  }

  async function uploadCoverImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload/image", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Cover upload failed.");
    }

    setProjectForm((prev) => ({
      ...prev,
      coverImageUrl: data.secure_url,
      coverImagePublicId: data.public_id,
    }));
  }

  async function saveProject() {
    setSavingProject(true);
    setStatus("");
    try {
      const generatedSlug = projectForm.slug || projectForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        ...projectForm,
        slug: generatedSlug,
        longDescription: JSON.stringify(sections),
        githubUrl: projectForm.githubUrl || "",
      };

      const url =
        selectedProjectId === "new"
          ? "/api/admin/projects"
          : `/api/admin/projects/${selectedProjectId}`;
      const method = selectedProjectId === "new" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save project.");
      }

      const projectsRes = await fetch("/api/admin/projects", {
        cache: "no-store",
      });
      const projectsData = (await projectsRes.json()) as ProjectDTO[];
      setProjects(projectsData);
      setStatus("Project saved.");
      if (selectedProjectId === "new" && data.id) {
        setSelectedProjectId(data.id);
      }
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to save project.",
      );
    } finally {
      setSavingProject(false);
    }
  }

  async function deleteProject() {
    if (selectedProjectId === "new") return;
    const okay = window.confirm("Delete this project?");
    if (!okay) return;

    setStatus("");
    const response = await fetch(`/api/admin/projects/${selectedProjectId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Delete failed.");
      return;
    }

    setProjects((prev) =>
      prev.filter((project) => project.id !== selectedProjectId),
    );
    setSelectedProjectId("new");
    setProjectForm(emptyProject);
    setSections([]);
    setStatus("Project deleted.");
  }

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-zinc-300">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 text-zinc-200">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Admin</h1>
          <p className="text-sm text-zinc-400">
            Private dashboard for your portfolio content.
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm hover:border-zinc-500"
        >
          Logout
        </button>
      </div>

      {status ? (
        <p className="mb-4 rounded-md bg-zinc-900 px-3 py-2 text-sm">
          {status}
        </p>
      ) : null}

      <section className="mb-10 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/40 shadow-xl backdrop-blur-md">
        <div className="border-b border-zinc-800 bg-zinc-900/40 px-6 py-4">
          <h2 className="text-xl font-semibold text-zinc-100">Profile, Social & Resume</h2>
        </div>
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
          <Field label="Author">
            <input
              value={profile.author}
              onChange={(event) =>
                updateProfileField("author", event.target.value)
              }
              className="input"
            />
          </Field>
          <Field label="Role">
            <input
              value={profile.role}
              onChange={(event) =>
                updateProfileField("role", event.target.value)
              }
              className="input"
            />
          </Field>
          <Field label="Email">
            <input
              value={profile.email}
              onChange={(event) =>
                updateProfileField("email", event.target.value)
              }
              className="input"
            />
          </Field>
          <Field label="Resume PDF (1)">
            <div className="flex gap-2">
              <input
                type="file"
                accept="application/pdf"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    await onUploadResume(file, "primary");
                    setStatus("Resume 1 uploaded.");
                  } catch (error) {
                    setStatus(
                      error instanceof Error
                        ? error.message
                        : "Resume upload failed.",
                    );
                  }
                }}
                className="input"
              />
            </div>
            {profile.resumeUrl ? (
              <a
                href="/resume?slot=primary"
                target="_blank"
                className="mt-1 inline-block text-xs text-cyan-400 hover:underline"
              >
                Preview resume 1
              </a>
            ) : null}
          </Field>
          <Field label="Resume PDF (2)">
            <div className="flex gap-2">
              <input
                type="file"
                accept="application/pdf"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    await onUploadResume(file, "secondary");
                    setStatus("Resume 2 uploaded.");
                  } catch (error) {
                    setStatus(
                      error instanceof Error
                        ? error.message
                        : "Resume upload failed.",
                    );
                  }
                }}
                className="input"
              />
            </div>
            {profile.resumeUrlSecondary ? (
              <a
                href="/resume?slot=secondary"
                target="_blank"
                className="mt-1 inline-block text-xs text-cyan-400 hover:underline"
              >
                Preview resume 2
              </a>
            ) : null}
          </Field>
          <Field label="About">
            <textarea
              value={profile.about}
              onChange={(event) =>
                updateProfileField("about", event.target.value)
              }
              className="input min-h-28"
            />
          </Field>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">Social links</h3>
            <button
              onClick={addSocialLink}
              className="rounded border border-zinc-700 px-2 py-1 text-xs"
            >
              Add
            </button>
          </div>
          <div className="space-y-3">
            {profile.socialLinks.map((link, index) => (
              <div
                key={`${link.platform}-${index}`}
                className="group flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 md:flex-row md:items-center transition-colors hover:border-zinc-700"
              >
                <input
                  value={link.platform}
                  onChange={(event) =>
                    updateSocialLink(index, { platform: event.target.value })
                  }
                  className="input md:w-1/3"
                  placeholder="Platform (e.g. GitHub)"
                />
                <input
                  value={link.url}
                  onChange={(event) =>
                    updateSocialLink(index, { url: event.target.value })
                  }
                  className="input flex-1"
                  placeholder="https://..."
                />
                <button
                  onClick={() => removeSocialLink(index)}
                  className="rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="rounded-lg bg-cyan-500 px-6 py-2.5 text-sm font-bold text-cyan-950 shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-400 disabled:opacity-60"
            >
              {savingProfile ? "Saving..." : "Save profile"}
            </button>
          </div>
        </div>
      </section>

      <section className="mb-10 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/40 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/40 px-6 py-4">
          <h2 className="text-xl font-semibold text-zinc-100">Published Projects</h2>
          <button
            onClick={() => {
              setSelectedProjectId("new");
              const el = document.getElementById("project-editor");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-md bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/30"
          >
            + New Project
          </button>
        </div>
        <div className="p-6">
          {projects.length === 0 ? (
            <div className="text-center text-sm text-zinc-500 py-8">
              No projects found. Create one!
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div key={project.id} className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700">
                  <div>
                    <h3 className="font-semibold text-zinc-100">{project.title}</h3>
                    <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{project.shortDescription || project.category}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${project.isPublished ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      {project.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <button
                      onClick={() => {
                        if (project.id) setSelectedProjectId(project.id);
                        const el = document.getElementById("project-editor");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                    >
                      Edit Project &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="project-editor" className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/40 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-900/40 px-6 py-4">
          <h2 className="text-xl font-semibold text-zinc-100">Projects CRUD</h2>
          <select
            value={selectedProjectId}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedProjectId(value === "new" ? "new" : Number(value));
            }}
            className="input w-72"
          >
            <option value="new">+ Create new project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>
        <div className="p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex flex-col gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <input
                  value={projectForm.title}
                  onChange={(event) =>
                    updateProjectField("title", event.target.value)
                  }
                  placeholder="Project title"
                  className="w-full bg-transparent text-2xl font-semibold text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                />
                <input
                  value={projectForm.category}
                  onChange={(event) =>
                    updateProjectField("category", event.target.value)
                  }
                  placeholder="Category"
                  className="mt-3 w-40 rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1 text-[11px] uppercase tracking-widest text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                {hasSourceUrl ? (
                  <a
                    href={projectForm.githubUrl ?? ""}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-zinc-600 px-3 py-1 text-xs text-zinc-200 hover:border-zinc-400"
                  >
                    Source
                  </a>
                ) : (
                  <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-600">
                    Source
                  </span>
                )}
                {hasLiveUrl ? (
                  <a
                    href={projectForm.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-950"
                  >
                    Visit
                  </a>
                ) : (
                  <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-600">
                    Visit
                  </span>
                )}
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 text-xs text-zinc-400">
                  x
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                {projectForm.coverImageUrl ? (
                  <img
                    src={projectForm.coverImageUrl}
                    alt={`${projectForm.title || "Project"} cover`}
                    className="h-44 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center text-xs text-zinc-500">
                    Cover preview
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <label className="space-y-1 text-xs uppercase tracking-widest text-zinc-400">
                  <span>Live URL</span>
                  <input
                    value={projectForm.liveUrl}
                    onChange={(event) =>
                      updateProjectField("liveUrl", event.target.value)
                    }
                    className="input"
                    placeholder="https://..."
                  />
                </label>
                <label className="space-y-1 text-xs uppercase tracking-widest text-zinc-400">
                  <span>Source URL</span>
                  <input
                    value={projectForm.githubUrl ?? ""}
                    onChange={(event) =>
                      updateProjectField("githubUrl", event.target.value)
                    }
                    className="input"
                    placeholder="https://..."
                  />
                </label>
                <label className="space-y-1 text-xs uppercase tracking-widest text-zinc-400">
                  <span>Cover image</span>
                  <input
                    value={projectForm.coverImageUrl ?? ""}
                    onChange={(event) =>
                      updateProjectField("coverImageUrl", event.target.value)
                    }
                    className="input"
                    placeholder="https://..."
                  />
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      await uploadCoverImage(file);
                      setStatus("Cover uploaded.");
                    } catch (error) {
                      setStatus(
                        error instanceof Error
                          ? error.message
                          : "Cover upload failed.",
                      );
                    }
                  }}
                  className="input"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest text-zinc-400">
                    Frontend tech
                  </p>
                  <span className="text-xs text-zinc-500">
                    {projectForm.frontendTech.length} selected
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {frontendOptions.map((tech) => {
                    const active = projectForm.frontendTech.includes(tech);
                    return (
                      <button
                        key={`fe-${tech}`}
                        onClick={() => toggleTech("frontendTech", tech)}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          active
                            ? "border-cyan-400/70 bg-cyan-500/20 text-cyan-100"
                            : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                        }`}
                      >
                        {tech}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={customFrontend}
                    onChange={(event) => setCustomFrontend(event.target.value)}
                    placeholder="Add custom tech"
                    className="input flex-1"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCustomTech(
                          "frontendTech",
                          customFrontend,
                          () => setCustomFrontend(""),
                        );
                      }
                    }}
                  />
                  <button
                    onClick={() =>
                      addCustomTech(
                        "frontendTech",
                        customFrontend,
                        () => setCustomFrontend(""),
                      )
                    }
                    className="rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-200 hover:border-zinc-500"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest text-zinc-400">
                    Backend tech
                  </p>
                  <span className="text-xs text-zinc-500">
                    {projectForm.backendTech.length} selected
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {backendOptions.map((tech) => {
                    const active = projectForm.backendTech.includes(tech);
                    return (
                      <button
                        key={`be-${tech}`}
                        onClick={() => toggleTech("backendTech", tech)}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          active
                            ? "border-cyan-400/70 bg-cyan-500/20 text-cyan-100"
                            : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                        }`}
                      >
                        {tech}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={customBackend}
                    onChange={(event) => setCustomBackend(event.target.value)}
                    placeholder="Add custom tech"
                    className="input flex-1"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCustomTech(
                          "backendTech",
                          customBackend,
                          () => setCustomBackend(""),
                        );
                      }
                    }}
                  />
                  <button
                    onClick={() =>
                      addCustomTech(
                        "backendTech",
                        customBackend,
                        () => setCustomBackend(""),
                      )
                    }
                    className="rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-200 hover:border-zinc-500"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <label className="space-y-2 text-xs uppercase tracking-widest text-zinc-400">
                <span>Summary</span>
                <textarea
                  value={projectForm.shortDescription}
                  onChange={(event) =>
                    updateProjectField("shortDescription", event.target.value)
                  }
                  className="input min-h-24"
                  placeholder="Short description for the modal"
                />
              </label>
            </div>

            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium uppercase tracking-widest text-zinc-400">Content Sections</h3>
                <button
                  onClick={addSection}
                  className="rounded border border-zinc-700 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800"
                >
                  + Add Section
                </button>
              </div>
              <div className="space-y-6">
                {sections.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
                    No sections added yet. Click "+ Add Section" to build your project content.
                  </div>
                ) : (
                  sections.map((section, sIdx) => (
                    <div key={section.id || sIdx} className="rounded-xl border border-zinc-700 bg-zinc-900/30 p-5 relative group">
                      <button
                        onClick={() => removeSection(sIdx)}
                        className="absolute right-4 top-4 text-xs font-semibold text-red-400/70 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                      >
                        Delete Section
                      </button>
                      <div className="grid gap-4">
                        <label className="space-y-2 text-xs uppercase tracking-widest text-zinc-400">
                          <span>Section Title</span>
                          <input
                            value={section.title}
                            onChange={(e) => updateSection(sIdx, { title: e.target.value })}
                            className="input"
                            placeholder="e.g. Space Theme"
                          />
                        </label>
                        <label className="space-y-2 text-xs uppercase tracking-widest text-zinc-400">
                          <span>Section Content</span>
                          <textarea
                            value={section.content}
                            onChange={(e) => updateSection(sIdx, { content: e.target.value })}
                            className="input min-h-32"
                            placeholder="Description paragraphs..."
                          />
                        </label>
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="space-y-2 text-xs uppercase tracking-widest text-zinc-400">
                            <span>Button Text (Optional)</span>
                            <input
                              value={section.buttonText || ""}
                              onChange={(e) => updateSection(sIdx, { buttonText: e.target.value })}
                              className="input"
                              placeholder="e.g. Download App"
                            />
                          </label>
                          <label className="space-y-2 text-xs uppercase tracking-widest text-zinc-400">
                            <span>Button URL (Optional)</span>
                            <input
                              value={section.buttonUrl || ""}
                              onChange={(e) => updateSection(sIdx, { buttonUrl: e.target.value })}
                              className="input"
                              placeholder="https://..."
                            />
                          </label>
                        </div>
                        <div className="space-y-2">
                          <span className="text-xs uppercase tracking-widest text-zinc-400">Section Images</span>
                          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                            {section.images.map((img, iIdx) => (
                              <div key={iIdx} className="relative group/img aspect-video rounded-lg overflow-hidden border border-zinc-700 bg-black">
                                <img src={img} className="w-full h-full object-cover opacity-80" />
                                <button
                                  onClick={() => removeSectionImage(sIdx, iIdx)}
                                  className="absolute inset-0 bg-red-900/50 flex items-center justify-center text-white text-xs opacity-0 group-hover/img:opacity-100 transition"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <label className="cursor-pointer aspect-video rounded-lg border border-dashed border-zinc-700 flex flex-col items-center justify-center text-xs text-zinc-500 hover:bg-zinc-800 transition">
                              <span>+ Add Image</span>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    await uploadSectionImage(file, sIdx);
                                  } catch (error) {
                                    alert("Upload failed");
                                  }
                                  e.target.value = ''; // Reset
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium">Project screenshots</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      try {
                        await uploadProjectImage(file);
                        setStatus("Screenshot uploaded.");
                      } catch (error) {
                        setStatus(
                          error instanceof Error
                            ? error.message
                            : "Upload failed.",
                        );
                      }
                    }}
                    className="input w-60"
                  />
                  <button
                    onClick={() => addProjectImage()}
                    className="rounded border border-zinc-700 px-3 py-2 text-xs text-zinc-200"
                  >
                    Add empty field
                  </button>
                </div>
              </div>
              {projectForm.images.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-500">
                  Add screenshots to build the gallery.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {projectForm.images.map((image, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3"
                    >
                      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                        {image.imageUrl ? (
                          <img
                            src={image.imageUrl}
                            alt={`Screenshot ${index + 1}`}
                            className="h-28 w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-28 items-center justify-center text-xs text-zinc-500">
                            Screenshot preview
                          </div>
                        )}
                      </div>
                      <input
                        value={image.imageUrl}
                        onChange={(event) =>
                          updateProjectImage(index, { imageUrl: event.target.value })
                        }
                        className="input mt-3"
                        placeholder="https://..."
                      />
                      <button
                        onClick={() => removeProjectImage(index)}
                        className="mt-2 rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

            <aside className="flex flex-col gap-6">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
                <h3 className="mb-4 text-base font-semibold text-zinc-100 border-b border-zinc-800 pb-2">
                  Project Settings
                </h3>
              <div className="mt-3 grid gap-3">
                <Field label="Slug">
                  <input
                    value={projectForm.slug}
                    onChange={(event) =>
                      updateProjectField("slug", event.target.value)
                    }
                    className="input"
                  />
                </Field>
                <Field label="Sort order">
                  <input
                    type="number"
                    value={projectForm.sortOrder}
                    onChange={(event) =>
                      updateProjectField("sortOrder", Number(event.target.value))
                    }
                    className="input"
                  />
                </Field>
                <Field label="Published">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={projectForm.isPublished}
                      onChange={(event) =>
                        updateProjectField("isPublished", event.target.checked)
                      }
                    />
                    Show this project on public site
                  </label>
                </Field>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
              <h3 className="mb-4 text-base font-semibold text-zinc-100 border-b border-zinc-800 pb-2">Actions</h3>
              <div className="flex flex-col gap-3">
                <button
                  onClick={saveProject}
                  disabled={savingProject}
                  className="rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-cyan-950 shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-400 disabled:opacity-60"
                >
                  {savingProject ? "Saving..." : "Save Project"}
                </button>
                {selectedProjectId !== "new" ? (
                  <button
                    onClick={deleteProject}
                    className="rounded-lg border border-red-900/50 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                  >
                    Delete Project
                  </button>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: import("react").ReactNode;
}) {
  return (
    <label className="flex flex-col space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 ml-1">
        {label}
      </span>
      {children}
    </label>
  );
}
