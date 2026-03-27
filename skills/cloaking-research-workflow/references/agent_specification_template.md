# Agent Specification Template

Use this template when documenting specialized agents for automated analysis (Phase 6 of workflow).

## Agent Overview

```markdown
# Agent: [Agent Name]

## Purpose
[1-2 sentence description of what the agent does and why it exists]

## Primary Objective
[Specific, measurable goal the agent achieves]

## Context of Use
[When and why this agent would be deployed]

## Success Criteria
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]
```

## Core Capabilities

Document each major capability:

```markdown
### Capability 1: [Name]
**Purpose:** [What it does]
**Inputs:** [What data it needs]
**Outputs:** [What it produces]
**Process:** [How it works]
**Error Handling:** [What happens if it fails]

### Capability 2: [Name]
[Same structure]
```

## Workflow Definition

```markdown
## Workflow: [Workflow Name]

### Phase 1: [Phase Name]
**Objective:** [What should be accomplished]
**Actions:**
1. [Action 1]
2. [Action 2]
3. [Action 3]
**Output:** [What phase produces]

### Phase 2: [Phase Name]
[Same structure]

### Phase 3: [Phase Name]
[Same structure]
```

## Data Structures

Document input and output formats:

```markdown
### Input Format
```json
{
  "field1": "type and description",
  "field2": "type and description",
  "field3": "type and description"
}
```

### Output Format
```json
{
  "result_field1": "type and description",
  "result_field2": "type and description",
  "result_field3": "type and description"
}
```
```

## External Integrations

```markdown
### Integration 1: [Tool Name]
**Purpose:** [What it's used for]
**API Endpoint:** [URL]
**Authentication:** [Method]
**Rate Limits:** [Limits if any]
**Example Request:**
```
[Example code]
```

### Integration 2: [Tool Name]
[Same structure]
```

## Error Handling & Fallbacks

```markdown
### Error Scenario 1: [Scenario]
**Cause:** [Why it happens]
**Detection:** [How to detect it]
**Recovery:** [How to recover]
**Fallback:** [Alternative approach]

### Error Scenario 2: [Scenario]
[Same structure]
```

## Performance Metrics

```markdown
### Accuracy
- [Metric 1]: [Expected value]
- [Metric 2]: [Expected value]

### Speed
- [Metric 1]: [Expected value]
- [Metric 2]: [Expected value]

### Reliability
- [Metric 1]: [Expected value]
- [Metric 2]: [Expected value]
```

## Example: URL Analysis Agent

### Agent Overview
```markdown
# Agent: URL Analysis & Cloaking Detection

## Purpose
Automatically analyze URLs to detect cloaking techniques and identify hidden money pages through multi-context testing and redirection analysis.

## Primary Objective
Discover the true destination (money page) of a URL by testing it across different contexts and analyzing the redirection chain.

## Context of Use
Deploy when analyzing suspicious Facebook Ads, investigating affiliate campaigns, or researching cloaking techniques for fraud detection.

## Success Criteria
- Successfully trace complete redirection chain (100% of cases)
- Identify cloaking when present (95%+ accuracy)
- Discover money page when it exists (90%+ accuracy)
- Complete analysis in under 5 minutes
- Provide detailed report with evidence
```

### Core Capabilities

```markdown
### Capability 1: URL Validation & Initial Access
**Purpose:** Verify URL is accessible and collect initial data
**Inputs:** URL string
**Outputs:** Initial page data (title, status code, headers)
**Process:**
1. Validate URL format
2. Check DNS resolution
3. Attempt HTTP connection
4. Capture response headers and initial content
**Error Handling:** Return error details if URL is inaccessible

### Capability 2: Multi-Context Testing
**Purpose:** Test URL with different contexts to detect context-based cloaking
**Inputs:** URL, list of contexts to test
**Outputs:** Response variations for each context
**Process:**
1. For each context (User-Agent, geo, referrer):
   - Make request with context parameters
   - Capture full response
   - Compare with baseline
2. Identify variations
3. Classify as cloaking if variations detected
**Error Handling:** Log failed contexts and continue with others

### Capability 3: Redirection Chain Analysis
**Purpose:** Follow complete chain of redirects to final destination
**Inputs:** URL
**Outputs:** Array of redirect steps with details
**Process:**
1. Start with initial URL
2. For each redirect:
   - Record URL, status code, headers
   - Identify redirect type (301, 302, meta, JS)
   - Follow redirect
   - Repeat until no more redirects
3. Return complete chain
**Error Handling:** Stop at first inaccessible URL and report chain so far

### Capability 4: Content Analysis
**Purpose:** Analyze page content to identify type and legitimacy
**Inputs:** Page HTML and metadata
**Outputs:** Content classification and risk assessment
**Process:**
1. Extract title, description, keywords
2. Analyze content type (safe page vs money page)
3. Identify offer type (iGaming, pharma, affiliate, etc.)
4. Detect fraud signals
5. Generate risk score
**Error Handling:** Return "unknown" classification if insufficient data

### Capability 5: Report Generation
**Purpose:** Create structured report of findings
**Inputs:** All analysis data
**Outputs:** Structured report JSON
**Process:**
1. Compile all findings
2. Generate summary
3. Create visualization of redirect chain
4. List detected cloaking techniques
5. Provide recommendations
**Error Handling:** Include partial data if some analysis failed
```

### Workflow: Complete URL Analysis

```markdown
## Workflow: Complete URL Analysis

### Phase 1: Initialization
**Objective:** Prepare for analysis and validate input
**Actions:**
1. Receive URL from user
2. Validate URL format
3. Check if URL is already in cache
4. Prepare analysis environment
**Output:** Validated URL and analysis context

### Phase 2: Initial Access
**Objective:** Get baseline data about the URL
**Actions:**
1. Make initial request with standard User-Agent
2. Capture response (status, headers, content)
3. Extract basic metadata
4. Take screenshot of initial page
**Output:** Initial page data and screenshot

### Phase 3: Multi-Context Testing
**Objective:** Detect context-based cloaking
**Actions:**
1. Define test contexts:
   - Desktop Chrome (US, direct referrer)
   - Mobile Safari (BR, Facebook referrer)
   - Firefox (UK, Google referrer)
   - Headless browser (US, no referrer)
2. Test each context
3. Compare responses
4. Identify variations
**Output:** Context variations and cloaking indicators

### Phase 4: Redirection Analysis
**Objective:** Trace complete redirect chain
**Actions:**
1. Follow all redirects from initial URL
2. Record each step (URL, status, type)
3. Capture content at each step
4. Identify redirect patterns
5. Detect redirect loops or suspicious patterns
**Output:** Complete redirect chain with details

### Phase 5: Content Analysis
**Objective:** Analyze final page content
**Actions:**
1. Extract and analyze page content
2. Identify page type (safe vs money page)
3. Classify offer type
4. Detect fraud signals
5. Generate risk assessment
**Output:** Content analysis and risk score

### Phase 6: Report Generation
**Objective:** Create comprehensive report
**Actions:**
1. Compile all findings
2. Generate summary
3. Create redirect chain visualization
4. List detected techniques
5. Provide recommendations
6. Post to Airtable
**Output:** Structured report and Airtable record
```

### Data Structures

```markdown
### Input Format
```json
{
  "url": "https://example.com/ad",
  "analysis_depth": "quick|standard|deep",
  "contexts_to_test": ["desktop_us", "mobile_br", "firefox_uk"],
  "save_screenshots": true,
  "post_to_airtable": true
}
```

### Output Format
```json
{
  "id": "unique_analysis_id",
  "url_initial": "https://example.com/ad",
  "url_final": "https://casino.example.com/landing",
  "cloaking_detected": true,
  "cloaking_confidence": 0.95,
  "redirect_chain": [
    {
      "step": 1,
      "url": "https://example.com/ad",
      "status_code": 200,
      "redirect_type": "initial",
      "title": "E-Sports Guide"
    },
    {
      "step": 2,
      "url": "https://redirect.example.com/track",
      "status_code": 302,
      "redirect_type": "302",
      "title": "Redirecting..."
    },
    {
      "step": 3,
      "url": "https://casino.example.com/landing",
      "status_code": 200,
      "redirect_type": "final",
      "title": "Play Now - Win Big!"
    }
  ],
  "content_analysis": {
    "page_type": "money_page",
    "offer_type": "igaming",
    "risk_level": "high",
    "fraud_signals": [
      "Violates platform policies",
      "Excessive bonuses",
      "Unclear terms"
    ]
  },
  "cloaking_techniques": [
    "User-Agent detection",
    "IP filtering",
    "JavaScript redirection"
  ],
  "recommendations": [
    "Report to Meta for policy violation",
    "Block domain",
    "Monitor account for suspicious activity"
  ],
  "airtable_record_id": "rec123456789",
  "timestamp": "2026-02-11T15:30:00Z"
}
```
```

### External Integrations

```markdown
### Integration 1: URLScan.io
**Purpose:** Get professional URL analysis and screenshots
**API Endpoint:** https://urlscan.io/api/v1/scan
**Authentication:** API key in header
**Rate Limits:** 100 requests/day free tier
**Example Request:**
```bash
curl -X POST https://urlscan.io/api/v1/scan \
  -H "API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "visibility": "public"}'
```

### Integration 2: Airtable
**Purpose:** Store analysis results in database
**API Endpoint:** https://api.airtable.com/v0/{baseId}/{tableId}
**Authentication:** Bearer token
**Rate Limits:** 5 requests/second
**Example Request:**
```bash
curl -X POST https://api.airtable.com/v0/appXXXXXXXXXXXXXX/tblXXXXXXXXXXXXXX \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"records": [{"fields": {...}}]}'
```
```

### Error Handling & Fallbacks

```markdown
### Error Scenario 1: URL Inaccessible
**Cause:** Domain doesn't exist, server down, or blocked
**Detection:** Connection timeout or 4xx/5xx response
**Recovery:** Attempt with different DNS, try cached version
**Fallback:** Report as inaccessible, provide last known data if available

### Error Scenario 2: Redirect Loop
**Cause:** URL redirects back to itself
**Detection:** Same URL appears twice in chain
**Recovery:** Stop following redirects, report loop
**Fallback:** Return chain up to loop point

### Error Scenario 3: JavaScript Redirection Not Executed
**Cause:** Headless browser can't execute JavaScript
**Detection:** Expected redirect doesn't occur
**Recovery:** Try with browser simulation, check HTML for redirect code
**Fallback:** Report as potential JavaScript redirection
```

---

## Using This Template

1. **Copy this template** for each new agent you're documenting
2. **Fill in sections** specific to your agent
3. **Include examples** that show real usage
4. **Test workflows** before documenting them
5. **Update regularly** as agent capabilities evolve
6. **Include error cases** that you've encountered
7. **Document integrations** with external tools
8. **Provide sample data** for inputs and outputs

This template ensures your agent documentation is complete, clear, and actionable for future implementations.
