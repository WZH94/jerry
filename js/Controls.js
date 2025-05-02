const LControlDecrementButton = L.Control.extend({
  options: {
    position: "topleft",
  },
  initialize: function (container) {
    this._container = container;
  },
  update: function ({ years, yearIndex }) {
    if (yearIndex < 1) {
      this._ele.disabled = true;
    } else {
      this._ele.disabled = false;
    }
  },
  onAdd: function () {
    this._ele = L.DomUtil.create("button", "btnPrev", this._container);
    this._ele.innerHTML = "<";
    L.DomEvent.disableClickPropagation(this._ele);
    L.DomEvent.on(this._ele, "click", function () {
      decrementYear();
    });
    return this._ele;
  },
  onRemove: function () {},
});

const LControlIncrementButton = L.Control.extend({
  options: {
    position: "topleft",
  },
  initialize: function (container) {
    this._container = container;
  },
  update: function ({ years, yearIndex }) {
    if (yearIndex > years.length - 2) {
      this._ele.disabled = true;
    } else {
      this._ele.disabled = false;
    }
  },
  onAdd: function () {
    this._ele = L.DomUtil.create("button", "btnNext", this._container);
    this._ele.innerHTML = ">";
    L.DomEvent.disableClickPropagation(this._ele);
    L.DomEvent.on(this._ele, "click", function () {
      incrementYear();
    });
    return this._ele;
  },
  onRemove: function () {},
});

const LControlInfo = L.Control.extend({
  options: {
    position: "topleft",
  },
  initialize: function (container) {
    this._container = container;
  },
  update: function ({ years, yearIndex }) {
    this._ele.innerHTML = `${years[yearIndex]}`;
  },
  onAdd: function () {
    this._ele = L.DomUtil.create("span", "info", this._container);
    return this._ele;
  },
  onRemove: function () {},
});
