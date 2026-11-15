# ourcommon.co DNS — prepared, not applied

GitHub owner: **jrschwab15-netizen**. Repository: **common**. GitHub Pages is configured for Actions and custom domain **ourcommon.co** before any DNS change. `public/CNAME` builds into `dist/CNAME`.

Public DNS inspection on November 15, 2026 found apex A records `3.33.130.190` and `15.197.148.33`, and `www` CNAME → `ourcommon.co` (parking configuration). This is **not** a full GoDaddy zone inventory or proof of account ownership. No DNS changes have been made.

After owner production approval, a successful Pages deployment, domain ownership verification where available, and inspection of the actual zone:

| Name | Type | Desired value | Operation |
| --- | --- | --- | --- |
| @ | A | 185.199.108.153 | Add after approval of parking-record replacement |
| @ | A | 185.199.109.153 | Add |
| @ | A | 185.199.110.153 | Add |
| @ | A | 185.199.111.153 | Add |
| www | CNAME | jrschwab15-netizen.github.io | Replace current www target after approval |

Review conflicting apex A/AAAA/ALIAS records before removal. Preserve MX, TXT, SPF, DKIM, DMARC, mail-host and unrelated subdomain records exactly. No wildcard records. Do not point DNS to a missing Pages deployment.

Official current reference: [GitHub Pages custom domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). IPs were checked against this page, not assumed from the brief.

After propagation, enable Enforce HTTPS when GitHub offers it. Verify apex and www certificates, www→apex redirect, static assets, hash-route reload, real email callback, geolocation and real guest upload/claim. Until these are observed, the domain is **not deployed**.
