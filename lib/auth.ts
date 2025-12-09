"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function getOrCreateUser() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Unauthorized");
  }

  const user = await currentUser();

  if (!user) {
    throw new Error("User not found");
  }

  let dbUser = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!dbUser) {
    try {
      dbUser = await prisma.user.create({
        data: {
          clerkId,
          email: user.emailAddresses[0]?.emailAddress || "",
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error: any) {
      // Handle race condition - another request may have created the user
      if (error.code === "P2002") {
        dbUser = await prisma.user.findUnique({
          where: { clerkId },
        });
        if (!dbUser) {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  return dbUser;
}

export async function getCurrentUser() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  return await prisma.user.findUnique({
    where: { clerkId },
  });
}
