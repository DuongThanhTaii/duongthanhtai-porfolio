"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProfileDTO, ProjectDTO, ProjectImageDTO, SocialLinkDTO } from "@/types/admin";

const emptyProfile: ProfileDTO = {
  author: "",
  role: "",
  email: "",
  about: "",
  resumeUrl: null,
  resumePublicId: null,
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

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profile, setProfile] = useState<ProfileDTO>(emptyProfile);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | "new">("new");
  const [projectForm, setProjectForm] = useState<ProjectDTO>(emptyProject);
  const [savingProject, setSavingProject] = useState(false);
  const [status, setStatus] = useState("");

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
      return;
    }
    setProjectForm(selectedProject);
  }, [selectedProject]);

  function updateProfileField<K extends keyof ProfileDTO>(key: K, value: ProfileDTO[K]) {
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
        { platform: "github", url: "https://", isActive: true, sortOrder: prev.socialLinks.length },
      ],
    }));
  }

  function removeSocialLink(index: number) {
    setProfile((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  }

  async function onUploadResume(file: File) {
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

    setProfile((prev) => ({
      ...prev,
      resumeUrl: data.secure_url,
      resumePublicId: data.public_id,
    }));
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
      setStatus(error instanceof Error ? error.message : "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  function updateProjectField<K extends keyof ProjectDTO>(key: K, value: ProjectDTO[K]) {
    setProjectForm((prev) => ({ ...prev, [key]: value }));
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
      images: [...prev.images, { imageUrl: url, imagePublicId: null, sortOrder: prev.images.length }],
    }));
  }

  function removeProjectImage(index: number) {
    setProjectForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  async function uploadProjectImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload/image", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Image upload failed.");
    }

    addProjectImage(data.secure_url);
  }

  async function uploadCoverImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload/image", { method: "POST", body: formData });
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
      const payload = {
        ...projectForm,
        githubUrl: projectForm.githubUrl || "",
      };

      const url = selectedProjectId === "new" ? "/api/admin/projects" : `/api/admin/projects/${selectedProjectId}`;
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

      const projectsRes = await fetch("/api/admin/projects", { cache: "no-store" });
      const projectsData = (await projectsRes.json()) as ProjectDTO[];
      setProjects(projectsData);
      setStatus("Project saved.");
      if (selectedProjectId === "new" && data.id) {
        setSelectedProjectId(data.id);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save project.");
    } finally {
      setSavingProject(false);
    }
  }

  async function deleteProject() {
    if (selectedProjectId === "new") return;
    const okay = window.confirm("Delete this project?");
    if (!okay) return;

    setStatus("");
    const response = await fetch(`/api/admin/projects/${selectedProjectId}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Delete failed.");
      return;
    }

    setProjects((prev) => prev.filter((project) => project.id !== selectedProjectId));
    setSelectedProjectId("new");
    setProjectForm(emptyProject);
    setStatus("Project deleted.");
  }

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-24 text-zinc-300">Loading admin dashboard...</div>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 text-zinc-200">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Admin</h1>
          <p className="text-sm text-zinc-400">Private dashboard for your portfolio content.</p>
        </div>
        <button
          onClick={logout}
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm hover:border-zinc-500"
        >
          Logout
        </button>
      </div>

      {status ? <p className="mb-4 rounded-md bg-zinc-900 px-3 py-2 text-sm">{status}</p> : null}

      <section className="mb-10 rounded-xl border border-zinc-700 bg-zinc-900/60 p-5">
        <h2 className="mb-4 text-xl font-semibold">Profile, Social & Resume</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Author">
            <input
              value={profile.author}
              onChange={(event) => updateProfileField("author", event.target.value)}
              className="input"
            />
          </Field>
          <Field label="Role">
            <input
              value={profile.role}
              onChange={(event) => updateProfileField("role", event.target.value)}
              className="input"
            />
          </Field>
          <Field label="Email">
            <input
              value={profile.email}
              onChange={(event) => updateProfileField("email", event.target.value)}
              className="input"
            />
          </Field>
          <Field label="Resume PDF">
            <div className="flex gap-2">
              <input
                type="file"
                accept="application/pdf"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    await onUploadResume(file);
                    setStatus("Resume uploaded.");
                  } catch (error) {
                    setStatus(error instanceof Error ? error.message : "Resume upload failed.");
                  }
                }}
                className="input"
              />
            </div>
            {profile.resumeUrl ? (
              <a href="/resume" target="_blank" className="mt-1 inline-block text-xs text-cyan-400 hover:underline">
                Preview resume in website
              </a>
            ) : null}
          </Field>
          <Field label="About">
            <textarea
              value={profile.about}
              onChange={(event) => updateProfileField("about", event.target.value)}
              className="input min-h-28"
            />
          </Field>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">Social links</h3>
            <button onClick={addSocialLink} className="rounded border border-zinc-700 px-2 py-1 text-xs">
              Add
            </button>
          </div>
          <div className="space-y-2">
            {profile.socialLinks.map((link, index) => (
              <div key={`${link.platform}-${index}`} className="grid gap-2 md:grid-cols-5">
                <input
                  value={link.platform}
                  onChange={(event) => updateSocialLink(index, { platform: event.target.value })}
                  className="input md:col-span-1"
                  placeholder="platform"
                />
                <input
                  value={link.url}
                  onChange={(event) => updateSocialLink(index, { url: event.target.value })}
                  className="input md:col-span-3"
                  placeholder="url"
                />
                <button
                  onClick={() => removeSocialLink(index)}
                  className="rounded border border-zinc-700 px-2 py-1 text-xs hover:border-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={saveProfile}
          disabled={savingProfile}
          className="mt-6 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
        >
          {savingProfile ? "Saving..." : "Save profile"}
        </button>
      </section>

      <section className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Projects CRUD</h2>
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

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Slug">
            <input
              value={projectForm.slug}
              onChange={(event) => updateProjectField("slug", event.target.value)}
              className="input"
            />
          </Field>
          <Field label="Title">
            <input
              value={projectForm.title}
              onChange={(event) => updateProjectField("title", event.target.value)}
              className="input"
            />
          </Field>
          <Field label="Category">
            <input
              value={projectForm.category}
              onChange={(event) => updateProjectField("category", event.target.value)}
              className="input"
            />
          </Field>
          <Field label="Sort order">
            <input
              type="number"
              value={projectForm.sortOrder}
              onChange={(event) => updateProjectField("sortOrder", Number(event.target.value))}
              className="input"
            />
          </Field>
          <Field label="Live URL">
            <input
              value={projectForm.liveUrl}
              onChange={(event) => updateProjectField("liveUrl", event.target.value)}
              className="input"
            />
          </Field>
          <Field label="GitHub URL">
            <input
              value={projectForm.githubUrl ?? ""}
              onChange={(event) => updateProjectField("githubUrl", event.target.value)}
              className="input"
            />
          </Field>
          <Field label="Frontend tech (comma separated)">
            <input
              value={projectForm.frontendTech.join(", ")}
              onChange={(event) =>
                updateProjectField(
                  "frontendTech",
                  event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
              className="input"
            />
          </Field>
          <Field label="Backend tech (comma separated)">
            <input
              value={projectForm.backendTech.join(", ")}
              onChange={(event) =>
                updateProjectField(
                  "backendTech",
                  event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
              className="input"
            />
          </Field>
          <Field label="Published">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={projectForm.isPublished}
                onChange={(event) => updateProjectField("isPublished", event.target.checked)}
              />
              Show this project on public site
            </label>
          </Field>
          <Field label="Cover image">
            <div className="space-y-2">
              <input
                value={projectForm.coverImageUrl ?? ""}
                onChange={(event) => updateProjectField("coverImageUrl", event.target.value)}
                className="input"
                placeholder="https://..."
              />
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
                    setStatus(error instanceof Error ? error.message : "Cover upload failed.");
                  }
                }}
                className="input"
              />
            </div>
          </Field>
          <Field label="Short description">
            <textarea
              value={projectForm.shortDescription}
              onChange={(event) => updateProjectField("shortDescription", event.target.value)}
              className="input min-h-24"
            />
          </Field>
          <Field label="Long description">
            <textarea
              value={projectForm.longDescription}
              onChange={(event) => updateProjectField("longDescription", event.target.value)}
              className="input min-h-36"
            />
          </Field>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">Project screenshots</h3>
            <div className="flex items-center gap-2">
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
                    setStatus(error instanceof Error ? error.message : "Upload failed.");
                  }
                }}
                className="input w-64"
              />
              <button onClick={() => addProjectImage()} className="rounded border border-zinc-700 px-2 py-1 text-xs">
                Add empty field
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {projectForm.images.map((image, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-6">
                <input
                  value={image.imageUrl}
                  onChange={(event) => updateProjectImage(index, { imageUrl: event.target.value })}
                  className="input md:col-span-5"
                  placeholder="https://..."
                />
                <button
                  onClick={() => removeProjectImage(index)}
                  className="rounded border border-zinc-700 px-2 py-1 text-xs hover:border-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={saveProject}
            disabled={savingProject}
            className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
          >
            {savingProject ? "Saving..." : "Save project"}
          </button>
          {selectedProjectId !== "new" ? (
            <button
              onClick={deleteProject}
              className="rounded-md border border-red-600 px-4 py-2 text-sm text-red-400 hover:bg-red-950/40"
            >
              Delete project
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: import("react").ReactNode }) {
  return (
    <label className="space-y-1">
      <span className="text-xs uppercase tracking-wide text-zinc-400">{label}</span>
      {children}
    </label>
  );
}
