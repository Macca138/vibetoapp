import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DataFlowEngine } from '@/lib/dataFlowEngine';
import { z } from 'zod';

// Schema for creating data flow relationships
const createDataFlowSchema = z.object({
  projectId: z.string(),
  sourceStepId: z.number().min(1).max(9),
  targetStepId: z.number().min(1).max(9),
  sourceField: z.string(),
  targetField: z.string(),
  transformType: z.string().optional(),
  transformConfig: z.record(z.any()).optional(),
});

// Schema for processing data flow
const processDataFlowSchema = z.object({
  projectId: z.string(),
  sourceStepId: z.number().min(1).max(9),
  targetStepId: z.number().min(1).max(9),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get all data flow relationships for the project
    const relationships = await prisma.dataFlowRelationship.findMany({
      where: {
        projectId,
      },
      orderBy: [
        { sourceStepId: 'asc' },
        { targetStepId: 'asc' },
      ],
    });

    return NextResponse.json({ relationships });
  } catch (error) {
    console.error('Error fetching data flow relationships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data flow relationships' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Check if this is a process request or create request
    if (body.sourceStepId && body.targetStepId && !body.sourceField) {
      // Process data flow request
      const validationResult = processDataFlowSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: validationResult.error.errors[0].message },
          { status: 400 }
        );
      }

      const { projectId, sourceStepId, targetStepId } = validationResult.data;

      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: session.user.id,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      // Process data flow
      const mappings = await DataFlowEngine.processDataFlow({
        projectId,
        sourceStepId,
        targetStepId,
      });

      // Apply mappings to target step
      await DataFlowEngine.applyMappingsToStep(projectId, targetStepId, mappings);

      return NextResponse.json({
        message: 'Data flow processed successfully',
        mappings,
      });
    } else {
      // Create new data flow relationship
      const validationResult = createDataFlowSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: validationResult.error.errors[0].message },
          { status: 400 }
        );
      }

      const data = validationResult.data;

      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: {
          id: data.projectId,
          userId: session.user.id,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      // Create the relationship
      const relationship = await prisma.dataFlowRelationship.create({
        data: {
          projectId: data.projectId,
          sourceStepId: data.sourceStepId,
          targetStepId: data.targetStepId,
          sourceField: data.sourceField,
          targetField: data.targetField,
          transformType: data.transformType,
          transformConfig: data.transformConfig,
        },
      });

      return NextResponse.json({
        message: 'Data flow relationship created successfully',
        relationship,
      });
    }
  } catch (error) {
    console.error('Error in data flow operation:', error);
    return NextResponse.json(
      { error: 'Failed to process data flow operation' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'ID and isActive status are required' },
        { status: 400 }
      );
    }

    // Verify ownership through project
    const relationship = await prisma.dataFlowRelationship.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!relationship || relationship.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Data flow relationship not found' },
        { status: 404 }
      );
    }

    // Update the relationship
    const updated = await prisma.dataFlowRelationship.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({
      message: 'Data flow relationship updated successfully',
      relationship: updated,
    });
  } catch (error) {
    console.error('Error updating data flow relationship:', error);
    return NextResponse.json(
      { error: 'Failed to update data flow relationship' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership through project
    const relationship = await prisma.dataFlowRelationship.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!relationship || relationship.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Data flow relationship not found' },
        { status: 404 }
      );
    }

    // Delete the relationship
    await prisma.dataFlowRelationship.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Data flow relationship deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting data flow relationship:', error);
    return NextResponse.json(
      { error: 'Failed to delete data flow relationship' },
      { status: 500 }
    );
  }
}