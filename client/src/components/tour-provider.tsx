import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
}

export interface Tour {
  id: string;
  name: string;
  steps: TourStep[];
}

interface TourContextType {
  activeTour: Tour | null;
  currentStep: number;
  startTour: (tourId: string) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  isStepActive: (stepIndex: number) => boolean;
  completedTours: string[];
  availableTours: Tour[];
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TOURS: Tour[] = [
  {
    id: "dashboard-intro",
    name: "Dashboard Overview",
    steps: [
      {
        target: "[data-tour='stats-cards']",
        title: "Statistics Overview",
        content: "Here you can see key metrics at a glance - total customers, active cases, and revenue statistics.",
        placement: "bottom",
      },
      {
        target: "[data-tour='country-filter']",
        title: "Country Filter",
        content: "Filter all data by country to focus on specific regions. This filter applies across all views.",
        placement: "bottom",
      },
      {
        target: "[data-testid='button-sidebar-toggle']",
        title: "Navigation",
        content: "Use the sidebar to navigate between different sections of the CRM.",
        placement: "right",
      },
    ],
  },
  {
    id: "customers-intro",
    name: "Customer Management",
    steps: [
      {
        target: "[data-tour='customer-search']",
        title: "Search Customers",
        content: "Quickly find customers by name, email, or phone number using the search field.",
        placement: "bottom",
      },
      {
        target: "[data-tour='customer-filters']",
        title: "Filter Options",
        content: "Filter customers by status, service type, or country to narrow down your list.",
        placement: "bottom",
      },
      {
        target: "[data-tour='add-customer']",
        title: "Add New Customer",
        content: "Click here to register a new customer in the system.",
        placement: "left",
      },
    ],
  },
  {
    id: "campaigns-intro",
    name: "Campaigns Overview",
    steps: [
      {
        target: "[data-tour='campaign-list']",
        title: "Campaign List",
        content: "View all your marketing and sales campaigns here. Each card shows the campaign status and key metrics.",
        placement: "bottom",
      },
      {
        target: "[data-tour='create-campaign']",
        title: "Create Campaign",
        content: "Click here to create a new campaign with targeting criteria and scheduling.",
        placement: "left",
      },
    ],
  },
  {
    id: "theming-intro",
    name: "Customization",
    steps: [
      {
        target: "[data-testid='button-palette-picker']",
        title: "Color Themes",
        content: "Choose from 6 color palettes to personalize the application appearance.",
        placement: "bottom",
      },
      {
        target: "[data-testid='button-theme-toggle']",
        title: "Dark/Light Mode",
        content: "Toggle between dark and light mode for comfortable viewing.",
        placement: "bottom",
      },
    ],
  },
];

function TourOverlay({ tour, step, onNext, onPrev, onClose, totalSteps }: {
  tour: Tour;
  step: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  totalSteps: number;
}) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const currentStep = tour.steps[step];

  useEffect(() => {
    const findTarget = () => {
      const element = document.querySelector(currentStep.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setTargetRect(null);
      }
    };

    findTarget();
    const timer = setTimeout(findTarget, 100);
    window.addEventListener("resize", findTarget);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", findTarget);
    };
  }, [currentStep.target]);

  const getTooltipPosition = () => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    const placement = currentStep.placement || "bottom";

    switch (placement) {
      case "top":
        return {
          top: targetRect.top - tooltipHeight - padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        };
      case "bottom":
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        };
      case "left":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.left - tooltipWidth - padding,
        };
      case "right":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.right + padding,
        };
      default:
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        };
    }
  };

  const tooltipPos = getTooltipPosition();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999]"
    >
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#spotlight-mask)"
          style={{ pointerEvents: "auto" }}
          onClick={onClose}
        />
      </svg>

      {targetRect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute pointer-events-none"
          style={{
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        >
          <div className="absolute inset-0 rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent" />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute z-10"
        style={{
          ...tooltipPos,
          width: 320,
        }}
      >
        <Card className="p-4 shadow-lg">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg">{currentStep.title}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 -mt-1 -mr-1"
              data-testid="button-close-tour"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {currentStep.content}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Step {step + 1} of {totalSteps}
            </span>
            <div className="flex gap-2">
              {step > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrev}
                  data-testid="button-prev-step"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={onNext}
                data-testid="button-next-step"
              >
                {step < totalSteps - 1 ? (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  "Finish"
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTours, setCompletedTours] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexus-completed-tours");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const startTour = useCallback((tourId: string) => {
    const tour = TOURS.find((t) => t.id === tourId);
    if (tour) {
      setActiveTour(tour);
      setCurrentStep(0);
    }
  }, []);

  const endTour = useCallback(() => {
    if (activeTour) {
      const newCompleted = [...completedTours, activeTour.id].filter(
        (v, i, a) => a.indexOf(v) === i
      );
      setCompletedTours(newCompleted);
      localStorage.setItem("nexus-completed-tours", JSON.stringify(newCompleted));
    }
    setActiveTour(null);
    setCurrentStep(0);
  }, [activeTour, completedTours]);

  const nextStep = useCallback(() => {
    if (activeTour && currentStep < activeTour.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endTour();
    }
  }, [activeTour, currentStep, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const isStepActive = useCallback(
    (stepIndex: number) => activeTour !== null && currentStep === stepIndex,
    [activeTour, currentStep]
  );

  return (
    <TourContext.Provider
      value={{
        activeTour,
        currentStep,
        startTour,
        endTour,
        nextStep,
        prevStep,
        isStepActive,
        completedTours,
        availableTours: TOURS,
      }}
    >
      {children}
      <AnimatePresence>
        {activeTour && (
          <TourOverlay
            tour={activeTour}
            step={currentStep}
            onNext={nextStep}
            onPrev={prevStep}
            onClose={endTour}
            totalSteps={activeTour.steps.length}
          />
        )}
      </AnimatePresence>
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}

export function TourTrigger() {
  const { availableTours, startTour, completedTours } = useTour();

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="icon"
        data-testid="button-help-tours"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
      <div className="invisible group-hover:visible absolute right-0 top-full mt-1 z-50">
        <Card className="p-2 min-w-[200px] shadow-lg">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
            Guided Tours
          </p>
          {availableTours.map((tour) => (
            <button
              key={tour.id}
              onClick={() => startTour(tour.id)}
              className="w-full text-left px-2 py-1.5 text-sm rounded-md hover-elevate flex items-center justify-between"
              data-testid={`tour-trigger-${tour.id}`}
            >
              <span>{tour.name}</span>
              {completedTours.includes(tour.id) && (
                <span className="text-xs text-primary">Completed</span>
              )}
            </button>
          ))}
        </Card>
      </div>
    </div>
  );
}
