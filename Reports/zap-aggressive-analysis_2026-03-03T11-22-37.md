# OWASP ZAP Aggressive Security Analysis

**Target:** http://localhost:8080
**Generated:** 3/3/2026, 11:22:37

## AI Security Analysis

# OWASP ZAP Findings Analysis

## 1. Critical Risks

**No critical (high severity) risks were identified in the ZAP scan results.**

---

## 2. Remediation Priorities

Since no vulnerabilities were detected, there are no remediation actions required based on this scan.

---

## 3. Quick Wins

- **Maintain Current Security Posture:** Continue regular security scans to ensure new vulnerabilities are detected early.
- **Review Scan Coverage:** Confirm that ZAP scanned all relevant endpoints, authenticated areas, and dynamic content.
- **Update Dependencies:** Ensure all software components and libraries are up-to-date to prevent future vulnerabilities.
- **Enable Logging & Monitoring:** Maintain robust logging and monitoring to detect suspicious activity not covered by automated scans.
- **Periodic Penetration Testing:** Complement automated scans with manual penetration testing for deeper coverage.

---

**Summary:**  
No vulnerabilities were found in the ZAP scan. Maintain current security practices, review scan coverage, and continue proactive security management.

## Raw ZAP Results

```json
{
  "@programName": "ZAP",
  "@version": "2.17.0",
  "@generated": "Wed, 25 Feb 2026 11:09:49",
  "created": "2026-02-25T11:09:49.007472780Z",
  "insights": [
    {
      "level": "Medium",
      "reason": "Exceeded High",
      "site": "",
      "key": "insight.network.failure",
      "description": "Percentage of network failures",
      "statistic": "63"
    },
    {
      "level": "Low",
      "reason": "Warning",
      "site": "",
      "key": "insight.log.warn",
      "description": "ZAP warnings logged - see the zap.log file for details",
      "statistic": "752"
    },
    {
      "level": "Info",
      "reason": "Informational",
      "site": "http://host.docker.internal:8080",
      "key": "insight.code.2xx",
      "description": "Percentage of responses with status code 2xx",
      "statistic": "84"
    },
    {
      "level": "Info",
      "reason": "Informational",
      "site": "http://host.docker.internal:8080",
      "key": "insight.code.4xx",
      "description": "Percentage of responses with status code 4xx",
      "statistic": "15"
    },
    {
      "level": "Info",
      "reason": "Informational",
      "site": "http://host.docker.internal:8080",
      "key": "insight.endpoint.ctype.application/javascript",
      "description": "Percentage of endpoints with content type application/javascript",
      "statistic": "13"
    },
    {
      "level": "Info",
      "reason": "Informational",
      "site": "http://host.docker.internal:8080",
      "key": "insight.endpoint.ctype.application/octet-stream",
      "description": "Percentage of endpoints with content type application/octet-stream",
      "statistic": "3"
    },
    {
      "level": "Info",
      "reason": "Informational",
      "site": "http://host.docker.internal:8080",
      "key": "insight.endpoint.ctype.image/x-icon",
      "description": "Percentage of endpoints with content type image/x-icon",
      "statistic": "3"
    },
    {
      "level": "Info",
      "reason": "Informational",
      "site": "http://host.docker.internal:8080",
      "key": "insight.endpoint.ctype.text/css",
      "description": "Percentage of endpoints with content type text/css",
      "statistic": "3"
    },
    {
      "level": "Info",
      "reason": "Informational",
      "site": "http://host.docker.internal:8080",
      "key": "insight.endpoint.ctype.text/html",
      "description": "Percentage of endpoints with content type text/html",
      "statistic": "62"
    },
    {
      "level": "Info",
      "reason": "Informational",
      "site": "http://host.docker.internal:8080",
      "key": "insight.endpoint.ctype.text/markdown",
      "description": "Percentage of endpoints with content type text/markdown",
      "statistic": "10"
    },
    {
      "level": "Info",
      "reason": "Informational",
      "site": "http://host.docker.internal:8080",
      "key": "insight.endpoint.ctype.text/plain",
      "description": "Percentage of endpoints with content type text/plain",
      "statistic": "3"
    },
    {
      "level": "Info",
      "reason": "Informational",
      "site": "http://host.docker.internal:8080",
      "key": "insight.endpoint.method.GET",
      "description": "Percentage of endpoints with method GET",
      "statistic": "100"
    },
    {
      "level": "Info",
      "reason": "Informational",
      "site": "http://host.docker.internal:8080",
      "key": "insight.endpoint.total",
      "description": "Count of total endpoints",
      "statistic": "29"
    },
    {
      "level": "Info",
      "reason": "Informational",
      "site": "http://host.docker.internal:8080",
      "key": "insight.response.slow",
      "description": "Percentage of slow responses",
      "statistic": "95"
    },
    {
      "level": "Info",
      "reason": "Informational",
      "site": "https://host.docker.internal:8080",
      "key": "insight.endpoint.method.GET",
      "description": "Percentage of endpoints with method GET",
      "statistic": "100"
    },
    {
      "level": "Info",
      "reason": "Informational",
      "site": "https://host.docker.internal:8080",
      "key": "insight.endpoint.total",
      "description": "Count of total endpoints",
      "statistic": "1"
    }
  ],
  "site": [
    {
      "@name": "https://host.docker.internal:8080",
      "@host": "host.docker.internal",
      "@port": "8080",
      "@ssl": "true",
      "alerts": []
    },
    {
      "@name": "http://host.docker.internal:8080",
      "@host": "host.docker.internal",
      "@port": "8080",
      "@ssl": "false",
      "alerts": [
        {
          "pluginid": "10038",
          "alertRef": "10038-1",
          "alert": "Content Security Policy (CSP) Header Not Set",
          "name": "Content Security Policy (CSP) Header Not Set",
          "riskcode": "2",
          "confidence": "3",
          "riskdesc": "Medium (High)",
          "desc": "<p>Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks, including Cross Site Scripting (XSS) and data injection attacks. These attacks are used for everything from data theft to site defacement or distribution of malware. CSP provides a set of standard HTTP headers that allow website owners to declare approved sources of content that browsers should be allowed to load on that page — covered types are JavaScript, CSS, HTML frames, fonts, images and embeddable objects such as Java applets, ActiveX, audio and video files.</p>",
          "instances": [
            {
              "id": "0",
              "uri": "http://host.docker.internal:8080",
              "nodeName": "http://host.docker.internal:8080",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "",
              "otherinfo": ""
            },
            {
              "id": "53",
              "uri": "http://host.docker.internal:8080/",
              "nodeName": "http://host.docker.internal:8080/",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "",
              "otherinfo": ""
            },
            {
              "id": "51",
              "uri": "http://host.docker.internal:8080/ftp",
              "nodeName": "http://host.docker.internal:8080/ftp",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "",
              "otherinfo": ""
            },
            {
              "id": "61",
              "uri": "http://host.docker.internal:8080/ftp/coupons_2013.md.bak",
              "nodeName": "http://host.docker.internal:8080/ftp/coupons_2013.md.bak",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "",
              "otherinfo": ""
            },
            {
              "id": "9",
              "uri": "http://host.docker.internal:8080/sitemap.xml",
              "nodeName": "http://host.docker.internal:8080/sitemap.xml",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "",
              "otherinfo": ""
            }
          ],
          "count": "5",
          "systemic": true,
          "solution": "<p>Ensure that your web server, application server, load balancer, etc. is configured to set the Content-Security-Policy header.</p>",
          "otherinfo": "",
          "reference": "<p>https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP</p><p>https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html</p><p>https://www.w3.org/TR/CSP/</p><p>https://w3c.github.io/webappsec-csp/</p><p>https://web.dev/articles/csp</p><p>https://caniuse.com/#feat=contentsecuritypolicy</p><p>https://content-security-policy.com/</p>",
          "cweid": "693",
          "wascid": "15",
          "sourceid": "1"
        },
        {
          "pluginid": "10098",
          "alertRef": "10098",
          "alert": "Cross-Domain Misconfiguration",
          "name": "Cross-Domain Misconfiguration",
          "riskcode": "2",
          "confidence": "2",
          "riskdesc": "Medium (Medium)",
          "desc": "<p>Web browser data loading may be possible, due to a Cross Origin Resource Sharing (CORS) misconfiguration on the web server.</p>",
          "instances": [
            {
              "id": "1",
              "uri": "http://host.docker.internal:8080",
              "nodeName": "http://host.docker.internal:8080",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "Access-Control-Allow-Origin: *",
              "otherinfo": "The CORS misconfiguration on the web server permits cross-domain read requests from arbitrary third party domains, using unauthenticated APIs on this domain. Web browser implementations do not permit arbitrary third parties to read the response from authenticated APIs, however. This reduces the risk somewhat. This misconfiguration could be used by an attacker to access data that is available in an unauthenticated manner, but which uses some other form of security, such as IP address white-listing."
            },
            {
              "id": "17",
              "uri": "http://host.docker.internal:8080/assets/public/favicon_js.ico",
              "nodeName": "http://host.docker.internal:8080/assets/public/favicon_js.ico",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "Access-Control-Allow-Origin: *",
              "otherinfo": "The CORS misconfiguration on the web server permits cross-domain read requests from arbitrary third party domains, using unauthenticated APIs on this domain. Web browser implementations do not permit arbitrary third parties to read the response from authenticated APIs, however. This reduces the risk somewhat. This misconfiguration could be used by an attacker to access data that is available in an unauthenticated manner, but which uses some other form of security, such as IP address white-listing."
            },
            {
              "id": "8",
              "uri": "http://host.docker.internal:8080/robots.txt",
              "nodeName": "http://host.docker.internal:8080/robots.txt",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "Access-Control-Allow-Origin: *",
              "otherinfo": "The CORS misconfiguration on the web server permits cross-domain read requests from arbitrary third party domains, using unauthenticated APIs on this domain. Web browser implementations do not permit arbitrary third parties to read the response from authenticated APIs, however. This reduces the risk somewhat. This misconfiguration could be used by an attacker to access data that is available in an unauthenticated manner, but which uses some other form of security, such as IP address white-listing."
            },
            {
              "id": "26",
              "uri": "http://host.docker.internal:8080/runtime.js",
              "nodeName": "http://host.docker.internal:8080/runtime.js",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "Access-Control-Allow-Origin: *",
              "otherinfo": "The CORS misconfiguration on the web server permits cross-domain read requests from arbitrary third party domains, using unauthenticated APIs on this domain. Web browser implementations do not permit arbitrary third parties to read the response from authenticated APIs, however. This reduces the risk somewhat. This misconfiguration could be used by an attacker to access data that is available in an unauthenticated manner, but which uses some other form of security, such as IP address white-listing."
            },
            {
              "id": "10",
              "uri": "http://host.docker.internal:8080/sitemap.xml",
              "nodeName": "http://host.docker.internal:8080/sitemap.xml",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "Access-Control-Allow-Origin: *",
              "otherinfo": "The CORS misconfiguration on the web server permits cross-domain read requests from arbitrary third party domains, using unauthenticated APIs on this domain. Web browser implementations do not permit arbitrary third parties to read the response from authenticated APIs, however. This reduces the risk somewhat. This misconfiguration could be used by an attacker to access data that is available in an unauthenticated manner, but which uses some other form of security, such as IP address white-listing."
            }
          ],
          "count": "5",
          "systemic": true,
          "solution": "<p>Ensure that sensitive data is not available in an unauthenticated manner (using IP address white-listing, for instance).</p><p>Configure the \"Access-Control-Allow-Origin\" HTTP header to a more restrictive set of domains, or remove all CORS headers entirely, to allow the web browser to enforce the Same Origin Policy (SOP) in a more restrictive manner.</p>",
          "otherinfo": "<p>The CORS misconfiguration on the web server permits cross-domain read requests from arbitrary third party domains, using unauthenticated APIs on this domain. Web browser implementations do not permit arbitrary third parties to read the response from authenticated APIs, however. This reduces the risk somewhat. This misconfiguration could be used by an attacker to access data that is available in an unauthenticated manner, but which uses some other form of security, such as IP address white-listing.</p>",
          "reference": "<p>https://vulncat.fortify.com/en/detail?category=HTML5&subcategory=Overly%20Permissive%20CORS%20Policy</p>",
          "cweid": "264",
          "wascid": "14",
          "sourceid": "1"
        },
        {
          "pluginid": "10106",
          "alertRef": "10106",
          "alert": "HTTP Only Site",
          "name": "HTTP Only Site",
          "riskcode": "2",
          "confidence": "2",
          "riskdesc": "Medium (Medium)",
          "desc": "<p>The site is only served under HTTP and not HTTPS.</p>",
          "instances": [
            {
              "id": "143",
              "uri": "http://host.docker.internal:8080/",
              "nodeName": "https://host.docker.internal:8080/",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "",
              "otherinfo": "Failed to connect.\nZAP attempted to connect via: https://host.docker.internal:8080/"
            }
          ],
          "count": "1",
          "systemic": false,
          "solution": "<p>Configure your web or application server to use SSL (https).</p>",
          "otherinfo": "<p>Failed to connect.</p><p>ZAP attempted to connect via: https://host.docker.internal:8080/</p>",
          "reference": "<p>https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html</p><p>https://letsencrypt.org/</p>",
          "cweid": "311",
          "wascid": "4",
          "sourceid": "138"
        },
        {
          "pluginid": "10017",
          "alertRef": "10017",
          "alert": "Cross-Domain JavaScript Source File Inclusion",
          "name": "Cross-Domain JavaScript Source File Inclusion",
          "riskcode": "1",
          "confidence": "2",
          "riskdesc": "Low (Medium)",
          "desc": "<p>The page includes one or more script files from a third-party domain.</p>",
          "instances": [
            {
              "id": "2",
              "uri": "http://host.docker.internal:8080",
              "nodeName": "http://host.docker.internal:8080",
              "method": "GET",
              "param": "//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js",
              "attack": "",
              "evidence": "<script src=\"//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js\"></script>",
              "otherinfo": ""
            },
            {
              "id": "3",
              "uri": "http://host.docker.internal:8080",
              "nodeName": "http://host.docker.internal:8080",
              "method": "GET",
              "param": "//cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js",
              "attack": "",
              "evidence": "<script src=\"//cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js\"></script>",
              "otherinfo": ""
            },
            {
              "id": "55",
              "uri": "http://host.docker.internal:8080/",
              "nodeName": "http://host.docker.internal:8080/",
              "method": "GET",
              "param": "//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js",
              "attack": "",
              "evidence": "<script src=\"//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js\"></script>",
              "otherinfo": ""
            },
            {
              "id": "11",
              "uri": "http://host.docker.internal:8080/sitemap.xml",
              "nodeName": "http://host.docker.internal:8080/sitemap.xml",
              "method": "GET",
              "param": "//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js",
              "attack": "",
              "evidence": "<script src=\"//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js\"></script>",
              "otherinfo": ""
            },
            {
              "id": "12",
              "uri": "http://host.docker.internal:8080/sitemap.xml",
              "nodeName": "http://host.docker.internal:8080/sitemap.xml",
              "method": "GET",
              "param": "//cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js",
              "attack": "",
              "evidence": "<script src=\"//cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js\"></script>",
              "otherinfo": ""
            }
          ],
          "count": "5",
          "systemic": true,
          "solution": "<p>Ensure JavaScript source files are loaded from only trusted sources, and the sources can't be controlled by end users of the application.</p>",
          "otherinfo": "",
          "reference": "",
          "cweid": "829",
          "wascid": "15",
          "sourceid": "1"
        },
        {
          "pluginid": "10096",
          "alertRef": "10096",
          "alert": "Timestamp Disclosure - Unix",
          "name": "Timestamp Disclosure - Unix",
          "riskcode": "1",
          "confidence": "1",
          "riskdesc": "Low (Low)",
          "desc": "<p>A timestamp was disclosed by the application/web server. - Unix</p>",
          "instances": [
            {
              "id": "5",
              "uri": "http://host.docker.internal:8080",
              "nodeName": "http://host.docker.internal:8080",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "1650485437",
              "otherinfo": "1650485437, which evaluates to: 2022-04-20 20:10:37."
            },
            {
              "id": "7",
              "uri": "http://host.docker.internal:8080",
              "nodeName": "http://host.docker.internal:8080",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "1981395349",
              "otherinfo": "1981395349, which evaluates to: 2032-10-14 19:35:49."
            },
            {
              "id": "6",
              "uri": "http://host.docker.internal:8080",
              "nodeName": "http://host.docker.internal:8080",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "2038834951",
              "otherinfo": "2038834951, which evaluates to: 2034-08-10 15:02:31."
            },
            {
              "id": "14",
              "uri": "http://host.docker.internal:8080/sitemap.xml",
              "nodeName": "http://host.docker.internal:8080/sitemap.xml",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "1650485437",
              "otherinfo": "1650485437, which evaluates to: 2022-04-20 20:10:37."
            },
            {
              "id": "15",
              "uri": "http://host.docker.internal:8080/sitemap.xml",
              "nodeName": "http://host.docker.internal:8080/sitemap.xml",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "2038834951",
              "otherinfo": "2038834951, which evaluates to: 2034-08-10 15:02:31."
            }
          ],
          "count": "5",
          "systemic": true,
          "solution": "<p>Manually confirm that the timestamp data is not sensitive, and that the data cannot be aggregated to disclose exploitable patterns.</p>",
          "otherinfo": "<p>1650485437, which evaluates to: 2022-04-20 20:10:37.</p>",
          "reference": "<p>https://cwe.mitre.org/data/definitions/200.html</p>",
          "cweid": "497",
          "wascid": "13",
          "sourceid": "1"
        },
        {
          "pluginid": "10027",
          "alertRef": "10027",
          "alert": "Information Disclosure - Suspicious Comments",
          "name": "Information Disclosure - Suspicious Comments",
          "riskcode": "0",
          "confidence": "1",
          "riskdesc": "Informational (Low)",
          "desc": "<p>The response appears to contain suspicious comments which may help an attacker.</p>",
          "instances": [
            {
              "id": "29",
              "uri": "http://host.docker.internal:8080/main.js",
              "nodeName": "http://host.docker.internal:8080/main.js",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "query",
              "otherinfo": "The following pattern was used: \\bQUERY\\b and was detected in likely comment: \"//owasp.org' target='_blank'>Open Worldwide Application Security Project (OWASP)</a> and is developed and maintained by voluntee\", see evidence field for the suspicious comment/snippet."
            },
            {
              "id": "50",
              "uri": "http://host.docker.internal:8080/vendor.js",
              "nodeName": "http://host.docker.internal:8080/vendor.js",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "Query",
              "otherinfo": "The following pattern was used: \\bQUERY\\b and was detected in likely comment: \"//www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M0 256C0 397.4 114.6 512 256 512s256-114.6 256-256S397.4 0 256 0S0 114.6 0\", see evidence field for the suspicious comment/snippet."
            }
          ],
          "count": "2",
          "systemic": false,
          "solution": "<p>Remove all comments that return information that may help an attacker and fix any underlying problems they refer to.</p>",
          "otherinfo": "<p>The following pattern was used: \\bQUERY\\b and was detected in likely comment: \"//owasp.org' target='_blank'>Open Worldwide Application Security Project (OWASP)</a> and is developed and maintained by voluntee\", see evidence field for the suspicious comment/snippet.</p>",
          "reference": "",
          "cweid": "615",
          "wascid": "13",
          "sourceid": "21"
        },
        {
          "pluginid": "10109",
          "alertRef": "10109",
          "alert": "Modern Web Application",
          "name": "Modern Web Application",
          "riskcode": "0",
          "confidence": "2",
          "riskdesc": "Informational (Medium)",
          "desc": "<p>The application appears to be a modern web application. If you need to explore it automatically then the Ajax Spider may well be more effective than the standard one.</p>",
          "instances": [
            {
              "id": "4",
              "uri": "http://host.docker.internal:8080",
              "nodeName": "http://host.docker.internal:8080",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "<script src=\"//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js\"></script>",
              "otherinfo": "No links have been found while there are scripts, which is an indication that this is a modern web application."
            },
            {
              "id": "57",
              "uri": "http://host.docker.internal:8080/",
              "nodeName": "http://host.docker.internal:8080/",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "<script src=\"//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js\"></script>",
              "otherinfo": "No links have been found while there are scripts, which is an indication that this is a modern web application."
            },
            {
              "id": "74",
              "uri": "http://host.docker.internal:8080/juice-shop/node_modules/express/lib/router/index.js:365:14",
              "nodeName": "http://host.docker.internal:8080/juice-shop/node_modules/express/lib/router/index.js:365:14",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "<script src=\"//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js\"></script>",
              "otherinfo": "No links have been found while there are scripts, which is an indication that this is a modern web application."
            },
            {
              "id": "93",
              "uri": "http://host.docker.internal:8080/juice-shop/node_modules/express/lib/router/layer.js:95:5",
              "nodeName": "http://host.docker.internal:8080/juice-shop/node_modules/express/lib/router/layer.js:95:5",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "<script src=\"//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js\"></script>",
              "otherinfo": "No links have been found while there are scripts, which is an indication that this is a modern web application."
            },
            {
              "id": "13",
              "uri": "http://host.docker.internal:8080/sitemap.xml",
              "nodeName": "http://host.docker.internal:8080/sitemap.xml",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": "<script src=\"//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js\"></script>",
              "otherinfo": "No links have been found while there are scripts, which is an indication that this is a modern web application."
            }
          ],
          "count": "5",
          "systemic": true,
          "solution": "<p>This is an informational alert and so no changes are required.</p>",
          "otherinfo": "<p>No links have been found while there are scripts, which is an indication that this is a modern web application.</p>",
          "reference": "",
          "cweid": "-1",
          "wascid": "-1",
          "sourceid": "1"
        }
      ]
    }
  ],
  "sequences": []
}
```