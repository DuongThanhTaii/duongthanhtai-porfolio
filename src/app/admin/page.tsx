"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  ProfileDTO,
  ProjectDTO,
  ProjectImageDTO,
  SocialLinkDTO,
} from "@/types/admin";
import {
  TECH_OPTIONS,
  findTechOption,
  formatTechLabel,
  normalizeTechKey,
} from "@/lib/tech-options";
import { Download, Eye, Plus, Trash2 } from "lucide-react";

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
  const [projectForm, setProjectForm] = useState<ProjectDTO>(emptyProject);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [savingProject, setSavingProject] = useState(false);
  const [status, setStatus] = useState("");
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  const frontendOptions = useMemo(
    () => TECH_OPTIONS.filter((item) => item.group === "frontend"),
    [],
  );
  const backendOptions = useMemo(
    () => TECH_OPTIONS.filter((item) => item.group === "backend"),
    [],
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      setStatus("");
      try {
        await Promise.all([loadProfile(), loadProjects()]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function loadProfile() {
    const profileRes = await fetch("/api/admin/profile", { cache: "no-store" });
    if (!profileRes.ok) {
      setStatus("Failed to load profile.");
      return;
    }
    const profileData = (await profileRes.json()) as ProfileDTO;
    setProfile(profileData);
  }

  async function loadProjects() {
    const projectsRes = await fetch("/api/admin/projects", {
      cache: "no-store",
    });
    if (!projectsRes.ok) {
      setStatus("Failed to load projects.");
      return;
    }
    const projectsData = (await projectsRes.json()) as ProjectDTO[];
    setProjects(projectsData);
  }

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

    // update local state
    const updatedProfile = {
      ...profile,
      resumeUrl: data.secure_url,
      resumePublicId: data.public_id,
    };
    setProfile(updatedProfile);

    // persist immediately so public endpoints see the resume
    const saveRes = await fetch("/api/admin/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedProfile),
    });
    const saveData = await saveRes.json();
    if (!saveRes.ok) {
      // revert local state on failure
      setProfile((prev) => ({
        ...prev,
        resumeUrl: null,
        resumePublicId: null,
      }));
      throw new Error(saveData.error ?? "Failed to save profile after upload.");
    }
    // update state with server-canonical response
    setProfile(saveData);
  }

  async function deleteResume() {
    const response = await fetch("/api/admin/profile/resume", {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Failed to delete resume.");
    }
    setProfile((prev) => ({ ...prev, resumeUrl: null, resumePublicId: null }));
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

  function updateProjectImage(index: number, patch: Partial<ProjectImageDTO>) {
    setProjectForm((prev) => {
      const next = [...prev.images];
      next[index] = { ...next[index], ...patch };
      return { ...prev, images: next };
    });
  }

  function addProjectImage(url = "", publicId: string | null = null) {
    setProjectForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          imageUrl: url,
          imagePublicId: publicId,
          sortOrder: prev.images.length,
        },
      ],
    }));
  }

  function removeProjectImage(index: number) {
    setProjectForm((prev) => ({
      ...prev,
      images: prev.images
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, sortOrder: i })),
    }));
  }

  function openProjectEditor(project?: ProjectDTO) {
    if (project?.id) {
      setEditingProjectId(project.id);
      setProjectForm({
        ...project,
        frontendTech: project.frontendTech.map(
          (item) => findTechOption(item)?.key ?? normalizeTechKey(item),
        ),
        backendTech: project.backendTech.map(
          (item) => findTechOption(item)?.key ?? normalizeTechKey(item),
        ),
      });
    } else {
      setEditingProjectId(null);
      setProjectForm(emptyProject);
    }
    setProjectModalOpen(true);
  }

  function toggleTech(key: string, group: "frontend" | "backend") {
    setProjectForm((prev) => {
      const field = group === "frontend" ? "frontendTech" : "backendTech";
      const hasTech = prev[field].includes(key);
      const nextValues = hasTech
        ? prev[field].filter((item) => item !== key)
        : [...prev[field], key];
      return { ...prev, [field]: nextValues };
    });
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
    addProjectImage(data.secure_url, data.public_id);
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
      const payload = {
        ...projectForm,
        githubUrl: projectForm.githubUrl || "",
      };

      const url = editingProjectId
        ? `/api/admin/projects/${editingProjectId}`
        : "/api/admin/projects";
      const method = editingProjectId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save project.");
      }

      await loadProjects();
      setProjectModalOpen(false);
      setStatus("Project saved.");
      if (!editingProjectId && data.id) {
        setEditingProjectId(data.id);
      }
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to save project.",
      );
    } finally {
      setSavingProject(false);
    }
  }

  async function deleteProject(projectId: number) {
    const okay = window.confirm("Delete this project?");
    if (!okay) return;

    setStatus("");
    const response = await fetch(`/api/admin/projects/${projectId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Delete failed.");
      return;
    }

    await loadProjects();
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
            Manage CV, links and projects from one place.
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

      <section className="mb-10 rounded-xl border border-zinc-700 bg-zinc-900/60 p-5">
        <h2 className="mb-4 text-xl font-semibold">Profile, Social & Resume</h2>
        <div className="grid gap-4 md:grid-cols-2">
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
          <Field label="Resume PDF">
            <div className="space-y-2">
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
                    setStatus(
                      error instanceof Error
                        ? error.message
                        : "Resume upload failed.",
                    );
                  }
                }}
                className="input"
              />
              <div className="flex items-center gap-2">
                {profile.resumeUrl ? (
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </a>
                ) : null}
                {profile.resumeUrl ? (
                  <button
                    onClick={async () => {
                      try {
                        await deleteResume();
                        setStatus("Resume deleted.");
                      } catch (error) {
                        setStatus(
                          error instanceof Error
                            ? error.message
                            : "Resume delete failed.",
                        );
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-red-700 px-2 py-1 text-xs text-red-300 hover:bg-red-900/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
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
          <div className="space-y-2">
            {profile.socialLinks.map((link, index) => (
              <div
                key={`${link.platform}-${index}`}
                className="grid gap-2 md:grid-cols-5"
              >
                <input
                  value={link.platform}
                  onChange={(event) =>
                    updateSocialLink(index, { platform: event.target.value })
                  }
                  className="input md:col-span-1"
                  placeholder="platform"
                />
                <input
                  value={link.url}
                  onChange={(event) =>
                    updateSocialLink(index, { url: event.target.value })
                  }
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
          <h2 className="text-xl font-semibold">Projects</h2>
          <button
            onClick={() => openProjectEditor()}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950"
          >
            <Plus className="h-4 w-4" />
            New project
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-lg border border-zinc-700 bg-zinc-950/60 p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{project.title}</h3>
                  <p className="text-xs text-zinc-400">
                    {project.category} ·{" "}
                    {project.isPublished ? "Published" : "Hidden"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openProjectEditor(project)}
                    className="rounded border border-zinc-700 px-2 py-1 text-xs hover:border-zinc-500"
                  >
                    Edit
                  </button>
                  {project.id ? (
                    <button
                      onClick={() => deleteProject(project.id as number)}
                      className="rounded border border-red-700 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>

              {project.coverImageUrl ? (
                <div className="mb-3 overflow-hidden rounded-md border border-zinc-800">
                  <Image
                    src={project.coverImageUrl}
                    alt={project.title}
                    width={900}
                    height={450}
                    className="h-32 w-full object-cover"
                  />
                </div>
              ) : null}

              <p className="text-sm text-zinc-300">
                {project.shortDescription}
              </p>

              <div className="mt-3 space-y-2 text-xs text-zinc-400">
                <div className="flex flex-wrap gap-2">
                  {project.frontendTech.map((tech) => (
                    <TechTag key={`fe-${tech}`} value={tech} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.backendTech.map((tech) => (
                    <TechTag key={`be-${tech}`} value={tech} />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Dialog open={projectModalOpen} onOpenChange={setProjectModalOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-200">
          <DialogHeader>
            <DialogTitle>
              {editingProjectId ? "Edit project" : "Create project"}
            </DialogTitle>
            <DialogDescription>
              Fill details, upload screenshots and pick frontend/backend icons.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Slug">
              <input
                value={projectForm.slug}
                onChange={(event) =>
                  updateProjectField("slug", event.target.value)
                }
                className="input"
                placeholder="duong-portfolio"
              />
            </Field>
            <Field label="Title">
              <input
                value={projectForm.title}
                onChange={(event) =>
                  updateProjectField("title", event.target.value)
                }
                className="input"
              />
            </Field>
            <Field label="Category">
              <input
                value={projectForm.category}
                onChange={(event) =>
                  updateProjectField("category", event.target.value)
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
            <Field label="Live URL">
              <input
                value={projectForm.liveUrl}
                onChange={(event) =>
                  updateProjectField("liveUrl", event.target.value)
                }
                className="input"
              />
            </Field>
            <Field label="GitHub URL">
              <input
                value={projectForm.githubUrl ?? ""}
                onChange={(event) =>
                  updateProjectField("githubUrl", event.target.value)
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
            <Field label="Cover image">
              <div className="space-y-2">
                <input
                  value={projectForm.coverImageUrl ?? ""}
                  onChange={(event) =>
                    updateProjectField("coverImageUrl", event.target.value)
                  }
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
            </Field>
            <Field label="Short description">
              <textarea
                value={projectForm.shortDescription}
                onChange={(event) =>
                  updateProjectField("shortDescription", event.target.value)
                }
                className="input min-h-24"
              />
            </Field>
            <Field label="Long description">
              <textarea
                value={projectForm.longDescription}
                onChange={(event) =>
                  updateProjectField("longDescription", event.target.value)
                }
                className="input min-h-36"
              />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TechSelector
              title="Frontend Tech Icons"
              selected={projectForm.frontendTech}
              options={frontendOptions}
              onToggle={(key) => toggleTech(key, "frontend")}
            />
            <TechSelector
              title="Backend Tech Icons"
              selected={projectForm.backendTech}
              options={backendOptions}
              onToggle={(key) => toggleTech(key, "backend")}
            />
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">Project screenshots</h3>
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
                      error instanceof Error ? error.message : "Upload failed.",
                    );
                  }
                }}
                className="input w-64"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {projectForm.images.map((image, index) => (
                <div
                  key={index}
                  className="rounded-md border border-zinc-800 bg-zinc-900 p-2"
                >
                  <div className="mb-2 h-24 overflow-hidden rounded bg-zinc-950">
                    {image.imageUrl ? (
                      <Image
                        src={image.imageUrl}
                        alt={`Screenshot ${index + 1}`}
                        width={400}
                        height={220}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-zinc-500">
                        No image
                      </div>
                    )}
                  </div>
                  <input
                    value={image.imageUrl}
                    onChange={(event) =>
                      updateProjectImage(index, {
                        imageUrl: event.target.value,
                      })
                    }
                    className="input mb-2 text-xs"
                    placeholder="https://..."
                  />
                  <button
                    onClick={() => removeProjectImage(index)}
                    className="w-full rounded border border-red-700 px-2 py-1 text-xs text-red-300 hover:bg-red-900/40"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setProjectModalOpen(false)}
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={saveProject}
              disabled={savingProject}
              className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
            >
              {savingProject ? "Saving..." : "Save project"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
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
    <label className="space-y-1">
      <span className="text-xs uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function TechSelector({
  title,
  selected,
  options,
  onToggle,
}: {
  title: string;
  selected: string[];
  options: typeof TECH_OPTIONS;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
      <p className="mb-2 text-xs uppercase tracking-wide text-zinc-400">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const active = selected.includes(option.key);
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onToggle(option.key)}
              className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs transition ${
                active
                  ? "border-cyan-500 bg-cyan-900/30 text-cyan-100"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              <span className="text-base">{option.icon}</span>
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TechTag({ value }: { value: string }) {
  const option = findTechOption(value);
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-2 py-0.5 text-[11px]">
      <span className="text-sm">{option?.icon ?? null}</span>
      {formatTechLabel(value)}
    </span>
  );
}
