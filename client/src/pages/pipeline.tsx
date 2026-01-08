import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { 
  SortableContext, 
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical, User, Calendar, DollarSign, Phone, Mail, FileText, Loader2, Settings, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Deal, type PipelineStage, type Pipeline, DEAL_SOURCES, COUNTRIES } from "@shared/schema";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

interface StageWithDeals extends PipelineStage {
  deals: Deal[];
}

interface KanbanData {
  pipeline: Pipeline;
  stages: StageWithDeals[];
}

function DealCard({ deal, isDragging }: { deal: Deal; isDragging?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatCurrency = (value: string | null, currency: string | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("sk-SK", {
      style: "currency",
      currency: currency || "EUR",
    }).format(parseFloat(value));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-md p-3 mb-2 cursor-move hover-elevate"
      {...attributes}
      {...listeners}
      data-testid={`deal-card-${deal.id}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm line-clamp-2">{deal.title}</h4>
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
      
      <div className="space-y-1 text-xs text-muted-foreground">
        {deal.value && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span className="font-medium text-foreground">
              {formatCurrency(deal.value, deal.currency)}
            </span>
          </div>
        )}
        
        {deal.expectedCloseDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(deal.expectedCloseDate), "d. M. yyyy", { locale: sk })}</span>
          </div>
        )}
        
        {deal.probability !== null && deal.probability !== undefined && (
          <Badge variant="outline" className="text-xs">
            {deal.probability}% pravdepodobnosť
          </Badge>
        )}
      </div>
    </div>
  );
}

function StageColumn({ stage, onAddDeal }: { stage: StageWithDeals; onAddDeal: (stageId: string) => void }) {
  const totalValue = stage.deals.reduce((sum, deal) => {
    return sum + (deal.value ? parseFloat(deal.value) : 0);
  }, 0);

  return (
    <div 
      className="flex flex-col min-w-[280px] max-w-[280px] bg-muted/30 rounded-lg"
      data-testid={`stage-column-${stage.id}`}
    >
      <div 
        className="p-3 border-b flex items-center justify-between"
        style={{ borderTopColor: stage.color || "#3b82f6", borderTopWidth: "3px" }}
      >
        <div>
          <h3 className="font-medium text-sm">{stage.name}</h3>
          <div className="text-xs text-muted-foreground mt-0.5">
            {stage.deals.length} príležitostí · {new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR" }).format(totalValue)}
          </div>
        </div>
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={() => onAddDeal(stage.id)}
          data-testid={`button-add-deal-${stage.id}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-2 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
        <SortableContext items={stage.deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {stage.deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>
        
        {stage.deals.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            Žiadne príležitosti
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { toast } = useToast();
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [newDealStageId, setNewDealStageId] = useState<string | null>(null);
  const [activeDealId, setActiveDealId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const { data: pipelines, isLoading: pipelinesLoading } = useQuery<Pipeline[]>({
    queryKey: ["/api/pipelines"],
  });

  useEffect(() => {
    if (pipelines && pipelines.length > 0 && !activePipelineId) {
      setActivePipelineId(pipelines[0].id);
    }
  }, [pipelines, activePipelineId]);

  const { data: kanbanData, isLoading: kanbanLoading } = useQuery<KanbanData>({
    queryKey: ["/api/pipelines", activePipelineId, "kanban"],
    enabled: !!activePipelineId,
  });

  const seedDefaultMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/pipelines/seed-default");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pipelines"] });
      toast({ title: "Pipeline vytvorený", description: "Predvolený predajný proces bol vytvorený" });
    },
    onError: () => {
      toast({ title: "Chyba", description: "Nepodarilo sa vytvoriť pipeline", variant: "destructive" });
    },
  });

  const createDealMutation = useMutation({
    mutationFn: async (data: { title: string; stageId: string; pipelineId: string; value?: string; source?: string; notes?: string }) => {
      return apiRequest("POST", "/api/deals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pipelines", activePipelineId, "kanban"] });
      setIsNewDealOpen(false);
      setNewDealStageId(null);
      toast({ title: "Príležitosť vytvorená" });
    },
    onError: () => {
      toast({ title: "Chyba", description: "Nepodarilo sa vytvoriť príležitosť", variant: "destructive" });
    },
  });

  const moveDealMutation = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      return apiRequest("PATCH", `/api/deals/${dealId}/stage`, { stageId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pipelines", activePipelineId, "kanban"] });
    },
    onError: () => {
      toast({ title: "Chyba", description: "Nepodarilo sa presunúť príležitosť", variant: "destructive" });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDealId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDealId(null);

    if (!over) return;

    const activeDealId = active.id as string;
    const overId = over.id as string;

    if (!kanbanData) return;

    const sourceStage = kanbanData.stages.find(s => s.deals.some(d => d.id === activeDealId));
    let targetStageId: string | null = null;

    const targetStage = kanbanData.stages.find(s => s.id === overId);
    if (targetStage) {
      targetStageId = targetStage.id;
    } else {
      const targetDealStage = kanbanData.stages.find(s => s.deals.some(d => d.id === overId));
      if (targetDealStage) {
        targetStageId = targetDealStage.id;
      }
    }

    if (targetStageId && sourceStage && sourceStage.id !== targetStageId) {
      moveDealMutation.mutate({ dealId: activeDealId, stageId: targetStageId });
    }
  };

  const handleAddDeal = (stageId: string) => {
    setNewDealStageId(stageId);
    setIsNewDealOpen(true);
  };

  const handleCreateDeal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!newDealStageId || !activePipelineId) return;

    createDealMutation.mutate({
      title: formData.get("title") as string,
      stageId: newDealStageId,
      pipelineId: activePipelineId,
      value: formData.get("value") as string || undefined,
      source: formData.get("source") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const activeDeal = activeDealId && kanbanData 
    ? kanbanData.stages.flatMap(s => s.deals).find(d => d.id === activeDealId)
    : null;

  if (pipelinesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pipelines || pipelines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Žiadne predajné procesy</h2>
          <p className="text-muted-foreground mb-4">Začnite vytvorením predvoleného predajného procesu</p>
        </div>
        <Button 
          onClick={() => seedDefaultMutation.mutate()}
          disabled={seedDefaultMutation.isPending}
          data-testid="button-seed-pipeline"
        >
          {seedDefaultMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Vytvoriť predvolený proces
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader 
        title="Predajný pipeline" 
        description="Sledujte obchodné príležitosti v jednotlivých fázach"
      />

      <div className="flex items-center gap-4 p-4 border-b">
        <Select value={activePipelineId || ""} onValueChange={setActivePipelineId}>
          <SelectTrigger className="w-[250px]" data-testid="select-pipeline">
            <SelectValue placeholder="Vyberte pipeline" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button variant="outline" size="sm" data-testid="button-pipeline-settings">
          <Settings className="h-4 w-4 mr-1" />
          Nastavenia
        </Button>
      </div>

      {kanbanLoading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : kanbanData ? (
        <div className="flex-1 overflow-x-auto p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 h-full">
              {kanbanData.stages.map((stage) => (
                <StageColumn 
                  key={stage.id} 
                  stage={stage} 
                  onAddDeal={handleAddDeal}
                />
              ))}
            </div>

            <DragOverlay>
              {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      ) : null}

      <Dialog open={isNewDealOpen} onOpenChange={setIsNewDealOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nová príležitosť</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateDeal} className="space-y-4">
            <div>
              <Label htmlFor="title">Názov *</Label>
              <Input 
                id="title" 
                name="title" 
                placeholder="Napr. Novák - Cord Blood Premium" 
                required
                data-testid="input-deal-title"
              />
            </div>
            
            <div>
              <Label htmlFor="value">Hodnota (EUR)</Label>
              <Input 
                id="value" 
                name="value" 
                type="number" 
                step="0.01"
                placeholder="0.00"
                data-testid="input-deal-value"
              />
            </div>

            <div>
              <Label htmlFor="source">Zdroj</Label>
              <Select name="source">
                <SelectTrigger data-testid="select-deal-source">
                  <SelectValue placeholder="Vyberte zdroj" />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Poznámky</Label>
              <Textarea 
                id="notes" 
                name="notes" 
                placeholder="Dodatočné informácie..."
                data-testid="input-deal-notes"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsNewDealOpen(false)}>
                Zrušiť
              </Button>
              <Button type="submit" disabled={createDealMutation.isPending} data-testid="button-create-deal">
                {createDealMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Vytvoriť
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
