import { getOwners } from "@/app/actions/owners"
import { getZoneAreas } from "@/app/actions/zone-areas"
import { getInternetConnectionTypes } from "@/app/actions/internet-connections"
import { NewLoftFormWrapper } from './new-loft-form'
import { getTranslations } from "next-intl/server"

export default async function NewLoftPage() {
  try {
    const [owners, zoneAreas, tLofts, tCommon, internetConnectionResult] = await Promise.all([
      getOwners(),
      getZoneAreas(),
      getTranslations('lofts'),
      getTranslations('common'),
      getInternetConnectionTypes().catch(() => ({ data: [], error: null }))
    ])
    const internetConnectionTypes = internetConnectionResult?.data || []

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            {tLofts('createNewLoft')}
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            {tLofts('addNewPropertyListing')}
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <NewLoftFormWrapper
            owners={owners}
            zoneAreas={zoneAreas}
            internetConnectionTypes={internetConnectionTypes}
            translations={{
              loftCreatedSuccess: tLofts('loftCreatedSuccess'),
              loftCreatedSuccessDescription: tLofts('loftCreatedSuccessDescription'),
              errorCreatingLoft: tLofts('errorCreatingLoft'),
              errorCreatingLoftDescription: tLofts('errorCreatingLoftDescription'),
              systemError: tCommon('systemError'),
              systemErrorDescription: tCommon('systemErrorDescription'),
            }}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in NewLoftPage:', error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Page</h1>
          <p className="text-gray-600 mt-2">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }
}
