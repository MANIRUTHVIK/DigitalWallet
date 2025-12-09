"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { z } from "zod";

const shareTokenSchema = z
  .object({
    reportIds: z.array(z.string()).min(1, "At least one report is required"),
    expiresInDays: z.number().min(1).max(30).default(7).optional(),
    expiresAt: z.date().optional(),
    sharedWithEmail: z.string().email("Invalid email address"),
  })
  .refine(
    (data) => data.expiresInDays !== undefined || data.expiresAt !== undefined,
    { message: "Either expiresInDays or expiresAt must be provided" }
  );

export async function createShareToken(data: z.infer<typeof shareTokenSchema>) {
  try {
    const user = await getOrCreateUser();

    const validatedData = shareTokenSchema.parse(data);

    // Verify all reports belong to user
    const reports = await prisma.report.findMany({
      where: {
        id: { in: validatedData.reportIds },
        userId: user.id,
      },
    });

    if (reports.length !== validatedData.reportIds.length) {
      return { success: false, error: "Some reports not found" };
    }

    // Calculate expiry date
    let expiresAt: Date;
    if (validatedData.expiresAt) {
      expiresAt = validatedData.expiresAt;
    } else {
      expiresAt = new Date();
      expiresAt.setDate(
        expiresAt.getDate() + (validatedData.expiresInDays || 7)
      );
    }

    // Create share token
    const shareToken = await prisma.shareToken.create({
      data: {
        userId: user.id,
        expiresAt,
        sharedWithEmail: validatedData.sharedWithEmail || null,
        sharedReports: {
          create: validatedData.reportIds.map((reportId) => ({
            reportId,
          })),
        },
      } as any,
      include: {
        sharedReports: {
          include: {
            report: true,
          },
        },
      },
    });

    revalidatePath("/reports");

    return {
      success: true,
      token: shareToken.token,
      expiresAt: shareToken.expiresAt,
    };
  } catch (error) {
    console.error("Error creating share token:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to create share token" };
  }
}

export async function validateShareToken(token: string, userEmail?: string) {
  try {
    const shareToken = (await prisma.shareToken.findUnique({
      where: { token },
      include: {
        sharedReports: {
          include: {
            report: {
              include: {
                vitals: true,
              },
            },
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })) as any;

    if (!shareToken) {
      return { success: false, error: "Invalid share token", data: null };
    }

    if (shareToken.isRevoked) {
      return {
        success: false,
        error: "This share link has been revoked",
        data: null,
      };
    }

    if (new Date() > shareToken.expiresAt) {
      return {
        success: false,
        error: "This share link has expired",
        data: null,
      };
    }

    // Validate email if the share token is restricted to a specific user
    if (shareToken.sharedWithEmail) {
      if (!userEmail) {
        return {
          success: false,
          error:
            "This share link requires authentication. Please sign in with the authorized email.",
          data: null,
          requiresAuth: true,
        };
      }
      if (
        shareToken.sharedWithEmail.toLowerCase() !== userEmail.toLowerCase()
      ) {
        return {
          success: false,
          error:
            "You are not authorized to view this shared report. This link is only accessible to " +
            shareToken.sharedWithEmail,
          data: null,
        };
      }
    }

    return {
      success: true,
      data: {
        reports: shareToken.sharedReports.map((sr: any) => sr.report),
        owner: shareToken.user,
        expiresAt: shareToken.expiresAt,
        sharedWithEmail: shareToken.sharedWithEmail,
      },
    };
  } catch (error) {
    console.error("Error validating share token:", error);
    return {
      success: false,
      error: "Failed to validate share token",
      data: null,
    };
  }
}

export async function revokeShareToken(token: string) {
  try {
    const user = await getOrCreateUser();

    const shareToken = await prisma.shareToken.findFirst({
      where: {
        token,
        userId: user.id,
      },
    });

    if (!shareToken) {
      return { success: false, error: "Share token not found" };
    }

    await prisma.shareToken.update({
      where: { id: shareToken.id },
      data: { isRevoked: true },
    });

    revalidatePath("/reports");

    return { success: true };
  } catch (error) {
    console.error("Error revoking share token:", error);
    return { success: false, error: "Failed to revoke share token" };
  }
}

export async function getMyShareTokens() {
  try {
    const user = await getOrCreateUser();

    const shareTokens = (await prisma.shareToken.findMany({
      where: {
        userId: user.id,
      },
      include: {
        sharedReports: {
          include: {
            report: {
              select: {
                id: true,
                title: true,
                uploadedAt: true,
                fileType: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })) as any;

    return { success: true, tokens: shareTokens };
  } catch (error) {
    console.error("Error fetching share tokens:", error);
    return {
      success: false,
      error: "Failed to fetch share tokens",
      tokens: [],
    };
  }
}

export async function getSharedWithMe() {
  try {
    const user = await getOrCreateUser();

    // Find all share tokens that are shared with this user's email
    const shareTokens = (await prisma.shareToken.findMany({
      where: {
        sharedWithEmail: user.email,
        isRevoked: false,
        expiresAt: {
          gte: new Date(),
        },
      } as any,
      include: {
        sharedReports: {
          include: {
            report: {
              select: {
                id: true,
                title: true,
                description: true,
                uploadedAt: true,
                fileType: true,
                fileUrl: true,
              },
            },
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })) as any;

    return { success: true, sharedReports: shareTokens };
  } catch (error) {
    console.error("Error fetching shared reports:", error);
    return {
      success: false,
      error: "Failed to fetch shared reports",
      sharedReports: [],
    };
  }
}
