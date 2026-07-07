import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

/** Cache tags, scoped per user so one user's mutation never busts another's. */
export const resumesTag = (userId: string) => `resumes:${userId}`;
export const dashboardTag = (userId: string) => `dashboard:${userId}`;

export function getResumes(userId: string) {
  return unstable_cache(
    () =>
      prisma.resume.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          fileName: true,
          fileType: true,
          version: true,
          createdAt: true,
          source: true,
          parentId: true,
          parent: { select: { id: true, title: true } },
          analyses: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, overallScore: true, createdAt: true },
          },
        },
      }),
    ["resumes", userId],
    { tags: [resumesTag(userId)], revalidate: 60 },
  )();
}

export async function getResume(userId: string, resumeId: string) {
  return prisma.resume.findFirst({
    where: { id: resumeId, userId },
    include: {
      analyses: {
        orderBy: { createdAt: "desc" },
        select: { id: true, overallScore: true, createdAt: true, model: true },
      },
      jobMatches: {
        orderBy: { createdAt: "desc" },
        include: {
          jobDescription: { select: { title: true, company: true } },
        },
      },
      rewrites: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      parent: { select: { id: true, title: true, version: true } },
      children: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          version: true,
          createdAt: true,
          source: true,
          analyses: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { overallScore: true },
          },
        },
      },
    },
  });
}

export async function getAnalysis(userId: string, analysisId: string) {
  return prisma.analysis.findFirst({
    where: { id: analysisId, userId },
    include: {
      resume: { select: { id: true, title: true, fileName: true, version: true } },
    },
  });
}

export async function getJobMatch(userId: string, matchId: string) {
  return prisma.jobMatch.findFirst({
    where: { id: matchId, userId },
    include: {
      resume: { select: { id: true, title: true } },
      jobDescription: { select: { title: true, company: true, content: true } },
    },
  });
}

export function getDashboardData(userId: string) {
  return unstable_cache(
    async () => {
      const [resumes, recentAnalyses, recentMatches, scoreHistory] =
        await Promise.all([
          prisma.resume.count({ where: { userId } }),
          prisma.analysis.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { resume: { select: { id: true, title: true } } },
          }),
          prisma.jobMatch.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
              resume: { select: { id: true, title: true } },
              jobDescription: { select: { title: true, company: true } },
            },
          }),
          prisma.analysis.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            take: 20,
            select: { overallScore: true, createdAt: true },
          }),
        ]);

      return { resumes, recentAnalyses, recentMatches, scoreHistory };
    },
    ["dashboard", userId],
    { tags: [dashboardTag(userId)], revalidate: 60 },
  )();
}
