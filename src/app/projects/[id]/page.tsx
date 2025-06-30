import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import WorkflowContainer from "@/components/workflow/WorkflowContainer";

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const resolvedParams = await params;
  const project = await prisma.project.findFirst({
    where: {
      id: resolvedParams.id,
      userId: session.user.id,
    },
    include: {
      workflow: {
        include: {
          responses: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return <WorkflowContainer project={project} />;
}