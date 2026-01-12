import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Cloud, 
  CloudOff, 
  Mail, 
  Calendar, 
  Users, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  RefreshCw,
  Send,
  Clock,
  User,
  Shield,
  Loader2
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { sk } from "date-fns/locale";

export default function MS365IntegrationPage() {
  const { toast } = useToast();
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Check for URL params (success/error from OAuth callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("ms365_connected");
    const error = params.get("ms365_error");
    
    if (connected === "true") {
      toast({
        title: "Úspešne pripojené",
        description: "Microsoft 365 bolo úspešne prepojené s vaším účtom.",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (error) {
      toast({
        title: "Chyba pripojenia",
        description: decodeURIComponent(error),
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  // Fetch MS365 configuration status
  const { data: configStatus, isLoading: loadingConfig } = useQuery<{
    configured: boolean;
    tenantId: string;
    clientId: string;
    secretExpiration: {
      date: string;
      daysRemaining: number;
      isExpiringSoon: boolean;
      isExpired: boolean;
    };
  }>({
    queryKey: ["/api/ms365/status"],
  });

  // Fetch MS365 connection status
  const { data: connectionStatus, isLoading: loadingConnection, refetch: refetchConnection } = useQuery<{
    connected: boolean;
    profile?: any;
    connectedAt?: string;
    expiresOn?: string;
    isExpired?: boolean;
  }>({
    queryKey: ["/api/ms365/connection"],
  });

  // Fetch emails
  const { data: emails, isLoading: loadingEmails, refetch: refetchEmails } = useQuery<any>({
    queryKey: ["/api/ms365/emails"],
    enabled: connectionStatus?.connected === true,
  });

  // Fetch calendar events
  const { data: calendarEvents, isLoading: loadingCalendar, refetch: refetchCalendar } = useQuery<any>({
    queryKey: ["/api/ms365/calendar"],
    enabled: connectionStatus?.connected === true,
  });

  // Fetch contacts
  const { data: contacts, isLoading: loadingContacts, refetch: refetchContacts } = useQuery<any>({
    queryKey: ["/api/ms365/contacts"],
    enabled: connectionStatus?.connected === true,
  });

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/auth/microsoft");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodarilo sa inicializovať pripojenie",
        variant: "destructive",
      });
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ms365/disconnect");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ms365/connection"] });
      toast({
        title: "Odpojené",
        description: "Microsoft 365 bolo úspešne odpojené",
      });
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (data: { to: string; subject: string; body: string }) => {
      const res = await apiRequest("POST", "/api/ms365/send-email", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email odoslaný",
        description: "Email bol úspešne odoslaný cez Microsoft 365",
      });
      setEmailTo("");
      setEmailSubject("");
      setEmailBody("");
      refetchEmails();
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodarilo sa odoslať email",
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = () => {
    if (!emailTo || !emailSubject || !emailBody) {
      toast({
        title: "Chýbajúce údaje",
        description: "Vyplňte všetky polia",
        variant: "destructive",
      });
      return;
    }
    sendEmailMutation.mutate({ to: emailTo, subject: emailSubject, body: emailBody });
  };

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cloud className="h-6 w-6 text-blue-500" />
            Microsoft 365 Integrácia
          </h1>
          <p className="text-muted-foreground">
            Prepojte CRM s Microsoft 365 pre prístup k emailom, kalendáru a kontaktom
          </p>
        </div>
        <Badge variant={connectionStatus?.connected ? "default" : "secondary"} className="text-sm">
          {connectionStatus?.connected ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Pripojené
            </>
          ) : (
            <>
              <CloudOff className="h-3.5 w-3.5 mr-1" />
              Nepripojené
            </>
          )}
        </Badge>
      </div>

      {/* Secret Expiration Warning */}
      {configStatus?.secretExpiration?.isExpiringSoon && (
        <Alert variant={configStatus.secretExpiration.isExpired ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {configStatus.secretExpiration.isExpired ? "Secret kľúč expiroval!" : "Upozornenie na expiráciu"}
          </AlertTitle>
          <AlertDescription>
            {configStatus.secretExpiration.isExpired 
              ? "Secret kľúč pre Microsoft 365 expiroval. Kontaktujte administrátora pre obnovenie."
              : `Secret kľúč expiruje za ${configStatus.secretExpiration.daysRemaining} dní (${format(new Date(configStatus.secretExpiration.date), "d. MMMM yyyy", { locale: sk })}). Kontaktujte administrátora pre včasné obnovenie.`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Konfigurácia
          </CardTitle>
          <CardDescription>
            Stav konfigurácie Microsoft Entra ID (Azure AD)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="text-sm text-muted-foreground">Tenant ID</p>
              <p className="font-mono text-sm">{configStatus?.tenantId || "Nenastavené"}</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="text-sm text-muted-foreground">Client ID</p>
              <p className="font-mono text-sm">{configStatus?.clientId || "Nenastavené"}</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="text-sm text-muted-foreground">Secret expirácia</p>
              <p className="font-mono text-sm flex items-center gap-2">
                {configStatus?.secretExpiration ? (
                  <>
                    {format(new Date(configStatus.secretExpiration.date), "d.M.yyyy")}
                    {configStatus.secretExpiration.isExpiringSoon && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </>
                ) : "Nenastavené"}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <div>
              {connectionStatus?.connected && connectionStatus.profile && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">{connectionStatus.profile.displayName}</p>
                    <p className="text-sm text-muted-foreground">{connectionStatus.profile.mail || connectionStatus.profile.userPrincipalName}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {connectionStatus?.connected ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => refetchConnection()}
                    disabled={loadingConnection}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingConnection ? "animate-spin" : ""}`} />
                    Obnoviť
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending}
                  >
                    <CloudOff className="h-4 w-4 mr-2" />
                    Odpojiť
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending || !configStatus?.configured}
                >
                  {connectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Cloud className="h-4 w-4 mr-2" />
                  )}
                  Pripojiť Microsoft 365
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Tabs - Only show when connected */}
      {connectionStatus?.connected && (
        <Tabs defaultValue="emails" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="emails" className="flex items-center gap-2" data-testid="tab-emails">
              <Mail className="h-4 w-4" />
              Emaily
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2" data-testid="tab-calendar">
              <Calendar className="h-4 w-4" />
              Kalendár
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2" data-testid="tab-contacts">
              <Users className="h-4 w-4" />
              Kontakty
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center gap-2" data-testid="tab-send">
              <Send className="h-4 w-4" />
              Odoslať email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="emails" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Posledné emaily</CardTitle>
                  <CardDescription>Emaily z vašej Microsoft 365 schránky</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchEmails()} disabled={loadingEmails}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingEmails ? "animate-spin" : ""}`} />
                  Obnoviť
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {loadingEmails ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : emails?.value?.length > 0 ? (
                    <div className="space-y-3">
                      {emails.value.map((email: any) => (
                        <div key={email.id} className="p-3 rounded-lg border hover-elevate">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{email.subject || "(Bez predmetu)"}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                Od: {email.from?.emailAddress?.name || email.from?.emailAddress?.address}
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {email.receivedDateTime && formatDistanceToNow(new Date(email.receivedDateTime), { addSuffix: true, locale: sk })}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {email.bodyPreview}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Žiadne emaily</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Nadchádzajúce udalosti</CardTitle>
                  <CardDescription>Udalosti z vášho Microsoft 365 kalendára</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchCalendar()} disabled={loadingCalendar}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingCalendar ? "animate-spin" : ""}`} />
                  Obnoviť
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {loadingCalendar ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : calendarEvents?.value?.length > 0 ? (
                    <div className="space-y-3">
                      {calendarEvents.value.map((event: any) => (
                        <div key={event.id} className="p-3 rounded-lg border hover-elevate">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{event.subject}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {event.start?.dateTime && format(new Date(event.start.dateTime), "d.M.yyyy HH:mm", { locale: sk })}
                                {event.end?.dateTime && ` - ${format(new Date(event.end.dateTime), "HH:mm")}`}
                              </p>
                              {event.location?.displayName && (
                                <p className="text-sm text-muted-foreground">{event.location.displayName}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Žiadne nadchádzajúce udalosti</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Kontakty</CardTitle>
                  <CardDescription>Kontakty z vášho Microsoft 365 účtu</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchContacts()} disabled={loadingContacts}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingContacts ? "animate-spin" : ""}`} />
                  Obnoviť
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {loadingContacts ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : contacts?.value?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {contacts.value.map((contact: any) => (
                        <div key={contact.id} className="p-3 rounded-lg border hover-elevate flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{contact.displayName}</p>
                            {contact.emailAddresses?.[0]?.address && (
                              <p className="text-sm text-muted-foreground truncate">{contact.emailAddresses[0].address}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Žiadne kontakty</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="send" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Odoslať email</CardTitle>
                <CardDescription>Odoslať email cez Microsoft 365</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailTo">Príjemca</Label>
                  <Input
                    id="emailTo"
                    type="email"
                    placeholder="email@example.com"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    data-testid="input-email-to"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailSubject">Predmet</Label>
                  <Input
                    id="emailSubject"
                    placeholder="Predmet emailu"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    data-testid="input-email-subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailBody">Obsah</Label>
                  <Textarea
                    id="emailBody"
                    placeholder="Obsah emailu..."
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    data-testid="input-email-body"
                  />
                </div>
                <Button 
                  onClick={handleSendEmail} 
                  disabled={sendEmailMutation.isPending}
                  data-testid="button-send-email"
                >
                  {sendEmailMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Odoslať
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Not Connected Info */}
      {!connectionStatus?.connected && configStatus?.configured && (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-blue-500 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Prepojte Microsoft 365</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Po pripojení budete mať prístup k emailom, kalendáru a kontaktom priamo v CRM.
              Používame zabezpečené OAuth 2.0 pripojenie.
            </p>
            <Button onClick={() => connectMutation.mutate()} disabled={connectMutation.isPending}>
              {connectMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Prihlásiť sa cez Microsoft
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
