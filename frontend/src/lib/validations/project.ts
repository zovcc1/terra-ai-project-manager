import { z } from "zod";

const ProjectPriority = z.enum(["LOW", "MEDIUM", "HIGH"], {
  errorMap: () => ({ message: "أولوية المشروع غير صالحة" }),
});

const ProjectStatus = z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"], {
  errorMap: () => ({ message: "حالة المشروع غير صالحة" }),
});

// Matches a future POST /api/manager/projects body
export const createProjectSchema = z.object({
  name: z.string().min(1, "اسم المشروع مطلوب").max(200, "الاسم طويل جداً"),
  description: z.string().max(2000, "الوصف طويل جداً").optional(),
  teamId: z.number().int().positive("يجب اختيار فريق").nullable().optional(),
  managerId: z.number().int().positive("يجب اختيار مدير").nullable().optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ الاستحقاق غير صالح (YYYY-MM-DD)")
    .nullable()
    .optional(),
  priority: ProjectPriority.optional().default("MEDIUM"),
  status: ProjectStatus.optional().default("ACTIVE"),
});

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;

export const editProjectSchema = createProjectSchema.partial();
export type EditProjectFormData = z.infer<typeof editProjectSchema>;

// Matches POST /api/admin/teams body
export const createTeamSchema = z.object({
  name: z.string().min(1, "اسم الفريق مطلوب").max(200, "الاسم طويل جداً"),
  description: z.string().max(1000, "الوصف طويل جداً").optional(),
});

export type CreateTeamFormData = z.infer<typeof createTeamSchema>;

export const editTeamSchema = createTeamSchema.partial();
export type EditTeamFormData = z.infer<typeof editTeamSchema>;
