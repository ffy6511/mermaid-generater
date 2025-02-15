import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      );
    }

    // 中间件会处理API密钥和请求转发
    const response = await fetch(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `你是一个专业的图表生成助手。请将以下文本转换为Mermaid图表代码，根据内容选择合适的图表类型（流程图、时序图、类图等）。只返回Mermaid代码，不要包含其他解释性文字：\n\n${text}`
          }]
        }]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `DeepSeek API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const mermaidCode = data.candidates[0].content.parts[0].text;

    return NextResponse.json({ mermaidCode });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}