import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل").max(50),
    email: z.string().email("البريد الإلكتروني غير صالح"),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").max(100),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
    fullName: z.string().min(1, "الاسم الكامل مطلوب"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const verifyEmailSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  token: z.string().min(1, "رمز التحقق مطلوب"),
});

export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().email("البريد الإلكتروني غير صالح"),
    token: z.string().min(1, "رمز إعادة التعيين مطلوب"),
    newPassword: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").max(100),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
