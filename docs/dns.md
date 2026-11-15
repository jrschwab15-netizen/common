# ourcommon.co DNS — applied November 15, 2026

Owner approved deployment. The GoDaddy zone was inspected through the authenticated browser before changes. Original records: parked apex A, www CNAME to apex, two GoDaddy NS, SOA, _domainconnect CNAME and _dmarc TXT. No MX or other mail records were present.

GitHub Pages custom domain was configured before DNS changed. [Production deployment succeeded](https://github.com/jrschwab15-netizen/common/actions/runs/43741293703).

| Name | Type | Applied value |
| --- | --- | --- |
| @ | A | 185.199.108.153 |
| @ | A | 185.199.109.153 |
| @ | A | 185.199.110.153 |
| @ | A | 185.199.111.153 |
| www | CNAME | jrschwab15-netizen.github.io |

NS, SOA, _domainconnect and _dmarc were preserved. No wildcard records or nameserver changes were introduced. Authoritative ns49.domaincontrol.com and public Cloudflare DNS returned the new values. Old local parking caches expired during verification.

GitHub approved the apex/www certificate (expires 2027-02-13) and Enforce HTTPS is enabled. All four HTTP/HTTPS apex/www entry points were fetched with normal certificate verification and ended at https://ourcommon.co/ with HTTP 200 and the Common build. Six desktop/mobile browser tests passed against the live HTTPS origin.

The production Auth callback/email configuration is still pending; see deployment-2026-11-15.md. Hosting success does not imply later-phase moderation/GIS/routing capabilities are complete.

[Official GitHub Pages domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
