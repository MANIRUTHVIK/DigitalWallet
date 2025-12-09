"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { z } from "zod";

const reportSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  summary: z.string().optional(),
  fileUrl: z.string().url("Invalid file URL"),
  fileType: z.enum(["pdf", "image"]),
  publicId: z.string().min(1, "Public ID is required"),
  uploadedAt: z.string().datetime(),
});

export async function saveReport(data: z.infer<typeof reportSchema>) {
  try {
    const user = await getOrCreateUser();

    const validatedData = reportSchema.parse(data);

    const report = await prisma.report.create({
      data: {
        userId: user.id,
        title: validatedData.title,
        description: validatedData.description || null,
        summary: validatedData.summary || null,
        fileUrl: validatedData.fileUrl,
        fileType: validatedData.fileType,
        publicId: validatedData.publicId,
        uploadedAt: new Date(validatedData.uploadedAt),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return { success: true, reportId: report.id };
  } catch (error) {
    console.error("Error saving report:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to save report" };
  }
}

export async function getReports(filters?: {
  startDate?: string;
  endDate?: string;
  vitalType?: string;
}) {
  try {
    const user = await getOrCreateUser();

    const where: any = {
      userId: user.id,
    };

    if (filters?.startDate || filters?.endDate) {
      where.uploadedAt = {};
      if (filters.startDate) {
        where.uploadedAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.uploadedAt.lte = new Date(filters.endDate);
      }
    }

    if (filters?.vitalType) {
      where.vitals = {
        some: {
          vitalType: filters.vitalType,
        },
      };
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        vitals: true,
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    return { success: true, reports };
  } catch (error) {
    console.error("Error fetching reports:", error);
    return { success: false, error: "Failed to fetch reports", reports: [] };
  }
}

export async function getReportById(reportId: string) {
  try {
    const user = await getOrCreateUser();

    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId: user.id,
      },
      include: {
        vitals: {
          orderBy: {
            recordedAt: "asc",
          },
        },
      },
    });

    if (!report) {
      return { success: false, error: "Report not found", report: null };
    }

    return { success: true, report };
  } catch (error) {
    console.error("Error fetching report:", error);
    return { success: false, error: "Failed to fetch report", report: null };
  }
}

export async function deleteReport(reportId: string) {
  try {
    const user = await getOrCreateUser();

    await prisma.report.delete({
      where: {
        id: reportId,
        userId: user.id,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return { success: true };
  } catch (error) {
    console.error("Error deleting report:", error);
    return { success: false, error: "Failed to delete report" };
  }
}
