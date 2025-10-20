import Link from 'next/link'
import { 
  FileText, 
  Building, 
  Briefcase, 
  PenTool, 
  Settings,
  Plus,
  Eye,
  BarChart3
} from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { 
  getAllPages, 
  getAllProperties, 
  getAllServices, 
  getAllBlogPosts 
} from '@/lib/sanity-queries'

export const dynamic = 'force-dynamic'

async function getContentStats() {
  try {
    const [pages, properties, services, blogPosts] = await Promise.all([
      getAllPages(),
      getAllProperties({ limit: 100 }),
      getAllServices(),
      getAllBlogPosts({ limit: 100 })
    ])

    return {
      pages: pages.length,
      properties: properties.total,
      services: services.length,
      blogPosts: blogPosts.total
    }
  } catch (error) {
    console.error('Error fetching content stats:', error)
    return {
      pages: 0,
      properties: 0,
      services: 0,
      blogPosts: 0
    }
  }
}

const quickActions = [
  {
    name: 'Add New Page',
    href: '/studio/structure/page',
    icon: FileText,
    description: 'Create a new page'
  },
  {
    name: 'Add Property',
    href: '/studio/structure/property',
    icon: Building,
    description: 'Add a new property to showcase'
  },
  {
    name: 'Add Service',
    href: '/studio/structure/service',
    icon: Briefcase,
    description: 'Create a new service offering'
  },
  {
    name: 'Write Blog Post',
    href: '/studio/structure/blogPost',
    icon: PenTool,
    description: 'Publish a new blog post'
  },
  {
    name: 'Site Settings',
    href: '/studio/structure/siteSettings',
    icon: Settings,
    description: 'Update site configuration'
  }
]

export default async function AdminDashboard() {
  const stats = await getContentStats()

  const contentStats = [
    {
      name: 'Pages',
      count: stats.pages,
      icon: FileText,
      href: '/admin/pages',
      color: 'bg-blue-500'
    },
    {
      name: 'Properties',
      count: stats.properties,
      icon: Building,
      href: '/admin/properties',
      color: 'bg-green-500'
    },
    {
      name: 'Services',
      count: stats.services,
      icon: Briefcase,
      href: '/admin/services',
      color: 'bg-purple-500'
    },
    {
      name: 'Blog Posts',
      count: stats.blogPosts,
      icon: PenTool,
      href: '/admin/blog',
      color: 'bg-orange-500'
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome to the Loft Algérie content management system
          </p>
        </div>

        {/* Content Statistics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {contentStats.map((stat) => (
            <Link
              key={stat.name}
              href={stat.href}
              className="group relative overflow-hidden rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`rounded-md p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.count}</p>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent group-hover:via-gray-300 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                target="_blank"
                className="group relative rounded-lg border border-gray-200 bg-white p-6 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center">
                  <div className="rounded-md bg-gray-100 p-2 group-hover:bg-gray-200 transition-colors">
                    <action.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900">{action.name}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
                <Plus className="absolute top-4 right-4 h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
            <div className="flex items-start">
              <BarChart3 className="h-6 w-6 text-blue-600 mt-1" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-blue-900">Content Management Tips</h3>
                <div className="mt-2 text-sm text-blue-700 space-y-2">
                  <p>• Use the Sanity Studio for detailed content editing and media management</p>
                  <p>• All content supports French, English, and Arabic translations</p>
                  <p>• Images are automatically optimized for web performance</p>
                  <p>• Preview your changes before publishing to the live site</p>
                </div>
                <div className="mt-4 flex space-x-4">
                  <Link
                    href="/studio"
                    target="_blank"
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    Open Sanity Studio
                  </Link>
                  <Link
                    href="/"
                    target="_blank"
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    View Live Site
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}