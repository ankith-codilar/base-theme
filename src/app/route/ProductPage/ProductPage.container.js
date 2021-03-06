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
import { withRouter } from 'react-router';

import history from 'Util/History';
import { PDP } from 'Component/Header';
import { MetaDispatcher } from 'Store/Meta';
import { getVariantIndex } from 'Util/Product';
import { ProductType } from 'Type/ProductList';
import { ProductDispatcher } from 'Store/Product';
import { changeNavigationState } from 'Store/Navigation';
import { BreadcrumbsDispatcher } from 'Store/Breadcrumbs';
import { LinkedProductsDispatcher } from 'Store/LinkedProducts';
import { setBigOfflineNotice } from 'Store/Offline';
import { LocationType, HistoryType, MatchType } from 'Type/Common';
import { MENU_TAB } from 'Component/NavigationTabs/NavigationTabs.component';
import { TOP_NAVIGATION_TYPE, BOTTOM_NAVIGATION_TYPE } from 'Store/Navigation/Navigation.reducer';
import {
    getUrlParam,
    convertQueryStringToKeyValuePairs,
    updateQueryParamWithoutHistory,
    removeQueryParamWithoutHistory,
    objectToUri
} from 'Util/Url';

import ProductPage from './ProductPage.component';

/** @namespace Route/ProductPage/Container/mapStateToProps */
export const mapStateToProps = state => ({
    isOffline: state.OfflineReducer.isOffline,
    product: state.ProductReducer.product
});

/** @namespace Route/ProductPage/Container/mapDispatchToProps */
export const mapDispatchToProps = dispatch => ({
    changeHeaderState: state => dispatch(changeNavigationState(TOP_NAVIGATION_TYPE, state)),
    changeNavigationState: state => dispatch(changeNavigationState(BOTTOM_NAVIGATION_TYPE, state)),
    requestProduct: (options) => {
        ProductDispatcher.handleData(dispatch, options);
        LinkedProductsDispatcher.clearLinkedProducts(dispatch);
    },
    setBigOfflineNotice: isBig => dispatch(setBigOfflineNotice(isBig)),
    updateBreadcrumbs: breadcrumbs => BreadcrumbsDispatcher.updateWithProduct(breadcrumbs, dispatch),
    updateMetaFromProduct: product => MetaDispatcher.updateWithProduct(product, dispatch)
});

/** @namespace Route/ProductPage/Container */
export class ProductPageContainer extends ExtensiblePureComponent {
    state = {
        configurableVariantIndex: -1,
        parameters: {},
        customizableOptionsData: {}
    };

    containerFunctions = {
        updateConfigurableVariant: this.updateConfigurableVariant.bind(this),
        getLink: this.getLink.bind(this),
        getSelectedCustomizableOptions: this.getSelectedCustomizableOptions.bind(this)
    };

    static propTypes = {
        location: LocationType,
        isOnlyPlaceholder: PropTypes.bool,
        changeHeaderState: PropTypes.func.isRequired,
        setBigOfflineNotice: PropTypes.func.isRequired,
        changeNavigationState: PropTypes.func.isRequired,
        updateMetaFromProduct: PropTypes.func.isRequired,
        updateBreadcrumbs: PropTypes.func.isRequired,
        requestProduct: PropTypes.func.isRequired,
        isOffline: PropTypes.bool.isRequired,
        productSKU: PropTypes.string,
        product: ProductType.isRequired,
        history: HistoryType.isRequired,
        match: MatchType.isRequired
    };

    static defaultProps = {
        location: { state: {} },
        isOnlyPlaceholder: false,
        productSKU: ''
    };

    static getDerivedStateFromProps(props) {
        const {
            product: {
                variants,
                configurable_options
            },
            location: { search }
        } = props;

        if (!configurable_options && !variants) {
            return null;
        }

        const parameters = Object.entries(convertQueryStringToKeyValuePairs(search))
            .reduce((acc, [key, value]) => {
                if (key in configurable_options) {
                    return { ...acc, [key]: value };
                }

                return acc;
            }, {});

        if (Object.keys(parameters).length !== Object.keys(configurable_options).length) {
            return { parameters };
        }

        const configurableVariantIndex = getVariantIndex(variants, parameters);
        return { parameters, configurableVariantIndex };
    }

    componentDidMount() {
        const {
            location: { pathname },
            history
        } = this.props;

        if (pathname === '/product' || pathname === '/product/') {
            history.push('/');
            return;
        }

        this._requestProduct();
        this._onProductUpdate();
    }

    componentDidUpdate(prevProps) {
        const {
            location: { pathname },
            product: { id, options },
            productSKU,
            isOnlyPlaceholder
        } = this.props;

        const {
            location: { pathname: prevPathname },
            product: {
                id: prevId,
                options: prevOptions
            },
            productSKU: prevProductSKU,
            isOnlyPlaceholder: prevIsOnlyPlaceholder
        } = prevProps;

        if (
            pathname !== prevPathname
            || isOnlyPlaceholder !== prevIsOnlyPlaceholder
            || productSKU !== prevProductSKU
        ) {
            this._requestProduct();
        }

        if (JSON.stringify(options) !== JSON.stringify(prevOptions)) {
            this.getRequiredCustomizableOptions(options);
        }

        if (id !== prevId) {
            const dataSource = this._getDataSource();
            const { updateMetaFromProduct } = this.props;

            updateMetaFromProduct(dataSource);
        }

        this._onProductUpdate();
    }

    getLink(key, value) {
        const { location: { search, pathname } } = this.props;
        const obj = {
            ...convertQueryStringToKeyValuePairs(search)
        };

        if (key) {
            obj[key] = value;
        }

        const query = objectToUri(obj);

        return `${pathname}${query}`;
    }

    getRequiredCustomizableOptions(options) {
        const { customizableOptionsData } = this.state;

        if (!options) {
            return [];
        }

        const requiredCustomizableOptions = options.reduce((acc, { option_id, required }) => {
            if (required) {
                acc.push(option_id);
            }

            return acc;
        }, []);

        return this.setState({
            customizableOptionsData:
                { ...customizableOptionsData, requiredCustomizableOptions }
        });
    }

    getSelectedCustomizableOptions(values, updateArray = false) {
        const { customizableOptionsData } = this.state;

        if (updateArray) {
            this.setState({
                customizableOptionsData:
                    { ...customizableOptionsData, customizableOptionsMulti: values }
            });
        } else {
            this.setState({
                customizableOptionsData:
                    { ...customizableOptionsData, customizableOptions: values }
            });
        }
    }

    getIsConfigurableParameterSelected(parameters, key, value) {
        return Object.hasOwnProperty.call(parameters, key) && parameters[key] === value;
    }

    getNewParameters(key, value) {
        const { parameters } = this.state;

        // If value is already selected, than we remove the key to achieve deselection
        if (this.getIsConfigurableParameterSelected(parameters, key, value)) {
            const { [key]: oldValue, ...newParameters } = parameters;

            return newParameters;
        }

        return {
            ...parameters,
            [key]: value.toString()
        };
    }

    containerProps = () => ({
        productOrVariant: this._getProductOrVariant(),
        dataSource: this._getDataSource(),
        areDetailsLoaded: this._getAreDetailsLoaded()
    });

    updateConfigurableVariant(key, value) {
        const parameters = this.getNewParameters(key, value);
        this.setState({ parameters });

        this.updateUrl(key, value, parameters);
        this.updateConfigurableVariantIndex(parameters);
    }

    updateUrl(key, value, parameters) {
        const { location, history } = this.props;

        const isParameterSelected = this.getIsConfigurableParameterSelected(parameters, key, value);

        if (isParameterSelected) {
            updateQueryParamWithoutHistory(key, value, history, location);
        } else {
            removeQueryParamWithoutHistory(key, history, location);
        }
    }

    updateConfigurableVariantIndex(parameters) {
        const { product: { variants, configurable_options } } = this.props;
        const { configurableVariantIndex } = this.state;

        const newIndex = Object.keys(parameters).length === Object.keys(configurable_options).length
            ? getVariantIndex(variants, parameters)
            // Not all parameters are selected yet, therefore variantIndex must be invalid
            : -1;

        if (configurableVariantIndex !== newIndex) {
            this.setState({ configurableVariantIndex: newIndex });
        }
    }

    _onProductUpdate() {
        const { isOffline, setBigOfflineNotice } = this.props;
        const dataSource = this._getDataSource();

        if (Object.keys(dataSource).length) {
            this._updateBreadcrumbs(dataSource);
            this._updateHeaderState(dataSource);
            this._updateNavigationState();

            if (isOffline) {
                setBigOfflineNotice(false);
            }
        } else if (isOffline) {
            setBigOfflineNotice(true);
        }
    }

    _getAreDetailsLoaded() {
        const { product } = this.props;
        const dataSource = this._getDataSource();
        return dataSource === product;
    }

    _getProductOrVariant() {
        const dataSource = this._getDataSource();
        const { variants } = dataSource;
        const currentVariantIndex = this._getConfigurableVariantIndex(variants);
        const variant = variants && variants[currentVariantIndex];

        return variant || dataSource;
    }

    _getConfigurableVariantIndex(variants) {
        const { configurableVariantIndex, parameters } = this.state;

        if (configurableVariantIndex >= 0) {
            return configurableVariantIndex;
        }
        if (variants) {
            return getVariantIndex(variants, parameters);
        }

        return -1;
    }

    _getDataSource() {
        const { product, location: { state } } = this.props;
        const productIsLoaded = Object.keys(product).length > 0;
        const locationStateExists = state && state.product && Object.keys(state.product).length > 0;

        // return nothing, if no product in url state and no loaded product
        if (!locationStateExists && !productIsLoaded) {
            return {};
        }

        // use product from props, if product is loaded and state does not exist, or state product is equal loaded product
        const useLoadedProduct = productIsLoaded && (
            (locationStateExists && (product.id === state.product.id))
            || !locationStateExists
        );

        return useLoadedProduct ? product : state.product;
    }

    _getProductRequestFilter() {
        const {
            location,
            match,
            productSKU
        } = this.props;

        if (productSKU) {
            return {
                productsSkuArray: [productSKU]
            };
        }

        return {
            productUrlPath: getUrlParam(match, location)
        };
    }

    _requestProduct() {
        const {
            requestProduct,
            isOnlyPlaceholder
        } = this.props;

        if (isOnlyPlaceholder) {
            return; // ignore placeholder requests
        }

        const options = {
            isSingleProduct: true,
            args: { filter: this._getProductRequestFilter() }
        };

        requestProduct(options);
    }

    _updateNavigationState() {
        const { changeNavigationState } = this.props;
        changeNavigationState({ name: MENU_TAB });
    }

    _updateHeaderState({ name: title }) {
        const { changeHeaderState } = this.props;

        changeHeaderState({
            name: PDP,
            title,
            onBackClick: () => history.goBack()
        });
    }

    _updateBreadcrumbs(dataSource) {
        const { updateBreadcrumbs } = this.props;
        updateBreadcrumbs(dataSource);
    }

    render() {
        return (
            <ProductPage
              { ...this.props }
              { ...this.state }
              { ...this.containerFunctions }
              { ...this.containerProps() }
            />
        );
    }
}

export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(ProductPageContainer)
);
