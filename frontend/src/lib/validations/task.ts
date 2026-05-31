import { z } from "zod";

const TaskStatus = z.enum(["TODO", "DOING", "REVIEW", "DONE"], {
  errorMap: () => ({ message: "حالة المهمة غير صالحة" }),
});

const TaskPriority = z.enum(["LOW", "MEDIUM", "HIGH"], {
  errorMap: () => ({ message: "أولوية المهمة غير صالحة" }),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "عنوان المهمة مطلوب").max(200, "العنوان طويل جداً"),
  description: z.string().max(2000, "الوصف طويل جداً").optional(),
  status: TaskStatus.optional().default("TODO"),
  priority: TaskPriority.optional().default("MEDIUM"),
  assigneeId: z.number().int().positive().nullable().optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ الاستحقاق غير صالح (YYYY-MM-DD)")
    .nullable()
    .optional(),
});

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;

// All fields optional for edit — uses same constraints when provided
export const editTaskSchema = createTaskSchema.partial().extend({
  title: z.string().min(1, "عنوان المهمة مطلوب").max(200, "العنوان طويل جداً").optional(),
});

export type EditTaskFormData = z.infer<typeof editTaskSchema>;
