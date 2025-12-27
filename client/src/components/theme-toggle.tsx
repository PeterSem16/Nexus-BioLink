import { Moon, Sun, Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme, COLOR_PALETTES } from "./theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, toggleTheme, colorPalette, setColorPalette } = useTheme();

  return (
    <div className="flex flex-wrap items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            data-testid="button-palette-picker"
          >
            <Palette className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Color Palette</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {COLOR_PALETTES.map((palette) => (
            <DropdownMenuItem
              key={palette.id}
              onClick={() => setColorPalette(palette.id)}
              className="flex items-center gap-2 cursor-pointer"
              data-testid={`palette-option-${palette.id}`}
            >
              <div
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: palette.color }}
              />
              <span className="flex-1">{palette.name}</span>
              {colorPalette === palette.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        data-testid="button-theme-toggle"
      >
        {theme === "light" ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
