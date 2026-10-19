/* ============================================
   页面动效 — 翻书式页面转场 + 标题 3D 翻转入场
   作者: 甘宇 GANYU · 2026-10-19
   - 点击本作品集内部链接时写入 sessionStorage 标记
   - 新页面据此等待整页转场结束, 再播放标题翻转
   - 不支持 View Transition 时直接显示标题, 正常跳转
   ============================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var supportsVT = typeof document.startViewTransition === "function";
  var FLAG = "ganyu-page-turn";
  var cameFromInternal = false;

  try {
    cameFromInternal = sessionStorage.getItem(FLAG) === "1";
    if (cameFromInternal) sessionStorage.removeItem(FLAG);
  } catch (e) {}

  function showTitle() {
    root.classList.remove("vt-pending");
    root.classList.add("title-ready");
  }

  /* 内部跳转且目标不带锚点时从页首开始, 让标题进入效果可见 */
  if (cameFromInternal && !location.hash) {
    try {
      history.scrollRestoration = "manual";
    } catch (e) {}
    var scrollTop = function () { window.scrollTo(0, 0); };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", scrollTop, { once: true });
    } else {
      scrollTop();
    }
  }

  if (!reduce) {
    root.classList.add("motion");

    if (cameFromInternal && supportsVT) {
      /* 整页转场期间先藏住标题, 等转场结束再翻入 */
      root.classList.add("vt-pending");
      var revealSeen = false;

      window.addEventListener("pagereveal", function (event) {
        revealSeen = true;
        if (event.viewTransition) {
          event.viewTransition.finished.then(showTitle, showTitle);
          /* 兜底: finished 迟迟不兑现时也让标题出现 */
          window.setTimeout(function () {
            if (root.classList.contains("vt-pending")) showTitle();
          }, 2200);
        } else {
          showTitle();
        }
      });

      /* 浏览器不支持跨文档转场时, 载入后很快放出标题 */
      window.addEventListener("load", function () {
        window.setTimeout(function () {
          if (!revealSeen && root.classList.contains("vt-pending")) showTitle();
        }, 250);
      });
    } else {
      showTitle();
    }
  } else {
    showTitle();
  }

  /* 从往返缓存恢复时, 确保标题不会停在隐藏状态 */
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) showTitle();
  });

  /* 只给本作品集内的页面跳转打标记, 外链 / 新标签页 / 同页锚点不参与 */
  var PAGES = /^(?:index\.html|lgwc\.html|tower\.html)$/;

  document.addEventListener("click", function (event) {
    if (reduce || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var link = event.target && event.target.closest
      ? event.target.closest("a[href]")
      : null;
    if (!link) return;
    if (link.target && link.target !== "_self") return;
    if (link.hasAttribute("download")) return;

    var url;
    try {
      url = new URL(link.href, location.href);
    } catch (e) {
      return;
    }
    if (url.origin !== location.origin) return;

    var samePath = url.pathname === location.pathname;
    if (samePath && url.hash) return;

    var base = location.pathname.replace(/[^/]+$/, "");
    var rel = url.pathname.indexOf(base) === 0
      ? url.pathname.slice(base.length)
      : "";
    if (!PAGES.test(rel)) return;

    try {
      sessionStorage.setItem(FLAG, "1");
    } catch (e) {}
  }, true);
})();
