import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth"
import { TransactionReferenceAmounts } from "@/components/transactions/transaction-reference-amounts"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import Link from "next/link"
import { logger } from "@/lib/logger"
import { 
  trackSuccessfulRouting, 
  trackAuthenticationError,
  createRoutingContext 
} from "@/lib/utils/error-tracking"

type Props = {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "transactions" })

  return {
    title: t("referenceAmounts"),
    description: t("subtitle"),
  }
}

export default async function ReferenceAmountsPage({ params }: Props) {
  const { locale } = await params
  const routingContext = createRoutingContext('/transactions/reference-amounts', { locale });
  const startTime = Date.now();
  
  // Log route access attempt
  logger.info('Reference amounts page accessed', {
    category: 'routing',
    route: '/transactions/reference-amounts',
    locale: locale,
    timestamp: new Date().toISOString()
  });
  
  let session;
  try {
    // Server-side authentication check - requires admin or manager role
    session = await requireRole(["admin", "manager"])
    
    // Log successful authentication
    logger.info('Reference amounts access authenticated', {
      category: 'routing',
      route: '/transactions/reference-amounts',
      userId: session.user.id,
      userRole: session.user.role,
      locale: locale
    });
  } catch (error) {
    // Track authentication error
    trackAuthenticationError(
      'Access denied to reference amounts page',
      {
        requiredRoles: ["admin", "manager"],
        route: '/transactions/reference-amounts'
      }
    );
    
    // Re-throw to let Next.js handle the error
    throw error;
  }
  
  let t;
  try {
    t = await getTranslations({ locale, namespace: "transactions" })
  } catch (error) {
    // Log translation loading error
    logger.error('Failed to load translations for reference amounts page', error, {
      category: 'routing',
      route: '/transactions/reference-amounts',
      locale: locale,
      userId: session.user.id,
      operationFailed: 'translation_loading'
    });
    
    // Re-throw to let Next.js handle the error
    throw error;
  }
  
  const loadTime = Date.now() - startTime;
  
  // Track successful routing
  trackSuccessfulRouting(
    '/transactions/reference-amounts',
    {
      ...routingContext,
      userId: session.user.id,
      userRole: session.user.role
    },
    {
      loadTime: loadTime
    }
  );
  
  // Log successful page load
  logger.info('Reference amounts page loaded successfully', {
    category: 'routing',
    route: '/transactions/reference-amounts',
    userId: session.user.id,
    userRole: session.user.role,
    locale: locale,
    loadTime: loadTime
  });

  return (
    <div className="container mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/transactions">{t("title")}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("referenceAmounts")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("referenceAmountsTitle")}</h1>
        <p className="text-lg text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <TransactionReferenceAmounts />
    </div>
  )
}