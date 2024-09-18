function generateIcon() {
  const canvas = new OffscreenCanvas(16, 16);
  const ctx = canvas.getContext('2d');

  // 绘制绿色背景
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, 0, 16, 16);

  // 绘制白色文字 "测"
  ctx.fillStyle = 'white';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('测', 8, 8);

  return ctx.getImageData(0, 0, 16, 16);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateTestCase") {
    generateTestCase(request.text)
      .then(testCase => sendResponse({testCase: testCase}))
      .catch(error => {
        console.error('Error generating test case:', error);
        sendResponse({error: 'Failed to generate test case'});
      });
    return true; // 表示我们会异步发送响应
  }
});

async function generateTestCase(text) {
  const MOONSHOT_API_KEY = "sk-L5BhrtVMDqAinGmIgKeja9epQXMvIWGFnXHj950VJFiQcM3L"; // 替换为你的实际 API Key
  const API_URL = "https://api.moonshot.cn/v1/chat/completions";
  const ROLE_CONTENT = `
  你是一位专业的软件测试工程师，能够根据需求生成精炼、准确、易懂的测试用例。
  请严格按照以下格式生成测试用例：
  1.测试用例顶格，不需要缩进，具体命名规范是 case-具体第几个case-具体用例名称
  2.测试用例分为前置条件，action，预期结果。这个三部分分别缩进一个制表符
  
不要输出-----------------------------------------------------------------这样的东西
不要输出\`\`\`这样的东西
不要输出-这样的东西
按照这样的格式依次生成所有完备的测试用例，如果有多个步骤，使用 1. 2. 这样的序号描述顺序，但是不需要再进行缩进。
生成的测试用例应该涵盖各种可能的场景包括正面测试、负面测试、边界条件等。
`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MOONSHOT_API_KEY}`
    },
    body: JSON.stringify({
      model: "moonshot-v1-8k",
      messages: [
        {"role": "system", "content": ROLE_CONTENT},
        {"role": "user", "content": `你是一位专业的软件测试工程师，为以下文本生成测试用例：${text}`}
      ],
      temperature: 0.3,
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

chrome.runtime.onInstalled.addListener(() => {
  const iconImageData = generateIcon();
  chrome.action.setIcon({ imageData: iconImageData });
});