/**
 * UI のバージョン切り替え（試作の見た目を、今の見た目とすぐ行き来するため）。
 *
 *   "0.31" … 今の見た目（既定）
 *   "0.4"  … 試作。<html data-ui="0.4"> を付けると app/styles/v04.css が効く
 *
 * 選んだ値はこのブラウザにだけ保存される（localStorage）。URL に ?ui=0.4 / ?ui=0.31
 * を付けて開いても切り替わる。v04.css と data-ui を消せば、試作は跡形もなく消える。
 */
import { useSyncExternalStore } from "react";
import { UI_VERSION_KEY } from "./uiVersionBoot";

export type UiVersion = "0.31" | "0.4";

const CHANGE_EVENT = "aiment:ui-version";

function read(): UiVersion {
  return document.documentElement.getAttribute("data-ui") === "0.4" ? "0.4" : "0.31";
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

export function setUiVersion(next: UiVersion) {
  try {
    window.localStorage.setItem(UI_VERSION_KEY, next);
  } catch {
    // 保存できない環境（プライベートモードなど）でも、今のページだけは切り替える
  }
  if (next === "0.4") document.documentElement.setAttribute("data-ui", "0.4");
  else document.documentElement.removeAttribute("data-ui");
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useUiVersion(): UiVersion {
  return useSyncExternalStore(subscribe, read, () => "0.31");
}
