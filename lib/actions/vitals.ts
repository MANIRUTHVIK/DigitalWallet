"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { z } from "zod";

const vitalSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  vitalType: z.string().min(1, "Vital type is required"),
  value: z.number().positive("Value must be positive"),
  unit: z.string().min(1, "Unit is required"),
  recordedAt: z.string().datetime(),
});

export async function saveVital(data: z.infer<typeof vitalSchema>) {
  try {
    const user = await getOrCreateUser();

    // Verify report belongs to user
    const report = await prisma.report.findFirst({
      where: {
        id: data.reportId,
        userId: user.id,
      },
    });

    if (!report) {
      return { success: false, error: "Report not found" };
    }

    const validatedData = vitalSchema.parse(data);

    const vital = await prisma.vital.create({
      data: {
        reportId: validatedData.reportId,
        vitalType: validatedData.vitalType,
        value: validatedData.value,
        unit: validatedData.unit,
        recordedAt: new Date(validatedData.recordedAt),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/reports/${data.reportId}`);

    return { success: true, vitalId: vital.id };
  } catch (error) {
    console.error("Error saving vital:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to save vital" };
  }
}

export async function saveVitals(vitals: z.infer<typeof vitalSchema>[]) {
  try {
    const user = await getOrCreateUser();

    if (vitals.length === 0) {
      return { success: true, count: 0 };
    }

    // Verify report belongs to user
    const report = await prisma.report.findFirst({
      where: {
        id: vitals[0].reportId,
        userId: user.id,
      },
    });

    if (!report) {
      return { success: false, error: "Report not found" };
    }

    const validatedVitals = vitals.map((v) => vitalSchema.parse(v));

    const createdVitals = await prisma.vital.createMany({
      data: validatedVitals.map((v) => ({
        reportId: v.reportId,
        vitalType: v.vitalType,
        value: v.value,
        unit: v.unit,
        recordedAt: new Date(v.recordedAt),
      })),
    });

    revalidatePath("/dashboard");
    revalidatePath(`/reports/${vitals[0].reportId}`);

    return { success: true, count: createdVitals.count };
  } catch (error) {
    console.error("Error saving vitals:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to save vitals" };
  }
}

export async function getVitals(vitalType?: string) {
  try {
    const user = await getOrCreateUser();

    const where: any = {
      report: {
        userId: user.id,
      },
    };

    if (vitalType) {
      where.vitalType = vitalType;
    }

    const vitals = await prisma.vital.findMany({
      where,
      include: {
        report: {
          select: {
            id: true,
            title: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: {
        recordedAt: "asc",
      },
    });

    return { success: true, vitals };
  } catch (error) {
    console.error("Error fetching vitals:", error);
    return { success: false, error: "Failed to fetch vitals", vitals: [] };
  }
}

export async function getVitalsByType() {
  try {
    const user = await getOrCreateUser();

    const vitals = await prisma.vital.findMany({
      where: {
        report: {
          userId: user.id,
        },
      },
      include: {
        report: {
          select: {
            id: true,
            title: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: {
        recordedAt: "asc",
      },
    });

    // Group vitals by type
    const groupedVitals = vitals.reduce(
      (acc: Record<string, typeof vitals>, vital: any) => {
        if (!acc[vital.vitalType]) {
          acc[vital.vitalType] = [];
        }
        acc[vital.vitalType].push(vital);
        return acc;
      },
      {} as Record<string, typeof vitals>
    );

    return { success: true, vitals: groupedVitals };
  } catch (error) {
    console.error("Error fetching vitals by type:", error);
    return { success: false, error: "Failed to fetch vitals", vitals: {} };
  }
}

export async function deleteVital(vitalId: string) {
  try {
    const user = await getOrCreateUser();

    // Verify vital belongs to user's report
    const vital = await prisma.vital.findFirst({
      where: {
        id: vitalId,
        report: {
          userId: user.id,
        },
      },
    });

    if (!vital) {
      return { success: false, error: "Vital not found" };
    }

    await prisma.vital.delete({
      where: {
        id: vitalId,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/reports/${vital.reportId}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting vital:", error);
    return { success: false, error: "Failed to delete vital" };
  }
}
