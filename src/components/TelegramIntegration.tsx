import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { telegramService } from '../services/telegramService';

export const TelegramIntegration: React.FC = () => {
  const [botInfo, setBotInfo] = useState<any>(null);
  const [webhookInfo, setWebhookInfo] = useState<any>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testChatId, setTestChatId] = useState('');
  const [loading, setLoading] = useState(false);

  const getBotInfo = async () => {
    setLoading(true);
    try {
      const info = await telegramService.getBotInfo();
      setBotInfo(info);
    } catch (error) {
      console.error('Error getting bot info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWebhookInfo = async () => {
    setLoading(true);
    try {
      const info = await telegramService.getWebhookInfo();
      setWebhookInfo(info);
    } catch (error) {
      console.error('Error getting webhook info:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testChatId || !testMessage) {
      alert('Please enter both chat ID and message');
      return;
    }

    setLoading(true);
    try {
      const result = await telegramService.sendMessage(testChatId, testMessage);
      if (result) {
        alert('Test message sent successfully!');
      } else {
        alert('Failed to send test message');
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      alert('Error sending test message: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram Bot Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={getBotInfo} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Loading...' : 'Get Bot Info'}
          </Button>
          
          <Button 
            onClick={getWebhookInfo} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Loading...' : 'Get Webhook Info'}
          </Button>
        </div>

        {botInfo && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Bot Information:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(botInfo, null, 2)}
            </pre>
          </div>
        )}

        {webhookInfo && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Webhook Information:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(webhookInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="font-semibold">Test Message Sending:</h3>
          <input
            type="text"
            placeholder="Chat ID (e.g., 123456789)"
            value={testChatId}
            onChange={(e) => setTestChatId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <textarea
            placeholder="Test message"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            rows={3}
          />
          <Button 
            onClick={sendTestMessage} 
            disabled={loading || !testChatId || !testMessage}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Test Message'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};