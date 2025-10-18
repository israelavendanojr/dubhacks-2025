import {
  FlyToInterpolator,
  GlobeViewport,
  LinearInterpolator,
  View,
  Widget,
  applyStyles,
  deck_default,
  deepEqual,
  layer_default,
  log_default,
  web_mercator_viewport_default
} from "./chunk-TILS7YI4.js";
import {
  luma
} from "./chunk-A6XW3373.js";
import {
  require_react
} from "./chunk-HKWW6SXN.js";
import {
  __toESM
} from "./chunk-G3PMV62Z.js";

// ../frontend/node_modules/@deck.gl/react/dist/deckgl.js
var React2 = __toESM(require_react(), 1);
var import_react6 = __toESM(require_react(), 1);

// ../frontend/node_modules/@deck.gl/react/dist/utils/use-isomorphic-layout-effect.js
var import_react = __toESM(require_react(), 1);
var useIsomorphicLayoutEffect = typeof window !== "undefined" ? import_react.useLayoutEffect : import_react.useEffect;
var use_isomorphic_layout_effect_default = useIsomorphicLayoutEffect;

// ../frontend/node_modules/@deck.gl/react/dist/utils/extract-jsx-layers.js
var React = __toESM(require_react(), 1);
var import_react3 = __toESM(require_react(), 1);

// ../frontend/node_modules/@deck.gl/react/dist/utils/inherits-from.js
function inheritsFrom(Type, ParentType) {
  while (Type) {
    if (Type === ParentType) {
      return true;
    }
    Type = Object.getPrototypeOf(Type);
  }
  return false;
}

// ../frontend/node_modules/@deck.gl/react/dist/utils/evaluate-children.js
var import_react2 = __toESM(require_react(), 1);
var MAP_STYLE = { position: "absolute", zIndex: -1 };
function evaluateChildren(children, childProps) {
  if (typeof children === "function") {
    return children(childProps);
  }
  if (Array.isArray(children)) {
    return children.map((child) => evaluateChildren(child, childProps));
  }
  if (isComponent(children)) {
    if (isReactMap(children)) {
      childProps.style = MAP_STYLE;
      return (0, import_react2.cloneElement)(children, childProps);
    }
    if (needsDeckGLViewProps(children)) {
      return (0, import_react2.cloneElement)(children, childProps);
    }
  }
  return children;
}
function isComponent(child) {
  return child && typeof child === "object" && "type" in child || false;
}
function isReactMap(child) {
  return child.props?.mapStyle;
}
function needsDeckGLViewProps(child) {
  const componentClass = child.type;
  return componentClass && componentClass.deckGLViewProps;
}

// ../frontend/node_modules/@deck.gl/react/dist/utils/extract-jsx-layers.js
function wrapInView(node) {
  if (typeof node === "function") {
    return (0, import_react3.createElement)(View, {}, node);
  }
  if (Array.isArray(node)) {
    return node.map(wrapInView);
  }
  if (isComponent(node)) {
    if (node.type === React.Fragment) {
      return wrapInView(node.props.children);
    }
    if (inheritsFrom(node.type, View)) {
      return node;
    }
  }
  return node;
}
function extractJSXLayers({ children, layers = [], views = null }) {
  const reactChildren = [];
  const jsxLayers = [];
  const jsxViews = {};
  React.Children.forEach(wrapInView(children), (reactElement) => {
    if (isComponent(reactElement)) {
      const ElementType = reactElement.type;
      if (inheritsFrom(ElementType, layer_default)) {
        const layer = createLayer(ElementType, reactElement.props);
        jsxLayers.push(layer);
      } else {
        reactChildren.push(reactElement);
      }
      if (inheritsFrom(ElementType, View) && ElementType !== View && reactElement.props.id) {
        const view = new ElementType(reactElement.props);
        jsxViews[view.id] = view;
      }
    } else if (reactElement) {
      reactChildren.push(reactElement);
    }
  });
  if (Object.keys(jsxViews).length > 0) {
    if (Array.isArray(views)) {
      views.forEach((view) => {
        jsxViews[view.id] = view;
      });
    } else if (views) {
      jsxViews[views.id] = views;
    }
    views = Object.values(jsxViews);
  }
  layers = jsxLayers.length > 0 ? [...jsxLayers, ...layers] : layers;
  return { layers, children: reactChildren, views };
}
function createLayer(LayerType, reactProps) {
  const props = {};
  const defaultProps = LayerType.defaultProps || {};
  for (const key in reactProps) {
    if (defaultProps[key] !== reactProps[key]) {
      props[key] = reactProps[key];
    }
  }
  return new LayerType(props);
}

// ../frontend/node_modules/@deck.gl/react/dist/utils/position-children-under-views.js
var import_react5 = __toESM(require_react(), 1);

// ../frontend/node_modules/@deck.gl/react/dist/utils/deckgl-context.js
var import_react4 = __toESM(require_react(), 1);
var DeckGlContext = (0, import_react4.createContext)();

// ../frontend/node_modules/@deck.gl/react/dist/utils/position-children-under-views.js
function positionChildrenUnderViews({ children, deck, ContextProvider = DeckGlContext.Provider }) {
  const { viewManager } = deck || {};
  if (!viewManager || !viewManager.views.length) {
    return [];
  }
  const views = {};
  const defaultViewId = viewManager.views[0].id;
  for (const child of children) {
    let viewId = defaultViewId;
    let viewChildren = child;
    if (isComponent(child) && inheritsFrom(child.type, View)) {
      viewId = child.props.id || defaultViewId;
      viewChildren = child.props.children;
    }
    const viewport = viewManager.getViewport(viewId);
    const viewState = viewManager.getViewState(viewId);
    if (viewport) {
      viewState.padding = viewport.padding;
      const { x: x2, y: y3, width, height } = viewport;
      viewChildren = evaluateChildren(viewChildren, {
        x: x2,
        y: y3,
        width,
        height,
        viewport,
        viewState
      });
      if (!views[viewId]) {
        views[viewId] = {
          viewport,
          children: []
        };
      }
      views[viewId].children.push(viewChildren);
    }
  }
  return Object.keys(views).map((viewId) => {
    const { viewport, children: viewChildren } = views[viewId];
    const { x: x2, y: y3, width, height } = viewport;
    const style = {
      position: "absolute",
      left: x2,
      top: y3,
      width,
      height
    };
    const key = `view-${viewId}`;
    const viewElement = (0, import_react5.createElement)("div", { key, id: key, style }, ...viewChildren);
    const contextValue = {
      deck,
      viewport,
      // @ts-expect-error accessing protected property
      container: deck.canvas.offsetParent,
      // @ts-expect-error accessing protected property
      eventManager: deck.eventManager,
      onViewStateChange: (params) => {
        params.viewId = viewId;
        deck._onViewStateChange(params);
      },
      widgets: []
    };
    const providerKey = `view-${viewId}-context`;
    return (0, import_react5.createElement)(ContextProvider, { key: providerKey, value: contextValue }, viewElement);
  });
}

// ../frontend/node_modules/@deck.gl/react/dist/utils/extract-styles.js
var CANVAS_ONLY_STYLES = {
  mixBlendMode: null
};
function extractStyles({ width, height, style }) {
  const containerStyle = {
    position: "absolute",
    zIndex: 0,
    left: 0,
    top: 0,
    width,
    height
  };
  const canvasStyle = {
    left: 0,
    top: 0
  };
  if (style) {
    for (const key in style) {
      if (key in CANVAS_ONLY_STYLES) {
        canvasStyle[key] = style[key];
      } else {
        containerStyle[key] = style[key];
      }
    }
  }
  return { containerStyle, canvasStyle };
}

// ../frontend/node_modules/@deck.gl/react/dist/deckgl.js
function getRefHandles(thisRef) {
  return {
    get deck() {
      return thisRef.deck;
    },
    // The following method can only be called after ref is available, by which point deck is defined in useEffect
    pickObject: (opts) => thisRef.deck.pickObject(opts),
    pickMultipleObjects: (opts) => thisRef.deck.pickMultipleObjects(opts),
    pickObjects: (opts) => thisRef.deck.pickObjects(opts)
  };
}
function redrawDeck(thisRef) {
  if (thisRef.redrawReason) {
    thisRef.deck._drawLayers(thisRef.redrawReason);
    thisRef.redrawReason = null;
  }
}
function createDeckInstance(thisRef, DeckClass, props) {
  const deck = new DeckClass({
    ...props,
    // The Deck's animation loop is independent from React's render cycle, causing potential
    // synchronization issues. We provide this custom render function to make sure that React
    // and Deck update on the same schedule.
    // TODO(ibgreen) - Hack to enable WebGPU as it needs to render quickly to avoid CanvasContext texture from going stale
    _customRender: props.deviceProps?.adapters?.[0]?.type === "webgpu" ? void 0 : (redrawReason) => {
      thisRef.redrawReason = redrawReason;
      const viewports = deck.getViewports();
      if (thisRef.lastRenderedViewports !== viewports) {
        thisRef.forceUpdate();
      } else {
        redrawDeck(thisRef);
      }
    }
  });
  return deck;
}
function DeckGLWithRef(props, ref) {
  const [version, setVersion] = (0, import_react6.useState)(0);
  const _thisRef = (0, import_react6.useRef)({
    control: null,
    version,
    forceUpdate: () => setVersion((v3) => v3 + 1)
  });
  const thisRef = _thisRef.current;
  const containerRef = (0, import_react6.useRef)(null);
  const canvasRef = (0, import_react6.useRef)(null);
  const jsxProps = (0, import_react6.useMemo)(() => extractJSXLayers(props), [props.layers, props.views, props.children]);
  let inRender = true;
  const handleViewStateChange = (params) => {
    if (inRender && props.viewState) {
      thisRef.viewStateUpdateRequested = params;
      return null;
    }
    thisRef.viewStateUpdateRequested = null;
    return props.onViewStateChange?.(params);
  };
  const handleInteractionStateChange = (params) => {
    if (inRender) {
      thisRef.interactionStateUpdateRequested = params;
    } else {
      thisRef.interactionStateUpdateRequested = null;
      props.onInteractionStateChange?.(params);
    }
  };
  const deckProps = (0, import_react6.useMemo)(() => {
    const forwardProps = {
      widgets: [],
      ...props,
      // Override user styling props. We will set the canvas style in render()
      style: null,
      width: "100%",
      height: "100%",
      parent: containerRef.current,
      canvas: canvasRef.current,
      layers: jsxProps.layers,
      views: jsxProps.views,
      onViewStateChange: handleViewStateChange,
      onInteractionStateChange: handleInteractionStateChange
    };
    delete forwardProps._customRender;
    if (thisRef.deck) {
      thisRef.deck.setProps(forwardProps);
    }
    return forwardProps;
  }, [props]);
  (0, import_react6.useEffect)(() => {
    const DeckClass = props.Deck || deck_default;
    thisRef.deck = createDeckInstance(thisRef, DeckClass, {
      ...deckProps,
      parent: containerRef.current,
      canvas: canvasRef.current
    });
    return () => thisRef.deck?.finalize();
  }, []);
  use_isomorphic_layout_effect_default(() => {
    redrawDeck(thisRef);
    const { viewStateUpdateRequested, interactionStateUpdateRequested } = thisRef;
    if (viewStateUpdateRequested) {
      handleViewStateChange(viewStateUpdateRequested);
    }
    if (interactionStateUpdateRequested) {
      handleInteractionStateChange(interactionStateUpdateRequested);
    }
    if (thisRef.deck?.isInitialized) {
      thisRef.deck.redraw("Initial render");
    }
  });
  (0, import_react6.useImperativeHandle)(ref, () => getRefHandles(thisRef), []);
  const currentViewports = thisRef.deck && thisRef.deck.isInitialized ? thisRef.deck.getViewports() : void 0;
  const { ContextProvider, width = "100%", height = "100%", id, style } = props;
  const { containerStyle, canvasStyle } = (0, import_react6.useMemo)(() => extractStyles({ width, height, style }), [width, height, style]);
  if (!thisRef.viewStateUpdateRequested && thisRef.lastRenderedViewports === currentViewports || // case 2
  thisRef.version !== version) {
    thisRef.lastRenderedViewports = currentViewports;
    thisRef.version = version;
    const childrenUnderViews = positionChildrenUnderViews({
      children: jsxProps.children,
      deck: thisRef.deck,
      ContextProvider
    });
    const canvas = (0, import_react6.createElement)("canvas", {
      key: "canvas",
      id: id || "deckgl-overlay",
      ref: canvasRef,
      style: canvasStyle
    });
    thisRef.control = (0, import_react6.createElement)("div", { id: `${id || "deckgl"}-wrapper`, ref: containerRef, style: containerStyle }, [canvas, childrenUnderViews]);
  }
  inRender = false;
  return thisRef.control;
}
var DeckGL = React2.forwardRef(DeckGLWithRef);
var deckgl_default = DeckGL;

// ../frontend/node_modules/preact/dist/preact.module.js
var n;
var l;
var u;
var t;
var i;
var r;
var o;
var e;
var f;
var c;
var s;
var a;
var h;
var p = {};
var v = [];
var y = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
var w = Array.isArray;
function d(n2, l3) {
  for (var u4 in l3) n2[u4] = l3[u4];
  return n2;
}
function g(n2) {
  n2 && n2.parentNode && n2.parentNode.removeChild(n2);
}
function _(l3, u4, t3) {
  var i4, r3, o3, e3 = {};
  for (o3 in u4) "key" == o3 ? i4 = u4[o3] : "ref" == o3 ? r3 = u4[o3] : e3[o3] = u4[o3];
  if (arguments.length > 2 && (e3.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l3 && null != l3.defaultProps) for (o3 in l3.defaultProps) void 0 === e3[o3] && (e3[o3] = l3.defaultProps[o3]);
  return m(l3, e3, i4, r3, null);
}
function m(n2, t3, i4, r3, o3) {
  var e3 = { type: n2, props: t3, key: i4, ref: r3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o3 ? ++u : o3, __i: -1, __u: 0 };
  return null == o3 && null != l.vnode && l.vnode(e3), e3;
}
function k(n2) {
  return n2.children;
}
function x(n2, l3) {
  this.props = n2, this.context = l3;
}
function S(n2, l3) {
  if (null == l3) return n2.__ ? S(n2.__, n2.__i + 1) : null;
  for (var u4; l3 < n2.__k.length; l3++) if (null != (u4 = n2.__k[l3]) && null != u4.__e) return u4.__e;
  return "function" == typeof n2.type ? S(n2) : null;
}
function C(n2) {
  var l3, u4;
  if (null != (n2 = n2.__) && null != n2.__c) {
    for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++) if (null != (u4 = n2.__k[l3]) && null != u4.__e) {
      n2.__e = n2.__c.base = u4.__e;
      break;
    }
    return C(n2);
  }
}
function M(n2) {
  (!n2.__d && (n2.__d = true) && i.push(n2) && !$.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)($);
}
function $() {
  for (var n2, u4, t3, r3, o3, f4, c3, s3 = 1; i.length; ) i.length > s3 && i.sort(e), n2 = i.shift(), s3 = i.length, n2.__d && (t3 = void 0, r3 = void 0, o3 = (r3 = (u4 = n2).__v).__e, f4 = [], c3 = [], u4.__P && ((t3 = d({}, r3)).__v = r3.__v + 1, l.vnode && l.vnode(t3), O(u4.__P, t3, r3, u4.__n, u4.__P.namespaceURI, 32 & r3.__u ? [o3] : null, f4, null == o3 ? S(r3) : o3, !!(32 & r3.__u), c3), t3.__v = r3.__v, t3.__.__k[t3.__i] = t3, N(f4, t3, c3), r3.__e = r3.__ = null, t3.__e != o3 && C(t3)));
  $.__r = 0;
}
function I(n2, l3, u4, t3, i4, r3, o3, e3, f4, c3, s3) {
  var a3, h3, y3, w3, d3, g2, _2, m3 = t3 && t3.__k || v, b = l3.length;
  for (f4 = P(u4, l3, m3, f4, b), a3 = 0; a3 < b; a3++) null != (y3 = u4.__k[a3]) && (h3 = -1 == y3.__i ? p : m3[y3.__i] || p, y3.__i = a3, g2 = O(n2, y3, h3, i4, r3, o3, e3, f4, c3, s3), w3 = y3.__e, y3.ref && h3.ref != y3.ref && (h3.ref && B(h3.ref, null, y3), s3.push(y3.ref, y3.__c || w3, y3)), null == d3 && null != w3 && (d3 = w3), (_2 = !!(4 & y3.__u)) || h3.__k === y3.__k ? f4 = A(y3, f4, n2, _2) : "function" == typeof y3.type && void 0 !== g2 ? f4 = g2 : w3 && (f4 = w3.nextSibling), y3.__u &= -7);
  return u4.__e = d3, f4;
}
function P(n2, l3, u4, t3, i4) {
  var r3, o3, e3, f4, c3, s3 = u4.length, a3 = s3, h3 = 0;
  for (n2.__k = new Array(i4), r3 = 0; r3 < i4; r3++) null != (o3 = l3[r3]) && "boolean" != typeof o3 && "function" != typeof o3 ? (f4 = r3 + h3, (o3 = n2.__k[r3] = "string" == typeof o3 || "number" == typeof o3 || "bigint" == typeof o3 || o3.constructor == String ? m(null, o3, null, null, null) : w(o3) ? m(k, { children: o3 }, null, null, null) : null == o3.constructor && o3.__b > 0 ? m(o3.type, o3.props, o3.key, o3.ref ? o3.ref : null, o3.__v) : o3).__ = n2, o3.__b = n2.__b + 1, e3 = null, -1 != (c3 = o3.__i = L(o3, u4, f4, a3)) && (a3--, (e3 = u4[c3]) && (e3.__u |= 2)), null == e3 || null == e3.__v ? (-1 == c3 && (i4 > s3 ? h3-- : i4 < s3 && h3++), "function" != typeof o3.type && (o3.__u |= 4)) : c3 != f4 && (c3 == f4 - 1 ? h3-- : c3 == f4 + 1 ? h3++ : (c3 > f4 ? h3-- : h3++, o3.__u |= 4))) : n2.__k[r3] = null;
  if (a3) for (r3 = 0; r3 < s3; r3++) null != (e3 = u4[r3]) && 0 == (2 & e3.__u) && (e3.__e == t3 && (t3 = S(e3)), D(e3, e3));
  return t3;
}
function A(n2, l3, u4, t3) {
  var i4, r3;
  if ("function" == typeof n2.type) {
    for (i4 = n2.__k, r3 = 0; i4 && r3 < i4.length; r3++) i4[r3] && (i4[r3].__ = n2, l3 = A(i4[r3], l3, u4, t3));
    return l3;
  }
  n2.__e != l3 && (t3 && (l3 && n2.type && !l3.parentNode && (l3 = S(n2)), u4.insertBefore(n2.__e, l3 || null)), l3 = n2.__e);
  do {
    l3 = l3 && l3.nextSibling;
  } while (null != l3 && 8 == l3.nodeType);
  return l3;
}
function L(n2, l3, u4, t3) {
  var i4, r3, o3, e3 = n2.key, f4 = n2.type, c3 = l3[u4], s3 = null != c3 && 0 == (2 & c3.__u);
  if (null === c3 && null == n2.key || s3 && e3 == c3.key && f4 == c3.type) return u4;
  if (t3 > (s3 ? 1 : 0)) {
    for (i4 = u4 - 1, r3 = u4 + 1; i4 >= 0 || r3 < l3.length; ) if (null != (c3 = l3[o3 = i4 >= 0 ? i4-- : r3++]) && 0 == (2 & c3.__u) && e3 == c3.key && f4 == c3.type) return o3;
  }
  return -1;
}
function T(n2, l3, u4) {
  "-" == l3[0] ? n2.setProperty(l3, null == u4 ? "" : u4) : n2[l3] = null == u4 ? "" : "number" != typeof u4 || y.test(l3) ? u4 : u4 + "px";
}
function j(n2, l3, u4, t3, i4) {
  var r3, o3;
  n: if ("style" == l3) if ("string" == typeof u4) n2.style.cssText = u4;
  else {
    if ("string" == typeof t3 && (n2.style.cssText = t3 = ""), t3) for (l3 in t3) u4 && l3 in u4 || T(n2.style, l3, "");
    if (u4) for (l3 in u4) t3 && u4[l3] == t3[l3] || T(n2.style, l3, u4[l3]);
  }
  else if ("o" == l3[0] && "n" == l3[1]) r3 = l3 != (l3 = l3.replace(f, "$1")), o3 = l3.toLowerCase(), l3 = o3 in n2 || "onFocusOut" == l3 || "onFocusIn" == l3 ? o3.slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + r3] = u4, u4 ? t3 ? u4.u = t3.u : (u4.u = c, n2.addEventListener(l3, r3 ? a : s, r3)) : n2.removeEventListener(l3, r3 ? a : s, r3);
  else {
    if ("http://www.w3.org/2000/svg" == i4) l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
    else if ("width" != l3 && "height" != l3 && "href" != l3 && "list" != l3 && "form" != l3 && "tabIndex" != l3 && "download" != l3 && "rowSpan" != l3 && "colSpan" != l3 && "role" != l3 && "popover" != l3 && l3 in n2) try {
      n2[l3] = null == u4 ? "" : u4;
      break n;
    } catch (n3) {
    }
    "function" == typeof u4 || (null == u4 || false === u4 && "-" != l3[4] ? n2.removeAttribute(l3) : n2.setAttribute(l3, "popover" == l3 && 1 == u4 ? "" : u4));
  }
}
function F(n2) {
  return function(u4) {
    if (this.l) {
      var t3 = this.l[u4.type + n2];
      if (null == u4.t) u4.t = c++;
      else if (u4.t < t3.u) return;
      return t3(l.event ? l.event(u4) : u4);
    }
  };
}
function O(n2, u4, t3, i4, r3, o3, e3, f4, c3, s3) {
  var a3, h3, p3, v3, y3, _2, m3, b, S2, C3, M2, $2, P2, A3, H, L2, T3, j3 = u4.type;
  if (null != u4.constructor) return null;
  128 & t3.__u && (c3 = !!(32 & t3.__u), o3 = [f4 = u4.__e = t3.__e]), (a3 = l.__b) && a3(u4);
  n: if ("function" == typeof j3) try {
    if (b = u4.props, S2 = "prototype" in j3 && j3.prototype.render, C3 = (a3 = j3.contextType) && i4[a3.__c], M2 = a3 ? C3 ? C3.props.value : a3.__ : i4, t3.__c ? m3 = (h3 = u4.__c = t3.__c).__ = h3.__E : (S2 ? u4.__c = h3 = new j3(b, M2) : (u4.__c = h3 = new x(b, M2), h3.constructor = j3, h3.render = E), C3 && C3.sub(h3), h3.props = b, h3.state || (h3.state = {}), h3.context = M2, h3.__n = i4, p3 = h3.__d = true, h3.__h = [], h3._sb = []), S2 && null == h3.__s && (h3.__s = h3.state), S2 && null != j3.getDerivedStateFromProps && (h3.__s == h3.state && (h3.__s = d({}, h3.__s)), d(h3.__s, j3.getDerivedStateFromProps(b, h3.__s))), v3 = h3.props, y3 = h3.state, h3.__v = u4, p3) S2 && null == j3.getDerivedStateFromProps && null != h3.componentWillMount && h3.componentWillMount(), S2 && null != h3.componentDidMount && h3.__h.push(h3.componentDidMount);
    else {
      if (S2 && null == j3.getDerivedStateFromProps && b !== v3 && null != h3.componentWillReceiveProps && h3.componentWillReceiveProps(b, M2), !h3.__e && null != h3.shouldComponentUpdate && false === h3.shouldComponentUpdate(b, h3.__s, M2) || u4.__v == t3.__v) {
        for (u4.__v != t3.__v && (h3.props = b, h3.state = h3.__s, h3.__d = false), u4.__e = t3.__e, u4.__k = t3.__k, u4.__k.some(function(n3) {
          n3 && (n3.__ = u4);
        }), $2 = 0; $2 < h3._sb.length; $2++) h3.__h.push(h3._sb[$2]);
        h3._sb = [], h3.__h.length && e3.push(h3);
        break n;
      }
      null != h3.componentWillUpdate && h3.componentWillUpdate(b, h3.__s, M2), S2 && null != h3.componentDidUpdate && h3.__h.push(function() {
        h3.componentDidUpdate(v3, y3, _2);
      });
    }
    if (h3.context = M2, h3.props = b, h3.__P = n2, h3.__e = false, P2 = l.__r, A3 = 0, S2) {
      for (h3.state = h3.__s, h3.__d = false, P2 && P2(u4), a3 = h3.render(h3.props, h3.state, h3.context), H = 0; H < h3._sb.length; H++) h3.__h.push(h3._sb[H]);
      h3._sb = [];
    } else do {
      h3.__d = false, P2 && P2(u4), a3 = h3.render(h3.props, h3.state, h3.context), h3.state = h3.__s;
    } while (h3.__d && ++A3 < 25);
    h3.state = h3.__s, null != h3.getChildContext && (i4 = d(d({}, i4), h3.getChildContext())), S2 && !p3 && null != h3.getSnapshotBeforeUpdate && (_2 = h3.getSnapshotBeforeUpdate(v3, y3)), L2 = a3, null != a3 && a3.type === k && null == a3.key && (L2 = V(a3.props.children)), f4 = I(n2, w(L2) ? L2 : [L2], u4, t3, i4, r3, o3, e3, f4, c3, s3), h3.base = u4.__e, u4.__u &= -161, h3.__h.length && e3.push(h3), m3 && (h3.__E = h3.__ = null);
  } catch (n3) {
    if (u4.__v = null, c3 || null != o3) if (n3.then) {
      for (u4.__u |= c3 ? 160 : 128; f4 && 8 == f4.nodeType && f4.nextSibling; ) f4 = f4.nextSibling;
      o3[o3.indexOf(f4)] = null, u4.__e = f4;
    } else {
      for (T3 = o3.length; T3--; ) g(o3[T3]);
      z(u4);
    }
    else u4.__e = t3.__e, u4.__k = t3.__k, n3.then || z(u4);
    l.__e(n3, u4, t3);
  }
  else null == o3 && u4.__v == t3.__v ? (u4.__k = t3.__k, u4.__e = t3.__e) : f4 = u4.__e = q(t3.__e, u4, t3, i4, r3, o3, e3, c3, s3);
  return (a3 = l.diffed) && a3(u4), 128 & u4.__u ? void 0 : f4;
}
function z(n2) {
  n2 && n2.__c && (n2.__c.__e = true), n2 && n2.__k && n2.__k.forEach(z);
}
function N(n2, u4, t3) {
  for (var i4 = 0; i4 < t3.length; i4++) B(t3[i4], t3[++i4], t3[++i4]);
  l.__c && l.__c(u4, n2), n2.some(function(u5) {
    try {
      n2 = u5.__h, u5.__h = [], n2.some(function(n3) {
        n3.call(u5);
      });
    } catch (n3) {
      l.__e(n3, u5.__v);
    }
  });
}
function V(n2) {
  return "object" != typeof n2 || null == n2 || n2.__b && n2.__b > 0 ? n2 : w(n2) ? n2.map(V) : d({}, n2);
}
function q(u4, t3, i4, r3, o3, e3, f4, c3, s3) {
  var a3, h3, v3, y3, d3, _2, m3, b = i4.props, k3 = t3.props, x2 = t3.type;
  if ("svg" == x2 ? o3 = "http://www.w3.org/2000/svg" : "math" == x2 ? o3 = "http://www.w3.org/1998/Math/MathML" : o3 || (o3 = "http://www.w3.org/1999/xhtml"), null != e3) {
    for (a3 = 0; a3 < e3.length; a3++) if ((d3 = e3[a3]) && "setAttribute" in d3 == !!x2 && (x2 ? d3.localName == x2 : 3 == d3.nodeType)) {
      u4 = d3, e3[a3] = null;
      break;
    }
  }
  if (null == u4) {
    if (null == x2) return document.createTextNode(k3);
    u4 = document.createElementNS(o3, x2, k3.is && k3), c3 && (l.__m && l.__m(t3, e3), c3 = false), e3 = null;
  }
  if (null == x2) b === k3 || c3 && u4.data == k3 || (u4.data = k3);
  else {
    if (e3 = e3 && n.call(u4.childNodes), b = i4.props || p, !c3 && null != e3) for (b = {}, a3 = 0; a3 < u4.attributes.length; a3++) b[(d3 = u4.attributes[a3]).name] = d3.value;
    for (a3 in b) if (d3 = b[a3], "children" == a3) ;
    else if ("dangerouslySetInnerHTML" == a3) v3 = d3;
    else if (!(a3 in k3)) {
      if ("value" == a3 && "defaultValue" in k3 || "checked" == a3 && "defaultChecked" in k3) continue;
      j(u4, a3, null, d3, o3);
    }
    for (a3 in k3) d3 = k3[a3], "children" == a3 ? y3 = d3 : "dangerouslySetInnerHTML" == a3 ? h3 = d3 : "value" == a3 ? _2 = d3 : "checked" == a3 ? m3 = d3 : c3 && "function" != typeof d3 || b[a3] === d3 || j(u4, a3, d3, b[a3], o3);
    if (h3) c3 || v3 && (h3.__html == v3.__html || h3.__html == u4.innerHTML) || (u4.innerHTML = h3.__html), t3.__k = [];
    else if (v3 && (u4.innerHTML = ""), I("template" == t3.type ? u4.content : u4, w(y3) ? y3 : [y3], t3, i4, r3, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : o3, e3, f4, e3 ? e3[0] : i4.__k && S(i4, 0), c3, s3), null != e3) for (a3 = e3.length; a3--; ) g(e3[a3]);
    c3 || (a3 = "value", "progress" == x2 && null == _2 ? u4.removeAttribute("value") : null != _2 && (_2 !== u4[a3] || "progress" == x2 && !_2 || "option" == x2 && _2 != b[a3]) && j(u4, a3, _2, b[a3], o3), a3 = "checked", null != m3 && m3 != u4[a3] && j(u4, a3, m3, b[a3], o3));
  }
  return u4;
}
function B(n2, u4, t3) {
  try {
    if ("function" == typeof n2) {
      var i4 = "function" == typeof n2.__u;
      i4 && n2.__u(), i4 && null == u4 || (n2.__u = n2(u4));
    } else n2.current = u4;
  } catch (n3) {
    l.__e(n3, t3);
  }
}
function D(n2, u4, t3) {
  var i4, r3;
  if (l.unmount && l.unmount(n2), (i4 = n2.ref) && (i4.current && i4.current != n2.__e || B(i4, null, u4)), null != (i4 = n2.__c)) {
    if (i4.componentWillUnmount) try {
      i4.componentWillUnmount();
    } catch (n3) {
      l.__e(n3, u4);
    }
    i4.base = i4.__P = null;
  }
  if (i4 = n2.__k) for (r3 = 0; r3 < i4.length; r3++) i4[r3] && D(i4[r3], u4, t3 || "function" != typeof n2.type);
  t3 || g(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
}
function E(n2, l3, u4) {
  return this.constructor(n2, u4);
}
function G(u4, t3, i4) {
  var r3, o3, e3, f4;
  t3 == document && (t3 = document.documentElement), l.__ && l.__(u4, t3), o3 = (r3 = "function" == typeof i4) ? null : i4 && i4.__k || t3.__k, e3 = [], f4 = [], O(t3, u4 = (!r3 && i4 || t3).__k = _(k, null, [u4]), o3 || p, p, t3.namespaceURI, !r3 && i4 ? [i4] : o3 ? null : t3.firstChild ? n.call(t3.childNodes) : null, e3, !r3 && i4 ? i4 : o3 ? o3.__e : t3.firstChild, r3, f4), N(e3, u4, f4);
}
n = v.slice, l = { __e: function(n2, l3, u4, t3) {
  for (var i4, r3, o3; l3 = l3.__; ) if ((i4 = l3.__c) && !i4.__) try {
    if ((r3 = i4.constructor) && null != r3.getDerivedStateFromError && (i4.setState(r3.getDerivedStateFromError(n2)), o3 = i4.__d), null != i4.componentDidCatch && (i4.componentDidCatch(n2, t3 || {}), o3 = i4.__d), o3) return i4.__E = i4;
  } catch (l4) {
    n2 = l4;
  }
  throw n2;
} }, u = 0, t = function(n2) {
  return null != n2 && null == n2.constructor;
}, x.prototype.setState = function(n2, l3) {
  var u4;
  u4 = null != this.__s && this.__s != this.state ? this.__s : this.__s = d({}, this.state), "function" == typeof n2 && (n2 = n2(d({}, u4), this.props)), n2 && d(u4, n2), null != n2 && this.__v && (l3 && this._sb.push(l3), M(this));
}, x.prototype.forceUpdate = function(n2) {
  this.__v && (this.__e = true, n2 && this.__h.push(n2), M(this));
}, x.prototype.render = k, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l3) {
  return n2.__v.__b - l3.__v.__b;
}, $.__r = 0, f = /(PointerCapture)$|Capture$/i, c = 0, s = F(false), a = F(true), h = 0;

// ../frontend/node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
var f2 = 0;
var i2 = Array.isArray;
function u2(e3, t3, n2, o3, i4, u4) {
  t3 || (t3 = {});
  var a3, c3, p3 = t3;
  if ("ref" in p3) for (c3 in p3 = {}, t3) "ref" == c3 ? a3 = t3[c3] : p3[c3] = t3[c3];
  var l3 = { type: e3, props: p3, key: n2, ref: a3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f2, __i: -1, __u: 0, __source: i4, __self: u4 };
  if ("function" == typeof e3 && (a3 = e3.defaultProps)) for (c3 in a3) void 0 === p3[c3] && (p3[c3] = a3[c3]);
  return l.vnode && l.vnode(l3), l3;
}

// ../frontend/node_modules/@deck.gl/widgets/dist/lib/components/button-group.js
var ButtonGroup = (props) => {
  const { children, orientation = "horizontal" } = props;
  return u2("div", { className: `deck-widget-button-group ${orientation}`, children });
};

// ../frontend/node_modules/@deck.gl/widgets/dist/lib/components/grouped-icon-button.js
var GroupedIconButton = (props) => {
  const { className = "", label, onClick, children } = props;
  return u2("button", { className: `deck-widget-icon-button ${className}`, type: "button", onClick, title: label, children: children ? children : u2("div", { className: "deck-widget-icon" }) });
};

// ../frontend/node_modules/@deck.gl/widgets/dist/zoom-widget.js
var ZoomWidget = class extends Widget {
  constructor(props = {}) {
    super(props);
    this.className = "deck-widget-zoom";
    this.placement = "top-left";
    this.viewports = {};
    this.setProps(this.props);
  }
  setProps(props) {
    this.placement = props.placement ?? this.placement;
    this.viewId = props.viewId ?? this.viewId;
    super.setProps(props);
  }
  onRenderHTML(rootElement) {
    const ui = u2(ButtonGroup, { orientation: this.props.orientation, children: [u2(GroupedIconButton, { onClick: () => this.handleZoomIn(), label: this.props.zoomInLabel, className: "deck-widget-zoom-in" }), u2(GroupedIconButton, { onClick: () => this.handleZoomOut(), label: this.props.zoomOutLabel, className: "deck-widget-zoom-out" })] });
    G(ui, rootElement);
  }
  onViewportChange(viewport) {
    this.viewports[viewport.id] = viewport;
  }
  handleZoom(viewport, nextZoom) {
    const viewId = this.viewId || viewport?.id || "default-view";
    const nextViewState = {
      ...viewport,
      zoom: nextZoom
    };
    if (this.props.transitionDuration > 0) {
      nextViewState.transitionDuration = this.props.transitionDuration;
      nextViewState.transitionInterpolator = "latitude" in nextViewState ? new FlyToInterpolator() : new LinearInterpolator({
        transitionProps: ["zoom"]
      });
    }
    this.setViewState(viewId, nextViewState);
  }
  handleZoomIn() {
    for (const viewport of Object.values(this.viewports)) {
      this.handleZoom(viewport, viewport.zoom + 1);
    }
  }
  handleZoomOut() {
    for (const viewport of Object.values(this.viewports)) {
      this.handleZoom(viewport, viewport.zoom - 1);
    }
  }
  /** @todo - move to deck or widget manager */
  setViewState(viewId, viewState) {
    this.deck._onViewStateChange({ viewId, viewState, interactionState: {} });
  }
};
ZoomWidget.defaultProps = {
  ...Widget.defaultProps,
  id: "zoom",
  placement: "top-left",
  orientation: "vertical",
  transitionDuration: 200,
  zoomInLabel: "Zoom In",
  zoomOutLabel: "Zoom Out",
  viewId: null
};

// ../frontend/node_modules/@deck.gl/widgets/dist/lib/components/icon-button.js
var IconButton = (props) => {
  const { className = "", label, onClick, children } = props;
  return u2("div", { className: "deck-widget-button", children: u2("button", { className: `deck-widget-icon-button ${className}`, type: "button", onClick, title: label, children: children ? children : u2("div", { className: "deck-widget-icon" }) }) });
};

// ../frontend/node_modules/@deck.gl/widgets/dist/reset-view-widget.js
var ResetViewWidget = class extends Widget {
  constructor(props = {}) {
    super(props);
    this.className = "deck-widget-reset-view";
    this.placement = "top-left";
    this.setProps(this.props);
  }
  setProps(props) {
    this.placement = props.placement ?? this.placement;
    this.viewId = props.viewId ?? this.viewId;
    super.setProps(props);
  }
  onRenderHTML(rootElement) {
    G(u2(IconButton, { className: "deck-widget-reset-focus", label: this.props.label, onClick: this.handleClick.bind(this) }), rootElement);
  }
  handleClick() {
    const initialViewState = this.props.initialViewState || this.deck?.props.initialViewState;
    this.setViewState(initialViewState);
  }
  setViewState(viewState) {
    const viewId = this.props.viewId || "default-view";
    const nextViewState = {
      ...viewId !== "default-view" ? viewState?.[viewId] : viewState
      // only works for geospatial?
      // transitionDuration: this.props.transitionDuration,
      // transitionInterpolator: new FlyToInterpolator()
    };
    this.deck._onViewStateChange({ viewId, viewState: nextViewState, interactionState: {} });
  }
};
ResetViewWidget.defaultProps = {
  ...Widget.defaultProps,
  id: "reset-view",
  placement: "top-left",
  label: "Reset View",
  initialViewState: void 0,
  viewId: null
};

// ../frontend/node_modules/@deck.gl/widgets/dist/gimbal-widget.js
var GimbalWidget = class extends Widget {
  constructor(props = {}) {
    super(props);
    this.className = "deck-widget-gimbal";
    this.placement = "top-left";
    this.viewports = {};
    this.setProps(this.props);
  }
  setProps(props) {
    this.placement = props.placement ?? this.placement;
    this.viewId = props.viewId ?? this.viewId;
    super.setProps(props);
  }
  onRenderHTML(rootElement) {
    const viewId = this.viewId || Object.values(this.viewports)[0]?.id || "default-view";
    const widgetViewport = this.viewports[viewId];
    const { rotationOrbit, rotationX } = this.getNormalizedRotation(widgetViewport);
    const ui = u2("div", { className: "deck-widget-button", style: { perspective: 100, pointerEvents: "auto" }, children: u2("button", { type: "button", onClick: () => {
      for (const viewport of Object.values(this.viewports)) {
        this.resetOrbitView(viewport);
      }
    }, title: this.props.label, style: { position: "relative", width: 26, height: 26 }, children: [u2("svg", { className: "gimbal-outer-ring", width: "100%", height: "100%", viewBox: "0 0 26 26", style: {
      position: "absolute",
      top: 0,
      left: 0,
      transform: `rotateY(${rotationOrbit}deg)`
    }, children: u2("circle", { cx: "13", cy: "13", r: "10", stroke: "var(--icon-gimbal-outer-color, rgb(68, 92, 204))", strokeWidth: this.props.strokeWidth, fill: "none" }) }), u2("svg", { className: "gimbal-inner-ring", width: "100%", height: "100%", viewBox: "0 0 26 26", style: {
      position: "absolute",
      top: 0,
      left: 0,
      transform: `rotateX(${rotationX}deg)`
    }, children: u2("circle", { cx: "13", cy: "13", r: "7", stroke: "var(--icon-gimbal-inner-color, rgb(240, 92, 68))", strokeWidth: this.props.strokeWidth, fill: "none" }) })] }) });
    G(ui, rootElement);
  }
  onViewportChange(viewport) {
    this.viewports[viewport.id] = viewport;
    this.updateHTML();
  }
  resetOrbitView(viewport) {
    const viewId = this.getViewId(viewport);
    const viewState = this.getViewState(viewId);
    if ("rotationOrbit" in viewState || "rotationX" in viewState) {
      const nextViewState = {
        ...viewState,
        rotationOrbit: 0,
        rotationX: 0,
        transitionDuration: this.props.transitionDuration,
        transitionInterpolator: new LinearInterpolator({
          transitionProps: ["rotationOrbit", "rotationX"]
        })
      };
      this.deck._onViewStateChange({ viewId, viewState: nextViewState, interactionState: {} });
    }
  }
  getNormalizedRotation(viewport) {
    const viewState = this.getViewState(this.getViewId(viewport));
    const [rz, rx] = this.getRotation(viewState);
    const rotationOrbit = normalizeAndClampAngle(rz);
    const rotationX = normalizeAndClampAngle(rx);
    return { rotationOrbit, rotationX };
  }
  getRotation(viewState) {
    if (viewState && ("rotationOrbit" in viewState || "rotationX" in viewState)) {
      return [-(viewState.rotationOrbit || 0), viewState.rotationX || 0];
    }
    return [0, 0];
  }
  // Move to Widget/WidgetManager?
  getViewId(viewport) {
    const viewId = this.viewId || viewport?.id || "OrbitView";
    return viewId;
  }
  getViewState(viewId) {
    const viewManager = this.getViewManager();
    const viewState = viewId && viewManager.getViewState(viewId) || viewManager.viewState;
    return viewState;
  }
  getViewManager() {
    const viewManager = this.deck?.viewManager;
    if (!viewManager) {
      throw new Error("wigdet must be added to a deck instance");
    }
    return viewManager;
  }
};
GimbalWidget.defaultProps = {
  ...Widget.defaultProps,
  id: "gimbal",
  placement: "top-left",
  viewId: null,
  label: "Gimbal",
  strokeWidth: 1.5,
  transitionDuration: 200
};
function normalizeAndClampAngle(angle) {
  let normalized = ((angle + 180) % 360 + 360) % 360 - 180;
  const AVOID_ANGLE_DELTA = 10;
  const distanceFrom90 = normalized - 90;
  if (Math.abs(distanceFrom90) < AVOID_ANGLE_DELTA) {
    if (distanceFrom90 < AVOID_ANGLE_DELTA) {
      normalized = 90 + AVOID_ANGLE_DELTA;
    } else if (distanceFrom90 > -AVOID_ANGLE_DELTA) {
      normalized = 90 - AVOID_ANGLE_DELTA;
    }
  }
  return normalized;
}

// ../frontend/node_modules/@deck.gl/widgets/dist/compass-widget.js
var CompassWidget = class extends Widget {
  constructor(props = {}) {
    super(props);
    this.className = "deck-widget-compass";
    this.placement = "top-left";
    this.viewports = {};
    this.setProps(this.props);
  }
  setProps(props) {
    this.placement = props.placement ?? this.placement;
    this.viewId = props.viewId ?? this.viewId;
    super.setProps(props);
  }
  onRenderHTML(rootElement) {
    const viewId = this.viewId || Object.values(this.viewports)[0]?.id || "default-view";
    const widgetViewport = this.viewports[viewId];
    const [rz, rx] = this.getRotation(widgetViewport);
    const ui = u2("div", { className: "deck-widget-button", style: { perspective: 100 }, children: u2("button", { type: "button", onClick: () => {
      for (const viewport of Object.values(this.viewports)) {
        this.handleCompassReset(viewport);
      }
    }, title: this.props.label, style: { transform: `rotateX(${rx}deg)` }, children: u2("svg", { fill: "none", width: "100%", height: "100%", viewBox: "0 0 26 26", children: u2("g", { transform: `rotate(${rz},13,13)`, children: [u2("path", { d: "M10 13.0001L12.9999 5L15.9997 13.0001H10Z", fill: "var(--icon-compass-north-color, rgb(240, 92, 68))" }), u2("path", { d: "M16.0002 12.9999L13.0004 21L10.0005 12.9999H16.0002Z", fill: "var(--icon-compass-south-color, rgb(204, 204, 204))" })] }) }) }) });
    G(ui, rootElement);
  }
  onViewportChange(viewport) {
    if (!viewport.equals(this.viewports[viewport.id])) {
      this.viewports[viewport.id] = viewport;
      this.updateHTML();
    }
  }
  getRotation(viewport) {
    if (viewport instanceof web_mercator_viewport_default) {
      return [-viewport.bearing, viewport.pitch];
    } else if (viewport instanceof GlobeViewport) {
      return [0, Math.max(-80, Math.min(80, viewport.latitude))];
    }
    return [0, 0];
  }
  handleCompassReset(viewport) {
    const viewId = this.viewId || viewport.id || "default-view";
    if (viewport instanceof web_mercator_viewport_default) {
      const nextViewState = {
        ...viewport,
        bearing: 0,
        ...this.getRotation(viewport)[0] === 0 ? { pitch: 0 } : {},
        transitionDuration: this.props.transitionDuration,
        transitionInterpolator: new FlyToInterpolator()
      };
      this.deck._onViewStateChange({ viewId, viewState: nextViewState, interactionState: {} });
    }
  }
};
CompassWidget.defaultProps = {
  ...Widget.defaultProps,
  id: "compass",
  placement: "top-left",
  viewId: null,
  label: "Reset Compass",
  transitionDuration: 200
};

// ../frontend/node_modules/@deck.gl/widgets/dist/scale-widget.js
var ScaleWidget = class extends Widget {
  constructor(props = {}) {
    super(props);
    this.className = "deck-widget-scale";
    this.placement = "bottom-left";
    this.scaleWidth = 10;
    this.scaleValue = 0;
    this.scaleText = "";
    this.setProps(this.props);
  }
  setProps(props) {
    this.placement = props.placement ?? this.placement;
    this.viewId = props.viewId ?? this.viewId;
    super.setProps(props);
  }
  onRenderHTML(rootElement) {
    const lineOffsetX = 50;
    const svgWidth = lineOffsetX + this.scaleWidth;
    const tickHeight = 10;
    G(u2("svg", { className: "deck-widget-scale", width: svgWidth, height: 30, style: { overflow: "visible", background: "transparent" }, onClick: this.handleClick.bind(this), children: [u2("text", { x: lineOffsetX + 5, y: "10", textAnchor: "end", alignmentBaseline: "middle", style: { fontSize: "16px", fill: "black", fontWeight: "bold", fontFamily: "sans-serif" }, children: this.scaleText }), u2("line", { x1: lineOffsetX, y1: "15", x2: lineOffsetX + this.scaleWidth, y2: "15", stroke: "black", strokeWidth: "6" }), u2("line", { x1: lineOffsetX, y1: "15", x2: lineOffsetX, y2: 15 - tickHeight, stroke: "black", strokeWidth: "6" }), u2("line", { x1: lineOffsetX + this.scaleWidth, y1: "15", x2: lineOffsetX + this.scaleWidth, y2: 15 - tickHeight, stroke: "black", strokeWidth: "6" })] }), rootElement);
  }
  onViewportChange(viewport) {
    if (!("latitude" in viewport))
      return;
    const { latitude, zoom } = viewport;
    const metersPerPixel = getMetersPerPixel(latitude, zoom);
    const { candidate, candidatePixels } = computeScaleCandidate(metersPerPixel);
    this.scaleValue = candidate;
    this.scaleWidth = candidatePixels;
    if (candidate >= 1e3) {
      this.scaleText = `${(candidate / 1e3).toFixed(1)} km`;
    } else {
      this.scaleText = `${candidate} m`;
    }
    this.updateHTML();
  }
  handleClick() {
  }
};
ScaleWidget.defaultProps = {
  ...Widget.defaultProps,
  id: "scale",
  placement: "bottom-left",
  label: "Scale",
  viewId: null
};
function getMetersPerPixel(latitude, zoom) {
  const earthCircumference = 40075016686e-3;
  return earthCircumference * Math.cos(latitude * Math.PI / 180) / Math.pow(2, zoom + 8);
}
function computeScaleCandidate(metersPerPixel) {
  const minPixels = 100;
  const maxPixels = 200;
  const targetPixels = (minPixels + maxPixels) / 2;
  const targetDistance = targetPixels * metersPerPixel;
  const exponent = Math.floor(Math.log10(targetDistance));
  const base = Math.pow(10, exponent);
  const multipliers = [1, 2, 5];
  let candidate = multipliers[0] * base;
  let candidatePixels = candidate / metersPerPixel;
  for (let i4 = 0; i4 < multipliers.length; i4++) {
    const currentCandidate = multipliers[i4] * base;
    const currentPixels = currentCandidate / metersPerPixel;
    if (currentPixels >= minPixels && currentPixels <= maxPixels) {
      candidate = currentCandidate;
      candidatePixels = currentPixels;
      break;
    }
    if (currentPixels > maxPixels) {
      candidate = i4 > 0 ? multipliers[i4 - 1] * base : currentCandidate;
      candidatePixels = candidate / metersPerPixel;
      break;
    }
    if (i4 === multipliers.length - 1 && currentPixels < minPixels) {
      candidate = multipliers[0] * base * 10;
      candidatePixels = candidate / metersPerPixel;
    }
  }
  return { candidate, candidatePixels };
}

// ../frontend/node_modules/preact/hooks/dist/hooks.module.js
var t2;
var r2;
var u3;
var i3;
var o2 = 0;
var f3 = [];
var c2 = l;
var e2 = c2.__b;
var a2 = c2.__r;
var v2 = c2.diffed;
var l2 = c2.__c;
var m2 = c2.unmount;
var s2 = c2.__;
function p2(n2, t3) {
  c2.__h && c2.__h(r2, n2, o2 || t3), o2 = 0;
  var u4 = r2.__H || (r2.__H = { __: [], __h: [] });
  return n2 >= u4.__.length && u4.__.push({}), u4.__[n2];
}
function d2(n2) {
  return o2 = 1, h2(D2, n2);
}
function h2(n2, u4, i4) {
  var o3 = p2(t2++, 2);
  if (o3.t = n2, !o3.__c && (o3.__ = [i4 ? i4(u4) : D2(void 0, u4), function(n3) {
    var t3 = o3.__N ? o3.__N[0] : o3.__[0], r3 = o3.t(t3, n3);
    t3 !== r3 && (o3.__N = [r3, o3.__[1]], o3.__c.setState({}));
  }], o3.__c = r2, !r2.__f)) {
    var f4 = function(n3, t3, r3) {
      if (!o3.__c.__H) return true;
      var u5 = o3.__c.__H.__.filter(function(n4) {
        return !!n4.__c;
      });
      if (u5.every(function(n4) {
        return !n4.__N;
      })) return !c3 || c3.call(this, n3, t3, r3);
      var i5 = o3.__c.props !== n3;
      return u5.forEach(function(n4) {
        if (n4.__N) {
          var t4 = n4.__[0];
          n4.__ = n4.__N, n4.__N = void 0, t4 !== n4.__[0] && (i5 = true);
        }
      }), c3 && c3.call(this, n3, t3, r3) || i5;
    };
    r2.__f = true;
    var c3 = r2.shouldComponentUpdate, e3 = r2.componentWillUpdate;
    r2.componentWillUpdate = function(n3, t3, r3) {
      if (this.__e) {
        var u5 = c3;
        c3 = void 0, f4(n3, t3, r3), c3 = u5;
      }
      e3 && e3.call(this, n3, t3, r3);
    }, r2.shouldComponentUpdate = f4;
  }
  return o3.__N || o3.__;
}
function y2(n2, u4) {
  var i4 = p2(t2++, 3);
  !c2.__s && C2(i4.__H, u4) && (i4.__ = n2, i4.u = u4, r2.__H.__h.push(i4));
}
function A2(n2) {
  return o2 = 5, T2(function() {
    return { current: n2 };
  }, []);
}
function T2(n2, r3) {
  var u4 = p2(t2++, 7);
  return C2(u4.__H, r3) && (u4.__ = n2(), u4.__H = r3, u4.__h = n2), u4.__;
}
function j2() {
  for (var n2; n2 = f3.shift(); ) if (n2.__P && n2.__H) try {
    n2.__H.__h.forEach(z2), n2.__H.__h.forEach(B2), n2.__H.__h = [];
  } catch (t3) {
    n2.__H.__h = [], c2.__e(t3, n2.__v);
  }
}
c2.__b = function(n2) {
  r2 = null, e2 && e2(n2);
}, c2.__ = function(n2, t3) {
  n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), s2 && s2(n2, t3);
}, c2.__r = function(n2) {
  a2 && a2(n2), t2 = 0;
  var i4 = (r2 = n2.__c).__H;
  i4 && (u3 === r2 ? (i4.__h = [], r2.__h = [], i4.__.forEach(function(n3) {
    n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
  })) : (i4.__h.forEach(z2), i4.__h.forEach(B2), i4.__h = [], t2 = 0)), u3 = r2;
}, c2.diffed = function(n2) {
  v2 && v2(n2);
  var t3 = n2.__c;
  t3 && t3.__H && (t3.__H.__h.length && (1 !== f3.push(t3) && i3 === c2.requestAnimationFrame || ((i3 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.forEach(function(n3) {
    n3.u && (n3.__H = n3.u), n3.u = void 0;
  })), u3 = r2 = null;
}, c2.__c = function(n2, t3) {
  t3.some(function(n3) {
    try {
      n3.__h.forEach(z2), n3.__h = n3.__h.filter(function(n4) {
        return !n4.__ || B2(n4);
      });
    } catch (r3) {
      t3.some(function(n4) {
        n4.__h && (n4.__h = []);
      }), t3 = [], c2.__e(r3, n3.__v);
    }
  }), l2 && l2(n2, t3);
}, c2.unmount = function(n2) {
  m2 && m2(n2);
  var t3, r3 = n2.__c;
  r3 && r3.__H && (r3.__H.__.forEach(function(n3) {
    try {
      z2(n3);
    } catch (n4) {
      t3 = n4;
    }
  }), r3.__H = void 0, t3 && c2.__e(t3, r3.__v));
};
var k2 = "function" == typeof requestAnimationFrame;
function w2(n2) {
  var t3, r3 = function() {
    clearTimeout(u4), k2 && cancelAnimationFrame(t3), setTimeout(n2);
  }, u4 = setTimeout(r3, 35);
  k2 && (t3 = requestAnimationFrame(r3));
}
function z2(n2) {
  var t3 = r2, u4 = n2.__c;
  "function" == typeof u4 && (n2.__c = void 0, u4()), r2 = t3;
}
function B2(n2) {
  var t3 = r2;
  n2.__c = n2.__(), r2 = t3;
}
function C2(n2, t3) {
  return !n2 || n2.length !== t3.length || t3.some(function(t4, r3) {
    return t4 !== n2[r3];
  });
}
function D2(n2, t3) {
  return "function" == typeof t3 ? t3(n2) : t3;
}

// ../frontend/node_modules/@deck.gl/widgets/dist/lib/components/dropdown-menu.js
var DropdownMenu = (props) => {
  const [isOpen, setIsOpen] = d2(false);
  const dropdownRef = A2(null);
  const toggleDropdown = () => setIsOpen(!isOpen);
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };
  y2(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const handleSelect = (value) => {
    props.onSelect(value);
    setIsOpen(false);
  };
  return u2("div", { className: "dropdown-container", ref: dropdownRef, style: {
    position: "relative",
    display: "inline-block",
    ...props.style
  }, children: [u2("button", { onClick: toggleDropdown, style: {
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #ccc",
    borderRadius: "4px",
    background: "#fff",
    cursor: "pointer",
    padding: 0
  }, children: "▼" }), isOpen && u2("ul", { style: {
    position: "absolute",
    top: "100%",
    right: "100%",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "4px",
    listStyle: "none",
    padding: "4px 0",
    margin: 0,
    zIndex: 1e3,
    minWidth: "200px"
  }, children: props.menuItems.map((item) => u2("li", { onClick: () => handleSelect(item), style: {
    padding: "4px 8px",
    cursor: "pointer",
    whiteSpace: "nowrap"
  }, children: item }, item)) })] });
};

// ../frontend/node_modules/@deck.gl/widgets/dist/lib/geocode/geocoder-history.js
var CURRENT_LOCATION = "current";
var LOCAL_STORAGE_KEY = "deck-geocoder-history";
var GeocoderHistory = class {
  constructor(props) {
    this.addressText = "";
    this.errorText = "";
    this.addressHistory = [];
    this.props = { maxEntries: 5, ...props };
    this.addressHistory = this.loadPreviousAddresses();
  }
  /** PErform geocoding */
  async geocode(geocoder, address, apiKey) {
    this.errorText = "";
    this.addressText = address;
    try {
      const coordinates = await geocoder.geocode(address, apiKey);
      if (coordinates) {
        this.storeAddress(this.addressText);
        return coordinates;
      }
      this.errorText = "Invalid address";
    } catch (error) {
      this.errorText = `${error.message}`;
    }
    return null;
  }
  loadPreviousAddresses() {
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      const list = stored && JSON.parse(stored);
      const addresses = Array.isArray(list) ? list.filter((v3) => typeof v3 === "string") : [];
      return addresses;
    } catch {
    }
    return [];
  }
  storeAddress(address) {
    const cleaned = address.trim();
    if (!cleaned || cleaned === CURRENT_LOCATION) {
      return;
    }
    const deduped = [cleaned, ...this.addressHistory.filter((a3) => a3 !== cleaned)];
    this.addressHistory = deduped.slice(0, this.props.maxEntries);
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.addressHistory));
    } catch {
    }
  }
};

// ../frontend/node_modules/@deck.gl/widgets/dist/lib/geocode/geocoders.js
var GOOGLE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
var MAPBOX_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";
var OPENCAGE_API_URL = "https://api.opencagedata.com/geocode/v1/json";
var GoogleGeocoder = {
  name: "google",
  requiresApiKey: true,
  async geocode(address, apiKey) {
    const encodedAddress = encodeURIComponent(address);
    const json = await fetchJson(`${GOOGLE_URL}?address=${encodedAddress}&key=${apiKey}`);
    switch (json.status) {
      case "OK":
        const loc = json.results.length > 0 && json.results[0].geometry.location;
        return loc ? { longitude: loc.lng, latitude: loc.lat } : null;
      default:
        throw new Error(`Google Geocoder failed: ${json.status}`);
    }
  }
};
var MapboxGeocoder = {
  name: "google",
  requiresApiKey: true,
  async geocode(address, apiKey) {
    const encodedAddress = encodeURIComponent(address);
    const json = await fetchJson(`${MAPBOX_URL}/${encodedAddress}.json?access_token=${apiKey}`);
    if (Array.isArray(json.features) && json.features.length > 0) {
      const center = json.features[0].center;
      if (Array.isArray(center) && center.length >= 2) {
        return { longitude: center[0], latitude: center[1] };
      }
    }
    return null;
  }
};
var OpenCageGeocoder = {
  name: "opencage",
  requiresApiKey: true,
  async geocode(address, key) {
    const encodedAddress = encodeURIComponent(address);
    const data = await fetchJson(`${OPENCAGE_API_URL}?q=${encodedAddress}&key=${key}`);
    if (Array.isArray(data.results) && data.results.length > 0) {
      const geometry = data.results[0].geometry;
      return { longitude: geometry.lng, latitude: geometry.lat };
    }
    return null;
  }
};
var CurrentLocationGeocoder = {
  name: "current",
  requiresApiKey: false,
  /** Attempt to call browsers geolocation API */
  async geocode() {
    if (!navigator.geolocation) {
      throw new Error("Geolocation not supported");
    }
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        /** @see https://developer.mozilla.org/docs/Web/API/GeolocationPosition */
        (position) => {
          const { longitude, latitude } = position.coords;
          resolve({ longitude, latitude });
        },
        /** @see https://developer.mozilla.org/docs/Web/API/GeolocationPositionError */
        (error) => reject(new Error(error.message))
      );
    });
  }
};
async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`CORS error? ${error}. ${url}: `);
  }
  if (!response.ok) {
    throw new Error(`${response.statusText}. ${url}: `);
  }
  const data = await response.json();
  if (!data) {
    throw new Error(`No data returned. ${url}`);
  }
  return data;
}
var CoordinatesGeocoder = {
  name: "coordinates",
  requiresApiKey: false,
  placeholderLocation: `-122.45, 37.8 or 37°48'N, 122°27'W`,
  async geocode(address) {
    return parseCoordinates(address) || null;
  }
};
function parseCoordinates(input) {
  input = input.trim();
  const parts = input.split(/[,;]/).map((p3) => p3.trim());
  if (parts.length < 2)
    return null;
  const first = parseCoordinatePart(parts[0]);
  const second = parseCoordinatePart(parts[1]);
  if (first === null || second === null)
    return null;
  if (Math.abs(first) > 90 && Math.abs(second) <= 90) {
    return { longitude: first, latitude: second };
  } else if (Math.abs(second) > 90 && Math.abs(first) <= 90) {
    return { longitude: second, latitude: first };
  }
  return { latitude: first, longitude: second };
}
function parseCoordinatePart(s3) {
  s3 = s3.trim();
  if (s3.includes("°") || s3.includes("'") || s3.includes('"')) {
    const value2 = dmsToDecimal(s3);
    return isNaN(value2) ? null : value2;
  }
  let sign = 1;
  if (/[SW]/i.test(s3))
    sign = -1;
  s3 = s3.replace(/[NSEW]/gi, "");
  const value = parseFloat(s3);
  return isNaN(value) ? null : sign * value;
}
function dmsToDecimal(s3) {
  const regex = /(\d+)[°d]\s*(\d+)?['′m]?\s*(\d+(?:\.\d+)?)?[\"″s]?\s*([NSEW])?/i;
  const match = s3.match(regex);
  if (!match)
    return NaN;
  const degrees = parseFloat(match[1]) || 0;
  const minutes = parseFloat(match[2]) || 0;
  const seconds = parseFloat(match[3]) || 0;
  const direction = match[4] || "";
  let dec = degrees + minutes / 60 + seconds / 3600;
  if (/[SW]/i.test(direction)) {
    dec = -dec;
  }
  return dec;
}

// ../frontend/node_modules/@deck.gl/widgets/dist/geocoder-widget.js
var CURRENT_LOCATION2 = "current";
var GeocoderWidget = class extends Widget {
  constructor(props = {}) {
    super(props);
    this.className = "deck-widget-geocoder";
    this.placement = "top-left";
    this.geocodeHistory = new GeocoderHistory({});
    this.addressText = "";
    this.geocoder = CoordinatesGeocoder;
    this.setInput = (text) => {
      this.addressText = text;
    };
    this.handleKeyPress = (e3) => {
      if (e3.key === "Enter") {
        this.handleSubmit();
      }
    };
    this.handleSelect = (address) => {
      this.setInput(address);
      this.handleSubmit();
    };
    this.handleSubmit = () => {
      this.geocode(this.addressText);
    };
    this.geocode = async (address) => {
      const useGeolocation = this.props._geolocation && address === CURRENT_LOCATION2;
      const geocoder = useGeolocation ? CurrentLocationGeocoder : this.geocoder;
      const coordinates = await this.geocodeHistory.geocode(geocoder, this.addressText, this.props.apiKey);
      if (coordinates) {
        this.setViewState(coordinates);
      }
    };
    this.viewports = {};
    this.setProps(this.props);
  }
  setProps(props) {
    this.placement = props.placement ?? this.placement;
    this.viewId = props.viewId ?? this.viewId;
    this.geocoder = getGeocoder(this.props);
    if (this.geocoder.requiresApiKey && !this.props.apiKey) {
      throw new Error(`API key is required for the ${this.geocoder.name} geocoder`);
    }
    super.setProps(props);
  }
  onRenderHTML(rootElement) {
    const menuItems = this.props._geolocation ? [CURRENT_LOCATION2, ...this.geocodeHistory.addressHistory] : [...this.geocodeHistory.addressHistory];
    G(u2("div", { className: "deck-widget-geocoder", style: {
      pointerEvents: "auto",
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap"
      // Allows wrapping on smaller screens
    }, children: [u2("input", {
      type: "text",
      placeholder: this.geocoder.placeholderLocation ?? "Enter address or location",
      value: this.geocodeHistory.addressText,
      // @ts-expect-error event type
      onInput: (e3) => this.setInput(e3.target?.value || ""),
      onKeyPress: this.handleKeyPress,
      style: {
        flex: "1 1 auto",
        minWidth: "200px",
        margin: 0,
        padding: "8px",
        boxSizing: "border-box"
      }
    }), u2(DropdownMenu, { menuItems, onSelect: this.handleSelect, style: {
      margin: 2,
      padding: "4px 2px",
      boxSizing: "border-box"
    } }), this.geocodeHistory.errorText && u2("div", { className: "error", children: this.geocodeHistory.errorText })] }), rootElement);
  }
  // TODO - MOVE TO WIDGETIMPL?
  setViewState(viewState) {
    const viewId = this.props.viewId || viewState?.id || "default-view";
    const viewport = this.viewports[viewId] || {};
    const nextViewState = {
      ...viewport,
      ...viewState
    };
    if (this.props.transitionDuration > 0) {
      nextViewState.transitionDuration = this.props.transitionDuration;
      nextViewState.transitionInterpolator = "latitude" in nextViewState ? new FlyToInterpolator() : new LinearInterpolator();
    }
    this.deck._onViewStateChange({ viewId, viewState: nextViewState, interactionState: {} });
  }
  onViewportChange(viewport) {
    this.viewports[viewport.id] = viewport;
  }
};
GeocoderWidget.defaultProps = {
  ...Widget.defaultProps,
  id: "geocoder",
  viewId: null,
  placement: "top-left",
  label: "Geocoder",
  transitionDuration: 200,
  geocoder: "coordinates",
  customGeocoder: CoordinatesGeocoder,
  apiKey: "",
  _geolocation: false
};
function getGeocoder(props) {
  switch (props.geocoder) {
    case "google":
      return GoogleGeocoder;
    case "mapbox":
      return MapboxGeocoder;
    case "opencage":
      return OpenCageGeocoder;
    case "coordinates":
      return CoordinatesGeocoder;
    case "custom":
      if (!props.customGeocoder) {
        throw new Error("Custom geocoder is not defined");
      }
      return props.customGeocoder;
    default:
      throw new Error(`Unknown geocoder: ${props.geocoder}`);
  }
}

// ../frontend/node_modules/@deck.gl/widgets/dist/fullscreen-widget.js
var FullscreenWidget = class extends Widget {
  constructor(props = {}) {
    super(props);
    this.className = "deck-widget-fullscreen";
    this.placement = "top-left";
    this.fullscreen = false;
    this.setProps(this.props);
  }
  onAdd() {
    document.addEventListener("fullscreenchange", this.onFullscreenChange.bind(this));
  }
  onRemove() {
    document.removeEventListener("fullscreenchange", this.onFullscreenChange.bind(this));
  }
  onRenderHTML(rootElement) {
    G(u2(IconButton, { onClick: () => {
      this.handleClick().catch((err) => log_default.error(err)());
    }, label: this.fullscreen ? this.props.exitLabel : this.props.enterLabel, className: this.fullscreen ? "deck-widget-fullscreen-exit" : "deck-widget-fullscreen-enter" }), rootElement);
  }
  setProps(props) {
    this.placement = props.placement ?? this.placement;
    this.viewId = props.viewId ?? this.viewId;
    super.setProps(props);
  }
  getContainer() {
    return this.props.container || this.deck?.getCanvas()?.parentElement;
  }
  onFullscreenChange() {
    const prevFullscreen = this.fullscreen;
    const fullscreen = document.fullscreenElement === this.getContainer();
    if (prevFullscreen !== fullscreen) {
      this.fullscreen = !this.fullscreen;
    }
    this.updateHTML();
  }
  async handleClick() {
    if (this.fullscreen) {
      await this.exitFullscreen();
    } else {
      await this.requestFullscreen();
    }
    this.updateHTML();
  }
  async requestFullscreen() {
    const container = this.getContainer();
    if (container?.requestFullscreen) {
      await container.requestFullscreen({ navigationUI: "hide" });
    } else {
      this.togglePseudoFullscreen();
    }
  }
  async exitFullscreen() {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else {
      this.togglePseudoFullscreen();
    }
  }
  togglePseudoFullscreen() {
    this.getContainer()?.classList.toggle("deck-pseudo-fullscreen");
  }
};
FullscreenWidget.defaultProps = {
  ...Widget.defaultProps,
  id: "fullscreen",
  placement: "top-left",
  viewId: null,
  enterLabel: "Enter Fullscreen",
  exitLabel: "Exit Fullscreen",
  container: void 0
};

// ../frontend/node_modules/@deck.gl/widgets/dist/splitter-widget.js
var SplitterWidget = class extends Widget {
  constructor(props) {
    super(props);
    this.className = "deck-widget-splitter";
    this.placement = "fill";
  }
  setProps(props) {
    super.setProps(props);
  }
  onRenderHTML(rootElement) {
    rootElement.style.position = "absolute";
    rootElement.style.top = "0";
    rootElement.style.left = "0";
    rootElement.style.width = "100%";
    rootElement.style.height = "100%";
    rootElement.style.margin = "0px";
    G(u2(Splitter, { orientation: this.props.orientation, initialSplit: this.props.initialSplit, onChange: this.props.onChange, onDragStart: this.props.onDragStart, onDragEnd: this.props.onDragEnd }), rootElement);
  }
};
SplitterWidget.defaultProps = {
  ...Widget.defaultProps,
  id: "splitter-widget",
  viewId1: "",
  viewId2: "",
  orientation: "vertical",
  initialSplit: 0.5,
  onChange: () => {
  },
  onDragStart: () => {
  },
  onDragEnd: () => {
  }
};
function Splitter({ orientation, initialSplit, onChange, onDragStart, onDragEnd }) {
  const [split, setSplit] = d2(initialSplit);
  const dragging = A2(false);
  const containerRef = A2(null);
  const handleDragStart = (event) => {
    dragging.current = true;
    onDragStart?.();
    document.addEventListener("mousemove", handleDragging);
    document.addEventListener("mouseup", handleDragEnd);
    event.preventDefault();
  };
  const handleDragging = (event) => {
    if (!dragging.current || !containerRef.current)
      return;
    const rect = containerRef.current.getBoundingClientRect();
    let newSplit;
    if (orientation === "vertical") {
      newSplit = (event.clientX - rect.left) / rect.width;
    } else {
      newSplit = (event.clientY - rect.top) / rect.height;
    }
    newSplit = Math.min(Math.max(newSplit, 0.05), 0.95);
    setSplit(newSplit);
    onChange?.(newSplit);
  };
  const handleDragEnd = (event) => {
    if (!dragging.current)
      return;
    dragging.current = false;
    onDragEnd?.();
    document.removeEventListener("mousemove", handleDragging);
    document.removeEventListener("mouseup", handleDragEnd);
  };
  const splitterStyle = orientation === "vertical" ? {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: `${split * 100}%`,
    width: "4px",
    cursor: "col-resize",
    background: "#ccc",
    zIndex: 10,
    pointerEvents: "auto",
    boxShadow: "inset -1px 0 0 white, inset 1px 0 0 white"
  } : {
    position: "absolute",
    left: 0,
    right: 0,
    top: `${split * 100}%`,
    height: "4px",
    cursor: "row-resize",
    background: "#ccc",
    zIndex: 10,
    pointerEvents: "auto",
    boxShadow: "inset -1px 0 0 white, inset 1px 0 0 white"
  };
  const containerStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  };
  return u2("div", { ref: containerRef, style: containerStyle, children: u2("div", { style: splitterStyle, onMouseDown: handleDragStart }) });
}

// ../frontend/node_modules/@deck.gl/widgets/dist/lib/components/icon-menu.js
function IconMenu(props) {
  const [menuOpen, setMenuOpen] = d2(false);
  const containerRef = A2(null);
  const handleClickOutside = (event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  };
  y2(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef]);
  const [selectedItem, setSelectedItem] = d2(props.initialItem);
  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setMenuOpen(false);
    props.onItemSelected(item);
  };
  const handleButtonClick = () => setMenuOpen(!menuOpen);
  const selectedMenuItem = props.menuItems.find((item) => item.value === selectedItem);
  const label = props.label || selectedMenuItem?.label || "";
  const icon = props.icon || selectedMenuItem?.icon;
  return u2("div", { style: { position: "relative", display: "inline-block" }, ref: containerRef, children: [u2(IconButton, { className: props.className, label, onClick: handleButtonClick, children: icon }), menuOpen && u2("div", { className: "deck-widget-icon-menu", children: u2(ButtonGroup, { orientation: "vertical", children: props.menuItems.map((item) => u2(GroupedIconButton, { label: item.label, onClick: () => handleSelectItem(item.value), children: item.icon }, item.value)) }) })] });
}

// ../frontend/node_modules/@deck.gl/widgets/dist/view-selector-widget.js
var ViewSelectorWidget = class extends Widget {
  constructor(props = {}) {
    super(props);
    this.className = "deck-widget-view-selector";
    this.placement = "top-left";
    this.handleSelectMode = (viewMode) => {
      this.viewMode = viewMode;
      this.updateHTML();
      this.props.onViewModeChange(viewMode);
    };
    this.viewMode = this.props.initialViewMode;
    this.setProps(this.props);
  }
  setProps(props) {
    this.placement = props.placement ?? this.placement;
    this.viewId = props.viewId ?? this.viewId;
    super.setProps(props);
  }
  onRenderHTML(rootElement) {
    G(u2(IconMenu, { className: "deck-widget-view-selector", menuItems: MENU_ITEMS.map((item) => ({
      ...item,
      icon: item.icon()
    })), initialItem: this.props.initialViewMode, onItemSelected: this.handleSelectMode }), rootElement);
  }
};
ViewSelectorWidget.defaultProps = {
  ...Widget.defaultProps,
  id: "view-selector",
  placement: "top-left",
  viewId: null,
  label: "Split View",
  initialViewMode: "single",
  onViewModeChange: () => {
  }
};
var ICON_STYLE = { width: "24px", height: "24px" };
var ICONS = {
  single: () => u2("svg", { width: "24", height: "24", style: ICON_STYLE, children: u2("rect", { x: "4", y: "4", width: "16", height: "16", stroke: "var(--button-icon-hover, rgb(24, 24, 26))", fill: "none", strokeWidth: "2" }) }),
  "split-horizontal": () => u2("svg", { width: "24", height: "24", style: ICON_STYLE, children: [u2("rect", { x: "4", y: "4", width: "16", height: "7", stroke: "var(--button-icon-hover, rgb(24, 24, 26))", fill: "none", strokeWidth: "2" }), u2("rect", { x: "4", y: "13", width: "16", height: "7", stroke: "var(--button-icon-hover, rgb(24, 24, 26))", fill: "none", strokeWidth: "2" })] }),
  "split-vertical": () => u2("svg", { width: "24", height: "24", style: ICON_STYLE, children: [u2("rect", { x: "4", y: "4", width: "7", height: "16", stroke: "var(--button-icon-hover, rgb(24, 24, 26))", fill: "none", strokeWidth: "2" }), u2("rect", { x: "13", y: "4", width: "7", height: "16", stroke: "var(--button-icon-hover, rgb(24, 24, 26))", fill: "none", strokeWidth: "2" })] })
};
var MENU_ITEMS = [
  { value: "single", icon: ICONS.single, label: "Single View" },
  { value: "split-horizontal", icon: ICONS["split-horizontal"], label: "Split Horizontal" },
  { value: "split-vertical", icon: ICONS["split-vertical"], label: "Split Vertical" }
];

// ../frontend/node_modules/@deck.gl/widgets/dist/info-widget.js
var InfoWidget = class extends Widget {
  constructor(props) {
    super(props);
    this.className = "deck-widget-info";
    this.placement = "fill";
    this.setProps(this.props);
  }
  setProps(props) {
    this.viewId = props.viewId ?? this.viewId;
    super.setProps(props);
  }
  onCreateRootElement() {
    const element = super.onCreateRootElement();
    const style = { margin: "0px", top: "0px", left: "0px", position: "absolute" };
    Object.entries(style).forEach(([key, value]) => element.style.setProperty(key, value));
    return element;
  }
  onViewportChange(viewport) {
    this.viewport = viewport;
    this.updateHTML();
  }
  onHover(info) {
    if (this.props.mode === "hover" && this.props.getTooltip) {
      const tooltip = this.props.getTooltip(info, this);
      this.setProps({
        visible: tooltip !== null,
        ...tooltip,
        style: { zIndex: "1", ...tooltip?.style }
      });
    }
  }
  onClick(info) {
    if (this.props.mode === "click" && this.props.getTooltip) {
      const tooltip = this.props.getTooltip(info, this);
      this.setProps({
        visible: tooltip !== null,
        ...tooltip
      });
      return tooltip !== null;
    }
    return this.props.onClick?.(this, info) || false;
  }
  onAdd({ deck, viewId }) {
    this.deck = deck;
    if (!viewId) {
      this.viewport = deck.getViewports()[0];
    } else {
      this.viewport = deck.getViewports().find((viewport) => viewport.id === viewId);
    }
  }
  onRenderHTML(rootElement) {
    if (!this.viewport) {
      return;
    }
    const [longitude, latitude] = this.props.position;
    const [x2, y3] = this.viewport.project([longitude, latitude]);
    const minOffset = this.props.minOffset || 0;
    const gap = 10;
    const arrowHeight = 8;
    const arrowWidth = 16;
    const isAbove = y3 > this.viewport.height / 2;
    const background = this.props.style && this.props.style.background || "rgba(255,255,255,0.9)";
    const ui = this.props.visible ? u2("div", { className: "popup-container", style: { position: "absolute", left: 0, top: 0 }, children: [u2("div", { className: "popup-content", style: {
      background,
      padding: "10px",
      position: "relative",
      // Include any additional styles
      ...this.props.style
    }, children: this.props.text }), u2("div", { className: "popup-arrow", style: { position: "absolute", width: "0px", height: "0px" } })] }) : null;
    G(ui, rootElement);
    requestAnimationFrame(() => {
      if (!this.props.visible || !rootElement.firstChild || !this.viewport)
        return;
      const container = rootElement.firstChild;
      const contentEl = container.querySelector(".popup-content");
      const arrowEl = container.querySelector(".popup-arrow");
      if (!contentEl || !arrowEl)
        return;
      const contentRect = contentEl.getBoundingClientRect();
      const popupWidth = contentRect.width;
      const popupHeight = contentRect.height;
      let computedLeft = x2 - popupWidth / 2;
      let computedTop;
      if (isAbove) {
        computedTop = y3 - gap - arrowHeight - popupHeight;
      } else {
        computedTop = y3 + gap + arrowHeight;
      }
      if (computedLeft < minOffset) {
        computedLeft = minOffset;
      }
      if (computedLeft + popupWidth > this.viewport.width - minOffset) {
        computedLeft = this.viewport.width - minOffset - popupWidth;
      }
      if (isAbove) {
        if (computedTop < minOffset) {
          computedTop = minOffset;
        }
      } else if (computedTop + popupHeight + arrowHeight > this.viewport.height - minOffset) {
        computedTop = this.viewport.height - minOffset - popupHeight - arrowHeight;
      }
      container.style.left = `${computedLeft}px`;
      container.style.top = `${computedTop}px`;
      container.style.transform = "";
      let arrowLeft = x2 - computedLeft - arrowWidth / 2;
      arrowLeft = Math.max(arrowLeft, 0);
      arrowLeft = Math.min(arrowLeft, popupWidth - arrowWidth);
      if (isAbove) {
        arrowEl.style.left = `${arrowLeft}px`;
        arrowEl.style.bottom = `-${arrowHeight}px`;
        arrowEl.style.top = "";
        arrowEl.style.borderLeft = `${arrowWidth / 2}px solid transparent`;
        arrowEl.style.borderRight = `${arrowWidth / 2}px solid transparent`;
        arrowEl.style.borderTop = `${arrowHeight}px solid ${background}`;
        arrowEl.style.borderBottom = "";
      } else {
        arrowEl.style.left = `${arrowLeft}px`;
        arrowEl.style.top = `-${arrowHeight}px`;
        arrowEl.style.bottom = "";
        arrowEl.style.borderLeft = `${arrowWidth / 2}px solid transparent`;
        arrowEl.style.borderRight = `${arrowWidth / 2}px solid transparent`;
        arrowEl.style.borderBottom = `${arrowHeight}px solid ${background}`;
        arrowEl.style.borderTop = "";
      }
    });
  }
};
InfoWidget.defaultProps = {
  ...Widget.defaultProps,
  id: "info",
  position: [0, 0],
  text: "",
  visible: false,
  minOffset: 0,
  viewId: null,
  mode: "hover",
  getTooltip: void 0,
  onClick: void 0
};

// ../frontend/node_modules/@deck.gl/widgets/dist/lib/components/simple-menu.js
var MENU_STYLE = {
  position: "absolute",
  top: "100%",
  left: 0,
  background: "white",
  border: "1px solid #ccc",
  borderRadius: "4px",
  marginTop: "var(--menu-gap, 4px)",
  zIndex: 100
};
var MENU_ITEM_STYLE = {
  background: "white",
  border: "none",
  padding: "4px",
  cursor: "pointer",
  pointerEvents: "auto"
};
var SimpleMenu = (props) => {
  const { menuItems, onItemSelected, position, style } = props;
  const styleOverride = {
    ...MENU_STYLE,
    ...style,
    left: `${position.x}px`,
    top: `${position.y}px`
  };
  return u2("div", { style: styleOverride, children: menuItems.map(({ key, label }) => u2("button", { style: { ...MENU_ITEM_STYLE, display: "block" }, onClick: (_2) => onItemSelected(key), children: label }, key)) });
};

// ../frontend/node_modules/@deck.gl/widgets/dist/context-menu-widget.js
var MOUSE_BUTTON_RIGHT = 2;
var MOUSE_WHICH_RIGHT = 3;
var ContextMenuWidget = class extends Widget {
  constructor(props) {
    super(props);
    this.className = "deck-widget-context-menu";
    this.placement = "fill";
    this.pickInfo = null;
    this.pickInfo = null;
    this.setProps(this.props);
  }
  onAdd({ deck }) {
    const element = document.createElement("div");
    element.classList.add("deck-widget", "deck-widget-context-menu");
    const style = {
      margin: "0px",
      top: "0px",
      left: "0px",
      position: "absolute",
      pointerEvents: "auto"
    };
    Object.entries(style).forEach(([key, value]) => element.style.setProperty(key, value));
    deck.getCanvas()?.addEventListener("click", () => this.hide());
    deck.getCanvas()?.addEventListener("contextmenu", (event) => this.handleContextMenu(event));
    return element;
  }
  onRenderHTML(rootElement) {
    const { visible, position, menuItems } = this.props;
    const ui = visible && menuItems.length ? u2(SimpleMenu, { menuItems, onItemSelected: (key) => this.props.onMenuItemSelected(key, this.pickInfo), position, style: { pointerEvents: "auto" } }) : null;
    G(ui, rootElement);
  }
  handleContextMenu(srcEvent) {
    if (srcEvent && (srcEvent.button === MOUSE_BUTTON_RIGHT || srcEvent.which === MOUSE_WHICH_RIGHT)) {
      this.pickInfo = this.deck?.pickObject({
        x: srcEvent.clientX,
        y: srcEvent.clientY
      }) || null;
      const menuItems = this.pickInfo && this.props.getMenuItems?.(this.pickInfo, this) || [];
      const visible = menuItems.length > 0;
      this.setProps({
        visible,
        position: { x: srcEvent.clientX, y: srcEvent.clientY },
        menuItems
      });
      this.updateHTML();
      srcEvent.preventDefault();
      return visible;
    }
    return false;
  }
  hide() {
    this.setProps({ visible: false });
  }
};
ContextMenuWidget.defaultProps = {
  ...Widget.defaultProps,
  id: "context",
  viewId: null,
  visible: false,
  position: { x: 0, y: 0 },
  getMenuItems: void 0,
  menuItems: [],
  // eslint-disable-next-line no-console
  onMenuItemSelected: (key, pickInfo) => console.log("Context menu item selected:", key, pickInfo)
};

// ../frontend/node_modules/@deck.gl/widgets/dist/timeline-widget.js
var TimelineWidget = class extends Widget {
  constructor(props = {}) {
    super(props);
    this.id = "timeline";
    this.className = "deck-widget-timeline";
    this.placement = "bottom-left";
    this.playing = false;
    this.timerId = null;
    this.handlePlayPause = () => {
      if (this.playing) {
        this.stop();
      } else {
        this.start();
      }
    };
    this.handleSliderChange = (e3) => {
      const input = e3.target;
      const val = Number(input.value);
      this.currentTime = val;
      this.props.onTimeChange(val);
      this.updateHTML();
    };
    this.tick = () => {
      const [min, max] = this.props.timeRange;
      let next = this.currentTime + this.props.step;
      if (next > max) {
        next = min;
      }
      this.currentTime = next;
      this.props.onTimeChange(next);
      this.updateHTML();
      if (this.playing) {
        this.timerId = window.setTimeout(this.tick, this.props.playInterval);
      }
    };
    this.currentTime = this.props.initialTime ?? this.props.timeRange[0];
    this.setProps(this.props);
  }
  setProps(props) {
    this.placement = props.placement ?? this.placement;
    this.viewId = props.viewId ?? this.viewId;
    super.setProps(props);
  }
  onAdd() {
    this.playing = false;
    this.timerId = null;
  }
  onRemove() {
    this.stop();
  }
  onRenderHTML(rootElement) {
    G(u2("div", { style: { display: "flex", alignItems: "center", pointerEvents: "auto" }, children: [u2(IconButton, { label: this.playing ? "Pause" : "Play", onClick: this.handlePlayPause, children: u2("div", { className: "text", children: this.playing ? "⏸" : "▶" }) }), u2("input", { type: "range", className: "timeline-slider", min: this.props.timeRange[0], max: this.props.timeRange[1], step: this.props.step, value: this.currentTime, onInput: this.handleSliderChange })] }), rootElement);
  }
  start() {
    this.playing = true;
    this.updateHTML();
    this.tick();
  }
  stop() {
    this.playing = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.updateHTML();
  }
};
TimelineWidget.defaultProps = {
  ...Widget.defaultProps,
  id: "timeline",
  placement: "bottom-left",
  viewId: null,
  timeRange: [0, 100],
  step: 1,
  initialTime: void 0,
  onTimeChange: () => {
  },
  playInterval: 1e3
};

// ../frontend/node_modules/@deck.gl/widgets/dist/screenshot-widget.js
var ScreenshotWidget = class extends Widget {
  constructor(props = {}) {
    super(props);
    this.className = "deck-widget-screenshot";
    this.placement = "top-left";
    this.setProps(this.props);
  }
  setProps(props) {
    this.placement = props.placement ?? this.placement;
    this.viewId = props.viewId ?? this.viewId;
    super.setProps(props);
  }
  onRenderHTML(rootElement) {
    G(u2(IconButton, { className: "deck-widget-camera", label: this.props.label, onClick: this.handleClick.bind(this) }), rootElement);
  }
  handleClick() {
    if (this.props.onCapture) {
      this.props.onCapture(this);
      return;
    }
    const dataURL = this.captureScreenToDataURL(this.props.imageFormat);
    if (dataURL) {
      this.downloadDataURL(dataURL, this.props.filename);
    }
  }
  /** @note only captures canvas contents, not HTML DOM or CSS styles */
  captureScreenToDataURL(imageFormat) {
    const canvas = this.deck?.getCanvas();
    return canvas?.toDataURL(imageFormat);
  }
  /** Download a data URL */
  downloadDataURL(dataURL, filename) {
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = filename;
    link.click();
  }
};
ScreenshotWidget.defaultProps = {
  ...Widget.defaultProps,
  id: "screenshot",
  placement: "top-left",
  viewId: null,
  label: "Screenshot",
  filename: "screenshot.png",
  imageFormat: "image/png",
  onCapture: void 0
};

// ../frontend/node_modules/@deck.gl/widgets/dist/themes.js
var LightGlassTheme = {
  "--widget-margin": "12px",
  "--button-size": "28px",
  "--button-corner-radius": "8px",
  "--button-background": "rgba(255, 255, 255, 0.6)",
  "--button-stroke": "rgba(255, 255, 255, 0.3)",
  "--button-inner-stroke": "1px solid rgba(255, 255, 255, 0.6)",
  "--button-shadow": "0px 0px 8px 0px rgba(0, 0, 0, 0.25), 0px 0px 8px 0px rgba(0, 0, 0, 0.1) inset",
  "--button-backdrop-filter": "blur(4px)",
  "--button-icon-idle": "rgba(97, 97, 102, 1)",
  "--button-icon-hover": "rgba(24, 24, 26, 1)",
  "--button-text": "rgb(24, 24, 26, 1)",
  "--icon-compass-north-color": "rgb(240, 92, 68)",
  "--icon-compass-south-color": "rgb(204, 204, 204)",
  "--menu-gap": "4px"
};
var DarkGlassTheme = {
  "--widget-margin": "12px",
  "--button-size": "28px",
  "--button-corner-radius": "8px",
  "--button-background": "rgba(18, 18, 20, 0.75)",
  "--button-stroke": "rgba(18, 18, 20, 0.30)",
  "--button-inner-stroke": "1px solid rgba(18, 18, 20, 0.75)",
  "--button-shadow": "0px 0px 8px 0px rgba(0, 0, 0, 0.25), 0px 0px 8px 0px rgba(0, 0, 0, 0.1) inset",
  "--button-backdrop-filter": "blur(4px)",
  "--button-icon-idle": "rgba(158, 157, 168, 1)",
  "--button-icon-hover": "rgba(215, 214, 229, 1)",
  "--button-text": "rgb(215, 214, 229, 1)",
  "--icon-compass-north-color": "rgb(240, 92, 68)",
  "--icon-compass-south-color": "rgb(200, 199, 209)",
  "--menu-gap": "4px"
};

// ../frontend/node_modules/@deck.gl/widgets/dist/theme-widget.js
var ThemeWidget = class extends Widget {
  constructor(props = {}) {
    super(props);
    this.className = "deck-widget-theme";
    this.placement = "top-left";
    this.themeMode = "dark";
    this.themeMode = this._getInitialThemeMode();
    this.setProps(this.props);
  }
  // eslint-disable-next-line complexity
  setProps(props) {
    const { lightModeTheme, darkModeTheme } = this.props;
    this.placement = props.placement ?? this.placement;
    this.viewId = props.viewId ?? this.viewId;
    super.setProps(props);
    switch (this.themeMode) {
      case "light":
        if (props.lightModeTheme && !deepEqual(props.lightModeTheme, lightModeTheme, 1)) {
          this._setThemeMode("light");
        }
        break;
      case "dark":
        if (props.darkModeTheme && !deepEqual(props.darkModeTheme, darkModeTheme, 1)) {
          this._setThemeMode("dark");
        }
        break;
      default:
        log_default.warn(`Invalid theme mode ${this.themeMode}`)();
    }
  }
  onRenderHTML(rootElement) {
    const { lightModeLabel, darkModeLabel } = this.props;
    G(u2(IconButton, { onClick: this._handleClick.bind(this), label: this.themeMode === "dark" ? darkModeLabel : lightModeLabel, className: this.themeMode === "dark" ? "deck-widget-moon" : "deck-widget-sun" }), rootElement);
  }
  onAdd() {
    this._setThemeMode(this.themeMode);
  }
  _handleClick() {
    const newThemeMode = this.themeMode === "dark" ? "light" : "dark";
    this._setThemeMode(newThemeMode);
  }
  _setThemeMode(themeMode) {
    this.themeMode = themeMode;
    const container = this.rootElement?.closest(".deck-widget-container");
    if (container) {
      const themeStyle = themeMode === "dark" ? this.props.darkModeTheme : this.props.lightModeTheme;
      applyStyles(container, themeStyle);
      const label = this.themeMode === "dark" ? this.props.darkModeLabel : this.props.lightModeLabel;
      log_default.log(1, `Switched theme to ${label}`, themeStyle)();
      this.updateHTML();
    }
  }
  /** Read browser preference */
  _getInitialThemeMode() {
    const { initialThemeMode } = this.props;
    return initialThemeMode === "auto" ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : initialThemeMode;
  }
};
ThemeWidget.defaultProps = {
  ...Widget.defaultProps,
  id: "theme",
  placement: "top-left",
  viewId: null,
  lightModeLabel: "Light Mode",
  lightModeTheme: LightGlassTheme,
  darkModeLabel: "Dark Mode",
  darkModeTheme: DarkGlassTheme,
  initialThemeMode: "auto"
};

// ../frontend/node_modules/@deck.gl/widgets/dist/loading-widget.js
var LoadingWidget = class extends Widget {
  constructor(props = {}) {
    super(props);
    this.className = "deck-widget-loading";
    this.placement = "top-left";
    this.loading = true;
    this.setProps(this.props);
  }
  setProps(props) {
    this.placement = props.placement ?? this.placement;
    this.viewId = props.viewId ?? this.viewId;
    super.setProps(props);
  }
  onRenderHTML(rootElement) {
    G(
      // TODO(ibgreen) - this should not be a button, but styling is so nested that it is easier to reuse this component.
      this.loading && u2(IconButton, { className: "deck-widget-spinner", label: this.props.label, onClick: this.handleClick.bind(this) }),
      rootElement
    );
  }
  onRedraw({ layers }) {
    const loading = layers.some((layer) => !layer.isLoaded);
    if (loading !== this.loading) {
      this.loading = loading;
      this.updateHTML();
    }
  }
  // TODO(ibgreen) - this should not be a button, see above.
  handleClick() {
  }
};
LoadingWidget.defaultProps = {
  ...Widget.defaultProps,
  id: "loading",
  placement: "top-left",
  viewId: null,
  label: "Loading layer data"
};

// ../frontend/node_modules/@deck.gl/widgets/dist/fps-widget.js
var FpsWidget = class extends Widget {
  constructor(props = {}) {
    super(props);
    this.className = "deck-widget-fps";
    this.placement = "top-left";
    this._lastFps = -1;
    this.setProps(this.props);
  }
  setProps(props) {
    this.placement = props.placement ?? this.placement;
    this.viewId = props.viewId ?? this.viewId;
    super.setProps(props);
  }
  onAdd({}) {
    this._lastFps = this._getFps();
    requestAnimationFrame(() => this._animate());
  }
  onRenderHTML(rootElement) {
    const fps = this._getFps();
    G(u2(IconButton, { children: u2("div", { className: "text", children: ["FPS", u2("br", {}), fps] }) }), rootElement);
  }
  _animate() {
    const fps = this._getFps();
    if (this._lastFps !== fps) {
      this._lastFps = fps;
      this.updateHTML();
    }
    requestAnimationFrame(() => this._animate());
  }
  _getFps() {
    return Math.round(this.deck?.metrics.fps ?? 0);
  }
};
FpsWidget.defaultProps = {
  ...Widget.defaultProps,
  id: "fps",
  placement: "top-left",
  viewId: null
};

// ../frontend/node_modules/@deck.gl/widgets/dist/stats-widget.js
var RIGHT_ARROW = "▶";
var DOWN_ARROW = "⬇";
var DEFAULT_COUNT_FORMATTER = (stat) => `${stat.name}: ${stat.count}`;
function formatTime(time) {
  return time < 1e3 ? `${time.toFixed(2)}ms` : `${(time / 1e3).toFixed(2)}s`;
}
function formatMemory(bytes) {
  const mb = bytes / 1e6;
  return `${mb.toFixed(1)} MB`;
}
var DEFAULT_FORMATTERS = {
  count: DEFAULT_COUNT_FORMATTER,
  averageTime: (stat) => `${stat.name}: ${formatTime(stat.getAverageTime())}`,
  totalTime: (stat) => `${stat.name}: ${formatTime(stat.time)}`,
  fps: (stat) => `${stat.name}: ${Math.round(stat.getHz())}fps`,
  memory: (stat) => `${stat.name}: ${formatMemory(stat.count)}`
};
var StatsWidget = class extends Widget {
  constructor(props = {}) {
    super(props);
    this.className = "deck-widget-stats";
    this.placement = "top-left";
    this._counter = 0;
    this.collapsed = true;
    this._toggleCollapsed = () => {
      this.collapsed = !this.collapsed;
      this.updateHTML();
    };
    this._formatters = { ...DEFAULT_FORMATTERS };
    this._resetOnUpdate = { ...this.props.resetOnUpdate };
    this._stats = this.props.stats;
    this.setProps(props);
  }
  setProps(props) {
    this.placement = props.placement ?? this.placement;
    this.viewId = props.viewId ?? this.viewId;
    this._stats = this._getStats();
    if (props.formatters) {
      for (const name in props.formatters) {
        const f4 = props.formatters[name];
        this._formatters[name] = typeof f4 === "string" ? DEFAULT_FORMATTERS[f4] || DEFAULT_COUNT_FORMATTER : f4;
      }
    }
    if (props.resetOnUpdate) {
      this._resetOnUpdate = { ...props.resetOnUpdate };
    }
    super.setProps(props);
  }
  onAdd() {
    this._stats = this._getStats();
    this.updateHTML();
  }
  onRenderHTML(rootElement) {
    const stats = this._stats;
    const collapsed = this.collapsed;
    const title = this.props.title || stats?.id || "Stats";
    const items = [];
    if (!collapsed && stats) {
      stats.forEach((stat) => {
        const lines = this._getLines(stat);
        if (this._resetOnUpdate && this._resetOnUpdate[stat.name]) {
          stat.reset();
        }
        lines.forEach((line, i4) => {
          items.push(u2("div", { style: { whiteSpace: "pre" }, children: line }, `${stat.name}-${i4}`));
        });
      });
    }
    G(u2("div", { className: "deck-widget-stats-container", style: { cursor: "default" }, children: [u2("div", { className: "deck-widget-stats-header", style: { cursor: "pointer", pointerEvents: "auto" }, onClick: this._toggleCollapsed, children: [collapsed ? RIGHT_ARROW : DOWN_ARROW, " ", title] }), !collapsed && u2("div", { className: "deck-widget-stats-content", children: items })] }), rootElement);
  }
  onRedraw() {
    const framesPerUpdate = Math.max(1, this.props.framesPerUpdate || 1);
    if (this._counter++ % framesPerUpdate === 0) {
      this._stats = this._getStats();
      this.updateHTML();
    }
  }
  _getStats() {
    switch (this.props.type) {
      case "deck":
        return this.deck?.stats;
      case "luma":
        return Array.from(luma.stats.stats.values())[0];
      case "device":
        const device = this.deck?.device;
        const stats = device?.statsManager.stats.values();
        return stats ? Array.from(stats)[0] : void 0;
      case "custom":
        return this.props.stats;
      default:
        throw new Error(`Unknown stats type: ${this.props.type}`);
    }
  }
  _getLines(stat) {
    const formatter = this._formatters[stat.name] || this._formatters[stat.type || ""] || DEFAULT_COUNT_FORMATTER;
    return formatter(stat).split("\n");
  }
};
StatsWidget.defaultProps = {
  ...Widget.defaultProps,
  type: "deck",
  placement: "top-left",
  viewId: null,
  stats: void 0,
  title: "Stats",
  framesPerUpdate: 1,
  formatters: {},
  resetOnUpdate: {},
  id: "stats"
};

// ../frontend/node_modules/@deck.gl/react/dist/utils/use-widget.js
var import_react7 = __toESM(require_react(), 1);
function useWidget(WidgetClass, props) {
  const context = (0, import_react7.useContext)(DeckGlContext);
  const { widgets, deck } = context;
  (0, import_react7.useEffect)(() => {
    const internalWidgets = deck?.props.widgets;
    if (widgets?.length && internalWidgets?.length && !deepEqual(internalWidgets, widgets, 1)) {
      log_default.warn('"widgets" prop will be ignored because React widgets are in use.')();
    }
    return () => {
      const index = widgets?.indexOf(widget);
      if (index && index !== -1) {
        widgets?.splice(index, 1);
        deck?.setProps({ widgets });
      }
    };
  }, []);
  const widget = (0, import_react7.useMemo)(() => new WidgetClass(props), [WidgetClass]);
  widgets?.push(widget);
  widget.setProps(props);
  (0, import_react7.useEffect)(() => {
    deck?.setProps({ widgets });
  }, [widgets]);
  return widget;
}

// ../frontend/node_modules/@deck.gl/react/dist/widgets/compass-widget.js
var CompassWidget2 = (props = {}) => {
  useWidget(CompassWidget, props);
  return null;
};

// ../frontend/node_modules/@deck.gl/react/dist/widgets/fullscreen-widget.js
var FullscreenWidget2 = (props = {}) => {
  useWidget(FullscreenWidget, props);
  return null;
};

// ../frontend/node_modules/@deck.gl/react/dist/widgets/zoom-widget.js
var ZoomWidget2 = (props = {}) => {
  useWidget(ZoomWidget, props);
  return null;
};

// ../frontend/node_modules/@deck.gl/react/dist/widgets/geocoder-widget.js
var GeocoderWidget2 = (props = {}) => {
  useWidget(GeocoderWidget, props);
  return null;
};

// ../frontend/node_modules/@deck.gl/react/dist/widgets/info-widget.js
var InfoWidget2 = (props) => {
  useWidget(InfoWidget, props);
  return null;
};

// ../frontend/node_modules/@deck.gl/react/dist/widgets/context-menu-widget.js
var ContextMenuWidget2 = (props) => {
  useWidget(ContextMenuWidget, props);
  return null;
};

// ../frontend/node_modules/@deck.gl/react/dist/widgets/loading-widget.js
var LoadingWidget2 = (props = {}) => {
  useWidget(LoadingWidget, props);
  return null;
};

// ../frontend/node_modules/@deck.gl/react/dist/widgets/reset-view-widget.js
var ResetViewWidget2 = (props = {}) => {
  useWidget(ResetViewWidget, props);
  return null;
};

// ../frontend/node_modules/@deck.gl/react/dist/widgets/scale-widget.js
var ScaleWidget2 = (props = {}) => {
  useWidget(ScaleWidget, props);
  return null;
};

// ../frontend/node_modules/@deck.gl/react/dist/widgets/screenshot-widget.js
var ScreenshotWidget2 = (props = {}) => {
  useWidget(ScreenshotWidget, props);
  return null;
};

// ../frontend/node_modules/@deck.gl/react/dist/widgets/splitter-widget.js
var SplitterWidget2 = (props) => {
  useWidget(SplitterWidget, props);
  return null;
};

// ../frontend/node_modules/@deck.gl/react/dist/widgets/theme-widget.js
var ThemeWidget2 = (props = {}) => {
  useWidget(ThemeWidget, props);
  return null;
};
export {
  CompassWidget2 as CompassWidget,
  deckgl_default as DeckGL,
  FullscreenWidget2 as FullscreenWidget,
  ZoomWidget2 as ZoomWidget,
  ContextMenuWidget2 as _ContextMenuWidget,
  GeocoderWidget2 as _GeocoderWidget,
  InfoWidget2 as _InfoWidget,
  LoadingWidget2 as _LoadingWidget,
  ResetViewWidget2 as _ResetViewWidget,
  ScaleWidget2 as _ScaleWidget,
  ScreenshotWidget2 as _ScreenshotWidget,
  SplitterWidget2 as _SplitterWidget,
  ThemeWidget2 as _ThemeWidget,
  deckgl_default as default,
  useWidget
};
//# sourceMappingURL=@deck__gl_react.js.map
