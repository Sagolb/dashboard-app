import { FILTER_ORG_UNIT, FILTER_PE } from '../../../actions/itemFilters.js'
import { getPluginOverrides } from '../../../modules/localStorage.js'

export const getIframeSrc = (item, itemFilters, appDetails = {}) => {
    if (appDetails.appType === 'APP') {
        // pluginOverrides might be in use during development on localhost
        const pluginOverrides = getPluginOverrides()

        if (pluginOverrides?.[appDetails.key]) {
            return pluginOverrides[appDetails.key]
        }

        return appDetails.pluginLaunchUrl
    } else {
        let iframeSrc = `${appDetails.launchUrl}?redirect=false&dashboardItemId=${item.id}`

        if (itemFilters[FILTER_ORG_UNIT]?.length) {
            const ouIds = itemFilters[FILTER_ORG_UNIT].map(({ id, path }) =>
                path ? path.split('/').slice(-1)[0] : id
            )
            iframeSrc += `&userOrgUnit=${ouIds.join(',')}`
        }

        if (itemFilters[FILTER_PE]?.length) {
            const peValues = itemFilters[FILTER_PE].map((x) => x.id).join(',')
            iframeSrc += `&period=${peValues}`
        }

        return iframeSrc
    }
}
