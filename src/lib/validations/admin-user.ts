import { z } from 'zod';

export const createAdminSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  name: z.string().min(1, '氏名は必須です'),
  role: z.enum(['org_admin', 'manager']).default('manager'),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
