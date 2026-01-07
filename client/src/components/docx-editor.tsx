import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  FileText, Eye, Plus, Loader2, RefreshCw, 
  BookOpen, History, RotateCcw, Save, Clock, User, Download
} from "lucide-react";
import { VariableBrowser } from "./variable-browser";
import type { ContractTemplateVersion } from "@shared/schema";

interface DocxEditorProps {
  categoryId: number;
  countryCode: string;
  onClose: () => void;
  onSave?: () => void;
}

export function DocxEditor({ categoryId, countryCode, onClose, onSave }: DocxEditorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState("");
  const [showSampleData, setShowSampleData] = useState(false);
  const [extractedFields, setExtractedFields] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [insertDialogOpen, setInsertDialogOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [newPlaceholder, setNewPlaceholder] = useState("");
  const [inserting, setInserting] = useState(false);
  
  const [saveVersionDialogOpen, setSaveVersionDialogOpen] = useState(false);
  const [versionDescription, setVersionDescription] = useState("");
  const [savingVersion, setSavingVersion] = useState(false);
  const [revertingId, setRevertingId] = useState<number | null>(null);
  
  const { data: versions = [], isLoading: versionsLoading, refetch: refetchVersions } = useQuery<ContractTemplateVersion[]>({
    queryKey: ['/api/contract-categories', categoryId, 'countries', countryCode, 'versions'],
    queryFn: async () => {
      const res = await fetch(`/api/contract-categories/${categoryId}/countries/${countryCode}/versions`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load versions');
      return res.json();
    }
  });
  
  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('sk-SK', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const loadHtmlContent = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(
        `/api/contracts/categories/${categoryId}/default-templates/${countryCode}/docx-html?withSampleData=${showSampleData}&t=${Date.now()}`,
        { credentials: "include" }
      );
      
      if (!response.ok) {
        throw new Error("Failed to load DOCX content");
      }
      
      const data = await response.json();
      
      let safeHtml = data.html || "";
      if (safeHtml.length > 500000) {
        safeHtml = safeHtml.replace(/data:image\/[^;]+;base64,[^"']+/g, "data:image/png;base64,placeholder");
      }
      
      setHtmlContent(safeHtml);
      setExtractedFields(data.extractedFields || []);
    } catch (error) {
      console.error("Error loading DOCX:", error);
      setLoadError((error as Error).message);
      toast({
        title: "Chyba",
        description: "Nepodarilo sa načítať obsah dokumentu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadHtmlContent();
  }, [categoryId, countryCode, showSampleData]);
  
  const handleSaveVersion = async () => {
    setSavingVersion(true);
    try {
      const res = await fetch(`/api/contract-categories/${categoryId}/countries/${countryCode}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ changeDescription: versionDescription || undefined })
      });
      if (!res.ok) throw new Error('Failed to save version');
      toast({ title: "Verzia uložená", description: "Nová verzia šablóny bola vytvorená" });
      refetchVersions();
      setSaveVersionDialogOpen(false);
      setVersionDescription("");
    } catch (error) {
      toast({ title: "Chyba", description: "Nepodarilo sa uložiť verziu", variant: "destructive" });
    } finally {
      setSavingVersion(false);
    }
  };
  
  const handleRevert = async (versionId: number) => {
    if (!confirm("Naozaj chcete obnoviť túto verziu? Aktuálna šablóna bude prepísaná.")) return;
    setRevertingId(versionId);
    try {
      const res = await fetch(`/api/contract-categories/${categoryId}/countries/${countryCode}/versions/${versionId}/revert`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to revert');
      toast({ title: "Verzia obnovená", description: "Šablóna bola vrátená na vybranú verziu" });
      await loadHtmlContent();
      refetchVersions();
      if (onSave) onSave();
    } catch (error) {
      toast({ title: "Chyba", description: "Nepodarilo sa obnoviť verziu", variant: "destructive" });
    } finally {
      setRevertingId(null);
    }
  };
  
  const handleInsertPlaceholder = async () => {
    if (!searchText.trim() || !newPlaceholder.trim()) {
      toast({
        title: "Chyba",
        description: "Vyplňte text na nahradenie a názov premennej",
        variant: "destructive"
      });
      return;
    }
    
    setInserting(true);
    try {
      const response = await fetch(
        `/api/contracts/categories/${categoryId}/default-templates/${countryCode}/insert-placeholder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            searchText: searchText.trim(),
            placeholder: newPlaceholder.trim()
          })
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to insert placeholder");
      }
      
      const result = await response.json();
      
      toast({
        title: "Premenná vložená",
        description: result.message
      });
      
      setExtractedFields(result.extractedFields || []);
      
      setInsertDialogOpen(false);
      setSearchText("");
      setNewPlaceholder("");
      
      await loadHtmlContent();
      
      if (onSave) onSave();
    } catch (error) {
      console.error("Insert error:", error);
      toast({
        title: "Chyba",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setInserting(false);
    }
  };
  
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <div>
          <p className="text-destructive font-medium mb-2">Chyba pri načítaní</p>
          <p className="text-muted-foreground text-sm">{loadError}</p>
          <Button variant="outline" className="mt-4" onClick={loadHtmlContent}>
            Skúsiť znova
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="editor" className="flex flex-col h-full">
        <div className="flex items-center justify-between gap-4 px-4 pt-4 pb-2 border-b flex-wrap">
          <TabsList className="grid grid-cols-3 w-auto">
            <TabsTrigger value="editor" className="gap-2" data-testid="tab-docx-editor">
              <FileText className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2" data-testid="tab-docx-preview">
              <Eye className="h-4 w-4" />
              Náhľad
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2" data-testid="tab-docx-history">
              <History className="h-4 w-4" />
              História ({versions.length})
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/api/contracts/categories/${categoryId}/templates/${countryCode}/download`, '_blank')}
              data-testid="button-download-docx"
            >
              <Download className="h-4 w-4 mr-1" />
              Stiahnuť DOCX
            </Button>
          </div>
        </div>
        
        <TabsContent value="editor" className="flex-1 m-0 overflow-hidden flex">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b bg-muted/30 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{extractedFields.length} premenných</Badge>
                <span className="text-sm text-muted-foreground">v dokumente</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setInsertDialogOpen(true)}
                  data-testid="button-add-placeholder"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Pridať premennú
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadHtmlContent}
                  disabled={loading}
                  data-testid="button-refresh"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-4 bg-white dark:bg-gray-900 min-h-full">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !htmlContent ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <p>Žiadny obsah na zobrazenie</p>
                  </div>
                ) : (
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                )}
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t bg-blue-50 dark:bg-blue-900/20">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Ako pridať premennú:</strong> Kliknite "Pridať premennú", zadajte presný text z dokumentu a vyberte premennú z registra.
              </p>
            </div>
          </div>
          
          <div className="w-80 border-l flex flex-col overflow-hidden">
            <div className="p-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="font-medium text-sm">Register premenných</span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <VariableBrowser
                onInsertVariable={(key) => {
                  setNewPlaceholder(key);
                  setInsertDialogOpen(true);
                }}
                onCopyVariable={(key) => {
                  navigator.clipboard.writeText(`{{${key}}}`);
                  toast({
                    title: "Skopírované",
                    description: `{{${key}}} bolo skopírované do schránky`
                  });
                }}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="flex-1 m-0 overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Náhľad dokumentu</span>
              <Badge variant={showSampleData ? "default" : "outline"}>
                {showSampleData ? "So vzorovými dátami" : "S premennými"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={!showSampleData ? "default" : "outline"}
                size="sm"
                onClick={() => setShowSampleData(false)}
                data-testid="button-show-variables"
              >
                Premenné
              </Button>
              <Button
                variant={showSampleData ? "default" : "outline"}
                size="sm"
                onClick={() => setShowSampleData(true)}
                data-testid="button-show-sample"
              >
                Vzorové dáta
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadHtmlContent}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-6 bg-white dark:bg-gray-900 min-h-full">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert mx-auto"
                  style={{ maxWidth: '21cm' }}
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              )}
            </div>
          </ScrollArea>
          
          <div className="p-3 border-t bg-muted/30">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block px-2 py-1 rounded text-xs" style={{ background: '#fff3cd', color: '#856404' }}>
                  {"{{premenná}}"}
                </span>
                <span className="text-muted-foreground">Premenná</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block px-2 py-1 rounded text-xs" style={{ background: '#d4edda', color: '#155724' }}>
                  Ján Novák
                </span>
                <span className="text-muted-foreground">Vzorová hodnota</span>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="flex-1 m-0 overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <span className="font-medium">História verzií</span>
              <Badge variant="secondary">{versions.length} verzií</Badge>
            </div>
            <Button onClick={() => setSaveVersionDialogOpen(true)} data-testid="button-save-new-version">
              <Save className="h-4 w-4 mr-2" />
              Uložiť novú verziu
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4">
              {versionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="font-medium">Žiadne uložené verzie</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kliknite "Uložiť novú verziu" pre vytvorenie zálohy
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version, idx) => (
                    <Card key={version.id} className={idx === 0 ? "border-primary border-2" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <Badge variant={idx === 0 ? "default" : "outline"}>
                                v{version.versionNumber}
                              </Badge>
                              {idx === 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  Aktuálna verzia
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <Clock className="h-4 w-4" />
                              {formatDate(version.createdAt)}
                            </div>
                            {version.createdByName && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <User className="h-4 w-4" />
                                {version.createdByName}
                              </div>
                            )}
                            {version.changeDescription && (
                              <p className="text-sm mt-2 p-2 bg-muted rounded">
                                {version.changeDescription}
                              </p>
                            )}
                          </div>
                          {idx > 0 && (
                            <Button 
                              variant="outline"
                              onClick={() => handleRevert(version.id)}
                              disabled={revertingId === version.id}
                              data-testid={`button-revert-version-${version.id}`}
                            >
                              {revertingId === version.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4 mr-1" />
                              )}
                              Obnoviť túto verziu
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-3 border-t bg-blue-50 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Tip:</strong> Uložte verziu pred veľkými zmenami. Obnovením verzie prepíšete aktuálnu šablónu uloženou verziou.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={saveVersionDialogOpen} onOpenChange={setSaveVersionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uložiť novú verziu</DialogTitle>
            <DialogDescription>
              Vytvorte zálohu aktuálnej šablóny. Popis je voliteľný.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="versionDescription">Popis zmien (voliteľný)</Label>
              <Textarea
                id="versionDescription"
                placeholder="napr. Pridané nové pole pre adresu..."
                value={versionDescription}
                onChange={(e) => setVersionDescription(e.target.value)}
                data-testid="input-version-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveVersionDialogOpen(false)}>
              Zrušiť
            </Button>
            <Button onClick={handleSaveVersion} disabled={savingVersion} data-testid="button-confirm-save-version">
              {savingVersion ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ukladám...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Uložiť verziu
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={insertDialogOpen} onOpenChange={setInsertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vložiť novú premennú</DialogTitle>
            <DialogDescription>
              Zadajte text z dokumentu, ktorý chcete nahradiť premennou
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="searchText">Text na nahradenie</Label>
              <Input
                id="searchText"
                placeholder="napr. Jana Nováková"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                data-testid="input-search-text"
              />
              <p className="text-xs text-muted-foreground">
                Presne skopírujte text z dokumentu, ktorý chcete nahradiť
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="placeholder">Názov premennej</Label>
              <Input
                id="placeholder"
                placeholder="napr. customer.fullName"
                value={newPlaceholder}
                onChange={(e) => setNewPlaceholder(e.target.value)}
                data-testid="input-placeholder-name"
              />
              {newPlaceholder && (
                <Badge variant="outline" className="font-mono">
                  {`{{${newPlaceholder}}}`}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground">
                Kliknite na premennú v registri (Editor záložka, pravý panel) pre jej výber
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setInsertDialogOpen(false)}>
              Zrušiť
            </Button>
            <Button onClick={handleInsertPlaceholder} disabled={inserting}>
              {inserting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Vkladám...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Vložiť premennú
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
