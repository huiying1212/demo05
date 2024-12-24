// server.mjs
import dotenv from 'dotenv';
import OpenAI from 'openai';
import express from 'express';
import cors from 'cors';
import { agentAResult } from './mockData.mjs'; // 引入测试输入
import axios from 'axios';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const assistantId = 'asst_YpyxHD5eDY3bmbUqJhDSV0Ij';

const app = express();
app.use(cors());
app.use(express.json());

// 等待助手运行完成的函数
async function waitForRunCompletion(threadId, runId) {
  let run;
  while (true) {
    run = await openai.beta.threads.runs.retrieve(threadId, runId);
    if (run.status === 'completed' || run.status === 'failed') {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒
  }
  return run;
}

app.post('/chat', async (req, res) => {
  try {
    // 直接使用agentAResult中的Dialogue作为输入
    const dialogueContent = agentAResult.Dialogue; 
    
    // 创建一个新的对话线程
    const thread = await openai.beta.threads.create();

    // 将输入消息添加到线程中
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: dialogueContent,
    });

    // 运行助手
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    // 等待运行完成
    let completedRun = await waitForRunCompletion(thread.id, run.id);
    
    if (completedRun.status === 'completed') {
      // 获取消息列表
      const messages = await openai.beta.threads.messages.list(completedRun.thread_id);
      const assistantMessage = messages.data.find(m => m.role === 'assistant');
      const assistantReply = assistantMessage.content[0].text.value;

      // 在解析之前记录助手的回复
      console.log('Assistant Reply:', assistantReply);

      let data;
      try {
        // 解析助手的回复为JSON
        data = JSON.parse(assistantReply);
      } catch (parseError) {
        console.error('JSON Parsing Error:', parseError);
        return res.status(500).json({ error: 'Invalid JSON format' });
      }
      // 将数据发送回前端
      res.json({ reply: assistantReply, data });
    } else {
      console.error('Run failed. Error details:', completedRun.error);
      res.status(500).json({ error: 'Run failed', details: completedRun.error });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Run failed' });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
