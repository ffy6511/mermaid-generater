import { NextRequest, NextResponse } from 'next/server';

// 配置 CORS 头部的函数
function corsHeaders(request: NextRequest) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  const origin = request.headers.get('origin');
  
  // 检查请求的源是否在允许列表中
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : null;

  return {
    'Access-Control-Allow-Origin': allowedOrigin || 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

// 处理 OPTIONS 请求（预检请求）
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders(request) });
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400, headers: corsHeaders(request) }
      );
    }

    const apiKey = process.env.ZCHAT_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ZChat API key not configured' },
        { status: 500, headers: corsHeaders(request) }
      );
    }

    const apiUrl = 'https://api.zchat.tech/v1/chat/completions';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的图表生成助手。你的任务是将用户输入的文本转换为Mermaid图表代码。\n\n规则：\n1. 根据内容选择最合适的图表类型（流程图、时序图、类图等）\n2. 使用正确的Mermaid语法\n3. 只返回Mermaid代码，不要包含任何解释性文字\n4. 确保生成的代码可以被Mermaid正确渲染\n\n示例输出格式：\ngraph TD\n    A[开始] --> B[处理]\n    B --> C[结束], 可以对输入文本进行适量概括或者同义改写.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `DeepSeek API error: ${error}` },
        { status: response.status, headers: corsHeaders(request) }
      );
    }

    const data = await response.json();
    const mermaidCode = data.choices[0].message.content;

    return NextResponse.json(
      { mermaidCode }, 
      { headers: corsHeaders(request) }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders(request) }
    );
  }
}
