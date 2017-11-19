(function () {
    'use strict';

    /**
     * @param Base
     * @param {AssetsService} assetsService
     * @param {app.utils} utils
     * @returns {DexWachlist}
     */
    const controller = function (Base, assetsService, utils) {

        const TOP_ASSTS_LIST = [
            WavesApp.defaultAssets.WAVES,
            WavesApp.defaultAssets.BTC,
            'HzfaJp8YQWLvQG4FkUxq2Q7iYWMYQ2k8UF89vVJAjWPj',
            'ABFYQjwDHSct6rNk59k3snoZfAqNHVZdHz4VGJe2oCV5',
            '474jTeYx2r2Va35794tCScAXWJG9hU2HcgxzMowaZUnu',
            'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
            'DHgwrRvVyqJsepd32YbBqUeDH4GJ1N984X8QoekjgH8J',
            '4uK8i4ThRGbehENwa6MxyLtxAjAo1Rj9fduborGExarC',
            'HZk1mbfuJpmxU1Fs4AX5MWLVYtctsNcg6e2C6VKqK8zk',
            'GdnNbe6E3txF63gv3rxhpfxytTJtG7ZYyHAvWWrrEbK5',
            'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck',
            'K5JcgN8UdwNdh5sbdAuPMm5XEd5aFvoXaC3iHsHVz1d',
            '725Yv9oceWsB4GsYwyy4A52kEwyVrL5avubkeChSnL46',
            '8t8DMJFQu5GEhvAetiA8aHa3yPjxLj54sBnZsjnJ5dsw',
            '4eT6R8R2XuTcBuTHiXVQsh2dN2mg3c2Qnp95EWBNHygg',
            'BrjUWjndUanm5VsJkbUip8VRYy6LWJePtxya3FNv4TQa',
            '3SdrmU1GGZRiZz12MrMcfUz4JksTzvcU25cLFXpZy1qz',
            'FLbGXzrpqkvucZqsHDcNxePTkh2ChmEi4GdBfDRRJVof',
            '5ZPuAVxAwYvptbCgSVKdTzeud9dhbZ7vvxHVnZUoxf4h',
            'zMFqXuoyrn5w17PFurTqxB7GsS71fp9dfk6XFwxbPCy',
            'APz41KyoKuBBh8t3oZjqvhbbsg6f63tpZM5Ck5LYx6h'
        ];

        const assetsList = utils.whenAll(TOP_ASSTS_LIST.map((id) => {
            return utils.whenAll([
                assetsService.getAssetInfo(id),
                assetsService.getChange(id)
            ])
                .then(([info, change]) => {
                    return { ...info, change };
                });
        }));

        class DexWatchlist extends Base {

            get active() {
                return this._id === this._activeWatchListId;
            }

            constructor() {
                super();
                /**
                 * @type {Array}
                 */
                this.watchlist = null;
                /**
                 * @type {string}
                 */
                this.activeRowId = null;
                /**
                 * @type {string}
                 * @private
                 */
                this._id = null;
                /**
                 * @type {string}
                 * @private
                 */
                this._activeWatchListId = null;
                /**
                 * @type {string}
                 * @private
                 */
                this._baseAssetId = null;
                /**
                 * @type {DexBlock}
                 * @private
                 */
                this._parent = null;
                /**
                 * @type {string}
                 * @private
                 */
                this._amountAssetId = null;
                /**
                 * @type {string}
                 * @private
                 */
                this._priceAssetId = null;
            }

            $postLink() {
                if (!this._parent || !this._id) {
                    throw new Error('Wrong directive params!');
                }

                assetsList.then(() => {
                    this.observe('activeRowId', this._onChangeActiveRow);
                    this.observe('_baseAssetId', this._onChangeBaseAsset);
                    this.observe('_activeWatchListId', this._onChangeActiveWatchList);
                    this.syncSettings({
                        _amountAssetId: 'dex.amountAssetId',
                        _priceAssetId: 'dex.priceAssetId',
                        _baseAssetId: `dex.watchlist.${this._id}`,
                        _activeWatchListId: 'dex.watchlist.activeWatchListId'
                    })
                        .then(() => {
                            this._initRowId();
                        });
                });
            }

            _onChangeActiveWatchList() {
                if (this.active) {
                    this._activateAssets();
                } else {
                    this.activeRowId = null;
                }
            }

            _activateAssets() {
                this.activeRowId = this.activeRowId || this.watchlist[0].id;
                if (this._amountAssetId === this.activeRowId) {
                    this._priceAssetId = this._baseAssetId;
                } else {
                    this._amountAssetId = this._baseAssetId;
                }
            }

            _initRowId() {
                if (this.active) {
                    let id = null;
                    const ids = TOP_ASSTS_LIST.filter(tsUtils.notContains(this._baseAssetId));

                    [this._amountAssetId, this._priceAssetId].some((assetId) => {
                        const index = ids.indexOf(assetId);
                        if (index !== -1) {
                            id = assetId;
                        }
                        return id;
                    });

                    if (!id) {
                        id = ids[0];
                    }

                    this.activeRowId = id;
                }
            }

            _onChangeActiveRow() {
                if (!this.activeRowId) {
                    return null;
                }
                this._activeWatchListId = this._id;
                if (this._baseAssetId === this._priceAssetId) {
                    this._amountAssetId = this.activeRowId;
                } else {
                    this._priceAssetId = this.activeRowId;
                }
            }

            _onChangeBaseAsset() {
                assetsService.getAssetInfo(this._baseAssetId)
                    .then((asset) => {
                        this._parent.title = asset.name;
                    });
                assetsService.getMoney('1', this._baseAssetId)
                    .then((money) => {
                        this.baseMoney = money;
                    });
                assetsList.then((asstList) => {
                    this.watchlist = asstList.filter(tsUtils.notContains({ id: this._baseAssetId }));
                });
            }

        }

        return new DexWatchlist();
    };

    controller.$inject = ['Base', 'assetsService', 'utils'];

    angular.module('app.dex')
        .component('wDexWatchlist', {
            bindings: {
                _id: '@id'
            },
            require: {
                _parent: '^wDexBlock'
            },
            templateUrl: 'modules/dex/directives/dexWatchlist/watchlist.html',
            transclude: false,
            controller
        });
})();