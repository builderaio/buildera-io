import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Copy, 
  Download, 
  ExternalLink, 
  Key, 
  Settings,
  Globe,
  Lock,
  Zap,
  FileText,
  Terminal,
  Book
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useParams } from 'react-router-dom';

const WhiteLabelAPIGenerator = () => {
  const { templateId } = useParams();
  const { toast } = useToast();
  const [template, setTemplate] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState('chat');

  // Mock template data
  const mockTemplate = {
    id: templateId,
    name: 'Customer Support Pro',
    description: 'Advanced customer support agent with knowledge base integration',
    endpoints: [
      { name: 'chat', method: 'POST', path: '/api/v1/chat' },
      { name: 'status', method: 'GET', path: '/api/v1/status' },
      { name: 'config', method: 'GET', path: '/api/v1/config' },
      { name: 'webhook', method: 'POST', path: '/api/v1/webhook' }
    ]
  };

  const codeExamples = {
    javascript: `// JavaScript/Node.js Example
const response = await fetch('https://api.whitelabel.ai/v1/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "Hello, I need help with my order",
    session_id: "unique-session-id",
    context: {
      user_id: "user123",
      company_id: "company456"
    }
  })
});

const data = await response.json();
console.log(data.response);`,
    
    python: `# Python Example
import requests

url = "https://api.whitelabel.ai/v1/chat"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}

payload = {
    "message": "Hello, I need help with my order",
    "session_id": "unique-session-id",
    "context": {
        "user_id": "user123",
        "company_id": "company456"
    }
}

response = requests.post(url, headers=headers, json=payload)
print(response.json()["response"])`,

    curl: `# cURL Example
curl -X POST https://api.whitelabel.ai/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello, I need help with my order",
    "session_id": "unique-session-id",
    "context": {
      "user_id": "user123",
      "company_id": "company456"
    }
  }'`,

    php: `<?php
// PHP Example
$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://api.whitelabel.ai/v1/chat',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS => json_encode([
    'message' => 'Hello, I need help with my order',
    'session_id' => 'unique-session-id',
    'context' => [
      'user_id' => 'user123',
      'company_id' => 'company456'
    ]
  ]),
  CURLOPT_HTTPHEADER => array(
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json'
  ),
));

$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`
  };

  useEffect(() => {
    setTemplate(mockTemplate);
    generateApiKey();
  }, [templateId]);

  const generateApiKey = () => {
    const key = `wl_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(key);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Code example copied successfully",
    });
  };

  const downloadSDK = (language: string) => {
    toast({
      title: `${language} SDK downloaded`,
      description: "SDK package downloaded to your computer",
    });
  };

  if (!template) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground">Auto-generated API docs for {template.name}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in Postman
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Download OpenAPI Spec
          </Button>
        </div>
      </div>

      {/* API Key Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Authentication
          </CardTitle>
          <CardDescription>
            Use this API key to authenticate requests to your WhiteLabel agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              value={apiKey} 
              readOnly 
              className="font-mono"
            />
            <Button variant="outline" onClick={() => copyToClipboard(apiKey)}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={generateApiKey}>
              Regenerate
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Include this key in the Authorization header: <code>Bearer {apiKey}</code>
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="examples">Code Examples</TabsTrigger>
          <TabsTrigger value="sdks">SDKs</TabsTrigger>
          <TabsTrigger value="testing">API Testing</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  Base URL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <code className="text-sm bg-muted p-2 rounded block">
                  https://api.whitelabel.ai
                </code>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-green-500" />
                  Authentication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Bearer Token Authentication</p>
                <Badge variant="secondary">API Key Required</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-500" />
                  Rate Limits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">1000 requests/hour</p>
                <Badge variant="outline">Adjustable per deployment</Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Start Guide</CardTitle>
              <CardDescription>Get started with your AI agent API in minutes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <h4 className="font-medium">Get your API key</h4>
                    <p className="text-sm text-muted-foreground">Copy the API key from the authentication section above</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <h4 className="font-medium">Make your first request</h4>
                    <p className="text-sm text-muted-foreground">Send a POST request to /api/v1/chat with your message</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <h4 className="font-medium">Handle the response</h4>
                    <p className="text-sm text-muted-foreground">Process the AI-generated response in your application</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {template.endpoints.map((endpoint: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
                        {endpoint.method}
                      </Badge>
                      <code>{endpoint.path}</code>
                    </CardTitle>
                    <Button variant="outline" size="sm">
                      <Code className="w-4 h-4 mr-2" />
                      Try it
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">
                        {endpoint.name === 'chat' && 'Send a message to the AI agent and receive a response'}
                        {endpoint.name === 'status' && 'Check the health and status of the AI agent'}
                        {endpoint.name === 'config' && 'Get the current configuration of the AI agent'}
                        {endpoint.name === 'webhook' && 'Receive webhook notifications from the AI agent'}
                      </p>
                    </div>

                    {endpoint.name === 'chat' && (
                      <div>
                        <h4 className="font-medium mb-2">Request Body</h4>
                        <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`{
  "message": "string (required)",
  "session_id": "string (optional)",
  "context": {
    "user_id": "string",
    "company_id": "string",
    "custom_data": {}
  },
  "stream": false
}`}
                        </pre>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium mb-2">Response</h4>
                      <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{endpoint.name === 'chat' ? `{
  "response": "AI-generated response text",
  "session_id": "unique-session-identifier",
  "tokens_used": 156,
  "response_time_ms": 1200,
  "confidence": 0.95
}` : `{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": "99.9%"
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
              <CardDescription>Ready-to-use code snippets in popular programming languages</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="javascript" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="php">PHP</TabsTrigger>
                </TabsList>

                {Object.entries(codeExamples).map(([language, code]) => (
                  <TabsContent key={language} value={language}>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{code}</code>
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(code)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sdks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['JavaScript', 'Python', 'PHP', 'Go'].map((language, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    {language} SDK
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Official SDK for {language} with TypeScript support
                  </p>
                  <Button 
                    onClick={() => downloadSDK(language)}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Installation Instructions</CardTitle>
              <CardDescription>How to install and configure the SDKs</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="npm" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="npm">npm</TabsTrigger>
                  <TabsTrigger value="pip">pip</TabsTrigger>
                  <TabsTrigger value="composer">Composer</TabsTrigger>
                </TabsList>

                <TabsContent value="npm">
                  <pre className="bg-muted p-3 rounded text-sm">
                    <code>npm install @whitelabel/ai-sdk</code>
                  </pre>
                </TabsContent>

                <TabsContent value="pip">
                  <pre className="bg-muted p-3 rounded text-sm">
                    <code>pip install whitelabel-ai</code>
                  </pre>
                </TabsContent>

                <TabsContent value="composer">
                  <pre className="bg-muted p-3 rounded text-sm">
                    <code>composer require whitelabel/ai-sdk</code>
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Testing Console</CardTitle>
              <CardDescription>Test your API endpoints directly from the documentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Endpoint</label>
                  <select 
                    value={selectedEndpoint}
                    onChange={(e) => setSelectedEndpoint(e.target.value)}
                    className="w-full border rounded px-3 py-2 mt-1"
                  >
                    {template.endpoints.map((endpoint: any) => (
                      <option key={endpoint.name} value={endpoint.name}>
                        {endpoint.method} {endpoint.path}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Environment</label>
                  <select className="w-full border rounded px-3 py-2 mt-1">
                    <option>Production</option>
                    <option>Staging</option>
                    <option>Development</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Request Body</label>
                <Textarea 
                  placeholder='{"message": "Hello, I need help"}'
                  className="mt-1 font-mono"
                  rows={6}
                />
              </div>

              <Button className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                Send Request
              </Button>

              <div>
                <label className="text-sm font-medium">Response</label>
                <pre className="bg-muted p-3 rounded text-sm mt-1">
                  <code>Click "Send Request" to see the response...</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>Receive real-time notifications from your AI agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Webhook URL</label>
                <Input 
                  placeholder="https://your-domain.com/webhook"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Events</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {['conversation.started', 'conversation.ended', 'message.received', 'error.occurred'].map((event) => (
                    <label key={event} className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Configure Webhooks
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Payload Example</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`{
  "event": "conversation.started",
  "timestamp": "2024-09-29T10:30:00Z",
  "data": {
    "session_id": "session_123",
    "user_id": "user_456",
    "agent_id": "agent_789"
  },
  "signature": "sha256=abc123..."
}`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhiteLabelAPIGenerator;