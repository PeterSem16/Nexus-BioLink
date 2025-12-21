import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { COUNTRIES } from "@/lib/countries";
import { Separator } from "@/components/ui/separator";
import { Droplets, Globe, Shield, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="System configuration and information"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Droplets className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>About Nexus BioLink</CardTitle>
              <CardDescription>CRM System for Cord Blood Banking</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Version</span>
              <Badge variant="secondary">v1.0.0</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Environment</span>
              <Badge>Production</Badge>
            </div>
            <Separator />
            <p className="text-sm text-muted-foreground">
              Nexus BioLink is a comprehensive CRM system designed specifically for cord blood banking companies. 
              It provides multi-country support, customer management, and user access control.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Supported Countries</CardTitle>
              <CardDescription>Regions available in the system</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {COUNTRIES.map((country) => (
                <div
                  key={country.code}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <span className="text-xl">{country.flag}</span>
                  <div>
                    <p className="font-medium text-sm">{country.name}</p>
                    <p className="text-xs text-muted-foreground">{country.code}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>User Roles</CardTitle>
              <CardDescription>Access levels in the system</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Badge>Admin</Badge>
                <p className="text-sm text-muted-foreground">
                  Full access to all features, user management, and system settings
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Badge variant="secondary">Manager</Badge>
                <p className="text-sm text-muted-foreground">
                  Can manage customers and view reports for assigned countries
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Badge variant="outline">User</Badge>
                <p className="text-sm text-muted-foreground">
                  Basic access to view and edit customers in assigned countries
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Service Types</CardTitle>
              <CardDescription>Available cord blood services</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium text-sm">Cord Blood</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Collection and storage of umbilical cord blood stem cells
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium text-sm">Cord Tissue</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Preservation of umbilical cord tissue for mesenchymal stem cells
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium text-sm">Both Services</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete package including both cord blood and tissue banking
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
