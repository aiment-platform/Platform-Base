/**
 * UI バージョン切り替えのうち、サーバー側（layout.tsx）からも読み込む部分。
 * React のフックを含む uiVersion.ts をサーバーコンポーネントから読むとビルドエラーになるので分けている。
 */
export const UI_VERSION_KEY = "aiment.ui.v1";

/**
 * 最初の描画より前に data-ui を付けるための小さなスクリプト（layout.tsx の <head> に置く）。
 * React が動くのを待つと、一瞬だけ今の見た目が出てから切り替わってしまうため。
 */
export const UI_VERSION_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(UI_VERSION_KEY)};var q=new URLSearchParams(location.search).get("ui");if(q==="0.4"||q==="0.31")localStorage.setItem(k,q);if(localStorage.getItem(k)==="0.4")document.documentElement.setAttribute("data-ui","0.4");}catch(e){}})();`;
