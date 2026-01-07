import { storage } from "./storage";
import type { VariableBlock, Variable, VariableKeyword } from "@shared/schema";

interface BlockScore {
  blockId: string;
  blockCode: string;
  score: number;
  matchedKeywords: string[];
}

interface VariableMatch {
  variableKey: string;
  label: string;
  confidence: number;
  blockCode: string;
}

interface AnalysisResult {
  detectedBlocks: BlockScore[];
  suggestedVariables: VariableMatch[];
  contextText: string;
}

export class VariableRegistryService {
  private blocksCache: VariableBlock[] | null = null;
  private variablesCache: Variable[] | null = null;
  private keywordsCache: VariableKeyword[] | null = null;
  private cacheExpiry: number = 0;
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private async ensureCache(): Promise<void> {
    if (this.blocksCache && this.variablesCache && this.keywordsCache && Date.now() < this.cacheExpiry) {
      return;
    }

    const [blocks, variables, keywords] = await Promise.all([
      storage.getAllVariableBlocks(),
      storage.getAllVariables(),
      storage.getAllVariableKeywords(),
    ]);

    this.blocksCache = blocks;
    this.variablesCache = variables;
    this.keywordsCache = keywords;
    this.cacheExpiry = Date.now() + this.CACHE_TTL;
  }

  async invalidateCache(): Promise<void> {
    this.blocksCache = null;
    this.variablesCache = null;
    this.keywordsCache = null;
    this.cacheExpiry = 0;
  }

  async analyzeText(text: string): Promise<AnalysisResult> {
    await this.ensureCache();

    const normalizedText = text.toLowerCase();
    const detectedBlocks: BlockScore[] = [];

    for (const block of this.blocksCache!) {
      const blockKeywords = this.keywordsCache!.filter(k => k.blockId === block.id);
      let score = 0;
      const matchedKeywords: string[] = [];

      for (const kw of blockKeywords) {
        if (normalizedText.includes(kw.keyword.toLowerCase())) {
          score += kw.weight || 1;
          matchedKeywords.push(kw.keyword);
        }
      }

      if (score > 0) {
        detectedBlocks.push({
          blockId: block.id,
          blockCode: block.code,
          score,
          matchedKeywords,
        });
      }
    }

    detectedBlocks.sort((a, b) => b.score - a.score);

    const suggestedVariables: VariableMatch[] = [];
    for (const blockScore of detectedBlocks.slice(0, 3)) {
      const blockVariables = this.variablesCache!.filter(v => v.blockId === blockScore.blockId);
      for (const variable of blockVariables) {
        const confidence = Math.min(1, blockScore.score / 50);
        suggestedVariables.push({
          variableKey: variable.key,
          label: variable.label,
          confidence,
          blockCode: blockScore.blockCode,
        });
      }
    }

    return {
      detectedBlocks,
      suggestedVariables,
      contextText: text.slice(0, 200),
    };
  }

  async findVariableForPlaceholder(placeholderName: string): Promise<Variable | null> {
    await this.ensureCache();

    const exactMatch = this.variablesCache!.find(v => v.key === placeholderName);
    if (exactMatch) return exactMatch;

    const normalized = placeholderName.toLowerCase().replace(/[_\-\s]/g, "");
    for (const variable of this.variablesCache!) {
      const varNormalized = variable.key.toLowerCase().replace(/[_\-\s]/g, "");
      if (varNormalized === normalized) return variable;
    }

    for (const variable of this.variablesCache!) {
      const labelNormalized = variable.label.toLowerCase().replace(/[_\-\s]/g, "");
      if (labelNormalized === normalized) return variable;
    }

    return null;
  }

  async getBlockForContext(contextText: string): Promise<VariableBlock | null> {
    const analysis = await this.analyzeText(contextText);
    if (analysis.detectedBlocks.length > 0) {
      const topBlock = analysis.detectedBlocks[0];
      return this.blocksCache!.find(b => b.id === topBlock.blockId) || null;
    }
    return null;
  }

  async suggestVariablesForContext(contextText: string, limit: number = 10): Promise<Variable[]> {
    const analysis = await this.analyzeText(contextText);
    const topBlockIds = analysis.detectedBlocks.slice(0, 2).map(b => b.blockId);

    await this.ensureCache();

    const suggestions: Variable[] = [];
    for (const blockId of topBlockIds) {
      const blockVars = this.variablesCache!.filter(v => v.blockId === blockId);
      suggestions.push(...blockVars);
    }

    return suggestions.slice(0, limit);
  }

  async mapPlaceholderToVariable(
    placeholderName: string,
    contextText: string
  ): Promise<{ variable: Variable | null; confidence: number; method: string }> {
    await this.ensureCache();

    const exactMatch = this.variablesCache!.find(v => v.key === placeholderName);
    if (exactMatch) {
      return { variable: exactMatch, confidence: 1.0, method: "exact_key_match" };
    }

    const keyParts = placeholderName.split(".");
    if (keyParts.length >= 2) {
      const blockCode = keyParts[0];
      const block = this.blocksCache!.find(b => b.code === blockCode);
      if (block) {
        const blockVars = this.variablesCache!.filter(v => v.blockId === block.id);
        const fieldName = keyParts.slice(1).join(".");
        const fieldMatch = blockVars.find(v => v.key.endsWith(fieldName));
        if (fieldMatch) {
          return { variable: fieldMatch, confidence: 0.9, method: "block_field_match" };
        }
      }
    }

    const normalizedPlaceholder = placeholderName.toLowerCase().replace(/[_\-\s\.]/g, "");
    for (const variable of this.variablesCache!) {
      const normalizedLabel = variable.label.toLowerCase().replace(/[_\-\s\.]/g, "");
      if (normalizedLabel.includes(normalizedPlaceholder) || normalizedPlaceholder.includes(normalizedLabel)) {
        return { variable, confidence: 0.7, method: "label_partial_match" };
      }
    }

    if (contextText) {
      const suggestions = await this.suggestVariablesForContext(contextText, 5);
      if (suggestions.length > 0) {
        for (const suggestion of suggestions) {
          const suggestionNorm = suggestion.key.toLowerCase().replace(/[_\-\s\.]/g, "");
          if (suggestionNorm.includes(normalizedPlaceholder) || normalizedPlaceholder.includes(suggestionNorm)) {
            return { variable: suggestion, confidence: 0.5, method: "context_suggestion" };
          }
        }
      }
    }

    return { variable: null, confidence: 0, method: "no_match" };
  }

  async getAllVariablesGroupedByBlock(): Promise<Map<string, { block: VariableBlock; variables: Variable[] }>> {
    await this.ensureCache();

    const grouped = new Map<string, { block: VariableBlock; variables: Variable[] }>();

    for (const block of this.blocksCache!) {
      const blockVars = this.variablesCache!.filter(v => v.blockId === block.id);
      grouped.set(block.code, { block, variables: blockVars });
    }

    return grouped;
  }
}

export const variableRegistry = new VariableRegistryService();
