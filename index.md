---
layout: default
---
{% assign profile = site.data.profile %}
{% assign homepage = site.data.homepage %}

<section class="section hero-section" aria-labelledby="hero-heading">
  <div class="hero-layout">
    <div class="hero-copy">
      <div class="hero-identity">
        <img src="{{ '/assets/img/profile.jpg' | relative_url }}" alt="Portrait of Nina Suico" class="avatar" width="72" height="72" />
        <p><strong>Nina Suico</strong><span>{{ profile.role }}</span></p>
      </div>
      <p class="eyebrow">{{ profile.role }}</p>
      <h1 id="hero-heading">{{ profile.value_proposition }}</h1>
      <p class="lead">{{ profile.supporting_statement }}</p>
      <p>{{ profile.market_context }}</p>
      <p class="muted">{{ profile.location_label }} · {{ profile.mobility_label }} · {{ profile.availability_label }}</p>
      <div class="btn-row">
        <a class="btn" href="{{ '/work/' | relative_url }}">View selected work</a>
        <a class="btn btn-ghost" href="{{ profile.contact.resume | relative_url }}" target="_blank" rel="noopener">View résumé (PDF)</a>
      </div>
    </div>
    {% include systems-map.html %}
  </div>
</section>

<section class="section" aria-labelledby="problems-heading">
  <div class="section-intro"><p class="eyebrow">01 · Diagnose</p><h2 id="problems-heading" class="section-title">{{ homepage.problems_heading }}</h2></div>
  <ul class="problem-grid">
    {% for problem in homepage.problems %}<li class="problem-module glass-surface"><span aria-hidden="true">0{{ forloop.index }}</span><p>{{ problem }}</p></li>{% endfor %}
  </ul>
</section>

<section class="section" aria-labelledby="capabilities-heading">
  <div class="section-intro"><p class="eyebrow">02 · Structure</p><h2 id="capabilities-heading" class="section-title">Three Capability Pillars</h2></div>
  <div class="grid grid-3">
    {% for capability in site.data.capabilities %}
      {% include capability-card.html capability=capability index=forloop.index %}
    {% endfor %}
  </div>
</section>

<section class="section" aria-labelledby="work-heading">
  <div class="section-heading-row">
    <div class="section-intro"><p class="eyebrow">03 · Evidence</p><h2 id="work-heading" class="section-title">Selected Work</h2></div>
    <a class="text-link" href="{{ '/work/' | relative_url }}">View all work</a>
  </div>
  {% include work-grid.html featured_only=true case_studies_only=true %}
</section>

<section class="section" aria-labelledby="approach-heading">
  <div class="section-intro"><p class="eyebrow">04 · Method</p><h2 id="approach-heading" class="section-title">{{ homepage.how_i_work_heading }}</h2></div>
  <ol class="method-sequence">
    {% for item in homepage.how_i_work %}
      <li class="method-step glass-surface">
        <span class="method-index" aria-hidden="true">0{{ forloop.index }}</span>
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </li>
    {% endfor %}
  </ol>
</section>

<section class="section" aria-labelledby="about-heading">
  <div class="narrative-panel glass-surface">
    <p class="eyebrow">05 · Context</p>
    <h2 id="about-heading">{{ homepage.about_heading }}</h2>
    <p>{{ homepage.about_summary }}</p>
    <a class="text-link" href="{{ '/about/' | relative_url }}">Read the professional narrative</a>
  </div>
</section>

<section class="section" aria-labelledby="credentials-heading">
  <div class="section-intro"><p class="eyebrow">06 · Development</p><h2 id="credentials-heading" class="section-title">Credentials</h2></div>
  <div>
    <ul class="credential-list credential-grid">
      {% for credential in site.data.credentials %}
        {% include credential-item.html credential=credential %}
      {% endfor %}
    </ul>
  </div>
</section>

{% assign contact_cta = site.data.ctas.items | where: 'id', 'contact' | first %}
{% include cta-block.html cta=contact_cta %}
