import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ChevronDown,
  Building2,
  GripVertical,
  Pencil,
  Trash2,
  User,
  Mail,
  Phone,
  Plus,
} from "lucide-react";
import type { Department } from "@shared/schema";

interface DepartmentNode extends Department {
  children: DepartmentNode[];
  depth: number;
}

interface DepartmentTreeProps {
  departments: Department[];
  onEdit: (dept: Department) => void;
  onDelete: (dept: Department) => void;
  onAdd: (parentId?: string) => void;
  onMove: (deptId: string, newParentId: string | null) => void;
  translations: {
    addDepartment: string;
    addSubDepartment: string;
    noDepartments: string;
    contactPerson: string;
  };
}

function buildTree(departments: Department[]): DepartmentNode[] {
  const map = new Map<string, DepartmentNode>();
  const roots: DepartmentNode[] = [];

  departments.forEach((dept) => {
    map.set(dept.id, { ...dept, children: [], depth: 0 });
  });

  departments
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .forEach((dept) => {
      const node = map.get(dept.id)!;
      if (dept.parentId && map.has(dept.parentId)) {
        const parent = map.get(dept.parentId)!;
        node.depth = parent.depth + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

  return roots;
}

function SortableDepartmentItem({
  node,
  onEdit,
  onDelete,
  onAdd,
  onMove,
  expandedIds,
  toggleExpand,
  translations,
  isDragging,
}: {
  node: DepartmentNode;
  onEdit: (dept: Department) => void;
  onDelete: (dept: Department) => void;
  onAdd: (parentId?: string) => void;
  onMove: (deptId: string, newParentId: string | null) => void;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  translations: DepartmentTreeProps["translations"];
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
    active,
  } = useSortable({ id: node.id, data: { node } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const hasContact = node.contactFirstName || node.contactLastName || node.contactEmail || node.contactPhone;
  const isDropTarget = isOver && active?.id !== node.id;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`
          p-3 rounded-md border mb-2 transition-all
          ${isDropTarget ? "border-primary border-2 bg-primary/5" : "border-border"}
          ${isDragging ? "shadow-lg" : ""}
        `}
        style={{ marginLeft: `${node.depth * 24}px` }}
        data-testid={`department-tree-item-${node.id}`}
      >
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab p-1 rounded hover:bg-accent touch-none"
            data-testid={`drag-handle-${node.id}`}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>

          {hasChildren ? (
            <button
              onClick={() => toggleExpand(node.id)}
              className="p-1 rounded hover:bg-accent"
              data-testid={`toggle-expand-${node.id}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <Building2 className="h-4 w-4 text-muted-foreground" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{node.name}</span>
              {node.children.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {node.children.length}
                </Badge>
              )}
            </div>
            {node.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {node.description}
              </p>
            )}
            {hasContact && (
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {(node.contactFirstName || node.contactLastName) && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {node.contactFirstName} {node.contactLastName}
                  </span>
                )}
                {node.contactEmail && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {node.contactEmail}
                  </span>
                )}
                {node.contactPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {node.contactPhone}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onAdd(node.id)}
              title={translations.addSubDepartment}
              data-testid={`button-add-sub-dept-${node.id}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(node)}
              data-testid={`button-edit-dept-${node.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(node)}
              data-testid={`button-delete-dept-${node.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="relative">
          <div
            className="absolute left-6 top-0 bottom-2 w-px bg-border"
            style={{ marginLeft: `${node.depth * 24}px` }}
          />
          {node.children.map((child) => (
            <SortableDepartmentItem
              key={child.id}
              node={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onAdd={onAdd}
              onMove={onMove}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              translations={translations}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DragOverlayContent({ node }: { node: DepartmentNode | null }) {
  if (!node) return null;

  return (
    <div className="p-3 rounded-md border bg-card shadow-lg" style={{ width: "300px" }}>
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">{node.name}</span>
      </div>
    </div>
  );
}

export function DepartmentTree({
  departments,
  onEdit,
  onDelete,
  onAdd,
  onMove,
  translations,
}: DepartmentTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeNode, setActiveNode] = useState<DepartmentNode | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const tree = useMemo(() => buildTree(departments), [departments]);
  const allIds = useMemo(() => departments.map((d) => d.id), [departments]);
  const nodeMap = useMemo(() => {
    const map = new Map<string, DepartmentNode>();
    function traverse(nodes: DepartmentNode[]) {
      nodes.forEach((n) => {
        map.set(n.id, n);
        traverse(n.children);
      });
    }
    traverse(tree);
    return map;
  }, [tree]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(departments.map((d) => d.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  function handleDragStart(event: DragStartEvent) {
    const node = nodeMap.get(event.active.id as string);
    setActiveNode(node || null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveNode(null);

    if (!over || active.id === over.id) return;

    const draggedId = active.id as string;
    const targetId = over.id as string;

    const draggedNode = nodeMap.get(draggedId);
    const targetNode = nodeMap.get(targetId);

    if (!draggedNode || !targetNode) return;

    function isDescendant(nodeId: string, ancestorId: string): boolean {
      const node = nodeMap.get(nodeId);
      if (!node) return false;
      if (node.parentId === ancestorId) return true;
      if (node.parentId) return isDescendant(node.parentId, ancestorId);
      return false;
    }

    if (isDescendant(targetId, draggedId)) {
      return;
    }

    onMove(draggedId, targetId);
  }

  if (departments.length === 0) {
    return (
      <div className="text-center py-8">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">{translations.noDepartments}</p>
        <Button onClick={() => onAdd()} data-testid="button-add-first-department">
          <Plus className="h-4 w-4 mr-2" />
          {translations.addDepartment}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={expandAll} data-testid="button-expand-all">
            Expand All
          </Button>
          <Button size="sm" variant="outline" onClick={collapseAll} data-testid="button-collapse-all">
            Collapse All
          </Button>
        </div>
        <Button size="sm" onClick={() => onAdd()} data-testid="button-add-department">
          <Plus className="h-4 w-4 mr-1" />
          {translations.addDepartment}
        </Button>
      </div>

      <div className="border rounded-md p-3 min-h-[200px]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
            {tree.map((node) => (
              <SortableDepartmentItem
                key={node.id}
                node={node}
                onEdit={onEdit}
                onDelete={onDelete}
                onAdd={onAdd}
                onMove={onMove}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
                translations={translations}
                isDragging={activeNode?.id === node.id}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            <DragOverlayContent node={activeNode} />
          </DragOverlay>
        </DndContext>
      </div>

      <p className="text-xs text-muted-foreground">
        Drag departments onto each other to create hierarchy. Drop on a department to make it a sub-department.
      </p>
    </div>
  );
}
