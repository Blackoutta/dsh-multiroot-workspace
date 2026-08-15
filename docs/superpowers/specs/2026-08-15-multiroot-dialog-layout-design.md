# Multiroot Dialog Layout Design

## Scope

The multiroot management dialog presents each root as a complete form section. The layout keeps editable aliases, full filesystem paths, root roles, and removal actions readable without increasing the dialog beyond the viewport. This change affects presentation only; root validation, persistence, primary-root changes, deletion, and directory picking retain their existing behavior.

## Dialog structure

The dialog uses four vertically ordered regions:

1. A fixed header containing the title and close control.
2. A fixed Workspace-name field.
3. A scrollable root-list region.
4. A fixed action region containing Add folder and the dialog footer.

The dialog width is capped at 760 CSS pixels and shrinks with the viewport. Its height cannot exceed the viewport minus the Modal's 24-pixel top and bottom inset. Only the root-list region scrolls. The header, Workspace-name field, Add folder control, and footer remain visible while roots scroll.

## Root form

Each root is a bordered card with two labeled fields. Directory name is editable. Directory path is read-only, selectable, and wraps wherever required so the complete value remains visible. Neither value uses ellipsis.

The card footer contains a radio-style primary-root control on the left and Remove on the right. The selected control reads “Current primary”; unselected controls read “Set as primary”. The visual state does not rely on color alone. Remove uses the existing destructive text color and remains disabled when removing the final root is not allowed.

## Responsive behavior

At desktop widths, Directory name and Directory path share one row, with the path receiving more space. At narrow widths, the fields stack into one column. The dialog retains its viewport height cap, and the root list consumes the remaining available height.

The root-list scrollbar uses the platform scrolling behavior with a stable gutter where supported. Scrolling is contained within the list so reaching its edge does not move the page behind the modal.

## Accessibility

Existing field labels remain programmatically associated with their controls. The primary-root action remains a native button and exposes its selected state through visible text and a non-color indicator. Filesystem paths remain selectable text and retain the full path in the DOM. Keyboard focus follows document order through the Workspace name, root fields and actions, Add folder, and footer controls.

## Verification

Component tests cover complete alias and path rendering, primary-root labels and actions, and the scroll-container structure. A browser check uses a constrained viewport and at least five roots to verify that the modal stays within the viewport, the root list scrolls, fixed regions remain visible, and narrow layouts stack the fields.

## Exclusions

This design does not add root reordering, inline path editing, path copying, permanent Session deletion, or changes to Host Workspace behavior.
