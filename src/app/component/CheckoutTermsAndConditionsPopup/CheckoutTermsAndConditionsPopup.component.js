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

import PropTypes from 'prop-types';
import Popup from 'Component/Popup';
import './CheckoutTermsAndConditionsPopup.style';
import Html from 'Component/Html';

export const TERMS_AND_CONDITIONS_POPUP_ID = 'CheckoutTermsAndConditionsPopup';

/** @namespace Component/CheckoutTermsAndConditionsPopup/Component */
export class CheckoutTermsAndConditionsPopup extends ExtensiblePureComponent {
    static propTypes = {
        payload: PropTypes.shape({
            text: PropTypes.string
        }).isRequired
    };

    renderContent() {
        const { payload: { text = 'No text was passed' } } = this.props;
        return (
            <Html content={ text } />
        );
    }

    render() {
        return (
            <Popup
              id={ TERMS_AND_CONDITIONS_POPUP_ID }
              clickOutside={ false }
              mix={ { block: 'CheckoutTermsAndConditionsPopup' } }
            >
                { this.renderContent() }
            </Popup>
        );
    }
}

export default CheckoutTermsAndConditionsPopup;
