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
import { connect } from 'react-redux';

import { updateMeta } from 'Store/Meta';
import { withRouter } from 'react-router-dom';
import { NoMatchDispatcher } from 'Store/NoMatch';
import NoMatchHandler from './NoMatchHandler.component';

/** @namespace Route/NoMatchHandler/Container/mapStateToProps */
export const mapStateToProps = state => ({
    noMatch: state.NoMatchReducer.noMatch
});

/** @namespace Route/NoMatchHandler/Container/mapDispatchToProps */
export const mapDispatchToProps = dispatch => ({
    updateMeta: meta => dispatch(updateMeta(meta)),
    updateNoMatch: (options) => {
        NoMatchDispatcher.updateNoMatch(dispatch, options);
    }
});

/** @namespace Route/NoMatchHandler/Container */
export class NoMatchHandlerContainer extends ExtensiblePureComponent {
    static propTypes = {
        updateMeta: PropTypes.func.isRequired,
        noMatch: PropTypes.bool.isRequired
    };

    componentDidUpdate(prevProps) {
        const { noMatch, updateMeta } = this.props;
        const { noMatch: prevNoMatch } = prevProps;

        if (noMatch !== prevNoMatch) {
            updateMeta({ title: __('Page not found') });
        }
    }

    render() {
        return (
            <NoMatchHandler
              { ...this.props }
            />
        );
    }
}

export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(NoMatchHandlerContainer)
);
