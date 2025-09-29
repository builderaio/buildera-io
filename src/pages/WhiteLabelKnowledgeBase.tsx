import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Search,
  Brain,
  Download,
  Trash2,
  Plus,
  Globe,
  Database,
  Zap
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const WhiteLabelKnowledgeBase = () => {
  const { toast } = useToast();
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Mock knowledge base data
  const knowledgeFiles = [
    { id: 1, name: 'Product Documentation.pdf', type: 'pdf', size: '2.4 MB', status: 'processed', chunks: 45 },
    { id: 2, name: 'Company Policies.docx', type: 'document', size: '1.8 MB', status: 'processing', chunks: 32 },
    { id: 3, name: 'FAQ Database.json', type: 'json', size: '512 KB', status: 'processed', chunks: 128 },
    { id: 4, name: 'Training Videos', type: 'video', size: '156 MB', status: 'processed', chunks: 89 },
    { id: 5, name: 'Website Content.html', type: 'web', size: '3.2 MB', status: 'processed', chunks: 67 }
  ];

  const fileTypeIcons = {
    pdf: FileText,
    document: FileText,
    json: Database,
    video: Video,
    audio: Music,
    image: Image,
    web: Globe
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(acceptedFiles);
  }, []);

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Simulate file upload and processing
      for (const file of selectedFiles) {
        // Upload to Supabase storage
        // Process with RAG pipeline
        // Create embeddings
        // Store in vector database
      }
      
      toast({
        title: "Files uploaded successfully",
        description: `${selectedFiles.length} files uploaded and processing started`,
      });
      setSelectedFiles([]);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleWebScraping = async (url: string) => {
    try {
      // Call web scraping edge function
      toast({
        title: "Web scraping started",
        description: "Content is being extracted and processed",
      });
    } catch (error) {
      console.error('Web scraping error:', error);
      toast({
        title: "Scraping failed",
        description: "Failed to scrape website content",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Upload and manage content for RAG-powered AI agents</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-secondary">
          <Brain className="w-4 h-4 mr-2" />
          RAG Analytics
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search knowledge base content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="web">Web Scraping</TabsTrigger>
          <TabsTrigger value="embeddings">Embeddings</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>File Upload</CardTitle>
                <CardDescription>Upload documents, images, videos, and audio files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports PDF, DOCX, TXT, JSON, MP4, MP3, PNG, JPG
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt,.json,.mp4,.mp3,.png,.jpg,.jpeg"
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                    className="mb-4"
                  />
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium">Selected Files:</p>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  onClick={handleFileUpload} 
                  disabled={uploading || selectedFiles.length === 0}
                  className="w-full"
                >
                  {uploading ? 'Processing...' : 'Upload & Process'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Options</CardTitle>
                <CardDescription>Configure how your content is processed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Chunk Size</label>
                    <Input type="number" defaultValue="1000" className="w-20" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Overlap</label>
                    <Input type="number" defaultValue="200" className="w-20" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Embedding Model</label>
                    <select className="border rounded px-2 py-1">
                      <option>text-embedding-3-small</option>
                      <option>text-embedding-3-large</option>
                      <option>text-embedding-ada-002</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Auto-Processing Features</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      Extract metadata
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      Generate summaries
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      OCR for images
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Audio transcription
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base Files</CardTitle>
              <CardDescription>Manage your uploaded content and embeddings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {knowledgeFiles.map((file) => {
                  const IconComponent = fileTypeIcons[file.type as keyof typeof fileTypeIcons] || FileText;
                  
                  return (
                    <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{file.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {file.size} • {file.chunks} chunks
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={file.status === 'processed' ? 'default' : 'secondary'}>
                          {file.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="web" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Web Content Scraping</CardTitle>
              <CardDescription>Extract content from websites and documentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Enter website URL..." className="flex-1" />
                <Button onClick={() => handleWebScraping('')}>
                  <Globe className="w-4 h-4 mr-2" />
                  Scrape
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-2">Scraping Options</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        Follow internal links
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        Extract images
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        Remove navigation/footer
                      </label>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-2">Content Filters</h4>
                    <div className="space-y-2">
                      <Input placeholder="CSS selector to include" />
                      <Input placeholder="CSS selector to exclude" />
                      <Input placeholder="Max pages to scrape" type="number" defaultValue="10" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embeddings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Embeddings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">2,847</div>
                <p className="text-sm text-muted-foreground">Vector chunks stored</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Embedding Model</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">text-embedding-3-small</div>
                <p className="text-sm text-muted-foreground">1536 dimensions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">127 MB</div>
                <p className="text-sm text-muted-foreground">Vector database</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Embedding Management</CardTitle>
              <CardDescription>Manage vector embeddings and similarity search</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Test similarity search..." className="flex-1" />
                <Button>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Similarity Threshold</label>
                  <Input type="number" min="0" max="1" step="0.1" defaultValue="0.7" />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Results</label>
                  <Input type="number" min="1" max="50" defaultValue="10" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base Testing</CardTitle>
              <CardDescription>Test retrieval accuracy and response quality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Ask a question to test knowledge retrieval..."
                className="min-h-[100px]"
              />
              <Button className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                Test Knowledge Retrieval
              </Button>

              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Test Results</h4>
                <p className="text-sm text-muted-foreground">
                  Test your knowledge base by asking questions. The system will show which documents 
                  were retrieved and their relevance scores.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhiteLabelKnowledgeBase;