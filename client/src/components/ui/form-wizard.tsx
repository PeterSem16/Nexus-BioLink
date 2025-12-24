import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  isOptional?: boolean;
  validate?: () => boolean | Promise<boolean>;
}

interface FormWizardProps {
  steps: WizardStep[];
  onComplete: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  completeButtonText?: string;
  cancelButtonText?: string;
  nextButtonText?: string;
  previousButtonText?: string;
  skipButtonText?: string;
  title?: string;
  description?: string;
}

export function FormWizard({
  steps,
  onComplete,
  onCancel,
  isLoading = false,
  completeButtonText = "Complete",
  cancelButtonText = "Cancel",
  nextButtonText = "Next",
  previousButtonText = "Previous",
  skipButtonText = "Skip",
  title,
  description,
}: FormWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (currentStep.validate) {
      const isValid = await currentStep.validate();
      if (!isValid) return;
    }
    
    setCompletedSteps(prev => new Set(Array.from(prev).concat(currentStepIndex)));
    
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep.isOptional && !isLastStep) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleStepClick = (index: number) => {
    if (index < currentStepIndex || completedSteps.has(index) || completedSteps.has(index - 1)) {
      setCurrentStepIndex(index);
    }
  };

  return (
    <Card className="w-full">
      {(title || description) && (
        <CardHeader className="pb-4">
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStepIndex;
            const isClickable = index < currentStepIndex || isCompleted || completedSteps.has(index - 1);
            
            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  isCurrent && "bg-primary text-primary-foreground",
                  isCompleted && !isCurrent && "bg-primary/10 text-primary",
                  !isCurrent && !isCompleted && "bg-muted text-muted-foreground",
                  isClickable && !isCurrent && "hover-elevate cursor-pointer",
                  !isClickable && "cursor-not-allowed opacity-50"
                )}
                data-testid={`wizard-step-${step.id}`}
              >
                <span className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isCurrent && "bg-primary-foreground text-primary",
                  isCompleted && !isCurrent && "bg-primary text-primary-foreground",
                  !isCurrent && !isCompleted && "bg-muted-foreground/20"
                )}>
                  {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {currentStep.icon}
              {currentStep.title}
              {currentStep.isOptional && (
                <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
              )}
            </h3>
            {currentStep.description && (
              <p className="text-sm text-muted-foreground mt-1">{currentStep.description}</p>
            )}
          </div>
          
          <div className="min-h-[200px]">
            {currentStep.content}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap justify-between gap-2 border-t pt-4">
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              data-testid="wizard-cancel"
            >
              {cancelButtonText}
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep || isLoading}
            data-testid="wizard-previous"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {previousButtonText}
          </Button>
          
          {currentStep.isOptional && !isLastStep && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={isLoading}
              data-testid="wizard-skip"
            >
              {skipButtonText}
            </Button>
          )}
          
          <Button
            type="button"
            onClick={handleNext}
            disabled={isLoading}
            data-testid="wizard-next"
          >
            {isLastStep ? completeButtonText : nextButtonText}
            {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
