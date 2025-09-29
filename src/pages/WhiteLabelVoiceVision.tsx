import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Camera, 
  Image, 
  Play, 
  Pause,
  Upload,
  Download,
  Settings,
  Zap,
  Eye,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const WhiteLabelVoiceVision = () => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ElevenLabs voices
  const elevenLabsVoices = [
    { id: 'alloy', name: 'Alloy', description: 'Balanced and professional' },
    { id: 'echo', name: 'Echo', description: 'Clear and articulate' },
    { id: 'fable', name: 'Fable', description: 'Warm and engaging' },
    { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
    { id: 'nova', name: 'Nova', description: 'Friendly and approachable' },
    { id: 'shimmer', name: 'Shimmer', description: 'Smooth and elegant' }
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Speak now to record your voice",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice features",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    toast({
      title: "Recording stopped",
      description: "Processing audio...",
    });
  };

  const testTextToSpeech = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: selectedVoice }
      });

      if (error) throw error;

      // Play the generated audio
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audio.play();

      toast({
        title: "Text-to-speech generated",
        description: "Playing generated audio",
      });
    } catch (error) {
      console.error('TTS error:', error);
      toast({
        title: "TTS failed",
        description: "Failed to generate speech",
        variant: "destructive",
      });
    }
  };

  const analyzeImage = async (imageFile: File) => {
    try {
      setAnalysisResult(null);
      
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        setUploadedImage(base64Image);

        // Call vision analysis edge function
        const { data, error } = await supabase.functions.invoke('image-analysis', {
          body: { 
            image: base64Image.split(',')[1], // Remove data:image/jpeg;base64, prefix
            analysis_type: 'comprehensive'
          }
        });

        if (error) throw error;

        setAnalysisResult(data);
        toast({
          title: "Image analyzed successfully",
          description: "AI analysis complete",
        });
      };
      
      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error('Vision analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze image",
        variant: "destructive",
      });
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to use vision features",
        variant: "destructive",
      });
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg');
      setUploadedImage(imageData);
      
      // Convert to file and analyze
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
          analyzeImage(file);
        }
      });
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Voice & Vision</h1>
          <p className="text-muted-foreground">Advanced multimodal AI capabilities</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-secondary">
          <Settings className="w-4 h-4 mr-2" />
          Configure Models
        </Button>
      </div>

      <Tabs defaultValue="voice" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="voice">Voice Processing</TabsTrigger>
          <TabsTrigger value="vision">Computer Vision</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
          <TabsTrigger value="testing">Live Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Text-to-Speech */}
            <Card>
              <CardHeader>
                <CardTitle>Text-to-Speech</CardTitle>
                <CardDescription>Convert text to natural-sounding speech</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Voice Selection</label>
                  <select 
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full border rounded px-3 py-2 mt-1"
                  >
                    {elevenLabsVoices.map(voice => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name} - {voice.description}
                      </option>
                    ))}
                  </select>
                </div>

                <Textarea 
                  placeholder="Enter text to convert to speech..."
                  className="min-h-[100px]"
                  id="tts-text"
                />

                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      const text = (document.getElementById('tts-text') as HTMLTextAreaElement)?.value;
                      if (text) testTextToSpeech(text);
                    }}
                    className="flex-1"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Generate Speech
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium">Speed</label>
                    <Input type="range" min="0.5" max="2" step="0.1" defaultValue="1" />
                  </div>
                  <div>
                    <label className="font-medium">Pitch</label>
                    <Input type="range" min="-20" max="20" step="1" defaultValue="0" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Speech-to-Text */}
            <Card>
              <CardHeader>
                <CardTitle>Speech-to-Text</CardTitle>
                <CardDescription>Convert voice input to text with high accuracy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "destructive" : "default"}
                    size="lg"
                    className={`w-24 h-24 rounded-full ${isRecording ? 'animate-pulse' : ''}`}
                  >
                    {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  </Button>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
                  </p>
                </div>

                <div className="border rounded-lg p-4 bg-muted/50 min-h-[100px]">
                  <h4 className="font-medium mb-2">Transcription:</h4>
                  <p className="text-sm text-muted-foreground">
                    {isRecording ? 'Listening...' : 'Click the microphone to start recording'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Language</label>
                    <select className="w-full border rounded px-2 py-1 mt-1">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Model</label>
                    <select className="w-full border rounded px-2 py-1 mt-1">
                      <option value="whisper-1">Whisper v1</option>
                      <option value="whisper-large">Whisper Large</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Voice Cloning */}
          <Card>
            <CardHeader>
              <CardTitle>Voice Cloning & Synthesis</CardTitle>
              <CardDescription>Create custom voices from samples</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Upload Voice Sample</h4>
                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Audio File
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Upload a clear 30-60 second audio sample
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Training Status</h4>
                  <div className="space-y-2">
                    <Badge>Ready for Training</Badge>
                    <p className="text-xs text-muted-foreground">
                      No custom voices trained yet
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Voice Library</h4>
                  <Button className="w-full">
                    <Zap className="w-4 h-4 mr-2" />
                    Browse Voice Library
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vision" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Upload & Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Image Analysis</CardTitle>
                <CardDescription>AI-powered image understanding and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  {uploadedImage ? (
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded" 
                      className="max-w-full max-h-48 mx-auto rounded-lg"
                    />
                  ) : (
                    <div>
                      <Image className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Upload an image for AI analysis
                      </p>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) analyzeImage(file);
                  }}
                  className="hidden"
                />

                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>

                {analysisResult && (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="font-medium mb-2">Analysis Result:</h4>
                    <p className="text-sm">{analysisResult.description}</p>
                    {analysisResult.objects && (
                      <div className="mt-2">
                        <p className="text-xs font-medium">Detected Objects:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysisResult.objects.map((obj: string, index: number) => (
                            <Badge key={index} variant="secondary">{obj}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Camera */}
            <Card>
              <CardHeader>
                <CardTitle>Live Camera Feed</CardTitle>
                <CardDescription>Real-time image capture and analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full rounded-lg bg-muted"
                    style={{ maxHeight: '240px' }}
                    muted
                  />
                  {!videoRef.current?.srcObject && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                      <Camera className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={startCamera} className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                  <Button onClick={captureImage} variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Capture & Analyze
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium">Resolution</label>
                    <select className="w-full border rounded px-2 py-1 mt-1">
                      <option>640x480</option>
                      <option>1280x720</option>
                      <option>1920x1080</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-medium">Analysis Mode</label>
                    <select className="w-full border rounded px-2 py-1 mt-1">
                      <option>Object Detection</option>
                      <option>Scene Description</option>
                      <option>OCR Text</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Vision Features */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Vision Capabilities</CardTitle>
              <CardDescription>Specialized computer vision models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Eye className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <h4 className="font-medium">OCR</h4>
                    <p className="text-xs text-muted-foreground">Extract text from images</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <Image className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <h4 className="font-medium">Object Detection</h4>
                    <p className="text-xs text-muted-foreground">Identify objects and people</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <h4 className="font-medium">Scene Analysis</h4>
                    <p className="text-xs text-muted-foreground">Understand context</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <h4 className="font-medium">Image Q&A</h4>
                    <p className="text-xs text-muted-foreground">Answer questions about images</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Multimodal Integration</CardTitle>
              <CardDescription>Combine voice and vision in agent workflows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Voice + Vision Workflows</h4>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium text-sm">Image Description</h5>
                      <p className="text-xs text-muted-foreground">Analyze image and speak description</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium text-sm">Voice-Controlled Vision</h5>
                      <p className="text-xs text-muted-foreground">Voice commands to trigger image analysis</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium text-sm">Multimodal Chat</h5>
                      <p className="text-xs text-muted-foreground">Text, voice, and image in one conversation</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">API Configuration</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium">Voice Provider</label>
                      <select className="w-full border rounded px-3 py-2 mt-1">
                        <option>ElevenLabs</option>
                        <option>OpenAI TTS</option>
                        <option>Azure Speech</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Vision Provider</label>
                      <select className="w-full border rounded px-3 py-2 mt-1">
                        <option>OpenAI GPT-4 Vision</option>
                        <option>Google Vision AI</option>
                        <option>Azure Computer Vision</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Multimodal Testing</CardTitle>
              <CardDescription>Test voice and vision capabilities in real-time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Test Conversation</h4>
                  <div className="border rounded-lg p-4 bg-muted/50 min-h-[200px]">
                    <p className="text-sm text-muted-foreground">
                      Start a multimodal conversation to test voice and vision integration...
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <Mic className="w-4 h-4 mr-2" />
                      Voice Input
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Image className="w-4 h-4 mr-2" />
                      Add Image
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">1.2s</div>
                        <p className="text-xs text-muted-foreground">Voice Response Time</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">0.8s</div>
                        <p className="text-xs text-muted-foreground">Vision Analysis Time</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhiteLabelVoiceVision;