import { ResetPasswordPageClient } from "@/components/auth/reset-password-page-client"

export default function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  return <ResetPasswordPageClient params={params} />
}
