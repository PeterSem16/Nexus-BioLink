import { useState, useEffect } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

export interface WeeklySchedule {
  [key: number]: DaySchedule;
}

export interface ScheduleConfig {
  maxAttemptsPerContact: number;
  minHoursBetweenAttempts: number;
  weeklySchedule: WeeklySchedule;
}

interface ScheduleEditorProps {
  schedule: ScheduleConfig;
  onChange: (schedule: ScheduleConfig) => void;
  readonly?: boolean;
}

function getDefaultSchedule(): WeeklySchedule {
  const schedule: WeeklySchedule = {};
  for (let i = 0; i < 7; i++) {
    schedule[i] = {
      enabled: i >= 1 && i <= 5,
      slots: i >= 1 && i <= 5 ? [{ startTime: "09:00", endTime: "17:00" }] : [],
    };
  }
  return schedule;
}

export function getDefaultScheduleConfig(): ScheduleConfig {
  return {
    maxAttemptsPerContact: 5,
    minHoursBetweenAttempts: 24,
    weeklySchedule: getDefaultSchedule(),
  };
}

function DayRow({
  day,
  schedule,
  onToggle,
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
  readonly,
}: {
  day: typeof DAYS_OF_WEEK[number];
  schedule: DaySchedule;
  onToggle: () => void;
  onAddSlot: () => void;
  onRemoveSlot: (index: number) => void;
  onUpdateSlot: (index: number, slot: TimeSlot) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 py-3 border-b last:border-0">
      <div className="flex items-center gap-2 w-32">
        <Switch
          checked={schedule.enabled}
          onCheckedChange={onToggle}
          disabled={readonly}
          data-testid={`switch-day-${day.value}`}
        />
        <Label className="font-medium">{day.label}</Label>
      </div>
      
      <div className="flex-1 space-y-2">
        {schedule.enabled ? (
          schedule.slots.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No time slots configured</p>
          ) : (
            schedule.slots.map((slot, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => onUpdateSlot(index, { ...slot, startTime: e.target.value })}
                  className="w-32"
                  disabled={readonly}
                  data-testid={`input-start-time-${day.value}-${index}`}
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => onUpdateSlot(index, { ...slot, endTime: e.target.value })}
                  className="w-32"
                  disabled={readonly}
                  data-testid={`input-end-time-${day.value}-${index}`}
                />
                {!readonly && schedule.slots.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveSlot(index)}
                    data-testid={`button-remove-slot-${day.value}-${index}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))
          )
        ) : (
          <Badge variant="secondary">Closed</Badge>
        )}
        
        {!readonly && schedule.enabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddSlot}
            data-testid={`button-add-slot-${day.value}`}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Slot
          </Button>
        )}
      </div>
    </div>
  );
}

export function ScheduleEditor({ schedule, onChange, readonly }: ScheduleEditorProps) {
  const handleDayToggle = (day: number) => {
    const daySchedule = schedule.weeklySchedule[day] || { enabled: false, slots: [] };
    const newSlots = !daySchedule.enabled ? [{ startTime: "09:00", endTime: "17:00" }] : [];
    onChange({
      ...schedule,
      weeklySchedule: {
        ...schedule.weeklySchedule,
        [day]: {
          ...daySchedule,
          enabled: !daySchedule.enabled,
          slots: newSlots,
        },
      },
    });
  };

  const handleAddSlot = (day: number) => {
    const daySchedule = schedule.weeklySchedule[day] || { enabled: true, slots: [] };
    onChange({
      ...schedule,
      weeklySchedule: {
        ...schedule.weeklySchedule,
        [day]: {
          ...daySchedule,
          slots: [...daySchedule.slots, { startTime: "09:00", endTime: "17:00" }],
        },
      },
    });
  };

  const handleRemoveSlot = (day: number, slotIndex: number) => {
    const daySchedule = schedule.weeklySchedule[day];
    if (!daySchedule) return;
    
    onChange({
      ...schedule,
      weeklySchedule: {
        ...schedule.weeklySchedule,
        [day]: {
          ...daySchedule,
          slots: daySchedule.slots.filter((_, i) => i !== slotIndex),
        },
      },
    });
  };

  const handleUpdateSlot = (day: number, slotIndex: number, slot: TimeSlot) => {
    const daySchedule = schedule.weeklySchedule[day];
    if (!daySchedule) return;
    
    const newSlots = [...daySchedule.slots];
    newSlots[slotIndex] = slot;
    
    onChange({
      ...schedule,
      weeklySchedule: {
        ...schedule.weeklySchedule,
        [day]: {
          ...daySchedule,
          slots: newSlots,
        },
      },
    });
  };

  const activeDays = DAYS_OF_WEEK.filter(d => schedule.weeklySchedule[d.value]?.enabled).length;
  const totalHours = Object.values(schedule.weeklySchedule).reduce((total: number, day: DaySchedule) => {
    if (!day.enabled) return total;
    return total + day.slots.reduce((slotTotal: number, slot: TimeSlot) => {
      const start = slot.startTime.split(":").map(Number);
      const end = slot.endTime.split(":").map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];
      return slotTotal + Math.max(0, (endMinutes - startMinutes) / 60);
    }, 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="maxAttempts">Maximum Attempts per Contact</Label>
          <Input
            id="maxAttempts"
            type="number"
            min={1}
            max={20}
            value={schedule.maxAttemptsPerContact}
            onChange={(e) => onChange({ ...schedule, maxAttemptsPerContact: parseInt(e.target.value) || 1 })}
            disabled={readonly}
            data-testid="input-max-attempts"
          />
          <p className="text-xs text-muted-foreground">
            Stop trying to contact after this many attempts
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="minHours">Minimum Hours Between Attempts</Label>
          <Input
            id="minHours"
            type="number"
            min={1}
            max={168}
            value={schedule.minHoursBetweenAttempts}
            onChange={(e) => onChange({ ...schedule, minHoursBetweenAttempts: parseInt(e.target.value) || 1 })}
            disabled={readonly}
            data-testid="input-min-hours"
          />
          <p className="text-xs text-muted-foreground">
            Wait at least this many hours before trying again
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-base">Working Hours</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{activeDays} days active</Badge>
              <Badge variant="outline">{totalHours.toFixed(1)} hrs/week</Badge>
            </div>
          </div>
          <CardDescription>
            Configure when operators can make calls for this campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          {DAYS_OF_WEEK.map((day) => (
            <DayRow
              key={day.value}
              day={day}
              schedule={schedule.weeklySchedule[day.value] || { enabled: false, slots: [] }}
              onToggle={() => handleDayToggle(day.value)}
              onAddSlot={() => handleAddSlot(day.value)}
              onRemoveSlot={(index) => handleRemoveSlot(day.value, index)}
              onUpdateSlot={(index, slot) => handleUpdateSlot(day.value, index, slot)}
              readonly={readonly}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
