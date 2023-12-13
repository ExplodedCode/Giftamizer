# Node Dependency Audit

> `12-12-2023`

```json
{
  "auditReportVersion": 2,
  "vulnerabilities": {
    "@adobe/css-tools": {
      "name": "@adobe/css-tools",
      "severity": "moderate",
      "isDirect": false,
      "via": [
        {
          "source": 1094900,
          "name": "@adobe/css-tools",
          "dependency": "@adobe/css-tools",
          "title": "@adobe/css-tools Regular Expression Denial of Service (ReDOS) while Parsing CSS",
          "url": "https://github.com/advisories/GHSA-hpx4-r86g-5jrg",
          "severity": "moderate",
          "cwe": [
            "CWE-20",
            "CWE-1333"
          ],
          "cvss": {
            "score": 5,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:N/I:N/A:L"
          },
          "range": "<4.3.1"
        },
        {
          "source": 1095152,
          "name": "@adobe/css-tools",
          "dependency": "@adobe/css-tools",
          "title": "@adobe/css-tools Improper Input Validation and Inefficient Regular Expression Complexity",
          "url": "https://github.com/advisories/GHSA-prr3-c3m5-p7q2",
          "severity": "moderate",
          "cwe": [
            "CWE-20",
            "CWE-1333"
          ],
          "cvss": {
            "score": 5,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:N/I:N/A:L"
          },
          "range": "<4.3.2"
        }
      ],
      "effects": [],
      "range": "<=4.3.1",
      "nodes": [
        "node_modules/@adobe/css-tools"
      ],
      "fixAvailable": true
    },
    "@babel/traverse": {
      "name": "@babel/traverse",
      "severity": "critical",
      "isDirect": false,
      "via": [
        {
          "source": 1095212,
          "name": "@babel/traverse",
          "dependency": "@babel/traverse",
          "title": "Babel vulnerable to arbitrary code execution when compiling specifically crafted malicious code",
          "url": "https://github.com/advisories/GHSA-67hx-6x53-jw92",
          "severity": "critical",
          "cwe": [
            "CWE-184",
            "CWE-697"
          ],
          "cvss": {
            "score": 9.3,
            "vectorString": "CVSS:3.1/AV:L/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H"
          },
          "range": "<7.23.2"
        }
      ],
      "effects": [],
      "range": "<7.23.2",
      "nodes": [
        "node_modules/@babel/traverse"
      ],
      "fixAvailable": true
    },
    "@svgr/plugin-svgo": {
      "name": "@svgr/plugin-svgo",
      "severity": "high",
      "isDirect": false,
      "via": [
        "svgo"
      ],
      "effects": [
        "@svgr/webpack"
      ],
      "range": "<=5.5.0",
      "nodes": [
        "node_modules/@svgr/plugin-svgo"
      ],
      "fixAvailable": {
        "name": "react-scripts",
        "version": "3.0.1",
        "isSemVerMajor": true
      }
    },
    "@svgr/webpack": {
      "name": "@svgr/webpack",
      "severity": "high",
      "isDirect": false,
      "via": [
        "@svgr/plugin-svgo"
      ],
      "effects": [
        "react-scripts"
      ],
      "range": "4.0.0 - 5.5.0",
      "nodes": [
        "node_modules/@svgr/webpack"
      ],
      "fixAvailable": {
        "name": "react-scripts",
        "version": "3.0.1",
        "isSemVerMajor": true
      }
    },
    "css-select": {
      "name": "css-select",
      "severity": "high",
      "isDirect": false,
      "via": [
        "nth-check"
      ],
      "effects": [
        "svgo"
      ],
      "range": "<=3.1.0",
      "nodes": [
        "node_modules/svgo/node_modules/css-select"
      ],
      "fixAvailable": {
        "name": "react-scripts",
        "version": "3.0.1",
        "isSemVerMajor": true
      }
    },
    "json5": {
      "name": "json5",
      "severity": "high",
      "isDirect": false,
      "via": [
        {
          "source": 1094986,
          "name": "json5",
          "dependency": "json5",
          "title": "Prototype Pollution in JSON5 via Parse Method",
          "url": "https://github.com/advisories/GHSA-9c47-m6qq-7p4h",
          "severity": "high",
          "cwe": [
            "CWE-1321"
          ],
          "cvss": {
            "score": 7.1,
            "vectorString": "CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:H/I:L/A:H"
          },
          "range": "<1.0.2"
        }
      ],
      "effects": [],
      "range": "<1.0.2",
      "nodes": [
        "node_modules/tsconfig-paths/node_modules/json5"
      ],
      "fixAvailable": true
    },
    "nth-check": {
      "name": "nth-check",
      "severity": "high",
      "isDirect": false,
      "via": [
        {
          "source": 1095141,
          "name": "nth-check",
          "dependency": "nth-check",
          "title": "Inefficient Regular Expression Complexity in nth-check",
          "url": "https://github.com/advisories/GHSA-rp65-9cf3-cjxr",
          "severity": "high",
          "cwe": [
            "CWE-1333"
          ],
          "cvss": {
            "score": 7.5,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H"
          },
          "range": "<2.0.1"
        }
      ],
      "effects": [
        "css-select"
      ],
      "range": "<2.0.1",
      "nodes": [
        "node_modules/svgo/node_modules/nth-check"
      ],
      "fixAvailable": {
        "name": "react-scripts",
        "version": "3.0.1",
        "isSemVerMajor": true
      }
    },
    "postcss": {
      "name": "postcss",
      "severity": "moderate",
      "isDirect": false,
      "via": [
        {
          "source": 1094544,
          "name": "postcss",
          "dependency": "postcss",
          "title": "PostCSS line return parsing error",
          "url": "https://github.com/advisories/GHSA-7fh5-64p2-3v2j",
          "severity": "moderate",
          "cwe": [
            "CWE-74",
            "CWE-144"
          ],
          "cvss": {
            "score": 5.3,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N"
          },
          "range": "<8.4.31"
        }
      ],
      "effects": [
        "resolve-url-loader"
      ],
      "range": "<8.4.31",
      "nodes": [
        "node_modules/resolve-url-loader/node_modules/postcss"
      ],
      "fixAvailable": {
        "name": "react-scripts",
        "version": "3.0.1",
        "isSemVerMajor": true
      }
    },
    "react-scripts": {
      "name": "react-scripts",
      "severity": "high",
      "isDirect": true,
      "via": [
        "@svgr/webpack",
        "resolve-url-loader"
      ],
      "effects": [],
      "range": ">=2.1.4",
      "nodes": [
        "node_modules/react-scripts"
      ],
      "fixAvailable": {
        "name": "react-scripts",
        "version": "3.0.1",
        "isSemVerMajor": true
      }
    },
    "resolve-url-loader": {
      "name": "resolve-url-loader",
      "severity": "moderate",
      "isDirect": false,
      "via": [
        "postcss"
      ],
      "effects": [
        "react-scripts"
      ],
      "range": "0.0.1-experiment-postcss || 3.0.0-alpha.1 - 4.0.0",
      "nodes": [
        "node_modules/resolve-url-loader"
      ],
      "fixAvailable": {
        "name": "react-scripts",
        "version": "3.0.1",
        "isSemVerMajor": true
      }
    },
    "semver": {
      "name": "semver",
      "severity": "moderate",
      "isDirect": false,
      "via": [
        {
          "source": 1094555,
          "name": "semver",
          "dependency": "semver",
          "title": "semver vulnerable to Regular Expression Denial of Service",
          "url": "https://github.com/advisories/GHSA-c2qf-rxjj-qqgw",
          "severity": "moderate",
          "cwe": [
            "CWE-1333"
          ],
          "cvss": {
            "score": 5.3,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L"
          },
          "range": ">=6.0.0 <6.3.1"
        },
        {
          "source": 1094556,
          "name": "semver",
          "dependency": "semver",
          "title": "semver vulnerable to Regular Expression Denial of Service",
          "url": "https://github.com/advisories/GHSA-c2qf-rxjj-qqgw",
          "severity": "moderate",
          "cwe": [
            "CWE-1333"
          ],
          "cvss": {
            "score": 5.3,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L"
          },
          "range": ">=7.0.0 <7.5.2"
        }
      ],
      "effects": [],
      "range": "6.0.0 - 6.3.0 || 7.0.0 - 7.5.1",
      "nodes": [
        "node_modules/@typescript-eslint/eslint-plugin/node_modules/semver",
        "node_modules/@typescript-eslint/typescript-estree/node_modules/semver",
        "node_modules/@typescript-eslint/utils/node_modules/semver",
        "node_modules/css-loader/node_modules/semver",
        "node_modules/fork-ts-checker-webpack-plugin/node_modules/semver",
        "node_modules/jest-snapshot/node_modules/semver",
        "node_modules/postcss-loader/node_modules/semver",
        "node_modules/react-scripts/node_modules/semver",
        "node_modules/semver"
      ],
      "fixAvailable": true
    },
    "svgo": {
      "name": "svgo",
      "severity": "high",
      "isDirect": false,
      "via": [
        "css-select"
      ],
      "effects": [
        "@svgr/plugin-svgo"
      ],
      "range": "1.0.0 - 1.3.2",
      "nodes": [
        "node_modules/svgo"
      ],
      "fixAvailable": {
        "name": "react-scripts",
        "version": "3.0.1",
        "isSemVerMajor": true
      }
    },
    "tough-cookie": {
      "name": "tough-cookie",
      "severity": "moderate",
      "isDirect": false,
      "via": [
        {
          "source": 1095102,
          "name": "tough-cookie",
          "dependency": "tough-cookie",
          "title": "tough-cookie Prototype Pollution vulnerability",
          "url": "https://github.com/advisories/GHSA-72xf-g2v4-qvf3",
          "severity": "moderate",
          "cwe": [
            "CWE-1321"
          ],
          "cvss": {
            "score": 6.5,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N"
          },
          "range": "<4.1.3"
        }
      ],
      "effects": [],
      "range": "<4.1.3",
      "nodes": [
        "node_modules/tough-cookie"
      ],
      "fixAvailable": true
    },
    "webpack": {
      "name": "webpack",
      "severity": "critical",
      "isDirect": false,
      "via": [
        {
          "source": 1094471,
          "name": "webpack",
          "dependency": "webpack",
          "title": "Cross-realm object access in Webpack 5",
          "url": "https://github.com/advisories/GHSA-hc6q-2mpp-qw7j",
          "severity": "critical",
          "cwe": [],
          "cvss": {
            "score": 9.8,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
          },
          "range": ">=5.0.0 <5.76.0"
        }
      ],
      "effects": [],
      "range": "5.0.0 - 5.75.0",
      "nodes": [
        "node_modules/webpack"
      ],
      "fixAvailable": true
    },
    "word-wrap": {
      "name": "word-wrap",
      "severity": "moderate",
      "isDirect": false,
      "via": [
        {
          "source": 1095091,
          "name": "word-wrap",
          "dependency": "word-wrap",
          "title": "word-wrap vulnerable to Regular Expression Denial of Service",
          "url": "https://github.com/advisories/GHSA-j8xg-fqg3-53r7",
          "severity": "moderate",
          "cwe": [
            "CWE-1333"
          ],
          "cvss": {
            "score": 5.3,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L"
          },
          "range": "<1.2.4"
        }
      ],
      "effects": [],
      "range": "<1.2.4",
      "nodes": [
        "node_modules/word-wrap"
      ],
      "fixAvailable": true
    }
  },
  "metadata": {
    "vulnerabilities": {
      "info": 0,
      "low": 0,
      "moderate": 6,
      "high": 7,
      "critical": 2,
      "total": 15
    },
    "dependencies": {
      "prod": 1566,
      "dev": 3,
      "optional": 2,
      "peer": 1,
      "peerOptional": 0,
      "total": 1571
    }
  }
}
```
