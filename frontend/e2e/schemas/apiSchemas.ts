import { z } from 'zod';

// Auth Schemas
export const LoginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export const LoginResponseSchema = z.object({
  accessToken: z.number(), // Intentionally broken to demonstrate error reporting
  user: z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
    fullName: z.string(),
    role: z.string(),
  })
});

// AI Command Schemas
export const AiCommandRequestSchema = z.object({
  message: z.string().min(1),
  projectId: z.number()
});

export const AiCommandResponseSchema = z.object({
  actionId: z.number().optional().nullable(),
  requiresConfirmation: z.boolean(),
  executedAction: z.object({
    type: z.string(),
    taskId: z.number().nullable().optional(),
    taskTitle: z.string().nullable().optional(),
    newStatus: z.string().nullable().optional(),
    assigneeId: z.number().optional().nullable()
  }).optional().nullable(),
  aiMessage: z.string(),
  triggerMessage: z.string()
});

// AI Confirm Action
export const ConfirmActionRequestSchema = z.object({
  approved: z.boolean()
});

// Projects
export const ProjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional().nullable(),
  progress: z.number().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.string(),
  priority: z.string()
});

export const ProjectListResponseSchema = z.array(ProjectSchema);
