/* meicho.app の閲覧と導線を数える（個人を識別しない・Cookie なし）。
   送る先は自前の Worker（/v1/site）。text/plain で送るので preflight が出ない。
   e=view 表示 / cta App Store リンクの押下 / reach_deep 読みどころ到達 / reach_end 末尾到達 */
(function () {
  var API = "https://meicho-api.asonedaywillberefreshing.workers.dev/v1/site";
  if (/bot|crawl|spider|slurp|headless/i.test(navigator.userAgent)) return;
  var ref = "";
  try { ref = document.referrer ? new URL(document.referrer).hostname : ""; } catch (_) {}
  if (ref === location.hostname) ref = "self";
  function send(e, c) {
    try {
      var body = JSON.stringify({ e: e, p: location.pathname, r: ref, c: c || "" });
      if (navigator.sendBeacon) navigator.sendBeacon(API, new Blob([body], { type: "text/plain" }));
      else fetch(API, { method: "POST", body: body, keepalive: true, headers: { "content-type": "text/plain" } });
    } catch (_) {}
  }
  send("view");
  var links = Array.prototype.slice.call(document.querySelectorAll("a[href*='apps.apple.com']"));
  links.forEach(function (a, i) {
    var ct = (a.href.match(/[?&]ct=([^&]+)/) || [])[1] || "store";
    var where = a.closest(".sticky, .cta-sticky, [class*='stick']") ? "sticky" : String(i + 1);
    a.addEventListener("click", function () { send("cta", ct + "#" + where); });
  });
  var seen = {};
  function reach(k, el) {
    if (!el || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (es, o) {
      es.forEach(function (x) { if (x.isIntersecting && !seen[k]) { seen[k] = 1; send(k); o.disconnect(); } });
    }).observe(el);
  }
  // 引用→原文の文ジャンプ（商品の核）と、アプリの実回答の開封
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a[href^='#s-']");
    if (a) send("jump");
  }, true);
  Array.prototype.forEach.call(document.querySelectorAll("details.demo"), function (d) {
    d.addEventListener("toggle", function () { if (d.open) send("demo_open"); });
  });
  reach("reach_deep", document.querySelector("section.deep"));
  reach("reach_end", document.querySelector("footer") || document.querySelector("main > :last-child"));
})();
