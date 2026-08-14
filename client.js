window.__ModuleLoader__.load({ id: "dsh-multiroot-workspace", factory: function (require) { const module = { exports: {} }; const exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
let react = require("react");
let react_jsx_runtime = require("react/jsx-runtime");

//#region src/client/index.tsx
/**
* dsh-multiroot-workspace — client half (TSX build via tsdown).
*
* Occupies the two slots the disabled ui-workspace used to fill:
*   sidebar.workspaces            — the whole workspace browsing region
*   conversation.hero.workspace   — the conversation empty-state picker
*
* Standard (single-root registry) workspaces come from the framework
* `useWorkspaces`/`useSessions` hooks; multiroot workspaces come from the
* bundle's own HTTP API. Derived shadow entries (registry workspaces whose
* path equals a multiroot primary) are filtered out of the standard list so
* nothing renders twice.
*/
const CSS = `
.mr-root { display: flex; flex-direction: column; height: 100%; font-size: 13px; color: var(--dsw-text-1, #1a1a1a); }
.mr-header { display: flex; align-items: center; gap: 6px; padding: 6px 8px; }
.mr-title { font-weight: 600; flex: 1; }
.mr-search { border: 1px solid var(--dsw-border, #e0e0e0); border-radius: 4px; padding: 2px 6px; font-size: 12px; width: 90px; background: transparent; color: inherit; }
.mr-btn { background: transparent; border: 1px solid var(--dsw-border, #e0e0e0); color: inherit; border-radius: 4px; font-size: 12px; padding: 2px 8px; cursor: pointer; }
.mr-btn:disabled { opacity: .5; cursor: default; }
.mr-btn-primary { background: var(--dsw-accent, #4d6bfe); border-color: var(--dsw-accent, #4d6bfe); color: #fff; }
.mr-btn-danger { color: #d33; border-color: #d33; }
.mr-iconbtn { background: transparent; border: none; color: var(--dsw-text-2, #666); cursor: pointer; font-size: 12px; padding: 0 3px; }
.mr-iconbtn-danger { color: #d33; }
.mr-group { margin-bottom: 2px; }
.mr-group-head { display: flex; align-items: center; gap: 4px; padding: 4px 6px; cursor: pointer; border-radius: 4px; }
.mr-group-head.dragover { outline: 1px dashed var(--dsw-accent, #4d6bfe); }
.mr-caret { font-size: 11px; color: var(--dsw-text-2, #666); width: 12px; }
.mr-group-title { font-weight: 600; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mr-group-meta { font-size: 11px; color: var(--dsw-text-2, #666); }
.mr-session { display: flex; align-items: center; gap: 6px; padding: 3px 6px 3px 20px; cursor: pointer; border-radius: 4px; }
.mr-session:hover, .mr-group-head:hover { background: var(--dsw-hover, rgba(0,0,0,.05)); }
.mr-session-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mr-session-time { font-size: 11px; color: var(--dsw-text-2, #666); }
.mr-running { font-size: 10px; color: var(--dsw-accent, #4d6bfe); }
.mr-error { font-size: 12px; color: #d33; padding: 0 8px; }
.mr-empty { font-size: 12px; color: var(--dsw-text-2, #666); padding: 6px 8px; }
.mr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; z-index: 100; }
.mr-modal { background: var(--dsw-bg, #fff); border-radius: 8px; padding: 16px; min-width: 420px; max-width: 560px; max-height: 80vh; overflow: auto; box-shadow: 0 8px 32px rgba(0,0,0,.2); }
.mr-modal-title { font-weight: 600; font-size: 14px; margin-bottom: 12px; }
.mr-modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
.mr-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.mr-label { font-size: 13px; color: var(--dsw-text-2, #666); white-space: nowrap; }
.mr-input { flex: 1; border: 1px solid var(--dsw-border, #e0e0e0); border-radius: 4px; padding: 4px 8px; font-size: 13px; background: transparent; color: inherit; }
.mr-input-wide { width: 120px; flex: none; }
.mr-root-row { display: flex; align-items: center; gap: 8px; border: 1px solid var(--dsw-border, #e0e0e0); border-radius: 4px; padding: 6px; margin-bottom: 6px; }
.mr-root-alias { font-weight: 600; font-size: 12px; width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mr-root-path { flex: 1; font-size: 12px; color: var(--dsw-text-2, #666); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mr-primary-mark { font-size: 11px; color: var(--dsw-accent, #4d6bfe); font-weight: 600; }
.mr-hint { font-size: 12px; color: var(--dsw-text-2, #666); }
.mr-menu { position: fixed; z-index: 90; min-width: 240px; max-width: 320px; background: var(--dsw-bg, #fff); border: 1px solid var(--dsw-border, #e0e0e0); border-radius: 8px; padding: 6px; box-shadow: 0 8px 32px rgba(0,0,0,.18); }
.mr-menu-head { font-size: 11px; color: var(--dsw-text-2, #666); padding: 2px 6px 4px; }
.mr-menu-item { display: flex; align-items: center; gap: 6px; padding: 3px 6px; cursor: pointer; border-radius: 4px; }
.mr-menu-item:hover { background: var(--dsw-hover, rgba(0,0,0,.05)); }
.mr-menu-item-selected { background: rgba(77,107,254,.1); }
.mr-divider { height: 1px; background: var(--dsw-border, #e0e0e0); margin: 4px 0; }
.mr-rail { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 6px 0; }
.mr-rail-btn { background: transparent; border: none; color: var(--dsw-text-2, #666); cursor: pointer; font-size: 15px; padding: 4px; border-radius: 4px; }
.mr-rail-btn:hover { background: var(--dsw-hover, rgba(0,0,0,.05)); color: var(--dsw-accent, #4d6bfe); }
`;
let styleInjected = false;
function ensureStyle() {
	if (styleInjected || typeof document === "undefined") return;
	const tag = document.createElement("style");
	tag.setAttribute("data-plugin", "dsh-multiroot-workspace");
	tag.textContent = CSS;
	document.head.append(tag);
	styleInjected = true;
}
const API = "/plugins/multiroot/api";
async function api(path, options) {
	const response = await fetch(API + path, options);
	const payload = await response.json().catch(() => null);
	if (payload === null || payload.ok !== true) throw new Error(payload?.error?.message ?? `request failed: ${response.status}`);
	return payload.value;
}
const apiJson = (path, method, body) => api(path, {
	method,
	headers: { "content-type": "application/json" },
	body: body === void 0 ? void 0 : JSON.stringify(body)
});
function basename(path) {
	const parts = path.split(/[\\/]/).filter(Boolean);
	return parts.length > 0 ? parts[parts.length - 1] : path;
}
function formatTime(epochMs) {
	const d = new Date(epochMs);
	return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
/** Multiroot records from the bundle API (null while loading). */
function useMultiroot() {
	const [records, setRecords] = (0, react.useState)(null);
	const [error, setError] = (0, react.useState)(null);
	const refresh = (0, react.useCallback)(() => {
		api("/workspaces").then(setRecords, (err) => setError(err.message));
	}, []);
	(0, react.useEffect)(() => {
		refresh();
	}, [refresh]);
	return {
		records,
		error,
		refresh
	};
}
function workspaceForSession(records, summary) {
	if (records === null || summary === void 0 || summary.cwd === void 0) return void 0;
	return records.find((record) => record.roots.some((root) => root.primary && root.path === summary.cwd));
}
function Modal({ title, children, footer, onClose }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		className: "mr-overlay",
		onClick: onClose,
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "mr-modal",
			onClick: (event) => event.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "mr-modal-title",
					children: title
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children }),
				footer === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "mr-modal-footer",
					children: footer
				})
			]
		})
	});
}
function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onClose }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Modal, {
		title,
		onClose,
		footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			className: "mr-btn",
			onClick: onClose,
			children: "取消"
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			className: `mr-btn ${danger ? "mr-btn-danger" : "mr-btn-primary"}`,
			onClick: () => {
				onConfirm();
				onClose();
			},
			children: confirmLabel ?? "确定"
		})] }),
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			style: { fontSize: 13 },
			children: message
		})
	});
}
function RenameDialog({ label, initial, onConfirm, onClose }) {
	const [value, setValue] = (0, react.useState)(initial);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Modal, {
		title: `改名${label}`,
		onClose,
		footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			className: "mr-btn",
			onClick: onClose,
			children: "取消"
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			className: "mr-btn mr-btn-primary",
			disabled: value.trim().length === 0,
			onClick: () => onConfirm(value.trim()),
			children: "确定"
		})] }),
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
			className: "mr-input",
			value,
			autoFocus: true,
			onChange: (event) => setValue(event.target.value),
			onKeyDown: (event) => {
				if (event.key === "Enter" && value.trim().length > 0) onConfirm(value.trim());
			}
		})
	});
}
function MultirootAddDialog({ useDirectoryFlow, renderSlot, onClose, onSaved }) {
	const flowAvailable = useDirectoryFlow((occupied) => occupied);
	const [title, setTitle] = (0, react.useState)("");
	const [roots, setRoots] = (0, react.useState)([]);
	const [picking, setPicking] = (0, react.useState)(false);
	const [error, setError] = (0, react.useState)(null);
	const [saving, setSaving] = (0, react.useState)(false);
	const addRoot = (path) => {
		setRoots((current) => [...current, {
			alias: basename(path),
			path,
			primary: current.length === 0
		}]);
		setPicking(false);
	};
	const setPrimary = (index) => {
		setRoots((current) => current.map((root, i) => ({
			...root,
			primary: i === index
		})));
	};
	const save = async () => {
		if (roots.length === 0) {
			setError("请至少添加一个文件夹");
			return;
		}
		setSaving(true);
		try {
			await apiJson("/workspaces", "POST", {
				title: title || basename(roots[0].path),
				roots
			});
			onSaved();
		} catch (err) {
			setError(err.message);
			setSaving(false);
		}
	};
	const flowOwner = {
		open: picking,
		busy: false,
		onPicked: addRoot,
		onCancel: () => setPicking(false),
		onError: (message) => {
			setPicking(false);
			setError(message);
		}
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Modal, {
		title: "添加多根工作区",
		onClose,
		footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			className: "mr-btn",
			onClick: onClose,
			children: "取消"
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			className: "mr-btn mr-btn-primary",
			disabled: saving,
			onClick: () => void save(),
			children: saving ? "保存中…" : "确定"
		})] }),
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "mr-row",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
					className: "mr-label",
					children: "名称"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					className: "mr-input",
					value: title,
					placeholder: "默认取第一个文件夹名",
					onChange: (event) => setTitle(event.target.value)
				})]
			}),
			roots.map((root, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "mr-root-row",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						className: "mr-input mr-input-wide",
						value: root.alias,
						onChange: (event) => setRoots((current) => current.map((r, i) => i === index ? {
							...r,
							alias: event.target.value
						} : r))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "mr-root-path",
						children: root.path
					}),
					root.primary ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "mr-primary-mark",
						children: "主根"
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: "mr-iconbtn",
						onClick: () => setPrimary(index),
						children: "设为主根"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: "mr-iconbtn mr-iconbtn-danger",
						onClick: () => setRoots((current) => current.filter((_, i) => i !== index)),
						children: "移除"
					})
				]
			}, index)),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "mr-row",
				style: { marginBottom: 0 },
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					className: "mr-btn",
					disabled: !flowAvailable || picking || saving,
					onClick: () => setPicking(true),
					children: "添加文件夹…"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "mr-hint",
					children: "逐个选择文件夹；第一个自动成为主根"
				})]
			}),
			error === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "mr-error",
				children: error
			}),
			renderSlot("sidebar.workspaces.directoryFlow", flowOwner)
		]
	});
}
function MultirootManageDialog({ record, useDirectoryFlow, renderSlot, onClose, onChanged }) {
	const flowAvailable = useDirectoryFlow((occupied) => occupied);
	const [title, setTitle] = (0, react.useState)(record.title);
	const [roots, setRoots] = (0, react.useState)(record.roots.map((root) => ({ ...root })));
	const [picking, setPicking] = (0, react.useState)(false);
	const [error, setError] = (0, react.useState)(null);
	const [busy, setBusy] = (0, react.useState)(false);
	const [purgeArmed, setPurgeArmed] = (0, react.useState)(false);
	const run = async (operation) => {
		setBusy(true);
		try {
			await operation();
			onChanged();
		} catch (err) {
			setError(err.message);
			setBusy(false);
		}
	};
	const saveTitle = () => {
		run(async () => {
			if (title.trim().length === 0) throw new Error("名称不能为空");
			await apiJson(`/workspaces/${record.id}`, "PATCH", { title: title.trim() });
			onClose();
		});
	};
	const saveRoots = () => {
		run(async () => {
			await apiJson(`/workspaces/${record.id}`, "PATCH", { roots });
			onClose();
		});
	};
	const setPrimary = (index) => {
		setRoots((current) => current.map((root, i) => ({
			...root,
			primary: i === index
		})));
	};
	const removeRoot = (index) => {
		setRoots((current) => {
			const next = current.filter((_, i) => i !== index);
			if (next.length > 0 && !next.some((root) => root.primary)) next[0].primary = true;
			return next;
		});
	};
	const flowOwner = {
		open: picking,
		busy: false,
		onPicked: (path) => {
			setRoots((current) => [...current, {
				alias: basename(path),
				path,
				primary: current.length === 0
			}]);
			setPicking(false);
		},
		onCancel: () => setPicking(false),
		onError: (message) => {
			setPicking(false);
			setError(message);
		}
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Modal, {
		title: `管理多根工作区：${record.title}`,
		onClose,
		footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			className: "mr-btn",
			onClick: onClose,
			children: "关闭"
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			className: "mr-btn mr-btn-primary",
			disabled: busy,
			onClick: saveRoots,
			children: "保存根列表"
		})] }),
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "mr-row",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
						className: "mr-label",
						children: "名称"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						className: "mr-input",
						value: title,
						onChange: (event) => setTitle(event.target.value)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: "mr-btn",
						disabled: busy,
						onClick: saveTitle,
						children: "改名"
					})
				]
			}),
			roots.map((root, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "mr-root-row",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "mr-root-alias",
						children: root.alias
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "mr-root-path",
						children: root.path
					}),
					root.primary ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "mr-primary-mark",
						children: "主根"
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: "mr-iconbtn",
						onClick: () => setPrimary(index),
						children: "设为主根"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: "mr-iconbtn mr-iconbtn-danger",
						onClick: () => removeRoot(index),
						children: "移除"
					})
				]
			}, index)),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "mr-row",
				style: { flexWrap: "wrap" },
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					className: "mr-btn",
					disabled: !flowAvailable || picking || busy,
					onClick: () => setPicking(true),
					children: "添加文件夹…"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					className: "mr-btn mr-btn-danger",
					disabled: busy,
					onClick: () => void run(async () => {
						await apiJson(`/workspaces/${record.id}`, "DELETE");
						onClose();
					}),
					children: "删除工作区"
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "mr-row",
				style: {
					marginTop: 10,
					paddingTop: 10,
					borderTop: "1px solid var(--dsw-border, #e0e0e0)",
					marginBottom: 0
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "mr-hint",
					style: { flex: 1 },
					children: "清理会删除全部多根工作区及其在系统工作区表中的影子条目（卸载插件前使用）"
				}), purgeArmed ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					className: "mr-btn mr-btn-danger",
					disabled: busy,
					onClick: () => void run(async () => {
						await apiJson("/data", "DELETE");
						onClose();
					}),
					children: "确认清理"
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					className: "mr-btn",
					onClick: () => setPurgeArmed(true),
					children: "清理全部数据…"
				})]
			}),
			error === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "mr-error",
				children: error
			}),
			renderSlot("sidebar.workspaces.directoryFlow", flowOwner)
		]
	});
}
function Browser(props) {
	const { wide, expandSidebar, useWorkspaces, useSessions, renderSlot, useDirectoryFlow, createWorkspace, startSession, openSession, createSessionWithCwd, renameWorkspace, deleteWorkspace, renameSession, archiveSession, insertWorkspaceBefore } = props;
	ensureStyle();
	const workspaces = useWorkspaces((state) => state);
	const sessions = useSessions((state) => state);
	const flowAvailable = useDirectoryFlow((occupied) => occupied);
	const multiroot = useMultiroot();
	const [query, setQuery] = (0, react.useState)("");
	const [expanded, setExpanded] = (0, react.useState)({});
	const [flat, setFlat] = (0, react.useState)(false);
	const [dialog, setDialog] = (0, react.useState)(null);
	const [addFlow, setAddFlow] = (0, react.useState)(false);
	const [addBusy, setAddBusy] = (0, react.useState)(false);
	const [notice, setNotice] = (0, react.useState)(null);
	const [dragKey, setDragKey] = (0, react.useState)(null);
	const toggle = (key) => setExpanded((current) => ({
		...current,
		[key]: !current[key]
	}));
	if (!wide) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: "mr-rail",
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				className: "mr-rail-btn",
				title: "展开侧边栏",
				onClick: expandSidebar,
				children: "☰"
			}),
			flowAvailable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				className: "mr-rail-btn",
				title: "添加工作区",
				onClick: () => setAddFlow(true),
				children: "＋"
			}) : null,
			flowAvailable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				className: "mr-rail-btn",
				title: "添加多根工作区",
				onClick: () => setDialog({ kind: "add-multiroot" }),
				children: "⧉"
			}) : null,
			renderSlot("sidebar.workspaces.directoryFlow", {
				open: addFlow,
				busy: addBusy,
				onPicked: (path) => {
					setAddBusy(true);
					createWorkspace({ path }).then(() => setAddFlow(false)).catch((err) => {
						setNotice(err.message);
						setAddFlow(false);
					}).finally(() => setAddBusy(false));
				},
				onCancel: () => setAddFlow(false),
				onError: (message) => {
					setAddFlow(false);
					setNotice(message);
				}
			}),
			dialog !== null && dialog.kind === "add-multiroot" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MultirootAddDialog, {
				useDirectoryFlow,
				renderSlot,
				onClose: () => setDialog(null),
				onSaved: () => {
					multiroot.refresh();
					setDialog(null);
				}
			}) : null
		]
	});
	const byId = sessions.byId ?? {};
	const multirootSessions = /* @__PURE__ */ new Map();
	const standardSessions = /* @__PURE__ */ new Map();
	const ungrouped = [];
	for (const id of sessions.ids ?? []) {
		const summary = byId[id];
		if (summary === void 0) continue;
		const workspace = workspaceForSession(multiroot.records, summary);
		if (workspace !== void 0) {
			const list = multirootSessions.get(workspace.id) ?? [];
			list.push(summary);
			multirootSessions.set(workspace.id, list);
			continue;
		}
		const owner = (workspaces.items ?? []).find((view) => view.sessionIds.includes(id));
		if (owner !== void 0) {
			const list = standardSessions.get(owner.workspaceId) ?? [];
			list.push(summary);
			standardSessions.set(owner.workspaceId, list);
			continue;
		}
		ungrouped.push(summary);
	}
	const needle = query.trim().toLowerCase();
	const matches = (summary) => needle.length === 0 || summary.displayTitle.toLowerCase().includes(needle);
	const shadowPaths = new Set((multiroot.records ?? []).map((record) => record.roots.find((root) => root.primary)?.path).filter(Boolean));
	const sessionRows = (list) => list.filter(matches).map((summary) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: "mr-session",
		onClick: () => openSession(summary.id),
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "mr-session-title",
				children: summary.displayTitle
			}),
			summary.running ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "mr-running",
				children: "运行中"
			}) : null,
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "mr-session-time",
				children: formatTime(summary.updatedAt)
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				onClick: (event) => event.stopPropagation(),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					className: "mr-iconbtn",
					title: "改名",
					onClick: () => setDialog({
						kind: "rename-session",
						summary
					}),
					children: "✎"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					className: "mr-iconbtn",
					title: "归档",
					onClick: () => void archiveSession(summary.id),
					children: "🗂"
				})]
			})
		]
	}, summary.id));
	const multirootGroups = (multiroot.records ?? []).map((record, index) => {
		const key = `mr-${record.id}`;
		const primary = record.roots.find((root) => root.primary);
		const open = expanded[key] !== false;
		return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "mr-group",
			draggable: true,
			onDragStart: () => setDragKey(key),
			onDragOver: (event) => {
				if (dragKey !== null && dragKey !== key) event.preventDefault();
			},
			onDrop: (event) => {
				event.preventDefault();
				if (dragKey === null || dragKey === key) return;
				setDragKey(null);
			},
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: `mr-group-head${dragKey !== null && dragKey !== key ? "" : ""}`,
				onClick: () => toggle(key),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "mr-caret",
						children: open ? "▾" : "▸"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "mr-group-title",
						title: record.title,
						children: record.title
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "mr-group-meta",
						children: [
							record.roots.length,
							" 根",
							primary ? ` · 主根 ${primary.alias}` : ""
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						onClick: (event) => event.stopPropagation(),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: "mr-iconbtn",
							title: "新会话",
							onClick: () => {
								if (primary !== void 0) createSessionWithCwd(primary.path);
							},
							children: "＋"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: "mr-iconbtn",
							title: "管理",
							onClick: () => setDialog({
								kind: "manage",
								record
							}),
							children: "⋯"
						})]
					})
				]
			}), open ? sessionRows(multirootSessions.get(record.id) ?? []) : null]
		}, key);
	});
	const standardGroups = (workspaces.items ?? []).filter((view) => !shadowPaths.has(view.path)).map((view) => {
		const key = `ws-${view.workspaceId}`;
		const open = expanded[key] !== false;
		return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "mr-group",
			draggable: true,
			onDragStart: () => setDragKey(key),
			onDragOver: (event) => {
				if (dragKey !== null && dragKey !== key) event.preventDefault();
			},
			onDrop: (event) => {
				event.preventDefault();
				if (dragKey === null || dragKey === key) return;
				insertWorkspaceBefore(view.workspaceId, void 0);
				setDragKey(null);
			},
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "mr-group-head",
				onClick: () => toggle(key),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "mr-caret",
						children: open ? "▾" : "▸"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "mr-group-title",
						title: view.title,
						children: view.title
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						onClick: (event) => event.stopPropagation(),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "mr-iconbtn",
								title: "新会话",
								onClick: () => startSession(view.workspaceId),
								children: "＋"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "mr-iconbtn",
								title: "改名",
								onClick: () => setDialog({
									kind: "rename-ws",
									view
								}),
								children: "✎"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "mr-iconbtn mr-iconbtn-danger",
								title: "删除",
								onClick: () => setDialog({
									kind: "delete-ws",
									view
								}),
								children: "✕"
							})
						]
					})
				]
			}), open ? sessionRows(standardSessions.get(view.workspaceId) ?? []) : null]
		}, key);
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: "mr-root",
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "mr-header",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "mr-title",
						children: "工作区"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						className: "mr-search",
						placeholder: "搜索会话…",
						value: query,
						onChange: (event) => setQuery(event.target.value)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: "mr-iconbtn",
						title: "单列/分组",
						onClick: () => setFlat((current) => !current),
						children: flat ? "分组" : "单列"
					}),
					flowAvailable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: "mr-btn",
						onClick: () => setAddFlow(true),
						children: "添加工作区"
					}) : null,
					flowAvailable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: "mr-btn mr-btn-primary",
						onClick: () => setDialog({ kind: "add-multiroot" }),
						children: "添加多根工作区"
					}) : null
				]
			}),
			multiroot.error === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "mr-error",
				children: multiroot.error
			}),
			notice === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "mr-error",
				children: notice
			}),
			multirootGroups,
			flat ? null : standardGroups,
			ungrouped.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "mr-group",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "mr-group-head",
					onClick: () => toggle("ungrouped"),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "mr-caret",
						children: expanded.ungrouped !== false ? "▾" : "▸"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "mr-group-title",
						children: "未分组"
					})]
				}), expanded.ungrouped !== false ? sessionRows(ungrouped) : null]
			}) : null,
			(multiroot.records ?? []).length + (workspaces.items ?? []).length === 0 && multiroot.records !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "mr-empty",
				children: "暂无工作区"
			}) : null,
			dialog === null ? null : dialog.kind === "add-multiroot" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MultirootAddDialog, {
				useDirectoryFlow,
				renderSlot,
				onClose: () => setDialog(null),
				onSaved: () => {
					multiroot.refresh();
					setDialog(null);
				}
			}) : dialog.kind === "manage" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MultirootManageDialog, {
				record: dialog.record,
				useDirectoryFlow,
				renderSlot,
				onClose: () => setDialog(null),
				onChanged: () => multiroot.refresh()
			}) : dialog.kind === "rename-ws" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RenameDialog, {
				label: "工作区",
				initial: dialog.view.title,
				onClose: () => setDialog(null),
				onConfirm: (value) => {
					renameWorkspace(dialog.view.workspaceId, value).catch((err) => setNotice(err.message));
					setDialog(null);
				}
			}) : dialog.kind === "rename-session" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RenameDialog, {
				label: "会话",
				initial: dialog.summary.displayTitle,
				onClose: () => setDialog(null),
				onConfirm: (value) => {
					renameSession(dialog.summary.id, value).catch((err) => setNotice(err.message));
					setDialog(null);
				}
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConfirmModal, {
				title: "删除工作区",
				danger: true,
				confirmLabel: "删除",
				message: `删除工作区 "${dialog.view.title}"？其目录、会话与日志不会被删除。`,
				onClose: () => setDialog(null),
				onConfirm: () => {
					deleteWorkspace(dialog.view.workspaceId).catch((err) => setNotice(err.message));
				}
			}),
			dialog === null ? renderSlot("sidebar.workspaces.directoryFlow", {
				open: addFlow,
				busy: addBusy,
				onPicked: (path) => {
					setAddBusy(true);
					createWorkspace({ path }).then(() => setAddFlow(false)).catch((err) => {
						setNotice(err.message);
						setAddFlow(false);
					}).finally(() => setAddBusy(false));
				},
				onCancel: () => setAddFlow(false),
				onError: (message) => {
					setAddFlow(false);
					setNotice(message);
				}
			}) : null
		]
	});
}
function HeroPicker(props) {
	const { open, anchorRef, selectedId, onPick, onClose, useWorkspaces, useSessions, renderSlot, useDirectoryFlow, createWorkspace, createSessionWithCwd } = props;
	ensureStyle();
	const workspaces = useWorkspaces((state) => state);
	const sessions = useSessions((state) => state);
	const flowAvailable = useDirectoryFlow((occupied) => occupied);
	const multiroot = useMultiroot();
	const [addFlow, setAddFlow] = (0, react.useState)(false);
	const [addBusy, setAddBusy] = (0, react.useState)(false);
	const [dialog, setDialog] = (0, react.useState)(false);
	const currentSummary = sessions.current === void 0 ? void 0 : (sessions.byId ?? {})[sessions.current];
	const currentWorkspace = workspaceForSession(multiroot.records, currentSummary);
	if (!open) return null;
	const anchorRect = anchorRef?.current?.getBoundingClientRect() ?? null;
	const style = anchorRect === null ? {
		top: 40,
		right: 16
	} : {
		top: anchorRect.bottom + 6,
		left: Math.max(8, anchorRect.left)
	};
	const shadowPaths = new Set((multiroot.records ?? []).map((record) => record.roots.find((root) => root.primary)?.path).filter(Boolean));
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: "mr-menu",
		style,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "mr-menu-head",
				children: "选择工作区"
			}),
			(workspaces.items ?? []).filter((view) => !shadowPaths.has(view.path)).map((view) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: `mr-menu-item${view.workspaceId === selectedId ? " mr-menu-item-selected" : ""}`,
				onClick: () => onPick(view.workspaceId),
				children: view.title
			}, view.workspaceId)),
			(multiroot.records ?? []).map((record) => {
				const primary = record.roots.find((root) => root.primary);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: `mr-menu-item${currentWorkspace?.id === record.id ? " mr-menu-item-selected" : ""}`,
					onClick: () => {
						if (primary !== void 0) createSessionWithCwd(primary.path);
						onClose();
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: record.title }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "mr-group-meta",
						children: ["多根·", record.roots.length]
					})]
				}, `mr-${record.id}`);
			}),
			(workspaces.items ?? []).length + (multiroot.records ?? []).length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "mr-empty",
				children: "暂无工作区"
			}) : null,
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "mr-divider" }),
			flowAvailable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "mr-menu-item",
				onClick: () => setAddFlow(true),
				children: "添加工作区…"
			}) : null,
			flowAvailable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "mr-menu-item",
				onClick: () => setDialog(true),
				children: "添加多根工作区…"
			}) : null,
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "mr-menu-item",
				onClick: onClose,
				children: "关闭"
			}),
			addFlow ? renderSlot("conversation.hero.workspace.directoryFlow", {
				open: true,
				busy: addBusy,
				onPicked: (path) => {
					setAddBusy(true);
					createWorkspace({ path }).then(onClose).catch(() => setAddBusy(false));
				},
				onCancel: () => setAddFlow(false),
				onError: () => setAddFlow(false)
			}) : null,
			dialog ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MultirootAddDialog, {
				useDirectoryFlow,
				renderSlot,
				onClose: () => setDialog(false),
				onSaved: () => {
					setDialog(false);
					onClose();
				}
			}) : null
		]
	});
}
const name = "dsh-multiroot-workspace";
const inject = [
	"slots",
	"workspaces",
	"sessions"
];
function apply(ctx) {
	const flowSource = (hole) => ({
		getSnapshot: () => ctx.slots.entries(hole).length > 0,
		subscribe: (listener) => ctx.slots.subscribe(hole, listener)
	});
	const browserFlowSource = flowSource("sidebar.workspaces.directoryFlow");
	const pickerFlowSource = flowSource("conversation.hero.workspace.directoryFlow");
	const createSessionWithCwd = (cwd) => {
		ctx.sessions.create({ cwd }).then((sessionId) => {
			ctx.workspaces.refresh();
			return sessionId;
		}).then((sessionId) => ctx.sessions.open(sessionId)).then(() => {
			setTimeout(() => {
				ctx.workspaces.refresh();
			}, 1500);
		});
	};
	const browserInjected = () => ({
		createWorkspace: (input) => ctx.workspaces.create(input),
		startSession: (workspaceId) => {
			ctx.workspaces.startSession(workspaceId);
		},
		openSession: (sessionId) => {
			ctx.sessions.open(sessionId);
		},
		createSessionWithCwd,
		renameWorkspace: (workspaceId, title) => ctx.workspaces.rename(workspaceId, title),
		deleteWorkspace: (workspaceId) => ctx.workspaces.delete(workspaceId),
		renameSession: async (sessionId, title) => {
			const session = ctx.sessions.binding(sessionId)?.session;
			if (session === void 0) throw new Error(`unknown session "${sessionId}"`);
			const result = await session.rename(title);
			if (!result.ok) throw new Error(result.error?.message ?? "rename failed");
		},
		archiveSession: (sessionId) => ctx.workspaces.archiveSession(sessionId),
		insertWorkspaceBefore: (workspaceId, beforeWorkspaceId) => ctx.workspaces.insertBefore(workspaceId, beforeWorkspaceId),
		hooks: { directoryFlow: browserFlowSource }
	});
	const pickerInjected = () => ({
		createWorkspace: (input) => ctx.workspaces.create(input),
		startSession: (workspaceId) => {
			ctx.workspaces.startSession(workspaceId);
		},
		openSession: (sessionId) => {
			ctx.sessions.open(sessionId);
		},
		createSessionWithCwd,
		hooks: { directoryFlow: pickerFlowSource }
	});
	ctx.slots.inject("sidebar.workspaces", () => ctx.slots.register({
		name: "sidebar.workspaces",
		children: { "sidebar.workspaces.directoryFlow": {
			kind: "single",
			scope: "root"
		} },
		inject: browserInjected
	}, Browser));
	ctx.slots.inject("conversation.hero.workspace", () => ctx.slots.register({
		name: "conversation.hero.workspace",
		children: { "conversation.hero.workspace.directoryFlow": {
			kind: "single",
			scope: "root"
		} },
		inject: pickerInjected
	}, HeroPicker));
}

//#endregion
exports.Browser = Browser;
exports.HeroPicker = HeroPicker;
exports.apply = apply;
exports.inject = inject;
exports.name = name;
return module.exports; }})