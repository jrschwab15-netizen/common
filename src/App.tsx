import NearbyCases from "./NearbyCases";
import AccountEntry from "./AccountEntry";
import ApprovedHome from "./ApprovedHome";
import CityMap from "./CityMap";
import { useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { get, set, del } from "idb-keyval";
import GoogleReportMap from "./GoogleReportMap";
import "leaflet/dist/leaflet.css";
import {
  api,
  ageLabel,
  categories,
  publicPlaceTypes,
  reportPlaceLabel,
  emergencyText,
  supabase,
  validatePhoto,
  validPoint,
  type Place,
  type Coverage,
  type Report,
} from "./lib";

function ErrorNotice({ error }: { error: string }) {
  return error ? (
    <p className="notice error" role="alert">
      {error}
    </p>
  ) : null;
}
function Search({ initial = "", compact = false }: { initial?: string; compact?: boolean }) {
  const [q, Q] = useState(initial),
    [results, R] = useState<Place[]>([]),
    [error, E] = useState(""),
    [loading, B] = useState(false),
    [active, A] = useState(-1),
    [open, O] = useState(false);
  const navigate = useNavigate();
  const uid = useRef(`places-${Math.random().toString(36).slice(2)}`);
  useEffect(() => {
    let current = true;
    if (q.trim().length < 2) {
      R([]);
      return;
    }
    const timer = setTimeout(async () => {
      B(true);
      const { data, error } = await supabase.rpc("search_places", { q });
      if (current) {
        R(data || []);
        E(error ? "Search is temporarily unavailable. Please try again." : "");
        B(false);
        A(-1);
      }
    }, 200);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [q]);
  const choose = (p: Place) => {
    O(false);
    navigate(
      `/places/${p.slug}${p.matched_alias ? `?neighborhood=${encodeURIComponent(p.matched_alias)}` : ""}`,
    );
  };
  return (
    <form
      className={compact ? "search header-city-search" : "search"}
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && results[active]) choose(results[active]);
        else navigate(`/search?q=${encodeURIComponent(q)}`);
      }}
    >
      <label htmlFor={uid.current}>{compact ? "Search your city" : "Find your community"}</label>
      <div className="searchbar">
        <span aria-hidden="true">⌕</span>
        <input
          id={uid.current}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && results.length > 0}
          aria-controls={`${uid.current}-list`}
          aria-activedescendant={
            active >= 0 ? `${uid.current}-${active}` : undefined
          }
          placeholder={compact ? "Search for city or town" : "Search a city, town or neighborhood"}
          value={q}
          onChange={(e) => {
            Q(e.target.value);
            O(true);
          }}
          onFocus={() => O(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              A(Math.min(active + 1, results.length - 1));
              O(true);
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              A(Math.max(active - 1, 0));
            }
            if (e.key === "Escape") O(false);
          }}
        />
        {!compact && <button aria-label="Search places" type="submit">
          →
        </button>}
      </div>
      {open && results.length > 0 && (
        <ul className="suggestions" role="listbox" id={`${uid.current}-list`}>
          {results.map((p, i) => (
            <li
              key={`${p.id}-${i}`}
              role="option"
              aria-selected={active === i}
              id={`${uid.current}-${i}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(p)}
            >
              {p.matched_alias && <small>{p.matched_alias} → </small>}
              {p.name}, MA <small>· {p.county} County</small>
            </li>
          ))}
        </ul>
      )}
      {!compact && <p className="searchhint" aria-live="polite">
        {loading
          ? "Searching…"
          : q.length > 1 && results.length === 0
            ? "No matching Massachusetts community. Coverage elsewhere is not yet available."
            : "Massachusetts directory · Coverage varies by community"}
      </p>}
      <ErrorNotice error={error} />
    </form>
  );
}
function Home() {
  return <ApprovedHome />;
}
function SearchPage() {
  const [params] = useSearchParams();
  return (
    <section className="page narrow">
      <div className="eyebrow">YOUR COMMUNITY</div>
      <h1>Find your place.</h1>
      <Search initial={params.get("q") || ""} />
      <p>
        Search official municipality names and source-supported aliases. Places
        outside Massachusetts currently have no directory coverage.
      </p>
    </section>
  );
}
function CoveragePanel({ coverage }: { coverage?: Coverage }) {
  return (
    <div className="coverage">
      {[
        ["Directory", coverage?.directory_loaded],
        ["Public reporting", coverage?.public_reporting_enabled],
        ["Responsibility GIS", coverage?.gis_responsibility_ready],
        ["Agency routing", coverage?.agency_routing_ready],
      ].map(([label, on]) => (
        <div key={String(label)}>
          <span>{label}</span>
          <strong>{on ? "Available" : "Not yet available"}</strong>
        </div>
      ))}
    </div>
  );
}
type Issue = {
  id: string;
  public_id: string;
  title: string;
  category: string;
  public_location: string;
  public_point?: unknown;
  first_reported_at: string;
  verified_fixed_at: string | null;
  maintenance_status: string;
  agency_status: string;
  verification_status: string;
  routing_delivery_status: string;
  reopened_at: string | null;
};
function PlacePage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const [p, P] = useState<Place | null>(null),
    [issues, I] = useState<Issue[]>([]),
    [error, E] = useState(""),
    [loading, B] = useState(true),
    [status, S] = useState("all"),
    [cat, C] = useState("all"),
    [requested, R] = useState(false);
  useEffect(() => {
    let live = true;
    B(true);
    E("");
    (async () => {
      const { data, error } = await supabase
        .from("municipalities")
        .select(
          "id,name,slug,county,municipality_type,source_version,imported_at,boundary,coverage(*)",
        )
        .eq("slug", slug)
        .maybeSingle();
      if (!live) return;
      if (error || !data) {
        E(error ? "Could not load this community." : "Community not found.");
        B(false);
        return;
      }
      P({ ...data, coverage: data.coverage as unknown as Coverage });
      const collected: Issue[] = [];
      let reportError = false;
      for (let offset = 0; ; offset += 1000) {
      const r = await supabase
        .from("issues")
        .select("id,public_id,title,category,public_location,public_point,first_reported_at,verified_fixed_at,maintenance_status,agency_status,verification_status,routing_delivery_status,reopened_at")
        .eq("municipality_id", data.id)
        .eq("publication_status", "published")
        .order("first_reported_at", { ascending: false })
        .order("id")
        .range(offset, offset + 999);
      if (!live) return;
      if (r.error) { reportError = true; break; }
      collected.push(...(r.data || []));
      if ((r.data || []).length < 1000) break;
      }
      if (live) {
        I(collected);
        if (reportError) E("Published reports could not be fully loaded. Map and counts may be incomplete. Please reload to retry.");
        B(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [slug]);
  if (loading)
    return (
      <section className="page" role="status">
        Loading community…
      </section>
    );
  if (!p)
    return (
      <section className="page">
        <ErrorNotice error={error} />
        <Search />
      </section>
    );
  return (
    <section className="page">
      <div className="eyebrow">MASSACHUSETTS / {p.county} COUNTY</div>
      <h1>
        {p.name}
        <span className="punctuation">.</span>
      </h1>
      {params.get("neighborhood") && (
        <p>
          Search context: {params.get("neighborhood")} · Municipality-level
          information
        </p>
      )}
      <div className="metrics">
        <div>
          <strong>{issues.length}</strong>
          <span>Published cases</span>
        </div>
        <div>
          <strong>
            {
              issues.filter((i) => i.maintenance_status !== "verified_fixed")
                .length
            }
          </strong>
          <span>Open cases</span>
        </div>
        <div>
          <strong>
            {
              issues.filter((i) => i.maintenance_status === "verified_fixed")
                .length
            }
          </strong>
          <span>Independently verified fixed</span>
        </div>
      </div>
      <div className="section-head">
        <h2>The public record</h2>
        <Link to="/report" className="button">
          Quick Report ↗
        </Link>
      </div>
      <div className="filters">
        <label>
          Status
          <select value={status} onChange={(e) => S(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="verified_fixed">Verified fixed</option>
          </select>
        </label>
        <label>
          Category
          <select value={cat} onChange={(e) => C(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c === "Other public infrastructure" ? "Other" : c}</option>
            ))}
          </select>
        </label>
      </div>
      <ErrorNotice error={error} />
      <CityMap name={p.name} boundary={p.boundary} issues={issues.filter(i =>
        (status === "all" || (status === "open" ? i.maintenance_status !== "verified_fixed" : i.maintenance_status === status)) &&
        (cat === "all" || i.category === cat)
      )} />
      {issues.length === 0 ? (
        <div className="empty">
          <h3>No Common reports yet</h3>
          <p>
            This is a directory profile. GIS review and agency routing may not
            yet be available.
          </p>
        </div>
      ) : (
        issues
          .filter(
            (i) =>
              (status === "all" ||
                (status === "open"
                  ? i.maintenance_status !== "verified_fixed"
                  : i.maintenance_status === status)) &&
              (cat === "all" || i.category === cat),
          )
          .map((i) => <IssueCard key={i.id} issue={i} />)
      )}
      <details className="city-coverage-details"><summary>Reporting coverage &amp; data sources</summary><CoveragePanel coverage={p.coverage} />
      <p className="muted">
        MassGIS directory imported{" "}
        {new Date(p.imported_at).toLocaleDateString()}. Boundary source version:{" "}
        {new Date(p.source_version).toLocaleDateString()}. Directory coverage
        does not verify maintenance responsibility.
      </p>
      </details>
      {!p.coverage?.public_reporting_enabled && (
        <button
          className="secondary"
          disabled={requested}
          onClick={async () => {
            try {
              await api("coverage-request", { municipality_id: p.id });
              R(true);
            } catch (e) {
              E((e as Error).message);
            }
          }}
        >
          {requested
            ? "Coverage interest recorded"
            : "Request reporting coverage"}
        </button>
      )}
      <p>
        <Link to="/methodology">Sources and methodology →</Link>
      </p>
    </section>
  );
}
function IssueCard({ issue: i }: { issue: Issue }) {
  return (
    <Link className="issue-card" to={`/issues/${i.public_id}`}>
      <div>
        <span className="eyebrow">{i.category}</span>
        <h3>{i.title}</h3>
        <p>{i.public_location}</p>
      </div>
      <div>
        <strong>
          {ageLabel(
            i.first_reported_at,
            i.maintenance_status === "verified_fixed"
              ? i.verified_fixed_at
              : null,
          )}
        </strong>
        <p>
          {i.agency_status === "closed"
            ? "Agency closed — not yet verified"
            : i.maintenance_status.replaceAll("_", " ")}
        </p>
      </div>
    </Link>
  );
}
type Draft = {
  place_type?: string;
  lat: string;
  lng: string;
  place_label: string;
  note: string;
  category: string;
  file: File | null;
  confirmed: boolean;
  idempotency_key: string;
};
const newDraft = (): Draft => ({
  place_type: "",
  lat: "",
  lng: "",
  place_label: "",
  note: "",
  category: categories[0],
  file: null,
  confirmed: false,
  idempotency_key: crypto.randomUUID(),
});
function ReportPage({ session }: { session: Session | null }) {
  const [reportParams] = useSearchParams();
  const presetCategory = reportParams.get("category") || "";
  const presetPlaceType = reportParams.get("place_type") || "";
  const [step, S] = useState(session ? 1 : 0),
    [draft, D] = useState<Draft>(newDraft),
    [ready, V] = useState(false),
    [error, E] = useState(""),
    [busy, B] = useState(false),
    [emergency, H] = useState<boolean | null>(null),
    [receipt, R] = useState<{ id: string; token: string } | null>(null),
    [preview, P] = useState(""),
    [address, A] = useState(""),
    [found, F] = useState<{ label: string; lat: number; lng: number }[]>([]);
  const [locating, setLocating] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const locationRequest = useRef(0);
  const locationAsked = useRef(false);
  useEffect(() => () => { ++locationRequest.current; }, []);
  useEffect(() => {
    if (step !== 1) { ++locationRequest.current; setLocating(false); }
  }, [step]);
  const navigate = useNavigate();
  useEffect(() => {
    get<Draft>("common-draft").then((d) => {
      D({ ...(d || newDraft()),
        ...(categories.includes(presetCategory) ? { category: presetCategory } : {}),
        ...(publicPlaceTypes.includes(presetPlaceType) ? { place_type: presetPlaceType } : {}),
      });
      V(true);
    });
  }, []);
  useEffect(() => {
    if (ready) set("common-draft", draft).catch(() => {});
  }, [draft, ready]);
  useEffect(() => {
    if (!draft.file) {
      P("");
      return;
    }
    const url = URL.createObjectURL(draft.file);
    P(url);
    return () => URL.revokeObjectURL(url);
  }, [draft.file]);
  useEffect(() => {
    if (session && step === 0) S(1);
  }, [session]);
  const update = (v: Partial<Draft>) => {
    if (v.lat !== undefined || v.lng !== undefined) {
      ++locationRequest.current;
      setLocating(false);
      setLocationAccuracy(null);
    }
    D((d) => ({ ...d, ...v }));
  };
  const point: [number, number] = [
    draft.lat !== "" && validPoint(Number(draft.lat), Number(draft.lng)) ? Number(draft.lat) : 42.36,
    draft.lng !== "" && validPoint(Number(draft.lat), Number(draft.lng)) ? Number(draft.lng) : -71.06,
  ];
  const selected =
    draft.lat !== "" &&
    draft.lng !== "" &&
    validPoint(Number(draft.lat), Number(draft.lng));
  const locationLabel = reportPlaceLabel(
    draft.place_label.trim() || `Map pin: ${point[0].toFixed(6)}, ${point[1].toFixed(6)}`,
    draft.place_type,
  );
  async function locate() {
    E("");
    locationAsked.current = true;
    const request = ++locationRequest.current;
    setLocating(true);
    setLocationAccuracy(null);
    navigator.geolocation
      ? navigator.geolocation.getCurrentPosition(
          (p) => {
            if (request !== locationRequest.current) return;
            D(d => ({ ...d,
              lat: String(p.coords.latitude),
              lng: String(p.coords.longitude),
              confirmed: false,
            }));
            setLocationAccuracy(p.coords.accuracy);
            setLocating(false);
          },
          (error) => {
            if (request !== locationRequest.current) return;
            E(
              error.code === 1
                ? "Location access is blocked. Allow location for this site in your browser settings, then tap Use my location. You can also enter coordinates below."
                : error.code === 3
                  ? "Your device took too long to find its location. Try again outdoors or enter coordinates below."
                  : "Your device could not determine its location. Turn on device location services and try again, or enter coordinates below.",
            );
            setLocating(false);
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
        )
      : (E("Device location is unavailable in this browser. Enter coordinates below."), setLocating(false));
  }
  async function submit() {
    B(true);
    E("");
    try {
      if (!draft.file) throw Error("A photo is required.");
      if (locationLabel.length > 200) throw Error("Shorten the location description so it fits with the selected place type.");
      if (emergencyText(draft.note)) {
        H(true);
        S(1);
        return;
      }
      await validatePhoto(draft.file);
      const response = await api<{
        id: string;
        token: string;
        upload_token?: string;
        path?: string;
        status: string;
      }>("intake", {
        ...draft,
        place_label: locationLabel,
        file: undefined,
        lat: Number(draft.lat),
        lng: Number(draft.lng),
        mime: draft.file.type,
        bytes: draft.file.size,
      });
      await set("common-pending-receipt", {
        id: response.id,
        token: response.token,
      });
      if (response.status === "awaiting_upload") {
        const { error } = await supabase.storage
          .from("originals")
          .uploadToSignedUrl(
            response.path!,
            response.upload_token!,
            draft.file,
            { contentType: draft.file.type },
          );
        if (error) {
          try {
            await api("finalize", { id: response.id, token: response.token });
          } catch {
            throw Error(
              "Upload failed. Your draft is saved on this device; retry submission.",
            );
          }
        } else
          await api("finalize", { id: response.id, token: response.token });
      }
      R({ id: response.id, token: response.token });
      await del("common-draft");
      await del("common-pending-receipt");
      S(5);
    } catch (e) {
      E((e as Error).message);
    } finally {
      B(false);
    }
  }
  if (!ready)
    return <section className="page narrow report-flow">Loading saved draft…</section>;
  if (step === 0)
    return (
      <section className="page narrow report-flow report-entry">
        <div className="eyebrow">QUICK REPORT</div>
        <h1>
          A small act.
          <br />A public record.
        </h1>
        <p>
          An account is optional. You can save your report to an account after
          submitting.
        </p>
        <button className="button wide report-next" onClick={() => S(1)}>
          Continue as guest →
        </button>
        <Link className="secondary wide" to="/auth">
          Sign in / Create an account
        </Link>
        <p className="muted">
          Photos and location are reviewed privately before publication. Common
          is not an emergency service.
        </p>
      </section>
    );
  if (step === 5 && receipt) {
    const url = `${location.origin}${location.pathname}#/track/${receipt.id}/${receipt.token}`;
    return (
      <section className="page narrow report-flow">
        <div className="eyebrow">PRIVATE RECEIPT</div>
        <h1>
          Received.
          <br />
          Review comes next.
        </h1>
        <p>
          Your report and photo are stored privately. This receipt does not mean
          the report is public, routed or acknowledged by an agency.
        </p>
        {session ? (
          <Link className="button wide report-next" to="/my-reports">
            View in My reports →
          </Link>
        ) : (
          <>
            <Link
              className="button wide report-next"
              to={`/auth?claim=${receipt.id}`}
              onClick={() =>
                sessionStorage.setItem("common-claim", JSON.stringify(receipt))
              }
            >
              Save this report to an account →
            </Link>
            <Link
              className="secondary wide"
              to={`/track/${receipt.id}/${receipt.token}`}
            >
              Finish as guest →
            </Link>
          </>
        )}
        <div className="notice">
          <strong>Keep your private tracking link.</strong>
          <p>
            Anyone with this link can view private receipt status. It is not a
            public issue link. Claiming the report revokes guest access.
          </p>
          <input
            aria-label="Private tracking link"
            value={url}
            readOnly
            onFocus={(e) => e.target.select()}
          />
          <button
            className="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                E("");
              } catch {
                E("Select and copy the link manually.");
              }
            }}
          >
            Copy tracking link
          </button>
        </div>
        <ErrorNotice error={error} />
      </section>
    );
  }
  return (
    <section className="page narrow report-flow">
      <div className="eyebrow">
        QUICK REPORT / {session ? "SIGNED IN" : "GUEST"}
      </div>
      <div className="progress" aria-label={`Step ${Math.min(step, 4)} of 4`}>
        {["Location", "Photo", "Note", "Review"].map((v, i) => (
          <span key={v} className={step === i + 1 ? "current" : ""}>
            {i + 1}. {v}
          </span>
        ))}
      </div>
      <ErrorNotice error={error} />
      {step === 1 && (
        <>
          <h1>Where’s the issue?</h1>
          {emergency !== false && <p className="report-scope-intro">Public places only. Stay in safe public access areas.</p>}
          {emergency === false ? <div className="report-safety-summary"><span>No immediate emergency</span><button type="button" className="inline-button" onClick={() => H(null)}>Change</button></div> : <div className="notice report-safety">
            <strong>Is there an immediate emergency?</strong>
            <p>
              For fire, injury, a severe allergic reaction, downed wires or an immediate threat, contact 911
              or the emergency utility. Never approach a hazard to take a photo.
            </p>
            <div className="actions">
              <button
                className={emergency === true ? "button" : "secondary"}
                onClick={() => { H(true); ++locationRequest.current; setLocating(false); }}
              >
                Yes / unsure
              </button>
              <button
                className="secondary"
                onClick={() => { H(false); if (!selected && !locationAsked.current) void locate(); }}
              >
                No immediate emergency
              </button>
            </div>
          </div>}
          {emergency === true ? (
            <div className="notice error" role="alert">
              Common does not dispatch emergency help. Move to a safe location
              and contact emergency services. Photo collection is paused.
            </div>
          ) : emergency === false ? (
            <>
              <div className="device-location-card">

                <button className="button" onClick={locate} disabled={busy || locating}>
                  {locating ? "Finding your location…" : "⌖ Use my location"}
                </button>
                <p role="status" aria-live="polite">
                  {locating ? "Allow location access to position the pin…" : locationAccuracy !== null
                    ? `Location set · estimated accuracy within ${Math.round(locationAccuracy)} meters. ${locationAccuracy > 100 ? "Approximate reading; adjust the pin." : "Check the issue pin."}`
                    : "Drag the pin to the issue or use manual location below."}
                </p>
              </div>
              <GoogleReportMap
                point={point}
                onChange={(p) =>
                  update({
                    lat: p[0].toFixed(6),
                    lng: p[1].toFixed(6),
                    confirmed: false,
                  })
                }
              />
              <details className="report-location-options"><summary>Manual location &amp; place details</summary>
              <form
                className="address-search"
                onSubmit={async (e) => {
                  e.preventDefault();
                  B(true);
                  E("");
                  try {
                    F(await api("geocode", { q: address }));
                  } catch (e) {
                    E((e as Error).message);
                  }
                  B(false);
                }}
              >
                <label>
                  Or find an address / public place
                  <input
                    value={address}
                    onChange={(e) => A(e.target.value)}
                    placeholder="Street address, city, MA"
                  />
                </label>
                <button
                  className="secondary"
                  disabled={busy || address.length < 3}
                >
                  Find location
                </button>
              </form>
              {found.map((r, i) => (
                <button
                  className="location-result"
                  key={i}
                  onClick={() => {
                    update({
                      lat: String(r.lat),
                      lng: String(r.lng),
                      place_label: r.label,
                      confirmed: false,
                    });
                    F([]);
                  }}
                >
                  {r.label}
                </button>
              ))}
              <div className="coordinate-fields">
                <label>
                  Latitude
                  <input
                    inputMode="decimal"
                    value={draft.lat}
                    onChange={(e) =>
                      update({ lat: e.target.value, confirmed: false })
                    }
                  />
                </label>
                <label>
                  Longitude
                  <input
                    inputMode="decimal"
                    value={draft.lng}
                    onChange={(e) =>
                      update({ lng: e.target.value, confirmed: false })
                    }
                  />
                </label>
              </div>
              <label>
                Public place type
                <select value={draft.place_type || ""} onChange={e => update({ place_type: e.target.value })}>
                  <option value="">Choose a place type (optional)</option>
                  {publicPlaceTypes.map(type => <option key={type}>{type}</option>)}
                </select>
              </label>
              <p className="muted">The responsible agency may be the municipality, a parks department, a transit authority, or an airport operator. Responsibility is reviewed before publication; agency delivery is not yet enabled.</p>
              <label>
                Public location description (optional)
                <input
                  maxLength={200 - (draft.place_type ? draft.place_type.length + 3 : 0)}
                  value={draft.place_label}
                  onChange={(e) => update({ place_label: e.target.value })}
                  placeholder="For example: sidewalk beside the library"
                />
              </label>
              </details>
              <label className="check">
                <input
                  type="checkbox"
                  checked={draft.confirmed}
                  onChange={(e) => update({ confirmed: e.target.checked })}
                />
                Move the pin on the map if needed, then confirm this location.
              </label>

              <button
                className="button wide report-next"
                disabled={
                  !selected ||
                  !draft.confirmed ||
                  emergency !== false
                }
                onClick={() => {
                  S(2);
                  E("");
                }}
              >
                Continue to photo →
              </button>
            </>
          ) : null}
        </>
      )}
      {step === 2 && (
        <>
          <h1>Show what you see.</h1>
          <p>
            Add one photo of the public asset. Avoid faces, license plates and
            private homes. Stay on a safe public path.
          </p>
          <label>
            Category
            <select
              value={draft.category}
              onChange={(e) => update({ category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === "Other public infrastructure" ? "Other" : c}</option>
              ))}
            </select>
          </label>
          <p className="muted">
            Choose the closest match, or Other.
          </p>
          <NearbyCases lat={Number(draft.lat)} lng={Number(draft.lng)} category={draft.category} />
          <div className="upload">
            <span aria-hidden="true">＋</span>
            <label className="button">
              Take a photo
              <input
                className="file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f)
                    try {
                      await validatePhoto(f);
                      update({ file: f });
                      E("");
                    } catch (e) {
                      E((e as Error).message);
                    }
                }}
              />
            </label>
            <label className="secondary">
              Choose from library
              <input
                className="file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f)
                    try {
                      await validatePhoto(f);
                      update({ file: f });
                      E("");
                    } catch (e) {
                      E((e as Error).message);
                    }
                }}
              />
            </label>
            <small>JPEG, PNG or WebP · up to 10 MB · 200–12,000 px</small>
          </div>
          {preview && (
            <img
              className="photo-preview"
              src={preview}
              alt="Your private issue photo preview"
            />
          )}
          <button
            className="button wide report-next"
            disabled={!draft.file}
            onClick={() => {
              S(3);
              E("");
            }}
          >
            Continue →
          </button>
        </>
      )}
      {step === 3 && (
        <>
          <h1>Anything to add?</h1>
          <p>
            A short note helps reviewers understand the issue. Keep people’s
            names and private details out.
          </p>
          {(draft.category === "Stinging insects / nests" || draft.category === "Other non-emergency safety hazard") && (
            <div className="notice" role="status">Keep a safe distance. Do not touch, disturb, or try to remove a nest, and do not approach a hazard to take a photo. Report an insect nest only when it affects safe use of a public place; its presence alone does not establish a hazard. For immediate danger or a severe allergic reaction, call 911.</div>
          )}
          <label>
            Note <span className="muted">(optional)</span>
            <textarea
              value={draft.note}
              maxLength={500}
              rows={5}
              onChange={(e) => update({ note: e.target.value })}
            />
          </label>
          <small>{draft.note.length}/500 characters</small>
          {emergencyText(draft.note) && (
            <div className="notice error">
              This may be an emergency. Do not approach the hazard. Contact
              emergency services.
            </div>
          )}
          <button
            className="button wide report-next"
            onClick={() => {
              if (emergencyText(draft.note)) {
                H(true);
                S(1);
              } else S(4);
            }}
          >
            Review report →
          </button>
        </>
      )}
      {step === 4 && (
        <>
          <h1>A quick look.</h1>
          {preview && (
            <img
              className="photo-preview"
              src={preview}
              alt="Private report preview"
            />
          )}
          <h3>{draft.category}</h3>
          <p>{locationLabel}</p>
          <p className="muted">
            {Number(draft.lat).toFixed(6)}, {Number(draft.lng).toFixed(6)}
          </p>
          <p>{draft.note || "No additional note."}</p>
          <div className="notice">
            Your submission stays private pending geographic and photo review.
            Agency routing may be unavailable. Reviewers check for duplicates before publication.
          </div>
          <p>
            By submitting you agree to the <Link to="/terms">terms</Link> and{" "}
            <Link to="/privacy">privacy notice</Link>.
          </p>
          <button className="button wide report-next" disabled={busy} onClick={submit}>
            {busy ? "Saving privately…" : "Submit private report →"}
          </button>
        </>
      )}
      {step > 1 && (
        <button className="back" disabled={busy} onClick={() => S(step - 1)}>
          ← Back
        </button>
      )}
      <button className="back" onClick={() => navigate("/")}>
        Save draft and leave
      </button>
      <p className="muted report-draft-note">
        Draft saved on this device. {" "}
        <button
          className="inline-button"
          onClick={async () => {
            await del("common-draft");
            D(newDraft());
            S(session ? 1 : 0);
          }}
        >
          Discard draft
        </button>
      </p>
    </section>
  );
}
function AuthPage({ session }: { session: Session | null }) {
  const [email, E] = useState(""),
    [sent, S] = useState(false),
    [error, X] = useState(""),
    [busy, B] = useState(false),
    [code, C] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    if (!session) return;
    let live = true;
    (async () => {
      try {
        const claim = sessionStorage.getItem("common-claim");
        if (claim) {
          await api("claim", JSON.parse(claim));
          sessionStorage.removeItem("common-claim");
        }
        const draft = await get("common-draft");
        if (live)
          navigate(claim ? "/my-reports" : draft ? "/report" : "/my-reports", {
            replace: true,
          });
      } catch (e) {
        if (live) X((e as Error).message);
      }
    })();
    return () => {
      live = false;
    };
  }, [session]);
  return (
    <section className="page narrow">
      <div className="eyebrow">OPTIONAL ACCOUNT</div>
      <h1>
        Keep the history
        <br />
        close.
      </h1>
      <p>
        Sign in or create an account with a secure email code. Your pending
        report stays on this device.
      </p>
      <ErrorNotice error={error} />
      {session ? (
        <Link className="button" to="/my-reports">
          Continue to My reports
        </Link>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            B(true);
            X("");
            if (!sent) {
              const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                  emailRedirectTo: `${location.origin}${location.pathname}`,
                  shouldCreateUser: true,
                },
              });
              if (error) X(error.message);
              else S(true);
            } else {
              const { error } = await supabase.auth.verifyOtp({
                email,
                token: code,
                type: "email",
              });
              if (error) X(error.message);
            }
            B(false);
          }}
        >
          <label>
            Email address
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              disabled={sent}
              onChange={(e) => E(e.target.value)}
            />
          </label>
          {sent && (
            <>
              <div className="notice">
                Check your email for a sign-in link or code. Open the link in
                this browser to preserve your draft.
              </div>
              <label>
                Email code
                <input
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => C(e.target.value)}
                />
              </label>
            </>
          )}
          <button className="button wide" disabled={busy}>
            {busy
              ? "Please wait…"
              : sent
                ? "Verify code"
                : "Send sign-in email →"}
          </button>
          {sent && (
            <button className="back" type="button" onClick={() => S(false)}>
              Use a different email / resend
            </button>
          )}
        </form>
      )}
      <Link className="back" to="/report">
        ← Return to Quick Report
      </Link>
    </section>
  );
}
function MyReports({ session }: { session: Session | null }) {
  const [reports, R] = useState<Report[]>([]),
    [error, E] = useState(""),
    [query, Q] = useState(""),
    [filter, F] = useState("all"),
    [loading, B] = useState(true);
  useEffect(() => {
    if (!session) {
      B(false);
      return;
    }
    let live = true;
    api<Report[]>("my-reports")
      .then((r) => {
        if (live) R(r);
      })
      .catch((e) => E(e.message))
      .finally(() => B(false));
    return () => {
      live = false;
    };
  }, [session]);
  if (!session)
    return (
      <section className="page narrow">
        <h1>Your reports.</h1>
        <p>Sign in to see reports you submitted or securely claimed.</p>
        <Link className="button" to="/auth">
          Sign in →
        </Link>
      </section>
    );
  return (
    <section className="page">
      <div className="eyebrow">YOUR PRIVATE VIEW</div>
      <h1>My reports.</h1>
      <div className="filters">
        <label>
          Search your reports
          <input value={query} onChange={(e) => Q(e.target.value)} />
        </label>
        <label>
          Status
          <select value={filter} onChange={(e) => F(e.target.value)}>
            <option value="all">All</option>
            <option value="under_review">Under review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>
      <ErrorNotice error={error} />
      {loading ? (
        <p>Loading reports…</p>
      ) : reports.length === 0 ? (
        <div className="empty">
          <h3>No saved reports yet</h3>
          <Link to="/report">Start a Quick Report →</Link>
        </div>
      ) : (
        reports
          .filter(
            (r) =>
              (filter === "all" || filter === r.status) &&
              `${r.category} ${r.place_label}`
                .toLowerCase()
                .includes(query.toLowerCase()),
          )
          .map((r) => (
            <div className="issue-card" key={r.id}>
              <div>
                <h3>{r.category}</h3>
                <p>{r.place_label}</p>
                <small>{new Date(r.created_at).toLocaleString()}</small>
              </div>
              <div>
                <span className="badge">{r.status.replaceAll("_", " ")}</span>
                <p>Agency routing not confirmed</p>
                <Link to={`/my-reports/${r.id}`}>View private receipt →</Link>
              </div>
            </div>
          ))
      )}
    </section>
  );
}
function TrackPage({ owner = false }: { owner?: boolean }) {
  const { id, token } = useParams();
  const [report, R] = useState<Report | null>(null),
    [error, E] = useState(""),
    [loading, B] = useState(true);
  useEffect(() => {
    api<Report>(owner ? "owner-receipt" : "track", { id, token })
      .then(R)
      .catch((e) => E(e.message))
      .finally(() => B(false));
  }, [id, token, owner]);
  return (
    <section className="page narrow">
      <div className="eyebrow">PRIVATE REPORT STATUS</div>
      <h1>{report ? "Your observation." : "Receipt tracking."}</h1>
      <ErrorNotice error={error} />
      {loading ? (
        <p>Loading private receipt…</p>
      ) : (
        report && (
          <>
            <span className="badge">{report.status.replaceAll("_", " ")}</span>
            <h3>{report.category}</h3>
            <p>{report.place_label}</p>
            <p>Received {new Date(report.created_at).toLocaleString()}</p>
            <div className="notice">
              A submission receipt is not evidence of publication, agency
              delivery or independent verification.
            </div>
            {!owner && (
              <>
                <Link
                  className="button wide"
                  to="/auth"
                  onClick={() =>
                    sessionStorage.setItem(
                      "common-claim",
                      JSON.stringify({ id, token }),
                    )
                  }
                >
                  Save this report to an account →
                </Link>
                <p>Claiming the report revokes this guest link.</p>
              </>
            )}
            <Link className="secondary wide" to="/">
              Finish →
            </Link>
          </>
        )
      )}
    </section>
  );
}
function IssuePage() {
  const { publicId } = useParams();
  const [data, D] = useState<{
      issue: Issue;
      events: {
        id: string;
        created_at: string;
        public_summary: string;
        evidence_type: string;
      }[];
      photos: string[];
    } | null>(null),
    [error, E] = useState(""),
    [notice, N] = useState("");
  useEffect(() => {
    api<typeof data>("issue", { public_id: publicId })
      .then(D)
      .catch((e) => E(e.message));
  }, [publicId]);
  return (
    <section className="page narrow">
      <ErrorNotice error={error} />
      {data ? (
        <>
          <div className="eyebrow">THE PUBLIC RECORD</div>
          <h1>{data.issue.title}</h1>
          <p>{data.issue.public_location}</p>
          {data.photos.map((url, i) => (
            <img
              className="photo-preview"
              src={url}
              alt={`Reviewed issue evidence ${i + 1}`}
              key={url}
            />
          ))}
          <h2>
            {ageLabel(
              data.issue.first_reported_at,
              data.issue.maintenance_status === "verified_fixed"
                ? data.issue.verified_fixed_at
                : null,
            )}
          </h2>
          <p>
            Maintenance: {data.issue.maintenance_status.replaceAll("_", " ")} ·
            Agency:{" "}
            {data.issue.agency_status === "closed"
              ? "Agency closed — not yet verified"
              : data.issue.agency_status}{" "}
            · Verification: {data.issue.verification_status} · Delivery:{" "}
            {data.issue.routing_delivery_status}
          </p>
          {data.issue.reopened_at && (
            <p>
              Reopened {new Date(data.issue.reopened_at).toLocaleString()}.
              Original first report retained.
            </p>
          )}
          <h2>Case history</h2>
          <ol className="timeline">
            {data.events.map((e) => (
              <li key={e.id}>
                <time>{new Date(e.created_at).toLocaleString()}</time>
                <p>{e.public_summary}</p>
                <small>Evidence: {e.evidence_type}</small>
              </li>
            ))}
          </ol>
          <h2>Was this fixed?</h2>
          <p>
            One answer never instantly closes or reopens a case. Sign-in is
            required to submit evidence for review.
          </p>
          <div className="actions">
            {[true, false].map((answer) => (
              <button
                className="secondary"
                key={String(answer)}
                onClick={async () => {
                  try {
                    await api("community-check", {
                      public_id: publicId,
                      answer,
                    });
                    N(
                      "Your check is pending evidence review. The case status has not changed.",
                    );
                  } catch (e) {
                    E((e as Error).message);
                  }
                }}
              >
                {answer ? "Yes, fixed" : "No, still there"}
              </button>
            ))}
          </div>
          <p role="status">{notice}</p>
          <p className="notice">
            Stay safe. Do not enter roads or approach electrical hazards to
            collect evidence.
          </p>
        </>
      ) : (
        !error && <p>Loading published issue…</p>
      )}
    </section>
  );
}
const policies: Record<string, { title: string; paragraphs: string[] }> = {
  methodology: {
    title: "Evidence before conclusions.",
    paragraphs: [
      "Common records eligible problems with shared public infrastructure. Directory boundaries establish a municipality, not ownership or maintenance responsibility. Street proximity alone does not authorize publication.",
      "Submissions and originals stay private until geographic eligibility and media privacy review pass. Duplicates join a durable case without resetting its earliest accepted first-report date.",
      "Agency delivery, acknowledgment, closure and independent verification are separate events. A single community answer is evidence for review, not a resolution.",
      "Published case counts measure reports, not cleanliness. There are no letter grades or municipal rankings. Metrics need adequate geographic and observation coverage before conclusions are supported.",
      "Municipality boundaries: MassGIS, Massachusetts Municipalities with Generalized Coast, official hosted layer. Original CRS EPSG:26986; imported in EPSG:4326. Invalid source polygons are repaired only with recorded reasons and operations. Alias results appear only after a source-supported import.",
    ],
  },
  privacy: {
    title: "Private until reviewed.",
    paragraphs: [
      "Your original photo, precise issue pin, private note and receipt token are not public records in Common’s public API. Reviewed public records may use generalized location and separately approved media.",
      "Unsent drafts, including photos, are stored on your device using IndexedDB so sign-in does not lose your work. Use Discard draft on the report page to remove them. Shared devices may retain drafts until discarded.",
      "Guest receipt links are bearer credentials. Keep them private; claiming a report with an authenticated account revokes guest access. There is no third-party analytics or advertising in this application. Google Maps receives map requests and the displayed map location when the Quick Report map is loaded. OpenStreetMap receives tile requests on city issue maps.",
      "Private/rejected submissions are scheduled for retention review at 90 days. Automated deletion and a staffed privacy contact must be configured before public launch; expiration alone is not deletion. Do not submit sensitive personal data.",
    ],
  },
  terms: {
    title: "A constructive public record.",
    paragraphs: [
      "Common is for shared public assets, not allegations about neighbors or individual public employees. Submit only photos you have the right to provide, taken safely.",
      "Do not submit identifying allegations, private household imagery, abusive content or emergencies. Reviewers may hold or reject submissions that lack sufficient public responsibility evidence.",
      "Common is not an emergency service, an official municipal reporting system, or a guarantee of agency delivery. This is a prelaunch beta; service availability varies by jurisdiction.",
      "These draft operational terms require owner review before public launch.",
    ],
  },
  safety: {
    title: "Your safety comes first.",
    paragraphs: [
      "For immediate danger, fire, injury or downed power lines, move to safety and call 911 or the appropriate emergency utility. Common does not dispatch help.",
      "Never enter a road, trespass, approach live wires or confront anyone to document a problem. A photo is never worth taking a risk.",
      "Avoid faces, license plates and identifying private details. Photograph only the public condition from a safe place.",
    ],
  },
  accessibility: {
    title: "A public record for everyone.",
    paragraphs: [
      "Common targets WCAG 2.2 AA. Location search supports keyboard navigation; issue coordinates can be edited without dragging the map, and photo selection supports camera or library.",
      "Geolocation is optional. Quick Report requests device location after you choose No immediate emergency, or when you choose Use my location. Manual address search and coordinate entry remain available.",
      "Automated checks do not replace testing with assistive technology. iOS VoiceOver, Android TalkBack and full WCAG 2.2 AA review remain required before launch.",
    ],
  },
};
function PolicyPage({ kind }: { kind: string }) {
  const p = policies[kind];
  return (
    <section className="page narrow prose">
      <div className="eyebrow">COMMON / {kind.toUpperCase()}</div>
      <h1>{p.title}</h1>
      {p.paragraphs.map((t) => (
        <p key={t}>{t}</p>
      ))}
      {kind === "methodology" && (
        <p>
          <a href="https://www.mass.gov/info-details/massgis-data-municipalities">
            MassGIS municipal boundary metadata ↗
          </a>
        </p>
      )}
    </section>
  );
}
export default function App() {
  const [session, S] = useState<Session | null>(null),
    [authReady, A] = useState(false),
    [authError, E] = useState("");
  const route = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    let live = true;
    const init = async () => {
      const code = new URLSearchParams(location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) E(error.message);
        history.replaceState(null, "", location.pathname);
        navigate("/auth", { replace: true });
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (live) {
        S(session);
        A(true);
      }
    };
    init();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => S(s));
    return () => {
      live = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    const privateRoute = /^\/(track|my-reports|report|auth|admin)/.test(
      route.pathname,
    );
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      privateRoute ? "noindex,nofollow,noarchive" : "index,follow",
    );
    document.title = "common — Public spaces. Public record.";
  }, [route.pathname]);
  return (
    <div className={route.pathname === "/report" ? "report-shell" : undefined}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="shared-header">
        <div className="header-left"><Link className="wordmark" to="/" aria-label="Common home"><img src={import.meta.env.BASE_URL + "brand/common-mark.png"} alt=""/>common.</Link></div>
        <Link className="button small header-quick-report" to="/report"><span className="quick-report-plus" aria-hidden="true">+</span>Quick Report</Link>
        <nav aria-label="Main navigation">
          <Link to="/?section=how">How it works</Link>
          <Link to="/?section=issues">Public reports</Link>
          <Link to="/my-reports">My Reports</Link>
          <Search compact />
          {session ? <button className="inline-button" onClick={()=>supabase.auth.signOut()}>Log out</button> : <Link to="/auth">Log in</Link>}
        </nav>
      </header>
      <main id="main">
        <ErrorNotice error={authError} />
        {authReady ? (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/places/:slug" element={<PlacePage />} />
            <Route path="/report" element={<ReportPage session={session} />} />
            <Route path="/auth" element={session ? <Navigate to="/my-reports" replace /> : <AccountEntry />} />
            <Route path="/auth/member" element={<AuthPage session={session} />} />
            <Route
              path="/auth/callback"
              element={<AuthPage session={session} />}
            />
            <Route
              path="/my-reports"
              element={session ? <MyReports session={session} /> : <Navigate to="/auth" replace />}
            />
            <Route path="/my-reports/:id" element={<TrackPage owner />} />
            <Route path="/track/:id/:token" element={<TrackPage />} />
            <Route path="/issues/:publicId" element={<IssuePage />} />
            {Object.keys(policies).map((k) => (
              <Route key={k} path={`/${k}`} element={<PolicyPage kind={k} />} />
            ))}
            <Route
              path="/admin/*"
              element={
                <section className="page narrow">
                  <h1>Review operations.</h1>
                  <p>
                    Restricted operations are not enabled in this release.
                    Private intake cannot be published through the client.
                  </p>
                </section>
              }
            />
            <Route
              path="*"
              element={
                <section className="page">
                  <h1>Page not found.</h1>
                  <Link to="/">Return home →</Link>
                </section>
              }
            />
          </Routes>
        ) : (
          <section className="page" role="status">
            Loading Common…
          </section>
        )}
      </main>
      {route.pathname !== "/" && route.pathname !== "/report" && (
      <footer>
        <div className="footer-top">
          <Link className="wordmark" to="/">
            <img src={`${import.meta.env.BASE_URL}brand/common-mark.png`} alt="" />common.
          </Link>
          <p>
            Public spaces.
            <br />
            Public record.
          </p>
          <Link className="textlink" to="/report">
            Notice something? ↗
          </Link>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Common · openbeta.net</span>
          <div>
            <Link to="/?section=towns">For your town</Link>
            {["methodology", "privacy", "terms", "accessibility", "safety"].map(
              (k) => (
                <Link key={k} to={`/${k}`}>
                  {k[0].toUpperCase() + k.slice(1)}
                </Link>
              ),
            )}
          </div>
        </div>
        <small>
          Not an emergency service. Coverage and agency routing vary by
          jurisdiction.
        </small>
      </footer>
      )}
      {route.pathname !== "/" && !route.pathname.startsWith("/report") && !route.pathname.startsWith("/auth") && (
        <Link className="mobile-report button" to="/report">
          Quick Report ↗
        </Link>
      )}
    </div>
  );
}
