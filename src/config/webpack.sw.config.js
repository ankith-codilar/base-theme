/* eslint-disable */
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

// TODO: merge Webpack config files

const path = require('path');
const MinifyPlugin = require('babel-minify-webpack-plugin');
const webpack = require('webpack');

const { getBabelConfig } = require('./babel.config');
const FallbackPlugin = require('./Extensibility/plugins/FallbackPlugin');

const projectRoot = path.resolve(__dirname, '..', '..');
const fallbackThemeSpecifier = path.relative(path.resolve(projectRoot, '../..'), projectRoot);
const { parentTheme = '' } = require(path.resolve(projectRoot, 'scandipwa.json'));
const magentoRoot = path.resolve(projectRoot, '..', '..', '..', '..', '..');
const parentRoot = parentTheme
    ? path.resolve(magentoRoot, 'app/design/frontend', parentTheme)
    : undefined;
const publicRoot = path.resolve(magentoRoot, 'pub');
const fallbackRoot = path.resolve(magentoRoot, 'vendor', 'scandipwa', 'source');

module.exports = (_, options) => {
    const isDevelopment = options.mode === 'development';

    const outputFilename = isDevelopment
        ? 'sw.js'
        : 'sw-compiled.js';

    const additionalOptions = isDevelopment
        ? { devtool: 'source-map' }
        : {};

    const additionalPlugins = isDevelopment
        ? []
        : [
            new MinifyPlugin({
                removeConsole: true,
                removeDebugger: true
            }, {
                comments: false
            })
        ];

    return {
        ...additionalOptions,

        resolve: {
            extensions: [
                '.js',
                '*'
            ],
            plugins: [
                new FallbackPlugin({
                    projectRoot,
                    fallbackRoot,
                    fallbackThemeSpecifier,
                    parentRoot,
                    parentThemeSpecifier: parentTheme
                })
            ]
        },

        resolveLoader: {
            modules: [
                'node_modules',
                path.resolve(__dirname, 'Extensibility', 'loaders')
            ]
        },

        cache: false,

        stats: {
            warnings: false
        },

        entry: [
            path.resolve(projectRoot, 'src', 'sw', 'index.js')
        ],

        module: {
            rules: [
                {
                    test: /\.(js)$/,
                    exclude: /(node_modules)/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: getBabelConfig({ projectRoot, magentoRoot, fallbackRoot, parentRoot })
                        }
                    ]
                },
                {
                    test: /util\/Extensions\/index-sw\.js/,
                    use: [
                        {
                            loader: 'extension-import-injector',
                            options: {
                                magentoRoot,
                                projectRoot,
                                importAggregator: 'extensions',
                                pathFilterCondition: path => !!path.match(/\/sw\/plugin\//)
                            }
                        }
                    ]
                }
            ]
        },

        output: {
            filename: outputFilename,
            publicPath: '/',
            pathinfo: true,
            path: publicRoot
        },

        plugins: [
            new webpack.ProvidePlugin({
                middleware: path.join(__dirname, 'Extensibility', 'Middleware'),
                ExtensibleClass: path.join(__dirname, 'Extensibility', 'ExtensibleClasses', 'ExtensibleClass')
            }),

            ...additionalPlugins
        ]
    };
};
