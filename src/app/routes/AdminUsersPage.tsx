import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Shield, ShieldCheck, Trash2, Mail, Copy, Check, Eye, EyeOff, MessageCircle, Link2, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useAdminUsers, useCreateAdminUser, useRemoveAdminUser, useGenerateLineToken, useUnlinkAdminLine } from '@/hooks/use-admin-users';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from '@tanstack/react-router';
import { createAdminSchema, type CreateAdminInput } from '@/lib/validations';

const roleLabel: Record<string, { label: string; variant: 'default' | 'secondary' }> = {
  org_admin: { label: '管理者', variant: 'default' },
  manager: { label: '運行管理', variant: 'secondary' },
};

export function AdminUsersPage() {
  const { user, organization, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const orgId = organization?.id ?? '';
  const { data: admins = [], isLoading } = useAdminUsers(orgId);
  const createAdmin = useCreateAdminUser();
  const removeAdmin = useRemoveAdminUser();
  const generateLineToken = useGenerateLineToken();
  const unlinkLine = useUnlinkAdminLine();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [lineTokenDialogAdmin, setLineTokenDialogAdmin] = useState<{ id: string; name: string } | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<CreateAdminInput>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { role: 'manager' },
  });

  const isOrgAdmin = user?.role === 'org_admin';
  const passwordValue = watch('password');

  // org_admin以外はダッシュボードにリダイレクト
  if (!authLoading && user && user.role !== 'org_admin') {
    router.navigate({ to: '/' });
    return null;
  }

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (data: CreateAdminInput) => {
    if (!organization) return;
    setErrorMessage(null);
    try {
      await createAdmin.mutateAsync({ input: data, organizationId: organization.id });
      setCreatedEmail(data.email);
      setDialogOpen(false);
      reset();
      setShowPassword(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'スタッフの追加に失敗しました');
    }
  };

  const handleRemove = async (id: string) => {
    if (!organization) return;
    try {
      await removeAdmin.mutateAsync({ id, organizationId: organization.id });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  const handleGenerateLineToken = async (adminId: string, adminName: string) => {
    if (!organization) return;
    try {
      const token = await generateLineToken.mutateAsync({ id: adminId, organizationId: organization.id });
      setGeneratedToken(token);
      setLineTokenDialogAdmin({ id: adminId, name: adminName });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'トークンの生成に失敗しました');
    }
  };

  const handleUnlinkLine = async (adminId: string) => {
    if (!organization) return;
    try {
      await unlinkLine.mutateAsync({ id: adminId, organizationId: organization.id });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'LINE連携の解除に失敗しました');
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const handleCopyCredentials = (email: string) => {
    const text = `ログイン情報\nURL: ${window.location.origin}/login\nメール: ${email}\n\n初回ログイン後、パスワードを変更してください。`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">管理者アカウント</h1>
          <p className="text-muted-foreground">管理画面にログインできるスタッフを管理します</p>
        </div>
        {isOrgAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />スタッフを追加</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>管理スタッフの追加</DialogTitle>
                <DialogDescription>
                  新しいスタッフのメールアドレスとパスワードを設定します。
                  追加後、ログイン情報をスタッフに共有してください。
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">氏名 *</Label>
                  <Input id="name" {...register('name')} placeholder="山田 太郎" />
                  {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス *</Label>
                  <Input id="email" type="email" {...register('email')} placeholder="yamada@ecxia.co.jp" />
                  {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">初期パスワード *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder="8文字以上"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
                  {passwordValue && passwordValue.length >= 8 && (
                    <p className="text-xs text-green-600">OK</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">権限</Label>
                  <select
                    id="role"
                    {...register('role')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="manager">運行管理（日報の閲覧・エクスポート）</option>
                    <option value="org_admin">管理者（全機能 + スタッフ管理）</option>
                  </select>
                </div>
                {errorMessage && (
                  <p className="text-xs text-red-600 text-center">{errorMessage}</p>
                )}
                <Button type="submit" className="w-full" disabled={createAdmin.isPending}>
                  {createAdmin.isPending ? '追加中...' : 'スタッフを追加'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 作成完了メッセージ */}
      {createdEmail && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-green-800">スタッフを追加しました</p>
                <p className="text-sm text-green-700 mt-1">
                  <strong>{createdEmail}</strong> にログイン情報を共有してください。
                </p>
                <p className="text-xs text-green-600 mt-2">
                  ログインURL: {window.location.origin}/login
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-100"
                  onClick={() => handleCopyCredentials(createdEmail)}
                >
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? 'コピーしました' : 'ログイン情報をコピー'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreatedEmail(null)}
                >
                  閉じる
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">登録済みスタッフ</CardTitle>
          <CardDescription>{admins.length}名が管理画面にアクセスできます</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>氏名</TableHead>
                <TableHead>メールアドレス</TableHead>
                <TableHead>権限</TableHead>
                <TableHead>LINE通知</TableHead>
                <TableHead>登録日</TableHead>
                {isOrgAdmin && <TableHead>操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map(admin => {
                const role = roleLabel[admin.role] ?? roleLabel['manager']!;
                const isCurrentUser = admin.id === user?.id;
                return (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {admin.role === 'org_admin' ? (
                          <ShieldCheck className="h-4 w-4 text-ecxia-green" />
                        ) : (
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">{admin.name}</p>
                          {isCurrentUser && <p className="text-xs text-muted-foreground">（あなた）</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{admin.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.variant}>{role.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {admin.lineUserId ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="default" className="bg-green-600 text-xs">
                            <MessageCircle className="h-3 w-3 mr-1" />連携済み
                          </Badge>
                          {isOrgAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <Unlink className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>LINE連携を解除しますか？</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {admin.name}さんへのLINEサマリー通知が届かなくなります。再度連携するには新しいトークンの生成が必要です。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleUnlinkLine(admin.id)}>解除する</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      ) : isOrgAdmin ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleGenerateLineToken(admin.id, admin.name)}
                          disabled={generateLineToken.isPending}
                        >
                          <Link2 className="h-3 w-3 mr-1" />LINE連携
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">未連携</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(admin.createdAt).toLocaleDateString('ja-JP')}
                    </TableCell>
                    {isOrgAdmin && (
                      <TableCell>
                        {!isCurrentUser ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>スタッフを削除しますか？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {admin.name}（{admin.email}）の管理画面へのアクセス権を削除します。この操作は取り消せません。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemove(admin.id)}>削除する</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {admins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isOrgAdmin ? 6 : 5} className="text-center text-muted-foreground py-8">
                    管理スタッフが登録されていません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* LINE連携トークンダイアログ */}
      <Dialog open={!!lineTokenDialogAdmin} onOpenChange={(open) => { if (!open) { setLineTokenDialogAdmin(null); setGeneratedToken(null); setTokenCopied(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>LINE連携トークン</DialogTitle>
            <DialogDescription>
              {lineTokenDialogAdmin?.name}さんのLINE連携用トークンです。
              このトークンをECXIA安全管理のLINE公式アカウントにメッセージとして送信してください。
            </DialogDescription>
          </DialogHeader>
          {generatedToken && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="font-mono text-sm break-all select-all">{generatedToken}</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleCopyToken(generatedToken)}
              >
                {tokenCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {tokenCopied ? 'コピーしました' : 'トークンをコピー'}
              </Button>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">手順:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>ECXIA安全管理のLINE公式アカウントを友だち追加</li>
                  <li>上のトークンをコピー</li>
                  <li>LINE公式アカウントのトーク画面にペーストして送信</li>
                  <li>「LINE連携が完了しました」と返信が届けば成功</li>
                </ol>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 使い方ガイド */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">使い方</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <span className="bg-muted rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <p>「スタッフを追加」ボタンから、新しいスタッフのメールアドレスとパスワードを入力します。</p>
          </div>
          <div className="flex gap-3">
            <span className="bg-muted rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <p>追加後に表示される「ログイン情報をコピー」ボタンで、ログインURLとメールアドレスをコピーできます。</p>
          </div>
          <div className="flex gap-3">
            <span className="bg-muted rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <p>コピーした情報をLINEやメールでスタッフに送ってください。スタッフはその情報でログインできます。</p>
          </div>
          <div className="flex gap-3">
            <span className="bg-muted rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <p>LINE通知を受け取るには「LINE連携」ボタンからトークンを生成し、LINE公式アカウントに送信してください。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
