import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Download, Sparkles, Variable, RefreshCw, Eye, Edit3 } from "lucide-react";
import { VariableBrowser } from "./variable-browser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import mammoth from "mammoth";

interface DocxHtmlEditorProps {
  categoryId: number;
  countryCode: string;
  onSave?: () => void;
  onExtractedFieldsChange?: (fields: string[]) => void;
}

export function DocxHtmlEditor({
  categoryId,
  countryCode,
  onSave,
  onExtractedFieldsChange,
}: DocxHtmlEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVariableBrowserOpen, setIsVariableBrowserOpen] = useState(false);
  const [isAiInserting, setIsAiInserting] = useState(false);
  const [extractedVariables, setExtractedVariables] = useState<string[]>([]);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [docxArrayBuffer, setDocxArrayBuffer] = useState<ArrayBuffer | null>(null);
  const { toast } = useToast();

  const loadDocument = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/contracts/categories/${categoryId}/default-templates/${countryCode}/docx`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error("Nepodarilo sa načítať DOCX súbor");
      }

      const arrayBuffer = await response.arrayBuffer();
      setDocxArrayBuffer(arrayBuffer);

      const result = await mammoth.convertToHtml({ arrayBuffer });
      let html = result.value;
      
      html = highlightPlaceholders(html);
      
      setHtmlContent(html);
      extractVariablesFromDocument();
      
    } catch (error: any) {
      console.error("Error loading document:", error);
      toast({
        title: "Chyba pri načítaní",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, countryCode, toast]);

  const highlightPlaceholders = (html: string): string => {
    return html.replace(
      /\{\{([^}]+)\}\}/g,
      '<span class="placeholder-highlight" style="background: #fff3cd; padding: 2px 6px; border-radius: 4px; font-weight: 600; color: #856404; border: 1px solid #ffc107;">{{$1}}</span>'
    );
  };

  const extractVariablesFromDocument = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/contracts/categories/${categoryId}/default-templates/${countryCode}/extract-variables`,
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        const variables = data.variables || [];
        setExtractedVariables(variables);
        onExtractedFieldsChange?.(variables);
      }
    } catch (error) {
      console.error("Error extracting variables:", error);
    }
  }, [categoryId, countryCode, onExtractedFieldsChange]);

  useEffect(() => {
    loadDocument();
  }, [categoryId, countryCode]);

  const handleDownload = async () => {
    try {
      const response = await fetch(
        `/api/contracts/categories/${categoryId}/default-templates/${countryCode}/docx`,
        { credentials: "include" }
      );
      
      if (!response.ok) throw new Error("Sťahovanie zlyhalo");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template_${countryCode}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "DOCX stiahnutý" });
    } catch (error: any) {
      toast({
        title: "Chyba pri sťahovaní",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleInsertVariable = (variablePath: string) => {
    if (!editorRef.current || !isEditMode) {
      toast({
        title: "Prepnite do režimu úprav",
        description: "Najprv kliknite na 'Upraviť' pre vloženie premennej",
        variant: "destructive",
      });
      return;
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const placeholder = `{{${variablePath}}}`;
      
      const span = document.createElement("span");
      span.className = "placeholder-highlight";
      span.style.cssText = "background: #fff3cd; padding: 2px 6px; border-radius: 4px; font-weight: 600; color: #856404; border: 1px solid #ffc107;";
      span.textContent = placeholder;
      
      range.deleteContents();
      range.insertNode(span);
      
      range.setStartAfter(span);
      range.setEndAfter(span);
      selection.removeAllRanges();
      selection.addRange(range);
      
      toast({ title: `Premenná ${variablePath} vložená` });
    } else {
      toast({
        title: "Vyberte miesto v texte",
        description: "Kliknite do dokumentu kam chcete vložiť premennú",
        variant: "destructive",
      });
    }
    
    setIsVariableBrowserOpen(false);
  };

  const handleAiInsertVariables = async () => {
    setIsAiInserting(true);
    try {
      const response = await fetch("/api/contracts/ai-insert-placeholders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          categoryId,
          countryCode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "AI vkladanie zlyhalo");
      }

      const result = await response.json();

      toast({
        title: "Premenné vložené",
        description: result.message || `AI vložila premenné do dokumentu`,
      });

      await loadDocument();
    } catch (error: any) {
      console.error("AI insert error:", error);
      toast({
        title: "Chyba pri AI vkladaní",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAiInserting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Načítavam dokument...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 p-2 border-b bg-muted/30 shrink-0 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={isEditMode ? "default" : "outline"}
            onClick={() => setIsEditMode(!isEditMode)}
            data-testid="button-toggle-edit"
          >
            {isEditMode ? (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Náhľad
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4 mr-1" />
                Upraviť
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            data-testid="button-download-docx"
          >
            <Download className="h-4 w-4 mr-1" />
            Stiahnuť DOCX
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsVariableBrowserOpen(true)}
            disabled={!isEditMode}
            data-testid="button-insert-variable"
          >
            <Variable className="h-4 w-4 mr-1" />
            Vložiť premennú
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAiInsertVariables}
            disabled={isAiInserting}
            data-testid="button-ai-insert"
          >
            {isAiInserting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            AI Premenné
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {extractedVariables.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {extractedVariables.length} premenných
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={loadDocument}
            data-testid="button-reload-doc"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Obnoviť
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 bg-white dark:bg-gray-900 min-h-full">
          <div 
            ref={editorRef}
            className={`
              max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg
              prose prose-sm dark:prose-invert max-w-none
              ${isEditMode ? 'ring-2 ring-primary/50' : ''}
            `}
            contentEditable={isEditMode}
            suppressContentEditableWarning={true}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            style={{ minHeight: "700px" }}
            data-testid="docx-editor-content"
          />
        </div>
      </ScrollArea>

      <Dialog open={isVariableBrowserOpen} onOpenChange={setIsVariableBrowserOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Vložiť premennú</DialogTitle>
            <DialogDescription>
              Vyberte premennú z registra CRM polí
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <VariableBrowser
              onInsertVariable={handleInsertVariable}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
