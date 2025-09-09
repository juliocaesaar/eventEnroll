import { Moon, Sun } from 'lucide-react';
import { Button } from './button';
import { useTheme } from '@/hooks/useTheme';

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 p-0"
      title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">
        Alternar para tema {theme === 'light' ? 'escuro' : 'claro'}
      </span>
    </Button>
  );
}
