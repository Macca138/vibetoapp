import { prisma } from '@/lib/prisma';
import { DataFlowRelationship } from '@prisma/client';

export interface DataFlowContext {
  projectId: string;
  sourceStepId: number;
  targetStepId: number;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  value: any;
}

export class DataFlowEngine {
  /**
   * Process data flow from source step to target step
   */
  static async processDataFlow(context: DataFlowContext): Promise<FieldMapping[]> {
    // Get active data flow relationships
    const relationships = await prisma.dataFlowRelationship.findMany({
      where: {
        projectId: context.projectId,
        sourceStepId: context.sourceStepId,
        targetStepId: context.targetStepId,
        isActive: true,
      },
    });

    if (relationships.length === 0) {
      return [];
    }

    // Get source step data
    const sourceWorkflow = await prisma.projectWorkflow.findUnique({
      where: { projectId: context.projectId },
      include: {
        responses: {
          where: { stepId: context.sourceStepId },
        },
      },
    });

    if (!sourceWorkflow || sourceWorkflow.responses.length === 0) {
      return [];
    }

    const sourceResponse = sourceWorkflow.responses[0];
    const sourceData = sourceResponse.responses as Record<string, any>;

    // Process each relationship
    const mappings: FieldMapping[] = [];
    
    for (const relationship of relationships) {
      const value = await this.extractAndTransformValue(
        sourceData,
        relationship
      );
      
      if (value !== undefined) {
        mappings.push({
          sourceField: relationship.sourceField,
          targetField: relationship.targetField,
          value,
        });
      }
    }

    return mappings;
  }

  /**
   * Extract value from source data and apply transformations
   */
  private static async extractAndTransformValue(
    sourceData: Record<string, any>,
    relationship: DataFlowRelationship
  ): Promise<any> {
    // Extract value from source field (supports nested paths)
    let value = this.getNestedValue(sourceData, relationship.sourceField);

    if (value === undefined) {
      return undefined;
    }

    // Apply transformation if specified
    if (relationship.transformType) {
      value = await this.applyTransformation(
        value,
        relationship.transformType,
        relationship.transformConfig as Record<string, any> | null
      );
    }

    return value;
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: Record<string, any>, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Apply transformation to value
   */
  private static async applyTransformation(
    value: any,
    transformType: string,
    config: Record<string, any> | null
  ): Promise<any> {
    switch (transformType) {
      case 'copy':
        // Direct copy, no transformation
        return value;

      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;

      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;

      case 'trim':
        return typeof value === 'string' ? value.trim() : value;

      case 'extract':
        // Extract specific field from object/array
        if (config?.field && typeof value === 'object') {
          return value[config.field];
        }
        return value;

      case 'join':
        // Join array values
        if (Array.isArray(value) && config?.separator) {
          return value.join(config.separator);
        }
        return value;

      case 'split':
        // Split string into array
        if (typeof value === 'string' && config?.separator) {
          return value.split(config.separator);
        }
        return value;

      case 'aggregate':
        // Aggregate multiple fields
        if (Array.isArray(value)) {
          const aggregationType = config?.type || 'concat';
          switch (aggregationType) {
            case 'concat':
              return value.join(config?.separator || ', ');
            case 'sum':
              return value.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
            case 'count':
              return value.length;
            case 'first':
              return value[0];
            case 'last':
              return value[value.length - 1];
            default:
              return value;
          }
        }
        return value;

      case 'map':
        // Map values using a mapping table
        if (config?.mapping && config.mapping[value]) {
          return config.mapping[value];
        }
        return value;

      case 'template':
        // Replace placeholders in template string
        if (config?.template && typeof config.template === 'string') {
          return config.template.replace(/\{value\}/g, value);
        }
        return value;

      default:
        return value;
    }
  }

  /**
   * Create default data flow relationships for a project
   */
  static async createDefaultDataFlows(projectId: string): Promise<void> {
    const defaultFlows = [
      // Step 1 to Step 2: App name and initial idea
      {
        sourceStepId: 1,
        targetStepId: 2,
        sourceField: 'appName',
        targetField: 'projectName',
        transformType: 'copy',
      },
      {
        sourceStepId: 1,
        targetStepId: 2,
        sourceField: 'appIdea',
        targetField: 'initialIdea',
        transformType: 'copy',
      },
      // Step 2 to Step 3: Project details
      {
        sourceStepId: 2,
        targetStepId: 3,
        sourceField: 'elevatorPitch',
        targetField: 'projectSummary',
        transformType: 'copy',
      },
      {
        sourceStepId: 2,
        targetStepId: 3,
        sourceField: 'targetAudience',
        targetField: 'primaryUsers',
        transformType: 'copy',
      },
      // Step 3 to Step 4: User personas to feature planning
      {
        sourceStepId: 3,
        targetStepId: 4,
        sourceField: 'userPersonas',
        targetField: 'targetUsers',
        transformType: 'aggregate',
        transformConfig: { type: 'concat', separator: '\n' },
      },
      // Step 4 to Step 5: Features to user flow
      {
        sourceStepId: 4,
        targetStepId: 5,
        sourceField: 'coreFeatures',
        targetField: 'featureList',
        transformType: 'copy',
      },
      // Step 5 to Step 6: User flows to technical planning
      {
        sourceStepId: 5,
        targetStepId: 6,
        sourceField: 'primaryUserFlow',
        targetField: 'mainWorkflow',
        transformType: 'copy',
      },
    ];

    // Create relationships in database
    for (const flow of defaultFlows) {
      await prisma.dataFlowRelationship.create({
        data: {
          projectId,
          ...flow,
        },
      }).catch(() => {
        // Ignore if already exists (unique constraint)
      });
    }
  }

  /**
   * Apply data flow mappings to target step
   */
  static async applyMappingsToStep(
    projectId: string,
    stepId: number,
    mappings: FieldMapping[]
  ): Promise<void> {
    if (mappings.length === 0) {
      return;
    }

    // Get existing response for the step
    const workflow = await prisma.projectWorkflow.findUnique({
      where: { projectId },
      include: {
        responses: {
          where: { stepId },
        },
      },
    });

    if (!workflow) {
      return;
    }

    // Get existing data or create new
    const existingResponse = workflow.responses[0];
    const currentData = existingResponse?.responses as Record<string, any> || {};

    // Apply mappings
    const updatedData = { ...currentData };
    for (const mapping of mappings) {
      this.setNestedValue(updatedData, mapping.targetField, mapping.value);
    }

    // Save updated data
    if (existingResponse) {
      await prisma.workflowResponse.update({
        where: { id: existingResponse.id },
        data: { responses: updatedData },
      });
    } else {
      await prisma.workflowResponse.create({
        data: {
          workflowId: workflow.id,
          stepId,
          responses: updatedData,
          completed: false,
        },
      });
    }
  }

  /**
   * Set nested value in object using dot notation
   */
  private static setNestedValue(
    obj: Record<string, any>,
    path: string,
    value: any
  ): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }
}