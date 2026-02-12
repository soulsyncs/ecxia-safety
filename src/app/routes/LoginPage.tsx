import { useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@ecxia.co.jp');
  const [password, setPassword] = useState('demo');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // デモモード: 任意の入力でログイン成功
    await new Promise(r => setTimeout(r, 500));
    sessionStorage.setItem('ecxia_logged_in', 'true');
    setLoading(false);
    router.navigate({ to: '/' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">ECXIA安全管理システム</CardTitle>
          <CardDescription>管理者ログイン</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@ecxia.co.jp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="パスワード"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              デモ環境: 任意の値でログインできます
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
