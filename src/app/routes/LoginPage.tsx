import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { useLogin } from '@/hooks/use-auth';
import { isDemoMode } from '@/lib/supabase';

export function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'admin@ecxia.co.jp', password: isDemoMode ? 'demo' : '' },
  });

  const onSubmit = async (data: LoginInput) => {
    if (isDemoMode) {
      sessionStorage.setItem('ecxia_logged_in', 'true');
      router.navigate({ to: '/' });
      return;
    }
    try {
      await loginMutation.mutateAsync(data);
      router.navigate({ to: '/' });
    } catch {
      // エラーはmutationのerrorで表示
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef6ed] to-[#d4ecd0] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="/ecxia-logo.png" alt="ECXIA" className="mx-auto h-12 mb-3" />
          <CardTitle className="text-xl">安全管理システム</CardTitle>
          <CardDescription>管理者ログイン</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="admin@ecxia.co.jp"
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="パスワード"
              />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
            {loginMutation.error && (
              <p className="text-xs text-red-600 text-center">ログインに失敗しました。メールアドレスとパスワードを確認してください。</p>
            )}
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'ログイン中...' : 'ログイン'}
            </Button>
            {isDemoMode && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                デモ環境: 任意の値でログインできます
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
