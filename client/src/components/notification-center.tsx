import { useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { sk } from "date-fns/locale";
import { 
  Bell, Mail, MessageSquare, UserPlus, RefreshCw, AlertTriangle, 
  Clipboard, Clock, CheckCircle, AtSign, Info, X, Check, CheckCheck,
  Filter, Trash2
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const NOTIFICATION_ICONS: Record<string, any> = {
  new_email: Mail,
  new_sms: MessageSquare,
  new_customer: UserPlus,
  status_change: RefreshCw,
  sentiment_alert: AlertTriangle,
  task_assigned: Clipboard,
  task_due: Clock,
  task_completed: CheckCircle,
  mention: AtSign,
  system: Info,
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

interface NotificationItemProps {
  notification: any;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onMarkRead, onDismiss }: NotificationItemProps) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Info;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { 
    addSuffix: true, 
    locale: sk 
  });

  return (
    <div 
      className={cn(
        "p-3 border-b last:border-b-0 hover-elevate cursor-pointer transition-colors",
        !notification.isRead && "bg-primary/5"
      )}
      onClick={() => !notification.isRead && onMarkRead(notification.id)}
      data-testid={`notification-item-${notification.id}`}
    >
      <div className="flex gap-3">
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          notification.priority === "urgent" ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300" :
          notification.priority === "high" ? "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300" :
          "bg-muted text-muted-foreground"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm truncate",
                !notification.isRead && "font-medium"
              )}>
                {notification.title}
              </p>
              {notification.message && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {notification.message}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(notification.id);
              }}
              data-testid={`dismiss-notification-${notification.id}`}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            {notification.countryCode && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {notification.countryCode}
              </Badge>
            )}
            {notification.priority !== "normal" && (
              <Badge className={cn("text-xs px-1 py-0", PRIORITY_COLORS[notification.priority])}>
                {notification.priority === "urgent" ? "Urgentné" : 
                 notification.priority === "high" ? "Vysoká" : "Nízka"}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    isConnected,
    markAsRead, 
    markAllAsRead, 
    dismiss,
    dismissAll
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "unread") return !n.isRead;
    return true;
  });

  const unreadNotifications = notifications.filter(n => !n.isRead);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          data-testid="button-notification-bell"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          {!isConnected && (
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-yellow-500" title="Odpojené" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        data-testid="notification-center-popover"
      >
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifikácie</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-xs h-7"
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Všetky prečítané
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-3 pt-2">
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="all" className="text-xs" data-testid="tab-notifications-all">
                Všetky
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs" data-testid="tab-notifications-unread">
                Neprečítané ({unreadCount})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <ScrollArea className="h-[400px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Žiadne notifikácie</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={markAsRead}
                      onDismiss={dismiss}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            <ScrollArea className="h-[400px]">
              {unreadNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Všetko prečítané</p>
                </div>
              ) : (
                <div className="divide-y">
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={markAsRead}
                      onDismiss={dismiss}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <Separator />
        <div className="p-2 flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => dismissAll()}
            data-testid="button-dismiss-all"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Vymazať všetky
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setIsOpen(false)}
            data-testid="button-view-all-notifications"
          >
            Zobraziť všetky
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function NotificationCenterPage() {
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    markAsRead, 
    markAllAsRead, 
    dismiss,
    dismissAll,
    refetch
  } = useNotifications();
  const [filter, setFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread" && n.isRead) return false;
    if (filter === "read" && !n.isRead) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  });

  const notificationTypes = Array.from(new Set(notifications.map(n => n.type)));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifikačné centrum</h1>
          <p className="text-muted-foreground">
            {unreadCount} neprečítaných notifikácií
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button onClick={() => markAllAsRead()} variant="outline" data-testid="button-mark-all-read-page">
              <CheckCheck className="h-4 w-4 mr-2" />
              Označiť všetky ako prečítané
            </Button>
          )}
          <Button onClick={() => refetch()} variant="outline" data-testid="button-refresh-notifications">
            <RefreshCw className="h-4 w-4 mr-2" />
            Obnoviť
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all" data-testid="filter-all">Všetky</TabsTrigger>
            <TabsTrigger value="unread" data-testid="filter-unread">Neprečítané</TabsTrigger>
            <TabsTrigger value="read" data-testid="filter-read">Prečítané</TabsTrigger>
          </TabsList>
        </Tabs>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          data-testid="select-type-filter"
        >
          <option value="all">Všetky typy</option>
          {notificationTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg">
            <Bell className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">Žiadne notifikácie</p>
            <p className="text-sm">Keď prídu nové notifikácie, zobrazia sa tu</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div 
              key={notification.id}
              className={cn(
                "p-4 border rounded-lg hover-elevate cursor-pointer",
                !notification.isRead && "bg-primary/5 border-primary/20"
              )}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
              data-testid={`notification-row-${notification.id}`}
            >
              <div className="flex gap-4">
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                  notification.priority === "urgent" ? "bg-red-100 text-red-600" :
                  notification.priority === "high" ? "bg-orange-100 text-orange-600" :
                  "bg-muted text-muted-foreground"
                )}>
                  {(() => {
                    const Icon = NOTIFICATION_ICONS[notification.type] || Info;
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={cn("font-medium", !notification.isRead && "text-primary")}>
                        {notification.title}
                      </h3>
                      {notification.message && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          data-testid={`mark-read-${notification.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismiss(notification.id);
                        }}
                        data-testid={`dismiss-${notification.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: sk })}
                    </span>
                    {notification.countryCode && (
                      <Badge variant="outline" className="text-xs">
                        {notification.countryCode}
                      </Badge>
                    )}
                    {notification.priority !== "normal" && (
                      <Badge className={cn("text-xs", PRIORITY_COLORS[notification.priority])}>
                        {notification.priority}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {notification.type}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
