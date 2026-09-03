---
layout: page
title: "About"
description: "Professional narrative, operating contexts, capabilities, credentials, and working style."
permalink: /about/
---
{% assign profile = site.data.profile %}

<section aria-labelledby="narrative-heading">
  <h2 id="narrative-heading">Professional narrative</h2>
  {% for paragraph in profile.professional_narrative %}<p>{{ paragraph }}</p>{% endfor %}
  <p>{{ profile.market_context }} Current market context includes {{ profile.markets | join: ', ' }}.</p>
  <p class="muted">{{ profile.location_label }} · {{ profile.mobility_label }} · {{ profile.availability_label }}</p>
</section>

{% if profile.career_progression and profile.career_progression.size > 0 %}
<section aria-labelledby="career-heading">
  <h2 id="career-heading">Career progression</h2>
  <ol>{% for item in profile.career_progression %}<li>{{ item }}</li>{% endfor %}</ol>
</section>
{% endif %}

<section aria-labelledby="development-heading">
  <h2 id="development-heading">Capability development</h2>
  <div class="grid grid-3">
    {% for capability in site.data.capabilities %}
      {% include capability-card.html capability=capability %}
    {% endfor %}
  </div>
</section>

<section class="split-sections">
  <div>
    <h2>Industries and operating contexts</h2>
    <ul>{% for industry in profile.industries %}<li>{{ industry }}</li>{% endfor %}</ul>
  </div>
  <div>
    <h2>Working style</h2>
    <ul>{% for item in profile.working_style %}<li>{{ item }}</li>{% endfor %}</ul>
  </div>
</section>

<section aria-labelledby="about-credentials-heading">
  <h2 id="about-credentials-heading">Credentials</h2>
  <ul class="credential-list">
    {% for credential in site.data.credentials %}
      {% include credential-item.html credential=credential %}
    {% endfor %}
  </ul>
  <p><a class="btn btn-ghost" href="{{ profile.contact.resume | relative_url }}" target="_blank" rel="noopener">View résumé (PDF)</a></p>
</section>
