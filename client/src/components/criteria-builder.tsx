import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { COUNTRIES } from "@shared/schema";

export interface CriteriaCondition {
  id: string;
  field: string;
  operator: string;
  value: string | string[];
}

export interface CriteriaGroup {
  id: string;
  logic: "AND" | "OR";
  conditions: CriteriaCondition[];
}

interface CriteriaBuilderProps {
  criteria: CriteriaGroup[];
  onChange: (criteria: CriteriaGroup[]) => void;
  readonly?: boolean;
}

const FIELD_OPTIONS = [
  { value: "country", label: "Country", type: "select", options: COUNTRIES.map(c => ({ value: c.code, label: c.name })) },
  { value: "clientStatus", label: "Client Status", type: "select", options: [
    { value: "potential", label: "Potential" },
    { value: "acquired", label: "Acquired" },
    { value: "terminated", label: "Terminated" },
  ]},
  { value: "status", label: "Record Status", type: "select", options: [
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
    { value: "inactive", label: "Inactive" },
  ]},
  { value: "serviceType", label: "Service Type", type: "select", options: [
    { value: "cord_blood", label: "Cord Blood" },
    { value: "cord_tissue", label: "Cord Tissue" },
    { value: "both", label: "Both" },
  ]},
  { value: "leadStatus", label: "Lead Status", type: "select", options: [
    { value: "cold", label: "Cold" },
    { value: "warm", label: "Warm" },
    { value: "hot", label: "Hot" },
    { value: "qualified", label: "Qualified" },
  ]},
  { value: "newsletter", label: "Newsletter Subscribed", type: "boolean", options: [
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
  ]},
  { value: "city", label: "City", type: "text" },
  { value: "postalCode", label: "Postal Code", type: "text" },
];

const OPERATORS = {
  select: [
    { value: "equals", label: "equals" },
    { value: "notEquals", label: "does not equal" },
    { value: "in", label: "is one of" },
    { value: "notIn", label: "is not one of" },
  ],
  text: [
    { value: "equals", label: "equals" },
    { value: "notEquals", label: "does not equal" },
    { value: "contains", label: "contains" },
    { value: "startsWith", label: "starts with" },
    { value: "endsWith", label: "ends with" },
  ],
  boolean: [
    { value: "equals", label: "is" },
  ],
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function ConditionRow({
  condition,
  onUpdate,
  onRemove,
  readonly,
}: {
  condition: CriteriaCondition;
  onUpdate: (updated: CriteriaCondition) => void;
  onRemove: () => void;
  readonly?: boolean;
}) {
  const fieldConfig = FIELD_OPTIONS.find(f => f.value === condition.field);
  const fieldType = fieldConfig?.type || "text";
  const operators = OPERATORS[fieldType as keyof typeof OPERATORS] || OPERATORS.text;

  const handleFieldChange = (field: string) => {
    const newFieldConfig = FIELD_OPTIONS.find(f => f.value === field);
    const newType = newFieldConfig?.type || "text";
    const newOperators = OPERATORS[newType as keyof typeof OPERATORS] || OPERATORS.text;
    onUpdate({
      ...condition,
      field,
      operator: newOperators[0].value,
      value: "",
    });
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
      {!readonly && (
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
      )}
      
      <Select
        value={condition.field}
        onValueChange={handleFieldChange}
        disabled={readonly}
      >
        <SelectTrigger className="w-40" data-testid={`select-condition-field-${condition.id}`}>
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          {FIELD_OPTIONS.map(field => (
            <SelectItem key={field.value} value={field.value}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={condition.operator}
        onValueChange={(operator) => onUpdate({ ...condition, operator })}
        disabled={readonly}
      >
        <SelectTrigger className="w-36" data-testid={`select-condition-operator-${condition.id}`}>
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {operators.map(op => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {fieldConfig?.options ? (
        <Select
          value={Array.isArray(condition.value) ? condition.value[0] : condition.value}
          onValueChange={(value) => onUpdate({ ...condition, value })}
          disabled={readonly}
        >
          <SelectTrigger className="w-40" data-testid={`select-condition-value-${condition.id}`}>
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            {fieldConfig.options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          value={Array.isArray(condition.value) ? condition.value.join(", ") : condition.value}
          onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
          placeholder="Enter value"
          className="w-40"
          disabled={readonly}
          data-testid={`input-condition-value-${condition.id}`}
        />
      )}

      {!readonly && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          data-testid={`button-remove-condition-${condition.id}`}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}

function CriteriaGroupCard({
  group,
  groupIndex,
  onUpdate,
  onRemove,
  readonly,
}: {
  group: CriteriaGroup;
  groupIndex: number;
  onUpdate: (updated: CriteriaGroup) => void;
  onRemove: () => void;
  readonly?: boolean;
}) {
  const addCondition = () => {
    const newCondition: CriteriaCondition = {
      id: generateId(),
      field: "country",
      operator: "equals",
      value: "",
    };
    onUpdate({
      ...group,
      conditions: [...group.conditions, newCondition],
    });
  };

  const updateCondition = (index: number, updated: CriteriaCondition) => {
    const newConditions = [...group.conditions];
    newConditions[index] = updated;
    onUpdate({ ...group, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    const newConditions = group.conditions.filter((_, i) => i !== index);
    onUpdate({ ...group, conditions: newConditions });
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Group {groupIndex + 1}</Badge>
            <Select
              value={group.logic}
              onValueChange={(logic: "AND" | "OR") => onUpdate({ ...group, logic })}
              disabled={readonly}
            >
              <SelectTrigger className="w-20" data-testid={`select-group-logic-${group.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Match {group.logic === "AND" ? "all" : "any"} conditions
            </span>
          </div>
          {!readonly && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              data-testid={`button-remove-group-${group.id}`}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {group.conditions.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No conditions defined. Add a condition to filter customers.
          </p>
        ) : (
          group.conditions.map((condition, index) => (
            <div key={condition.id}>
              {index > 0 && (
                <div className="flex justify-center py-1">
                  <Badge variant="secondary" className="text-xs">
                    {group.logic}
                  </Badge>
                </div>
              )}
              <ConditionRow
                condition={condition}
                onUpdate={(updated) => updateCondition(index, updated)}
                onRemove={() => removeCondition(index)}
                readonly={readonly}
              />
            </div>
          ))
        )}
        
        {!readonly && (
          <Button
            variant="outline"
            size="sm"
            onClick={addCondition}
            className="mt-2"
            data-testid={`button-add-condition-${group.id}`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Condition
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function CriteriaBuilder({ criteria, onChange, readonly }: CriteriaBuilderProps) {
  const addGroup = () => {
    const newGroup: CriteriaGroup = {
      id: generateId(),
      logic: "AND",
      conditions: [],
    };
    onChange([...criteria, newGroup]);
  };

  const updateGroup = (index: number, updated: CriteriaGroup) => {
    const newGroups = [...criteria];
    newGroups[index] = updated;
    onChange(newGroups);
  };

  const removeGroup = (index: number) => {
    onChange(criteria.filter((_, i) => i !== index));
  };

  const totalConditions = criteria.reduce((acc, group) => acc + group.conditions.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <Label className="text-base font-medium">Target Criteria</Label>
          <p className="text-sm text-muted-foreground">
            Define which customers should be included in this campaign
          </p>
        </div>
        <Badge variant="secondary">
          {totalConditions} condition{totalConditions !== 1 ? "s" : ""} in {criteria.length} group{criteria.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {criteria.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">
              No criteria defined. All customers will be eligible for this campaign.
            </p>
            {!readonly && (
              <Button onClick={addGroup} data-testid="button-add-first-group">
                <Plus className="w-4 h-4 mr-2" />
                Add Criteria Group
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {criteria.map((group, index) => (
            <div key={group.id}>
              {index > 0 && (
                <div className="flex justify-center py-2">
                  <Badge variant="outline" className="text-xs">
                    AND
                  </Badge>
                </div>
              )}
              <CriteriaGroupCard
                group={group}
                groupIndex={index}
                onUpdate={(updated) => updateGroup(index, updated)}
                onRemove={() => removeGroup(index)}
                readonly={readonly}
              />
            </div>
          ))}
          
          {!readonly && (
            <Button
              variant="outline"
              onClick={addGroup}
              className="w-full"
              data-testid="button-add-group"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Group
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export function criteriaToDescription(criteria: CriteriaGroup[]): string {
  if (criteria.length === 0) return "All customers";
  
  const groupDescriptions = criteria.map(group => {
    const conditionDescriptions = group.conditions.map(cond => {
      const fieldConfig = FIELD_OPTIONS.find(f => f.value === cond.field);
      const fieldLabel = fieldConfig?.label || cond.field;
      const valueLabel = fieldConfig?.options?.find(o => o.value === cond.value)?.label || cond.value;
      return `${fieldLabel} ${cond.operator} "${valueLabel}"`;
    });
    return conditionDescriptions.join(` ${group.logic} `);
  });
  
  return groupDescriptions.join(" AND ");
}

export function getDefaultCriteria(): CriteriaGroup[] {
  return [];
}
