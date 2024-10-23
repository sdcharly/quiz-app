import { useAuthStore } from '@/store/auth';
import { LogOut, User } from 'lucide-react';
import { Button } from '../ui/Button';

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900">AI Quiz Platform</h1>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700">{user.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}