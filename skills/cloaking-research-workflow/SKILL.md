---
name: cloaking-research-workflow
description: Comprehensive research workflow for analyzing Facebook Ads cloaking techniques, detecting hidden money pages, and generating interactive documentation. Use when researching cloaking methods, analyzing specific tools like The White Rabbit, creating educational content about ad fraud detection, or building anti-fraud systems.
---

# Cloaking Research Workflow

## Overview

This skill enables comprehensive research into Facebook Ads cloaking techniques, including detection methods, tool analysis, and creation of interactive educational documentation. It combines multi-source research (YouTube, Reddit, X, forums), technical analysis, and web-based visualization of findings.

The workflow transforms raw research into structured knowledge: collecting data from diverse sources → organizing findings → building interactive web documentation → creating specialized agents for detection.

## Workflow Decision Tree

**Choose your path based on your goal:**

1. **Research & Documentation** → Use the full 6-phase workflow to research a topic and create an interactive website
2. **Quick Tool Analysis** → Use Phase 2-3 to analyze specific tools (The White Rabbit, competitors, etc.)
3. **Agent Development** → Use Phase 4-5 to create specialized detection agents
4. **Website Only** → Use Phase 5-6 if you already have structured research data

## Phase 1: Research Planning & Scoping

**Objective:** Define research boundaries and identify information sources.

**Actions:**
- Define primary topic and subtopics (e.g., "cloaking techniques," "The White Rabbit features," "detection methods")
- Identify target sources:
  - **YouTube:** Tutorials, case studies, tool demonstrations
  - **Reddit:** r/FacebookAds, r/adwords, r/blackhat, r/Affiliatemarketing
  - **Forums:** BlackHatWorld, affLIFT, specialized marketing communities
  - **X/Twitter:** Real-time discussions, announcements, user experiences
  - **Official websites:** Tool documentation, pricing pages, feature comparisons
  - **Technical blogs:** In-depth analysis, technical breakdowns

**Output:** Research scope document with 5-10 key search queries

**Example queries:**
```
- "The White Rabbit cloaking Facebook ads 2026"
- "how to detect cloaked affiliate links"
- "Facebook ads spy tools comparison"
- "bypass ad moderation techniques"
- "cloaking detection methods tutorial"
```

## Phase 2: Multi-Source Research Execution

**Objective:** Gather comprehensive information from diverse sources.

**Search Strategy:**

1. **General Web Search** → Broad overview and recent articles
   - Use `search` tool with `info` type for general queries
   - Identify key tools, techniques, and terminology

2. **YouTube Research** → Video tutorials and demonstrations
   - Search for tutorials, case studies, tool reviews
   - Extract key information from video summaries
   - Document timestamps for important sections

3. **Reddit Deep Dive** → Community discussions and real experiences
   - Search r/FacebookAds, r/adwords, r/blackhat for specific discussions
   - Use `browser` tool to read full threads
   - Document user experiences and technical details

4. **Forum Analysis** → Specialized communities
   - BlackHatWorld, affLIFT for affiliate marketing insights
   - Document techniques, tools, and community consensus

5. **X/Twitter Search** → Real-time discussions
   - Search for recent announcements and discussions
   - Identify trending topics and emerging techniques

**Output:** Structured research notes with 50-100 key findings organized by category

## Phase 3: URL Analysis & Content Extraction

**Objective:** Extract detailed information from key resources.

**Process:**

1. **Browser Navigation** → Access and analyze important URLs
   - Use `browser` tool with `informational` intent
   - Focus on specific sections (features, pricing, case studies)
   - Extract key data points

2. **Content Extraction** → Capture important information
   - Tool features and capabilities
   - Pricing models and comparison data
   - Technical specifications
   - User testimonials and case studies

3. **Data Organization** → Structure findings
   - Create comparison tables
   - Document feature matrices
   - Organize by tool, technique, or category

**Output:** Detailed analysis file with structured data (markdown tables, JSON, or structured text)

## Phase 4: Data Organization & Structuring

**Objective:** Transform raw research into organized, queryable knowledge.

**Actions:**

1. **Categorization** → Organize findings by theme
   - Tools & Platforms (The White Rabbit, Cloaking.House, etc.)
   - Techniques (User-Agent detection, IP filtering, JavaScript redirection, etc.)
   - Detection Methods (URLScan, AdPlexity, manual testing, etc.)
   - Case Studies & Examples

2. **Deduplication** → Remove redundant information
   - Merge similar findings
   - Keep most authoritative sources
   - Consolidate overlapping data

3. **Enrichment** → Add context and relationships
   - Link related tools and techniques
   - Add comparative analysis
   - Include practical examples

4. **Validation** → Verify accuracy
   - Cross-reference multiple sources
   - Flag uncertain information
   - Note conflicting data

**Output:** Structured research document (markdown) with clear sections and cross-references

## Phase 5: Web Documentation Creation

**Objective:** Build interactive, visually engaging website from research.

**Process:**

1. **Design Selection** → Choose visual approach
   - Cyberpunk Brutalism (technical, underground aesthetic)
   - Swiss Modernism (clean, data-focused)
   - Neo-Memphis (playful, engaging)
   - Or custom design based on content

2. **Asset Generation** → Create visual elements
   - Generate hero images (cyberpunk matrix, network visualization, etc.)
   - Create comparison graphics
   - Design icons and visual elements
   - Use `generate` tool for high-quality custom images

3. **Website Development** → Build interactive site
   - Initialize web project with `webdev_init_project`
   - Configure design tokens and typography
   - Create navigation and page structure
   - Implement content sections with data visualizations
   - Add interactive elements (tables, comparisons, filters)

4. **Content Integration** → Populate with research
   - Organize research into logical sections
   - Create comparison tables and matrices
   - Add practical examples and case studies
   - Include resource links and references

5. **Deployment** → Make accessible
   - Save checkpoint with `webdev_save_checkpoint`
   - Generate public URL
   - Test all interactive elements

**Output:** Live interactive website with research findings

## Phase 6: Agent Development (Optional)

**Objective:** Create specialized agents for automated analysis.

**Capabilities to Document:**

1. **URL Analysis Agent**
   - Rastrear redirecionamentos completos
   - Detect cloaking patterns
   - Identify money pages

2. **Context Simulation Agent**
   - Test múltiplos User-Agents
   - Simulate different geolocations
   - Vary referrer sources

3. **Detection Agent**
   - Identify cloaking techniques
   - Classify threat level
   - Generate reports

4. **Integration Agent**
   - Connect with external tools (URLScan, AdPlexity)
   - Post results to Airtable
   - Generate structured output

**Output:** `agent.md` document with agent specifications and workflows

## Tools & Integrations

### Research Tools
- **search** - Multi-source research (info, news, api types)
- **browser** - Access and analyze URLs
- **match** - Find specific content with grep/glob

### Documentation Tools
- **file** - Create and organize research documents
- **generate** - Create custom images and visual assets
- **webdev_init_project** - Initialize web projects
- **webdev_save_checkpoint** - Save and deploy websites

### Integration Capabilities
- **Airtable API** - Store and organize research results
- **URLScan.io** - Analyze URLs and capture screenshots
- **External APIs** - Connect with detection tools

## Key Patterns & Best Practices

### Research Quality
- **Multi-source verification** - Confirm findings across 2-3 sources
- **Authority weighting** - Prioritize official sources and expert analysis
- **Timestamp documentation** - Note when information was gathered
- **Source attribution** - Always link back to original sources

### Organization
- **Hierarchical structure** - Use clear heading hierarchy
- **Cross-references** - Link related concepts
- **Comparison tables** - Make differences clear and scannable
- **Practical examples** - Include real-world use cases

### Web Documentation
- **Progressive disclosure** - Show overview first, details on demand
- **Visual hierarchy** - Use size, color, and spacing to guide attention
- **Interactive elements** - Enable exploration and filtering
- **Responsive design** - Work on all device sizes

### Agent Development
- **Clear workflows** - Document step-by-step processes
- **Error handling** - Plan for failures and edge cases
- **Integration points** - Specify external tool connections
- **Output formats** - Define expected results structure

## Example Workflow: Analyzing The White Rabbit

**Scenario:** Research The White Rabbit cloaking tool for educational content

**Phase 1 - Planning:**
- Define scope: Tool features, pricing, capabilities, comparison with competitors
- Identify sources: Official website, YouTube tutorials, Reddit discussions, forums

**Phase 2 - Research:**
- Search "The White Rabbit cloaking tool 2026" → Find official site and pricing
- Search YouTube for tutorials → Extract feature demonstrations
- Search Reddit for user experiences → Document pros/cons
- Search forums for technical details → Understand implementation

**Phase 3 - Analysis:**
- Visit thewhiterabbit.app → Extract features, pricing tiers, supported platforms
- Analyze competitor tools → Create comparison matrix
- Review user feedback → Document common use cases and limitations

**Phase 4 - Organization:**
- Create sections: Overview, Features, Pricing, Comparison, Detection Methods
- Build comparison tables: The White Rabbit vs Cloaking.House vs Adspect
- Document technical capabilities: 15+ detection signals, 17+ traffic sources

**Phase 5 - Website:**
- Design: Cyberpunk Brutalism (neon cyan/orange, monospaced fonts)
- Create hero section with matrix visualization
- Build comparison tables and feature matrices
- Add case studies and practical examples
- Deploy interactive website

**Phase 6 - Agent (Optional):**
- Document detection agent capabilities
- Specify integration with URLScan and AdPlexity
- Define Airtable schema for results
- Create workflow for automated analysis

## Appendix A: Known Cloaker Signatures

### The White Rabbit (TWR)
**Confirmed Signatures:**
- `twrclid`: Unique click ID generated by TWR (The White Rabbit Click ID). Do not confuse with Twitter.
- `tok`: Security token validating the session.
- **Behavior:** Redirects "unwanted" traffic (bots, reviewers, competitors) to a safe "white page" while showing the "money page" to qualified users.

**Detection Logic:**
1.  **URL Inspection:** Look for `twrclid=` and `tok=` parameters in the final URL or redirect chain.
2.  **Referrer Validation:** TWR heavily relies on valid referrers (e.g., `facebook.com`, `instagram.com`). Direct access often triggers the white page.
3.  **User-Agent Filtering:** Blocks non-residential IPs and data center User-Agents.
4.  **Technology Stack:** Often associated with "safe" platforms like Shopify or WordPress for the white page, while the money page is a custom optimized landing page.

**Risk Level:** Critical (Professional Cloaking Tool)

## References

See `references/` directory for:
- **research_sources.md** - Comprehensive list of research sources and search strategies
- **tool_comparison_template.md** - Template for comparing tools and platforms
- **agent_specification_template.md** - Template for documenting agent capabilities

## Scripts

See `scripts/` directory for:
- **research_aggregator.py** - Combine multiple research files into unified document
- **website_generator.py** - Convert research markdown to web-ready format
- **airtable_uploader.py** - Post research results to Airtable

## Templates

See `templates/` directory for:
- **website_structure.html** - Basic structure for research website
- **comparison_table_template.html** - Reusable comparison table component
- **agent_workflow_diagram.md** - Mermaid diagram templates for agent workflows

---

**Skill Version:** 1.0  
**Last Updated:** 2026-02-11  
**Use Cases:** Educational research, fraud detection, competitive analysis, TCC/academic projects
