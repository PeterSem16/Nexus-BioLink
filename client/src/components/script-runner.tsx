import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { OperatorScript, ScriptStep, ScriptElement, ScriptResponse, ScriptSession } from "@shared/schema";

interface ScriptRunnerProps {
  script: OperatorScript;
  onComplete?: (session: ScriptSession) => void;
  onResponseChange?: (responses: ScriptResponse[]) => void;
  compact?: boolean;
}

export function ScriptRunner({ script, onComplete, onResponseChange, compact }: ScriptRunnerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [responses, setResponses] = useState<ScriptResponse[]>([]);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [startedAt] = useState(new Date().toISOString());

  const currentStep = script.steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === script.steps.length - 1 || currentStep?.isEndStep;

  const progress = useMemo(() => {
    if (script.steps.length === 0) return 0;
    return ((completedStepIds.length) / script.steps.length) * 100;
  }, [completedStepIds.length, script.steps.length]);

  const getResponse = useCallback((elementId: string): ScriptResponse | undefined => {
    return responses.find(r => r.elementId === elementId);
  }, [responses]);

  const setResponse = useCallback((elementId: string, value: string | string[] | boolean) => {
    const newResponses = responses.filter(r => r.elementId !== elementId);
    newResponses.push({
      elementId,
      value,
      timestamp: new Date().toISOString(),
    });
    setResponses(newResponses);
    onResponseChange?.(newResponses);
  }, [responses, onResponseChange]);

  const validateStep = useCallback((): boolean => {
    if (!currentStep) return true;
    for (const element of currentStep.elements) {
      if (element.required) {
        const response = getResponse(element.id);
        if (!response) return false;
        if (Array.isArray(response.value) && response.value.length === 0) return false;
        if (typeof response.value === "string" && response.value.trim() === "") return false;
      }
    }
    return true;
  }, [currentStep, getResponse]);

  const goToNextStep = useCallback(() => {
    if (!currentStep || !validateStep()) return;
    
    if (!completedStepIds.includes(currentStep.id)) {
      setCompletedStepIds([...completedStepIds, currentStep.id]);
    }

    if (isLastStep) {
      const session: ScriptSession = {
        scriptVersion: script.version,
        currentStepId: currentStep.id,
        completedStepIds: [...completedStepIds, currentStep.id],
        responses,
        startedAt,
        completedAt: new Date().toISOString(),
      };
      onComplete?.(session);
      return;
    }

    if (currentStep.nextStepId) {
      const nextIndex = script.steps.findIndex(s => s.id === currentStep.nextStepId);
      if (nextIndex !== -1) {
        setCurrentStepIndex(nextIndex);
        return;
      }
    }

    setCurrentStepIndex(currentStepIndex + 1);
  }, [currentStep, validateStep, isLastStep, completedStepIds, script, responses, startedAt, onComplete, currentStepIndex]);

  const goToPrevStep = useCallback(() => {
    if (isFirstStep) return;
    setCurrentStepIndex(currentStepIndex - 1);
  }, [isFirstStep, currentStepIndex]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < script.steps.length) {
      setCurrentStepIndex(index);
    }
  }, [script.steps.length]);

  const renderElement = useCallback((element: ScriptElement) => {
    const response = getResponse(element.id);
    
    switch (element.type) {
      case "heading": {
        const sizeClass = element.size === "lg" ? "text-xl" : element.size === "sm" ? "text-base" : "text-lg";
        return (
          <h3 className={`font-semibold ${sizeClass}`} data-testid={`heading-${element.id}`}>
            {element.content || element.label}
          </h3>
        );
      }

      case "paragraph":
        return (
          <p className="text-muted-foreground whitespace-pre-wrap" data-testid={`paragraph-${element.id}`}>
            {element.content}
          </p>
        );

      case "divider":
        return <Separator data-testid={`divider-${element.id}`} />;

      case "note": {
        const styleConfig = {
          default: { bg: "bg-muted", icon: Info, iconClass: "text-muted-foreground" },
          info: { bg: "bg-blue-50 dark:bg-blue-950", icon: Info, iconClass: "text-blue-500" },
          warning: { bg: "bg-yellow-50 dark:bg-yellow-950", icon: AlertTriangle, iconClass: "text-yellow-500" },
          success: { bg: "bg-green-50 dark:bg-green-950", icon: CheckCircle2, iconClass: "text-green-500" },
          error: { bg: "bg-red-50 dark:bg-red-950", icon: XCircle, iconClass: "text-red-500" },
        };
        const config = styleConfig[element.style || "default"];
        const Icon = config.icon;
        return (
          <div className={`flex items-start gap-3 p-4 rounded-md ${config.bg}`} data-testid={`note-${element.id}`}>
            <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconClass}`} />
            <div className="flex-1">
              {element.label && <p className="font-medium mb-1">{element.label}</p>}
              <p className="text-sm whitespace-pre-wrap">{element.content}</p>
            </div>
          </div>
        );
      }

      case "select":
        return (
          <div className="space-y-2" data-testid={`select-container-${element.id}`}>
            <Label className="flex items-center gap-1">
              {element.label}
              {element.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={(response?.value as string) || ""}
              onValueChange={(v) => setResponse(element.id, v)}
            >
              <SelectTrigger data-testid={`select-${element.id}`}>
                <SelectValue placeholder="Vyberte možnosť..." />
              </SelectTrigger>
              <SelectContent>
                {element.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "multiselect": {
        const selectedValues = (response?.value as string[]) || [];
        return (
          <div className="space-y-2" data-testid={`multiselect-container-${element.id}`}>
            <Label className="flex items-center gap-1">
              {element.label}
              {element.required && <span className="text-destructive">*</span>}
            </Label>
            <div className="space-y-2">
              {element.options?.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`${element.id}-${option.value}`}
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setResponse(element.id, [...selectedValues, option.value]);
                      } else {
                        setResponse(element.id, selectedValues.filter(v => v !== option.value));
                      }
                    }}
                    data-testid={`checkbox-${element.id}-${option.value}`}
                  />
                  <Label htmlFor={`${element.id}-${option.value}`} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "checkbox":
        return (
          <div className="flex items-center gap-2" data-testid={`checkbox-container-${element.id}`}>
            <Checkbox
              id={element.id}
              checked={(response?.value as boolean) || false}
              onCheckedChange={(checked) => setResponse(element.id, !!checked)}
              data-testid={`checkbox-${element.id}`}
            />
            <Label htmlFor={element.id} className="cursor-pointer">
              {element.label}
              {element.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        );

      case "checkboxGroup": {
        const selectedValues = (response?.value as string[]) || [];
        return (
          <div className="space-y-2" data-testid={`checkbox-group-container-${element.id}`}>
            <Label className="flex items-center gap-1">
              {element.label}
              {element.required && <span className="text-destructive">*</span>}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {element.options?.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`${element.id}-${option.value}`}
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setResponse(element.id, [...selectedValues, option.value]);
                      } else {
                        setResponse(element.id, selectedValues.filter(v => v !== option.value));
                      }
                    }}
                    data-testid={`checkbox-${element.id}-${option.value}`}
                  />
                  <Label htmlFor={`${element.id}-${option.value}`} className="cursor-pointer text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "radio":
        return (
          <div className="space-y-2" data-testid={`radio-container-${element.id}`}>
            <Label className="flex items-center gap-1">
              {element.label}
              {element.required && <span className="text-destructive">*</span>}
            </Label>
            <RadioGroup
              value={(response?.value as string) || ""}
              onValueChange={(v) => setResponse(element.id, v)}
            >
              {element.options?.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem value={option.value} id={`${element.id}-${option.value}`} data-testid={`radio-${element.id}-${option.value}`} />
                  <Label htmlFor={`${element.id}-${option.value}`} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case "textInput":
        return (
          <div className="space-y-2" data-testid={`text-input-container-${element.id}`}>
            <Label htmlFor={element.id} className="flex items-center gap-1">
              {element.label}
              {element.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={element.id}
              value={(response?.value as string) || ""}
              onChange={(e) => setResponse(element.id, e.target.value)}
              placeholder={element.placeholder}
              data-testid={`input-${element.id}`}
            />
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-2" data-testid={`textarea-container-${element.id}`}>
            <Label htmlFor={element.id} className="flex items-center gap-1">
              {element.label}
              {element.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id={element.id}
              value={(response?.value as string) || ""}
              onChange={(e) => setResponse(element.id, e.target.value)}
              placeholder={element.placeholder}
              rows={3}
              data-testid={`textarea-${element.id}`}
            />
          </div>
        );

      case "outcome":
        return (
          <div className="space-y-3" data-testid={`outcome-container-${element.id}`}>
            <Label className="flex items-center gap-1 text-base font-semibold">
              {element.label || "Výsledok hovoru"}
              {element.required && <span className="text-destructive">*</span>}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {element.options?.map((option) => {
                const isSelected = (response?.value as string) === option.value;
                return (
                  <Button
                    key={option.value}
                    variant={isSelected ? "default" : "outline"}
                    className="h-auto py-3"
                    onClick={() => setResponse(element.id, option.value)}
                    data-testid={`outcome-${element.id}-${option.value}`}
                  >
                    {isSelected && <Check className="h-4 w-4 mr-2" />}
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [getResponse, setResponse]);

  if (script.steps.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Skript neobsahuje žiadne kroky</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-4" data-testid="script-runner-compact">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Krok {currentStepIndex + 1} / {script.steps.length}
            </Badge>
            <span className="font-medium">{currentStep?.title}</span>
          </div>
          <Progress value={progress} className="w-32" />
        </div>

        <ScrollArea className="h-[300px]">
          <div className="space-y-4 pr-4">
            {currentStep?.description && (
              <p className="text-sm text-muted-foreground">{currentStep.description}</p>
            )}
            {currentStep?.elements.map((element) => (
              <div key={element.id}>{renderElement(element)}</div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevStep}
            disabled={isFirstStep}
            data-testid="button-prev-step"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Späť
          </Button>
          <Button
            size="sm"
            onClick={goToNextStep}
            disabled={!validateStep()}
            data-testid="button-next-step"
          >
            {isLastStep ? (
              <>
                <Check className="h-4 w-4 mr-1" /> Dokončiť
              </>
            ) : (
              <>
                Ďalej <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-full" data-testid="script-runner">
      <Card className="w-56 flex-shrink-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Postup</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {script.steps.map((step, index) => {
                const isCompleted = completedStepIds.includes(step.id);
                const isCurrent = index === currentStepIndex;
                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(index)}
                    className={`w-full flex items-center gap-2 p-2 rounded-md text-left text-sm transition-colors ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "hover-elevate"
                    }`}
                    data-testid={`step-nav-${step.id}`}
                  >
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      isCurrent
                        ? "bg-primary-foreground text-primary"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-muted"
                    }`}>
                      {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                    </div>
                    <span className="truncate">{step.title}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progres</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <Badge variant="outline" className="mb-2">
                Krok {currentStepIndex + 1} z {script.steps.length}
              </Badge>
              <CardTitle>{currentStep?.title}</CardTitle>
            </div>
            {currentStep?.isEndStep && (
              <Badge>Záverečný krok</Badge>
            )}
          </div>
          {currentStep?.description && (
            <p className="text-sm text-muted-foreground mt-2">{currentStep.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px]">
            <div className="space-y-6 pr-4">
              {currentStep?.elements.map((element) => (
                <div key={element.id}>{renderElement(element)}</div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={goToPrevStep}
              disabled={isFirstStep}
              data-testid="button-prev-step"
            >
              <ChevronLeft className="h-4 w-4 mr-2" /> Predchádzajúci
            </Button>
            <Button
              onClick={goToNextStep}
              disabled={!validateStep()}
              data-testid="button-next-step"
            >
              {isLastStep ? (
                <>
                  <Check className="h-4 w-4 mr-2" /> Dokončiť skript
                </>
              ) : (
                <>
                  Nasledujúci <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
