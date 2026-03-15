"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FAILURETOAST, SUCCESSTOAST } from "@/lib/constants/app.constants";
import { Calendar, Hash, CalendarDays } from "lucide-react";
import {
  NEPALI_MONTHS,
  getNepaliYearOptions,
  calculateEnglishDates,
} from "@/lib/nepali-date.utils";
import { cn } from "@/lib/utils";
import { api } from "@/http/api/api";
import { useRouter } from "next/navigation";
import { privateApi } from "@/http/api/privateApi";

interface CreateRecordYearDTO {
  title: string;
  nepaliYear: number;
  nepaliMonth: number;
  nepaliMonthName: string;
  startDate: Date;
  endDate: Date;
}

const CreateRecordYearForm = () => {
  const queryClient = useQueryClient();
  const navigate = useRouter();

  const [formData, setFormData] = useState<CreateRecordYearDTO>({
    title: "",
    nepaliYear: getNepaliYearOptions()[5] || 2081, // Default to current year
    nepaliMonth: 1,
    nepaliMonthName: "बैशाख",
    startDate: new Date(),
    endDate: new Date(),
  });

  const [selectedMonth, setSelectedMonth] = useState<number>(1);

  const mutation = useMutation({
    mutationFn: (data: CreateRecordYearDTO) =>
      privateApi.post("/recordYear", data),
    onSuccess: () => {
      toast.success("Record year created successfully", {
        style: {
          background: SUCCESSTOAST,
          color: "#fff",
        },
      });
      queryClient.invalidateQueries({ queryKey: ["recordYears"] });
      navigate.push("/admin/dashboard/records");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data.message || "Something went wrong", {
        style: {
          background: FAILURETOAST,
          color: "#fff",
        },
      });
    },
  });

  const handleYearChange = (year: number) => {
    const month = NEPALI_MONTHS.find((m) => m.month === selectedMonth);
    const { startDate, endDate } = calculateEnglishDates(year, selectedMonth);

    const title = `${year}/${selectedMonth.toString().padStart(2, "0")} - ${month?.english}`;

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
    const month = NEPALI_MONTHS.find((m) => m.month === monthNumber);
    setSelectedMonth(monthNumber);

    const { startDate, endDate } = calculateEnglishDates(
      formData.nepaliYear,
      monthNumber,
    );

    const title = `${formData.nepaliYear}/${monthNumber.toString().padStart(2, "0")} - ${month?.english}`;

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
    mutation.mutate(formData);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Create New Record Year
        </h1>
        <p className="text-primary">
          Select Nepali year and month to create a new record period
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Nepali Date Selection */}
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
                  Nepali Year
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
                    onClick={() => handleYearChange(year)}
                    className={cn(
                      "h-10 cursor-pointer",
                      formData.nepaliYear === year &&
                        "bg-primary text-primary-foreground cursor-pointer",
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
                  Nepali Month
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
                    onClick={() => handleMonthChange(month.month)}
                    className={cn(
                      "h-12 flex-col items-center justify-center cursor-pointer",
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

          {/* Preview Section */}
          <div className="rounded-lg bg-muted p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Record Year Preview</h3>
                <p className="text-sm text-muted-foreground">
                  This is how your record year will appear
                </p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Title</p>
                <div className="p-3 bg-background rounded border">
                  <p className="font-medium">{formData.title}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Nepali Date</p>
                <div className="p-3 bg-background rounded border">
                  <p className="font-medium">
                    {formData.nepaliYear} /{" "}
                    {formData.nepaliMonth.toString().padStart(2, "0")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formData.nepaliMonthName}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Duration</p>
                <div className="p-3 bg-background rounded border">
                  <p className="font-medium">
                    {formatDate(formData.startDate)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    to {formatDate(formData.endDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate.push("/admin/dashboard/records")}
            disabled={mutation.isPending}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 cursor-pointer"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                Creating...
              </>
            ) : (
              "Create Record Year"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateRecordYearForm;
