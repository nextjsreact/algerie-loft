import { ThemeToggle } from '@/components/theme-toggle'

export default function TestNavigationPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Navigation Components</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Theme Toggle (migrated to next-intl)</h2>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}