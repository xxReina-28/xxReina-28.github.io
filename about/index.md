---
layout: page
title: "About"
description: "Professional narrative, operating contexts, capabilities, credentials, and working style."
permalink: /about/
---
{% assign profile = site.data.profile %}

<section class="about-intro" aria-labelledby="narrative-heading">
  <p class="eyebrow">Business Operations &amp; Systems Analyst</p>
  <h2 id="narrative-heading">Professional introduction</h2>
  {% for paragraph in profile.professional_narrative %}<p>{{ paragraph }}</p>{% endfor %}
  <p>{{ profile.market_context }} Current market context includes {{ profile.markets | join: ', ' }}.</p>
  <p class="muted">{{ profile.location_label }} · {{ profile.mobility_label }} · {{ profile.availability_label }}</p>
</section>

{% if profile.career_progression and profile.career_progression.size > 0 %}
<section class="about-section career-section" aria-labelledby="career-heading">
  <h2 id="career-heading">Career progression</h2>
  <p>The chronology includes concurrent, contract, and supplementary work. Overlaps are labeled where the source supports that context.</p>
  {% include career-progression.html %}
</section>
{% endif %}

<section class="about-section" aria-labelledby="development-heading">
  <h2 id="development-heading">Cross-functional capability development</h2>
  <p>Each chapter added another view of the same operating system: customer needs, administrative execution, commercial flow, delivery coordination, reporting, and management decisions.</p>
</section>

<section class="about-section context-section" aria-labelledby="contexts-heading">
  <h2 id="contexts-heading">Industries and operating contexts</h2>
  <ul>{% for industry in profile.industries %}<li>{{ industry }}</li>{% endfor %}</ul>
</section>

<section class="about-section" aria-labelledby="pillars-heading">
  <h2 id="pillars-heading">How the experience connects to the three capability pillars</h2>
  <div class="grid grid-3">
    {% for capability in site.data.capabilities %}
      {% if capability.status == 'approved' %}
        <article class="card glass-surface capability-basis capability-card--{{ capability.id }}">
          <h3>{{ capability.title }}</h3>
          <p>{{ capability.career_basis }}</p>
        </article>
      {% endif %}
    {% endfor %}
  </div>
</section>

<section class="about-section" aria-labelledby="about-credentials-heading">
  <h2 id="about-credentials-heading">Credentials</h2>
  <ul class="credential-list credential-grid">
    {% for credential in site.data.credentials %}
      {% include credential-item.html credential=credential %}
    {% endfor %}
  </ul>
</section>

<section class="about-section split-panel glass-surface" aria-labelledby="working-style-heading">
  <h2 id="working-style-heading">Working style</h2>
  <ul>{% for item in profile.working_style %}<li>{{ item }}</li>{% endfor %}</ul>
</section>

<section class="about-section action-panel" aria-labelledby="about-actions-heading">
  <h2 id="about-actions-heading">Résumé and contact</h2>
  <div class="btn-row">
    <a class="btn" href="{{ profile.contact.resume | relative_url }}" target="_blank" rel="noopener">View résumé (PDF)</a>
    <a class="btn btn-ghost" href="{{ '/contact/' | relative_url }}">Contact Nina</a>
  </div>
</section>
