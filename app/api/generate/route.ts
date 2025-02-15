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

    const apiKey = process.env.ZCHAT_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ZChat API key not configured' },
        { status: 500 }
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
            content: '你是一个专业的图表生成助手。你的任务是将用户输入的文本转换为Mermaid图表代码。\n\n规则：\n1. 根据内容选择最合适的图表类型（流程图、时序图、类图等）\n2. 使用正确的Mermaid语法\n3. 只返回Mermaid代码，不要包含任何解释性文字\n4. 确保生成的代码可以被Mermaid正确渲染\n\n示例输出格式：\ngraph TD\n    A[开始] --> B[处理]\n    B --> C[结束], 注意不要包含mermaid这一行, 因为不需要..'
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
        { status: response.status }
      );
    }

    const data = await response.json();
    const mermaidCode = data.choices[0].message.content;

    return NextResponse.json({ mermaidCode });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}