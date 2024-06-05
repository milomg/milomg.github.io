// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap"
            rel="stylesheet"
          />
          <link rel="shortcut icon" type="image/png" href="https://avatars2.githubusercontent.com/u/14153763" />
          <link rel="manifest" href="/manifest.json" />
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="theme-color" content="#82aaff" />
          {assets}
        </head>
        <body class="light">
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
