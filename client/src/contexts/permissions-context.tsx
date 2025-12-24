import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./auth-context";

type ModuleAccess = "visible" | "hidden";
type FieldAccess = "editable" | "readonly" | "hidden";

interface ModulePermission {
  moduleKey: string;
  access: ModuleAccess;
}

interface FieldPermission {
  fieldKey: string;
  access: FieldAccess;
}

interface RoleWithPermissions {
  id: string;
  name: string;
  legacyRole: string | null;
  modulePermissions: ModulePermission[];
  fieldPermissions: FieldPermission[];
}

interface PermissionsContextType {
  canAccessModule: (moduleKey: string) => boolean;
  getFieldAccess: (fieldKey: string) => FieldAccess;
  isLoading: boolean;
  roleData: RoleWithPermissions | null;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const { data: roleData, isLoading } = useQuery<RoleWithPermissions>({
    queryKey: ["/api/roles", user?.roleId],
    enabled: !!user?.roleId,
  });
  
  const canAccessModule = (moduleKey: string): boolean => {
    if (!user) return false;
    
    if (!user.roleId) {
      return user.role === "admin";
    }
    
    if (!roleData) {
      return user.role === "admin";
    }
    
    const modulePerm = roleData.modulePermissions.find(p => p.moduleKey === moduleKey);
    if (!modulePerm) {
      return user.role === "admin";
    }
    
    return modulePerm.access === "visible";
  };
  
  const getFieldAccess = (fieldKey: string): FieldAccess => {
    if (!user) return "hidden";
    
    if (!user.roleId || !roleData) {
      return user.role === "admin" ? "editable" : "readonly";
    }
    
    const fieldPerm = roleData.fieldPermissions.find(p => p.fieldKey === fieldKey);
    if (!fieldPerm) {
      return user.role === "admin" ? "editable" : "readonly";
    }
    
    return fieldPerm.access;
  };
  
  return (
    <PermissionsContext.Provider value={{ canAccessModule, getFieldAccess, isLoading, roleData: roleData ?? null }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
