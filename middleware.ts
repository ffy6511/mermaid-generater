import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 只处理 /api/generate 路径的请求
  if (request.nextUrl.pathname === '/api/generate') {
    // 获取环境变量
    const apiKey = process.env.GEMINI_API_KEY;

    // 如果没有配置API密钥，返回错误响应
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // 构建新的请求URL
    const url = new URL('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent');
    url.searchParams.set('key', apiKey);

    // 修改请求配置
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('Content-Type', 'application/json');

    // 创建新的请求对象
    return NextResponse.rewrite(url, {
      headers: requestHeaders,
    });
  }

  return NextResponse.next();
}

// 配置中间件匹配规则
export const config = {
  matcher: '/api/generate',
};