// src/utils/aiUtils.js
/**
 * 调用 SiliconFlow Qwen API 生成待办激励文案（复用已有 API 配置）
 * 接口兼容 OpenAI Chat Completions 格式，国内可访问
 */
export const generateAIMotivation = async () => {
  // 从环境变量读取 Qwen 配置（复用你的 API 密钥和模型）
  const baseUrl = import.meta.env.VITE_QWEN_BASE_URL;
  const apiKey = import.meta.env.VITE_QWEN_API_KEY;
  const model = import.meta.env.VITE_QWEN_MODEL;

  // 校验环境变量（避免配置缺失）
  if (!baseUrl || !apiKey || !model) {
    console.error('Qwen API 配置缺失，请检查 .env 文件');
    return getFallbackMotivation();
  }

  try {
    // 1. 构造请求参数（兼容 OpenAI 格式，Qwen 模型直接支持）
    const requestData = {
      model: model, // 复用你的 Qwen2.5-72B-Instruct 模型
      messages: [
        { 
          role: 'system', 
          content: '你是积极向上的待办激励助手，生成1条简短文案。要求：1. 中文口语化；2. 积极正面；3. 不超过20字；4. 带1个emoji；5. 贴合完成任务的场景' 
        },
        { role: 'user', content: '生成1条待办任务完成后的激励文案' }
      ],
      max_tokens: 30, // 限制长度，避免过长
      temperature: 0.8, // 随机性（0-1，越高越多样，复用你之前的思路）
      top_p: 0.9, // 补充参数，提升生成质量
    };

    // 2. 调用 SiliconFlow Qwen API（fetch 原生调用，无需额外依赖）
  // aiUtils.js 中修改请求 URL 部分
const response = await fetch(`/api/qwen/chat/completions`, { // 用代理路径替代原 URL
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  },
  body: JSON.stringify(requestData),
});

    // 3. 解析响应（兼容 OpenAI 的响应格式）
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `API 调用失败（状态码：${response.status}）`);
    }

    // 提取 AI 生成的文案（去除多余空格）
    let aiText = data.choices[0].message.content.trim();

    // 4. 文案校验（确保符合要求，避免 AI 生成异常内容）
    if (!aiText || aiText.length > 25) {
      aiText = aiText.slice(0, 20) + '✨'; // 截断过长文案
    }
    if (!aiText.includes('✨') && !aiText.includes('🚀') && !aiText.includes('👍') && !aiText.includes('🐮') && !aiText.includes('✅')) {
      aiText += '🌟'; // 补充 emoji（如果 AI 没加）
    }

    return aiText;

  } catch (error) {
    console.error('Qwen API 调用失败：', error.message);
    // 降级方案：调用失败时，返回本地固定兜底文案（和之前逻辑一致）
    return getFallbackMotivation();
  }
};

/**
 * 本地兜底文案池（API 调用失败时使用）
 */
const getFallbackMotivation = () => {
  const fallbackList = [
    '任务完成！继续冲呀🚀',
    '太棒啦，又搞定一件事✨',
    '效率超高，为你点赞👍',
    '坚持就是胜利，你真牛🐮',
    '今日份成就感get✅',
    '闪闪发光的你，超棒～🌟',
    '一步一个脚印，继续加油！'
  ];
  return fallbackList[Math.floor(Math.random() * fallbackList.length)];
};