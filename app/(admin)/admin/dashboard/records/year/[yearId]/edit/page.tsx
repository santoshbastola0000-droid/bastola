"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FAILURETOAST, SUCCESSTOAST } from "@/lib/constants/app.constants";
import {
  Calendar,
  Hash,
  CalendarDays,
  Loader2,
  Save,
  ArrowLeft,
  Eye,
  Pencil,
  X,
} from "lucide-react";
import {
  NEPALI_MONTHS,
  getNepaliYearOptions,
  calculateEnglishDates,
} from "@/lib/nepali-date.utils";
import { cn } from "@/lib/utils";
import { UpdateRecordYearDTO, RecordYear } from "@/types/record-year.types";
import { recordYearService } from "@/http/services/record-year.service";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EditRecordYearPage() {
  const router = useRouter();
  const params = useParams();
  const recordYearId = params.yearId as string;
  const queryClient = useQueryClient();

  const [isEditMode, setIsEditMode] = useState(true);
  const [formData, setFormData] = useState<UpdateRecordYearDTO>({
    title: "",
    nepaliYear: getNepaliYearOptions()[5] || 2081,
    nepaliMonth: 1,
    nepaliMonthName: "बैशाख",
    startDate: new Date(),
    endDate: new Date(),
  });

  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    data: recordYear,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["recordYear", recordYearId],
    queryFn: () => recordYearService.getRecordYearById(recordYearId),
    enabled: !!recordYearId,
    retry: 1,
  });

  console.log("recordYearId", recordYear);

  useEffect(() => {
    if (recordYear && !isInitialized) {
      try {
        if (!recordYear.nepaliMonth || !recordYear.nepaliYear) {
          console.error("Missing required data:", {
            nepaliMonth: recordYear.nepaliMonth,
            nepaliYear: recordYear.nepaliYear,
          });
          toast.error("Record year data is incomplete");
          return;
        }

        // Convert string dates to Date objects with validation
        const startDate = recordYear.startDate
          ? new Date(recordYear.startDate)
          : new Date();
        const endDate = recordYear.endDate
          ? new Date(recordYear.endDate)
          : new Date();

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error("Invalid dates:", {
            startDate: recordYear.startDate,
            endDate: recordYear.endDate,
          });
          toast.error("Record year has invalid dates");
          return;
        }

        const monthName =
          recordYear.nepaliMonthName ||
          NEPALI_MONTHS.find((m) => m.month === recordYear.nepaliMonth)?.name ||
          "बैशाख";

        const title =
          recordYear.title ||
          `${recordYear.nepaliYear}/${recordYear.nepaliMonth.toString().padStart(2, "0")} - ${
            NEPALI_MONTHS.find((m) => m.month === recordYear.nepaliMonth)
              ?.english || ""
          }`;

        setFormData({
          title: title,
          nepaliYear: recordYear.nepaliYear,
          nepaliMonth: recordYear.nepaliMonth,
          nepaliMonthName: monthName,
          startDate,
          endDate,
        });

        setSelectedMonth(recordYear.nepaliMonth);
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing form:", error);
        toast.error("Failed to load record year data");
      }
    }
  }, [recordYear, isInitialized]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateRecordYearDTO) =>
      recordYearService.updateRecordYear(recordYearId, data),
    onSuccess: (updatedRecord: RecordYear) => {
      toast.success("Record year updated successfully", {
        style: {
          background: SUCCESSTOAST,
          color: "#fff",
        },
      });

      queryClient.invalidateQueries({ queryKey: ["recordYears"] });
      queryClient.invalidateQueries({ queryKey: ["recordYear", recordYearId] });

      queryClient.setQueryData(["recordYear", recordYearId], updatedRecord);

      router.push("/admin/dashboard/records");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update record year",
        {
          style: {
            background: FAILURETOAST,
            color: "#fff",
          },
        },
      );
    },
  });

  const handleYearChange = (year: number) => {
    if (!isEditMode) return;

    const month = NEPALI_MONTHS.find((m) => m.month === selectedMonth);
    const { startDate, endDate } = calculateEnglishDates(year, selectedMonth);

    const title = `${year}/${selectedMonth.toString().padStart(2, "0")} - ${month?.english || ""}`;

    setFormData({
      ...formData,
      nepaliYear: year,
      title,
      nepaliMonthName: month?.name || "",
      startDate,
      endDate,
    });
  };

  const handleMonthChange = (monthNumber: number) => {
    if (!isEditMode) return;

    const month = NEPALI_MONTHS.find((m) => m.month === monthNumber);
    setSelectedMonth(monthNumber);

    const { startDate, endDate } = calculateEnglishDates(
      formData.nepaliYear!,
      monthNumber,
    );

    const title = `${formData.nepaliYear}/${monthNumber
      .toString()
      .padStart(2, "0")} - ${month?.english || ""}`;

    setFormData({
      ...formData,
      nepaliMonth: monthNumber,
      title,
      nepaliMonthName: month?.name || "",
      startDate,
      endDate,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!formData.nepaliYear || !formData.nepaliMonth) {
      toast.error("Please select both year and month");
      return;
    }

    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    router.push("/admin/dashboard/records");
  };

  const resetToOriginal = () => {
    if (recordYear) {
      try {
        const startDate = recordYear.startDate
          ? new Date(recordYear.startDate)
          : new Date();
        const endDate = recordYear.endDate
          ? new Date(recordYear.endDate)
          : new Date();

        const monthName =
          recordYear.nepaliMonthName ||
          NEPALI_MONTHS.find((m) => m.month === recordYear.nepaliMonth)?.name ||
          "बैशाख";

        const title =
          recordYear.title ||
          `${recordYear.nepaliYear}/${recordYear.nepaliMonth.toString().padStart(2, "0")} - ${
            NEPALI_MONTHS.find((m) => m.month === recordYear.nepaliMonth)
              ?.english || ""
          }`;

        setFormData({
          title: title,
          nepaliYear: recordYear.nepaliYear,
          nepaliMonth: recordYear.nepaliMonth,
          nepaliMonthName: monthName,
          startDate,
          endDate,
        });

        setSelectedMonth(recordYear.nepaliMonth);
        toast.info("Form reset to original values", {
          style: {
            background: "hsl(var(--muted))",
            color: "hsl(var(--muted-foreground))",
          },
        });
      } catch (error) {
        console.error("Error resetting form:", error);
        toast.error("Failed to reset form");
      }
    }
  };

  const formatDate = (date: Date): string => {
    if (!date || isNaN(date.getTime())) {
      return "Invalid date";
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateShort = (date: Date): string => {
    if (!date || isNaN(date.getTime())) {
      return "Invalid date";
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleRetry = () => {
    setIsInitialized(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Header Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-48" />
        </div>

        {/* Form Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !recordYear) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="rounded-full bg-destructive/10 p-3 w-fit mx-auto mb-4">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {isError ? "Error Loading Record Year" : "Record Year Not Found"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {error?.message ||
              "The record year you're trying to edit doesn't exist or you don't have permission to access it."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.push("/admin/dashboard/records")}
              className="cursor-pointer"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Record Years
            </Button>
            <Button
              onClick={handleRetry}
              variant="outline"
              className="cursor-pointer"
            >
              <Loader2 className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if we have valid data
  if (!recordYear.nepaliMonth || !recordYear.nepaliYear) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="rounded-full bg-warning/10 p-3 w-fit mx-auto mb-4">
            <X className="h-8 w-8 text-warning" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            Invalid Record Year Data
          </h3>
          <p className="text-muted-foreground mb-6">
            The record year data is incomplete. Missing year or month
            information.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.push("/admin/dashboard/records")}
              className="cursor-pointer"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Record Years
            </Button>
            <Button
              onClick={handleRetry}
              variant="outline"
              className="cursor-pointer"
            >
              <Loader2 className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if form has been modified
  const isFormModified = () => {
    if (!recordYear) return false;

    try {
      const originalStartDate = recordYear.startDate
        ? new Date(recordYear.startDate)
        : new Date();
      const originalEndDate = recordYear.endDate
        ? new Date(recordYear.endDate)
        : new Date();

      return (
        formData.title !== recordYear.title ||
        formData.nepaliYear !== recordYear.nepaliYear ||
        formData.nepaliMonth !== recordYear.nepaliMonth ||
        formData.nepaliMonthName !==
          (recordYear.nepaliMonthName ||
            NEPALI_MONTHS.find((m) => m.month === recordYear.nepaliMonth)
              ?.name ||
            "") ||
        (formData.startDate &&
          formatDate(formData.startDate) !== formatDate(originalStartDate)) ||
        (formData.endDate &&
          formatDate(formData.endDate) !== formatDate(originalEndDate))
      );
    } catch (error) {
      console.error("Error checking form modification:", error);
      return false;
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/admin/dashboard"
              className="cursor-pointer hover:text-primary"
            >
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/admin/dashboard/records"
              className="cursor-pointer hover:text-primary"
            >
              Record Years
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Record Year</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
              Edit Record Year
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Update record year details:{" "}
            {recordYear.title ||
              `${recordYear.nepaliYear}/${recordYear.nepaliMonth.toString().padStart(2, "0")}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="cursor-pointer"
          >
            {isEditMode ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                View Mode
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Mode
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Record Year Info Card */}
      <Card className="bg-muted/30 border">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Created On</p>
              <p className="font-medium">
                {recordYear.createdAt
                  ? formatDateShort(new Date(recordYear.createdAt))
                  : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {recordYear.updatedAt
                  ? formatDateShort(new Date(recordYear.updatedAt))
                  : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="font-medium">
                {recordYear.records?.length || 0} records
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid grid-cols-1 md:grid-cols-3">
            <TabsTrigger value="details" className="cursor-pointer">
              <Calendar className="h-4 w-4 mr-2" />
              Year Details
            </TabsTrigger>
            <TabsTrigger value="preview" className="cursor-pointer">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="original" className="cursor-pointer">
              <CalendarDays className="h-4 w-4 mr-2" />
              Original Data
            </TabsTrigger>
          </TabsList>

          {/* Year Details Tab */}
          <TabsContent value="details" className="space-y-6 pt-6">
            <div className="bg-card rounded-lg border p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nepali Year */}
                <div className="space-y-3">
                  <Label
                    htmlFor="nepaliYear"
                    className="text-foreground font-medium"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="h-4 w-4" />
                      Nepali Year *
                    </div>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {getNepaliYearOptions().map((year) => (
                      <Button
                        key={year}
                        type="button"
                        variant={
                          formData.nepaliYear === year ? "default" : "outline"
                        }
                        onClick={() => isEditMode && handleYearChange(year)}
                        disabled={!isEditMode}
                        className={cn(
                          "h-10",
                          isEditMode ? "cursor-pointer" : "cursor-default",
                          formData.nepaliYear === year &&
                            "bg-primary text-primary-foreground",
                        )}
                      >
                        {year}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Nepali Month */}
                <div className="space-y-3">
                  <Label
                    htmlFor="nepaliMonth"
                    className="text-foreground font-medium"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarDays className="h-4 w-4" />
                      Nepali Month *
                    </div>
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {NEPALI_MONTHS.map((month) => (
                      <Button
                        key={month.month}
                        type="button"
                        variant={
                          selectedMonth === month.month ? "default" : "outline"
                        }
                        onClick={() =>
                          isEditMode && handleMonthChange(month.month)
                        }
                        disabled={!isEditMode}
                        className={cn(
                          "h-12 flex-col items-center justify-center",
                          isEditMode ? "cursor-pointer" : "cursor-default",
                          selectedMonth === month.month &&
                            "bg-primary text-primary-foreground",
                        )}
                      >
                        <span className="font-medium">{month.english}</span>
                        <span className="text-xs opacity-75">{month.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Auto-generated Title */}
              <div className="space-y-3">
                <Label className="text-foreground font-medium">
                  Auto-generated Title
                </Label>
                <div className="p-3 bg-background rounded border">
                  <p className="font-medium">
                    {formData.title || "Title will be generated automatically"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Format: Year/Month - English Month Name
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6 pt-6">
            <div className="bg-card rounded-lg border p-6">
              <div className="rounded-lg bg-muted p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Record Year Preview</h3>
                    <p className="text-sm text-muted-foreground">
                      This is how your updated record year will appear
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Title</p>
                    <div className="p-3 bg-background rounded border">
                      <p className="font-medium">
                        {formData.title || "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Nepali Date</p>
                    <div className="p-3 bg-background rounded border">
                      <p className="font-medium">
                        {formData.nepaliYear} /{" "}
                        {formData.nepaliMonth?.toString().padStart(2, "0") ||
                          "00"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formData.nepaliMonthName || "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Duration</p>
                    <div className="p-3 bg-background rounded border">
                      <p className="font-medium">
                        {formData.startDate
                          ? formatDate(formData.startDate)
                          : "Not set"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        to{" "}
                        {formData.endDate
                          ? formatDate(formData.endDate)
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Original Data Tab */}
          <TabsContent value="original" className="space-y-6 pt-6">
            <div className="bg-card rounded-lg border p-6">
              <div className="rounded-lg bg-muted p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Original Record Year Data</h3>
                    <p className="text-sm text-muted-foreground">
                      This is the original data before any changes
                    </p>
                  </div>
                  <CalendarDays className="h-8 w-8 text-muted-foreground" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Original Title</p>
                    <div className="p-3 bg-background rounded border">
                      <p className="font-medium">
                        {recordYear.title || "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Original Nepali Date</p>
                    <div className="p-3 bg-background rounded border">
                      <p className="font-medium">
                        {recordYear.nepaliYear} /{" "}
                        {recordYear.nepaliMonth?.toString().padStart(2, "0") ||
                          "00"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {recordYear.nepaliMonthName || "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Original Duration</p>
                    <div className="p-3 bg-background rounded border">
                      <p className="font-medium">
                        {recordYear.startDate
                          ? formatDate(new Date(recordYear.startDate))
                          : "Not set"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        to{" "}
                        {recordYear.endDate
                          ? formatDate(new Date(recordYear.endDate))
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-background pt-6 border-t mt-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1 cursor-pointer"
              disabled={updateMutation.isPending}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>

            {isEditMode && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetToOriginal}
                  className="flex-1 cursor-pointer"
                  disabled={updateMutation.isPending || !isFormModified()}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reset to Original
                </Button>

                <Button
                  type="submit"
                  className="flex-1 cursor-pointer bg-primary hover:bg-primary/90"
                  disabled={updateMutation.isPending || !isFormModified()}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Record Year
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <span>Fields marked with * are required</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${isFormModified() ? "bg-green-500" : "bg-muted"}`}
              ></div>
              <span>
                {isFormModified() ? "Changes detected" : "No changes made"}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
