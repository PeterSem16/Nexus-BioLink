import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useI18n } from "@/i18n";
import { useCountryFilter } from "@/contexts/country-filter-context";
import { useAuth } from "@/contexts/auth-context";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Task, User, Customer } from "@shared/schema";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Play, 
  MoreHorizontal,
  Plus,
  Search,
  User as UserIcon,
  Calendar,
  Loader2,
  XCircle,
  Edit
} from "lucide-react";

const priorityConfig = {
  low: { color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: Clock },
  medium: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: Clock },
  high: { color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300", icon: AlertCircle },
  urgent: { color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: AlertCircle },
};

const statusConfig = {
  pending: { color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: Clock },
  in_progress: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: Play },
  completed: { color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: CheckCircle2 },
  cancelled: { color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400", icon: XCircle },
};

export default function TasksPage() {
  const { t } = useI18n();
  const { selectedCountries } = useCountryFilter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
    assignedUserId: "",
  });

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Task>) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: t.common.success,
        description: t.tasks.taskUpdated,
      });
      setEditDialogOpen(false);
      setSelectedTask(null);
    },
    onError: () => {
      toast({
        title: t.common.error,
        description: t.tasks.updateFailed,
        variant: "destructive",
      });
    },
  });

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesCountry = selectedCountries.length === 0 || 
      !task.country || 
      selectedCountries.includes(task.country as typeof selectedCountries[number]);
    return matchesSearch && matchesStatus && matchesPriority && matchesCountry;
  });

  const myTasks = filteredTasks.filter(task => task.assignedUserId === user?.id);
  const allTasks = filteredTasks;

  const getUser = (userId: string) => users.find(u => u.id === userId);
  const getCustomer = (customerId: string | null) => customerId ? customers.find(c => c.id === customerId) : null;

  const handleStatusChange = (task: Task, newStatus: string) => {
    updateTaskMutation.mutate({ id: task.id, status: newStatus });
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      assignedUserId: task.assignedUserId,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedTask) return;
    updateTaskMutation.mutate({
      id: selectedTask.id,
      title: editForm.title,
      description: editForm.description,
      priority: editForm.priority,
      status: editForm.status,
      assignedUserId: editForm.assignedUserId,
    });
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const assignedUser = getUser(task.assignedUserId);
    const linkedCustomer = getCustomer(task.customerId || null);
    const PriorityIcon = priorityConfig[task.priority as keyof typeof priorityConfig]?.icon || Clock;
    const StatusIcon = statusConfig[task.status as keyof typeof statusConfig]?.icon || Clock;

    return (
      <Card className="hover-elevate" data-testid={`task-card-${task.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={priorityConfig[task.priority as keyof typeof priorityConfig]?.color || ""}>
                  <PriorityIcon className="h-3 w-3 mr-1" />
                  {t.tasks.priorities[task.priority as keyof typeof t.tasks.priorities] || task.priority}
                </Badge>
                <Badge className={statusConfig[task.status as keyof typeof statusConfig]?.color || ""}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {t.tasks.statuses[task.status as keyof typeof t.tasks.statuses] || task.status}
                </Badge>
              </div>
              <h3 className="font-medium text-sm truncate" data-testid={`task-title-${task.id}`}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                {assignedUser && (
                  <div className="flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    <span>{assignedUser.fullName || assignedUser.username}</span>
                  </div>
                )}
                {task.dueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(task.dueDate), "dd.MM.yyyy")}</span>
                  </div>
                )}
              </div>
              {linkedCustomer && (
                <div className="mt-2 text-xs">
                  <span className="text-muted-foreground">{t.tasks.linkedTo}: </span>
                  <span className="font-medium">{linkedCustomer.firstName} {linkedCustomer.lastName}</span>
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid={`task-menu-${task.id}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditTask(task)} data-testid={`task-edit-${task.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t.common.edit}
                </DropdownMenuItem>
                {task.status !== "in_progress" && (
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange(task, "in_progress")}
                    data-testid={`task-start-${task.id}`}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {t.tasks.startWorking}
                  </DropdownMenuItem>
                )}
                {task.status !== "completed" && (
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange(task, "completed")}
                    data-testid={`task-complete-${task.id}`}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t.tasks.markComplete}
                  </DropdownMenuItem>
                )}
                {task.status !== "cancelled" && task.status !== "completed" && (
                  <DropdownMenuItem 
                    onClick={() => handleStatusChange(task, "cancelled")}
                    data-testid={`task-cancel-${task.id}`}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {t.tasks.cancel}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TaskList = ({ tasks }: { tasks: Task[] }) => {
    if (tasks.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t.tasks.noTasks}</p>
        </div>
      );
    }

    return (
      <div className="grid gap-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    );
  };

  const pendingCount = filteredTasks.filter(t => t.status === "pending").length;
  const inProgressCount = filteredTasks.filter(t => t.status === "in_progress").length;
  const completedCount = filteredTasks.filter(t => t.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-tasks-title">{t.tasks.title}</h1>
          <p className="text-muted-foreground">{t.tasks.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t.tasks.pending}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t.tasks.inProgress}</CardTitle>
            <Play className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t.tasks.completed}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.tasks.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-task-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
            <SelectValue placeholder={t.common.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.common.all}</SelectItem>
            <SelectItem value="pending">{t.tasks.statuses.pending}</SelectItem>
            <SelectItem value="in_progress">{t.tasks.statuses.in_progress}</SelectItem>
            <SelectItem value="completed">{t.tasks.statuses.completed}</SelectItem>
            <SelectItem value="cancelled">{t.tasks.statuses.cancelled}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-priority-filter">
            <SelectValue placeholder={t.quickCreate.priority} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.common.all}</SelectItem>
            <SelectItem value="low">{t.tasks.priorities.low}</SelectItem>
            <SelectItem value="medium">{t.tasks.priorities.medium}</SelectItem>
            <SelectItem value="high">{t.tasks.priorities.high}</SelectItem>
            <SelectItem value="urgent">{t.tasks.priorities.urgent}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="my" className="w-full">
          <TabsList>
            <TabsTrigger value="my" data-testid="tab-my-tasks">
              {t.tasks.myTasks} ({myTasks.length})
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all-tasks">
              {t.tasks.allTasks} ({allTasks.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="my" className="mt-4">
            <TaskList tasks={myTasks} />
          </TabsContent>
          <TabsContent value="all" className="mt-4">
            <TaskList tasks={allTasks} />
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.tasks.editTask}</DialogTitle>
            <DialogDescription>{t.tasks.editTaskDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t.quickCreate.taskTitle}</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                data-testid="input-edit-task-title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t.quickCreate.taskDescription}</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="resize-none"
                data-testid="input-edit-task-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t.quickCreate.priority}</label>
                <Select value={editForm.priority} onValueChange={(val) => setEditForm({ ...editForm, priority: val })}>
                  <SelectTrigger data-testid="select-edit-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t.tasks.priorities.low}</SelectItem>
                    <SelectItem value="medium">{t.tasks.priorities.medium}</SelectItem>
                    <SelectItem value="high">{t.tasks.priorities.high}</SelectItem>
                    <SelectItem value="urgent">{t.tasks.priorities.urgent}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">{t.common.status}</label>
                <Select value={editForm.status} onValueChange={(val) => setEditForm({ ...editForm, status: val })}>
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t.tasks.statuses.pending}</SelectItem>
                    <SelectItem value="in_progress">{t.tasks.statuses.in_progress}</SelectItem>
                    <SelectItem value="completed">{t.tasks.statuses.completed}</SelectItem>
                    <SelectItem value="cancelled">{t.tasks.statuses.cancelled}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t.quickCreate.assignedTo}</label>
              <Select value={editForm.assignedUserId} onValueChange={(val) => setEditForm({ ...editForm, assignedUserId: val })}>
                <SelectTrigger data-testid="select-edit-assigned">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.id).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.fullName || u.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateTaskMutation.isPending}>
              {updateTaskMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
