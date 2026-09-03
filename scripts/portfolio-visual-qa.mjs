import http from "node:http";
import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const siteRoot = path.resolve(process.env.QA_SITE_DIR || "_site");
const outputRoot = path.resolve(process.env.QA_OUTPUT_DIR || path.join(".qa-output", "portfolio-visual-qa"));
const screenshotRoot = path.join(outputRoot, "screenshots");

const routes = [
  "/",
  "/work/",
  "/about/",
  "/contact/",
  "/work/business-operations-diagnostic-process-redesign/",
  "/work/revenue-operations-sales-performance-system/",
  "/work/strategic-procurement-supplier-decision-system/",
  "/work/project-delivery-recovery-scrum-operating-system/",
  "/work/employee-of-the-month-automation/",
  "/work/pipeline-strategist-agent/",
];

const viewports = [
  { label: "1440", width: 1440, height: 1000 },
  { label: "1280", width: 1280, height: 960 },
  { label: "1024", width: 1024, height: 900 },
  { label: "768", width: 768, height: 900 },
  { label: "zoom-200-equivalent", width: 720, height: 900 },
  { label: "430", width: 430, height: 900 },
  { label: "390", width: 390, height: 844 },
  { label: "320", width: 320, height: 700 },
];

const screenshotPlan = new Map([
  ["/", new Map([[1440, "home-1440.png"], [1280, "home-1280.png"], [768, "home-768.png"], [390, "home-390.png"], [320, "home-320.png"]])],
  ["/work/", new Map([[1440, "work-1440.png"], [390, "work-390.png"]])],
  ["/about/", new Map([[1440, "about-1440.png"], [390, "about-390.png"]])],
  ["/contact/", new Map([[1440, "contact-1440.png"], [390, "contact-390.png"]])],
  ["/work/business-operations-diagnostic-process-redesign/", new Map([[1440, "case-business-operations-1440.png"], [390, "case-business-operations-390.png"]])],
]);

const requiredAssets = [
  "/assets/css/style.css",
  "/assets/img/ns-mark.svg",
  "/assets/img/favicon.png",
  "/assets/img/profile.jpg",
  "/assets/docs/resume.pdf",
  "/assets/case-studies/operations-diagnostic-process-redesign.pdf",
  "/assets/case-studies/revenue-operations-sales-performance-system.pdf",
  "/assets/case-studies/strategic-procurement-supplier-decision-system.pdf",
  "/assets/case-studies/project-delivery-recovery-scrum-operating-system.pdf",
];

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
]);

function createStaticServer() {
  return http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
      const decodedPath = decodeURIComponent(requestUrl.pathname);
      let candidate = path.resolve(siteRoot, `.${decodedPath}`);
      if (!candidate.startsWith(`${siteRoot}${path.sep}`) && candidate !== siteRoot) {
        response.writeHead(403).end("Forbidden");
        return;
      }

      let stat;
      try {
        stat = await fs.stat(candidate);
      } catch {
        stat = null;
      }
      if (stat?.isDirectory()) {
        candidate = path.join(candidate, "index.html");
      } else if (!stat && !path.extname(candidate)) {
        candidate = path.join(candidate, "index.html");
      }

      const body = await fs.readFile(candidate);
      response.writeHead(200, {
        "Content-Type": contentTypes.get(path.extname(candidate).toLowerCase()) || "application/octet-stream",
        "Content-Length": body.length,
        "Cache-Control": "no-store",
      });
      if (request.method === "HEAD") response.end();
      else response.end(body);
    } catch (error) {
      response.writeHead(error?.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(error?.code === "ENOENT" ? "Not found" : "Server error");
    }
  });
}

function addFailure(report, route, viewport, message) {
  report.failures.push({ route, viewport, message });
}

async function waitForHealthyServer(baseUrl) {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.ok) return;
    } catch {
      // The server may still be binding its loopback socket.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Local QA server did not become healthy at ${baseUrl}.`);
}

async function writeReport(report) {
  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(path.join(outputRoot, "portfolio-visual-qa-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const lines = [
    "# Portfolio visual QA report",
    "",
    `- Result: ${report.failures.length === 0 ? "PASS" : "FAIL"}`,
    `- Commit: ${report.commit}`,
    `- Routes: ${report.routes.length}`,
    `- Viewports: ${report.viewports.join(", ")}`,
    `- Page checks: ${report.pageChecks}`,
    `- Screenshots: ${report.screenshots.length}`,
    "- 200% zoom approximation: a 720 CSS-pixel layout viewport, equivalent to a 1440-pixel-wide viewport viewed at 200% browser zoom.",
    "",
    "## Failures",
    "",
  ];
  if (report.failures.length === 0) lines.push("None.");
  else report.failures.forEach((failure) => lines.push(`- ${failure.route} at ${failure.viewport}: ${failure.message}`));
  lines.push("", "## Screenshots", "");
  report.screenshots.forEach((file) => lines.push(`- ${file}`));
  await fs.writeFile(path.join(outputRoot, "portfolio-visual-qa-report.md"), `${lines.join("\n")}\n`, "utf8");
}

await fs.access(siteRoot);
await fs.mkdir(screenshotRoot, { recursive: true });

const server = createStaticServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;

const report = {
  commit: process.env.GITHUB_SHA || "local",
  routes,
  viewports: viewports.map((viewport) => `${viewport.label} (${viewport.width}x${viewport.height})`),
  pageChecks: 0,
  screenshots: [],
  failures: [],
};

let browser;
try {
  await waitForHealthyServer(baseUrl);
  browser = await chromium.launch({ headless: true });

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      colorScheme: "dark",
      reducedMotion: "reduce",
    });

    for (const route of routes) {
      const page = await context.newPage();
      const runtimeErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
      });
      page.on("pageerror", (error) => runtimeErrors.push(`page error: ${error.message}`));
      page.on("requestfailed", (request) => {
        const failedUrl = new URL(request.url());
        if (failedUrl.origin === baseUrl) runtimeErrors.push(`request failed: ${failedUrl.pathname} (${request.failure()?.errorText || "unknown"})`);
      });
      page.on("response", (response) => {
        const responseUrl = new URL(response.url());
        if (responseUrl.origin === baseUrl && response.status() >= 400) runtimeErrors.push(`HTTP ${response.status()}: ${responseUrl.pathname}`);
      });

      let navigationResponse;
      try {
        navigationResponse = await page.goto(`${baseUrl}${route}`, { waitUntil: "load", timeout: 30000 });
        await page.evaluate(() => document.fonts?.ready);
      } catch (error) {
        addFailure(report, route, viewport.label, `Navigation failed: ${error.message}`);
        await page.close();
        continue;
      }

      report.pageChecks += 1;
      if (!navigationResponse || navigationResponse.status() !== 200) {
        addFailure(report, route, viewport.label, `Expected HTTP 200, received ${navigationResponse?.status() ?? "no response"}.`);
      }

      const audit = await page.evaluate(() => {
        const root = document.documentElement;
        const visible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        };
        const accessibleName = (link) => {
          const imageAlts = [...link.querySelectorAll("img")].map((image) => image.alt).join(" ");
          return `${link.getAttribute("aria-label") || ""} ${link.textContent || ""} ${imageAlts}`.trim();
        };
        const unnamedLinks = [...document.querySelectorAll("a[href]")]
          .filter(visible)
          .filter((link) => !accessibleName(link))
          .map((link) => link.getAttribute("href"));
        const brokenImages = [...document.images]
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.currentSrc || image.src);
        const overflowOffenders = [...document.body.querySelectorAll("*")]
          .filter(visible)
          .map((element) => ({ element, rect: element.getBoundingClientRect() }))
          .filter(({ rect }) => rect.left < -1 || rect.right > root.clientWidth + 1)
          .slice(0, 12)
          .map(({ element, rect }) => ({
            element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${[...element.classList].slice(0, 2).map((name) => `.${name}`).join("")}`,
            left: Math.round(rect.left),
            right: Math.round(rect.right),
          }));
        const repositoryLinksWithoutContext = [...document.querySelectorAll('main a[href*="github.com"]')]
          .filter(visible)
          .filter((link) => !/repository|github/i.test(accessibleName(link)))
          .map((link) => link.href);
        const localReferences = [...document.querySelectorAll("a[href], link[href], img[src], script[src]")]
          .map((element) => element.getAttribute("href") || element.getAttribute("src"))
          .filter(Boolean);
        return {
          title: document.title.trim(),
          canonicalCount: document.querySelectorAll('link[rel="canonical"][href]').length,
          mainCount: document.querySelectorAll("main").length,
          mainTextLength: (document.querySelector("main")?.innerText || "").trim().length,
          h1Count: document.querySelectorAll("main h1").length,
          stylesheetCount: document.querySelectorAll('link[rel~="stylesheet"][href]').length,
          svgCount: document.querySelectorAll("svg").length,
          unnamedLinks,
          brokenImages,
          overflowAmount: root.scrollWidth - root.clientWidth,
          overflowOffenders,
          repositoryLinksWithoutContext,
          localReferences,
        };
      });

      if (!audit.title) addFailure(report, route, viewport.label, "Document title is empty.");
      if (audit.canonicalCount !== 1) addFailure(report, route, viewport.label, `Expected one canonical link, found ${audit.canonicalCount}.`);
      if (audit.mainCount !== 1) addFailure(report, route, viewport.label, `Expected one main landmark, found ${audit.mainCount}.`);
      if (audit.mainTextLength === 0) addFailure(report, route, viewport.label, "Main content is empty.");
      if (audit.h1Count !== 1) addFailure(report, route, viewport.label, `Expected one main H1, found ${audit.h1Count}.`);
      if (audit.stylesheetCount === 0) addFailure(report, route, viewport.label, "No linked stylesheet was loaded.");
      if (route === "/" && audit.svgCount === 0) addFailure(report, route, viewport.label, "Homepage systems-map SVG is missing.");
      if (audit.unnamedLinks.length > 0) addFailure(report, route, viewport.label, `Links lack accessible names: ${audit.unnamedLinks.join(", ")}`);
      if (audit.brokenImages.length > 0) addFailure(report, route, viewport.label, `Images failed to render: ${audit.brokenImages.join(", ")}`);
      if (audit.overflowAmount > 1) addFailure(report, route, viewport.label, `Horizontal overflow is ${audit.overflowAmount}px; offenders: ${JSON.stringify(audit.overflowOffenders)}`);
      if (audit.repositoryLinksWithoutContext.length > 0) addFailure(report, route, viewport.label, `Repository links lack destination context: ${audit.repositoryLinksWithoutContext.join(", ")}`);
      runtimeErrors.forEach((error) => addFailure(report, route, viewport.label, error));

      const focusAudit = await page.evaluate(() => {
        const target = [...document.querySelectorAll("a[href], summary, button, input, select, textarea")]
          .find((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
          });
        if (!target) return { found: false };
        target.focus();
        const style = getComputedStyle(target);
        const result = {
          found: true,
          visible: target.matches(":focus-visible") &&
            ((style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0) || style.boxShadow !== "none"),
          element: target.tagName.toLowerCase(),
        };
        target.blur();
        return result;
      });
      if (!focusAudit.found) addFailure(report, route, viewport.label, "No keyboard-focusable control was found.");
      else if (!focusAudit.visible) addFailure(report, route, viewport.label, `The first focusable ${focusAudit.element} has no visible focus treatment.`);

      if ((route === "/" || route === "/work/") && await page.locator(".project-card").count() > 0) {
        const unlabeledCards = await page.locator(".project-card").evaluateAll((cards) => cards
          .filter((card) => !card.querySelector(".eyebrow") || !card.querySelector(".status-label"))
          .map((card) => card.getAttribute("data-work-id") || "unknown"));
        if (unlabeledCards.length > 0) addFailure(report, route, viewport.label, `Work cards lack text classification/status labels: ${unlabeledCards.join(", ")}`);
      }
      if (route.startsWith("/work/") && route !== "/work/") {
        const disclosurePanel = page.locator(".disclosure-panel");
        const disclosureCount = await disclosurePanel.count();
        if (disclosureCount !== 1) {
          addFailure(report, route, viewport.label, `Expected one work detail disclosure panel, found ${disclosureCount}.`);
        } else {
          const disclosureText = (await disclosurePanel.textContent())?.trim() || "";
          if (!disclosureText) addFailure(report, route, viewport.label, "Work detail disclosure panel is empty.");
        }
      }

      for (const reference of audit.localReferences) {
        const url = new URL(reference, `${baseUrl}${route}`);
        if (url.origin !== baseUrl || url.hash) continue;
        try {
          const response = await context.request.get(url.href, { timeout: 15000 });
          if (!response.ok()) addFailure(report, route, viewport.label, `Local reference returned HTTP ${response.status()}: ${url.pathname}`);
        } catch (error) {
          addFailure(report, route, viewport.label, `Local reference failed: ${url.pathname} (${error.message})`);
        }
      }

      const screenshotName = screenshotPlan.get(route)?.get(viewport.width);
      if (screenshotName) {
        await page.screenshot({ path: path.join(screenshotRoot, screenshotName), fullPage: true });
        report.screenshots.push(screenshotName);
      }
      await page.close();
    }
    await context.close();
  }

  const request = await browser.newContext();
  for (const asset of requiredAssets) {
    const response = await request.request.get(`${baseUrl}${asset}`);
    if (!response.ok()) addFailure(report, asset, "asset-check", `Required asset returned HTTP ${response.status()}.`);
    if (asset.endsWith(".pdf") && !/application\/pdf/i.test(response.headers()["content-type"] || "")) {
      addFailure(report, asset, "asset-check", "PDF asset was not served with an application/pdf content type.");
    }
  }
  await request.close();
} catch (error) {
  addFailure(report, "workflow", "runtime", error.stack || error.message);
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await writeReport(report);
}

if (report.failures.length > 0) {
  console.error(`Portfolio visual QA failed with ${report.failures.length} issue(s).`);
  report.failures.forEach((failure) => console.error(`- ${failure.route} at ${failure.viewport}: ${failure.message}`));
  process.exit(1);
}

console.log(`Portfolio visual QA passed ${report.pageChecks} page checks and created ${report.screenshots.length} screenshots.`);
