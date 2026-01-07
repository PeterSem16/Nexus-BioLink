import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, Plus, Loader2, RefreshCw, BookOpen, Download
} from "lucide-react";
import { VariableBrowser } from "./variable-browser";

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
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-3 border-b bg-muted/30 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{extractedFields.length} premenných</Badge>
            <span className="text-sm text-muted-foreground">v dokumente</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={!showSampleData ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSampleData(false)}
            >
              Premenné
            </Button>
            <Button
              variant={showSampleData ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSampleData(true)}
            >
              Vzorové dáta
            </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/api/contracts/categories/${categoryId}/templates/${countryCode}/download`, '_blank')}
              data-testid="button-download-docx"
            >
              <Download className="h-4 w-4" />
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
            <strong>Ako pridať premennú:</strong> Kliknite "Pridať premennú", zadajte presný text z dokumentu a vyberte premennú z registra vpravo.
          </p>
        </div>
      </div>
      
      <div className="w-72 border-l flex flex-col overflow-hidden">
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
                Kliknite na premennú v registri (pravý panel) pre jej výber
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
