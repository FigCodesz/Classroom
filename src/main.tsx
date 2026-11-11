import "./App.css";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { BareMuxConnection } from "@mercuryworkshop/bare-mux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

const queryClient = new QueryClient();
// Create a new router instance
const router = createRouter({
  routeTree,
  basepath:
    import.meta.env.BASE_URL === "/"
      ? "/"
      : import.meta.env.BASE_URL.replace(/\/$/, ""),
  defaultPreload: "viewport"
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

declare global {
  interface Window {
    Connection: BareMuxConnection;
    scram: {
      init: () => Promise<ServiceWorkerRegistration>;
      // fix
      createFrame: (frame?: HTMLIFrameElement) => void;
      encodeUrl: (url: string | URL) => string;
      decodeUrl: (url: string | URL) => string;
      saveConfig: () => void;
      //fix
      modifyConfig: () => void;
    };
  }
}

const title = localStorage.getItem("title")?.trim() || "Radon Games";
document.title = title;
const icon =
  localStorage.getItem("icon")?.trim() || `${import.meta.env.BASE_URL}favicon.ico`;
document.querySelector('link[rel="icon"]')!.setAttribute("href", icon);

if ("serviceWorker" in navigator) {
  if (window.scram) {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL
      })
      .then(() => {
        console.log(`Registered SW`);
      });
    navigator.serviceWorker.ready.then(() => {
      const connection = new BareMuxConnection(
        `${import.meta.env.BASE_URL}baremux/worker.js`
      );
      window.Connection = connection;

      connection.setTransport(`${import.meta.env.BASE_URL}libcurl/index.mjs`, [
        {
          wisp:
            location.protocol === "http:"
              ? `ws://${location.host}${import.meta.env.BASE_URL}w/`
              : `wss://${location.host}${import.meta.env.BASE_URL}w/`
        }
      ]);
      console.log(`Set transport to libcurl`);
    });
  }
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  );
}

