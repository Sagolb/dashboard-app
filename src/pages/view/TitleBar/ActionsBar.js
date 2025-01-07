import { OfflineTooltip } from '@dhis2/analytics'
import { useAlert, useDhis2ConnectionStatus } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    FlyoutMenu,
    colors,
    IconMore16,
    SharingDialog,
} from '@dhis2/ui'
import PropTypes from 'prop-types'
import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Link, Redirect } from 'react-router-dom'
import { acClearItemFilters } from '../../../actions/itemFilters.js'
import { acSetShowDescription } from '../../../actions/showDescription.js'
import { apiPostShowDescription } from '../../../api/description.js'
import ConfirmActionDialog from '../../../components/ConfirmActionDialog.js'
import DropdownButton from '../../../components/DropdownButton/DropdownButton.js'
import MenuItem from '../../../components/MenuItemWithTooltip.js'
import { useCacheableSection } from '../../../modules/useCacheableSection.js'
import { orObject } from '../../../modules/util.js'
import { sGetNamedItemFilters } from '../../../reducers/itemFilters.js'
import { sGetSelected } from '../../../reducers/selected.js'
import { sGetShowDescription } from '../../../reducers/showDescription.js'
import { ROUTE_START_PATH } from '../../start/index.js'
import FilterSelector from './FilterSelector.js'
import classes from './styles/ActionsBar.module.css'

const ViewActions = ({
    id,
    access,
    showDescription,
    starred,
    onToggleStarredDashboard,
    updateShowDescription,
    removeAllFilters,
    restrictFilters,
    allowedFilters,
    filtersLength,
}) => {
    const [moreOptionsSmallIsOpen, setMoreOptionsSmallIsOpen] = useState(false)
    const [moreOptionsIsOpen, setMoreOptionsIsOpen] = useState(false)
    const [sharingDialogIsOpen, setSharingDialogIsOpen] = useState(false)
    const [confirmCacheDialogIsOpen, setConfirmCacheDialogIsOpen] =
        useState(false)
    const [redirectUrl, setRedirectUrl] = useState(null)
    const { isDisconnected: offline } = useDhis2ConnectionStatus()
    const { lastUpdated, isCached, startRecording, remove } =
        useCacheableSection(id)

    const { show } = useAlert(
        ({ msg }) => msg,
        ({ isCritical }) =>
            isCritical ? { critical: true } : { warning: true }
    )

    const toggleMoreOptions = (small) =>
        small
            ? setMoreOptionsSmallIsOpen(!moreOptionsSmallIsOpen)
            : setMoreOptionsIsOpen(!moreOptionsIsOpen)

    const closeMoreOptions = () => {
        setMoreOptionsSmallIsOpen(false)
        setMoreOptionsIsOpen(false)
    }

    if (redirectUrl) {
        return <Redirect to={redirectUrl} />
    }

    const onRecordError = () => {
        show({
            msg: i18n.t(
                "The dashboard couldn't be made available offline. Try again."
            ),
            isCritical: true,
        })
    }

    const onCacheDashboardConfirmed = () => {
        setConfirmCacheDialogIsOpen(false)
        removeAllFilters()
        startRecording({
            onError: onRecordError,
        })
    }

    const onRemoveFromOffline = () => {
        closeMoreOptions()
        lastUpdated && remove()
    }

    const onAddToOffline = () => {
        closeMoreOptions()
        return filtersLength
            ? setConfirmCacheDialogIsOpen(true)
            : startRecording({
                  onError: onRecordError,
              })
    }

    const onToggleShowDescription = () => {
        updateShowDescription(!showDescription)
        closeMoreOptions()
        !offline && apiPostShowDescription(!showDescription)
    }

    const onToggleSharingDialog = () =>
        setSharingDialogIsOpen(!sharingDialogIsOpen)

    const userAccess = orObject(access)

    const getMoreMenu = () => (
        <FlyoutMenu>
            {lastUpdated ? (
                <MenuItem
                    dense
                    disabledWhenOffline={false}
                    label={i18n.t('Remove from offline storage')}
                    onClick={onRemoveFromOffline}
                />
            ) : (
                <MenuItem
                    dense
                    disabled={offline}
                    label={i18n.t('Make available offline')}
                    onClick={onAddToOffline}
                />
            )}
            {lastUpdated && (
                <MenuItem
                    dense
                    label={i18n.t('Sync offline data now')}
                    disabled={offline}
                    onClick={onAddToOffline}
                />
            )}
            <MenuItem
                dense
                disabled={offline}
                label={
                    starred
                        ? i18n.t('Unstar dashboard')
                        : i18n.t('Star dashboard')
                }
                onClick={() => onToggleStarredDashboard(closeMoreOptions)}
            />
            <MenuItem
                dense
                disabledWhenOffline={false}
                label={
                    showDescription
                        ? i18n.t('Hide description')
                        : i18n.t('Show description')
                }
                onClick={onToggleShowDescription}
            />
            <MenuItem
                dense
                disabled={offline && !isCached}
                disabledWhenOffline={false}
                label={i18n.t('Print')}
                dataTest="print-menu-item"
            >
                <MenuItem
                    dense
                    disabled={offline && !isCached}
                    disabledWhenOffline={false}
                    label={i18n.t('Dashboard layout')}
                    onClick={() => setRedirectUrl(`${id}/printlayout`)}
                    dataTest="print-layout-menu-item"
                />
                <MenuItem
                    dense
                    disabled={offline && !isCached}
                    disabledWhenOffline={false}
                    label={i18n.t('One item per page')}
                    onClick={() => setRedirectUrl(`${id}/printoipp`)}
                    dataTest="print-oipp-menu-item"
                />
            </MenuItem>
            <Link to={ROUTE_START_PATH} className={classes.link}>
                <MenuItem
                    dense
                    disabledWhenOffline={false}
                    label={i18n.t('Close dashboard')}
                />
            </Link>
        </FlyoutMenu>
    )

    const getMoreButton = (className, useSmall) => (
        <DropdownButton
            className={className}
            small
            secondary
            open={useSmall ? moreOptionsSmallIsOpen : moreOptionsIsOpen}
            disabledWhenOffline={false}
            onClick={() => toggleMoreOptions(useSmall)}
            icon={<IconMore16 color={colors.grey700} />}
            component={getMoreMenu()}
        >
            {i18n.t('More')}
        </DropdownButton>
    )

    return (
        <>
            <div className={classes.actions}>
                <div className={classes.strip}>
                    {userAccess.update ? (
                        <OfflineTooltip>
                            <Button
                                small
                                secondary
                                disabled={offline}
                                className={classes.editButton}
                                onClick={() => setRedirectUrl(`${id}/edit`)}
                            >
                                {i18n.t('Edit')}
                            </Button>
                        </OfflineTooltip>
                    ) : null}
                    {userAccess.manage ? (
                        <OfflineTooltip>
                            <Button
                                small
                                secondary
                                disabled={offline}
                                className={classes.shareButton}
                                onClick={onToggleSharingDialog}
                            >
                                {i18n.t('Share')}
                            </Button>
                        </OfflineTooltip>
                    ) : null}
                    <FilterSelector
                        allowedFilters={allowedFilters}
                        restrictFilters={restrictFilters}
                    />
                    {getMoreButton(classes.moreButton, false)}
                    {getMoreButton(classes.moreButtonSmall, true)}
                </div>
            </div>
            {id && sharingDialogIsOpen && (
                <SharingDialog
                    id={id}
                    type="dashboard"
                    onClose={onToggleSharingDialog}
                />
            )}
            <ConfirmActionDialog
                title={i18n.t('Clear dashboard filters?')}
                message={i18n.t(
                    "A dashboard's filters can’t be saved offline. Do you want to remove the filters and make this dashboard available offline?"
                )}
                cancelLabel={i18n.t('No, cancel')}
                confirmLabel={i18n.t('Yes, clear filters and sync')}
                onConfirm={onCacheDashboardConfirmed}
                onCancel={() => setConfirmCacheDialogIsOpen(false)}
                open={confirmCacheDialogIsOpen}
            />
        </>
    )
}

ViewActions.propTypes = {
    onToggleStarredDashboard: PropTypes.func.isRequired,
    access: PropTypes.object,
    allowedFilters: PropTypes.array,
    filtersLength: PropTypes.number,
    id: PropTypes.string,
    removeAllFilters: PropTypes.func,
    restrictFilters: PropTypes.bool,
    showDescription: PropTypes.bool,
    starred: PropTypes.bool,
    updateShowDescription: PropTypes.func,
}

const mapStateToProps = (state) => {
    const dashboard = sGetSelected(state)

    return {
        ...dashboard,
        filtersLength: sGetNamedItemFilters(state).length,
        showDescription: sGetShowDescription(state),
    }
}

export default connect(mapStateToProps, {
    removeAllFilters: acClearItemFilters,
    updateShowDescription: acSetShowDescription,
})(ViewActions)
