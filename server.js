const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const app = express();
const PORT = 3000;

// Encode/decode target URL safely
const encode = (url) => encodeURIComponent(url);
const decode = (str) => decodeURIComponent(str);

// Rewrite a URL to go through this proxy
function proxyUrl(href, base) {
  try {
    const abs = new URL(href, base).href;
    return `/proxy?url=${encode(abs)}`;
  } catch {
    return href;
  }
}

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head><title>Web Proxy</title>
<style>
  body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0f0f0; }
  form { display: flex; gap: 8px; }
  input { width: 400px; padding: 10px; font-size: 16px; border: 1px solid #ccc; border-radius: 4px; }
  button { padding: 10px 20px; font-size: 16px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer; }
</style>
</head>
<body>
  <h1>Web Proxy</h1>
  <form action="/proxy" method="GET">
    <input name="url" type="text" placeholder="https://example.com" required />
    <button type="submit">Go</button>
  </form>
</body>
</html>`);
});

app.get("/proxy", async (req, res) => {
  let targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Missing ?url=");

  // Auto-add https if missing
  if (!/^https?:\/\//i.test(targetUrl)) targetUrl = "https://" + targetUrl;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type") || "";

    // Pass through non-HTML resources (images, CSS, JS, fonts, etc.)
    if (!contentType.includes("text/html")) {
      res.set("content-type", contentType);
      response.body.pipe(res);
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const base = response.url;

    // Rewrite all links and resource URLs
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
        $(el).attr("href", proxyUrl(href, base));
      }
    });

    $("link[href]").each((_, el) => {
      $(el).attr("href", proxyUrl($(el).attr("href"), base));
    });

    $("[src]").each((_, el) => {
      $(el).attr("src", proxyUrl($(el).attr("src"), base));
    });

    $("form[action]").each((_, el) => {
      $(el).attr("action", proxyUrl($(el).attr("action"), base));
    });

    // Inject base-target to keep navigation inside proxy
    $("head").prepend(`<base href="${base}">`);

    res.set("content-type", "text/html");
    res.send($.html());
  } catch (err) {
    res.status(500).send(`<pre>Error fetching ${targetUrl}\n\n${err.message}</pre>`);
  }
});

app.listen(PORT, () => console.log(`Proxy running at http://localhost:${PORT}`));
