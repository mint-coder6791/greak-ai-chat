export function errorMessage(err: unknown): string {
  if (err instanceof TypeError) return '网络请求失败，请检查接口地址或网络连接';
  if (err instanceof Error) return err.message;
  return '发生未知错误';
}
