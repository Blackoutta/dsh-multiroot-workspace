window.__ModuleLoader__.load({ id: "dsh-multiroot-workspace", factory: function (require) { const module = { exports: {} }; const exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
let react = require("react");
let react_jsx_runtime = require("react/jsx-runtime");
let react_dom = require("react-dom");

//#region src/client/vendor/store.ts
function browserStorage() {
	try {
		return typeof localStorage === "undefined" ? void 0 : localStorage;
	} catch {
		return;
	}
}
/** Define a small copy-on-write store with optional localStorage persistence. */
function defineStore(spec) {
	return {
		spec,
		create(scopeKey) {
			const persistKey = spec.persist === void 0 ? void 0 : scopeKey === void 0 ? spec.persist : `${spec.persist}.${scopeKey}`;
			const storage = browserStorage();
			let state = spec.init();
			if (storage !== void 0 && persistKey !== void 0) try {
				const persisted = storage.getItem(persistKey);
				if (persisted !== null) state = JSON.parse(persisted);
			} catch {}
			const subscribers = /* @__PURE__ */ new Set();
			const actions = {};
			for (const key of Object.keys(spec.actions)) {
				const mutate = spec.actions[key];
				actions[key] = (...params) => {
					const draft = structuredClone(state);
					mutate(draft, ...params);
					state = draft;
					if (storage !== void 0 && persistKey !== void 0) try {
						storage.setItem(persistKey, JSON.stringify(state));
					} catch {}
					for (const subscriber of [...subscribers]) subscriber();
				};
			}
			return {
				actions,
				getSnapshot: () => state,
				subscribe: (fn) => {
					subscribers.add(fn);
					return () => {
						subscribers.delete(fn);
					};
				},
				clearPersisted: () => {
					if (storage === void 0 || persistKey === void 0) return;
					try {
						storage.removeItem(persistKey);
					} catch {}
				}
			};
		}
	};
}

//#endregion
//#region src/client/upstream/stores.ts
/**
* The workspace browser's viewing store: the session-list grouping mode,
* persisted across reloads. Module level exports the factory only (a
* module-level handle would pin the store identity across plugin reloads);
* register() receives the factory and the browser derives its PropsStore
* share from the return type.
*/
/** Browser-local order account for the hierarchy-free flat Session list. */
const FLAT_SESSION_ORDER_KEY = "__flat_session_order__";
/**
* Create the workspace browser viewing store handle.
* @returns the store handle (spec + type + identity + factory in one).
*/
function createWorkspaceViewStore() {
	return defineStore({
		init: () => ({
			groupBy: "workspace",
			orderBy: "updated",
			groupExpansion: {},
			sessionOrderByAccount: {},
			sessionUpdatedAtByAccount: {}
		}),
		persist: "dsh.workspace.view.v5",
		actions: {
			setGroupBy: (d, mode) => {
				d.groupBy = mode;
			},
			setOrderBy: (d, mode) => {
				d.orderBy = mode;
			},
			setGroupExpanded: (d, key, expanded) => {
				d.groupExpansion[key] = expanded;
			},
			retainAccountKeys: (d, workspaceKeys) => {
				const retained = new Set(workspaceKeys);
				d.groupExpansion = Object.fromEntries(Object.entries(d.groupExpansion).filter(([key]) => retained.has(key)));
				d.sessionOrderByAccount = Object.fromEntries(Object.entries(d.sessionOrderByAccount).filter(([key]) => retained.has(key)));
				d.sessionUpdatedAtByAccount = Object.fromEntries(Object.entries(d.sessionUpdatedAtByAccount).filter(([key]) => retained.has(key)));
			},
			syncSessionOrderAccount: (d, accountKey, order, updatedAt) => {
				d.sessionOrderByAccount[accountKey] = order;
				d.sessionUpdatedAtByAccount[accountKey] = updatedAt;
			},
			setSessionOrder: (d, accountKey, order) => {
				d.sessionOrderByAccount[accountKey] = order;
			}
		}
	});
}

//#endregion
//#region node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
function r(e) {
	var t, f, n = "";
	if ("string" == typeof e || "number" == typeof e) n += e;
	else if ("object" == typeof e) if (Array.isArray(e)) {
		var o = e.length;
		for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
	} else for (f in e) e[f] && (n && (n += " "), n += f);
	return n;
}
function clsx() {
	for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
	return n;
}

//#endregion
//#region \0dsh-css:src/client/vendor/primitives/Button.module.css.mjs
const css$9 = ".gUHWSG_button{cursor:pointer;color:var(--dsw-alias-label-primary);background:0 0;border:none;border-radius:18px;justify-content:center;align-items:center;gap:4px;padding:0 14px;font-size:14px;line-height:22px;display:inline-flex}.gUHWSG_button:disabled{cursor:not-allowed;opacity:.4}.gUHWSG_md{height:36px}.gUHWSG_sm{border-radius:14px;height:28px;padding:0 10px;font-size:12px;line-height:18px}.gUHWSG_primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}.gUHWSG_primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}.gUHWSG_ghost:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.gUHWSG_ghost:active:not(:disabled){background:var(--dsw-alias-interactive-bg-active)}.gUHWSG_outline{border:1px solid var(--dsw-alias-border-l2);background:0 0}.gUHWSG_outline:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.gUHWSG_toolbar{background:var(--dsw-alias-button-tool-bar-fill)}.gUHWSG_toolbar:hover:not(:disabled){background:var(--dsw-alias-button-tool-bar-hover)}.gUHWSG_icon{justify-content:center;align-items:center;width:16px;height:16px;display:inline-flex}";
const tagId$9 = "dsh-multiroot-workspace/Button.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$9) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-multiroot-workspace";
	tag.dataset.pluginCss = tagId$9;
	tag.textContent = css$9;
	document.head.appendChild(tag);
}
var Button_module_css_default = {
	"button": "gUHWSG_button",
	"ghost": "gUHWSG_ghost",
	"icon": "gUHWSG_icon",
	"md": "gUHWSG_md",
	"outline": "gUHWSG_outline",
	"primary": "gUHWSG_primary",
	"sm": "gUHWSG_sm",
	"toolbar": "gUHWSG_toolbar"
};

//#endregion
//#region src/client/vendor/primitives/Button.tsx
/**
* Render a button.
* @param props.variant - visual family (default 'ghost').
* @param props.size - 'md' 36px capsule (figma Button) or 'sm' 28px compact.
* @param props.icon - optional leading 16px icon node.
* @returns the button element; native button attributes pass through.
*/
function Button({ variant = "ghost", size = "md", icon, className, children, ...rest }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
		type: "button",
		className: clsx(Button_module_css_default.button, Button_module_css_default[variant], Button_module_css_default[size], className),
		...rest,
		children: [icon != null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			className: Button_module_css_default.icon,
			children: icon
		}), children]
	});
}

//#endregion
//#region \0dsh-css:src/client/vendor/primitives/HoverCard.module.css.mjs
const css$8 = ".Aa34Xq_root{display:block;position:relative}.Aa34Xq_card{--dsw-hovercard-bg:#2c2c2e;z-index:100;box-sizing:border-box;background:var(--dsw-hovercard-bg);width:244px;box-shadow:var(--dsw-shadow-lv3);border-radius:12px;padding:12px 16px;position:fixed}.Aa34Xq_copyable{cursor:pointer}.Aa34Xq_copyable:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.Aa34Xq_feedback{justify-content:center;align-items:center;display:flex}.Aa34Xq_copied{color:#fff;text-align:center;font-size:14px;line-height:20px}.Aa34Xq_status{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}";
const tagId$8 = "dsh-multiroot-workspace/HoverCard.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$8) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-multiroot-workspace";
	tag.dataset.pluginCss = tagId$8;
	tag.textContent = css$8;
	document.head.appendChild(tag);
}
var HoverCard_module_css_default = {
	"card": "Aa34Xq_card",
	"copied": "Aa34Xq_copied",
	"copyable": "Aa34Xq_copyable",
	"feedback": "Aa34Xq_feedback",
	"root": "Aa34Xq_root",
	"status": "Aa34Xq_status"
};

//#endregion
//#region src/client/vendor/primitives/HoverCard.tsx
const POINTER_GRACE_MS$1 = 200;
function usePointerGrace$1(close) {
	const timerRef = (0, react.useRef)(null);
	const closeRef = (0, react.useRef)(close);
	closeRef.current = close;
	const cancel = (0, react.useCallback)(() => {
		if (timerRef.current === null) return;
		clearTimeout(timerRef.current);
		timerRef.current = null;
	}, []);
	const arm = (0, react.useCallback)(() => {
		cancel();
		timerRef.current = setTimeout(() => {
			timerRef.current = null;
			closeRef.current();
		}, POINTER_GRACE_MS$1);
	}, [cancel]);
	(0, react.useEffect)(() => cancel, [cancel]);
	return {
		arm,
		cancel
	};
}
async function writeClipboard(text) {
	if (navigator.clipboard?.writeText) try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
	const exec = typeof document.execCommand === "function" ? document.execCommand.bind(document) : void 0;
	if (exec === void 0) return false;
	const el = document.createElement("textarea");
	el.value = text;
	el.setAttribute("readonly", "");
	el.style.position = "fixed";
	el.style.left = "-9999px";
	document.body.appendChild(el);
	el.select();
	try {
		return exec("copy");
	} catch {
		return false;
	} finally {
		el.remove();
	}
}
/**
* Render an anchor with a hover-triggered preview card.
* @param props.anchor - the hover target (rendered in place inside a wrapper span).
* @param props.content - card content; the pointer may rest on it, so it is
* readable and selectable, but it carries no dismissal affordance of its own.
* @param props.openDelayMs - hover dwell before the card shows (default 500).
* @param props.disabled - suppress opening; turning true closes an open card.
* @param props.copyText - optional primary value copied by activation and
* included in the card's accessible name.
* @param props.copyLabel - accessible activation-label prefix (default "复制").
* @param props.copiedLabel - visible success label (default "复制成功").
* @returns anchor wrapper with the conditional portaled card.
*/
function HoverCard({ anchor, content, openDelayMs = 500, disabled = false, copyText, copyLabel = "复制", copiedLabel = "复制成功" }) {
	const rootRef = (0, react.useRef)(null);
	const cardRef = (0, react.useRef)(null);
	const timerRef = (0, react.useRef)(null);
	const copyTimerRef = (0, react.useRef)(null);
	const copyHeightRef = (0, react.useRef)(null);
	const copyEpochRef = (0, react.useRef)(0);
	const copyingRef = (0, react.useRef)(false);
	const mountedRef = (0, react.useRef)(true);
	const [open, setOpen] = (0, react.useState)(false);
	const [pos, setPos] = (0, react.useState)(null);
	const [copied, setCopied] = (0, react.useState)(false);
	const clearCopied = (0, react.useCallback)(() => {
		if (copyTimerRef.current !== null) {
			clearTimeout(copyTimerRef.current);
			copyTimerRef.current = null;
		}
		copyHeightRef.current = null;
		setCopied(false);
	}, []);
	const close = (0, react.useCallback)(() => {
		copyEpochRef.current += 1;
		clearCopied();
		setOpen(false);
	}, [clearCopied]);
	const { arm: armClose, cancel: cancelClose } = usePointerGrace$1(close);
	const clearTimer = () => {
		if (timerRef.current !== null) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	};
	(0, react.useEffect)(() => {
		if (!disabled) return;
		clearTimer();
		cancelClose();
		close();
	}, [
		disabled,
		cancelClose,
		close
	]);
	(0, react.useEffect)(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			copyEpochRef.current += 1;
			clearTimer();
			if (copyTimerRef.current !== null) {
				clearTimeout(copyTimerRef.current);
				copyTimerRef.current = null;
			}
		};
	}, []);
	(0, react.useLayoutEffect)(() => {
		if (!open) {
			setPos(null);
			return;
		}
		const place = () => {
			const wrapper = rootRef.current;
			/* v8 ignore next -- the ref is attached before the layout effect runs and the listeners die with it. */
			if (wrapper === null) return;
			const r = wrapper.getBoundingClientRect();
			const h = cardRef.current?.offsetHeight ?? 0;
			const top = r.top + h > window.innerHeight - 8 ? window.innerHeight - h - 8 : r.top;
			setPos({
				left: r.right + 8,
				top
			});
		};
		place();
		window.addEventListener("scroll", place, true);
		window.addEventListener("resize", place);
		return () => {
			window.removeEventListener("scroll", place, true);
			window.removeEventListener("resize", place);
		};
	}, [open]);
	(0, react.useLayoutEffect)(() => {
		if (!open || pos === null) return;
		/* v8 ignore next -- the card is mounted whenever pos is set, so the ref is attached here. */
		const h = cardRef.current?.offsetHeight ?? 0;
		if (pos.top + h > window.innerHeight - 8) setPos({
			left: pos.left,
			top: window.innerHeight - h - 8
		});
	}, [open, pos]);
	const copy = async (text) => {
		if (copied || copyingRef.current) return;
		copyingRef.current = true;
		const copyEpoch = copyEpochRef.current;
		const accepted = await writeClipboard(text);
		copyingRef.current = false;
		const card = cardRef.current;
		if (!accepted || !mountedRef.current || copyEpoch !== copyEpochRef.current || card === null) return;
		const height = card.offsetHeight;
		copyHeightRef.current = height > 0 ? height : null;
		setCopied(true);
		copyTimerRef.current = setTimeout(clearCopied, 1e3);
	};
	const copyable = copyText !== void 0;
	const card = open && pos !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		ref: cardRef,
		className: `${HoverCard_module_css_default.card}${copyable ? ` ${HoverCard_module_css_default.copyable}` : ""}${copied ? ` ${HoverCard_module_css_default.feedback}` : ""}`,
		style: {
			...pos,
			minHeight: copied && copyHeightRef.current !== null ? copyHeightRef.current : void 0
		},
		role: copyable ? "button" : void 0,
		tabIndex: copyable ? 0 : void 0,
		"aria-label": copyable ? `${copyLabel}: ${copyText}` : void 0,
		onClick: copyable ? (e) => {
			const selection = window.getSelection();
			if (selection !== null && !selection.isCollapsed) {
				for (let i = 0; i < selection.rangeCount; i += 1) if (selection.getRangeAt(i).intersectsNode(e.currentTarget)) return;
			}
			copy(copyText);
		} : void 0,
		onKeyDown: copyable ? (e) => {
			if (e.key !== "Enter" && e.key !== " ") return;
			e.preventDefault();
			copy(copyText);
		} : void 0,
		children: copied ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			className: HoverCard_module_css_default.copied,
			"aria-hidden": "true",
			children: copiedLabel
		}) : content
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
		ref: rootRef,
		className: HoverCard_module_css_default.root,
		onPointerEnter: () => {
			if (disabled) return;
			cancelClose();
			if (open) return;
			clearTimer();
			timerRef.current = setTimeout(() => {
				setOpen(true);
			}, openDelayMs);
		},
		onPointerLeave: () => {
			clearTimer();
			if (open) armClose();
		},
		onPointerDownCapture: (e) => {
			if (cardRef.current?.contains(e.target)) return;
			clearTimer();
			cancelClose();
			close();
		},
		children: [
			anchor,
			open && copyable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: HoverCard_module_css_default.status,
				role: "status",
				children: copied ? copiedLabel : ""
			}),
			card !== false && (0, react_dom.createPortal)(card, document.body)
		]
	});
}

//#endregion
//#region \0dsh-css:src/client/vendor/primitives/Menu.module.css.mjs
const css$7 = ".zkmvta_root{display:inline-flex;position:relative}.zkmvta_list,.zkmvta_submenu{box-sizing:border-box;border:1px solid var(--dsw-alias-border-inverted);background:var(--dsw-specific-menu);box-shadow:var(--dsw-shadow-lv3);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);border-radius:12px;flex-direction:column;gap:0;padding:4px;display:flex}.zkmvta_list{z-index:100;min-width:218px;max-width:360px;position:absolute;top:calc(100% + 4px);left:0}.zkmvta_portal{z-index:1100;position:fixed;top:auto;left:auto}.zkmvta_sideTop{top:auto;bottom:calc(100% + 4px)}.zkmvta_alignEnd{left:auto;right:0}.zkmvta_scrollable{max-height:calc(100vh - 24px)}.zkmvta_viewport{flex-direction:column;min-height:0;display:flex}.zkmvta_scrollable .zkmvta_viewport{overflow-y:auto}.zkmvta_footer{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;flex:none;margin-top:4px;padding-top:4px;display:flex}.zkmvta_itemWrap{position:relative}.zkmvta_item{cursor:pointer;width:100%;min-height:40px;color:var(--dsw-alias-label-primary);text-align:left;background:0 0;border:none;border-radius:10px;align-items:center;gap:8px;padding:8px 10px;font-size:14px;line-height:22px;display:flex}.zkmvta_item:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.zkmvta_denseList .zkmvta_item{min-height:34px;padding-block:5px}.zkmvta_denseList .zkmvta_label{padding-block:4px}.zkmvta_list.zkmvta_compactList,.zkmvta_submenu.zkmvta_compactList{border-radius:7px;min-width:164px;padding:2px}.zkmvta_compactList .zkmvta_item{border-radius:5px;gap:6px;min-height:26px;padding:3px 7px;font-size:12px;line-height:18px}.zkmvta_compactList .zkmvta_itemIcon{width:14px;height:14px}.zkmvta_compactList .zkmvta_separator{margin:2px}.zkmvta_compactList .zkmvta_label{padding:4px 7px;font-size:11px;line-height:16px}.zkmvta_item:disabled{opacity:.4;cursor:not-allowed}.zkmvta_itemIcon{width:16px;height:16px;color:var(--dsw-alias-label-tertiary);flex:none;justify-content:center;align-items:center;display:inline-flex}.zkmvta_itemLabel{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.zkmvta_check{color:var(--dsw-alias-label-primary);flex:none}.zkmvta_selected{background:0 0}.zkmvta_danger,.zkmvta_danger .zkmvta_itemIcon{color:var(--dsw-alias-state-error-primary)}.zkmvta_danger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger)}.zkmvta_label{color:var(--dsw-alias-label-tertiary);padding:8px 10px;font-size:12px;line-height:16px}.zkmvta_separator{background:var(--dsw-alias-border-l1);height:1px;margin:4px 2px}.zkmvta_submenu{z-index:101;min-width:163px;position:absolute;top:auto;bottom:-4px;left:calc(100% + 10px)}.zkmvta_submenu:before{content:\"\";width:10px;position:absolute;top:0;bottom:0;left:-10px}";
const tagId$7 = "dsh-multiroot-workspace/Menu.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$7) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-multiroot-workspace";
	tag.dataset.pluginCss = tagId$7;
	tag.textContent = css$7;
	document.head.appendChild(tag);
}
var Menu_module_css_default = {
	"alignEnd": "zkmvta_alignEnd",
	"check": "zkmvta_check",
	"compactList": "zkmvta_compactList",
	"danger": "zkmvta_danger",
	"denseList": "zkmvta_denseList",
	"footer": "zkmvta_footer",
	"item": "zkmvta_item",
	"itemIcon": "zkmvta_itemIcon",
	"itemLabel": "zkmvta_itemLabel",
	"itemWrap": "zkmvta_itemWrap",
	"label": "zkmvta_label",
	"list": "zkmvta_list",
	"portal": "zkmvta_portal",
	"root": "zkmvta_root",
	"scrollable": "zkmvta_scrollable",
	"selected": "zkmvta_selected",
	"separator": "zkmvta_separator",
	"sideTop": "zkmvta_sideTop",
	"submenu": "zkmvta_submenu",
	"viewport": "zkmvta_viewport"
};

//#endregion
//#region src/client/vendor/primitives/Menu.tsx
const POINTER_GRACE_MS = 200;
function usePointerGrace(close) {
	const timerRef = (0, react.useRef)(null);
	const closeRef = (0, react.useRef)(close);
	closeRef.current = close;
	const cancel = (0, react.useCallback)(() => {
		if (timerRef.current === null) return;
		clearTimeout(timerRef.current);
		timerRef.current = null;
	}, []);
	const arm = (0, react.useCallback)(() => {
		cancel();
		timerRef.current = setTimeout(() => {
			timerRef.current = null;
			closeRef.current();
		}, POINTER_GRACE_MS);
	}, [cancel]);
	(0, react.useEffect)(() => cancel, [cancel]);
	return {
		arm,
		cancel
	};
}
function IconCheckOutline16({ size = 16, className }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
		width: size,
		height: size,
		className,
		viewBox: "0 0 16 16",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
			d: "M15.0498 3.92579L8.49512 12.3818C8.25774 12.6881 8.04517 12.9645 7.84668 13.1689C7.63957 13.3823 7.38732 13.5841 7.04492 13.6719C6.86373 13.7183 6.6757 13.7346 6.48926 13.7197C6.13666 13.6915 5.8528 13.5355 5.6123 13.3604C5.38201 13.1926 5.12573 12.9567 4.83984 12.6953L1.03125 9.21289L1.96875 8.1875L5.77734 11.6699C6.08684 11.9529 6.27773 12.1249 6.43066 12.2363C6.50183 12.2882 6.54699 12.3135 6.57324 12.3252C6.58525 12.3305 6.59269 12.3322 6.5957 12.333C6.59802 12.3336 6.59961 12.334 6.59961 12.334C6.63317 12.3367 6.66758 12.3335 6.7002 12.3252C6.7002 12.3252 6.70211 12.3251 6.7041 12.3242C6.70698 12.3229 6.71348 12.319 6.72461 12.3115C6.74849 12.2956 6.78843 12.2642 6.84961 12.2012C6.98138 12.0654 7.13957 11.8628 7.39648 11.5313L13.9502 3.07422L15.0498 3.92579Z",
			fill: "currentColor"
		})
	});
}
function isSeparator(entry) {
	return "type" in entry && entry.type === "separator";
}
function isLabel(entry) {
	return "type" in entry && entry.type === "label";
}
/** Unplaced portal list: hidden but laid out at a fixed origin so offsetWidth/offsetHeight are real. */
const MEASURE_STYLE = {
	visibility: "hidden",
	left: 0,
	top: 0
};
/**
* Render an anchored dropdown menu.
* @param props.open - whether the list is showing (owner-controlled).
* @param props.anchor - the trigger element (rendered in place).
* @param props.items - selectable rows and optional separators.
* @param props.selectedId - row shown as selected.
* @param props.selectedIds - rows shown as selected when a menu contains independent option groups.
* @param props.onSelect - row click callback (not called for disabled rows or submenu parents that only open children).
* @param props.onClose - invoked on outside click or Escape.
* @param props.align - list alignment against the anchor (default 'start').
* @param props.side - open below (`bottom`, default) or above (`top`) the anchor.
* @param props.portal - render the list into document.body, fixed-positioned
* from the anchor rect (repositions on scroll/resize while open). Use when an
* ancestor's overflow clipping would crop the in-place list; default false
* keeps the pure-CSS in-place behavior.
* @param props.closeOnPointerLeave - close the list once the pointer has left
* both trigger and list for the pointer grace (default false keeps it open
* until outside click/Escape/selection). The grace makes the 4px trigger->list
* gap and a brief overshoot survivable; coming back cancels the close.
* @param props.dense - reduce vertical row spacing without changing the standard typography or card width.
* @param props.compact - use reduced menu typography and spacing.
* @param props.getAnchorRect - portal mode only: supply the anchor rect
* directly (e.g. from a host-owned trigger button) instead of measuring the
* Menu's own wrapper span. Required when the wrapper isn't itself laid out at
* the trigger (render-prop anchors, effect-positioned proxies — measuring the
* wrapper there races the host's layout effects). Called on open and on every
* scroll/resize; return null to skip placement for that frame.
* @param props.footer - rows pinned below the scrolling items area, separated
* by a hairline; they stay visible while the items above scroll.
* @returns anchor wrapper with the conditional list.
*/
function Menu({ open, anchor, items, selectedId, selectedIds, onSelect, onClose, align = "start", side = "bottom", portal = false, closeOnPointerLeave = false, dense = false, compact = false, getAnchorRect, footer, className }) {
	const rootRef = (0, react.useRef)(null);
	const listRef = (0, react.useRef)(null);
	const [openSubmenuId, setOpenSubmenuId] = (0, react.useState)(null);
	const [fixedPos, setFixedPos] = (0, react.useState)(null);
	const { arm: armClose, cancel: cancelClose } = usePointerGrace(onClose);
	(0, react.useLayoutEffect)(() => {
		if (!open || !portal) {
			setFixedPos(null);
			return;
		}
		const place = () => {
			let r;
			if (getAnchorRect !== void 0) r = getAnchorRect();
			else
 /* v8 ignore next 2 -- the ref is attached before the layout effect runs and the listeners die with it. */
			r = rootRef.current?.getBoundingClientRect() ?? null;
			if (r === null) return;
			const MARGIN = 12;
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const listEl = listRef.current;
			const lw = listEl?.offsetWidth ?? 0;
			const lh = listEl?.offsetHeight ?? 0;
			let x;
			let y;
			if (side === "right") {
				x = r.right + 4;
				y = r.top;
			} else if (align === "start") {
				x = r.left;
				y = side === "bottom" ? r.bottom + 4 : r.top - lh - 4;
			} else {
				x = r.right - lw;
				y = side === "bottom" ? r.bottom + 4 : r.top - lh - 4;
			}
			if (lw > 0) x = Math.min(Math.max(x, MARGIN), vw - lw - MARGIN);
			if (lh > 0) y = Math.min(Math.max(y, MARGIN), vh - lh - MARGIN);
			setFixedPos({
				left: x,
				top: y
			});
		};
		place();
		window.addEventListener("scroll", place, true);
		window.addEventListener("resize", place);
		return () => {
			window.removeEventListener("scroll", place, true);
			window.removeEventListener("resize", place);
		};
	}, [
		open,
		portal,
		align,
		side,
		getAnchorRect
	]);
	(0, react.useEffect)(() => {
		if (!open) {
			setOpenSubmenuId(null);
			return;
		}
		const onPointerDown = (e) => {
			if (!(e.target instanceof Node)) return;
			if (rootRef.current?.contains(e.target) === true) return;
			if (listRef.current?.contains(e.target) === true) return;
			onClose();
		};
		const onKeyDown = (e) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open, onClose]);
	(0, react.useEffect)(() => {
		if (!open) cancelClose();
	}, [open, cancelClose]);
	const scrollable = !items.some((entry) => !isSeparator(entry) && !isLabel(entry) && entry.submenu !== void 0 && entry.submenu.length > 0);
	const renderEntry = (entry) => {
		if (isSeparator(entry)) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: Menu_module_css_default.separator,
			role: "separator"
		}, entry.id);
		if (isLabel(entry)) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: Menu_module_css_default.label,
			role: "presentation",
			children: entry.text
		}, entry.id);
		const hasSub = entry.submenu !== void 0 && entry.submenu.length > 0;
		const subOpen = hasSub && openSubmenuId === entry.id;
		const selected = entry.id === selectedId || selectedIds?.includes(entry.id) === true;
		return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: Menu_module_css_default.itemWrap,
			onMouseEnter: () => {
				setOpenSubmenuId(hasSub ? entry.id : null);
			},
			onMouseLeave: () => {
				setOpenSubmenuId(null);
			},
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				role: "menuitem",
				className: clsx(Menu_module_css_default.item, selected && Menu_module_css_default.selected, entry.danger === true && Menu_module_css_default.danger),
				disabled: entry.disabled,
				"aria-haspopup": hasSub ? "menu" : void 0,
				"aria-expanded": hasSub ? subOpen : void 0,
				onFocus: () => {
					setOpenSubmenuId(hasSub ? entry.id : null);
				},
				onClick: () => {
					if (hasSub) {
						setOpenSubmenuId(entry.id);
						return;
					}
					onSelect(entry.id);
				},
				children: [
					entry.icon !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: Menu_module_css_default.itemIcon,
						children: entry.icon
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: Menu_module_css_default.itemLabel,
						children: entry.label
					}),
					selected && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconCheckOutline16, { className: Menu_module_css_default.check })
				]
			}), subOpen && entry.submenu !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: clsx(Menu_module_css_default.submenu, compact && Menu_module_css_default.compactList),
				role: "menu",
				children: entry.submenu.map((sub) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					role: "menuitem",
					className: Menu_module_css_default.item,
					disabled: sub.disabled,
					onClick: () => {
						onSelect(sub.id);
					},
					children: [sub.icon !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: Menu_module_css_default.itemIcon,
						children: sub.icon
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: Menu_module_css_default.itemLabel,
						children: sub.label
					})]
				}, sub.id))
			})]
		}, entry.id);
	};
	const list = open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		ref: listRef,
		className: clsx(Menu_module_css_default.list, dense && Menu_module_css_default.denseList, compact && Menu_module_css_default.compactList, scrollable && Menu_module_css_default.scrollable, portal && Menu_module_css_default.portal, side === "top" && !portal && Menu_module_css_default.sideTop, align === "end" && !portal && Menu_module_css_default.alignEnd),
		style: portal ? fixedPos ?? MEASURE_STYLE : void 0,
		role: "menu",
		onClick: (e) => {
			e.stopPropagation();
		},
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: Menu_module_css_default.viewport,
			role: "presentation",
			children: items.map(renderEntry)
		}), footer !== void 0 && footer.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: Menu_module_css_default.footer,
			role: "presentation",
			children: footer.map(renderEntry)
		})]
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
		ref: rootRef,
		className: clsx(Menu_module_css_default.root, className),
		onPointerEnter: closeOnPointerLeave ? cancelClose : void 0,
		onPointerLeave: closeOnPointerLeave ? () => {
			if (open) armClose();
		} : void 0,
		children: [anchor, portal ? list !== false && (0, react_dom.createPortal)(list, document.body) : list]
	});
}

//#endregion
//#region \0dsh-css:src/client/vendor/primitives/Modal.module.css.mjs
const css$6 = "._8zW_HG_root{z-index:1000;justify-content:center;align-items:center;padding:24px;display:flex;position:fixed;inset:0}._8zW_HG_mask{background:var(--dsw-alias-bg-mask-1);backdrop-filter:var(--dsw-mask-blur);position:absolute;inset:0}._8zW_HG_dialog{z-index:1;border:1px solid var(--dsw-alias-border-inverted);background:var(--dsw-alias-bg-layer-2);width:min(380px,100%);box-shadow:var(--dsw-shadow-lv3);border-radius:24px;flex-direction:column;gap:20px;padding:0 0 24px;display:flex;position:relative;overflow:hidden}._8zW_HG_content{flex-direction:column;width:100%;display:flex}._8zW_HG_header{justify-content:space-between;align-items:center;gap:8px;padding:22px 14px 12px 24px;display:flex}._8zW_HG_title{color:var(--dsw-alias-label-primary);margin:0;font-size:16px;font-weight:500;line-height:24px}._8zW_HG_close{cursor:pointer;width:28px;height:28px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:8px;flex:none;justify-content:center;align-items:center;display:inline-flex}._8zW_HG_close:hover{background:var(--dsw-alias-interactive-bg-hover)}._8zW_HG_description{color:var(--dsw-alias-label-primary);margin:0;padding:0 24px;font-size:14px;font-weight:400;line-height:22px}._8zW_HG_body{flex-direction:column;min-width:0;margin-top:20px;padding:0 24px;display:flex}._8zW_HG_footer{justify-content:flex-end;align-items:center;gap:8px;padding:0 24px;display:flex}";
const tagId$6 = "dsh-multiroot-workspace/Modal.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$6) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-multiroot-workspace";
	tag.dataset.pluginCss = tagId$6;
	tag.textContent = css$6;
	document.head.appendChild(tag);
}
var Modal_module_css_default = {
	"body": "_8zW_HG_body",
	"close": "_8zW_HG_close",
	"content": "_8zW_HG_content",
	"description": "_8zW_HG_description",
	"dialog": "_8zW_HG_dialog",
	"footer": "_8zW_HG_footer",
	"header": "_8zW_HG_header",
	"mask": "_8zW_HG_mask",
	"root": "_8zW_HG_root",
	"title": "_8zW_HG_title"
};

//#endregion
//#region src/client/vendor/primitives/Modal.tsx
function IconCloseOutline16({ size = 16, className }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
		width: size,
		height: size,
		className,
		viewBox: "0 0 16 16",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
			d: "M14.1168 13.197L13.197 14.1167L1.8833 2.80303L2.80309 1.88324L14.1168 13.197Z",
			fill: "currentColor"
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
			d: "M13.197 1.88326L14.1168 2.80305L2.80309 14.1168L1.8833 13.197L13.197 1.88326Z",
			fill: "currentColor"
		})]
	});
}
/**
* Render a centered modal over a blurred page mask.
* @param props.open - whether the dialog is showing.
* @param props.onClose - Escape or mask click.
* @param props.title - dialog heading (aria-label in every mode).
* @param props.closeLabel - accessible close-button label.
* @param props.description - optional supporting sentence under the title.
* @param props.children - body (inputs, etc.).
* @param props.footer - action row (Cancel / Create).
* @param props.contentClassName - optional class for a scrollable content region.
* @param props.headless - render children directly in the card (no default
* header/close/body chrome) for dialogs whose figma frame owns its own
* header structure; mask, card, Escape, and aria-label remain.
* @param props.closeLabel - close-button aria label; the owner passes
* localized copy (this package is cordis-free, so copy arrives via props).
* @returns null when closed; otherwise the overlay tree.
*/
function Modal({ open, onClose, title, closeLabel = "Close", description, children, footer, className, contentClassName, headless = false }) {
	(0, react.useEffect)(() => {
		if (!open) return;
		const onKeyDown = (e) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open, onClose]);
	if (!open) return null;
	return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: Modal_module_css_default.root,
		role: "presentation",
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: Modal_module_css_default.mask,
			"aria-hidden": "true",
			onClick: onClose
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: clsx(Modal_module_css_default.dialog, className),
			role: "dialog",
			"aria-modal": "true",
			"aria-label": title,
			children: headless ? children : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: clsx(Modal_module_css_default.content, contentClassName),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: Modal_module_css_default.header,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
							className: Modal_module_css_default.title,
							children: title
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: Modal_module_css_default.close,
							"aria-label": closeLabel,
							onClick: onClose,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconCloseOutline16, { size: 14 })
						})]
					}),
					description !== void 0 && description !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: Modal_module_css_default.description,
						children: description
					}),
					children !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: Modal_module_css_default.body,
						children
					})
				]
			}), footer !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: Modal_module_css_default.footer,
				children: footer
			})] })
		})]
	}), document.body);
}

//#endregion
//#region \0dsh-css:src/client/vendor/primitives/StateDot.module.css.mjs
const css$5 = ".K5AuJa_dot,.K5AuJa_matrix{--dsh-state-ongoing:var(--dsw-static-deepseek-450)}.K5AuJa_dot{flex:none;display:inline-block;position:relative}.K5AuJa_dot:before{content:\"\";opacity:.1;background:currentColor;border-radius:50%;position:absolute;inset:0}.K5AuJa_dot:after{content:\"\";background:currentColor;border-radius:50%;position:absolute;inset:20%}.K5AuJa_dot[data-state=done]{color:var(--dsw-alias-state-success-primary)}.K5AuJa_dot[data-state=warning]{color:var(--dsw-alias-state-warn-primary)}.K5AuJa_dot[data-state=error]{color:var(--dsw-alias-state-error-primary)}.K5AuJa_matrix{color:var(--dsh-state-ongoing);flex:none}.K5AuJa_cell{fill:currentColor;opacity:.15;animation:1s infinite K5AuJa_dsh-state-dot-chase}@keyframes K5AuJa_dsh-state-dot-chase{0%,12.4%{opacity:1}12.5%,24.9%{opacity:.6}25%,37.4%{opacity:.35}37.5%,to{opacity:.15}}";
const tagId$5 = "dsh-multiroot-workspace/StateDot.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$5) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-multiroot-workspace";
	tag.dataset.pluginCss = tagId$5;
	tag.textContent = css$5;
	document.head.appendChild(tag);
}
var StateDot_module_css_default = {
	"cell": "K5AuJa_cell",
	"dot": "K5AuJa_dot",
	"dsh-state-dot-chase": "K5AuJa_dsh-state-dot-chase",
	"matrix": "K5AuJa_matrix"
};

//#endregion
//#region src/client/vendor/primitives/StateDot.tsx
/** Outer 3x3 matrix cells (2px pixels on a 10px grid), clockwise from top-left. */
const MATRIX_CELLS = [
	[0, 0],
	[4, 0],
	[8, 0],
	[8, 4],
	[8, 8],
	[4, 8],
	[0, 8],
	[0, 4]
];
/**
* Render a state dot.
* @param props.state - which of the four states to show.
* @param props.size - outer diameter in px (default 10, the figma size).
* @param props.className - extra class for layout placement.
* @returns the dot element (aria-hidden; pair with text for accessibility).
*/
function StateDot({ state, size = 10, className }) {
	if (state === "ongoing") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
		className: clsx(StateDot_module_css_default.matrix, className),
		"data-state": "ongoing",
		width: size,
		height: size,
		viewBox: "0 0 10 10",
		shapeRendering: "crispEdges",
		"aria-hidden": "true",
		children: MATRIX_CELLS.map(([x, y], index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
			className: StateDot_module_css_default.cell,
			x,
			y,
			width: "2",
			height: "2",
			style: { animationDelay: `${(index - MATRIX_CELLS.length) * 125}ms` }
		}, `${x}-${y}`))
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
		className: clsx(StateDot_module_css_default.dot, className),
		"data-state": state,
		style: {
			width: size,
			height: size
		},
		"aria-hidden": "true"
	});
}

//#endregion
//#region \0dsh-css:src/client/vendor/primitives/Tooltip.module.css.mjs
const css$4 = ".f5y1-G_bubble{z-index:100;background:var(--dsw-alias-tooltip-bg);width:max-content;max-width:50vw;color:var(--dsw-static-neutral-bluish-00);white-space:pre-line;overflow-wrap:break-word;pointer-events:none;animation:f5y1-G_tooltip-in .15s var(--ds-ease-in-out);border-radius:8px;padding:3px 7px;font-size:13px;line-height:20px;position:fixed}.f5y1-G_bubble[data-side=right]{transform:translateY(-50%)}.f5y1-G_bubble[data-side=bottom]{transform:translate(-50%)}.f5y1-G_bubble[data-side=top]{transform:translate(-50%,-100%)}@keyframes f5y1-G_tooltip-in{0%{opacity:0}}@media (prefers-reduced-motion:reduce){.f5y1-G_bubble{animation:none}}";
const tagId$4 = "dsh-multiroot-workspace/Tooltip.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-multiroot-workspace";
	tag.dataset.pluginCss = tagId$4;
	tag.textContent = css$4;
	document.head.appendChild(tag);
}
var Tooltip_module_css_default = {
	"bubble": "f5y1-G_bubble",
	"tooltip-in": "f5y1-G_tooltip-in"
};

//#endregion
//#region src/client/vendor/primitives/Tooltip.tsx
/**
* Attach a hover/focus tooltip to an anchor element.
* @param props.label - bubble text, or a resolver evaluated only while the bubble is visible.
* @param props.side - placement relative to the anchor (default 'right').
* @param props.delayMs - hover delay in milliseconds; keyboard focus remains immediate.
* @param props.disabled - suppress the bubble while true; the anchor renders identically so
* toggling never remounts it (which would cut its CSS transitions).
* @param props.maxWidth - bubble width cap in pixels, for labels long enough that the default
* half-viewport cap would render a slab wider than the surface the anchor sits on.
* @param props.children - a single anchor element; its own ref (callback or object) is forwarded alongside the tooltip's.
* @returns the cloned anchor plus a fixed-position bubble while hovered/focused.
*/
function Tooltip({ label, side = "right", delayMs = 0, disabled = false, maxWidth, children }) {
	const anchor = (0, react.useRef)(null);
	const childRef = children.ref;
	const mergedRef = (0, react.useCallback)((el) => {
		anchor.current = el;
		if (typeof childRef === "function") childRef(el);
		else if (childRef != null) childRef.current = el;
	}, [childRef]);
	const [pos, setPos] = (0, react.useState)(null);
	const [placement, setPlacement] = (0, react.useState)(side);
	const bubble = (0, react.useRef)(null);
	const resolvedLabel = pos === null ? null : typeof label === "function" ? label() : label;
	const y = pos === null ? 0 : placement === "right" ? pos.top + (pos.bottom - pos.top) / 2 : placement === "top" ? pos.top - 8 : pos.bottom + 8;
	const EDGE_MARGIN = 12;
	(0, react.useLayoutEffect)(() => {
		if (pos === null) return;
		const fit = () => {
			const el = bubble.current;
			/* v8 ignore next -- pos is set only while the bubble is mounted. */
			if (el === null) return;
			el.style.left = `${pos.x}px`;
			const r = el.getBoundingClientRect();
			let dx = 0;
			if (r.right > window.innerWidth - EDGE_MARGIN) dx = window.innerWidth - EDGE_MARGIN - r.right;
			if (r.left + dx < EDGE_MARGIN) dx = EDGE_MARGIN - r.left;
			el.style.left = `${pos.x + dx}px`;
			if (side === "right") return;
			const fitsBelow = pos.bottom + 8 + r.height <= window.innerHeight - EDGE_MARGIN;
			const fitsAbove = pos.top - 8 - r.height >= EDGE_MARGIN;
			if (placement === "bottom" && !fitsBelow && fitsAbove) setPlacement("top");
			if (placement === "top" && !fitsAbove && fitsBelow) setPlacement("bottom");
		};
		fit();
		window.addEventListener("resize", fit);
		return () => {
			window.removeEventListener("resize", fit);
		};
	}, [
		placement,
		pos,
		resolvedLabel,
		side
	]);
	const showTimer = (0, react.useRef)(null);
	const triggers = (0, react.useRef)({
		hover: false,
		focus: false
	});
	const cancelShow = (0, react.useCallback)(() => {
		if (showTimer.current === null) return;
		clearTimeout(showTimer.current);
		showTimer.current = null;
	}, []);
	(0, react.useEffect)(() => {
		if (disabled) {
			cancelShow();
			triggers.current = {
				hover: false,
				focus: false
			};
			setPos(null);
		}
		return cancelShow;
	}, [cancelShow, disabled]);
	const show = () => {
		if (disabled) return;
		const el = anchor.current;
		/* v8 ignore next -- the ref is attached by event time: events fire on the cloned anchor. */
		if (el === null) return;
		const r = el.getBoundingClientRect();
		setPlacement(side);
		setPos({
			x: side === "right" ? r.right + 10 : r.left + r.width / 2,
			top: r.top,
			bottom: r.bottom
		});
	};
	const showAfterHoverDelay = () => {
		cancelShow();
		if (delayMs <= 0) {
			show();
			return;
		}
		showTimer.current = setTimeout(() => {
			showTimer.current = null;
			show();
		}, delayMs);
	};
	const hide = () => {
		cancelShow();
		if (!triggers.current.hover && !triggers.current.focus) setPos(null);
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react.cloneElement)(children, {
		ref: mergedRef,
		onMouseEnter: (e) => {
			children.props.onMouseEnter?.(e);
			triggers.current.hover = true;
			showAfterHoverDelay();
		},
		onMouseLeave: (e) => {
			children.props.onMouseLeave?.(e);
			triggers.current.hover = false;
			cancelShow();
			setPos(null);
		},
		onFocus: (e) => {
			children.props.onFocus?.(e);
			triggers.current.focus = true;
			cancelShow();
			show();
		},
		onBlur: (e) => {
			children.props.onBlur?.(e);
			triggers.current.focus = false;
			hide();
		}
	}), pos !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
		ref: bubble,
		className: Tooltip_module_css_default.bubble,
		"data-side": placement,
		style: {
			left: pos.x,
			top: y,
			...maxWidth === void 0 ? {} : { maxWidth }
		},
		role: "tooltip",
		children: resolvedLabel
	})] });
}

//#endregion
//#region src/client/vendor/primitives/icons.tsx
/** ic_ds_archive_outline_20 (figma extract): lidded box + label slot. The export's
*  0.11px stroke ring around the box contour is dropped — it restates the same
*  contour in the same ink, which currentColor already carries. */
const IconArchiveOutline20 = ({ size = 20, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
	width: size,
	height: size,
	className,
	viewBox: "0 0 20 20",
	fill: "none",
	xmlns: "http://www.w3.org/2000/svg",
	children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
		fillRule: "evenodd",
		clipRule: "evenodd",
		d: "M15.8659 2.05975C17.2603 2.05995 18.3913 3.19096 18.3914 4.58527V5.4874C18.3914 6.02747 18.2192 6.52672 17.9303 6.93735C17.9336 6.96524 17.9388 6.99318 17.9388 7.02195V12.8884C17.9388 13.6345 17.9395 14.2379 17.8996 14.7254C17.8642 15.1593 17.7936 15.5499 17.6373 15.9141L17.5654 16.0685C17.278 16.6328 16.8405 17.1046 16.3038 17.434L16.0679 17.5661C15.66 17.7739 15.2196 17.8598 14.7237 17.9003C14.2362 17.9401 13.6327 17.9405 12.8867 17.9405H7.11122C6.36511 17.9405 5.76171 17.9401 5.27418 17.9003C4.84051 17.8649 4.44949 17.7952 4.08545 17.6391L3.93104 17.5661C3.36673 17.2785 2.89392 16.8414 2.56465 16.3044L2.43245 16.0685C2.22473 15.6608 2.13878 15.2211 2.09825 14.7254C2.05841 14.2379 2.05912 13.6345 2.05912 12.8884V7.02195C2.05912 6.99284 2.06422 6.96449 2.06758 6.93629C1.77931 6.52592 1.60858 6.02687 1.60858 5.4874V4.58527C1.60876 3.19084 2.73962 2.05975 4.1341 2.05975H15.8659ZM16.4984 7.92936C16.296 7.98169 16.0847 8.01288 15.8659 8.01291H4.1341C3.91478 8.01291 3.70246 7.98194 3.49955 7.92936V12.8884C3.49955 13.6582 3.50053 14.1927 3.53445 14.608C3.56769 15.0146 3.62923 15.244 3.71635 15.415L3.7925 15.5514C3.98339 15.8627 4.25749 16.1165 4.58464 16.2833L4.72529 16.3435C4.88095 16.3993 5.08638 16.4402 5.39158 16.4651C5.80685 16.4991 6.34138 16.5001 7.11122 16.5001H12.8867C13.6564 16.5001 14.1911 16.499 14.6063 16.4651C15.0128 16.432 15.2423 16.3703 15.4133 16.2833L15.5508 16.2061C15.8618 16.0152 16.116 15.7419 16.2827 15.415L16.3429 15.2732C16.3985 15.1177 16.4396 14.9128 16.4645 14.608C16.4985 14.1927 16.4984 13.6583 16.4984 12.8884V7.92936ZM4.1341 3.50019C3.53511 3.50019 3.0492 3.98631 3.04902 4.58527V5.4874C3.04902 6.08649 3.535 6.57248 4.1341 6.57248H15.8659C16.4648 6.57228 16.951 6.08638 16.951 5.4874V4.58527C16.9509 3.98644 16.4647 3.50038 15.8659 3.50019H4.1341Z",
		fill: "currentColor"
	}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
		d: "M12.7962 12.5661V11.0832H7.20548V12.5661L12.7962 12.5661Z",
		fill: "currentColor"
	})]
});
/** ic_ds_branch_outline_16 */
const IconBranchOutline16 = ({ size = 16, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
	width: size,
	height: size,
	className,
	viewBox: "0 0 16 16",
	fill: "none",
	xmlns: "http://www.w3.org/2000/svg",
	children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
		fillRule: "evenodd",
		clipRule: "evenodd",
		d: "M13.0762 1.37207C14.0846 1.37228 14.9021 2.19077 14.9023 3.19922C14.9022 4.20772 14.0847 5.02518 13.0762 5.02539C12.2967 5.02539 11.6325 4.53691 11.3701 3.84961H4.35547C4.79397 4.26458 5.15861 4.7644 5.41699 5.33496L7.10645 9.06738C7.88526 10.7875 9.55104 11.9228 11.4189 12.0371C11.7085 11.4109 12.3411 10.9756 13.0762 10.9756C14.0843 10.9759 14.9023 11.7936 14.9023 12.8018C14.9023 13.81 14.0843 14.6277 13.0762 14.6279C12.2534 14.6279 11.5574 14.0832 11.3291 13.335C8.9868 13.1879 6.89981 11.7612 5.92285 9.60352L4.23242 5.87109C3.67503 4.64033 2.44878 3.84961 1.09766 3.84961V2.54883C1.10665 2.54883 1.11601 2.54975 1.125 2.5498L11.3701 2.54883C11.6326 1.86151 12.2969 1.37207 13.0762 1.37207ZM13.0762 12.2764C12.7858 12.2764 12.5508 12.5114 12.5508 12.8018C12.5508 13.0921 12.7858 13.3281 13.0762 13.3281C13.3664 13.3279 13.6025 13.092 13.6025 12.8018C13.6025 12.5115 13.3664 12.2766 13.0762 12.2764ZM13.0762 2.67285C12.7855 2.67285 12.55 2.90861 12.5498 3.19922C12.5499 3.48987 12.7855 3.72559 13.0762 3.72559C13.3667 3.72538 13.6024 3.48975 13.6025 3.19922C13.6023 2.90874 13.3666 2.67306 13.0762 2.67285Z",
		fill: "currentColor"
	})
});
/** ic_ds_close_fill_14 */
const IconCloseFill14 = ({ size = 14, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
	width: size,
	height: size,
	className,
	viewBox: "0 0 14 14",
	fill: "none",
	xmlns: "http://www.w3.org/2000/svg",
	children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
		d: "M10.6074 4.40278L8.00975 6.99973L10.6074 9.59739L9.59736 10.6074L6.9997 8.00978L4.40274 10.6074L3.3927 9.59739L5.98966 6.99973L3.3927 4.40278L4.40274 3.39273L6.9997 5.98969L9.59736 3.39273L10.6074 4.40278Z",
		fill: "currentColor"
	})
});
/** ic_ds_edit_outline_16 */
const IconEditOutline16 = ({ size = 16, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
	width: size,
	height: size,
	className,
	viewBox: "0 0 16 16",
	fill: "none",
	xmlns: "http://www.w3.org/2000/svg",
	children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
		d: "M9.94076 1.34942C10.7047 0.90231 11.6503 0.902415 12.4143 1.34942C12.7061 1.52015 12.9688 1.79118 13.3104 2.13284C13.6521 2.47448 13.9231 2.73721 14.0939 3.02894C14.5408 3.79294 14.5409 4.73856 14.0939 5.50251C13.9231 5.79415 13.652 6.05704 13.3104 6.39861L6.65932 13.0497C6.28068 13.4284 6.00695 13.7108 5.66543 13.9097C5.32391 14.1085 4.94315 14.2074 4.42705 14.3498L3.24394 14.6761C2.77527 14.8054 2.34538 14.9262 2.00131 14.9684C1.65196 15.0112 1.17964 15.0013 0.810764 14.6325C0.441921 14.2637 0.432107 13.7913 0.47486 13.442C0.517035 13.0979 0.6379 12.668 0.767181 12.1993L1.09352 11.0162C1.23588 10.5001 1.33481 10.1193 1.5336 9.77784C1.7325 9.43632 2.0149 9.1626 2.39355 8.78395L9.04466 2.13284C9.38625 1.79126 9.64911 1.52016 9.94076 1.34942ZM15.5427 14.8398H7.55223L8.96707 13.425H15.5427V14.8398ZM3.39382 9.78422C2.965 10.213 2.84244 10.3436 2.75709 10.49C2.67183 10.6366 2.61862 10.8079 2.45733 11.3925L2.13099 12.5756C2.00183 13.0439 1.92194 13.3419 1.88863 13.5536C2.10041 13.5204 2.39872 13.4416 2.86764 13.3123L4.05075 12.9859C4.63544 12.8246 4.80669 12.7715 4.95323 12.6862C5.09968 12.6008 5.23022 12.4783 5.65905 12.0494L10.721 6.98644L8.45577 4.72121L3.39382 9.78422ZM11.7 2.57079C11.3774 2.38198 10.9777 2.38198 10.6551 2.57079C10.5602 2.62647 10.4487 2.72931 10.0449 3.13311L9.45604 3.72094L11.7213 5.98617L12.3102 5.39833C12.7139 4.99457 12.8168 4.88307 12.8725 4.78818C13.0613 4.46561 13.0612 4.06585 12.8725 3.74326C12.8169 3.64827 12.7146 3.53752 12.3102 3.13311C11.9057 2.72863 11.795 2.6264 11.7 2.57079Z",
		fill: "currentColor"
	})
});
/** ic_ds_ellipsis_outline_16 */
const IconEllipsisOutline16 = ({ size = 16, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
	width: size,
	height: size,
	className,
	viewBox: "0 0 16 16",
	fill: "none",
	xmlns: "http://www.w3.org/2000/svg",
	children: [
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
			d: "M4.55146 8.00001C4.55146 8.63513 4.03659 9.15001 3.40146 9.15001C2.76634 9.15001 2.25146 8.63513 2.25146 8.00001C2.25146 7.36488 2.76634 6.85001 3.40146 6.85001C4.03659 6.85001 4.55146 7.36488 4.55146 8.00001Z",
			fill: "currentColor"
		}),
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
			d: "M9.1476 8.00001C9.1476 8.63513 8.63273 9.15001 7.9976 9.15001C7.36248 9.15001 6.8476 8.63513 6.8476 8.00001C6.8476 7.36488 7.36248 6.85001 7.9976 6.85001C8.63273 6.85001 9.1476 7.36488 9.1476 8.00001Z",
			fill: "currentColor"
		}),
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
			d: "M13.7486 8.00001C13.7486 8.63513 13.2338 9.15001 12.5986 9.15001C11.9635 9.15001 11.4486 8.63513 11.4486 8.00001C11.4486 7.36488 11.9635 6.85001 12.5986 6.85001C13.2338 6.85001 13.7486 7.36488 13.7486 8.00001Z",
			fill: "currentColor"
		})
	]
});
/** folder_close_16 (figma extract) */
const IconFolderClose16 = ({ size = 16, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
	width: size,
	height: size,
	className,
	viewBox: "0 0 16 16",
	fill: "none",
	children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
		transform: "translate(1.5 2.429)",
		d: "M5.05582 0.518756L4.50669 0.86654L5.05582 0.518756ZM13 9.4837L13.65 9.4837L13.65 3.53962L13 3.53962L12.35 3.53962L12.35 9.4837L13 9.4837ZM11.3264 1.86603L11.3264 1.21603L6.52313 1.21603L6.52313 1.86603L6.52313 2.51603L11.3264 2.51603L11.3264 1.86603ZM5.58054 1.34727L6.12968 0.999489L5.60495 0.170972L5.05582 0.518756L4.50669 0.86654L5.03141 1.69506L5.58054 1.34727ZM4.11323 1.23058e-13L4.11323 -0.65L1.67359 -0.65L1.67359 5.00699e-14L1.67359 0.65L4.11323 0.65L4.11323 1.23058e-13ZM0 1.67359L-0.65 1.67359L-0.65 9.4837L0 9.4837L0.65 9.4837L0.65 1.67359L0 1.67359ZM11.3264 11.1573L11.3264 10.5073L1.67359 10.5073L1.67359 11.1573L1.67359 11.8073L11.3264 11.8073L11.3264 11.1573ZM0 9.4837L-0.65 9.4837C-0.65 10.767 0.390308 11.8073 1.67359 11.8073L1.67359 11.1573L1.67359 10.5073C1.10828 10.5073 0.65 10.049 0.65 9.4837L0 9.4837ZM1.67359 5.00699e-14L1.67359 -0.65C0.390307 -0.65 -0.65 0.390309 -0.65 1.67359L0 1.67359L0.65 1.67359C0.65 1.10828 1.10828 0.65 1.67359 0.65L1.67359 5.00699e-14ZM5.05582 0.518756L5.60495 0.170972C5.28121 -0.340193 4.71829 -0.65 4.11323 -0.65L4.11323 1.23058e-13L4.11323 0.65C4.27282 0.65 4.4213 0.731715 4.50669 0.86654L5.05582 0.518756ZM6.52313 1.86603L6.52313 1.21603C6.36354 1.21603 6.21507 1.13431 6.12968 0.999489L5.58054 1.34727L5.03141 1.69506C5.35515 2.20622 5.91808 2.51603 6.52313 2.51603L6.52313 1.86603ZM13 3.53962L13.65 3.53962C13.65 2.25634 12.6097 1.21603 11.3264 1.21603L11.3264 1.86603L11.3264 2.51603C11.8917 2.51603 12.35 2.97431 12.35 3.53962L13 3.53962ZM13 9.4837L12.35 9.4837C12.35 10.049 11.8917 10.5073 11.3264 10.5073L11.3264 11.1573L11.3264 11.8073C12.6097 11.8073 13.65 10.767 13.65 9.4837L13 9.4837Z",
		fill: "currentColor"
	})
});
/** folder_open_16 (figma extract): outline at full ink + 20%-opacity inner fill riding the same currentColor. */
const IconFolderOpen16 = ({ size = 16, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
	width: size,
	height: size,
	className,
	viewBox: "0 0 16 16",
	fill: "none",
	children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
		d: "M5.19629 1.57104C5.81144 1.5711 6.38623 1.8786 6.72754 2.39038L7.19922 3.09839C7.28454 3.22635 7.42824 3.30344 7.58203 3.30347H12.1699C13.5039 3.30348 14.5859 4.38548 14.5859 5.71948V6.62671C15.2694 7.02689 15.6605 7.85012 15.4385 8.68726L14.3848 12.658C14.1037 13.7164 13.1449 14.4527 12.0498 14.4529H2.91699C1.51651 14.4529 0.451662 13.2814 0.501954 11.9519V3.98706C0.501954 2.65305 1.58396 1.57104 2.91797 1.57104H5.19629ZM3.7793 7.75562C3.30994 7.75562 2.89883 8.07153 2.77832 8.52515L1.91602 11.7722C1.74167 12.4291 2.23734 13.073 2.91699 13.073H12.0498C12.5191 13.0728 12.9304 12.757 13.0508 12.3035L14.1045 8.33374C14.1819 8.04202 13.9619 7.756 13.6602 7.75562H3.7793ZM2.91797 2.9519C2.34625 2.9519 1.88281 3.41534 1.88281 3.98706V7.2937C2.33068 6.7269 3.02249 6.37476 3.7793 6.37476H13.2051V5.71948C13.2051 5.14777 12.7416 4.68434 12.1699 4.68433H7.58203C6.96675 4.6843 6.39209 4.37595 6.05078 3.86401L5.5791 3.15601C5.49379 3.02821 5.34995 2.95196 5.19629 2.9519H2.91797Z",
		fill: "currentColor"
	}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
		opacity: "0.2",
		d: "M13.6602 7.75525C13.9618 7.7556 14.1815 8.04179 14.1045 8.33337L13.0508 12.3031C12.9304 12.7567 12.5191 13.0725 12.0498 13.0726H2.91701C2.23744 13.0725 1.7417 12.4287 1.91603 11.7719L2.77834 8.52478C2.89898 8.07146 3.31018 7.75532 3.77931 7.75525H13.6602ZM5.1963 2.95154C5.34985 2.95159 5.49377 3.02803 5.57912 3.15564L6.0508 3.86365C6.39205 4.37553 6.96685 4.68385 7.58205 4.68396H12.1699C12.7416 4.68396 13.2049 5.14754 13.2051 5.71912V6.37439H3.77931C3.02267 6.37444 2.33067 6.72671 1.88283 7.29333V3.98669C1.88299 3.4152 2.34649 2.95168 2.91798 2.95154H5.1963Z",
		fill: "currentColor"
	})]
});
/** ic_ds_personalization_outline_16 (figma extract) */
const IconPersonalizationOutline16 = ({ size = 16, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
	width: size,
	height: size,
	className,
	viewBox: "0 0 16 16",
	fill: "none",
	children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
		transform: "translate(1.292 1.3)",
		d: "M10.3232 9.18164C11.2868 9.18164 12.0985 9.82833 12.3506 10.7109L13.415 10.7109L13.415 11.8711L12.3496 11.8711C12.0971 12.7532 11.2864 13.3994 10.3232 13.3994C9.36031 13.3992 8.55012 12.7531 8.29785 11.8711L0 11.8711L0 10.7109L8.29688 10.7109C8.54876 9.82845 9.35988 9.18186 10.3232 9.18164ZM10.3232 10.3418C9.7999 10.3421 9.37534 10.7667 9.375 11.29C9.375 11.8137 9.79969 12.239 10.3232 12.2393C10.847 12.2393 11.2725 11.8138 11.2725 11.29C11.2721 10.7666 10.8468 10.3418 10.3232 10.3418ZM12.4326 11.291C12.4326 11.3549 12.4284 11.418 12.4229 11.4805C12.4287 11.4181 12.4326 11.355 12.4326 11.291ZM8.21484 11.2832C8.21484 11.2856 8.21484 11.2886 8.21484 11.291L8.21484 11.29C8.21484 11.2878 8.21484 11.2855 8.21484 11.2832ZM3.08301 4.59082C4.04605 4.59095 4.85696 5.23717 5.10938 6.11914L13.415 6.11914L13.415 7.2793L5.11035 7.2793C4.85833 8.16202 4.04648 8.80846 3.08301 8.80859C2.11972 8.80843 1.30963 8.16179 1.05762 7.2793L0 7.2793L0 6.11914L1.05762 6.11914C1.30994 5.23728 2.12006 4.59098 3.08301 4.59082ZM3.08301 5.75098C2.55962 5.75117 2.13512 6.17587 2.13477 6.69922C2.13477 7.22287 2.5594 7.64824 3.08301 7.64844C3.60665 7.64828 4.03223 7.2229 4.03223 6.69922C4.03187 6.17585 3.60643 5.75113 3.08301 5.75098ZM5.19238 6.69922C5.19238 6.763 5.18816 6.82633 5.18262 6.88867C5.18846 6.82629 5.19238 6.76313 5.19238 6.69922C5.19236 6.63495 5.18853 6.57152 5.18262 6.50879C5.18826 6.57154 5.19236 6.635 5.19238 6.69922ZM0.982422 6.52344C0.977382 6.58136 0.97463 6.63999 0.974609 6.69922C0.974609 6.75775 0.977496 6.81579 0.982422 6.87305C0.977758 6.81579 0.974609 6.75767 0.974609 6.69922C0.974628 6.64 0.977618 6.58142 0.982422 6.52344ZM10.3232 0C11.2869 0 12.0986 0.646596 12.3506 1.5293L13.415 1.5293L13.415 2.68945L12.3496 2.68945C12.363 2.64266 12.3754 2.59488 12.3857 2.54688C12.1838 3.50118 11.3376 4.21777 10.3232 4.21777C9.36037 4.21756 8.55018 3.57139 8.29785 2.68945L0 2.68945L0 1.5293L8.29688 1.5293C8.5487 0.646717 9.35981 0.00021854 10.3232 0ZM10.3232 1.16016C9.79984 1.16042 9.37524 1.58499 9.375 2.1084C9.375 2.63201 9.79969 3.05735 10.3232 3.05762C10.847 3.05762 11.2725 2.63217 11.2725 2.1084C11.2722 1.58483 10.8469 1.16016 10.3232 1.16016ZM12.4229 2.29883C12.4287 2.23641 12.4326 2.17331 12.4326 2.10938C12.4326 2.17327 12.4284 2.23638 12.4229 2.29883ZM8.21484 2.10938L8.21484 2.1084L8.21484 2.10938ZM8.22266 1.93359C8.21785 1.98897 8.21506 2.04499 8.21484 2.10156C8.21503 2.04501 8.2181 1.98902 8.22266 1.93359ZM8.22266 11.1162C8.2179 11.1713 8.21507 11.227 8.21484 11.2832C8.21504 11.227 8.21814 11.1713 8.22266 11.1162Z",
		fill: "currentColor"
	})
});
/** ic_ds_plus_outline_16 */
const IconPlusOutline16 = ({ size = 16, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
	width: size,
	height: size,
	className,
	viewBox: "0 0 16 16",
	fill: "none",
	xmlns: "http://www.w3.org/2000/svg",
	children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
		d: "M8.64453 1.5V7.34961H14.5V8.65039H8.64453V14.5H7.34473V8.65039H1.5V7.34961H7.34473V1.5H8.64453Z",
		fill: "currentColor"
	})
});
/** ic_ds_project_add_outline_16 (figma extract) */
const IconProjectAddOutline16 = ({ size = 16, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
	width: size,
	height: size,
	className,
	viewBox: "0 0 16 16",
	fill: "none",
	children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
		transform: "translate(9.52 2.52)",
		d: "M3.55246 0L3.55246 2.44252L6 2.44252L6 3.55748L3.55246 3.55748L3.55246 6L2.43834 6L2.43834 3.55748L0 3.55748L0 2.44252L2.43834 2.44252L2.43834 0L3.55246 0Z",
		fill: "currentColor"
	}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
		transform: "translate(0.3496 2.35)",
		d: "M4.76367 0C5.36861 1.80598e-05 5.93113 0.310294 6.25488 0.821289L6.78027 1.64941C6.79685 1.67558 6.81791 1.69775 6.83887 1.71973C6.72186 2.15521 6.65702 2.61192 6.65137 3.08301C6.25601 2.96045 5.90909 2.70478 5.68164 2.3457L5.15723 1.5166C5.07183 1.38189 4.92318 1.3008 4.76367 1.30078L2.32422 1.30078C1.7589 1.30078 1.30078 1.7589 1.30078 2.32422L1.30078 10.1338C1.30078 10.6991 1.7589 11.1572 2.32422 11.1572L11.9766 11.1572C12.5419 11.1572 13 10.6991 13 10.1338L13 8.58398C13.4545 8.5135 13.8903 8.38748 14.3008 8.21289L14.3008 10.1338C14.3008 11.4171 13.2598 12.458 11.9766 12.458L2.32422 12.458C1.04093 12.458 0 11.4171 0 10.1338L0 2.32422C0 1.04093 1.04093 0 2.32422 0L4.76367 0Z",
		fill: "currentColor"
	})]
});
/** ic_ds_search_outline_16 */
const IconSearchOutline16 = ({ size = 16, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
	width: size,
	height: size,
	className,
	viewBox: "0 0 16 16",
	fill: "none",
	xmlns: "http://www.w3.org/2000/svg",
	children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
		d: "M11.894845 6.647401C11.894845 3.725463 9.534486 1.356779 6.623219 1.35657C3.711786 1.35657 1.351635 3.725338 1.351635 6.647401C1.351843 9.569296 3.711911 11.938273 6.623219 11.938273C9.534361 11.938064 11.894637 9.569171 11.894845 6.647401ZM13.245462 6.647401C13.245254 10.317935 10.280401 13.293613 6.623219 13.293821C2.965871 13.293821 0.000204 10.31806 0 6.647401C0 2.976574 2.965746 0 6.623219 0C10.280526 0.000205 13.245462 2.9767 13.245462 6.647401Z",
		fill: "currentColor"
	}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
		d: "M16.000417 15.041079L15.044449 16.000433L11.530434 12.473588L12.486298 11.514234L16.000417 15.041079Z",
		fill: "currentColor"
	})]
});
/** ic_ds_settings_outline_16 */
const IconSettingsOutline16 = ({ size = 16, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
	width: size,
	height: size,
	className,
	viewBox: "0 0 16 16",
	fill: "none",
	xmlns: "http://www.w3.org/2000/svg",
	children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
		clipPath: "url(#clip0_1450_63327)",
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
			d: "M14.0861 5.51366C13.8717 5.0575 13.588 4.58542 13.2889 4.18108C13.208 4.07172 13.1596 4.04373 13.0243 4.03054C12.4277 3.97255 11.8245 4.05527 11.2269 3.9972C10.7224 3.94816 10.3133 3.71661 10.0115 3.30919C9.66986 2.84777 9.43973 2.31343 9.09824 1.85234C9.01771 1.74365 8.96805 1.71589 8.83354 1.70282C8.29432 1.65044 7.70402 1.65061 7.16656 1.70282C7.03205 1.71589 6.98239 1.74365 6.90186 1.85234C6.56067 2.31303 6.33025 2.84774 5.98855 3.30919C5.68681 3.71661 5.27774 3.94816 4.77317 3.9972C4.17564 4.05527 3.57239 3.97255 2.97585 4.03054C2.84046 4.04373 2.79208 4.07172 2.71115 4.18108C2.41212 4.58542 2.12835 5.0575 1.91403 5.51366C1.85299 5.64359 1.85286 5.7018 1.91403 5.8319C2.14865 6.33077 2.49748 6.76892 2.73237 7.26854C2.9594 7.7515 2.96041 8.24717 2.73338 8.73044C2.49837 9.23061 2.14891 9.66837 1.91403 10.1681C1.85291 10.2982 1.85299 10.3564 1.91403 10.4863C2.12856 10.9429 2.41185 11.4142 2.71115 11.8189C2.79208 11.9283 2.84046 11.9563 2.97585 11.9694C3.57239 12.0274 4.17564 11.9447 4.77317 12.0028C5.27774 12.0518 5.68681 12.2834 5.98855 12.6908C6.33024 13.1522 6.56037 13.6866 6.90186 14.1476C6.98239 14.2563 7.03205 14.2841 7.16656 14.2972C7.70402 14.3494 8.29432 14.3495 8.83354 14.2972C8.96805 14.2841 9.01771 14.2563 9.09824 14.1476C9.43944 13.687 9.66985 13.1522 10.0115 12.6908C10.3133 12.2834 10.7224 12.0518 11.2269 12.0028C11.8244 11.9447 12.4271 12.0275 13.0243 11.9694C13.1596 11.9563 13.208 11.9283 13.2889 11.8189C13.5891 11.4131 13.872 10.942 14.0861 10.4863C14.1471 10.3564 14.1472 10.2982 14.0861 10.1681C13.8513 9.66861 13.5017 9.23061 13.2667 8.73044C13.0397 8.24717 13.0407 7.7515 13.2677 7.26854C13.5026 6.7689 13.8513 6.33106 14.0861 5.8319C14.1472 5.7018 14.1471 5.64359 14.0861 5.51366ZM15.3035 6.40373C15.0685 6.90359 14.7188 7.34119 14.4841 7.84037C14.4231 7.97025 14.423 8.02855 14.4841 8.15861C14.7189 8.65833 15.0685 9.09611 15.3035 9.59626C15.5308 10.0801 15.5308 10.5744 15.3035 11.0582C15.052 11.5933 14.7225 12.1426 14.37 12.6191C14.0685 13.0265 13.6581 13.259 13.1536 13.3081C12.5566 13.366 11.9541 13.2835 11.3573 13.3414C11.2228 13.3545 11.1731 13.3823 11.0926 13.491C10.7511 13.9521 10.521 14.4864 10.1793 14.9478C9.87828 15.3542 9.46719 15.5869 8.96387 15.6358C8.34008 15.6964 7.66194 15.6966 7.03623 15.6358C6.53291 15.5869 6.12182 15.3542 5.82084 14.9478C5.47911 14.4863 5.24878 13.9517 4.90753 13.491C4.82701 13.3823 4.77734 13.3545 4.64284 13.3414C4.04647 13.2835 3.44373 13.366 2.84653 13.3081C2.34201 13.259 1.93164 13.0265 1.63013 12.6191C1.27867 12.144 0.948453 11.5941 0.696621 11.0582C0.469315 10.5744 0.469279 10.0801 0.696621 9.59626C0.931628 9.09613 1.2813 8.65807 1.51597 8.15861C1.57708 8.02855 1.57702 7.97025 1.51597 7.84037C1.28117 7.34095 0.931635 6.9036 0.696621 6.40373C0.469213 5.91992 0.469367 5.42562 0.696621 4.94183C0.948441 4.40587 1.27868 3.85598 1.63013 3.38092C1.93164 2.97349 2.34201 2.74095 2.84653 2.6919C3.44353 2.63397 4.04599 2.71649 4.64284 2.65856C4.77734 2.64549 4.82701 2.61774 4.90753 2.50904C5.24905 2.04792 5.47913 1.51362 5.82084 1.05219C6.12182 0.645806 6.53291 0.413119 7.03623 0.364178C7.66002 0.303556 8.33816 0.303369 8.96387 0.364178C9.46719 0.413119 9.87828 0.645806 10.1793 1.05219C10.521 1.51365 10.7513 2.04828 11.0926 2.50904C11.1731 2.61774 11.2228 2.64549 11.3573 2.65856C11.9541 2.71649 12.5566 2.63397 13.1536 2.6919C13.6581 2.74095 14.0685 2.97349 14.37 3.38092C14.7214 3.85598 15.0517 4.40587 15.3035 4.94183C15.5307 5.42562 15.5309 5.91992 15.3035 6.40373Z",
			fill: "currentColor"
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
			d: "M9.13764 7.99999C9.13764 7.3715 8.62855 6.8624 8.00005 6.8624C7.37155 6.8624 6.86246 7.3715 6.86246 7.99999C6.86246 8.62849 7.37155 9.13759 8.00005 9.13759C8.62855 9.13759 9.13764 8.62849 9.13764 7.99999ZM10.4834 7.99999C10.4834 9.37126 9.37132 10.4833 8.00005 10.4833C6.62878 10.4833 5.51674 9.37126 5.51674 7.99999C5.51674 6.62873 6.62878 5.51669 8.00005 5.51669C9.37132 5.51669 10.4834 6.62873 10.4834 7.99999Z",
			fill: "currentColor"
		})]
	}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("clipPath", {
		id: "clip0_1450_63327",
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
			width: 16,
			height: 16,
			fill: "currentColor"
		})
	}) })]
});
/** ic_ds_trash_outline_16 */
const IconTrashOutline16 = ({ size = 16, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
	width: size,
	height: size,
	className,
	viewBox: "0 0 16 16",
	fill: "none",
	xmlns: "http://www.w3.org/2000/svg",
	children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
		d: "M14.4782 4.84067L14.2138 10.1152C14.1102 12.1872 14.067 13.0115 13.3866 13.9607C13.1044 14.3546 12.7498 14.6912 12.3424 14.9535C11.8239 15.2872 11.2415 15.4316 10.5585 15.4998C9.88727 15.5668 9.04946 15.5656 7.99998 15.5656C6.95051 15.5656 6.1127 15.5668 5.44142 15.4998C4.75851 15.4316 4.17602 15.2872 3.65753 14.9535C3.25012 14.6912 2.89559 14.3546 2.61332 13.9607C1.93296 13.0115 1.88979 12.1872 1.78619 10.1152L1.52179 4.84067L2.89006 4.77277L3.15343 10.0463C3.26221 12.2218 3.32452 12.6015 3.72646 13.1624C3.90825 13.4161 4.13686 13.6334 4.39927 13.8023C4.66204 13.9714 5.00263 14.0792 5.57825 14.1367C6.16562 14.1953 6.92298 14.1963 7.99998 14.1963C9.07699 14.1963 9.83434 14.1953 10.4217 14.1367C10.9973 14.0792 11.3379 13.9714 11.6007 13.8023C11.8631 13.6334 12.0917 13.4161 12.2735 13.1624C12.6755 12.6015 12.7378 12.2218 12.8465 10.0463L13.1099 4.77277L14.4782 4.84067ZM5.43011 6.22849H6.7994V11.3909H5.43011V6.22849ZM9.20056 6.22849H10.5699V11.3909H9.20056V6.22849ZM8.53597 0.434431C9.17976 0.434431 9.6522 0.426926 10.0966 0.571258C10.2357 0.616451 10.3717 0.672554 10.502 0.738948C10.9182 0.951107 11.2464 1.29099 11.7015 1.74612L12.4978 2.54136H15.3742V3.91169H0.625732V2.54136H3.50218L4.29845 1.74612C4.75358 1.29099 5.08174 0.951107 5.49801 0.738948C5.62831 0.672554 5.76425 0.616451 5.90334 0.571258C6.34776 0.426926 6.82021 0.434431 7.46399 0.434431H8.53597ZM7.46399 1.80476C6.73208 1.80476 6.51641 1.81187 6.32617 1.87369C6.25545 1.89667 6.18668 1.92533 6.12041 1.95907C5.96398 2.03878 5.82348 2.16253 5.44142 2.54136H10.5585C10.1765 2.16253 10.036 2.03878 9.87955 1.95907C9.81329 1.92533 9.74452 1.89667 9.6738 1.87369C9.48356 1.81187 9.26789 1.80476 8.53597 1.80476H7.46399Z",
		fill: "currentColor"
	})
});
/** ic_ds_triangle_right_fill_14 — tree expand arrow; points right, consumers rotate it 90° for the open state. */
const IconTriangleRightFill14 = ({ size = 14, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
	width: size,
	height: size,
	className,
	viewBox: "0 0 14 14",
	fill: "none",
	xmlns: "http://www.w3.org/2000/svg",
	children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
		d: "M4.25 2.82782L4.25 11.1722C4.25 11.6622 4.84243 11.9076 5.18891 11.5611L9.36109 7.38891C9.57588 7.17412 9.57588 6.82588 9.36109 6.61109L5.18891 2.43891C4.84243 2.09243 4.25 2.33782 4.25 2.82782Z",
		fill: "currentColor"
	})
});

//#endregion
//#region src/client/vendor/subagents.ts
/**
* Index every subagent descendant under each ancestor it reaches through an
* uninterrupted subagent-origin chain. Cycles fail soft and orphan owners
* remain harmless map keys until their summaries arrive.
*/
function indexSubagentDescendants(summaries) {
	const indexed = /* @__PURE__ */ new Map();
	for (const descendant of Object.values(summaries)) {
		if (descendant.origin !== "subagent") continue;
		const seen = /* @__PURE__ */ new Set();
		let current = descendant;
		while (current?.origin === "subagent" && current.parentId !== void 0 && !seen.has(current.id)) {
			seen.add(current.id);
			const aggregate = indexed.get(current.parentId);
			if (aggregate === void 0) indexed.set(current.parentId, {
				count: 1,
				runningCount: descendant.running ? 1 : 0
			});
			else {
				aggregate.count += 1;
				if (descendant.running) aggregate.runningCount += 1;
			}
			current = summaries[current.parentId];
		}
	}
	return indexed;
}

//#endregion
//#region src/client/upstream/tree.ts
/** Group key for Sessions outside every Workspace. */
const UNGROUPED_KEY = "";
/** Display label for the ungrouped bucket row. */
const UNGROUPED_LABEL = "Ungrouped";
/**
* Directory display label: basename of the path (both separators accepted).
* Ungrouped-bucket fallback for surfaces without a workspace title.
* @param cwd - directory path, or undefined for the ungrouped bucket.
* @returns basename, the raw cwd when it has no basename, or the ungrouped label.
*/
function workspaceLabel(cwd) {
	if (cwd === void 0 || cwd === "") return UNGROUPED_LABEL;
	const base = cwd.replace(/[/\\]+$/, "").split(/[/\\]/).pop();
	return base !== void 0 && base !== "" ? base : cwd;
}
/** Recency comparator: newest first, id as the deterministic tiebreak (ids are unique per group). */
function byRecency(a, b) {
	if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
	return a.id < b.id ? -1 : 1;
}
/**
* Ordinary sessions are visible; among blank sessions, only the current one
* is visible. Subagent children use their parent header catalog; archived
* sessions are visible nowhere, while their accounting slots remain so
* unarchiving restores position.
*/
function sessionVisible(session, current, archived) {
	return session.origin !== "subagent" && !archived.has(session.id) && (!session.blank || session.id === current);
}
/**
* A blank session is the selected Workspace's provisional New Session row;
* its canonical title never enters search (blank rows are query-excluded)
* and the renderer localizes its display label.
*/
function sessionTitle(session) {
	return session.blank ? "New Session" : session.displayTitle;
}
/** Build one group without projecting session lineage into presentation. */
function buildGroup(key, workspaceId, cwd, createdAt, label, members, order) {
	const sessions = [...members];
	if (order === "recency") sessions.sort(byRecency);
	return {
		key,
		workspaceId,
		cwd,
		createdAt,
		label,
		sessions
	};
}
/** Apply a stored Ungrouped order and append newly loose Sessions by recency. */
function orderedUngrouped(members, stored) {
	const byId = new Map(members.map((session) => [session.id, session]));
	const included = /* @__PURE__ */ new Set();
	const ordered = [];
	for (const key of stored) {
		const session = byId.get(key);
		if (session === void 0 || included.has(key)) continue;
		ordered.push(session);
		included.add(key);
	}
	for (const session of [...members].sort(byRecency)) {
		if (included.has(session.id)) continue;
		ordered.push(session);
	}
	return ordered;
}
/**
* Group Sessions by Host Workspace: one group per entity in stable Host
* order, with members resolved from sessionIds in their stored order. Sessions
* outside every Workspace trail in the browser-local Ungrouped order, which
* falls back to recency before that order is initialized.
*/
function groupByWorkspace(list, workspaces, archived, ungroupedOrder) {
	const groups = [];
	const accounted = /* @__PURE__ */ new Set();
	for (const workspace of workspaces) {
		const members = [];
		for (const id of workspace.sessionIds) {
			const summary = list.byId[id];
			if (summary === void 0) continue;
			accounted.add(id);
			if (!sessionVisible(summary, list.current, archived)) continue;
			members.push(summary);
		}
		groups.push(buildGroup(workspace.workspaceId, workspace.workspaceId, workspace.path, Date.parse(workspace.createdAt), workspace.title, members, "account"));
	}
	const stray = list.ids.map((id) => list.byId[id]).filter((s) => s !== void 0 && !accounted.has(s.id) && sessionVisible(s, list.current, archived));
	if (stray.length > 0) groups.push(buildGroup("", void 0, void 0, void 0, UNGROUPED_LABEL, ungroupedOrder === void 0 ? stray : orderedUngrouped(stray, ungroupedOrder), ungroupedOrder === void 0 ? "recency" : "account"));
	return groups;
}
function sessionNode(s, descendants) {
	return {
		id: s.id,
		title: sessionTitle(s),
		blank: s.blank,
		running: s.running,
		runningSubagentCount: descendants.get(s.id)?.runningCount ?? 0,
		completed: s.completed === true,
		updatedAt: s.updatedAt,
		...s.pendingInteraction === void 0 ? {} : { pendingInteraction: s.pendingInteraction }
	};
}
/**
* Derive the workspace browser groups with every session as a top-level row.
*
* Every group shows; sessions populate under expanded groups in the selected
* local order. Blank sessions are excluded except for the selected
* provisional New Session row; archived sessions are excluded everywhere.
* Content search lives outside this derivation
* (see {@link deriveSearchResults}).
* @param list - sessions list snapshot (`current` feeds containsCurrent).
* @param workspaces - real workspaces in stable Host order.
* @param archivedSessionIds - registry-global archive set.
* @param view - local expansion arrays.
* @returns group sections in render order.
*/
function deriveGroups(list, workspaces, archivedSessionIds, view) {
	const archived = new Set(archivedSessionIds);
	const expandedGroups = new Set(view.expandedGroups);
	const descendants = indexSubagentDescendants(list.byId);
	const currentGroup = list.current === void 0 ? void 0 : workspaces.find((w) => w.sessionIds.includes(list.current))?.workspaceId ?? "";
	const groups = [];
	for (const g of groupByWorkspace(list, workspaces, archived, view.ungroupedOrder)) {
		const expanded = expandedGroups.has(g.key);
		groups.push({
			key: g.key,
			workspaceId: g.workspaceId,
			cwd: g.cwd,
			createdAt: g.createdAt,
			label: g.label,
			sessionCount: g.sessions.length,
			expanded,
			containsCurrent: g.key === currentGroup,
			sessions: expanded ? g.sessions.map((session) => sessionNode(session, descendants)) : []
		});
	}
	return groups;
}
/**
* Derive the flat session list ("In one list" mode): every session — fork
* children included — as a top-level row, strictly newest-first. No grouping,
* no parent/child adjacency. Content search lives outside this derivation
* (see {@link deriveSearchResults}).
* @param list - sessions list snapshot.
* @param archivedSessionIds - registry-global archive set.
* @returns flat rows in render order.
*/
function deriveFlat(list, archivedSessionIds) {
	const archived = new Set(archivedSessionIds);
	const descendants = indexSubagentDescendants(list.byId);
	const rows = [];
	for (const id of list.ids) {
		const s = list.byId[id];
		if (s === void 0 || !sessionVisible(s, list.current, archived)) continue;
		rows.push(s);
	}
	rows.sort(byRecency);
	return rows.map((session) => sessionNode(session, descendants));
}
/**
* Merge immediate title/Workspace substring matches with ranked Host content
* matches. Local rows lead newest-first, content-only rows retain backend
* order, and duplicate sessions receive the backend snippet in place.
* @param list - session metadata authority.
* @param workspaces - Workspace membership and display labels.
* @param query - caller text; surrounding whitespace is ignored.
* @param archivedSessionIds - registry-global archive set (members never match).
* @param content - ranked Host content-search page.
* @param limit - protocol-owned maximum merged row count.
* @returns bounded deduplicated flat rows and a refine-query hint bit.
*/
function deriveSearchResults(list, workspaces, query, archivedSessionIds, content, limit) {
	const q = query.trim().toLowerCase();
	if (q === "") return {
		items: [],
		hasMore: false
	};
	const archived = new Set(archivedSessionIds);
	const descendants = indexSubagentDescendants(list.byId);
	const workspaceBySession = /* @__PURE__ */ new Map();
	for (const workspace of workspaces) for (const sessionId of workspace.sessionIds) if (!workspaceBySession.has(sessionId)) workspaceBySession.set(sessionId, workspace.title);
	const labelOf = (summary) => workspaceBySession.get(summary.id) ?? workspaceLabel(summary.cwd);
	const contentBySession = /* @__PURE__ */ new Map();
	for (const item of content.items) if (!contentBySession.has(item.sessionId)) contentBySession.set(item.sessionId, item);
	const local = [];
	for (const id of list.ids) {
		const summary = list.byId[id];
		if (summary === void 0 || summary.blank || !sessionVisible(summary, list.current, archived)) continue;
		if (sessionTitle(summary).toLowerCase().includes(q) || labelOf(summary).toLowerCase().includes(q)) local.push(summary);
	}
	local.sort(byRecency);
	const ordered = [];
	const included = /* @__PURE__ */ new Set();
	const include = (summary) => {
		if (included.has(summary.id)) return;
		included.add(summary.id);
		ordered.push(summary);
	};
	for (const summary of local) include(summary);
	for (const item of content.items) {
		const summary = list.byId[item.sessionId];
		if (summary !== void 0 && !summary.blank && sessionVisible(summary, list.current, archived)) include(summary);
	}
	return {
		items: ordered.slice(0, limit).map((summary) => {
			const match = contentBySession.get(summary.id);
			return {
				id: summary.id,
				title: sessionTitle(summary),
				workspace: labelOf(summary),
				running: summary.running,
				runningSubagentCount: descendants.get(summary.id)?.runningCount ?? 0,
				...summary.pendingInteraction === void 0 ? {} : { pendingInteraction: summary.pendingInteraction },
				completed: summary.completed === true,
				...match === void 0 ? {} : { snippet: match.snippet }
			};
		}),
		hasMore: content.hasMore || ordered.length > limit
	};
}
/**
* Compact relative time for session rows, as a structured bucket the
* renderer localizes ("now"/"5min"/"3h"/"2d"/"4mo"/"1y" in en).
* @param updatedAt - epoch ms of the session's last activity.
* @param now - current epoch ms (injected for pure rendering).
* @returns the row's trailing time bucket and magnitude.
*/
function relativeTime(updatedAt, now) {
	const MIN = 6e4;
	const HOUR = 36e5;
	const DAY = 864e5;
	const diff = Math.max(0, now - updatedAt);
	if (diff < MIN) return {
		unit: "now",
		n: 0
	};
	if (diff < HOUR) return {
		unit: "minutes",
		n: Math.floor(diff / MIN)
	};
	if (diff < DAY) return {
		unit: "hours",
		n: Math.floor(diff / HOUR)
	};
	if (diff < 30 * DAY) return {
		unit: "days",
		n: Math.floor(diff / DAY)
	};
	if (diff < 365 * DAY) return {
		unit: "months",
		n: Math.floor(diff / (30 * DAY))
	};
	return {
		unit: "years",
		n: Math.floor(diff / (365 * DAY))
	};
}

//#endregion
//#region \0dsh-css:src/client/upstream/rows/Rows.module.css.mjs
const css$3 = ".hijX2a_projectRow,.hijX2a_sessionRow{cursor:pointer;user-select:none;color:var(--dsw-alias-label-primary);border-radius:8px;align-items:center;gap:6px;padding:0 8px;display:flex}.hijX2a_projectRow:hover,.hijX2a_sessionRow:hover,.hijX2a_sessionRow.hijX2a_selected{background:var(--dsw-alias-interactive-bg-hover)}.hijX2a_searchResultRow{box-sizing:border-box;cursor:pointer;text-align:left;width:100%;min-height:48px;color:var(--dsw-alias-label-primary);background:0 0;border:none;border-radius:8px;flex-direction:column;align-items:stretch;padding:4px 8px;display:flex}.hijX2a_searchResultRow:hover,.hijX2a_searchResultRow.hijX2a_selected{background:var(--dsw-alias-interactive-bg-hover)}.hijX2a_searchResultHeading{align-items:center;min-width:0;display:flex}.hijX2a_searchResultTitle{text-overflow:ellipsis;white-space:nowrap;min-width:0;margin-left:4px;font-size:14px;line-height:20px;overflow:hidden}.hijX2a_searchResultMeta{align-items:center;gap:6px;min-width:0;margin-left:20px;display:flex}.hijX2a_searchResultWorkspace,.hijX2a_searchResultSnippet{text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:17px;overflow:hidden}.hijX2a_searchResultWorkspace{max-width:40%;color:var(--dsw-alias-label-tertiary);flex:none}.hijX2a_searchResultSnippet{min-width:0;color:var(--dsw-alias-label-secondary);flex:1}.hijX2a_projectRow{box-sizing:border-box;align-items:center;height:34px}.hijX2a_projectRowMultiroot{height:auto;min-height:46px}.hijX2a_projectMeta{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;overflow:hidden}.hijX2a_projectRow .hijX2a_rowActions{height:20px}.hijX2a_sessionRow{height:32px;animation:hijX2a_row-in .15s var(--ds-ease-in-out);gap:0}.hijX2a_sessionRow .hijX2a_title{margin:0 6px 0 4px}.hijX2a_flatSessionRowWithoutStatus .hijX2a_title{margin-left:0}@keyframes hijX2a_row-in{0%{opacity:0}}.hijX2a_slot{width:16px;height:20px;color:var(--dsw-alias-label-tertiary);flex:none;justify-content:center;align-items:center;display:inline-flex}.hijX2a_visuallyHidden{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}.hijX2a_folderActive{color:var(--dsw-alias-state-business-primary)}.hijX2a_projectRow .hijX2a_chevron{display:none}.hijX2a_projectRow:hover .hijX2a_chevron{display:inline-flex}.hijX2a_projectRow:hover .hijX2a_folder{display:none}.hijX2a_arrow{transition:transform .15s var(--ds-ease-in-out)}.hijX2a_arrowOpen{transform:rotate(90deg)}.hijX2a_projectText{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.hijX2a_title{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:14px;line-height:20px;overflow:hidden}.hijX2a_renameInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);min-width:0;color:inherit;border-radius:4px;outline:none;padding:0 2px;font-size:14px;line-height:20px}.hijX2a_sessionRow .hijX2a_title{flex:1}.hijX2a_meta{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:20px;overflow:hidden}.hijX2a_time{color:var(--dsw-alias-label-tertiary);flex:none;font-size:12px;line-height:20px}.hijX2a_dot{flex:none}.hijX2a_rowActions{flex:none;align-items:center;gap:12px;display:none}.hijX2a_projectRow:hover .hijX2a_rowActions,.hijX2a_sessionRow:hover .hijX2a_rowActions,.hijX2a_projectRow.hijX2a_menuOpen .hijX2a_rowActions,.hijX2a_sessionRow.hijX2a_menuOpen .hijX2a_rowActions{display:inline-flex}.hijX2a_sessionRow:hover .hijX2a_time,.hijX2a_sessionRow.hijX2a_menuOpen .hijX2a_time{display:none}.hijX2a_projectRow.hijX2a_menuOpen,.hijX2a_sessionRow.hijX2a_menuOpen{background:var(--dsw-alias-interactive-bg-hover)}.hijX2a_sessionRow.hijX2a_dropBefore,.hijX2a_sessionRow.hijX2a_dropAfter{position:relative}.hijX2a_sessionRow.hijX2a_dropBefore:before,.hijX2a_sessionRow.hijX2a_dropAfter:after{content:\"\";z-index:1;background:linear-gradient(55deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 0 / 5px 7px no-repeat, linear-gradient(125deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 5px / 5px 7px no-repeat, linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px / calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:4px}.hijX2a_sessionRow.hijX2a_dropBefore:before{top:-7px}.hijX2a_sessionRow.hijX2a_dropAfter:after{bottom:-7px}.hijX2a_hoverContent{flex-direction:column;gap:8px;display:flex}.hijX2a_hoverTitle{color:#fff;overflow-wrap:break-word;font-size:14px;line-height:20px}.hijX2a_hoverPath{color:#cfd3d6;word-break:break-all;font-size:12px;line-height:16px}.hijX2a_hoverTime{color:#cfd3d6;font-size:12px;line-height:16px}.hijX2a_hoverStatus{color:#adb2b8;align-items:center;gap:8px;font-size:12px;line-height:20px;display:flex}.hijX2a_iconButton{cursor:pointer;width:16px;height:16px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:4px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.hijX2a_iconButton:hover{color:var(--dsw-alias-label-primary)}.hijX2a_chevron{color:var(--dsw-alias-label-caption)}@media (prefers-reduced-motion:reduce){.hijX2a_sessionRow,.hijX2a_arrow{transition:none;animation:none}}";
const tagId$3 = "dsh-multiroot-workspace/Rows.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-multiroot-workspace";
	tag.dataset.pluginCss = tagId$3;
	tag.textContent = css$3;
	document.head.appendChild(tag);
}
var Rows_module_css_default = {
	"arrow": "hijX2a_arrow",
	"arrowOpen": "hijX2a_arrowOpen",
	"chevron": "hijX2a_chevron",
	"dot": "hijX2a_dot",
	"dropAfter": "hijX2a_dropAfter",
	"dropBefore": "hijX2a_dropBefore",
	"flatSessionRowWithoutStatus": "hijX2a_flatSessionRowWithoutStatus",
	"folder": "hijX2a_folder",
	"folderActive": "hijX2a_folderActive",
	"hoverContent": "hijX2a_hoverContent",
	"hoverPath": "hijX2a_hoverPath",
	"hoverStatus": "hijX2a_hoverStatus",
	"hoverTime": "hijX2a_hoverTime",
	"hoverTitle": "hijX2a_hoverTitle",
	"iconButton": "hijX2a_iconButton",
	"menuOpen": "hijX2a_menuOpen",
	"meta": "hijX2a_meta",
	"projectMeta": "hijX2a_projectMeta",
	"projectRow": "hijX2a_projectRow",
	"projectRowMultiroot": "hijX2a_projectRowMultiroot",
	"projectText": "hijX2a_projectText",
	"renameInput": "hijX2a_renameInput",
	"row-in": "hijX2a_row-in",
	"rowActions": "hijX2a_rowActions",
	"searchResultHeading": "hijX2a_searchResultHeading",
	"searchResultMeta": "hijX2a_searchResultMeta",
	"searchResultRow": "hijX2a_searchResultRow",
	"searchResultSnippet": "hijX2a_searchResultSnippet",
	"searchResultTitle": "hijX2a_searchResultTitle",
	"searchResultWorkspace": "hijX2a_searchResultWorkspace",
	"selected": "hijX2a_selected",
	"sessionRow": "hijX2a_sessionRow",
	"slot": "hijX2a_slot",
	"time": "hijX2a_time",
	"title": "hijX2a_title",
	"visuallyHidden": "hijX2a_visuallyHidden"
};

//#endregion
//#region src/client/upstream/rows/Rows.tsx
/**
* Workspace browser tree row components (figma Cell set 14:3080): pure presentational —
* all data and callbacks arrive via props. Hover swaps (folder->chevron,
* time->ellipsis, action buttons) are CSS-only. Row ... menus are visual-only
* except workspace Rename/Delete and session Rename/Fork/Archive; the session
* and workspace hover cards are suppressed while a menu is open.
*/
/** Row display title: blank rows show the localized New Session label. */
function displayTitle(node, t) {
	return node.blank ? t("session.new") : node.title;
}
/** Localized compact relative time ("刚刚"/"5分钟" in zh, "now"/"5min" in en). */
function timeLabel(updatedAt, now, t) {
	const { unit, n } = relativeTime(updatedAt, now);
	return unit === "now" ? t("time.now") : t(`time.${unit}`, { n });
}
/** Hover-card variant: distances wrap in the ago template; the now bucket stays bare (no "now ago"). */
function hoverTimeLabel(updatedAt, now, t) {
	const { unit, n } = relativeTime(updatedAt, now);
	return unit === "now" ? t("time.now") : t("time.ago", { t: t(`time.${unit}`, { n }) });
}
/**
* Absolute creation time through the dictionary's date template (the message
* clock pattern): `toLocaleString` would follow the browser language, not the
* app locale, and produce mixed-language text after a switch.
*/
function createdLabel(createdAt, t) {
	const d = new Date(createdAt);
	const pad2 = (v) => String(v).padStart(2, "0");
	return t("hover.created", { time: `${t("date.ymd", {
		y: d.getFullYear(),
		m: d.getMonth() + 1,
		d: d.getDate()
	})} ${pad2(d.getHours())}:${pad2(d.getMinutes())}` });
}
/** Hover-card body: workspace title, full directory path, absolute creation time. */
function WorkspaceHoverContent({ label, cwd, createdAt, t }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: Rows_module_css_default.hoverContent,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: Rows_module_css_default.hoverTitle,
				children: label
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: Rows_module_css_default.hoverPath,
				children: cwd
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: Rows_module_css_default.hoverTime,
				children: createdLabel(createdAt, t)
			})
		]
	});
}
/** Pointer-position half of a row (insert line above or below). */
function rowHalf(e) {
	const rect = e.currentTarget.getBoundingClientRect();
	return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
}
/**
* Project (workspace) header row: folder + title;
* hover reveals the chevron and create button, and dwelling on a real
* Workspace shows its hover card (the ungrouped bucket has none).
* `containsCurrent` arrives on the node (derivation fact, no renderer scan).
* @param props.group - derived group node.
* @param props.onToggle - expand/collapse the group.
* @param props.onCreate - start a frontend Session inside this Workspace.
* @param props.drag - optional workspace-row drag wiring.
* @param props.t - the browser root's locale seat.
* @returns the row element.
*/
function ProjectRowItem({ group, onToggle, onCreate, actions, drag, multiroot, t }) {
	const row = group;
	const label = multiroot?.logical.title ?? (row.workspaceId === void 0 ? t("group.ungrouped") : row.label);
	const active = group.expanded && group.containsCurrent;
	const [menuOpen, setMenuOpen] = (0, react.useState)(false);
	const workspaceMenuItems = [
		...actions?.manage === void 0 ? [] : [{
			id: "manage",
			label: t("multiroot.manage"),
			icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconSettingsOutline16, {})
		}],
		{
			id: "rename",
			label: t("rename"),
			icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconEditOutline16, {})
		},
		{
			id: "delete",
			label: t("delete.workspace"),
			icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconTrashOutline16, {}),
			danger: true
		}
	];
	const ownRow = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: clsx(Rows_module_css_default.projectRow, multiroot !== void 0 && Rows_module_css_default.projectRowMultiroot, menuOpen && Rows_module_css_default.menuOpen),
		role: "treeitem",
		"aria-expanded": row.expanded,
		onClick: onToggle,
		draggable: drag !== void 0,
		onDragStart: drag === void 0 ? void 0 : (e) => {
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", row.key);
			drag.start();
		},
		onDragEnd: drag?.end,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: clsx(Rows_module_css_default.slot, Rows_module_css_default.folder, active && Rows_module_css_default.folderActive),
				children: row.expanded ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderOpen16, {}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderClose16, {})
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: clsx(Rows_module_css_default.slot, Rows_module_css_default.chevron),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconTriangleRightFill14, { className: clsx(Rows_module_css_default.arrow, row.expanded && Rows_module_css_default.arrowOpen) })
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: Rows_module_css_default.projectText,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: Rows_module_css_default.title,
					children: label
				}), multiroot !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: Rows_module_css_default.projectMeta,
					children: t("multiroot.meta", {
						count: multiroot.rootCount,
						primary: multiroot.primaryAlias
					})
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: Rows_module_css_default.rowActions,
				children: [actions !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Menu, {
					open: menuOpen,
					onClose: () => {
						setMenuOpen(false);
					},
					items: workspaceMenuItems,
					onSelect: (id) => {
						setMenuOpen(false);
						/* v8 ignore next -- workspaceMenuItems carries exactly these two rows today. */
						if (id === "manage") {
							actions.manage?.();
							return;
						}
						if (id !== "rename" && id !== "delete") return;
						if (id === "rename") actions.rename();
						else actions.delete();
					},
					portal: true,
					closeOnPointerLeave: true,
					anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: Rows_module_css_default.iconButton,
						"aria-label": t("actions.workspace.aria", { name: label }),
						onClick: (e) => {
							e.stopPropagation();
							setMenuOpen((v) => !v);
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconEllipsisOutline16, {})
					})
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: Rows_module_css_default.iconButton,
					"aria-label": t("actions.newSession.aria", { name: label }),
					onClick: (e) => {
						e.stopPropagation();
						onCreate();
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconPlusOutline16, {})
				})]
			})
		]
	});
	if (row.createdAt === void 0) return ownRow;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HoverCard, {
		anchor: ownRow,
		content: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkspaceHoverContent, {
			label,
			cwd: row.cwd,
			createdAt: row.createdAt,
			t
		}),
		disabled: menuOpen,
		copyText: row.cwd,
		copyLabel: t("copy"),
		copiedLabel: t("hover.copied")
	});
}
/* v8 ignore next 3 -- closed-union backstop; only reached if the status is forged */
function assertNever(value) {
	throw new Error(`unknown pending interaction: ${String(value)}`);
}
/**
* Session status presentation; pending interaction is primary and live activity
* outranks completion reminders.
*/
function sessionStatuses(node, t) {
	const subagents = node.runningSubagentCount === 0 ? void 0 : {
		state: "ongoing",
		label: t(node.runningSubagentCount === 1 ? "status.subagentsRunning.one" : "status.subagentsRunning.other", { n: node.runningSubagentCount })
	};
	let pending;
	switch (node.pendingInteraction) {
		case "approval":
			pending = {
				state: "warning",
				label: t("status.waitingApproval")
			};
			break;
		case "plan-review":
			pending = {
				state: "warning",
				label: t("status.planReview")
			};
			break;
		case "question":
			pending = {
				state: "warning",
				label: t("status.waitingAnswer")
			};
			break;
		case void 0: break;
		/* v8 ignore next -- closed PendingInteractionStatus union */
		default: return assertNever(node.pendingInteraction);
	}
	if (pending !== void 0) return subagents === void 0 ? [pending] : [pending, subagents];
	if (node.running) {
		const primary = {
			state: "ongoing",
			label: t("status.running")
		};
		return subagents === void 0 ? [primary] : [primary, subagents];
	}
	if (subagents !== void 0) return [subagents];
	if (node.completed) return [{
		state: "done",
		label: t("status.completed")
	}];
	return [{
		state: "done",
		label: t("status.idle")
	}];
}
/** Primary status dot plus every status's screen-reader label, shared by the search and session rows. */
function SessionStatusDots({ statuses }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(StateDot, { state: statuses[0].state }), statuses.map((status) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
		className: Rows_module_css_default.visuallyHidden,
		children: status.label
	}, status.label))] });
}
/** Hover-card body: full title, relative time, and every relevant live status. */
function SessionHoverContent({ node, now, t }) {
	const statuses = sessionStatuses(node, t);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: Rows_module_css_default.hoverContent,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: Rows_module_css_default.hoverTitle,
				children: displayTitle(node, t)
			}),
			!node.blank && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: Rows_module_css_default.hoverTime,
				children: hoverTimeLabel(node.updatedAt, now, t)
			}),
			statuses.map((status) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: Rows_module_css_default.hoverStatus,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(StateDot, { state: status.state }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: status.label })]
			}, status.label))
		]
	});
}
/**
* One flat search result: title, Workspace context, and optional content
* excerpt. Search navigation opens the session only; it does not address an
* event inside the conversation.
* @param props.result - merged local/content search row.
* @param props.currentId - selected session id.
* @param props.onOpen - open the selected session.
* @param props.t - Workspace-browser translation seat.
* @returns the result button.
*/
function SearchResultItem({ result, currentId, onOpen, t }) {
	const selected = result.id === currentId;
	const statuses = sessionStatuses(result, t);
	const primaryStatus = statuses[0];
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
		type: "button",
		className: clsx(Rows_module_css_default.searchResultRow, selected && Rows_module_css_default.selected),
		role: "treeitem",
		"aria-selected": selected,
		onClick: () => {
			onOpen(result.id);
		},
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
			className: Rows_module_css_default.searchResultHeading,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: Rows_module_css_default.slot,
				children: (primaryStatus.state !== "done" || result.completed) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionStatusDots, { statuses })
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: Rows_module_css_default.searchResultTitle,
				children: result.title
			})]
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
			className: Rows_module_css_default.searchResultMeta,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: Rows_module_css_default.searchResultWorkspace,
				children: result.workspace
			}), result.snippet !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: Rows_module_css_default.searchResultSnippet,
				children: result.snippet
			})]
		})]
	});
}
/**
* One top-level 34px session row: status dot (pending user interaction outranks
* own or descendant activity), title, relative time, and the row actions menu.
* @param props.node - derived session node.
* @param props.currentId - selected session id (row highlight).
* @param props.now - epoch ms for relative-time formatting.
* @param props.onOpen - open a session by id.
* @param props.onRename - open the session rename dialog (id + current title).
* @param props.onFork - fork a session at its last completed turn.
* @param props.onArchive - archive a session by id.
* @param props.drag - optional draggable-row wiring.
* @param props.flat - omit the empty status slot in the hierarchy-free flat list.
* @param props.t - the browser root's locale seat.
* @returns the session row.
*/
function SessionNodeItem({ node, currentId, now, onOpen, onRename, onFork, onArchive, drag, flat = false, t }) {
	const row = node;
	const title = displayTitle(node, t);
	const selected = node.id === currentId;
	const statuses = sessionStatuses(node, t);
	const showStatus = statuses[0].state !== "done" || row.completed;
	const [menuOpen, setMenuOpen] = (0, react.useState)(false);
	const sessionMenuItems = [
		{
			id: "rename",
			label: t("rename"),
			icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconEditOutline16, {})
		},
		{
			id: "fork",
			label: t("menu.fork"),
			icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconBranchOutline16, {})
		},
		{
			id: "archive",
			label: t("menu.archiveSession"),
			icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconArchiveOutline20, { size: 16 })
		}
	];
	const ownRow = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: clsx(Rows_module_css_default.sessionRow, selected && Rows_module_css_default.selected, menuOpen && Rows_module_css_default.menuOpen, flat && !showStatus && Rows_module_css_default.flatSessionRowWithoutStatus, drag?.marker === "before" && Rows_module_css_default.dropBefore, drag?.marker === "after" && Rows_module_css_default.dropAfter),
		role: "treeitem",
		"aria-selected": selected,
		onClick: () => {
			onOpen(node.id);
		},
		draggable: drag !== void 0,
		onDragStart: drag === void 0 ? void 0 : (e) => {
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", node.id);
			drag.start();
		},
		onDragEnd: drag?.end,
		onDragOver: drag === void 0 ? void 0 : (e) => {
			if (!drag.active) return;
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";
			drag.hover(rowHalf(e));
		},
		onDrop: drag === void 0 ? void 0 : (e) => {
			if (!drag.active) return;
			e.preventDefault();
			drag.drop(rowHalf(e));
		},
		children: [
			(!flat || showStatus) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: Rows_module_css_default.slot,
				children: showStatus && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionStatusDots, { statuses })
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: Rows_module_css_default.title,
				children: title
			}),
			!row.blank && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: Rows_module_css_default.time,
				children: timeLabel(row.updatedAt, now, t)
			}),
			!row.blank && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: Rows_module_css_default.rowActions,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Menu, {
					open: menuOpen,
					onClose: () => {
						setMenuOpen(false);
					},
					items: sessionMenuItems,
					onSelect: (id) => {
						setMenuOpen(false);
						if (id === "rename") onRename(node.id, row.title);
						if (id === "fork") onFork(node.id);
						if (id === "archive") onArchive(node.id);
					},
					portal: true,
					closeOnPointerLeave: true,
					anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: Rows_module_css_default.iconButton,
						"aria-label": t("actions.session.aria", { name: title }),
						onClick: (e) => {
							e.stopPropagation();
							setMenuOpen((v) => !v);
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconEllipsisOutline16, {})
					})
				})
			})
		]
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HoverCard, {
		anchor: ownRow,
		content: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionHoverContent, {
			node,
			now,
			t
		}),
		disabled: menuOpen || drag?.active === true,
		copyText: row.blank ? void 0 : row.title,
		copyLabel: t("copy"),
		copiedLabel: t("hover.copied")
	});
}

//#endregion
//#region src/client/multiroot/api.ts
const API_PREFIX = "/plugins/multiroot/api";
function isRecord(value) {
	return typeof value === "object" && value !== null;
}
function isEnvelope(value) {
	return isRecord(value) && typeof value.ok === "boolean";
}
function errorMessage(payload, status) {
	if (isEnvelope(payload) && payload.ok === false && isRecord(payload.error) && typeof payload.error.message === "string") return payload.error.message;
	return `multiroot request failed: ${status}`;
}
/** Send one same-origin request to the multiroot Host API. */
async function multirootRequest(path, init) {
	const response = await fetch(`${API_PREFIX}${path}`, init);
	const payload = await response.json();
	if (!isEnvelope(payload) || payload.ok !== true) throw new Error(errorMessage(payload, response.status));
	return payload.value;
}
function jsonRequest(path, method, body) {
	return multirootRequest(path, {
		method,
		headers: { "content-type": "application/json" },
		...body === void 0 ? {} : { body: JSON.stringify(body) }
	});
}
/** Typed mutations used by the multiroot dialogs. */
const multirootApi = {
	list: () => multirootRequest("/workspaces"),
	create: (input) => jsonRequest("/workspaces", "POST", input),
	update: (id, input) => jsonRequest(`/workspaces/${encodeURIComponent(id)}`, "PATCH", input),
	setPrimary: (id, alias) => jsonRequest(`/workspaces/${encodeURIComponent(id)}/primary`, "PUT", { alias }),
	delete: (id) => jsonRequest(`/workspaces/${encodeURIComponent(id)}`, "DELETE")
};
/** Load logical Workspace records while retaining the last ready snapshot after a failed refresh. */
function useMultirootRecords(enabled = true) {
	const [state, setState] = (0, react.useState)({
		phase: enabled ? "loading" : "ready",
		records: [],
		error: null
	});
	const refresh = (0, react.useCallback)(async () => {
		if (!enabled) return;
		try {
			const records = await multirootApi.list();
			setState({
				phase: "ready",
				records,
				error: null
			});
		} catch (cause) {
			setState((previous) => ({
				phase: "error",
				records: previous.records,
				error: cause instanceof Error ? cause.message : String(cause)
			}));
			throw cause;
		}
	}, [enabled]);
	(0, react.useEffect)(() => {
		refresh().catch(() => {});
	}, [refresh]);
	return {
		...state,
		refresh
	};
}

//#endregion
//#region src/client/multiroot/join.ts
/** Join logical metadata to Host Workspaces without path inference. */
function joinMultiroot(workspaces, records) {
	const workspaceIds = new Set(workspaces.map((workspace) => workspace.workspaceId));
	const metadataByWorkspaceId = /* @__PURE__ */ new Map();
	const missingShadowIds = [];
	for (const logical of records) {
		if (!workspaceIds.has(logical.shadowWorkspaceId)) {
			missingShadowIds.push(logical.id);
			continue;
		}
		const primary = logical.roots.find((root) => root.primary);
		if (primary === void 0) continue;
		metadataByWorkspaceId.set(logical.shadowWorkspaceId, {
			logical,
			rootCount: logical.roots.length,
			primaryAlias: primary.alias
		});
	}
	return {
		workspaces: [...workspaces],
		metadataByWorkspaceId,
		missingShadowIds
	};
}

//#endregion
//#region \0dsh-css:src/client/multiroot/Dialogs.module.css.mjs
const css$2 = ".dJwC2G_dialog{width:min(760px,100%);max-height:calc(100dvh - 48px)}.dJwC2G_dialogContent{min-height:0}.dJwC2G_form{flex-direction:column;gap:16px;width:100%;min-width:0;display:flex}.dJwC2G_field{color:var(--dsw-alias-label-primary);flex-direction:column;gap:6px;font-size:13px;display:flex}.dJwC2G_input{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);width:100%;color:var(--dsw-alias-label-primary);font:inherit;border-radius:8px;outline:none;padding:8px 10px}.dJwC2G_input:focus{border-color:var(--dsw-alias-state-business-primary)}.dJwC2G_rootList{border-block:1px solid var(--dsw-alias-border-l2);min-height:0;overflow:hidden}.dJwC2G_rootListHeader{color:var(--dsw-alias-label-tertiary);justify-content:space-between;padding:8px 4px;font-size:12px;display:flex}.dJwC2G_rootScroller{overscroll-behavior:contain;scrollbar-gutter:stable;flex-direction:column;gap:8px;max-height:clamp(160px,100dvh - 390px,390px);padding:0 4px 8px;display:flex;overflow-y:auto}.dJwC2G_rootRow{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:12px;padding:12px}.dJwC2G_rootFields{grid-template-columns:minmax(180px,.7fr) minmax(260px,1.3fr);gap:12px;display:grid}.dJwC2G_rootPath{overflow-wrap:anywhere;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);min-width:0;min-height:36px;color:var(--dsw-alias-label-secondary);user-select:text;border-radius:8px;padding:8px 10px;font-size:12px;line-height:18px;display:block}.dJwC2G_rootActions{justify-content:space-between;align-items:center;gap:8px;margin-top:10px;display:flex}.dJwC2G_primary,.dJwC2G_makePrimary{align-items:center;gap:7px;font-size:12px;display:inline-flex}.dJwC2G_primary{color:var(--dsw-alias-label-primary)}.dJwC2G_radio,.dJwC2G_radioSelected{border:1px solid var(--dsw-alias-border-l1);border-radius:50%;width:14px;height:14px}.dJwC2G_radioSelected{border:4px solid var(--dsw-alias-state-business-primary)}.dJwC2G_removeButton{color:var(--dsw-alias-state-error-primary);margin-left:auto}.dJwC2G_error{color:var(--dsw-alias-state-error-primary);font-size:12px}.dJwC2G_hint{color:var(--dsw-alias-label-tertiary);font-size:12px}@media (width<=680px){.dJwC2G_rootFields{grid-template-columns:1fr}}";
const tagId$2 = "dsh-multiroot-workspace/Dialogs.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-multiroot-workspace";
	tag.dataset.pluginCss = tagId$2;
	tag.textContent = css$2;
	document.head.appendChild(tag);
}
var Dialogs_module_css_default = {
	"dialog": "dJwC2G_dialog",
	"dialogContent": "dJwC2G_dialogContent",
	"error": "dJwC2G_error",
	"field": "dJwC2G_field",
	"form": "dJwC2G_form",
	"hint": "dJwC2G_hint",
	"input": "dJwC2G_input",
	"makePrimary": "dJwC2G_makePrimary",
	"primary": "dJwC2G_primary",
	"radio": "dJwC2G_radio",
	"radioSelected": "dJwC2G_radioSelected",
	"removeButton": "dJwC2G_removeButton",
	"rootActions": "dJwC2G_rootActions",
	"rootFields": "dJwC2G_rootFields",
	"rootList": "dJwC2G_rootList",
	"rootListHeader": "dJwC2G_rootListHeader",
	"rootPath": "dJwC2G_rootPath",
	"rootRow": "dJwC2G_rootRow",
	"rootScroller": "dJwC2G_rootScroller"
};

//#endregion
//#region src/client/multiroot/Dialogs.tsx
function basename(path) {
	return path.split(/[\\/]/).filter(Boolean).at(-1) ?? path;
}
function uniqueAlias(path, roots) {
	const base = basename(path) || "root";
	let alias = base;
	let suffix = 2;
	const used = new Set(roots.map((root) => root.alias.toLowerCase()));
	while (used.has(alias.toLowerCase())) alias = `${base}-${suffix++}`;
	return alias;
}
function MultirootDialog({ open, record, onClose, refresh, renderDirectoryFlow, t }) {
	const [title, setTitle] = (0, react.useState)("");
	const [roots, setRoots] = (0, react.useState)([]);
	const [picking, setPicking] = (0, react.useState)(false);
	const [saving, setSaving] = (0, react.useState)(false);
	const [error, setError] = (0, react.useState)(null);
	(0, react.useEffect)(() => {
		if (!open) return;
		setTitle(record?.title ?? "");
		setRoots(record?.roots.map((root) => ({ ...root })) ?? []);
		setPicking(false);
		setSaving(false);
		setError(null);
	}, [open, record]);
	const appendRoot = (path) => {
		setRoots((current) => {
			if (current.some((root) => root.path === path)) return current;
			const alias = uniqueAlias(path, current);
			if (current.length === 0 && title.trim() === "") setTitle(alias);
			return [...current, {
				alias,
				path,
				primary: current.length === 0
			}];
		});
		setPicking(false);
	};
	const save = async () => {
		if (saving || title.trim() === "" || roots.length === 0) return;
		setSaving(true);
		setError(null);
		try {
			if (record === null) await multirootApi.create({
				title: title.trim(),
				roots
			});
			else {
				const oldPrimary = record.roots.find((root) => root.primary)?.alias;
				const nextPrimary = roots.find((root) => root.primary)?.alias;
				const rootsWithOldPrimary = roots.map((root) => ({
					...root,
					primary: root.alias.toLowerCase() === oldPrimary?.toLowerCase()
				}));
				await multirootApi.update(record.id, {
					title: title.trim(),
					roots: rootsWithOldPrimary
				});
				if (nextPrimary !== void 0 && nextPrimary.toLowerCase() !== oldPrimary?.toLowerCase()) await multirootApi.setPrimary(record.id, nextPrimary);
			}
			await refresh();
			onClose();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : String(cause));
		} finally {
			setSaving(false);
		}
	};
	const remove = (index) => {
		setRoots((current) => {
			const next = current.filter((_, candidate) => candidate !== index);
			if (next.length > 0 && !next.some((root) => root.primary)) next[0] = {
				...next[0],
				primary: true
			};
			return next;
		});
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Modal, {
		open,
		onClose: () => {
			if (!saving) onClose();
		},
		closeLabel: t("close"),
		title: record === null ? t("multiroot.add") : t("multiroot.manage.title"),
		className: Dialogs_module_css_default.dialog,
		contentClassName: Dialogs_module_css_default.dialogContent,
		footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
			record !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
				variant: "outline",
				disabled: saving,
				onClick: () => {
					setSaving(true);
					multirootApi.delete(record.id).then(refresh).then(onClose).catch((cause) => {
						setError(cause instanceof Error ? cause.message : String(cause));
						setSaving(false);
					});
				},
				children: t("multiroot.delete")
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
				variant: "outline",
				disabled: saving,
				onClick: onClose,
				children: t("cancel")
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
				variant: "primary",
				disabled: saving || title.trim() === "" || roots.length === 0,
				onClick: () => {
					save();
				},
				children: record === null ? t("multiroot.create") : t("save")
			})
		] }),
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: Dialogs_module_css_default.form,
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
					className: Dialogs_module_css_default.field,
					children: [t("field.workspaceName"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						className: Dialogs_module_css_default.input,
						"aria-label": t("field.workspaceName"),
						value: title,
						onChange: (event) => {
							setTitle(event.target.value);
						}
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: Dialogs_module_css_default.rootList,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: Dialogs_module_css_default.rootListHeader,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("multiroot.roots") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("multiroot.rootCount", { count: roots.length }) })]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: Dialogs_module_css_default.rootScroller,
						role: "region",
						"aria-label": t("multiroot.roots"),
						children: [roots.map((root, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: Dialogs_module_css_default.rootRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: Dialogs_module_css_default.rootFields,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: Dialogs_module_css_default.field,
									children: [t("multiroot.directoryName"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: Dialogs_module_css_default.input,
										"aria-label": t("multiroot.alias", { n: index + 1 }),
										value: root.alias,
										onChange: (event) => {
											const alias = event.target.value;
											setRoots((current) => current.map((item, candidate) => candidate === index ? {
												...item,
												alias
											} : item));
										}
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: Dialogs_module_css_default.field,
									children: [t("multiroot.directoryPath"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: Dialogs_module_css_default.rootPath,
										title: root.path,
										children: root.path
									})]
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: Dialogs_module_css_default.rootActions,
								children: [root.primary ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: Dialogs_module_css_default.primary,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: Dialogs_module_css_default.radioSelected,
										"aria-hidden": "true"
									}), t("multiroot.currentPrimary")]
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "sm",
									disabled: saving,
									onClick: () => {
										setRoots((current) => current.map((item, candidate) => ({
											...item,
											primary: candidate === index
										})));
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: Dialogs_module_css_default.makePrimary,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: Dialogs_module_css_default.radio,
											"aria-hidden": "true"
										}), t("multiroot.makePrimary", { name: root.alias })]
									})
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									className: Dialogs_module_css_default.removeButton,
									variant: "ghost",
									size: "sm",
									disabled: saving || roots.length === 1,
									onClick: () => {
										remove(index);
									},
									children: t("multiroot.remove")
								})]
							})]
						}, `${root.path}:${index}`)), roots.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: Dialogs_module_css_default.hint,
							children: t("multiroot.empty")
						})]
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					variant: "outline",
					disabled: saving || picking,
					onClick: () => {
						setPicking(true);
					},
					children: t("multiroot.addFolder")
				}),
				error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: Dialogs_module_css_default.error,
					children: error
				})
			]
		})
	}), renderDirectoryFlow({
		open: open && picking,
		busy: saving,
		onPicked: appendRoot,
		onCancel: () => {
			setPicking(false);
		},
		onError: (message) => {
			setPicking(false);
			setError(message);
		}
	})] });
}

//#endregion
//#region \0dsh-css:src/client/upstream/WorkspacePicker.module.css.mjs
const css$1 = ".Otje1q_modalAction{min-width:72px}.Otje1q_modalError,.Otje1q_menuStatus{margin-top:8px;font-size:12px;line-height:18px}.Otje1q_modalError{color:var(--dsw-alias-state-error-primary)}.Otje1q_menuStatus{color:var(--dsw-alias-label-secondary)}";
const tagId$1 = "dsh-multiroot-workspace/WorkspacePicker.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-multiroot-workspace";
	tag.dataset.pluginCss = tagId$1;
	tag.textContent = css$1;
	document.head.appendChild(tag);
}
var WorkspacePicker_module_css_default = {
	"menuStatus": "Otje1q_menuStatus",
	"modalAction": "Otje1q_modalAction",
	"modalError": "Otje1q_modalError"
};

//#endregion
//#region src/client/upstream/WorkspacePicker.tsx
const ADD_WORKSPACE = "::add-workspace";
/**
* Render the pick menu plus the adoption error dialog.
* @param props - owner-controlled flow props.
* @returns menu + dialog elements.
*/
function WorkspacePickFlow({ t, open, anchorRef, useWorkspaces, createWorkspace, useDirectoryFlow, renderDirectoryFlow, onPick, onClose, addOnly = false, side = "bottom", selectedId }) {
	const workspaceSnapshot = useWorkspaces((state) => state);
	const workspaces = workspaceSnapshot.items;
	const getAnchorRect = (0, react.useCallback)(() => anchorRef?.current?.getBoundingClientRect() ?? null, [anchorRef]);
	const [errorOpen, setErrorOpen] = (0, react.useState)(false);
	const [modalError, setModalError] = (0, react.useState)(null);
	const [flowOpen, setFlowOpen] = (0, react.useState)(false);
	const [pickingFolder, setPickingFolder] = (0, react.useState)(false);
	const flowBusy = flowOpen || pickingFolder;
	const flowAvailable = useDirectoryFlow((occupied) => occupied);
	(0, react.useEffect)(() => {
		if (flowOpen && !flowAvailable) setFlowOpen(false);
	}, [flowOpen, flowAvailable]);
	const addEntries = flowAvailable ? [{
		id: ADD_WORKSPACE,
		label: t("menu.addWorkspace"),
		icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconPlusOutline16, { size: 16 }),
		disabled: flowBusy
	}] : [];
	const pinAdd = !addOnly && workspaces.length > 0;
	const items = pinAdd ? workspaces.map((workspace) => ({
		id: workspace.workspaceId,
		label: workspace.title,
		icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolderClose16, { size: 16 }),
		disabled: flowBusy
	})) : addEntries;
	const menuIsEmpty = items.length === 0;
	const closeModal = () => {
		setErrorOpen(false);
		setModalError(null);
	};
	/** Adopt a picked directory; failures land in the folder-error dialog (Choose again reopens the flow). */
	const adoptDirectory = (path) => createWorkspace({ path }).then((workspace) => {
		setFlowOpen(false);
		onPick(workspace.workspaceId);
	}).catch((reason) => {
		setModalError(reason instanceof Error ? reason.message : String(reason));
		setFlowOpen(false);
		setErrorOpen(true);
	});
	const openDirectoryFlow = (0, react.useCallback)(() => {
		onClose();
		setErrorOpen(false);
		setModalError(null);
		setFlowOpen(true);
	}, [onClose]);
	const listSettled = addOnly || workspaceSnapshot.phase === "ready";
	const addIsTheOnlyEntry = !pinAdd && listSettled && addEntries.length === 1;
	(0, react.useEffect)(() => {
		if (open && addIsTheOnlyEntry && !flowBusy) openDirectoryFlow();
	}, [
		open,
		addIsTheOnlyEntry,
		flowBusy,
		openDirectoryFlow
	]);
	/** Owner side of the flow conversation: adopt keeps the flow open (busy) until the Host answers. */
	const flowOwner = {
		open: flowOpen,
		busy: pickingFolder,
		onPicked: (path) => {
			setPickingFolder(true);
			adoptDirectory(path).finally(() => {
				setPickingFolder(false);
			});
		},
		onCancel: () => {
			setFlowOpen(false);
		},
		onError: (message) => {
			setFlowOpen(false);
			setModalError(message);
			setErrorOpen(true);
		}
	};
	const handleSelect = (id) => {
		if (id === ADD_WORKSPACE) {
			openDirectoryFlow();
			return;
		}
		onPick(id);
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Menu, {
			open: open && !addIsTheOnlyEntry && !menuIsEmpty,
			anchor: null,
			items,
			...pinAdd ? { footer: addEntries } : {},
			selectedId,
			onSelect: handleSelect,
			onClose,
			side,
			portal: true,
			getAnchorRect
		}),
		open && !addIsTheOnlyEntry && !menuIsEmpty && workspaceSnapshot.phase === "pending" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			className: WorkspacePicker_module_css_default.menuStatus,
			role: "status",
			children: t("picker.loading")
		}),
		renderDirectoryFlow(flowOwner),
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Modal, {
			open: errorOpen,
			onClose: closeModal,
			closeLabel: t("close"),
			title: t("folderError.title"),
			footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
				variant: "outline",
				className: WorkspacePicker_module_css_default.modalAction,
				onClick: closeModal,
				children: t("cancel")
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
				variant: "primary",
				className: WorkspacePicker_module_css_default.modalAction,
				disabled: !flowAvailable,
				onClick: openDirectoryFlow,
				children: t("folderError.retry")
			})] }),
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: WorkspacePicker_module_css_default.modalError,
				role: "alert",
				children: modalError
			})
		})
	] });
}
/**
* The conversation empty-state registration: adapts the owner share to the
* core flow (all state and semantics live in the flow / the owner).
* @param props - empty-state slot props (owner share + injected creation callback).
* @returns the flow element.
*/
function WorkspacePicker({ open, anchorRef, useWorkspaces, selectedId, onPick, onClose, createWorkspace, useDirectoryFlow, renderSlot, t }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkspacePickFlow, {
		t,
		open,
		anchorRef,
		useWorkspaces,
		createWorkspace,
		useDirectoryFlow,
		renderDirectoryFlow: (owner) => renderSlot("conversation.hero.workspace.directoryFlow", owner),
		selectedId,
		onPick,
		onClose
	});
}

//#endregion
//#region \0dsh-css:src/client/upstream/WorkspaceBrowser.module.css.mjs
const css = ".gMvsnW_root{--dsh-session-list-edge-inset:var(--dsh-sidebar-inline-padding);--dsh-session-list-scrollbar-width:8px;--dsh-session-list-scrollbar-offset:2px;box-sizing:border-box;min-height:0;padding-right:var(--dsh-session-list-edge-inset);flex-direction:column;flex:1;display:flex}.gMvsnW_root.gMvsnW_rail{padding-right:0}.gMvsnW_iconButton{cursor:pointer;width:28px;height:28px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.gMvsnW_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.gMvsnW_sectionHeader{box-sizing:border-box;height:36px;color:var(--dsw-alias-label-tertiary);border-radius:12px;flex:none;justify-content:flex-end;align-items:center;gap:4px;margin-bottom:4px;padding-left:4px;display:flex;overflow:hidden}.gMvsnW_root:not(.gMvsnW_rail) .gMvsnW_sectionHeader{margin-top:2px;margin-right:-4px}.gMvsnW_sectionLabel{white-space:nowrap;opacity:1;visibility:visible;min-width:0;max-width:45%;transition:max-width .18s var(--ds-ease-in-out), margin-right .18s var(--ds-ease-in-out), opacity .12s var(--ds-ease-in-out), transform .18s var(--ds-ease-in-out), visibility 0s linear;flex:none;line-height:20px;overflow:hidden}.gMvsnW_sectionLabelHidden{opacity:0;visibility:hidden;max-width:0;margin-right:-4px;transition-delay:0s,0s,0s,0s,.18s;transform:translate(-4px)}.gMvsnW_searchSlot{box-sizing:border-box;min-width:0;max-width:28px;transition:max-width .18s var(--ds-ease-in-out), padding-left .18s var(--ds-ease-in-out);flex:1;align-items:center;margin-left:auto;padding-left:0;display:flex}.gMvsnW_searchSlotExpanded{max-width:100%;padding-left:0}.gMvsnW_headerActions{opacity:1;visibility:visible;max-width:92px;transition:max-width .18s var(--ds-ease-in-out), opacity .12s var(--ds-ease-in-out), transform .18s var(--ds-ease-in-out), visibility 0s linear;flex:none;align-items:center;gap:4px;display:flex;overflow:hidden}.gMvsnW_multirootError{color:var(--dsw-alias-state-error-primary);padding:4px 8px;font-size:12px;line-height:18px}.gMvsnW_headerActionsHidden{opacity:0;visibility:hidden;pointer-events:none;max-width:0;transition-delay:0s,0s,0s,.18s;transform:translate(4px)}.gMvsnW_search{box-sizing:border-box;cursor:text;width:100%;height:28px;color:var(--dsw-alias-label-secondary);transition:width .18s var(--ds-ease-in-out), padding .18s var(--ds-ease-in-out), border-color .18s var(--ds-ease-in-out), background-color .18s var(--ds-ease-in-out);background:0 0;border:none;border-radius:50%;flex:none;align-items:center;gap:0;margin:0;padding:0;display:flex;overflow:hidden}.gMvsnW_searchExpanded{border:1px solid var(--dsw-alias-border-l2);width:calc(100% + 4px);height:30px;color:var(--dsw-alias-label-caption);background:0 0;border-radius:10px;margin-inline:-2px;padding:0 4px 0 0}.gMvsnW_searchButton{cursor:pointer;width:28px;height:28px;color:inherit;background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.gMvsnW_searchExpanded .gMvsnW_searchButton{width:28px;height:30px}.gMvsnW_searchButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.gMvsnW_searchExpanded .gMvsnW_searchButton:hover{background:0 0}.gMvsnW_searchInput{opacity:0;pointer-events:none;width:0;min-width:0;color:var(--dsw-alias-label-primary);transition:opacity .12s var(--ds-ease-in-out);background:0 0;border:none;outline:none;flex:1;font-size:13px;line-height:18px}.gMvsnW_searchExpanded .gMvsnW_searchInput{opacity:1;pointer-events:auto;margin-left:-2px}.gMvsnW_searchInput::placeholder{color:var(--dsw-alias-label-tertiary)}.gMvsnW_clearButton{cursor:pointer;width:24px;height:24px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.gMvsnW_clearButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.gMvsnW_rail .gMvsnW_sectionHeader{justify-content:flex-start;gap:0;margin-bottom:12px;padding-left:0}.gMvsnW_rail .gMvsnW_headerActions{max-width:none}.gMvsnW_rail .gMvsnW_iconButton{width:36px;height:36px;color:var(--dsw-alias-label-primary)}.gMvsnW_rail .gMvsnW_search{background:0 0;border-color:#0000;gap:0;width:36px;height:36px;margin:0 0 12px;padding:0}.gMvsnW_rail .gMvsnW_searchButton{width:36px;height:36px;color:var(--dsw-alias-label-primary)}.gMvsnW_rail .gMvsnW_searchButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.gMvsnW_listArea{min-height:0;margin-left:-4px;margin-right:calc(-1 * var(--dsh-session-list-edge-inset));flex-direction:column;flex:1;padding-left:4px;display:flex;overflow:visible}.gMvsnW_rail .gMvsnW_listArea{margin-left:0;margin-right:0;padding-left:0}.gMvsnW_treeBody{flex-direction:column;flex:1;min-height:0;display:flex;position:relative}.gMvsnW_fade{left:0;right:var(--dsh-session-list-edge-inset);background:linear-gradient(to bottom, transparent, var(--dsw-specific-sidebar-fill));pointer-events:none;height:24px;position:absolute;bottom:0}.gMvsnW_wide{animation:gMvsnW_wide-in .2s var(--ds-ease-in-out)}@keyframes gMvsnW_wide-in{0%{opacity:0}}.gMvsnW_list{min-height:0;margin-left:-4px;margin-right:var(--dsh-session-list-scrollbar-offset);padding-left:4px;padding-right:calc(var(--dsh-session-list-edge-inset) - var(--dsh-session-list-scrollbar-width) - var(--dsh-session-list-scrollbar-offset));scrollbar-gutter:stable;flex:1;padding-bottom:16px;overflow-y:auto}.gMvsnW_flatList>*+*,.gMvsnW_searchTree>[role=treeitem]+[role=treeitem],.gMvsnW_groupSection>*+*{margin-top:2px}.gMvsnW_searchStatus,.gMvsnW_searchWarning{color:var(--dsw-alias-label-tertiary);padding:10px 12px;font-size:12px;line-height:18px}.gMvsnW_searchWarning{color:var(--dsw-alias-label-secondary)}.gMvsnW_groupSection{position:relative}.gMvsnW_groupSection+.gMvsnW_groupSection{margin-top:4px}.gMvsnW_listTopDropIndicator,.gMvsnW_workspaceDropBefore:before,.gMvsnW_workspaceDropAfter:after{content:\"\";z-index:1;background:linear-gradient(55deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 0 / 5px 7px no-repeat, linear-gradient(125deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 5px / 5px 7px no-repeat, linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px / calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:0}.gMvsnW_listTopDropIndicator{top:-8px;left:0;right:var(--dsh-session-list-edge-inset)}.gMvsnW_listTopDropActive>.gMvsnW_workspaceDropBefore:first-child:before{display:none}.gMvsnW_workspaceDropBefore:before{top:-8px}.gMvsnW_workspaceDropAfter:after{bottom:-8px}.gMvsnW_sessionOverflowButton{cursor:pointer;text-align:left;width:100%;height:28px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:8px;padding:0 12px 0 28px;font-size:12px}.gMvsnW_groupSection>.gMvsnW_sessionOverflowButton{margin-top:0}.gMvsnW_sessionOverflowButton:hover{color:var(--dsw-alias-label-secondary);background:0 0}.gMvsnW_empty{color:var(--dsw-alias-label-tertiary);padding:16px 12px;font-size:13px}.gMvsnW_renameInput{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;height:44px;color:var(--dsw-alias-label-primary);background:0 0;border-radius:22px;outline:none;padding:7px 14px;font-size:14px;font-weight:400;line-height:22px}.gMvsnW_renameInput:disabled{color:var(--dsw-alias-label-dimmed)}.gMvsnW_renameError{color:var(--dsw-alias-state-error-primary);margin-top:8px;font-size:12px;line-height:18px}.gMvsnW_deleteAction:not(:disabled){color:var(--dsw-alias-state-error-primary)}.gMvsnW_deleteStatus{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}@media (prefers-reduced-motion:reduce){.gMvsnW_wide{animation:none}.gMvsnW_search,.gMvsnW_sectionLabel,.gMvsnW_searchSlot,.gMvsnW_searchInput,.gMvsnW_headerActions{transition:none}}";
const tagId = "dsh-multiroot-workspace/WorkspaceBrowser.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-multiroot-workspace";
	tag.dataset.pluginCss = tagId;
	tag.textContent = css;
	document.head.appendChild(tag);
}
var WorkspaceBrowser_module_css_default = {
	"clearButton": "gMvsnW_clearButton",
	"deleteAction": "gMvsnW_deleteAction",
	"deleteStatus": "gMvsnW_deleteStatus",
	"empty": "gMvsnW_empty",
	"fade": "gMvsnW_fade",
	"flatList": "gMvsnW_flatList",
	"groupSection": "gMvsnW_groupSection",
	"headerActions": "gMvsnW_headerActions",
	"headerActionsHidden": "gMvsnW_headerActionsHidden",
	"iconButton": "gMvsnW_iconButton",
	"list": "gMvsnW_list",
	"listArea": "gMvsnW_listArea",
	"listTopDropActive": "gMvsnW_listTopDropActive",
	"listTopDropIndicator": "gMvsnW_listTopDropIndicator",
	"multirootError": "gMvsnW_multirootError",
	"rail": "gMvsnW_rail",
	"renameError": "gMvsnW_renameError",
	"renameInput": "gMvsnW_renameInput",
	"root": "gMvsnW_root",
	"search": "gMvsnW_search",
	"searchButton": "gMvsnW_searchButton",
	"searchExpanded": "gMvsnW_searchExpanded",
	"searchInput": "gMvsnW_searchInput",
	"searchSlot": "gMvsnW_searchSlot",
	"searchSlotExpanded": "gMvsnW_searchSlotExpanded",
	"searchStatus": "gMvsnW_searchStatus",
	"searchTree": "gMvsnW_searchTree",
	"searchWarning": "gMvsnW_searchWarning",
	"sectionHeader": "gMvsnW_sectionHeader",
	"sectionLabel": "gMvsnW_sectionLabel",
	"sectionLabelHidden": "gMvsnW_sectionLabelHidden",
	"sessionOverflowButton": "gMvsnW_sessionOverflowButton",
	"treeBody": "gMvsnW_treeBody",
	"wide": "gMvsnW_wide",
	"wide-in": "gMvsnW_wide-in",
	"workspaceDropAfter": "gMvsnW_workspaceDropAfter",
	"workspaceDropBefore": "gMvsnW_workspaceDropBefore"
};

//#endregion
//#region src/client/upstream/WorkspaceBrowser.tsx
/**
* The workspace/session browsing region filling the sidebar shell's
* `sidebar.workspaces` hole: section header (title + view options + add
* workspace), search, the grouped tree or flat list, and the workspace
* dialogs. Wide state renders the full browser; rail state renders the two
* region icons (search / add workspace) as 36px controls on the shell's shared
* rail entry path, each requesting expansion through the owner share. Adding
* is the header button's one action, so it raises the directory flow with no
* menu in between; the flow and its error dialog live in WorkspacePicker
* (same package — direct composition, no slot between them).
*/
/**
* Column slide length (--ds-transition-duration-slow): rail-search focus waits it out —
* focus() forces a synchronous layout and would jank the slide.
*/
const EXPAND_SLIDE_MS = 300;
/** Pause between the latest keystroke and a Host content-search request. */
const SEARCH_DEBOUNCE_MS = 250;
/** `session.search` wire bound, measured in JavaScript UTF-16 code units. */
const SEARCH_QUERY_MAX_CODE_UNITS = 500;
/** Session rows visible per Workspace before the local overflow control. */
const COLLAPSED_SESSION_LIMIT = 5;
/** Keep controlled input and RPC payload inside the session.search wire contract. */
function sanitizeSearchQuery(value) {
	const withoutNul = value.replaceAll("\0", "");
	if (withoutNul.length <= SEARCH_QUERY_MAX_CODE_UNITS) return withoutNul;
	let end = SEARCH_QUERY_MAX_CODE_UNITS;
	const last = withoutNul.charCodeAt(end - 1);
	const next = withoutNul.charCodeAt(end);
	if (last >= 55296 && last <= 56319 && next >= 56320 && next <= 57343) end--;
	return withoutNul.slice(0, end);
}
/** Immutable membership toggle for the local expand-all array. */
function toggled(list, key) {
	return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
}
/**
* Accept the native drag at document level while a row drag is active: row
* hover still owns the insertion marker, and releasing outside the list must
* not be rendered as a rejected drop before dragend commits that last marker.
*/
function useNativeDragAcceptance(active) {
	(0, react.useEffect)(() => {
		if (!active) return;
		const acceptDrag = (event) => {
			event.preventDefault();
			if (event.dataTransfer !== null) event.dataTransfer.dropEffect = "move";
		};
		const acceptDrop = (event) => {
			event.preventDefault();
		};
		document.addEventListener("dragover", acceptDrag);
		document.addEventListener("drop", acceptDrop);
		return () => {
			document.removeEventListener("dragover", acceptDrag);
			document.removeEventListener("drop", acceptDrop);
		};
	}, [active]);
}
/** Reconcile a stored view order with the Workspace's current session account. */
function reconciledSessionOrder(sessionIds, stored) {
	if (stored === void 0) return [...sessionIds];
	const byId = new Map(sessionIds.map((id) => [id, id]));
	const ordered = [];
	const included = /* @__PURE__ */ new Set();
	for (const key of stored) {
		const id = byId.get(key);
		if (id === void 0 || included.has(key)) continue;
		ordered.push(id);
		included.add(key);
	}
	for (const id of sessionIds) {
		if (included.has(id)) continue;
		ordered.push(id);
	}
	return ordered;
}
/** Newest update first with stable Session identity as the tie-break. */
function compareSessionRecency(a, b, byId) {
	const aUpdatedAt = byId[a]?.updatedAt ?? Number.NEGATIVE_INFINITY;
	const bUpdatedAt = byId[b]?.updatedAt ?? Number.NEGATIVE_INFINITY;
	if (aUpdatedAt !== bUpdatedAt) return bUpdatedAt - aUpdatedAt;
	return a < b ? -1 : 1;
}
/** Reconcile one editable order account and apply its activity-promotion policy. */
function nextSessionOrderAccount({ sessionIds, previousOrder, previousUpdatedAt, list, orderBy, sortByRecency }) {
	let order = reconciledSessionOrder(sessionIds, previousOrder);
	if (sortByRecency) order.sort((a, b) => compareSessionRecency(a, b, list.byId));
	else if (orderBy === "updated") {
		const promoted = sessionIds.filter((id) => {
			const session = list.byId[id];
			return session !== void 0 && (previousUpdatedAt[id] === void 0 || session.updatedAt > previousUpdatedAt[id]);
		}).sort((a, b) => compareSessionRecency(a, b, list.byId));
		if (promoted.length > 0) {
			const promotedIds = new Set(promoted);
			order = [...promoted, ...order.filter((id) => !promotedIds.has(id))];
		}
	}
	const updatedAt = {};
	for (const id of sessionIds) {
		const session = list.byId[id];
		if (session !== void 0) updatedAt[id] = session.updatedAt;
	}
	const orderChanged = previousOrder === void 0 || order.length !== previousOrder.length || order.some((id, index) => id !== previousOrder[index]);
	const timestampsChanged = Object.keys(updatedAt).length !== Object.keys(previousUpdatedAt).length || Object.entries(updatedAt).some(([id, timestamp]) => previousUpdatedAt[id] !== timestamp);
	return {
		order,
		updatedAt,
		changed: orderChanged || timestampsChanged
	};
}
/** Grouping and ordering menu; own open state so it resets with the wide chrome. */
function ViewOptionsMenu({ groupBy, orderBy, onGroupPick, onOrderPick, t }) {
	const [open, setOpen] = (0, react.useState)(false);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Menu, {
		open,
		onClose: () => {
			setOpen(false);
		},
		items: [
			{
				type: "label",
				id: "group-by",
				text: t("groupBy.label")
			},
			{
				id: "workspace",
				label: t("groupBy.workspace")
			},
			{
				id: "flat",
				label: t("groupBy.flat")
			},
			{
				type: "separator",
				id: "order-by-separator"
			},
			{
				type: "label",
				id: "order-by",
				text: t("orderBy.label")
			},
			{
				id: "manual",
				label: t("orderBy.manual")
			},
			{
				id: "updated",
				label: t("orderBy.updated")
			}
		],
		selectedIds: [groupBy, orderBy],
		onSelect: (id) => {
			if (id === "workspace" || id === "flat") onGroupPick(id);
			else if (id === "manual" || id === "updated") onOrderPick(id);
			setOpen(false);
		},
		align: "end",
		dense: true,
		portal: true,
		anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tooltip, {
			label: t("viewOptions.label"),
			side: "bottom",
			delayMs: 500,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: clsx(WorkspaceBrowser_module_css_default.iconButton, WorkspaceBrowser_module_css_default.wide),
				"aria-label": t("viewOptions.label"),
				onClick: () => {
					setOpen((v) => !v);
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconPersonalizationOutline16, {})
			})
		})
	});
}
/** Resolve an insertion side from the full rendered workspace group. */
function workspaceGroupHalf(e) {
	const rect = e.currentTarget.getBoundingClientRect();
	return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
}
/** The scrolling session tree; unmounting drops the sessions subscription and expand-all state. */
function SessionTree({ useSessions, startSession, open, forkSession, workspaces, archivedSessionIds, onRenameRequest, onDeleteRequest, onSessionRename, onSessionArchive, insertWorkspaceBefore, insertSessionBefore, orderBy, multirootMetadata, onManageRequest, groupExpansion, setGroupExpanded, sessionOrderByAccount, sessionUpdatedAtByAccount, syncSessionOrderAccount, setSessionOrder, t }) {
	const list = useSessions((s) => s);
	const current = list.current;
	const [expandedSessionGroups, setExpandedSessionGroups] = (0, react.useState)([]);
	const [drag, setDrag] = (0, react.useState)(null);
	const sessionDropCommitted = (0, react.useRef)(false);
	const [workspaceDrag, setWorkspaceDrag] = (0, react.useState)(null);
	const workspaceDropCommitted = (0, react.useRef)(false);
	const previousOrderBy = (0, react.useRef)(orderBy);
	useNativeDragAcceptance(drag !== null || workspaceDrag !== null);
	const currentGroup = current === void 0 ? void 0 : workspaces.find((w) => w.sessionIds.includes(current))?.workspaceId ?? "";
	(0, react.useEffect)(() => {
		if (current === void 0 || currentGroup === void 0 || Object.hasOwn(groupExpansion, currentGroup)) return;
		setGroupExpanded(currentGroup, true);
	}, [
		current,
		currentGroup,
		setGroupExpanded,
		groupExpansion
	]);
	const expandedGroups = (0, react.useMemo)(() => Object.entries(groupExpansion).filter(([, expanded]) => expanded).map(([key]) => key), [groupExpansion]);
	const ungroupedSessionIds = (0, react.useMemo)(() => {
		const accounted = new Set(workspaces.flatMap((workspace) => workspace.sessionIds));
		return list.ids.filter((id) => list.byId[id] !== void 0 && !accounted.has(id));
	}, [list, workspaces]);
	(0, react.useEffect)(() => {
		if (list.phase !== "ready") return;
		const switchedToUpdated = previousOrderBy.current !== "updated" && orderBy === "updated";
		previousOrderBy.current = orderBy;
		const accounts = [...workspaces.map((workspace) => ({
			key: workspace.workspaceId,
			sessionIds: workspace.sessionIds.filter((id) => list.byId[id] !== void 0)
		})), {
			key: "",
			sessionIds: ungroupedSessionIds
		}];
		for (const { key, sessionIds } of accounts) {
			const previousOrder = sessionOrderByAccount[key];
			const next = nextSessionOrderAccount({
				sessionIds,
				previousOrder,
				previousUpdatedAt: sessionUpdatedAtByAccount[key] ?? {},
				list,
				orderBy,
				sortByRecency: orderBy === "updated" && (previousOrder === void 0 || switchedToUpdated)
			});
			if (next.changed) syncSessionOrderAccount(key, next.order.map((id) => id), next.updatedAt);
		}
	}, [
		list,
		orderBy,
		sessionOrderByAccount,
		sessionUpdatedAtByAccount,
		syncSessionOrderAccount,
		ungroupedSessionIds,
		workspaces
	]);
	const orderedWorkspaces = (0, react.useMemo)(() => {
		return workspaces.map((workspace) => {
			const stored = sessionOrderByAccount[workspace.workspaceId];
			const sessionIds = reconciledSessionOrder(workspace.sessionIds, stored);
			return {
				...workspace,
				sessionIds
			};
		});
	}, [sessionOrderByAccount, workspaces]);
	const orderedUngroupedSessionIds = (0, react.useMemo)(() => reconciledSessionOrder(ungroupedSessionIds, sessionOrderByAccount[""]), [sessionOrderByAccount, ungroupedSessionIds]);
	const groups = (0, react.useMemo)(() => deriveGroups(list, orderedWorkspaces, archivedSessionIds, {
		expandedGroups,
		...sessionOrderByAccount[""] === void 0 ? {} : { ungroupedOrder: sessionOrderByAccount[""] }
	}), [
		list,
		orderedWorkspaces,
		archivedSessionIds,
		expandedGroups,
		sessionOrderByAccount
	]);
	const now = Date.now();
	const commitSessionDrag = (activeDrag, over) => {
		if (sessionDropCommitted.current) return;
		sessionDropCommitted.current = true;
		setDrag(null);
		const group = groups.find((candidate) => candidate.key === activeDrag.accountKey);
		if (group === void 0) return;
		const targetIndex = group.sessions.findIndex((session) => session.id === over.id);
		if (targetIndex === -1) return;
		const anchor = over.half === "before" ? over.id : group.sessions[targetIndex + 1]?.id;
		if (anchor === activeDrag.sessionId) return;
		const sourceIndex = group.sessions.findIndex((session) => session.id === activeDrag.sessionId);
		const anchorIndex = anchor === void 0 ? group.sessions.length : group.sessions.findIndex((session) => session.id === anchor);
		if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
		const accountSessionIds = activeDrag.accountKey === "" ? orderedUngroupedSessionIds : orderedWorkspaces.find((workspace) => workspace.workspaceId === activeDrag.accountKey)?.sessionIds;
		if (accountSessionIds === void 0) return;
		const nextOrder = accountSessionIds.filter((id) => id !== activeDrag.sessionId);
		const insertAt = anchor === void 0 ? nextOrder.length : nextOrder.indexOf(anchor);
		nextOrder.splice(insertAt === -1 ? nextOrder.length : insertAt, 0, activeDrag.sessionId);
		setSessionOrder(activeDrag.accountKey, nextOrder.map((id) => id));
		if (orderBy === "updated" || activeDrag.accountKey === "") return;
		insertSessionBefore(activeDrag.accountKey, activeDrag.sessionId, anchor).catch((reason) => {
			console.warn("session reorder rejected:", reason);
		});
	};
	const commitWorkspaceDrag = (activeDrag, over) => {
		if (workspaceDropCommitted.current) return;
		workspaceDropCommitted.current = true;
		setWorkspaceDrag(null);
		const rowIndex = workspaces.findIndex((workspace) => workspace.workspaceId === over.id);
		if (rowIndex === -1) return;
		const anchor = over.half === "before" ? over.id : workspaces[rowIndex + 1]?.workspaceId;
		if (anchor === activeDrag.workspaceId) return;
		const sourceIndex = workspaces.findIndex((workspace) => workspace.workspaceId === activeDrag.workspaceId);
		const anchorIndex = anchor === void 0 ? workspaces.length : workspaces.findIndex((workspace) => workspace.workspaceId === anchor);
		if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
		insertWorkspaceBefore(activeDrag.workspaceId, anchor).catch((reason) => {
			console.warn("workspace reorder rejected:", reason);
		});
	};
	const workspaceDropAtListStart = groups[0]?.workspaceId !== void 0 && workspaceDrag?.over?.id === groups[0].workspaceId && workspaceDrag.over.half === "before";
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
		children: [
			workspaceDropAtListStart && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: WorkspaceBrowser_module_css_default.listTopDropIndicator,
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: clsx(WorkspaceBrowser_module_css_default.list, workspaceDropAtListStart && WorkspaceBrowser_module_css_default.listTopDropActive),
				role: "tree",
				"aria-label": t("section.sessions"),
				children: [groups.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.empty,
					children: t("empty.none")
				}), groups.map((group) => {
					const workspaceId = group.workspaceId;
					const workspaceMarker = workspaceId !== void 0 && workspaceDrag?.over?.id === workspaceId ? workspaceDrag.over.half : null;
					const workspaceDragProps = workspaceId === void 0 ? void 0 : {
						start: () => {
							workspaceDropCommitted.current = false;
							setWorkspaceDrag({
								workspaceId,
								over: null
							});
						},
						end: () => {
							if (workspaceDrag?.over !== null && workspaceDrag?.over !== void 0) commitWorkspaceDrag(workspaceDrag, workspaceDrag.over);
							else setWorkspaceDrag(null);
							workspaceDropCommitted.current = false;
						}
					};
					const hoverWorkspace = workspaceId === void 0 ? void 0 : (half) => {
						setWorkspaceDrag((active) => active === null ? active : {
							...active,
							over: {
								id: workspaceId,
								half
							}
						});
					};
					const dropWorkspace = workspaceId === void 0 ? void 0 : (half) => {
						if (workspaceDrag === null) return;
						commitWorkspaceDrag(workspaceDrag, {
							id: workspaceId,
							half
						});
					};
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: clsx(WorkspaceBrowser_module_css_default.groupSection, workspaceMarker === "before" && WorkspaceBrowser_module_css_default.workspaceDropBefore, workspaceMarker === "after" && WorkspaceBrowser_module_css_default.workspaceDropAfter),
						onDragOver: workspaceDrag === null || hoverWorkspace === void 0 ? void 0 : (e) => {
							e.preventDefault();
							e.dataTransfer.dropEffect = "move";
							hoverWorkspace(workspaceGroupHalf(e));
						},
						onDrop: workspaceDrag === null || dropWorkspace === void 0 ? void 0 : (e) => {
							e.preventDefault();
							dropWorkspace(workspaceGroupHalf(e));
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProjectRowItem, {
								group,
								multiroot: group.workspaceId === void 0 ? void 0 : multirootMetadata.get(group.workspaceId),
								t,
								onToggle: () => {
									if (group.expanded) setExpandedSessionGroups((keys) => keys.filter((key) => key !== group.key));
									setGroupExpanded(group.key, !group.expanded);
								},
								onCreate: () => {
									if (group.workspaceId !== void 0) {
										setGroupExpanded(group.key, true);
										startSession(group.workspaceId);
									}
								},
								drag: workspaceDragProps,
								actions: group.workspaceId === void 0 ? void 0 : {
									rename: () => {
										/* v8 ignore next -- narrowing guard: the actions object exists only for real-workspace groups. */
										if (group.workspaceId !== void 0) onRenameRequest(group.workspaceId, group.label);
									},
									delete: () => {
										/* v8 ignore next -- narrowing guard: the actions object exists only for real-workspace groups. */
										if (group.workspaceId !== void 0) onDeleteRequest(group.workspaceId, group.label);
									},
									...multirootMetadata.has(group.workspaceId) ? { manage: () => {
										onManageRequest(group.workspaceId);
									} } : {}
								}
							}),
							(expandedSessionGroups.includes(group.key) ? group.sessions : group.sessions.slice(0, COLLAPSED_SESSION_LIMIT)).map((node) => {
								const sameGroupDrag = drag !== null && drag.accountKey === group.key;
								const dragProps = {
									start: () => {
										sessionDropCommitted.current = false;
										setDrag({
											accountKey: group.key,
											sessionId: node.id,
											over: null
										});
									},
									active: sameGroupDrag,
									marker: sameGroupDrag && drag.over?.id === node.id ? drag.over.half : null,
									hover: (half) => {
										/* v8 ignore next -- narrowing guard: Rows gates hover on `active`, which is false while the drag state is null. */
										setDrag((d) => d === null ? d : {
											...d,
											over: {
												id: node.id,
												half
											}
										});
									},
									drop: (half) => {
										/* v8 ignore next -- narrowing guard: Rows gates drop on `active`, which is false while the drag state is null. */
										if (drag === null) return;
										commitSessionDrag(drag, {
											id: node.id,
											half
										});
									},
									end: () => {
										if (drag?.over !== null && drag?.over !== void 0) commitSessionDrag(drag, drag.over);
										else setDrag(null);
										sessionDropCommitted.current = false;
									}
								};
								return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionNodeItem, {
									node,
									currentId: current,
									now,
									onOpen: open,
									onRename: onSessionRename,
									onFork: forkSession,
									onArchive: onSessionArchive,
									drag: dragProps,
									t
								}, node.id);
							}),
							group.sessions.length > COLLAPSED_SESSION_LIMIT && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: WorkspaceBrowser_module_css_default.sessionOverflowButton,
								"aria-expanded": expandedSessionGroups.includes(group.key),
								onClick: () => {
									setExpandedSessionGroups((keys) => toggled(keys, group.key));
								},
								children: expandedSessionGroups.includes(group.key) ? t("sessions.collapse") : t("sessions.expand", { n: group.sessions.length - COLLAPSED_SESSION_LIMIT })
							})
						]
					}, group.key);
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })
		]
	});
}
/** The flat "In one list" body: every session is one draggable top-level row. */
function FlatList({ useSessions, open, forkSession, onSessionRename, onSessionArchive, archivedSessionIds, orderBy, sessionOrderByAccount, sessionUpdatedAtByAccount, syncSessionOrderAccount, setSessionOrder, t }) {
	const list = useSessions((s) => s);
	const baseRows = (0, react.useMemo)(() => deriveFlat(list, archivedSessionIds), [list, archivedSessionIds]);
	const sessionIds = (0, react.useMemo)(() => baseRows.map((row) => row.id), [baseRows]);
	const previousOrderBy = (0, react.useRef)(orderBy);
	(0, react.useEffect)(() => {
		if (list.phase !== "ready") return;
		const previousOrder = sessionOrderByAccount[FLAT_SESSION_ORDER_KEY];
		const previousUpdatedAt = sessionUpdatedAtByAccount["__flat_session_order__"] ?? {};
		const switchedToUpdated = previousOrderBy.current !== "updated" && orderBy === "updated";
		previousOrderBy.current = orderBy;
		const next = nextSessionOrderAccount({
			sessionIds,
			previousOrder,
			previousUpdatedAt,
			list,
			orderBy,
			sortByRecency: orderBy === "updated" && (previousOrder === void 0 || switchedToUpdated)
		});
		if (next.changed) syncSessionOrderAccount(FLAT_SESSION_ORDER_KEY, next.order.map((id) => id), next.updatedAt);
	}, [
		list,
		orderBy,
		sessionOrderByAccount,
		sessionUpdatedAtByAccount,
		sessionIds,
		syncSessionOrderAccount
	]);
	const rows = (0, react.useMemo)(() => {
		const byId = new Map(baseRows.map((row) => [row.id, row]));
		return reconciledSessionOrder(sessionIds, sessionOrderByAccount[FLAT_SESSION_ORDER_KEY]).flatMap((id) => {
			const row = byId.get(id);
			return row === void 0 ? [] : [row];
		});
	}, [
		baseRows,
		sessionOrderByAccount,
		sessionIds
	]);
	const [drag, setDrag] = (0, react.useState)(null);
	const dropCommitted = (0, react.useRef)(false);
	useNativeDragAcceptance(drag !== null);
	const commitDrag = (activeDrag, over) => {
		if (dropCommitted.current) return;
		dropCommitted.current = true;
		setDrag(null);
		const targetIndex = rows.findIndex((row) => row.id === over.id);
		if (targetIndex === -1) return;
		const anchor = over.half === "before" ? over.id : rows[targetIndex + 1]?.id;
		if (anchor === activeDrag.sessionId) return;
		const sourceIndex = rows.findIndex((row) => row.id === activeDrag.sessionId);
		const anchorIndex = anchor === void 0 ? rows.length : rows.findIndex((row) => row.id === anchor);
		if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
		const nextOrder = rows.map((row) => row.id).filter((id) => id !== activeDrag.sessionId);
		const insertAt = anchor === void 0 ? nextOrder.length : nextOrder.indexOf(anchor);
		nextOrder.splice(insertAt === -1 ? nextOrder.length : insertAt, 0, activeDrag.sessionId);
		setSessionOrder(FLAT_SESSION_ORDER_KEY, nextOrder.map((id) => id));
	};
	const now = Date.now();
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: clsx(WorkspaceBrowser_module_css_default.list, WorkspaceBrowser_module_css_default.flatList),
			role: "tree",
			"aria-label": t("section.sessions"),
			children: [rows.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: WorkspaceBrowser_module_css_default.empty,
				children: t("empty.none")
			}), rows.map((node) => {
				const active = drag !== null;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionNodeItem, {
					node,
					currentId: list.current,
					now,
					onOpen: open,
					onRename: onSessionRename,
					onFork: forkSession,
					onArchive: onSessionArchive,
					flat: true,
					drag: {
						start: () => {
							dropCommitted.current = false;
							setDrag({
								accountKey: FLAT_SESSION_ORDER_KEY,
								sessionId: node.id,
								over: null
							});
						},
						active,
						marker: active && drag.over?.id === node.id ? drag.over.half : null,
						hover: (half) => {
							setDrag((current) => current === null ? current : {
								...current,
								over: {
									id: node.id,
									half
								}
							});
						},
						drop: (half) => {
							if (drag !== null) commitDrag(drag, {
								id: node.id,
								half
							});
						},
						end: () => {
							if (drag?.over !== null && drag?.over !== void 0) commitDrag(drag, drag.over);
							else setDrag(null);
							dropCommitted.current = false;
						}
					},
					t
				}, node.id);
			})]
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })]
	});
}
/** Flat search body: local metadata matches plus the current Host result page. */
function SearchResults({ useSessions, open, workspaces, archivedSessionIds, query, remote, resultLimit, t }) {
	const list = useSessions((s) => s);
	const currentRemote = remote.query === query ? remote : {
		query,
		status: "loading",
		items: [],
		hasMore: false
	};
	const results = (0, react.useMemo)(() => deriveSearchResults(list, workspaces, query, archivedSessionIds, currentRemote, resultLimit), [
		list,
		workspaces,
		query,
		archivedSessionIds,
		currentRemote,
		resultLimit
	]);
	const pending = currentRemote.status === "loading";
	const failed = currentRemote.status === "error";
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: WorkspaceBrowser_module_css_default.list,
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.searchTree,
					role: "tree",
					"aria-label": t("search.results.aria"),
					children: results.items.map((result) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SearchResultItem, {
						result,
						currentId: list.current,
						onOpen: open,
						t
					}, result.id))
				}),
				pending && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.searchStatus,
					role: "status",
					children: t("search.pending")
				}),
				failed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.searchWarning,
					role: "status",
					children: t("search.unavailable")
				}),
				!pending && results.items.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.empty,
					children: t("search.noMatches")
				}),
				results.hasMore && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.searchStatus,
					children: t("search.hasMore", { n: resultLimit })
				})
			]
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })]
	});
}
/**
* Render the browsing region.
* @param props - composed slot props (shell owner share + store + injected actions).
* @returns the region element tree.
*/
function WorkspaceBrowser({ wide, expandSidebar, useSessions, useWorkspaces, useStore, actions, startSession, open, renameSession, forkSession, renameWorkspace, deleteWorkspace, insertWorkspaceBefore, archiveSession, insertSessionBefore, createWorkspace, searchSessions, searchResultLimit, multirootEnabled, useDirectoryFlow, renderSlot, t }) {
	const workspaces = useWorkspaces((state) => state.items);
	const multirootQuery = useMultirootRecords(multirootEnabled === true);
	const multirootJoin = (0, react.useMemo)(() => joinMultiroot(workspaces, multirootQuery.records), [multirootQuery.records, workspaces]);
	const workspacePhase = useWorkspaces((state) => state.phase);
	const archivedSessionIds = useWorkspaces((state) => state.archivedSessionIds);
	const directoryFlowAvailable = useDirectoryFlow((occupied) => occupied);
	const groupBy = useStore((s) => s.groupBy);
	const orderBy = useStore((s) => s.orderBy);
	const groupExpansion = useStore((s) => s.groupExpansion);
	const sessionOrderByAccount = useStore((s) => s.sessionOrderByAccount);
	const sessionUpdatedAtByAccount = useStore((s) => s.sessionUpdatedAtByAccount);
	(0, react.useEffect)(() => {
		if (workspacePhase !== "ready") return;
		actions.retainAccountKeys([
			"",
			FLAT_SESSION_ORDER_KEY,
			...workspaces.map((workspace) => workspace.workspaceId)
		]);
	}, [
		actions.retainAccountKeys,
		workspacePhase,
		workspaces
	]);
	const [query, setQuery] = (0, react.useState)("");
	const [searchExpanded, setSearchExpanded] = (0, react.useState)(false);
	const normalizedQuery = sanitizeSearchQuery(query).trim();
	const [remoteSearch, setRemoteSearch] = (0, react.useState)({
		query: "",
		status: "idle",
		items: [],
		hasMore: false
	});
	const searchRoot = (0, react.useRef)(null);
	const searchInput = (0, react.useRef)(null);
	const [wsPickerOpen, setWsPickerOpen] = (0, react.useState)(false);
	const wsPlusRef = (0, react.useRef)(null);
	const composingRef = (0, react.useRef)(false);
	const [multirootDialogRecord, setMultirootDialogRecord] = (0, react.useState)(void 0);
	const [searchOnExpand, setSearchOnExpand] = (0, react.useState)(false);
	(0, react.useEffect)(() => {
		if (wide && searchOnExpand) {
			const timer = window.setTimeout(() => {
				searchInput.current?.focus({ preventScroll: true });
				setSearchOnExpand(false);
			}, EXPAND_SLIDE_MS);
			return () => {
				window.clearTimeout(timer);
			};
		}
	}, [wide, searchOnExpand]);
	(0, react.useEffect)(() => {
		if (!wide || !searchExpanded || searchOnExpand) return;
		searchInput.current?.focus({ preventScroll: true });
	}, [
		wide,
		searchExpanded,
		searchOnExpand
	]);
	(0, react.useEffect)(() => {
		if (!wide || !searchExpanded) return;
		const onClick = (event) => {
			if (!(event.target instanceof Node) || searchRoot.current?.contains(event.target) === true) return;
			searchInput.current?.blur();
			if (normalizedQuery !== "") return;
			setSearchExpanded(false);
		};
		document.addEventListener("click", onClick);
		return () => {
			document.removeEventListener("click", onClick);
		};
	}, [
		normalizedQuery,
		wide,
		searchExpanded
	]);
	(0, react.useEffect)(() => {
		if (normalizedQuery === "") {
			setRemoteSearch({
				query: "",
				status: "idle",
				items: [],
				hasMore: false
			});
			return;
		}
		const controller = new AbortController();
		setRemoteSearch({
			query: normalizedQuery,
			status: "loading",
			items: [],
			hasMore: false
		});
		const timer = window.setTimeout(() => {
			searchSessions(normalizedQuery, controller.signal).then((result) => {
				if (controller.signal.aborted) return;
				setRemoteSearch({
					query: normalizedQuery,
					status: "ready",
					items: result.items,
					hasMore: result.hasMore
				});
			}).catch(() => {
				if (controller.signal.aborted) return;
				setRemoteSearch({
					query: normalizedQuery,
					status: "error",
					items: [],
					hasMore: false
				});
			});
		}, SEARCH_DEBOUNCE_MS);
		return () => {
			window.clearTimeout(timer);
			controller.abort();
		};
	}, [normalizedQuery, searchSessions]);
	const [renameTarget, setRenameTarget] = (0, react.useState)(null);
	const [renameDraft, setRenameDraft] = (0, react.useState)("");
	const [renaming, setRenaming] = (0, react.useState)(false);
	const [renameError, setRenameError] = (0, react.useState)(null);
	const renameTrimmed = renameDraft.trim();
	const renameDuplicate = renameTarget !== null && renameTrimmed !== "" && renameTrimmed !== renameTarget.currentTitle && workspaces.some((w) => w.title === renameTrimmed);
	const renameBlocked = renaming || renameTrimmed === "" || renameTarget === null || renameTrimmed === renameTarget.currentTitle || renameDuplicate;
	const closeRename = () => {
		if (renaming) return;
		setRenameTarget(null);
		setRenameError(null);
	};
	const confirmRename = () => {
		if (renameBlocked) return;
		setRenaming(true);
		setRenameError(null);
		renameWorkspace(renameTarget.workspaceId, renameTrimmed).then(() => {
			setRenaming(false);
			setRenameTarget(null);
		}).catch((reason) => {
			setRenaming(false);
			setRenameError(reason instanceof Error ? reason.message : String(reason));
		});
	};
	const [sessionRenameTarget, setSessionRenameTarget] = (0, react.useState)(null);
	const [sessionRenameDraft, setSessionRenameDraft] = (0, react.useState)("");
	const [sessionRenaming, setSessionRenaming] = (0, react.useState)(false);
	const [sessionRenameError, setSessionRenameError] = (0, react.useState)(null);
	const sessionRenameTrimmed = sessionRenameDraft.trim();
	const sessionRenameBlocked = sessionRenaming || sessionRenameTrimmed === "" || sessionRenameTarget === null;
	const closeSessionRename = () => {
		if (sessionRenaming) return;
		setSessionRenameTarget(null);
		setSessionRenameError(null);
	};
	const confirmSessionRename = () => {
		if (sessionRenameBlocked) return;
		setSessionRenaming(true);
		setSessionRenameError(null);
		renameSession(sessionRenameTarget.sessionId, sessionRenameTrimmed).then(() => {
			setSessionRenaming(false);
			setSessionRenameTarget(null);
		}).catch((reason) => {
			setSessionRenaming(false);
			setSessionRenameError(reason instanceof Error ? reason.message : String(reason));
		});
	};
	const onSessionRename = (sessionId, currentTitle) => {
		setSessionRenameTarget({
			sessionId,
			currentTitle
		});
		setSessionRenameDraft(currentTitle);
		setSessionRenameError(null);
	};
	const onSessionArchive = (sessionId) => {
		archiveSession(sessionId).catch((reason) => {
			console.warn("session archive rejected:", reason);
		});
	};
	const [deleteTarget, setDeleteTarget] = (0, react.useState)(null);
	const [deleting, setDeleting] = (0, react.useState)(false);
	const [deleteCommittedId, setDeleteCommittedId] = (0, react.useState)(null);
	const [deleteError, setDeleteError] = (0, react.useState)(null);
	(0, react.useEffect)(() => {
		if (deleteCommittedId === null || workspaces.some((workspace) => workspace.workspaceId === deleteCommittedId)) return;
		setDeleting(false);
		setDeleteCommittedId(null);
		setDeleteTarget(null);
	}, [deleteCommittedId, workspaces]);
	const closeDelete = () => {
		if (deleting) return;
		setDeleteTarget(null);
		setDeleteError(null);
	};
	const confirmDelete = () => {
		/* v8 ignore next -- the Modal is absent without a target and its button is disabled while deleting. */
		if (deleting || deleteTarget === null) return;
		setDeleting(true);
		setDeleteCommittedId(null);
		setDeleteError(null);
		deleteWorkspace(deleteTarget.workspaceId).then(() => {
			setDeleteCommittedId(deleteTarget.workspaceId);
		}).catch((reason) => {
			setDeleting(false);
			setDeleteError(reason instanceof Error ? reason.message : String(reason));
		});
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: clsx(WorkspaceBrowser_module_css_default.root, !wide && WorkspaceBrowser_module_css_default.rail),
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: WorkspaceBrowser_module_css_default.sectionHeader,
				children: [
					wide && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: clsx(WorkspaceBrowser_module_css_default.sectionLabel, WorkspaceBrowser_module_css_default.wide, searchExpanded && WorkspaceBrowser_module_css_default.sectionLabelHidden),
						children: groupBy === "flat" ? t("section.sessions") : t("section.workspaces")
					}),
					wide && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: clsx(WorkspaceBrowser_module_css_default.searchSlot, searchExpanded && WorkspaceBrowser_module_css_default.searchSlotExpanded),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							ref: searchRoot,
							className: clsx(WorkspaceBrowser_module_css_default.search, searchExpanded && WorkspaceBrowser_module_css_default.searchExpanded),
							onClick: () => {
								setWsPickerOpen(false);
								setSearchExpanded(true);
								searchInput.current?.focus();
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tooltip, {
									label: t("search"),
									side: "bottom",
									delayMs: 500,
									disabled: searchExpanded,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: WorkspaceBrowser_module_css_default.searchButton,
										"aria-label": t("search.sessions.aria"),
										"aria-expanded": searchExpanded,
										onClick: () => {
											setWsPickerOpen(false);
											setSearchExpanded(true);
										},
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconSearchOutline16, { size: searchExpanded ? 11 : 14 })
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									ref: searchInput,
									className: WorkspaceBrowser_module_css_default.searchInput,
									type: "text",
									placeholder: t("search.placeholder"),
									maxLength: SEARCH_QUERY_MAX_CODE_UNITS,
									value: query,
									tabIndex: searchExpanded ? 0 : -1,
									onChange: (e) => {
										setQuery(sanitizeSearchQuery(e.target.value));
									},
									onKeyDown: (e) => {
										if (e.key !== "Escape") return;
										setQuery("");
										setSearchExpanded(false);
									}
								}),
								searchExpanded && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: WorkspaceBrowser_module_css_default.clearButton,
									"aria-label": t("search.clear"),
									onClick: (e) => {
										e.stopPropagation();
										setQuery("");
										setSearchExpanded(false);
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconCloseFill14, {})
								})
							]
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: clsx(WorkspaceBrowser_module_css_default.headerActions, wide && searchExpanded && WorkspaceBrowser_module_css_default.headerActionsHidden),
						children: [
							wide && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ViewOptionsMenu, {
								groupBy,
								orderBy,
								onGroupPick: (mode) => {
									actions.setGroupBy(mode);
								},
								onOrderPick: (mode) => {
									actions.setOrderBy(mode);
								},
								t
							}),
							directoryFlowAvailable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tooltip, {
								label: t("workspace.add"),
								side: "bottom",
								delayMs: 500,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									ref: wsPlusRef,
									type: "button",
									className: WorkspaceBrowser_module_css_default.iconButton,
									"aria-label": t("workspace.add"),
									onClick: () => {
										setWsPickerOpen((v) => !v);
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconProjectAddOutline16, { size: wide ? 16 : 18 })
								})
							}),
							multirootEnabled === true && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tooltip, {
								label: t("multiroot.add"),
								side: "bottom",
								delayMs: 500,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: WorkspaceBrowser_module_css_default.iconButton,
									"aria-label": t("multiroot.add"),
									disabled: !directoryFlowAvailable || multirootQuery.phase === "error",
									onClick: () => {
										setWsPickerOpen(false);
										setMultirootDialogRecord(null);
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconBranchOutline16, { size: wide ? 16 : 18 })
								})
							})
						]
					}),
					multirootDialogRecord === void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkspacePickFlow, {
						t,
						open: wsPickerOpen,
						anchorRef: wsPlusRef,
						useWorkspaces,
						createWorkspace,
						useDirectoryFlow,
						renderDirectoryFlow: (owner) => renderSlot("sidebar.workspaces.directoryFlow", owner),
						addOnly: true,
						side: "right",
						onPick: (workspaceId) => {
							setWsPickerOpen(false);
							startSession(workspaceId);
						},
						onClose: () => {
							setWsPickerOpen(false);
						}
					})
				]
			}),
			!wide && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: WorkspaceBrowser_module_css_default.search,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tooltip, {
					label: t("search"),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: WorkspaceBrowser_module_css_default.searchButton,
						"aria-label": t("search.sessions.aria"),
						onClick: () => {
							setSearchExpanded(true);
							setSearchOnExpand(true);
							expandSidebar();
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconSearchOutline16, { size: 18 })
					})
				})
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: WorkspaceBrowser_module_css_default.listArea,
				children: [wide && multirootQuery.error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.multirootError,
					children: t("multiroot.unavailable")
				}), wide && (normalizedQuery !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SearchResults, {
					useSessions,
					open,
					workspaces,
					archivedSessionIds,
					query: normalizedQuery,
					remote: remoteSearch,
					resultLimit: searchResultLimit,
					t
				}) : groupBy === "flat" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FlatList, {
					useSessions,
					open,
					forkSession,
					onSessionRename,
					onSessionArchive,
					archivedSessionIds,
					orderBy,
					sessionOrderByAccount,
					sessionUpdatedAtByAccount,
					syncSessionOrderAccount: actions.syncSessionOrderAccount,
					setSessionOrder: actions.setSessionOrder,
					t
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionTree, {
					useSessions,
					onSessionRename,
					onSessionArchive,
					forkSession,
					workspaces,
					groupExpansion,
					setGroupExpanded: actions.setGroupExpanded,
					sessionOrderByAccount,
					sessionUpdatedAtByAccount,
					syncSessionOrderAccount: actions.syncSessionOrderAccount,
					setSessionOrder: actions.setSessionOrder,
					archivedSessionIds,
					startSession,
					open,
					insertWorkspaceBefore,
					insertSessionBefore,
					orderBy,
					multirootMetadata: multirootJoin.metadataByWorkspaceId,
					onManageRequest: (workspaceId) => {
						const metadata = multirootJoin.metadataByWorkspaceId.get(workspaceId);
						if (metadata !== void 0) setMultirootDialogRecord(metadata.logical);
					},
					t,
					onRenameRequest: (workspaceId, currentTitle) => {
						setRenameTarget({
							workspaceId,
							currentTitle
						});
						setRenameDraft(currentTitle);
						setRenameError(null);
					},
					onDeleteRequest: (workspaceId, title) => {
						setDeleteTarget({
							workspaceId,
							title
						});
						setDeleteError(null);
					}
				}))]
			}),
			multirootDialogRecord !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MultirootDialog, {
				open: true,
				record: multirootDialogRecord,
				onClose: () => {
					setMultirootDialogRecord(void 0);
				},
				refresh: multirootQuery.refresh,
				renderDirectoryFlow: (owner) => renderSlot("sidebar.workspaces.directoryFlow", owner),
				t
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Modal, {
				open: renameTarget !== null,
				onClose: closeRename,
				closeLabel: t("close"),
				title: t("rename.workspace.title"),
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					variant: "outline",
					disabled: renaming,
					onClick: closeRename,
					children: t("cancel")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					variant: "primary",
					disabled: renameBlocked,
					onClick: confirmRename,
					children: t("rename")
				})] }),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						className: WorkspaceBrowser_module_css_default.renameInput,
						value: renameDraft,
						"aria-label": t("field.workspaceName"),
						autoFocus: true,
						disabled: renaming,
						onFocus: (e) => {
							e.target.select();
						},
						onChange: (e) => {
							setRenameDraft(e.target.value);
							setRenameError(null);
						},
						onCompositionStart: () => {
							composingRef.current = true;
						},
						onCompositionEnd: () => {
							composingRef.current = false;
						},
						onKeyDown: (e) => {
							if (e.key === "Enter" && !composingRef.current) {
								e.preventDefault();
								confirmRename();
							}
						}
					}),
					renameDuplicate && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: WorkspaceBrowser_module_css_default.renameError,
						role: "alert",
						children: t("conflict.named", { name: renameTrimmed })
					}),
					renameError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: WorkspaceBrowser_module_css_default.renameError,
						role: "alert",
						children: renameError
					})
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Modal, {
				open: sessionRenameTarget !== null,
				onClose: closeSessionRename,
				closeLabel: t("close"),
				title: t("rename.session.title"),
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					variant: "outline",
					disabled: sessionRenaming,
					onClick: closeSessionRename,
					children: t("cancel")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					variant: "primary",
					disabled: sessionRenameBlocked,
					onClick: confirmSessionRename,
					children: t("rename")
				})] }),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					className: WorkspaceBrowser_module_css_default.renameInput,
					value: sessionRenameDraft,
					"aria-label": t("field.sessionName"),
					autoFocus: true,
					disabled: sessionRenaming,
					onFocus: (e) => {
						e.target.select();
					},
					onChange: (e) => {
						setSessionRenameDraft(e.target.value);
						setSessionRenameError(null);
					},
					onCompositionStart: () => {
						composingRef.current = true;
					},
					onCompositionEnd: () => {
						composingRef.current = false;
					},
					onKeyDown: (e) => {
						if (e.key === "Enter" && !composingRef.current) {
							e.preventDefault();
							confirmSessionRename();
						}
					}
				}), sessionRenameError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.renameError,
					role: "alert",
					children: sessionRenameError
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Modal, {
				open: deleteTarget !== null,
				onClose: closeDelete,
				closeLabel: t("close"),
				title: t("delete.workspace"),
				...deleteTarget === null ? {} : { description: t("delete.desc", { name: deleteTarget.title }) },
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					variant: "outline",
					disabled: deleting,
					onClick: closeDelete,
					children: t("cancel")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					variant: "outline",
					className: WorkspaceBrowser_module_css_default.deleteAction,
					disabled: deleting,
					onClick: confirmDelete,
					children: t("delete.workspace")
				})] }),
				children: [deleting && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.deleteStatus,
					role: "status",
					children: t("delete.pending")
				}), deleteError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.renameError,
					role: "alert",
					children: deleteError
				})]
			})
		]
	});
}

//#endregion
//#region src/client/upstream/locales.ts
/**
* `workspace` namespace dictionaries: the browsing region (section header,
* search, tree rows, dialogs) and the pick/add flow. Runtime failure
* messages (wire error strings) pass through untranslated by policy.
*/
/** Simplified Chinese dictionary (the key-set source of truth). */
const zh = {
	"group.ungrouped": "未分组",
	"session.new": "新会话",
	"section.workspaces": "工作区",
	"section.sessions": "会话",
	"viewOptions.label": "视图选项",
	"groupBy.label": "分组方式",
	"groupBy.workspace": "按工作区",
	"groupBy.flat": "全部会话",
	"orderBy.label": "排序方式",
	"orderBy.manual": "手动排序",
	"orderBy.updated": "最近更新",
	"sessions.expand": "展开其余 {n} 个会话",
	"sessions.collapse": "收起",
	"empty.none": "暂无会话",
	"empty.noMatches": "无匹配结果",
	"workspace.add": "添加工作区",
	"search.sessions.aria": "搜索会话",
	"search.placeholder": "搜索会话…",
	"search.clear": "清除搜索",
	"search.results.aria": "搜索结果",
	"search.pending": "正在搜索会话历史…",
	"search.unavailable": "内容搜索暂不可用，仅显示名称匹配。",
	"search.noMatches": "无匹配会话",
	"search.hasMore": "仅显示前 {n} 条结果，请缩小搜索范围。",
	"menu.addWorkspace": "添加工作区…",
	"multiroot.manage": "管理多根工作区",
	"multiroot.manage.title": "管理多根工作区",
	"multiroot.add": "添加多根工作区",
	"multiroot.create": "创建",
	"multiroot.delete": "删除多根工作区",
	"multiroot.addFolder": "添加文件夹…",
	"multiroot.remove": "移除",
	"multiroot.primary": "主根",
	"multiroot.currentPrimary": "当前主根",
	"multiroot.makePrimary": "设“{name}”为主根",
	"multiroot.alias": "根 {n} 的别名",
	"multiroot.roots": "根目录",
	"multiroot.rootCount": "{count} 个",
	"multiroot.directoryName": "目录名称",
	"multiroot.directoryPath": "目录路径",
	"multiroot.empty": "至少添加一个文件夹。",
	"multiroot.unavailable": "多根工作区暂不可用",
	"multiroot.meta": "{count} 个根 · 主根 {primary}",
	"picker.loading": "正在加载工作区…",
	"conflict.named": "已存在名为“{name}”的工作区。",
	"folderError.title": "无法打开文件夹",
	"folderError.retry": "重新选择",
	"rename": "重命名",
	"rename.workspace.title": "重命名工作区",
	"rename.session.title": "重命名会话",
	"field.workspaceName": "工作区名称",
	"field.sessionName": "会话名称",
	"delete.workspace": "删除工作区",
	"delete.desc": "将把“{name}”从工作区列表中移除。文件夹与会话记录会保留，其会话将显示在“未分组”下。",
	"delete.pending": "正在删除工作区…",
	"menu.fork": "分叉会话",
	"menu.archiveSession": "归档会话",
	"sessions.count.one": "{n} 个会话",
	"sessions.count.other": "{n} 个会话",
	"actions.workspace.aria": "工作区“{name}”的操作",
	"actions.session.aria": "会话“{name}”的操作",
	"actions.newSession.aria": "在“{name}”中新建会话",
	"status.running": "进行中",
	"status.subagentsRunning.one": "{n} 个子代理运行中",
	"status.subagentsRunning.other": "{n} 个子代理运行中",
	"status.idle": "空闲",
	"status.waitingApproval": "等待审批",
	"status.planReview": "计划待审",
	"status.waitingAnswer": "等待回答",
	"status.completed": "已完成",
	"hover.created": "创建于 {time}",
	"hover.copied": "已复制",
	"date.ymd": "{y}年{m}月{d}日",
	"time.now": "刚刚",
	"time.minutes": "{n}分钟",
	"time.hours": "{n}小时",
	"time.days": "{n}天",
	"time.months": "{n}个月",
	"time.years": "{n}年",
	"time.ago": "{t}前"
};
/** English dictionary, checked complete against the zh key set. */
const en = {
	"group.ungrouped": "Ungrouped",
	"session.new": "New Session",
	"section.workspaces": "Workspaces",
	"section.sessions": "Sessions",
	"viewOptions.label": "View options",
	"groupBy.label": "Group by",
	"groupBy.workspace": "By workspace",
	"groupBy.flat": "All sessions",
	"orderBy.label": "Order by",
	"orderBy.manual": "Manual",
	"orderBy.updated": "Last updated",
	"sessions.expand": "Show {n} more sessions",
	"sessions.collapse": "Show less",
	"empty.none": "No sessions yet",
	"empty.noMatches": "No matches",
	"workspace.add": "Add workspace",
	"search.sessions.aria": "Search sessions",
	"search.placeholder": "Search sessions...",
	"search.clear": "Clear search",
	"search.results.aria": "Search results",
	"search.pending": "Searching session history…",
	"search.unavailable": "Content search is temporarily unavailable. Showing name matches.",
	"search.noMatches": "No matching sessions",
	"search.hasMore": "Showing the first {n} results. Narrow your search.",
	"menu.addWorkspace": "Add workspace…",
	"multiroot.manage": "Manage multiroot workspace",
	"multiroot.manage.title": "Manage multiroot workspace",
	"multiroot.add": "Add multiroot workspace",
	"multiroot.create": "Create",
	"multiroot.delete": "Delete multiroot workspace",
	"multiroot.addFolder": "Add folder…",
	"multiroot.remove": "Remove",
	"multiroot.primary": "Primary",
	"multiroot.currentPrimary": "Current primary",
	"multiroot.makePrimary": "Make {name} primary",
	"multiroot.alias": "Alias for root {n}",
	"multiroot.roots": "Root directories",
	"multiroot.rootCount": "{count}",
	"multiroot.directoryName": "Directory name",
	"multiroot.directoryPath": "Directory path",
	"multiroot.empty": "Add at least one folder.",
	"multiroot.unavailable": "Multiroot workspaces are unavailable",
	"multiroot.meta": "{count} roots · primary {primary}",
	"picker.loading": "Loading workspaces…",
	"conflict.named": "A workspace named “{name}” already exists.",
	"folderError.title": "Couldn’t open folder",
	"folderError.retry": "Choose again",
	"rename": "Rename",
	"rename.workspace.title": "Rename workspace",
	"rename.session.title": "Rename session",
	"field.workspaceName": "Workspace name",
	"field.sessionName": "Session name",
	"delete.workspace": "Delete workspace",
	"delete.desc": "This removes “{name}” from the workspace list. The folder and session logs will be kept. Its sessions will appear under Ungrouped.",
	"delete.pending": "Deleting workspace…",
	"menu.fork": "Fork session",
	"menu.archiveSession": "Archive session",
	"sessions.count.one": "{n} session",
	"sessions.count.other": "{n} sessions",
	"actions.workspace.aria": "Workspace actions for {name}",
	"actions.session.aria": "Session actions for {name}",
	"actions.newSession.aria": "New session in {name}",
	"status.running": "Running",
	"status.subagentsRunning.one": "{n} subagent running",
	"status.subagentsRunning.other": "{n} subagents running",
	"status.idle": "Idle",
	"status.waitingApproval": "Waiting for approval",
	"status.planReview": "Plan awaiting review",
	"status.waitingAnswer": "Waiting for answer",
	"status.completed": "Completed",
	"hover.created": "Created {time}",
	"hover.copied": "Copied",
	"date.ymd": "{y}-{m}-{d}",
	"time.now": "now",
	"time.minutes": "{n}min",
	"time.hours": "{n}h",
	"time.days": "{n}d",
	"time.months": "{n}mo",
	"time.years": "{n}y",
	"time.ago": "{t} ago"
};

//#endregion
//#region src/client/upstream/index.ts
/** Dictionary namespace owned by this plugin. */
const NS = "workspace";
/**
* Required services (cordis fiber inject). The target slots are declared by
* the ui-sidebar / ui-conversation applies, whose activation order relative
* to this one is NOT constrained: dsh.client.inject edges are informational
* (loading/prefetch metadata, never apply sequencing) and neither owner
* provides a waitable service. apply therefore depends on each slot
* declaration through `slots.inject()` instead of assuming order.
*/
const inject = [
	"slots",
	"sessions",
	"workspaces",
	"locale"
];
/**
* Register the browser and picker once their slot declarations are on the
* ledger. Inject factories return plain callbacks; data reads use the
* framework's global hooks.
* @param ctx - client root context.
*/
function apply$1(ctx, options = {}) {
	ctx.effect(() => ctx.locale.register(NS, {
		zh,
		en
	}), "ui-workspace: dictionaries");
	const searchSessions = async (query, signal) => {
		const result = await ctx.sessions.search(query, signal);
		if (!result.ok) throw new Error(result.error.message);
		return result.value;
	};
	const flowSource = (hole) => ({
		getSnapshot: () => ctx.slots.entries(hole).length > 0,
		subscribe: (listener) => ctx.slots.subscribe(hole, listener)
	});
	const browserFlowSource = flowSource("sidebar.workspaces.directoryFlow");
	const pickerFlowSource = flowSource("conversation.hero.workspace.directoryFlow");
	const browserInjected = () => ({
		...options.multiroot === true ? { multirootEnabled: true } : {},
		startSession: (workspaceId) => {
			ctx.workspaces.startSession(workspaceId);
		},
		open: (sessionId) => {
			ctx.sessions.open(sessionId);
		},
		searchSessions,
		searchResultLimit: ctx.sessions.searchResultLimit,
		renameSession: async (sessionId, title) => {
			const session = ctx.sessions.binding(sessionId)?.session;
			if (session === void 0) throw new Error(`unknown session "${sessionId}"`);
			const result = await session.rename(title);
			if (!result.ok) throw new Error(result.error.message);
		},
		forkSession: (sessionId) => {
			ctx.sessions.fork({
				sessionId,
				increaseTitle: true
			}).then((childId) => {
				ctx.sessions.open(childId);
			}).catch(() => {});
		},
		renameWorkspace: async (workspaceId, title) => {
			await ctx.workspaces.rename(workspaceId, title);
		},
		deleteWorkspace: async (workspaceId) => {
			await ctx.workspaces.delete(workspaceId);
		},
		insertWorkspaceBefore: async (workspaceId, beforeWorkspaceId) => {
			await ctx.workspaces.insertBefore(workspaceId, beforeWorkspaceId);
		},
		archiveSession: async (sessionId) => {
			await ctx.workspaces.archiveSession(sessionId);
		},
		insertSessionBefore: async (workspaceId, sessionId, beforeSessionId) => {
			await ctx.workspaces.insertSessionBefore(workspaceId, sessionId, beforeSessionId);
		},
		createWorkspace: (input) => ctx.workspaces.create(input),
		hooks: { directoryFlow: browserFlowSource }
	});
	const pickerInjected = () => ({
		...options.multiroot === true ? { multirootEnabled: true } : {},
		createWorkspace: (input) => ctx.workspaces.create(input),
		hooks: { directoryFlow: pickerFlowSource }
	});
	ctx.slots.inject("sidebar.workspaces", () => ctx.slots.register({
		name: "sidebar.workspaces",
		children: { "sidebar.workspaces.directoryFlow": {
			kind: "single",
			scope: "root"
		} },
		store: createWorkspaceViewStore(),
		inject: browserInjected,
		locale: NS
	}, WorkspaceBrowser));
	ctx.slots.inject("conversation.hero.workspace", () => ctx.slots.register({
		name: "conversation.hero.workspace",
		children: { "conversation.hero.workspace.directoryFlow": {
			kind: "single",
			scope: "root"
		} },
		inject: pickerInjected,
		locale: NS
	}, WorkspacePicker));
}

//#endregion
//#region src/client/index.ts
/** Register the stock Workspace UI with the external multiroot extension enabled. */
function apply(ctx) {
	apply$1(ctx, { multiroot: true });
}

//#endregion
exports.apply = apply;
exports.inject = inject;
return module.exports; }})