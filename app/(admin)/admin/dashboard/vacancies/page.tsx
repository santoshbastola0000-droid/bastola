"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Edit3,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  jobPostingService,
  type JobPosting,
  type JobPostingInput,
  type JobStatus,
} from "@/http/services/job-posting.service";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const emptyForm: JobPostingInput = {
  userId: "admin",
  companyName: "",
  jobTitle: "",
  category: "",
  location: "",
  salary: null,
  experience: "",
  contactPhone: "",
  description: "",
  status: "PENDING",
};

export default function VacanciesPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | JobStatus>("ALL");

  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] =
    useState<JobPosting | null>(null);

  const [form, setForm] =
    useState<JobPostingInput>(emptyForm);

  const {
    data: jobs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-vacancies"],
    queryFn: () => jobPostingService.getAll(),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return jobs.filter((job) => {
      if (
        statusFilter !== "ALL" &&
        job.status !== statusFilter
      ) {
        return false;
      }

      if (!q) return true;

      return [
        job.jobTitle,
        job.companyName,
        job.category,
        job.location,
        job.contactPhone,
        job.experience,
      ]
        .filter(Boolean)
        .some((v) =>
          String(v).toLowerCase().includes(q),
        );
    });
  }, [jobs, search, statusFilter]);

  const createMutation = useMutation({
    mutationFn: (payload: JobPostingInput) =>
      jobPostingService.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-vacancies"],
      });

      toast.success("Vacancy added");
      closeForm();
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          "Could not add vacancy",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<JobPostingInput>;
    }) =>
      jobPostingService.update(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-vacancies"],
      });

      toast.success("Vacancy updated");
      closeForm();
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          "Could not update vacancy",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      jobPostingService.remove(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-vacancies"],
      });

      toast.success("Vacancy deleted");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          "Could not delete vacancy",
      );
    },
  });

  const openCreate = () => {
    setEditingJob(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (job: JobPosting) => {
    setEditingJob(job);

    setForm({
      userId: job.userId || "admin",
      companyName: job.companyName || "",
      jobTitle: job.jobTitle || "",
      category: job.category || "",
      location: job.location || "",
      salary: job.salary ?? null,
      experience: job.experience || "",
      contactPhone: job.contactPhone || "",
      description: job.description || "",
      status:
        (job.status as JobStatus) || "PENDING",
    });

    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingJob(null);
    setForm(emptyForm);
  };

  const submitForm = () => {
    if (!form.jobTitle.trim()) {
      toast.error("Job title is required");
      return;
    }

    if (!form.location.trim()) {
      toast.error("Location is required");
      return;
    }

    if (!form.contactPhone.trim()) {
      toast.error("Contact phone is required");
      return;
    }

    const payload = {
      ...form,
      companyName:
        form.companyName?.trim() || undefined,
      category: form.category?.trim() || undefined,
      jobTitle: form.jobTitle.trim(),
      location: form.location.trim(),
      experience:
        form.experience?.trim() || undefined,
      contactPhone: form.contactPhone.trim(),
      description:
        form.description?.trim() || undefined,
      salary:
        form.salary === null ||
        form.salary === undefined ||
        Number.isNaN(Number(form.salary))
          ? null
          : Number(form.salary),
    };

    if (editingJob) {
      updateMutation.mutate({
        id: editingJob.id,
        payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const changeStatus = (
    job: JobPosting,
    status: JobStatus,
  ) => {
    updateMutation.mutate({
      id: job.id,
      payload: { status },
    });
  };

  const handleDelete = (job: JobPosting) => {
    const ok = window.confirm(
      `Delete vacancy "${job.jobTitle}"?`,
    );

    if (!ok) return;

    deleteMutation.mutate(job.id);
  };

  const statusBadge = (status: string) => {
    if (status === "APPROVED") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          Approved
        </Badge>
      );
    }

    if (status === "REJECTED") {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          Rejected
        </Badge>
      );
    }

    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        Pending
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="mb-4 text-destructive">
            Vacancies load गर्न सकिएन।
          </p>

          <Button onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const approved =
    jobs.filter((j) => j.status === "APPROVED")
      .length;

  const pending =
    jobs.filter((j) => j.status === "PENDING")
      .length;

  const rejected =
    jobs.filter((j) => j.status === "REJECTED")
      .length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-6 w-6 text-red-600" />
            <h1 className="text-2xl font-bold">
              Vacancies
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Add, edit, approve and delete job vacancies
          </p>
        </div>

        <Button
          onClick={openCreate}
          className="gap-2 bg-red-600 text-white hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Add Vacancy
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["ALL", "All", jobs.length],
          ["PENDING", "Pending", pending],
          ["APPROVED", "Approved", approved],
          ["REJECTED", "Rejected", rejected],
        ].map(([key, label, count]) => (
          <button
            key={String(key)}
            type="button"
            onClick={() =>
              setStatusFilter(
                key as "ALL" | JobStatus,
              )
            }
            className={`rounded-2xl border p-4 text-left transition ${
              statusFilter === key
                ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                : "bg-background hover:shadow-sm"
            }`}
          >
            <p className="text-sm font-semibold">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold">
              {count}
            </p>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search title, company, location, category..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <BriefcaseBusiness className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">
              No vacancies found
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold">
                        {job.jobTitle}
                      </h2>

                      {statusBadge(job.status)}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                      {job.companyName && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {job.companyName}
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>

                      {job.salary != null && (
                        <span>
                          Rs.{" "}
                          {Number(
                            job.salary,
                          ).toLocaleString()}
                        </span>
                      )}

                      {job.category && (
                        <span>{job.category}</span>
                      )}
                    </div>

                    {job.experience && (
                      <p className="mt-3 text-sm">
                        <span className="font-medium">
                          Experience:
                        </span>{" "}
                        {job.experience}
                      </p>
                    )}

                    {job.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {job.description}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-muted-foreground">
                      Contact: {job.contactPhone}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {job.status !== "APPROVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          changeStatus(
                            job,
                            "APPROVED",
                          )
                        }
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                    )}

                    {job.status !== "PENDING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          changeStatus(
                            job,
                            "PENDING",
                          )
                        }
                      >
                        Pending
                      </Button>
                    )}

                    {job.status !== "REJECTED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          changeStatus(
                            job,
                            "REJECTED",
                          )
                        }
                      >
                        Reject
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        openEdit(job)
                      }
                    >
                      <Edit3 className="mr-1 h-4 w-4" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleDelete(job)
                      }
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {formOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          onClick={closeForm}
        >
          <div
            className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-background shadow-2xl sm:rounded-3xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 p-4 backdrop-blur">
              <div>
                <h2 className="text-lg font-bold">
                  {editingJob
                    ? "Edit Vacancy"
                    : "Add Vacancy"}
                </h2>

                <p className="text-xs text-muted-foreground">
                  Vacancy information
                </p>
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={closeForm}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Job Title *
                </label>

                <Input
                  value={form.jobTitle}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      jobTitle:
                        e.target.value,
                    }))
                  }
                  placeholder="Waiter"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  Company
                </label>

                <Input
                  value={
                    form.companyName || ""
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      companyName:
                        e.target.value,
                    }))
                  }
                  placeholder="ABC Hotel"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  Category
                </label>

                <Input
                  value={form.category || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      category:
                        e.target.value,
                    }))
                  }
                  placeholder="Hospitality"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  Location *
                </label>

                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      location:
                        e.target.value,
                    }))
                  }
                  placeholder="Lakeside, Pokhara"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  Salary
                </label>

                <Input
                  type="number"
                  value={
                    form.salary ?? ""
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      salary:
                        e.target.value === ""
                          ? null
                          : Number(
                              e.target.value,
                            ),
                    }))
                  }
                  placeholder="18000"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  Experience
                </label>

                <Input
                  value={
                    form.experience || ""
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      experience:
                        e.target.value,
                    }))
                  }
                  placeholder="1 year"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  Contact Phone *
                </label>

                <Input
                  value={form.contactPhone}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      contactPhone:
                        e.target.value,
                    }))
                  }
                  placeholder="98XXXXXXXX"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status:
                        e.target
                          .value as JobStatus,
                    }))
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="APPROVED">
                    APPROVED
                  </option>
                  <option value="PENDING">
                    PENDING
                  </option>
                  <option value="REJECTED">
                    REJECTED
                  </option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium">
                  Description
                </label>

                <textarea
                  value={
                    form.description || ""
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      description:
                        e.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="Job description..."
                  className="w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background p-4">
              <Button
                variant="outline"
                onClick={closeForm}
              >
                Cancel
              </Button>

              <Button
                onClick={submitForm}
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {(createMutation.isPending ||
                  updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                {editingJob
                  ? "Save Changes"
                  : "Add Vacancy"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
