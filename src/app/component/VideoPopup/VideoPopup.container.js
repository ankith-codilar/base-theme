/**
 * ScandiPWA - Progressive Web App for Magento
 *
 * Copyright © Scandiweb, Inc. All rights reserved.
 * See LICENSE for license details.
 *
 * @license OSL-3.0 (Open Software License ("OSL") v. 3.0)
 * @package scandipwa/base-theme
 * @link https://github.com/scandipwa/base-theme
 */

import { connect } from 'react-redux';
import VideoPopup, { VIDEO_POPUP_ID } from './VideoPopup.component';

/** @namespace Component/VideoPopup/Container/mapStateToProps */
export const mapStateToProps = state => ({
    payload: state.PopupReducer.popupPayload[VIDEO_POPUP_ID] || {}
});

/** @namespace Component/VideoPopup/Container/mapDispatchToProps */
// eslint-disable-next-line no-unused-vars
export const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(VideoPopup);
