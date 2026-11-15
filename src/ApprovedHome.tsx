import walkthroughStyles from "./report-walkthrough.css?inline";
/**
 * Approved Common homepage. Visual markup and styling are loaded directly from
 * the user-approved Common v7 prototype, not reinterpreted from a prose brief.
 * All prototype scripts are discarded. Live actions use the existing router,
 * Supabase-backed location RPC, and secure Quick Report route.
 */
import { useEffect, useRef, useState } from "react";
import { mountReportWalkthrough } from "./report-walkthrough";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./lib";

type PlaceResult = {
  id: number | string;
  name: string;
  slug: string;
  county?: string | null;
  matched_alias?: string | null;
};

const examples = [
 { name:"Overflowing public trash bin", location:"Hamburg · Street-side bin", age:18, count:7, category:"waiting", status:"Awaiting response", response:"No response yet", detail:"The issue stays visible while the community waits for an update.", photo:"hamburg-bin", credit:"Alexander Marks · 2005 · Public domain", source:"https://commons.wikimedia.org/wiki/File:Overflowing_Hamburg_street_garbage_bin.jpg" },
 { name:"Overflowing public trash bin", location:"Helsinki · Public waste container", age:11, count:4, category:"acknowledged", status:"Acknowledged", response:"Acknowledged · Cleanup planned", detail:"Town response: “We have received the reports and will arrange a cleanup.”", photo:"helsinki-bin", credit:"Ilkka Jukarainen · 2019 · CC BY-SA 2.0", source:"https://commons.wikimedia.org/wiki/File:Overflowing_garbage_bin_in_Helsinki,_Finland,_2019.jpg" },
 { name:"Overflowing public trash bin", location:"New Zealand · Sports grounds", age:6, count:3, category:"scheduled", status:"Cleanup scheduled", response:"Crew assigned · Next visit scheduled", detail:"Agency response: “A crew is assigned. We will post an update after collection.”", photo:"stadium-bin", credit:"Marshelec · 2021 · CC BY-SA 4.0", source:"https://commons.wikimedia.org/wiki/File:Overflowing_rubbish_bin_at_sports_stadium.jpg" },
];

export default function ApprovedHome() {
  const host = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const route = useLocation();
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const holder = host.current;
    if (!holder) return;
    const root = holder.shadowRoot || holder.attachShadow({ mode: "open" });
    let cancelled = false;
    let stopAnimation: (()=>void) | undefined;
    let searchTimer: ReturnType<typeof setTimeout> | undefined;
    let authSubscription: { unsubscribe: () => void } | undefined;

    const render = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}approved-home.html`, { cache: "no-cache" });
        if (!response.ok) throw new Error("The approved homepage asset could not be loaded.");
        const approved = await response.text();
        if (cancelled) return;
        const doc = new DOMParser().parseFromString(approved, "text/html");
        const style = Array.from(doc.querySelectorAll("style"))
          .map((node) => node.textContent || "")
          .join("\n");
        // Remove browser-demo authentication, simulated votes, modal scripts,
        // inline handlers and any external script before inserting markup.
        doc.querySelectorAll("script, .overlay").forEach((node) => node.remove());
        doc.querySelectorAll("*").forEach((node) => {
          for (const attribute of Array.from(node.attributes)) {
            if (/^on/i.test(attribute.name)) node.removeAttribute(attribute.name);
          }
        });
        const body = doc.body.innerHTML;
        root.innerHTML = "";
        const css = document.createElement("style");
        css.textContent = `
           :host { display:block; background:#f9fafc; color:#172235;
            font: 15px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
            --blue:#205bd6; --navy:#172235; --muted:#657185;
            --line:#dfe4ed; --paper:#f9fafc; --mist:#edf3ff;
            --orange:#e87951; --white:#fff; }
          ${style}
          ${walkthroughStyles}
          .hero-art.common-map-hero { aspect-ratio:1; height:auto; min-height:0; background:none; box-shadow:none; overflow:visible; }
          .common-map-hero img { display:block; width:100%; height:auto; border-radius:12px; }
          .example-disclaimer { font-size:12px; color:#657185; padding:4px 0 19px; }
          .issue { cursor:default; display:flex; flex-direction:column; }
          .issue .scene img { width:100%; height:100%; object-fit:cover; }
          .issue .issue-body { flex:1; }
          .issue .issue-footer { gap:16px; align-items:start; }
          .issue .issue-footer b,.issue .issue-footer span { display:block; }
          .issue-response { padding:14px; margin-top:18px; background:#edf3ff; border-radius:7px; }
          .issue-response small { display:block; color:#657185; font-size:10px; text-transform:uppercase; letter-spacing:.08em; }
          .issue-response strong { display:block; margin:5px 0; font-size:14px; }
          .issue-response p { font-size:12px; margin:0; color:#52647c; }
          .issue-photo-credit { font-size:10px; padding:5px 12px; color:#657185; }
          .top .nav { gap:18px; }
          .top .nav-reports,.top .account-login { background:none; border:0; color:#172235; font:650 13px Arial,sans-serif; padding:9px 0; white-space:nowrap; }
          @media(max-width:1100px) { .top-inner { height:auto; min-height:82px; flex-wrap:wrap; gap:12px; padding-top:12px; padding-bottom:12px; } .top .nav { flex-wrap:wrap; gap:14px; } }
          @media(max-width:600px) { .top .nav { width:100%; justify-content:space-between; } .top .nav-reports,.top .account-login { font-size:12px; } .top .nav .account-login { display:inline-flex; } }
          .issue:hover { transform:none; box-shadow:none; }
          .place-matches[role="status"]:empty { display:none; }
          .report-photo-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:20px; }
          .report-photo-example { min-width:0; margin:0; }
          .report-example-image { position:relative; height:390px; border-radius:14px; overflow:hidden; background:#314155; }
          .report-example-photo { width:100%; height:100%; object-fit:cover; display:block; }
          .report-example-city { position:absolute; left:16px; top:16px; color:#172235; background:#ffffffed; padding:7px 12px; border-radius:20px; font-weight:700; font-size:12px; }
          .report-example-ui { position:relative; margin:-22px 12px 0; padding:13px 14px; border-radius:12px; background:#fff; color:#172235; box-shadow:0 8px 25px #07182f33; border:1px solid #dfe4ed; }
          .report-example-brand { display:flex; align-items:center; gap:10px; }
          .report-example-brand img { width:19px; height:26px; object-fit:contain; }
          .report-example-brand strong { font-size:12px; }
          .report-example-brand small { display:block; font-size:10px; color:#657185; }
          .report-example-ui h3 { font-size:16px; margin:10px 0; }
          .report-example-progress { display:flex; gap:10px; justify-content:space-between; border-bottom:1px solid #dfe4ed; margin-top:10px; padding-bottom:7px; color:#657185; font-size:9px; }
          .report-example-progress .current { color:#205bd6; font-weight:700; }
          .report-example-choices { display:flex; gap:7px; flex-wrap:wrap; }
          .report-example-choices button { border:1px solid #d1ddee; background:#fff; color:#172235; border-radius:6px; padding:7px 9px; font:600 11px/1.3 Arial,sans-serif; cursor:pointer; }
          .report-example-choices button[aria-pressed="true"] { color:#fff; background:#205bd6; border-color:#205bd6; }
          .report-example-selection { font-size:11px; color:#52647c; margin:8px 0; }
          .report-example-ui .btn { width:100%; padding:9px 7px; font-size:11px; }
          .report-example-caption h3 { margin:18px 0 5px; font-size:19px; }
          .report-example-caption p { margin:0; font-size:12px; color:#c4d2e5; }
          .report-example-credit { margin:8px 0 0; font-size:10px; line-height:1.6; color:#b9cce2; }
          .report-example-credit a { color:inherit; text-decoration:underline; }
          .walkthrough-map .report-example-photo { object-fit:contain; background:#edf3ff; }
          .walkthrough-detail { font-size:12px; line-height:1.5; color:#52647c; min-height:36px; margin:8px 0; }
          .walkthrough-location-label,.walkthrough-photo-state { font-size:11px; border:1px solid #dfe4ed; border-radius:5px; padding:8px; margin:8px 0 12px; color:#52647c; }
          .walkthrough-note-canvas { background:#edf3ff; padding:20px; }
          .walkthrough-note-preview { height:100%; color:#172235; }
          .walkthrough-note-label { display:block; font-size:12px; font-weight:700; margin-bottom:18px; color:#205bd6; }
          .walkthrough-note-context { display:flex; align-items:center; gap:12px; margin-bottom:15px; }
          .walkthrough-note-context img { width:60px; height:60px; object-fit:cover; border-radius:7px; }
          .walkthrough-note-context strong { display:block; font-size:13px; }
          .walkthrough-note-context span { display:block; margin-top:4px; font-size:11px; color:#657185; }
          .walkthrough-note-preview label { display:block; font-size:12px; font-weight:600; margin:12px 0; }
          .walkthrough-note-preview select,.walkthrough-note-preview textarea { display:block; width:100%; margin-top:6px; padding:10px; border:1px solid #c8d5e8; border-radius:6px; background:#fff; color:#172235; font:12px/1.5 Arial,sans-serif; }
          .walkthrough-note-preview textarea { height:115px; resize:vertical; }
          .walkthrough-note-preview small,.walkthrough-note-input > span { color:#657185; font-size:10px; font-weight:400; }
          .report-walkthrough .report-example-ui { min-height:300px; box-sizing:border-box; display:flex; flex-direction:column; }
          .report-walkthrough .report-example-ui .btn { margin-top:auto; }
          .shared-place-scope { background:#edf3ff; padding:80px 0; }
          .shared-place-scope h2 { font-size:clamp(34px,4vw,56px); max-width:750px; margin:18px 0; }
          .place-scope-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:28px; margin:32px 0; }
          .place-scope-grid h3 { font-size:19px; margin-bottom:10px; }
          .place-scope-grid p { font-size:14px; color:#52647c; }
          @media(max-width:1000px) { .report-photo-grid { grid-template-columns:1fr; } .report-example-image { height:440px; } .report-example-ui { max-width:360px; } }
          @media(max-width:680px) { .place-scope-grid { grid-template-columns:1fr; gap:12px; } .report-example-image { height:360px; } .shared-place-scope { padding:55px 0; } }
        `;
        const content = document.createElement("div");
        content.className = "common-approved-page";
        content.innerHTML = body;
        content.querySelector(".top")?.remove();
        const walkthrough = content.querySelector<HTMLElement>("#quick");
        if (walkthrough) { content.querySelector(".statement")?.after(walkthrough); stopAnimation = mountReportWalkthrough(walkthrough); }
        content.querySelectorAll(".report-photo-example").forEach(card => {
          const photo = card.querySelector(".report-example-image");
          const portal = card.querySelector(".report-example-ui");
          if (photo && portal) photo.after(portal);
        });
        const heroArt = content.querySelector<HTMLElement>(".hero-art");
        if (heroArt) {
          heroArt.classList.add("common-map-hero");
          const image = document.createElement("img");
          image.src = `${import.meta.env.BASE_URL}brand/boston-map-hero.webp`;
          image.alt = "Illustrative Boston map with Common pins, three example reports, sample counts and a sample B-plus cleanliness grade. Not real city statistics.";
          image.width = 1280;
          image.height = 1280;
          image.fetchPriority = "high";
          heroArt.replaceChildren(image);
        }
        root.append(css, content);
        const target = new URLSearchParams(route.search).get("section");
        if (target) requestAnimationFrame(()=>root.getElementById(target)?.scrollIntoView({block:"start"}));
        content.querySelectorAll(".footer-row div").forEach(node=>{ if(node.textContent?.includes("Prelaunch beta")) node.textContent=node.textContent.replace("Prelaunch beta","openbeta.net"); });
        const footerCopy = content.querySelector(".footer-row > div:last-child");
        if (footerCopy) footerCopy.textContent = "openbeta.net · Coverage varies by community";

        const report = () => navigate("/report");
        const scrollTo = (id: string) => {
          if (id === "home") window.scrollTo({ top: 0, behavior: "smooth" });
          else root.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        };
        content.addEventListener("click", (event) => {
          const el = event.target as HTMLElement;
          const action = el.closest<HTMLElement>("[data-report], a, #myReportsNav");
          if (!action) return;
          if (action.matches("[data-report]")) {
            event.preventDefault();
            if (action.dataset.reportCategory) {
              const params = new URLSearchParams({ category: action.dataset.reportCategory, place_type: action.dataset.reportPlace || "" });
              navigate(`/report?${params}`);
            } else report();
            return;
          }
          if (action.id === "myReportsNav") {
            event.preventDefault();
            navigate("/my-reports");
            return;
          }
          if (action instanceof HTMLAnchorElement) {
            const href = action.getAttribute("href") || "";
            if (href.startsWith("#/")) { event.preventDefault(); navigate(href.slice(1)); return; }
            if (href.startsWith("#")) {
              event.preventDefault();
              if (href === "#issues" && action.closest(".overlay-card")) {
                // The floating hero card is a fictional example, not a live issue.
                scrollTo("issues");
              } else scrollTo(href.slice(1));
            }
          }
        });
        content.querySelectorAll<HTMLButtonElement>("[data-preview-category]").forEach(button => {
          button.addEventListener("click", () => {
            const card = button.closest(".report-photo-example");
            card?.querySelectorAll("[data-preview-category]").forEach(option => option.setAttribute("aria-pressed", String(option === button)));
            const selected = card?.querySelector(".report-example-selection");
            if (selected) selected.textContent = `Selected: ${button.textContent}`;
            const start = card?.querySelector<HTMLElement>("[data-report]");
            if (start) start.dataset.reportCategory = button.dataset.previewCategory;
          });
        });
        content.querySelectorAll<HTMLSelectElement>(".walkthrough-category select").forEach(select => {
          select.addEventListener("change", () => {
            const start = select.closest(".report-photo-example")?.querySelector<HTMLElement>("[data-report]");
            if (start) start.dataset.reportCategory = select.value;
          });
        });

        // Restore live Supabase municipality/alias search in the approved card.
        const search = root.querySelector<HTMLInputElement>("#placeSearch");
        const matches = root.querySelector<HTMLElement>("#placeMatches");
        const selected = root.querySelector<HTMLElement>("#placeSelected");
        if (search && matches && selected) {
          search.setAttribute("aria-label", "Search a Massachusetts city, town, or neighborhood");
          search.setAttribute("autocomplete", "off");
          search.setAttribute("role", "combobox");
          search.setAttribute("aria-autocomplete", "list");
          search.setAttribute("aria-controls", "placeMatches");
          search.setAttribute("aria-expanded", "false");
          matches.setAttribute("role", "listbox");
          let active = -1;
          let requestSerial = 0;
          const performSearch = async () => {
            const q = search.value.trim();
            const thisRequest = ++requestSerial;
            matches.replaceChildren();
            active = -1;
            search.removeAttribute("aria-activedescendant");
            search.setAttribute("aria-expanded", "false");
            selected.hidden = true;
            if (q.length < 2) return;
            const loading = document.createElement("div");
            loading.className = "demo";
            loading.textContent = "Searching Massachusetts…";
            matches.append(loading);
            const { data, error } = await supabase.rpc("search_places", { q });
            if (cancelled || thisRequest !== requestSerial) return;
            matches.replaceChildren();
            if (error) {
              const msg = document.createElement("div");
              msg.className = "info";
              msg.textContent = "Search is temporarily unavailable. Please try again.";
              matches.append(msg);
              return;
            }
            const result = (data || []) as PlaceResult[];
            if (!result.length) {
              const msg = document.createElement("div");
              msg.className = "info";
              msg.textContent = "No matching Massachusetts community. Other states are not yet covered.";
              matches.append(msg);
              return;
            }
            search.setAttribute("aria-expanded", "true");
            result.slice(0, 7).forEach((place, index) => {
              const button = document.createElement("button");
              button.type = "button";
              button.className = "place-match";
              button.id = `approved-place-${index}`;
              button.setAttribute("role", "option");
              button.setAttribute("aria-selected", "false");
              const name = document.createElement("span");
              name.textContent = `${place.name}, MA`;
              const detail = document.createElement("small");
              detail.textContent = place.matched_alias
                ? `${place.matched_alias} · ${place.county || "Massachusetts"}`
                : `${place.county || "Massachusetts"} County`;
              button.append(name, detail);
              button.addEventListener("click", () => navigate(
                `/places/${place.slug}${place.matched_alias ? `?neighborhood=${encodeURIComponent(place.matched_alias)}` : ""}`,
              ));
              matches.append(button);
            });
          };
          search.addEventListener("input", () => {
            ++requestSerial;
            matches.replaceChildren();
            search.setAttribute("aria-expanded", "false");
            search.removeAttribute("aria-activedescendant");
            active = -1;
            if (searchTimer) clearTimeout(searchTimer);
            searchTimer = setTimeout(performSearch, 220);
          });
          search.addEventListener("keydown", (event) => {
            const options = Array.from(matches.querySelectorAll<HTMLButtonElement>("button.place-match"));
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              active = event.key === "ArrowDown" ? Math.min(active + 1, options.length - 1) : Math.max(active - 1, 0);
              options.forEach((option, index) => option.setAttribute("aria-selected", String(index === active)));
              if (options[active]) search.setAttribute("aria-activedescendant", options[active].id);
            }
            if (event.key === "Escape") {
              ++requestSerial;
              matches.replaceChildren();
              search.setAttribute("aria-expanded", "false");
              search.removeAttribute("aria-activedescendant");
            }
            if (event.key === "Enter") {
              const first = options[active] || options[0];
              if (first) { event.preventDefault(); first.click(); }
              else if (search.value.trim()) {
                event.preventDefault();
                navigate(`/search?q=${encodeURIComponent(search.value.trim())}`);
              }
            }
          });
          // The v7 HTML labels this a demo search; update to truthful live copy.
          const hint = search.closest(".common-search-card")?.querySelector("small:last-child");
          if (hint) hint.textContent = "Search all 351 Massachusetts municipalities and supported community aliases.";
        }

        // Pair licensed historical photos with clearly labeled example histories.
        const cards = root.querySelector<HTMLElement>("#cards");
        const filterButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-filter]"));
        let activeFilter = "all";
        const displayCards = () => {
          if (!cards) return;
          cards.replaceChildren();
          const filtered = examples.filter((item) => activeFilter === "all" || item.category === activeFilter);
          filtered.forEach((item) => {
            const article = document.createElement("article");
            article.className = "issue";
            const scene = document.createElement("div");
            scene.className = "scene";
            const image = document.createElement("img");
            image.src = import.meta.env.BASE_URL + "photos/" + item.photo + ".webp";
            image.alt = "Real photograph of an overflowing trash bin: " + item.location;
            image.loading = "lazy";
            scene.append(image);
            const label = document.createElement("div");
            label.className = "scene-label";
            label.textContent = `${item.status.toUpperCase()} · EXAMPLE`;
            scene.append(label);
            const body = document.createElement("div");
            body.className = "issue-body";
            const meta = document.createElement("div");
            meta.className = "issue-meta";
            meta.textContent = item.location;
            const title = document.createElement("h3");
            title.textContent = item.name;
            const footer = document.createElement("div");
            footer.className = "issue-footer";
            const age = document.createElement("div");
            const ageValue = document.createElement("b");
            ageValue.textContent = `${item.age} days`;
            const descriptor = document.createElement("span");
            descriptor.textContent = "since first report";
            age.append(ageValue, descriptor);
            const count = document.createElement("div");
            const countValue = document.createElement("b"); countValue.textContent = String(item.count);
            const countLabel = document.createElement("span"); countLabel.textContent = "reports since first report";
            count.append(countValue, countLabel); footer.append(age, count);
            const response = document.createElement("div"); response.className = "issue-response";
            const responseLabel = document.createElement("small"); responseLabel.textContent = "Town / agency response · Example";
            const responseTitle = document.createElement("strong"); responseTitle.textContent = item.response;
            const detail = document.createElement("p"); detail.textContent = item.detail;
            response.append(responseLabel, responseTitle, detail);
            const credit = document.createElement("a"); credit.className = "issue-photo-credit"; credit.href = item.source; credit.textContent = "Photo: " + item.credit + " · Cropped";
            body.append(meta, title, footer, response);
            article.append(scene, credit, body);
            cards.append(article);
          });
          if (!filtered.length) {
            const empty = document.createElement("p");
            empty.textContent = "No examples in this category.";
            cards.append(empty);
          }
        };
        if (cards) {
          const disclosure = document.createElement("div");
          disclosure.className = "example-disclaimer";
          disclosure.textContent = "Illustrative example reports only. Real historical photos; report counts, ages, and town responses are examples, not live municipal records.";
          cards.parentNode?.insertBefore(disclosure, cards);
          displayCards();
        }
        filterButtons.forEach((button) => button.addEventListener("click", () => {
          activeFilter = button.dataset.filter || "all";
          filterButtons.forEach((candidate) => candidate.classList.toggle("active", candidate === button));
          displayCards();
        }));
        root.getElementById("showAll")?.addEventListener("click", () => {
          const all = filterButtons.find((button) => button.dataset.filter === "all");
          all?.click();
          scrollTo("issues");
        });
        const myReports = root.getElementById("myReportsNav");
        const updateReports = (loggedIn: boolean) => {
          if (myReports) myReports.hidden = false;
          const login = root.getElementById("accountLoginNav");
          if (login) { login.textContent = loggedIn ? "Your account" : "Log in"; login.setAttribute("href", loggedIn ? "#/my-reports" : "#/auth"); }
        };
        void supabase.auth.getUser().then(({ data }) => {
          if (!cancelled) updateReports(Boolean(data.user));
        });
        const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => {
          updateReports(Boolean(session?.user));
        });
        authSubscription = auth.subscription;
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Unable to load the approved design.");
      }
    };
    void render();
    return () => {
      cancelled = true;
      stopAnimation?.();
      if (searchTimer) clearTimeout(searchTimer);
      authSubscription?.unsubscribe();
      root.replaceChildren();
    };
  }, [navigate, route.search]);

  return loadError ? (
    <section role="alert" style={{ padding: "80px 6%" }}>
      <h1>Common could not load.</h1>
      <p>{loadError}</p>
    </section>
  ) : (
    <div ref={host} className="approved-home-host" />
  );
}
