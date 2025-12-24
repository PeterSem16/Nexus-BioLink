import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { COUNTRIES } from "@shared/schema";
import type { Product } from "@shared/schema";
import { ChevronLeft, ChevronRight, Check, Package, DollarSign, Globe, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const productFormSchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  price: z.string().min(1, "Required"),
  currency: z.string().min(1, "Required"),
  category: z.string().optional(),
  countries: z.array(z.string()).min(1, "Select at least one country"),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormWizardProps {
  initialData?: Product | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

const WIZARD_STEPS = [
  { id: "basic", icon: Package },
  { id: "pricing", icon: DollarSign },
  { id: "availability", icon: Globe },
  { id: "review", icon: ClipboardCheck },
];

export function ProductFormWizard({ initialData, onSuccess, onCancel }: ProductFormWizardProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || "",
          price: initialData.price,
          currency: initialData.currency,
          category: initialData.category || "",
          countries: initialData.countries || [],
          isActive: initialData.isActive,
        }
      : {
          name: "",
          description: "",
          price: "",
          currency: "EUR",
          category: "",
          countries: [],
          isActive: true,
        },
  });

  const formValues = form.watch();

  const saveMutation = useMutation({
    mutationFn: (data: ProductFormData) => {
      if (initialData) {
        return apiRequest("PUT", `/api/products/${initialData.id}`, data);
      } else {
        return apiRequest("POST", "/api/products", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: t.success.saved });
      onSuccess();
    },
    onError: () => {
      toast({ title: t.errors.saveFailed, variant: "destructive" });
    },
  });

  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  const validateCurrentStep = async (): Promise<boolean> => {
    let fieldsToValidate: (keyof ProductFormData)[] = [];
    
    switch (currentStep) {
      case 0:
        fieldsToValidate = ["name"];
        break;
      case 1:
        fieldsToValidate = ["price", "currency"];
        break;
      case 2:
        fieldsToValidate = ["countries"];
        break;
      default:
        return true;
    }
    
    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;
    
    setCompletedSteps(prev => new Set(Array.from(prev).concat(currentStep)));
    
    if (isLastStep) {
      form.handleSubmit((data) => saveMutation.mutate(data))();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (index: number) => {
    if (index < currentStep || completedSteps.has(index) || completedSteps.has(index - 1)) {
      setCurrentStep(index);
    }
  };

  const getStepTitle = (stepId: string): string => {
    const steps = t.wizard?.steps as Record<string, string> | undefined;
    const stepTitles: Record<string, string> = {
      basic: steps?.basic || t.products?.title || "Basic Info",
      pricing: steps?.pricing || t.products?.price || "Pricing",
      availability: steps?.availability || t.products?.availability || "Availability",
      review: steps?.review || "Review",
    };
    return stepTitles[stepId] || stepId;
  };

  const getStepDescription = (stepId: string): string => {
    const steps = t.wizard?.steps as Record<string, string> | undefined;
    const stepDescs: Record<string, string> = {
      basic: steps?.basicDesc || "Product name and description",
      pricing: steps?.pricingDesc || "Price and currency",
      availability: steps?.availabilityDesc || "Countries where available",
      review: steps?.reviewDesc || "Review and confirm",
    };
    return stepDescs[stepId] || "";
  };

  const handleCountryToggle = (countryCode: string, checked: boolean) => {
    const currentCountries = form.getValues("countries");
    if (checked) {
      form.setValue("countries", [...currentCountries, countryCode]);
    } else {
      form.setValue("countries", currentCountries.filter(c => c !== countryCode));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.products.productName} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t.products.productName} {...field} data-testid="wizard-input-product-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.products.description}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t.products.description} 
                      {...field} 
                      data-testid="wizard-input-product-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.products.category}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.products.category} {...field} data-testid="wizard-input-product-category" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.products.price} *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                        data-testid="wizard-input-product-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.products.currency} *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="wizard-select-product-currency">
                          <SelectValue placeholder={t.products.currency} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="CZK">CZK</SelectItem>
                        <SelectItem value="HUF">HUF</SelectItem>
                        <SelectItem value="RON">RON</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="wizard-switch-product-active"
                      />
                    </FormControl>
                    <FormLabel>{t.common.active}</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="countries"
              render={() => (
                <FormItem>
                  <FormLabel>{t.products.availableInCountries} *</FormLabel>
                  <div className="grid gap-2 sm:grid-cols-2 mt-2">
                    {COUNTRIES.map((country) => {
                      const isSelected = formValues.countries.includes(country.code);
                      return (
                        <div
                          key={country.code}
                          className="flex items-center space-x-2 p-2 rounded-md border"
                        >
                          <Checkbox
                            id={country.code}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleCountryToggle(country.code, !!checked)}
                            data-testid={`wizard-checkbox-country-${country.code}`}
                          />
                          <label
                            htmlFor={country.code}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {country.flag} {country.name}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        const selectedCountryNames = formValues.countries
          .map(code => COUNTRIES.find(c => c.code === code)?.name || code)
          .join(", ");
        
        return (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <h4 className="font-medium">{getStepTitle("basic")}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.products.productName}:</span>
                    <span className="font-medium">{formValues.name}</span>
                  </div>
                  {formValues.description && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.products.description}:</span>
                      <span className="font-medium truncate max-w-[150px]">{formValues.description}</span>
                    </div>
                  )}
                  {formValues.category && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.products.category}:</span>
                      <span className="font-medium">{formValues.category}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">{getStepTitle("pricing")}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.products.price}:</span>
                    <span className="font-medium">{formValues.price} {formValues.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.common.active}:</span>
                    <Badge variant={formValues.isActive ? "default" : "secondary"}>
                      {formValues.isActive ? t.common.yes : t.common.no}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">{getStepTitle("availability")}</h4>
              <div className="text-sm">
                <span className="text-muted-foreground">{t.products.availableInCountries}:</span>
                <p className="font-medium mt-1">{selectedCountryNames || "-"}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const currentStepInfo = WIZARD_STEPS[currentStep];
  const StepIcon = currentStepInfo?.icon || Package;

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {t.wizard?.stepOf?.replace("{current}", String(currentStep + 1)).replace("{total}", String(WIZARD_STEPS.length)) || `Step ${currentStep + 1} of ${WIZARD_STEPS.length}`}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              {WIZARD_STEPS.map((step, index) => {
                const isCompleted = completedSteps.has(index);
                const isCurrent = index === currentStep;
                const isClickable = index < currentStep || isCompleted || completedSteps.has(index - 1);
                const Icon = step.icon;
                
                return (
                  <button
                    key={step.id}
                    type="button"
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
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      isCurrent && "bg-primary-foreground text-primary",
                      isCompleted && !isCurrent && "bg-primary text-primary-foreground",
                      !isCurrent && !isCompleted && "bg-muted-foreground/20"
                    )}>
                      {isCompleted ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                    </span>
                    <span className="hidden md:inline">{getStepTitle(step.id)}</span>
                  </button>
                );
              })}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <StepIcon className="h-5 w-5" />
                {getStepTitle(currentStepInfo.id)}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {getStepDescription(currentStepInfo.id)}
              </p>
            </div>
            
            <div className="min-h-[250px]">
              {renderStepContent()}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between gap-2 border-t pt-4">
            <div>
              {onCancel && (
                <Button variant="ghost" onClick={onCancel} data-testid="wizard-button-cancel">
                  {t.common.cancel}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {!isFirstStep && (
                <Button variant="outline" onClick={handlePrevious} data-testid="wizard-button-previous">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t.wizard?.previous || "Previous"}
                </Button>
              )}
              <Button onClick={handleNext} disabled={saveMutation.isPending} data-testid="wizard-button-next">
                {isLastStep ? (
                  saveMutation.isPending ? t.common.loading : (t.wizard?.complete || t.common.save)
                ) : (
                  <>
                    {t.wizard?.next || "Next"}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
