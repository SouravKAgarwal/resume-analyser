import "server-only";

import { prisma } from "@/lib/db";

export async function getResumes(userId: string) {
  return prisma.resume.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      fileName: true,
      fileType: true,
      version: true,
      createdAt: true,
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, overallScore: true, createdAt: true },
      },
    },
  });
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

export async function getDashboardData(userId: string) {
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
}
