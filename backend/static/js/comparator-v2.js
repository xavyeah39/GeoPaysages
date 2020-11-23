var geopsg = geopsg || {};
geopsg.comparator = (options) => {
  const maps = [];
  const modes = [{
    name: 'sidebyside',
    label: "Superposition"
  }, {
    name: 'split',
    label: "Côte à côte"
  }];
  let sbsCtrl;

  function computeItem(item) {
    if (!item) {
      return;
    }
    if (!(item.shot_on instanceof Date)) {
      if (item.shot_on.length <= 10) {
        item.shot_on += ' 00:00:00'
      }
      item.shot_on = new Date(item.shot_on);
    }
  };

  const defaultItems = [
    options.photos[0],
    options.photos[options.photos.length - 1]
  ];
  computeItem(defaultItems[0]);
  computeItem(defaultItems[1]);

  //TODO use format as an argument
  Vue.filter('dateFormat', (value) => {
    if (options.dbconf.comparator_date_format == 'year') {
    return value.toLocaleString('fr-FR', {
      year: 'numeric'
    });
    }
    if (options.dbconf.comparator_date_format == 'month') {
    return value.toLocaleString('fr-FR', {
      month: '2-digit',
      year: 'numeric'
    });
    }
    else {
    return value.toLocaleString('fr-FR', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  }
  });

  Vue.component('app-comparator-v2', {
    template: '#tpl-app-comparator-v2',
    data: () => {
      return {
        curMode: modes[0],
        modes: modes,
        photos: options.photos,
        comparedPhotos: [
          defaultItems[0],
          defaultItems[1]
        ]
      }
    },
    mounted() {
      this.initMaps();
    },
    methods: {
      initMaps() {
        maps.push(this.initMap(1));
        maps.push(this.initMap(2));

        maps[0].sync(maps[1]);
        maps[1].sync(maps[0]);

        // Init L.control.sideBySide
        maps[0].createPane('left');
        maps[0].createPane('right');

        this.updateLayers();
      },
      initMap(num) {
        const hasZoom = options.dbconf.comparator_zoom_control === undefined ? true : options.dbconf.comparator_zoom_control;
        const map = L.map(this.$refs['photo' + num], {
          crs: L.CRS.Simple,
          center: [0, 0],
          zoomControl: hasZoom,
          zoom: 1.5,
          zoomSnap: 0.25,
          minZoom: -5,
          gestureHandling: true
        });
        const side = num == 1 ? 'left' : 'right';
        const className = `leaflet-top leaflet-verticalcenter leaflet-${side}`;
        map._controlCorners['verticalcenterleft'] = L.DomUtil.create('div', className, map._controlContainer);
        if (hasZoom) {
          map.zoomControl.setPosition('verticalcenterleft');
        }
        map.attributionControl.setPrefix('');

        return map;
      },
      onBtnModeClick(selectedMode) {
        this.curMode = selectedMode;
        this.updateLayers();
      },
      onPhotoSelected(index, photo) {
        this.$set(this.comparedPhotos, index, photo);
        this.updateLayers();
      },
      updateLayers() {
        this.$bvModal.show('comparatorLoading');
        this.clearMaps();
        if (sbsCtrl) {
          maps[0].removeControl(sbsCtrl);
          sbsCtrl = null;
        }

        Promise.all([
          this.loadImg(this.comparedPhotos[0].filename),
          this.loadImg(this.comparedPhotos[1].filename)
        ])
          .then(imgs => {
            const layers = [];
            imgs.forEach((img, i) => {
              const ratio = img.height / img.width;
              const imgW = 256;
              const imgH = imgW * ratio;
              const overlay = L.imageOverlay(img.src, [[-imgH / 2, -imgW / 2], [imgH / 2, imgW / 2]]);
              layers.push(overlay);
            });

            if (this.curMode.name == 'split') {
              layers[0].addTo(maps[0]);
              layers[1].addTo(maps[1]);
            } else if (this.curMode.name == 'sidebyside') {
              layers[0].options.pane = 'left';
              layers[1].options.pane = 'right';
              layers[0].addTo(maps[0]);
              layers[1].addTo(maps[0]);
              sbsCtrl = L.control.sideBySide(layers[0], layers[1]).addTo(maps[0]);
            }
            this.resizeMaps();
            maps[0].fitBounds(maps[0].getBounds());
            this.$bvModal.hide('comparatorLoading');
          });
      },
      loadImg(filename) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = function() {
            resolve(this);
          };
          img.src = '/static/data/images/' + filename;
        });
      },
      clearMaps() {
        maps.forEach(map => {
          map.eachLayer((layer) => {
            map.removeLayer(layer);
          });
        });
      },
      resizeMaps() {
        maps.forEach(map => {
          map.eachLayer((layer) => {
            map.invalidateSize();
          });
        });
      }
    }
  });

  Vue.component('app-comparator-v2-selector', {
    template: '#tpl-app-comparator-v2-selector',
    props: ['items', 'selectedItem', 'right'],
    data: () => {
      if (options.dbconf.comparator_date_format == 'year') {
        return {
          dateFrom: null,
          dateTo: null,
          currentPage: 1,
          perPage: options.dbconf.comparator_date_items_per_page ?? 10,
          pageItems: [],
          nbFilteredItems: 0,
          steps: [{
            label: "1 an",
            value: 3600 * 24 * 365
          }],
          selectedStep: null
        }
      }
      if (options.dbconf.comparator_date_format == 'month') {
        return {
          dateFrom: null,
          dateTo: null,
          currentPage: 1,
          perPage: options.dbconf.comparator_date_items_per_page ?? 10,
          pageItems: [],
          nbFilteredItems: 0,
          steps: [{
            label: "1 mois",
            value: 3600 * 24 * 30
          }, {
            label: "1 an",
            value: 3600 * 24 * 365
          }],
          selectedStep: null
        }
      }
      else {
        return {
          dateFrom: null,
          dateTo: null,
          currentPage: 1,
          perPage: options.dbconf.comparator_date_items_per_page ?? 10,
          pageItems: [],
          nbFilteredItems: 0,
          steps: [{
            label: "0",
            value: 0
          }, {
            label: "1 jour",
            value: 3600 * 24
          }, {
            label: "1 semaine",
            value: 3600 * 24 * 7
          }, {
            label: "1 mois",
            value: 3600 * 24 * 30
          }, {
            label: "1 an",
            value: 3600 * 24 * 365
          }],
          selectedStep: null
        }
      }
    },
    beforeMount() {
      this.selectedStep = this.steps[0];
      this.filterItems();
      this.setPageItems();
    },
    watch: {
      dateFrom(val) {
        this.filterItems();
        this.currentPage = 1;
        this.setPageItems();
      },
      dateTo(val) {
        this.filterItems();
        this.currentPage = 1;
        this.setPageItems();
      },
      currentPage(val) {
        this.setPageItems();
      }
    },
    methods: {
      onStepClick(step) {
        this.selectedStep = step;
      },
      onPrevBtnClick() {
        const dateTo = new Date(this.selectedItem.shot_on);
        dateTo.setSeconds(dateTo.getSeconds() - (this.selectedStep.value || 1), 0);
        let itemIndex = this.searchDateToIndex(this.filteredItems, dateTo, 0, this.filteredItems.length - 1);
        if (itemIndex < 0) {
          itemIndex = this.filteredItems.length - 1;
        }
        this.setSelectedItem(this.filteredItems[itemIndex]);
      },
      onNextBtnClick() {
        const dateFrom = new Date(this.selectedItem.shot_on);
        console.log(this.selectedStep.value)
        dateFrom.setSeconds(dateFrom.getSeconds() + (this.selectedStep.value || 1), 0);
        let itemIndex = this.searchDateFromIndex(this.filteredItems, dateFrom, 0, this.filteredItems.length - 1);
        if (itemIndex < 0) {
          itemIndex = 0;
        }
        this.setSelectedItem(this.filteredItems[itemIndex]);
      },
      onItemClick(item) {
        this.setSelectedItem(item);
      },
      setSelectedItem(item) {
        this.$emit('item-selected', item);
      },
      setPageItems() {
        const pageIndex = this.currentPage - 1;
        const startIndex = pageIndex * this.perPage;
        this.pageItems = this.filteredItems.slice(startIndex, startIndex + this.perPage)
          .map(item => {
            computeItem(item);
            return item;
          });
      },
      filterItems() {
        let dateFrom = !this.dateFrom ? null : new Date(this.dateFrom);
        if (dateFrom) {
          dateFrom.setHours(0, 0, 0);
        }
        let dateTo = !this.dateTo ? null : new Date(this.dateTo);
        if (dateTo) {
          dateTo.setHours(23, 59, 59);
        }
        if (!dateFrom && !dateTo) {
          this.setFilteredItems([...this.items]);
          return;
        }
        let startIndex = 0;
        let endIndex = this.items.length - 1;
        if (dateFrom) {
          startIndex = this.searchDateFromIndex(this.items, dateFrom, 0, endIndex);
          if (startIndex < 0) {
            setFilteredItems([]);
            return;
          }
        }
        if (dateTo) {
          endIndex = this.searchDateToIndex(this.items, dateTo, startIndex, endIndex);
          if (endIndex < 0) {
            setFilteredItems([]);
            return;
          }
        }

        this.setFilteredItems(this.items.slice(startIndex, endIndex + 1).map(item => {
          computeItem(item);
          return item;
        }));
      },
      setFilteredItems(items) {
        this.filteredItems = items;
        this.nbFilteredItems = this.filteredItems.length;
      },
      searchDateFromIndex(items, dateFrom, startIndex, endIndex) {
        if (endIndex < startIndex) {
          return -1;
        }
        const middleIndex = Math.floor((startIndex + endIndex) / 2);
        const item = items[middleIndex];
        computeItem(item);
        const itemBefore = items[middleIndex - 1];
        computeItem(itemBefore);
        if (item.shot_on >= dateFrom && (!itemBefore || itemBefore.shot_on < dateFrom)) {
          return middleIndex;
        } else if (item.shot_on < dateFrom && endIndex > 0) {
          return this.searchDateFromIndex(items, dateFrom, middleIndex + 1, endIndex);
        } else if (endIndex > 0) {
          return this.searchDateFromIndex(items, dateFrom, 0, middleIndex);
        }
        return -1;
      },
      searchDateToIndex(items, dateTo, startIndex, endIndex) {
        if (endIndex < startIndex) {
          return -1;
        }
        const middleIndex = Math.floor((startIndex + endIndex) / 2);
        const item = items[middleIndex];
        computeItem(item);
        const itemAfter = items[middleIndex + 1];
        computeItem(itemAfter);
        if (item.shot_on <= dateTo && (!itemAfter || itemAfter.shot_on > dateTo)) {
          return middleIndex;
        } else if (item.shot_on > dateTo && endIndex > 0) {
          return this.searchDateToIndex(items, dateTo, 0, middleIndex - 1);
        } else if (endIndex > 0) {
          return this.searchDateToIndex(items, dateTo, middleIndex + 1, endIndex);
        }
        return -1;
      }
    }
  });
}
