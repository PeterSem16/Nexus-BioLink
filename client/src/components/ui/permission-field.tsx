import { ReactNode, useMemo } from "react";
import { usePermissions } from "@/contexts/permissions-context";

interface PermissionFieldProps {
  moduleKey: string;
  fieldKey: string;
  children: (props: { 
    isHidden: boolean; 
    isReadonly: boolean;
    fieldAccess: "editable" | "readonly" | "hidden";
  }) => ReactNode;
}

export function PermissionField({ moduleKey, fieldKey, children }: PermissionFieldProps) {
  const { getFieldAccess } = usePermissions();
  const fieldAccess = getFieldAccess(moduleKey, fieldKey);
  
  if (fieldAccess === "hidden") {
    return null;
  }
  
  return (
    <>
      {children({
        isHidden: false,
        isReadonly: fieldAccess === "readonly",
        fieldAccess,
      })}
    </>
  );
}

export function useFieldPermission(moduleKey: string, fieldKey: string) {
  const { getFieldAccess } = usePermissions();
  const fieldAccess = getFieldAccess(moduleKey, fieldKey);
  
  return {
    isHidden: fieldAccess === "hidden",
    isReadonly: fieldAccess === "readonly",
    fieldAccess,
  };
}

export function useModuleFieldPermissions(moduleKey: string) {
  const { getFieldAccess, roleData } = usePermissions();
  
  const getAccess = (fieldKey: string) => {
    return getFieldAccess(moduleKey, fieldKey);
  };
  
  const isHidden = (fieldKey: string) => {
    return getAccess(fieldKey) === "hidden";
  };
  
  const isReadonly = (fieldKey: string) => {
    return getAccess(fieldKey) === "readonly";
  };
  
  const isEditable = (fieldKey: string) => {
    return getAccess(fieldKey) === "editable";
  };
  
  return {
    getAccess,
    isHidden,
    isReadonly,
    isEditable,
  };
}
