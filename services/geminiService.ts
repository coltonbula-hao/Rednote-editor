
import { GoogleGenAI } from "@google/genai";
import { UploadedFile, XhsStyle } from "../types";

const STYLE_GUIDELINES: Record<XhsStyle, string> = {
  [XhsStyle.STORYTELLING]: `
风格指南：【故事感/叙事型】
- 以“我”的视角出发，讲述一个完整的小故事或心路历程。
- 强调情绪起伏和个人感悟，让读者产生共鸣。
- 叙述要自然，像在深夜和朋友交心。
- 弱化排版，强化文字的流畅感。
`,
  [XhsStyle.LISTICLE]: `
风格指南：【干货清单/教科书型】
- 极度结构化，大量使用数字编号（1. 2. 3.）或符号点。
- 核心信息前置，每一段都要有明确的重点。
- 适合收藏，让读者觉得“全是干货，不收藏亏了”。
- 使用视觉分隔符让层次分明。
`,
  [XhsStyle.REVIEW]: `
风格指南：【深度评测/专业型】
- 逻辑严密，包含优缺点对比、适用人群建议。
- 语气专业但不高冷，用数据或具体细节说话。
- 给出最终的“购买建议”或“避雷指南”。
- 适合对某个领域有深入见解的内容。
`
};

const SYSTEM_INSTRUCTION = `
你是一个世界级的内容策略专家和多平台内容生产 Agent。你的任务是将输入的信息源（PDF、文本、Transcript）转化为高质量的结构化内容。

请严格遵循以下输出格式和规则，不要改变分割线的标记：

[Part 1 博文 Markdown]
提炼出一份适合文案。在1000字左右
要求：
1. **正文结构：**
   - **黄金开头：** 用一句话制造悬念或指出残酷现状，迅速抓住注意力。
   - **Part 1 现状/误区：** 指出大家通常的错误认知或面临的危机（痛点）。
   - **Part 2 核心新知：** 抛出你的核心观点/概念（爽点），用“金句”解释它为什么重要。
   - **Part 3 实操/建议：** 给出 1-2 个具体的落地建议或行动指南（干货）。
2. **语气风格：**
   - 必须口语化，像在和朋友聊天。
   - 大量使用 Emoji 🌟 调节视觉节奏。
   - 拒绝说教，多用感叹句和反问句。
   - **绝对禁止**使用“姐妹们”、“家人们”、“兄弟们”、“集美们”等过于亲昵或网络化的称呼，保持真诚自然的交流感。
3. **结尾互动：** 设计一个引发讨论的问题，并引导关注。
4. **标签：** 生成 5个高热度标签。

[Part 2 小红书标题]
起3个极具吸引力、带有“痛点”或“情绪价值”的封面标题（包含emoji）。
格式：
1. ...
2. ...
3. ...

[Part 3 小红书图文内容]
基于上面的博文核心，改写为适合小红书发布的短文。
要求：
- **格式：** 纯文本输出，**不要使用任何 Markdown 标记**（如 **加粗** 或 # 标题）。小红书不支持 Markdown，请直接用 Emoji 或空行分隔。
- 600字以内。
- 开头抓人+3-5个分点+结尾引导关注。
- 极度口语化，情绪饱满。
- 包含相关 Emoji。
- **绝对禁止**使用“姐妹们”、“家人们”、“兄弟们”、“集美们”等过于亲昵或网络化的称呼，语气要真诚自然。
- **文末标签：** 生成 5-8 个与内容高度相关的高热度标签（Hashtags），例如 #关键词 #话题。

[Part 4 信息图提示词]
基于小红书内容，设计 5 张信息图的画面描述，这 5 张图将构成一个完整的滑动图文。

**关键要求：**
1. **画面风格统一：** 必须全部使用 **“清新治愈的彩绘插画风格 (Fresh and healing painted illustration style)”**，色彩明亮轻快，笔触自然，类似儿童绘本或手账风格。
2. **文字准确：** 必须在描述中明确指出图片中需要显示的中文文字，格式严格为 Text: "文字内容"。
3. **格式严格：** 每行一个，不要包含多余的分析文字。

Image 1: <第1张封面图，彩绘插画风格，画面描述...，包含 Text: "标题文字">
Image 2: <第2张图，彩绘插画风格，画面描述...，可视化核心观点，包含 Text: "关键数据或文字">
Image 3: <第3张图，彩绘插画风格，画面描述...，包含 Text: "对比关键词">
Image 4: <第4张图，彩绘插画风格，画面描述...，步骤或清单，包含 Text: "步骤名称">
Image 5: <第5张图，彩绘插画风格，画面描述...，总结，包含 Text: "行动呼吁">
`;

// Helper to wait
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateContent = async (
  inputText: string,
  file: UploadedFile | null,
  style: XhsStyle = XhsStyle.LISTICLE
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];
  
  // Add file if exists
  if (file) {
    parts.push({
      inlineData: {
        mimeType: file.type,
        data: file.data
      }
    });
  }

  // Add text prompt
  let userPrompt = "请处理以下内容：\n";
  if (inputText) {
    userPrompt += `内容文本/链接: ${inputText}\n`;
  }
  if (file) {
    userPrompt += `(见附带的文件: ${file.name})\n`;
  }

  // Append Style Guideline
  userPrompt += `\n特别要求：在生成 [Part 3 小红书图文内容] 时，请务必严格遵循以下写作风格要求：\n${STYLE_GUIDELINES[style]}\n`;
  
  parts.push({ text: userPrompt });

  // Retry logic for 500 errors
  const maxRetries = 3;
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          role: 'user',
          parts: parts
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
          maxOutputTokens: 8192, 
        }
      });

      return response.text || "无法生成内容，请重试。";
    } catch (error: any) {
      console.error(`Gemini API Error (Attempt ${i + 1}/${maxRetries}):`, error);
      lastError = error;
      
      // If error is 500 or 503, wait and retry
      if (error.status === 500 || error.status === 503) {
        await delay(1000 * Math.pow(2, i)); // Exponential backoff: 1s, 2s, 4s
        continue;
      }
      
      // For other errors (like 400), break immediately
      throw error;
    }
  }
  
  throw lastError;
};

export const generateImageFromPrompt = async (prompt: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  return null;
};
