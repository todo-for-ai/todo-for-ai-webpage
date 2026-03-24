"""
AI 功能前端组件

提供 AI 任务助手、任务拆分、智能摘要的 UI 组件
"""

import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Spin,
  Alert,
  Card,
  Space,
  Tag,
  Typography,
  message
} from 'antd';
import {
  RobotOutlined,
  SplitCellsOutlined,
  FileTextOutlined,
  SparklesOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text } = Typography;

// AI 任务助手模态框
export const AITaskAssistantModal: React.FC<{
  visible: boolean;
  onCancel: () => void;
  onSubmit: (taskData: any) => void;
}> = ({ visible, onCancel, onSubmit }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/todo-for-ai/api/v1/ai/task-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: values.description,
          project_context: values.project_context
        })
      });

      const data = await response.json();
      if (data.code === 200) {
        setResult(data.data);
        message.success('AI 生成成功！');
      } else {
        message.error(data.message || '生成失败');
      }
    } catch (error) {
      message.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUseResult = () => {
    if (result) {
      onSubmit(result);
      setResult(null);
      form.resetFields();
      onCancel();
    }
  };

  return (
    <Modal
      title={<><RobotOutlined /> AI 任务助手</>}
      visible={visible}
      onCancel={() => {
        setResult(null);
        form.resetFields();
        onCancel();
      }}
      footer={null}
      width={600}
    >
      <Form form={form} onFinish={handleGenerate} layout="vertical">
        <Form.Item
          name="description"
          label="任务描述"
          rules={[{ required: true, message: '请输入任务描述' }]}
        >
          <TextArea
            rows={3}
            placeholder="例如：修复登录页面的bug"
          />
        </Form.Item>

        <Form.Item name="project_context" label="项目背景（可选）">
          <TextArea
            rows={2}
            placeholder="提供项目背景信息，帮助 AI 更好理解任务"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SparklesOutlined />}
            loading={loading}
          >
            AI 生成任务
          </Button>
        </Form.Item>
      </Form>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" tip="AI 正在思考..." />
        </div>
      )}

      {result && (
        <Card
          title="生成结果"
          style={{ marginTop: 16 }}
          extra={
            <Button type="primary" onClick={handleUseResult}>
              使用此结果
            </Button>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>标题：</Text>
              <Text>{result.title}</Text>
            </div>
            <div>
              <Text strong>描述：</Text>
              <Text>{result.description}</Text>
            </div>
            <div>
              <Text strong>优先级：</Text>
              <Tag color={
                result.priority === 'urgent' ? 'red' :
                result.priority === 'high' ? 'orange' :
                result.priority === 'medium' ? 'blue' : 'green'
              }>
                {result.priority}
              </Tag>
            </div>
            {result.tags && result.tags.length > 0 && (
              <div>
                <Text strong>标签：</Text>
                {result.tags.map((tag: string) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            )}
          </Space>
        </Card>
      )}
    </Modal>
  );
};

// AI 任务拆分按钮
export const AITaskSplitButton: React.FC<{
  taskId: number;
  onSuccess?: () => void;
}> = ({ taskId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [numSubtasks, setNumSubtasks] = useState(3);

  const handleSplit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/todo-for-ai/api/v1/tasks/${taskId}/ai-split`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ num_subtasks: numSubtasks })
        }
      );

      const data = await response.json();
      if (data.code === 200) {
        setResult(data.data);
        message.success(`成功拆分为 ${data.data.total_subtasks} 个子任务！`);
        onSuccess?.();
      } else {
        message.error(data.message || '拆分失败');
      }
    } catch (error) {
      message.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        icon={<SplitCellsOutlined />}
        onClick={() => setModalVisible(true)}
      >
        AI 拆分任务
      </Button>

      <Modal
        title={<><SplitCellsOutlined /> AI 任务拆分</>}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setResult(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="split"
            type="primary"
            loading={loading}
            onClick={handleSplit}
          >
            开始拆分
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>将当前任务拆分为 </Text>
          <Input.Number
            min={2}
            max={10}
            value={numSubtasks}
            onChange={(v) => setNumSubtasks(v || 3)}
            style={{ width: 60, margin: '0 8px' }}
          />
          <Text> 个子任务</Text>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin tip="AI 正在分析任务..." />
          </div>
        )}

        {result && (
          <div>
            <Alert
              message={result.execution_order}
              type="info"
              style={{ marginBottom: 16 }}
            />
            {result.subtasks.map((subtask: any, index: number) => (
              <Card
                key={index}
                size="small"
                title={`子任务 ${subtask.order}: ${subtask.title}`}
                style={{ marginBottom: 8 }}
              >
                <Text type="secondary">{subtask.description}</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={
                    subtask.priority === 'urgent' ? 'red' :
                    subtask.priority === 'high' ? 'orange' :
                    subtask.priority === 'medium' ? 'blue' : 'green'
                  }>
                    {subtask.priority}
                  </Tag>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
};

// AI 智能摘要组件
export const AISummaryCard: React.FC<{
  type: 'task' | 'project';
  id: number;
}> = ({ type, id }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/todo-for-ai/api/v1/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, id })
      });

      const data = await response.json();
      if (data.code === 200) {
        setSummary(data.data.summary);
      } else {
        message.error(data.message || '生成失败');
      }
    } catch (error) {
      message.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={<><FileTextOutlined /> AI 智能摘要</>}
      extra={
        <Button
          icon={<SparklesOutlined />}
          loading={loading}
          onClick={generateSummary}
          size="small"
        >
          生成摘要
        </Button>
      }
    >
      {loading ? (
        <Spin tip="AI 正在生成摘要..." />
      ) : summary ? (
        <Text>{summary}</Text>
      ) : (
        <Text type="secondary">点击"生成摘要"获取 AI 生成的内容摘要</Text>
      )}
    </Card>
  );
};

// 导出所有组件
export default {
  AITaskAssistantModal,
  AITaskSplitButton,
  AISummaryCard
};
